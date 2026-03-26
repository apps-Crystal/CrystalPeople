import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { readSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import { appendOrgChange } from "@/lib/org-changes";
import type { Employee } from "@/lib/types";

// GET /api/employees/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Employees can only fetch their own record
  if (session.role === "employee" && session.userId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Managers can fetch their own team
  // HR/MD can fetch anyone

  const rows = await readSheet("Employees") as unknown as Employee[];
  const emp = rows.find(r => r.Employee_ID === id);
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const managerMap: Record<string, string> = {};
  rows.forEach(r => { if (r.Employee_ID) managerMap[r.Employee_ID] = r.Name; });

  return NextResponse.json({
    employee: {
      ...emp,
      Password_Hash: undefined,
      Manager_Name: emp.Manager_ID ? (managerMap[emp.Manager_ID] ?? emp.Manager_ID) : "—",
    },
  });
}

// PATCH /api/employees/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const rows = await readSheet("Employees") as unknown as Employee[];
  const emp = rows.find(r => r.Employee_ID === id);
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const EDITABLE_FIELDS = ["Name","Email","Mobile","Department","Role","Employee_Type","Manager_ID","Join_Date","Status","First_Login_Done"];
  const updates: Record<string, string> = {};
  const orgChanges: { field: string; old: string; new: string }[] = [];

  for (const field of EDITABLE_FIELDS) {
    const bodyKey = field.toLowerCase();
    const value = body[bodyKey] ?? body[field];
    if (value !== undefined && String(value) !== String(emp[field as keyof Employee] ?? "")) {
      updates[field] = String(value);
      orgChanges.push({
        field,
        old: String(emp[field as keyof Employee] ?? ""),
        new: String(value),
      });
    }
  }

  // Special: password reset
  if (body.new_password) {
    updates["Password_Hash"] = hashPassword(body.new_password);
    if (body.reset_first_login) updates["First_Login_Done"] = "FALSE";
    orgChanges.push({ field: "Password_Hash", old: "[hashed]", new: "[new hash set by HR]" });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true, message: "No changes" });
  }

  await updateRowWhere("Employees", "Employee_ID", id, updates);

  // Log each changed field
  for (const change of orgChanges) {
    if (change.field !== "Password_Hash") {
      await appendOrgChange({
        employeeId: id,
        fieldChanged: change.field,
        oldValue: change.old,
        newValue: change.new,
        changedBy: session.userId,
      });
    }
  }

  invalidateCache("Employees");

  return NextResponse.json({ success: true });
}
