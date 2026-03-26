import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, cachedReadSheet, appendRowByFields,
  getNextSeq, generateId, invalidateCache,
} from "@/lib/sheets";
import type { Task, Employee } from "@/lib/types";

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  let employeeId = searchParams.get("employee_id") ?? session.userId;

  if (session.role === "employee") {
    employeeId = session.userId;
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

  const allTasks = await readSheet("Tasks") as unknown as Task[];
  const tasks = allTasks.filter(t => t.Employee_ID === employeeId);

  return NextResponse.json({ tasks });
}

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only manager, hr, md can create tasks
  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden: only managers can assign tasks" }, { status: 403 });
  }

  const body = await req.json();
  const { task_description, target, employee_id } = body;

  if (!employee_id) {
    return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  }
  if (!task_description || task_description.trim().length < 10) {
    return NextResponse.json({ error: "Task description must be at least 10 characters" }, { status: 400 });
  }
  if (!target || target.trim().length < 5) {
    return NextResponse.json({ error: "Target must be at least 5 characters" }, { status: 400 });
  }

  const employees = await cachedReadSheet("Employees") as unknown as Employee[];
  const emp = employees.find(e => e.Employee_ID === employee_id);
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (emp.Employee_Type !== "blue_collar") {
    return NextResponse.json({ error: "Tasks can only be assigned to blue-collar employees" }, { status: 400 });
  }

  // Validate reporting for managers
  if (session.role === "manager" && emp.Manager_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: not your report" }, { status: 403 });
  }

  const seq = await getNextSeq("Tasks");
  const taskId = generateId("TASK", seq);
  const now = new Date().toISOString();

  const task: Record<string, string> = {
    Task_ID: taskId,
    Employee_ID: employee_id,
    Manager_ID: session.userId,
    Task_Description: task_description.trim(),
    Target: target.trim(),
    Status: "active",
    Monthly_Scores: "[]",
    Created_At: now,
    Updated_At: now,
  };

  await appendRowByFields("Tasks", task);
  invalidateCache("Tasks");

  return NextResponse.json({ task }, { status: 201 });
}
