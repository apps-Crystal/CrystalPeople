import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet } from "@/lib/sheets";
import { parseConfigRows, getScoreDimensions, safeJsonParse } from "@/lib/utils";
import type { Employee, Goal, Task, ReviewCycle } from "@/lib/types";

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

  const cycle = (cycles as ReviewCycle[]).find(
    c => c.Employee_ID === session.userId && c.Month === month && c.Year === year
  ) ?? null;

  if (!cycle || cycle.Status === "pending") {
    return NextResponse.json({ cycle: null, dimensions: [], employee });
  }

  const myGoals = (goals as Goal[]).filter(
    g => g.Employee_ID === session.userId && g.Month === month && g.Year === year
  );
  const myTasks = (tasks as Task[]).filter(t => t.Employee_ID === session.userId);
  const dimensions = getScoreDimensions(employee, myGoals, myTasks);

  const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
  const managerScores = safeJsonParse<Record<string, number>>(cycle.Manager_Scores, {});
  dimensions.forEach(d => {
    if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
    if (managerScores[d.key] !== undefined) d.managerScore = managerScores[d.key];
  });

  return NextResponse.json({ cycle, dimensions, employee });
}
