import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  cachedReadSheet, appendRowByFields, getNextSeq, generateId, invalidateCache,
} from "@/lib/sheets";
import { parseConfigRows } from "@/lib/utils";
import type { Employee, Assignment } from "@/lib/types";

// ─── GET /api/assignments ─────────────────────────────────────────────────────
// ?employee_id= optional; employees see only own, managers see reports, hr/md see all

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const requestedId = searchParams.get("employee_id");

  const [employees, assignments] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Assignments") as unknown as Promise<Assignment[]>,
  ]);

  let targetId: string | null = null;

  if (session.role === "employee") {
    // Employees can only see their own
    targetId = session.userId;
  } else if (session.role === "manager") {
    // Managers see their direct reports; if employee_id specified, validate it
    if (requestedId) {
      const emp = (employees as Employee[]).find(e => e.Employee_ID === requestedId);
      if (!emp || emp.Manager_ID !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      targetId = requestedId;
    }
    // If no employee_id, return all assignments for their reports
  } else {
    // hr/md: see all, optionally filter by employee_id
    targetId = requestedId ?? null;
  }

  let filtered = assignments as Assignment[];

  if (targetId) {
    filtered = filtered.filter(a => a.Employee_ID === targetId);
  } else if (session.role === "manager") {
    const reports = (employees as Employee[])
      .filter(e => e.Manager_ID === session.userId && e.Status === "active")
      .map(e => e.Employee_ID);
    filtered = filtered.filter(a => reports.includes(a.Employee_ID));
  }

  // Enrich with employee name for manager/hr/md views
  if (session.role !== "employee") {
    const empMap = new Map(
      (employees as Employee[]).map(e => [e.Employee_ID, e])
    );
    const enriched = filtered.map(a => ({
      ...a,
      employeeName: empMap.get(a.Employee_ID)?.Name ?? a.Employee_ID,
      department: empMap.get(a.Employee_ID)?.Department ?? "",
    }));
    return NextResponse.json({ assignments: enriched });
  }

  return NextResponse.json({ assignments: filtered });
}

// ─── POST /api/assignments ────────────────────────────────────────────────────
// Only managers/HR/MD can create assignments

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden: only managers can assign work" }, { status: 403 });
  }

  const body = await req.json();
  const { employee_id, title, description, target, type, due_date } = body as {
    employee_id: string;
    title: string;
    description: string;
    target: string;
    type: string;
    due_date?: string;
  };

  if (!employee_id) return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  if (!title || title.trim().length < 3) return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 });
  if (!description || description.trim().length < 5) return NextResponse.json({ error: "Description must be at least 5 characters" }, { status: 400 });
  if (!target || target.trim().length < 3) return NextResponse.json({ error: "Target must be at least 3 characters" }, { status: 400 });
  if (!["goal", "task"].includes(type)) return NextResponse.json({ error: "Type must be 'goal' or 'task'" }, { status: 400 });

  const [employees, configRows] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Config"),
  ]);

  const config = parseConfigRows(configRows as { Key: string; Value: string }[]);

  const emp = (employees as Employee[]).find(e => e.Employee_ID === employee_id);
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (emp.Status !== "active") return NextResponse.json({ error: "Employee is not active" }, { status: 400 });
  if (!["employee", "manager"].includes(emp.Role)) {
    return NextResponse.json({ error: "Cannot assign work to HR or MD users" }, { status: 403 });
  }

  // Managers can only assign to their direct reports
  if (session.role === "manager" && emp.Manager_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: this employee does not report to you" }, { status: 403 });
  }

  try {
    const seq = await getNextSeq("Assignments");
    const assignmentId = generateId("ASGN", seq);

    await appendRowByFields("Assignments", {
      Assignment_ID: assignmentId,
      Employee_ID: employee_id,
      Manager_ID: session.userId,
      Month: String(config.current_month),
      Year: String(config.current_year),
      Title: title.trim(),
      Description: description.trim(),
      Target: target.trim(),
      Type: type,
      Status: "active",
      Drop_Reason: "",
      Due_Date: due_date?.trim() ?? "",
      Progress_Note: "",
      Self_Score: "",
      Manager_Score: "",
      Created_At: new Date().toISOString(),
    });

    invalidateCache("Assignments");

    return NextResponse.json({ success: true, assignmentId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/assignments]", err);
    return NextResponse.json({ error: "Failed to create assignment. Check SEQUENCES sheet." }, { status: 500 });
  }
}
