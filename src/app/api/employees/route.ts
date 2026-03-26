import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, appendRowByFields, getNextSeq, generateId, invalidateCache } from "@/lib/sheets";
import { hashPassword } from "@/lib/auth";
import { appendOrgChange } from "@/lib/org-changes";
import type { Employee } from "@/lib/types";

// GET /api/employees — list all employees (HR/MD only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const dept = searchParams.get("department") ?? "";
  const role = searchParams.get("role") ?? "";
  const empType = searchParams.get("employee_type") ?? "";
  const status = searchParams.get("status") ?? "";

  const rows = await readSheet("Employees") as unknown as Employee[];

  let filtered = rows.filter(r => r.Employee_ID); // skip blank rows

  if (search) {
    filtered = filtered.filter(r =>
      r.Name?.toLowerCase().includes(search) ||
      r.Email?.toLowerCase().includes(search) ||
      r.Employee_ID?.toLowerCase().includes(search) ||
      r.Department?.toLowerCase().includes(search)
    );
  }
  if (dept) filtered = filtered.filter(r => r.Department === dept);
  if (role) filtered = filtered.filter(r => r.Role === role);
  if (empType) filtered = filtered.filter(r => r.Employee_Type === empType);
  if (status) filtered = filtered.filter(r => r.Status === status);

  // Build manager name lookup
  const managerMap: Record<string, string> = {};
  rows.forEach(r => { if (r.Employee_ID) managerMap[r.Employee_ID] = r.Name; });

  // Strip password hash before sending
  const safe = filtered.map(r => ({
    ...r,
    Password_Hash: undefined,
    Manager_Name: r.Manager_ID ? (managerMap[r.Manager_ID] ?? r.Manager_ID) : "—",
  }));

  const departments = [...new Set(rows.filter(r => r.Department).map(r => r.Department))].sort();

  return NextResponse.json({
    employees: safe,
    total: safe.length,
    activeCount: safe.filter(r => r.Status === "active").length,
    departments,
  });
}

// POST /api/employees — create a new employee (HR/MD only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, mobile, department, role, employee_type, manager_id, join_date, password, status = "active" } = body;

  // Validation
  if (!name || !email || !department || !role || !employee_type || !join_date || !password) {
    return NextResponse.json({ error: "Missing required fields: name, email, department, role, employee_type, join_date, password" }, { status: 400 });
  }

  const validRoles = ["employee", "manager", "hr", "md"];
  const validTypes = ["white_collar", "blue_collar"];
  if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (!validTypes.includes(employee_type)) return NextResponse.json({ error: "Invalid employee_type" }, { status: 400 });

  // Check duplicate email
  const existing = await readSheet("Employees") as unknown as Employee[];
  const dup = existing.find(r => r.Email?.toLowerCase() === email.toLowerCase());
  if (dup) return NextResponse.json({ error: "An employee with this email already exists" }, { status: 409 });

  // Generate ID
  const seq = await getNextSeq("Employees");
  const employeeId = generateId("EMP", seq);

  const hash = hashPassword(password);
  const now = new Date().toISOString();

  await appendRowByFields("Employees", {
    Employee_ID: employeeId,
    Name: name,
    Email: email,
    Password_Hash: hash,
    Mobile: mobile ?? "",
    Department: department,
    Role: role,
    Employee_Type: employee_type,
    Manager_ID: manager_id ?? "",
    Join_Date: join_date,
    Status: status,
    First_Login_Done: "FALSE",
  });

  // If this employee is a manager, add to Managers sheet
  if (role === "manager" || role === "hr" || role === "md") {
    const { appendRowByFields: append } = await import("@/lib/sheets");
    await append("Managers", { Manager_ID: employeeId, Employee_ID: employeeId });
  }

  await appendOrgChange({
    employeeId,
    fieldChanged: "created",
    oldValue: "",
    newValue: JSON.stringify({ name, email, role, employee_type, department }),
    changedBy: session.userId,
  });

  invalidateCache("Employees");

  return NextResponse.json({ success: true, employeeId }, { status: 201 });
}
