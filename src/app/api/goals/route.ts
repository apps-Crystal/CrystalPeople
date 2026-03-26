import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, cachedReadSheet, appendRowByFields,
  getNextSeq, generateId, invalidateCache,
} from "@/lib/sheets";
import { parseConfigRows } from "@/lib/utils";
import type { Goal, Employee } from "@/lib/types";

// ─── GET /api/goals ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  let employeeId = searchParams.get("employee_id") ?? session.userId;
  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);
  const month = searchParams.get("month") ?? String(config.current_month);
  const year = searchParams.get("year") ?? String(config.current_year);

  // Role-based access checks
  if (session.role === "employee") {
    employeeId = session.userId; // employees can only see own goals
  } else if (session.role === "manager") {
    if (employeeId !== session.userId) {
      const employees = await cachedReadSheet("Employees") as unknown as Employee[];
      const emp = employees.find(e => e.Employee_ID === employeeId);
      if (!emp || emp.Manager_ID !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }
  // hr/md can fetch for any employee

  const allGoals = await readSheet("Goals") as unknown as Goal[];
  const goals = allGoals.filter(
    g => g.Employee_ID === employeeId && g.Month === month && g.Year === year
  );

  return NextResponse.json({ goals });
}

// ─── POST /api/goals ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, target, employee_id } = body;

  // Determine target employee
  let targetEmployeeId = session.userId;
  if (session.role !== "employee" && employee_id) {
    targetEmployeeId = employee_id;
  }

  // Validate input
  if (!title || title.trim().length < 5) {
    return NextResponse.json({ error: "Title must be at least 5 characters" }, { status: 400 });
  }
  if (!description || description.trim().length < 10) {
    return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });
  }
  if (!target || target.trim().length === 0) {
    return NextResponse.json({ error: "Target is required" }, { status: 400 });
  }

  // Validate reporting relationship for managers
  const employees = await cachedReadSheet("Employees") as unknown as Employee[];
  const targetEmp = employees.find(e => e.Employee_ID === targetEmployeeId);
  if (!targetEmp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  if (session.role === "manager" && targetEmployeeId !== session.userId) {
    if (targetEmp.Manager_ID !== session.userId) {
      return NextResponse.json({ error: "Forbidden: not your report" }, { status: 403 });
    }
  }

  // Get config
  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);

  // Check max_goals enforcement
  const allGoals = await readSheet("Goals") as unknown as Goal[];
  const activeGoalsCount = allGoals.filter(
    g =>
      g.Employee_ID === targetEmployeeId &&
      g.Month === String(config.current_month) &&
      g.Year === String(config.current_year) &&
      g.Status === "active"
  ).length;

  if (activeGoalsCount >= config.max_goals) {
    return NextResponse.json(
      { error: `Maximum ${config.max_goals} active goals allowed for this month` },
      { status: 400 }
    );
  }

  const seq = await getNextSeq("Goals");
  const goalId = generateId("GOAL", seq);
  const now = new Date().toISOString();

  const goal: Record<string, string> = {
    Goal_ID: goalId,
    Employee_ID: targetEmployeeId,
    Manager_ID: targetEmp.Manager_ID ?? "",
    Month: String(config.current_month),
    Year: String(config.current_year),
    Title: title.trim(),
    Description: description.trim(),
    Target: target.trim(),
    Status: "active",
    Drop_Reason: "",
    Self_Score: "",
    Manager_Score: "",
    Created_At: now,
  };

  await appendRowByFields("Goals", goal);
  invalidateCache("Goals");

  return NextResponse.json({ goal }, { status: 201 });
}
