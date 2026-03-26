import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet } from "@/lib/sheets";
import { parseConfigRows } from "@/lib/utils";
import type { Employee, WeeklyReflection, WeeklyCheckin } from "@/lib/types";

function getMondaysInMonth(month: number, year: number): string[] {
  const mondays: string[] = [];
  const date = new Date(year, month - 1, 1);

  // Find first Monday
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }

  // Collect all Mondays in the month
  while (date.getMonth() === month - 1) {
    const iso = date.toISOString().split("T")[0];
    mondays.push(iso);
    date.setDate(date.getDate() + 7);
  }

  // Also include the Monday before the 1st if it's in the prior month
  // (that week still overlaps with this month)
  const firstOfMonth = new Date(year, month - 1, 1);
  if (firstOfMonth.getDay() !== 1 && firstOfMonth.getDay() !== 0) {
    const prevMonday = new Date(firstOfMonth);
    const day = prevMonday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    prevMonday.setDate(prevMonday.getDate() + diff);
    const iso = prevMonday.toISOString().split("T")[0];
    if (!mondays.includes(iso)) {
      mondays.unshift(iso);
    }
  }

  return mondays;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const employeeId = searchParams.get("employee_id");
  if (!employeeId) {
    return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  }

  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);
  const month = parseInt(searchParams.get("month") ?? String(config.current_month), 10);
  const year = parseInt(searchParams.get("year") ?? String(config.current_year), 10);

  // Validate access for managers
  if (session.role === "manager") {
    const employees = await cachedReadSheet("Employees") as unknown as Employee[];
    const emp = (employees as Employee[]).find(e => e.Employee_ID === employeeId);
    if (!emp || emp.Manager_ID !== session.userId) {
      return NextResponse.json({ error: "Forbidden: not your direct report" }, { status: 403 });
    }
  }

  const mondays = getMondaysInMonth(month, year);

  const [reflections, checkins] = await Promise.all([
    readSheet("Weekly_Reflections") as unknown as Promise<WeeklyReflection[]>,
    readSheet("Weekly_Checkins") as unknown as Promise<WeeklyCheckin[]>,
  ]);

  const weeks = mondays.map(weekStart => {
    const reflection = (reflections as WeeklyReflection[]).find(
      r => r.Employee_ID === employeeId && r.Week_Start_Date === weekStart
    ) ?? null;

    const checkin = (checkins as WeeklyCheckin[]).find(
      c => c.Employee_ID === employeeId && c.Week_Start_Date === weekStart
    ) ?? null;

    return { week_start: weekStart, reflection, checkin };
  });

  return NextResponse.json({ weeks });
}
