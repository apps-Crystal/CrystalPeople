import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, cachedReadSheet, appendRowByFields, updateRowWhere,
  getNextSeq, generateId, invalidateCache,
} from "@/lib/sheets";
import {
  parseConfigRows, getScoreDimensions, isWindowOpen, safeJsonParse,
} from "@/lib/utils";
import type { Employee, Goal, Task, ReviewCycle } from "@/lib/types";

// ─── GET /api/monthly/self-score ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);
  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month") ?? String(config.current_month);
  const year = searchParams.get("year") ?? String(config.current_year);

  const [employees, goals, tasks, cycles] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    readSheet("Goals") as unknown as Promise<Goal[]>,
    readSheet("Tasks") as unknown as Promise<Task[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  const employee = (employees as Employee[]).find(e => e.Employee_ID === session.userId);
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const myGoals = (goals as Goal[]).filter(
    g => g.Employee_ID === session.userId && g.Month === month && g.Year === year
  );
  const myTasks = (tasks as Task[]).filter(t => t.Employee_ID === session.userId);

  const dimensions = getScoreDimensions(employee, myGoals, myTasks);

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

  const windowOpen = isWindowOpen("employee", config);

  return NextResponse.json({ cycle, dimensions, windowOpen, config });
}

// ─── POST /api/monthly/self-score ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  // Window check
  if (!isWindowOpen("employee", config)) {
    return NextResponse.json({ error: "Self-scoring window is currently closed" }, { status: 400 });
  }

  const body = await req.json();
  const { scores, comments } = body as { scores: Record<string, number>; comments: string };

  if (!comments || comments.trim().length < 20) {
    return NextResponse.json({ error: "Comments must be at least 20 characters" }, { status: 400 });
  }

  const month = String(config.current_month);
  const year = String(config.current_year);

  // Validate all dimensions present
  const [employees, goals, tasks] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    readSheet("Goals") as unknown as Promise<Goal[]>,
    readSheet("Tasks") as unknown as Promise<Task[]>,
  ]);

  const employee = (employees as Employee[]).find(e => e.Employee_ID === session.userId);
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const myGoals = (goals as Goal[]).filter(
    g => g.Employee_ID === session.userId && g.Month === month && g.Year === year
  );
  const myTasks = (tasks as Task[]).filter(t => t.Employee_ID === session.userId);

  const dimensions = getScoreDimensions(employee, myGoals, myTasks);

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
    // Create new cycle
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
    // Update existing pending cycle
    await updateRowWhere("Review_Cycles", "Cycle_ID", existing.Cycle_ID, {
      Self_Scores: scoresJson,
      Self_Comments: comments.trim(),
      Status: "self_scored",
    });
    cycle = { ...existing, Self_Scores: scoresJson, Self_Comments: comments.trim(), Status: "self_scored" };
  }

  invalidateCache("Review_Cycles");

  // Update individual goal Self_Score fields
  for (const dim of dimensions) {
    if (dim.type === "goal" && scores[dim.key] !== undefined) {
      await updateRowWhere("Goals", "Goal_ID", dim.key, {
        Self_Score: String(scores[dim.key]),
      });
    } else if (dim.type === "task" && scores[dim.key] !== undefined) {
      // Update task Monthly_Scores JSON
      const taskRow = myTasks.find(t => t.Task_ID === dim.key);
      if (taskRow) {
        const monthlyScores = safeJsonParse<Array<{
          month: number; year: number; self_score: number; manager_score: number;
        }>>(taskRow.Monthly_Scores, []);

        const idx = monthlyScores.findIndex(
          ms => ms.month === config.current_month && ms.year === config.current_year
        );
        if (idx >= 0) {
          monthlyScores[idx].self_score = scores[dim.key];
        } else {
          monthlyScores.push({
            month: config.current_month,
            year: config.current_year,
            self_score: scores[dim.key],
            manager_score: 0,
          });
        }
        await updateRowWhere("Tasks", "Task_ID", dim.key, {
          Monthly_Scores: JSON.stringify(monthlyScores),
          Updated_At: new Date().toISOString(),
        });
      }
    }
  }

  invalidateCache("Goals");
  invalidateCache("Tasks");

  return NextResponse.json({ cycle });
}
