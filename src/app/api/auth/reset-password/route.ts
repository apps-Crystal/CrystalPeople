/**
 * POST /api/auth/reset-password
 *
 * Body: { token: string; password: string }
 *
 * 1. Finds Employee row where Reset_Token === token
 * 2. Checks token has not expired (or been used)
 * 3. Validates new password strength
 * 4. Hashes password and updates Password_Hash in Employees
 * 5. Marks token as "USED" to prevent reuse
 */

import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import { hashPassword, isResetTokenExpired } from "@/lib/auth";
import type { Employee } from "@/lib/types";

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)       return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))   return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password))   return "Password must contain at least one number.";
  return null;
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
  }

  const strengthError = validatePasswordStrength(password);
  if (strengthError) {
    return NextResponse.json({ error: strengthError }, { status: 400 });
  }

  // Find the employee with this reset token
  const employees = await readSheet("Employees") as unknown as (Employee & {
    Reset_Token?: string;
    Reset_Token_Expiry?: string;
  })[];

  const employee = employees.find(e => e.Reset_Token === token);

  if (!employee) {
    return NextResponse.json({ error: "Invalid or already-used reset link." }, { status: 400 });
  }

  if (!employee.Reset_Token_Expiry || isResetTokenExpired(employee.Reset_Token_Expiry)) {
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const newHash = hashPassword(password);

  // Update password and invalidate the token
  // Use "USED" sentinel — empty strings are unreliable with Sheets API
  await updateRowWhere("Employees", "Employee_ID", employee.Employee_ID, {
    Password_Hash: newHash,
    Reset_Token: "USED",
    Reset_Token_Expiry: "USED",
    First_Login_Done: "TRUE", // treat password reset as completing first login
  });

  invalidateCache("Employees");

  return NextResponse.json({ success: true, message: "Password updated. You can now sign in." });
}
