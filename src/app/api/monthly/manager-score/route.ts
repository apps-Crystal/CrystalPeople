import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, cachedReadSheet, updateRowWhere, invalidateCache,
} from "@/lib/sheets";
import {
  parseConfigRows, getScoreDimensions, isWindowOpen,
  computeAverage, safeJsonParse, monthLabel,
} from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import type { Employee, Goal, Task, ReviewCycle } from "@/lib/types";

// ─── POST /api/monthly/manager-score ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden: employees cannot score team members" }, { status: 403 });
  }

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  // Window check for manager role
  if (!isWindowOpen(session.role, config)) {
    return NextResponse.json({ error: "Scoring window is currently closed" }, { status: 400 });
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

  const month = String(config.current_month);
  const year = String(config.current_year);

  const [employees, goals, tasks, cycles] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    readSheet("Goals") as unknown as Promise<Goal[]>,
    readSheet("Tasks") as unknown as Promise<Task[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  const employee = (employees as Employee[]).find(e => e.Employee_ID === employee_id);
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  // Validate reporting relationship for managers
  if (session.role === "manager" && employee.Manager_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: not your direct report" }, { status: 403 });
  }

  // Employee must have self-scored first
  const cycle = (cycles as ReviewCycle[]).find(
    c => c.Employee_ID === employee_id && c.Month === month && c.Year === year
  );
  if (!cycle || cycle.Status !== "self_scored") {
    return NextResponse.json({ error: "Employee must complete self-assessment first" }, { status: 400 });
  }

  // Validate all dimension scores
  const empGoals = (goals as Goal[]).filter(
    g => g.Employee_ID === employee_id && g.Month === month && g.Year === year
  );
  const empTasks = (tasks as Task[]).filter(t => t.Employee_ID === employee_id);
  const dimensions = getScoreDimensions(employee, empGoals, empTasks);

  for (const dim of dimensions) {
    const score = scores[dim.key];
    if (score === undefined || score === null) {
      return NextResponse.json({ error: `Score missing for: ${dim.label}` }, { status: 400 });
    }
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: `Score for ${dim.label} must be between 1 and 5` }, { status: 400 });
    }
  }

  // Compute flagged dimensions (gap > 1 between self and manager score)
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

  // Update individual goal/task manager scores
  for (const dim of dimensions) {
    if (dim.type === "goal" && scores[dim.key] !== undefined) {
      await updateRowWhere("Goals", "Goal_ID", dim.key, {
        Manager_Score: String(scores[dim.key]),
      });
    } else if (dim.type === "task" && scores[dim.key] !== undefined) {
      const taskRow = empTasks.find(t => t.Task_ID === dim.key);
      if (taskRow) {
        const monthlyScores = safeJsonParse<Array<{
          month: number; year: number; self_score: number; manager_score: number;
        }>>(taskRow.Monthly_Scores, []);

        const idx = monthlyScores.findIndex(
          ms => ms.month === config.current_month && ms.year === config.current_year
        );
        if (idx >= 0) {
          monthlyScores[idx].manager_score = scores[dim.key];
        } else {
          monthlyScores.push({
            month: config.current_month,
            year: config.current_year,
            self_score: 0,
            manager_score: scores[dim.key],
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

  // Notify the employee that manager has scored
  const label = monthLabel(config.current_month, config.current_year);
  void createNotification(
    employee_id,
    "manual",
    `Your manager has completed your ${label} review. Please acknowledge it in My Review.`
  );

  return NextResponse.json({ cycle: { ...cycle, Manager_Scores: scoresJson, Status: "manager_scored" } });
}