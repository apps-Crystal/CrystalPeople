import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet } from "@/lib/sheets";
import { parseConfigRows, getScoreDimensions, safeJsonParse } from "@/lib/utils";
import type { Employee, Goal, Task, ReviewCycle, ScoreDimension } from "@/lib/types";

// ─── GET /api/monthly/score-team ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);
  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month") ?? String(config.current_month);
  const year = searchParams.get("year") ?? String(config.current_year);
  const employeeId = searchParams.get("employee_id");

  const [employees, goals, tasks, cycles] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    readSheet("Goals") as unknown as Promise<Goal[]>,
    readSheet("Tasks") as unknown as Promise<Task[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  // Determine team: manager sees reports, hr/md sees all active employees
  const allEmployees = employees as Employee[];
  let team: Employee[];
  if (session.role === "manager") {
    team = allEmployees.filter(
      e => e.Manager_ID === session.userId && e.Status === "active" && e.Employee_ID !== session.userId
    );
  } else {
    team = allEmployees.filter(e => e.Status === "active");
  }

  // Single employee scoring view
  if (employeeId) {
    const employee = allEmployees.find(e => e.Employee_ID === employeeId);
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // Validate access
    if (session.role === "manager" && employee.Manager_ID !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const empGoals = (goals as Goal[]).filter(
      g => g.Employee_ID === employeeId && g.Month === month && g.Year === year
    );
    const empTasks = (tasks as Task[]).filter(t => t.Employee_ID === employeeId);
    const dimensions = getScoreDimensions(employee, empGoals, empTasks);

    const cycle = (cycles as ReviewCycle[]).find(
      c => c.Employee_ID === employeeId && c.Month === month && c.Year === year
    ) ?? null;

    // Populate scores into dimensions
    if (cycle) {
      const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
      const managerScores = safeJsonParse<Record<string, number>>(cycle.Manager_Scores, {});
      dimensions.forEach(d => {
        if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
        if (managerScores[d.key] !== undefined) d.managerScore = managerScores[d.key];
      });
    }

    return NextResponse.json({ employee, cycle, dimensions });
  }

  // Team list view
  const teamData = team.map(employee => {
    const empGoals = (goals as Goal[]).filter(
      g => g.Employee_ID === employee.Employee_ID && g.Month === month && g.Year === year
    );
    const empTasks = (tasks as Task[]).filter(t => t.Employee_ID === employee.Employee_ID);
    const dimensions: ScoreDimension[] = getScoreDimensions(employee, empGoals, empTasks);

    const cycle = (cycles as ReviewCycle[]).find(
      c => c.Employee_ID === employee.Employee_ID && c.Month === month && c.Year === year
    ) ?? null;

    if (cycle?.Self_Scores) {
      const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
      dimensions.forEach(d => {
        if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
      });
    }

    return { employee, cycle, dimensions };
  });

  return NextResponse.json({ team: teamData });
}
