import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { readSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import type { Employee } from "@/lib/types";

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)     return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both current and new password are required." }, { status: 400 });
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return NextResponse.json({ error: strengthError }, { status: 400 });
  }

  const employees = await readSheet("Employees") as unknown as Employee[];
  const employee = employees.find(e => e.Employee_ID === session.userId);

  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  if (!employee.Password_Hash || !verifyPassword(currentPassword, employee.Password_Hash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  await updateRowWhere("Employees", "Employee_ID", session.userId, {
    Password_Hash: hashPassword(newPassword),
  });

  invalidateCache("Employees");

  return NextResponse.json({ success: true, message: "Password updated successfully." });
}
