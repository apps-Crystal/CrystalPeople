import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, cachedReadSheet, appendRowByFields, updateRowWhere,
  getNextSeq, generateId, invalidateCache,
} from "@/lib/sheets";
import {
  parseConfigRows, getScoreDimensionsFromAssignments,
  isSelfScoreWindowOpen, safeJsonParse, monthLabel,
} from "@/lib/utils";
import type { Assignment, ReviewCycle } from "@/lib/types";

// ─── GET /api/monthly/self-score ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month") ?? String(config.current_month);
  const year = searchParams.get("year") ?? String(config.current_year);

  const [assignments, cycles] = await Promise.all([
    cachedReadSheet("Assignments") as unknown as Promise<Assignment[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  // Assignments for this employee and month/year
  const myAssignments = (assignments as Assignment[]).filter(
    a => a.Employee_ID === session.userId && a.Month === month && a.Year === year
  );

  const dimensions = getScoreDimensionsFromAssignments(myAssignments);

  const cycle = (cycles as ReviewCycle[]).find(
    c => c.Employee_ID === session.userId && c.Month === month && c.Year === year
  ) ?? null;

  // Populate existing self-scores into dimensions
  if (cycle?.Self_Scores) {
    const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
    dimensions.forEach(d => {
      if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
    });
  }

  const windowInfo = isSelfScoreWindowOpen(config);

  // History: all past Review_Cycles for this employee, excluding current month
  const allMyCycles = (cycles as ReviewCycle[])
    .filter(c =>
      c.Employee_ID === session.userId &&
      !(c.Month === month && c.Year === year)
    )
    .sort((a, b) => {
      const aDate = parseInt(a.Year) * 100 + parseInt(a.Month);
      const bDate = parseInt(b.Year) * 100 + parseInt(b.Month);
      return bDate - aDate;
    });

  return NextResponse.json({
    cycle,
    dimensions,
    windowOpen: windowInfo.open,
    opensOnDay: windowInfo.opensOnDay,
    lastDay: windowInfo.lastDay,
    config,
    assignments: myAssignments,
    history: allMyCycles,
  });
}

// ─── POST /api/monthly/self-score ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  // Last-week-of-month window check
  const windowInfo = isSelfScoreWindowOpen(config);
  if (!windowInfo.open) {
    return NextResponse.json({
      error: `Self-scoring opens on day ${windowInfo.opensOnDay} of ${monthLabel(config.current_month, config.current_year)}`,
    }, { status: 400 });
  }

  const body = await req.json();
  const { scores, comments } = body as { scores: Record<string, number>; comments: string };

  if (!comments || comments.trim().length < 20) {
    return NextResponse.json({ error: "Comments must be at least 20 characters" }, { status: 400 });
  }

  const month = String(config.current_month);
  const year = String(config.current_year);

  const assignments = await cachedReadSheet("Assignments") as unknown as Assignment[];
  const myAssignments = (assignments as Assignment[]).filter(
    a => a.Employee_ID === session.userId && a.Month === month && a.Year === year
  );

  const dimensions = getScoreDimensionsFromAssignments(myAssignments);

  for (const dim of dimensions) {
    const score = scores[dim.key];
    if (score === undefined || score === null) {
      return NextResponse.json({ error: `Score missing for: ${dim.label}` }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: `Score for ${dim.label} must be between 1 and 5` }, { status: 400 });
    }
  }

  const cycles = await readSheet("Review_Cycles") as unknown as ReviewCycle[];
  const existing = cycles.find(
    c => c.Employee_ID === session.userId && c.Month === month && c.Year === year
  );

  if (existing && existing.Status !== "pending") {
    return NextResponse.json({ error: "Already self-scored for this month" }, { status: 400 });
  }

  const scoresJson = JSON.stringify(scores);
  let cycle: ReviewCycle;

  if (!existing) {
    const seq = await getNextSeq("Review_Cycles");
    const cycleId = generateId("CYC", seq);
    const newCycle: Record<string, string> = {
      Cycle_ID: cycleId,
      Employee_ID: session.userId,
      Month: month,
      Year: year,
      Self_Scores: scoresJson,
      Manager_Scores: "",
      Self_Comments: comments.trim(),
      Manager_Comments: "",
      Review_Notes: "",
      Next_Month_Focus: "",
      Status: "self_scored",
      Acknowledged_At: "",
      Flagged_Dimensions: "",
      AI_Note_Flag: "FALSE",
      Locked_Average: "",
    };
    await appendRowByFields("Review_Cycles", newCycle);
    cycle = newCycle as unknown as ReviewCycle;
  } else {
    await updateRowWhere("Review_Cycles", "Cycle_ID", existing.Cycle_ID, {
      Self_Scores: scoresJson,
      Self_Comments: comments.trim(),
      Status: "self_scored",
    });
    cycle = { ...existing, Self_Scores: scoresJson, Self_Comments: comments.trim(), Status: "self_scored" };
  }

  invalidateCache("Review_Cycles");

  // Update individual Assignment.Self_Score fields
  for (const dim of dimensions) {
    if (dim.type !== "behaviour" && scores[dim.key] !== undefined) {
      await updateRowWhere("Assignments", "Assignment_ID", dim.key, {
        Self_Score: String(scores[dim.key]),
      });
    }
  }
  invalidateCache("Assignments");

  return NextResponse.json({ cycle });
}
