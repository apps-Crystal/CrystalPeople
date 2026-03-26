import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet } from "@/lib/sheets";
import type { Employee, WeeklyReflection } from "@/lib/types";

// GET /api/weekly/reflection/for-manager?employee_id=EMP-XXXX&week=YYYY-MM-DD
// Allows managers to read their direct report's reflection for a specific week.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["manager", "hr", "md"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const week = req.nextUrl.searchParams.get("week");
  if (!employeeId || !week) {
    return NextResponse.json({ error: "employee_id and week are required" }, { status: 400 });
  }

  // Validate: employee must report to this manager (skip for hr/md)
  if (session.role === "manager") {
    const employees = await readSheet("Employees") as unknown as Employee[];
    const emp = employees.find(e => e.Employee_ID === employeeId);
    if (!emp || emp.Manager_ID !== session.userId) {
      return NextResponse.json({ error: "This employee does not report to you" }, { status: 403 });
    }
  }

  const rows = await readSheet("Weekly_Reflections") as unknown as WeeklyReflection[];
  const reflection = rows.find(r => r.Employee_ID === employeeId && r.Week_Start_Date === week) ?? null;

  return NextResponse.json({ reflection });
}
