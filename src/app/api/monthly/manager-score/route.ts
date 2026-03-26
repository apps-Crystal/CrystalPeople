import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, cachedReadSheet, updateRowWhere, invalidateCache,
} from "@/lib/sheets";
import {
  parseConfigRows, getScoreDimensionsFromAssignments,
  getManagerScoreWindow, computeAverage, safeJsonParse, monthLabel,
} from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import type { Employee, Assignment, ReviewCycle } from "@/lib/types";

// ─── POST /api/monthly/manager-score ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden: employees cannot score team members" }, { status: 403 });
  }

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  // First-7-days-of-next-month window check
  const scoreWindow = getManagerScoreWindow(config);
  if (!scoreWindow.open) {
    const nextMonthLabel = monthLabel(scoreWindow.opensNextMonth, scoreWindow.opensNextYear);
    return NextResponse.json({
      error: `Manager scoring opens on the 1st of ${nextMonthLabel}`,
    }, { status: 400 });
  }

  const body = await req.json();
  const { employee_id, scores, comments, review_notes, next_month_focus, ai_note_flagged } = body as {
    employee_id: string;
    scores: Record<string, number>;
    comments: string;
    review_notes: string;
    next_month_focus: string;
    ai_note_flagged?: boolean;
  };

  if (!employee_id) return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  if (!comments || comments.trim().length < 20) {
    return NextResponse.json({ error: "Comments must be at least 20 characters" }, { status: 400 });
  }

  const scoreMonth = String(scoreWindow.scoreMonth);
  const scoreYear = String(scoreWindow.scoreYear);

  const [employees, assignments, cycles] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Assignments") as unknown as Promise<Assignment[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  const employee = (employees as Employee[]).find(e => e.Employee_ID === employee_id);
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  if (session.role === "manager" && employee.Manager_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: not your direct report" }, { status: 403 });
  }

  // Employee must have self-scored first
  const cycle = (cycles as ReviewCycle[]).find(
    c => c.Employee_ID === employee_id && c.Month === scoreMonth && c.Year === scoreYear
  );
  if (!cycle || cycle.Status !== "self_scored") {
    return NextResponse.json({ error: "Employee must complete self-assessment first" }, { status: 400 });
  }

  // Get score dimensions from assignments for that month
  const empAssignments = (assignments as Assignment[]).filter(
    a => a.Employee_ID === employee_id && a.Month === scoreMonth && a.Year === scoreYear
  );
  const dimensions = getScoreDimensionsFromAssignments(empAssignments);

  for (const dim of dimensions) {
    const score = scores[dim.key];
    if (score === undefined || score === null) {
      return NextResponse.json({ error: `Score missing for: ${dim.label}` }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: `Score for ${dim.label} must be between 1 and 5` }, { status: 400 });
    }
  }

  // Compute flagged dimensions (gap > 1)
  const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
  const flaggedDimensions = dimensions
    .filter(d => {
      const self = selfScores[d.key];
      const mgr = scores[d.key];
      return self !== undefined && mgr !== undefined && Math.abs(self - mgr) > 1;
    })
    .map(d => d.key);

  const lockedAverage = computeAverage(Object.values(scores));
  const scoresJson = JSON.stringify(scores);

  await updateRowWhere("Review_Cycles", "Cycle_ID", cycle.Cycle_ID, {
    Manager_Scores: scoresJson,
    Manager_Comments: comments.trim(),
    Review_Notes: (review_notes ?? "").trim(),
    Next_Month_Focus: (next_month_focus ?? "").trim(),
    Status: "manager_scored",
    Flagged_Dimensions: JSON.stringify(flaggedDimensions),
    Locked_Average: String(lockedAverage),
    AI_Note_Flag: ai_note_flagged ? "TRUE" : "FALSE",
  });

  invalidateCache("Review_Cycles");

  // Update Assignment.Manager_Score fields
  for (const dim of dimensions) {
    if (dim.type !== "behaviour" && scores[dim.key] !== undefined) {
      await updateRowWhere("Assignments", "Assignment_ID", dim.key, {
        Manager_Score: String(scores[dim.key]),
      });
    }
  }
  invalidateCache("Assignments");

  // Notify the employee
  const label = monthLabel(scoreWindow.scoreMonth, scoreWindow.scoreYear);
  void createNotification(
    employee_id,
    "manual",
    `Your manager has completed your ${label} review. Please acknowledge it in My Review.`
  );

  return NextResponse.json({ cycle: { ...cycle, Manager_Scores: scoresJson, Status: "manager_scored" } });
}
