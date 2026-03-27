import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet } from "@/lib/sheets";
import {
  parseConfigRows, getScoreDimensionsFromAssignments,
  getManagerScoreWindow, safeJsonParse,
} from "@/lib/utils";
import type { Employee, Assignment, ReviewCycle, ScoreDimension } from "@/lib/types";

// ─── GET /api/monthly/score-team ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  // Determine which month/year managers are scoring (previous month, days 1-7)
  const scoreWindow = getManagerScoreWindow(config);
  const scoreMonth = String(scoreWindow.scoreMonth);
  const scoreYear = String(scoreWindow.scoreYear);

  const { searchParams } = req.nextUrl;
  const employeeId = searchParams.get("employee_id");

  const [employees, assignments, cycles] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Assignments") as unknown as Promise<Assignment[]>,
    readSheet("Review_Cycles") as unknown as Promise<ReviewCycle[]>,
  ]);

  const allEmployees = employees as Employee[];
  let team: Employee[];
  if (session.role === "manager") {
    team = allEmployees.filter(
      e => e.Manager_ID === session.userId && e.Status === "active" && e.Employee_ID !== session.userId
    );
  } else {
    team = allEmployees.filter(e => e.Status === "active" && e.Employee_ID !== session.userId);
  }

  // Single employee scoring view
  if (employeeId) {
    const employee = allEmployees.find(e => e.Employee_ID === employeeId);
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    if (session.role === "manager" && employee.Manager_ID !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const empAssignments = (assignments as Assignment[]).filter(
      a => a.Employee_ID === employeeId && a.Month === scoreMonth && a.Year === scoreYear
    );
    const dimensions: ScoreDimension[] = getScoreDimensionsFromAssignments(empAssignments);

    const cycle = (cycles as ReviewCycle[]).find(
      c => c.Employee_ID === employeeId && c.Month === scoreMonth && c.Year === scoreYear
    ) ?? null;

    if (cycle) {
      const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
      const managerScores = safeJsonParse<Record<string, number>>(cycle.Manager_Scores, {});
      dimensions.forEach(d => {
        if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
        if (managerScores[d.key] !== undefined) d.managerScore = managerScores[d.key];
      });
    }

    return NextResponse.json({ employee, cycle, dimensions, scoreWindow });
  }

  // Team list view
  const teamData = team.map(employee => {
    const empAssignments = (assignments as Assignment[]).filter(
      a => a.Employee_ID === employee.Employee_ID && a.Month === scoreMonth && a.Year === scoreYear
    );
    const dimensions: ScoreDimension[] = getScoreDimensionsFromAssignments(empAssignments);

    const cycle = (cycles as ReviewCycle[]).find(
      c => c.Employee_ID === employee.Employee_ID && c.Month === scoreMonth && c.Year === scoreYear
    ) ?? null;

    if (cycle?.Self_Scores) {
      const selfScores = safeJsonParse<Record<string, number>>(cycle.Self_Scores, {});
      dimensions.forEach(d => {
        if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
      });
    }

    return { employee, cycle, dimensions };
  });

  return NextResponse.json({ team: teamData, scoreWindow });
}
