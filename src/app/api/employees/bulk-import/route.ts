import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { readSheet, appendRowByFields, getNextSeq, generateId, invalidateCache } from "@/lib/sheets";
import { appendOrgChange } from "@/lib/org-changes";
import type { Employee } from "@/lib/types";

interface ImportRow {
  name: string;
  email: string;
  mobile?: string;
  department: string;
  role: string;
  employee_type: string;
  manager_id?: string;
  join_date: string;
  password: string;
}

const VALID_ROLES = ["employee", "manager", "hr", "md"];
const VALID_TYPES = ["white_collar", "blue_collar"];

// POST /api/employees/bulk-import
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { rows } = body as { rows: ImportRow[] };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: "Max 200 rows per import" }, { status: 400 });
  }

  const existing = await readSheet("Employees") as unknown as Employee[];
  const emailSet = new Set(existing.map(r => r.Email?.toLowerCase()).filter(Boolean));

  const created: string[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 1;

    // Validate required fields
    if (!r.name?.trim()) { errors.push({ row: rowNum, error: "Name is required" }); continue; }
    if (!r.email?.trim()) { errors.push({ row: rowNum, error: "Email is required" }); continue; }
    if (!r.department?.trim()) { errors.push({ row: rowNum, error: "Department is required" }); continue; }
    if (!r.role?.trim()) { errors.push({ row: rowNum, error: "Role is required" }); continue; }
    if (!r.employee_type?.trim()) { errors.push({ row: rowNum, error: "Employee_Type is required" }); continue; }
    if (!r.join_date?.trim()) { errors.push({ row: rowNum, error: "Join_Date is required" }); continue; }
    if (!r.password?.trim()) { errors.push({ row: rowNum, error: "Password is required" }); continue; }

    const emailLower = r.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      errors.push({ row: rowNum, error: `Invalid email: ${r.email}` }); continue;
    }
    if (!VALID_ROLES.includes(r.role)) {
      errors.push({ row: rowNum, error: `Invalid role "${r.role}". Must be: ${VALID_ROLES.join(", ")}` }); continue;
    }
    if (!VALID_TYPES.includes(r.employee_type)) {
      errors.push({ row: rowNum, error: `Invalid employee_type "${r.employee_type}". Must be: ${VALID_TYPES.join(", ")}` }); continue;
    }
    if (emailSet.has(emailLower)) {
      errors.push({ row: rowNum, error: `Email already exists: ${r.email}` }); continue;
    }

    try {
      const seq = await getNextSeq("Employees");
      const employeeId = generateId("EMP", seq);
      const hash = hashPassword(r.password);

      await appendRowByFields("Employees", {
        Employee_ID: employeeId,
        Name: r.name.trim(),
        Email: emailLower,
        Password_Hash: hash,
        Mobile: r.mobile?.trim() ?? "",
        Department: r.department.trim(),
        Role: r.role,
        Employee_Type: r.employee_type,
        Manager_ID: r.manager_id?.trim() ?? "",
        Join_Date: r.join_date.trim(),
        Status: "active",
        First_Login_Done: "FALSE",
      });

      if (r.role === "manager" || r.role === "hr" || r.role === "md") {
        await appendRowByFields("Managers", { Manager_ID: employeeId, Employee_ID: employeeId });
      }

      await appendOrgChange({
        employeeId,
        fieldChanged: "created",
        oldValue: "",
        newValue: JSON.stringify({ name: r.name, email: emailLower, role: r.role, employee_type: r.employee_type, department: r.department, source: "bulk_import" }),
        changedBy: session.userId,
      });

      emailSet.add(emailLower); // prevent duplicates within this batch
      created.push(employeeId);
    } catch (err) {
      errors.push({ row: rowNum, error: `Failed to create: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  }

  invalidateCache("Employees");

  return NextResponse.json({
    success: true,
    created: created.length,
    errors,
    total: rows.length,
  });
}
