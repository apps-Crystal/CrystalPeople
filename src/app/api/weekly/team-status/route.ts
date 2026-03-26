import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet } from "@/lib/sheets";
import { getWeekStart } from "@/lib/utils";
import type { Employee, WeeklyReflection, WeeklyCheckin } from "@/lib/types";

export interface TeamMemberStatus {
  employee_id: string;
  name: string;
  department: string;
  employee_type: string;
  reflection_submitted: boolean;
  reflection_id: string | null;
  checkin_submitted: boolean;
  checkin_id: string | null;
  acknowledged: boolean;
}

// GET /api/weekly/team-status
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["manager", "hr", "md"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const week = getWeekStart();

  const [employees, reflections, checkins] = await Promise.all([
    readSheet("Employees") as unknown as Promise<Employee[]>,
    readSheet("Weekly_Reflections") as unknown as Promise<WeeklyReflection[]>,
    readSheet("Weekly_Checkins") as unknown as Promise<WeeklyCheckin[]>,
  ]);

  // Filter team members
  let team: Employee[];
  if (session.role === "manager") {
    team = (employees as Employee[]).filter(
      e => e.Manager_ID === session.userId && e.Status === "active" && e.Employee_ID !== session.userId
    );
  } else {
    // HR / MD see all active employees
    team = (employees as Employee[]).filter(e => e.Status === "active" && e.Employee_ID !== session.userId);
  }

  const reflectionMap = new Map<string, WeeklyReflection>();
  (reflections as WeeklyReflection[]).filter(r => r.Week_Start_Date === week).forEach(r => reflectionMap.set(r.Employee_ID, r));

  const checkinMap = new Map<string, WeeklyCheckin>();
  (checkins as WeeklyCheckin[]).filter(c => c.Week_Start_Date === week).forEach(c => checkinMap.set(c.Employee_ID, c));

  const status: TeamMemberStatus[] = team.map(e => {
    const ref = reflectionMap.get(e.Employee_ID);
    const chk = checkinMap.get(e.Employee_ID);
    return {
      employee_id: e.Employee_ID,
      name: e.Name,
      department: e.Department,
      employee_type: e.Employee_Type,
      reflection_submitted: !!ref,
      reflection_id: ref?.Reflection_ID ?? null,
      checkin_submitted: !!chk,
      checkin_id: chk?.Checkin_ID ?? null,
      acknowledged: !!ref?.Acknowledged_At,
    };
  });

  return NextResponse.json({ status, week });
}
