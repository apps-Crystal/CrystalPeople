import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets";
import { verifyPassword, signJwt, sessionCookieOptions, COOKIE_NAME } from "@/lib/auth";
import type { Employee } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const rows = await readSheet("Employees") as unknown as Employee[];
    const employee = rows.find(
      (r) => r.Email?.toLowerCase() === email.toLowerCase()
    );

    if (!employee) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (employee.Status !== "active") {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact HR." },
        { status: 403 }
      );
    }

    const valid = verifyPassword(password, employee.Password_Hash ?? "");
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const firstLoginDone = employee.First_Login_Done === "TRUE";

    const token = await signJwt({
      userId: employee.Employee_ID,
      email: employee.Email,
      name: employee.Name,
      role: employee.Role,
      employeeType: employee.Employee_Type,
      managerId: employee.Manager_ID ?? "",
      firstLoginDone,
    });

    const res = NextResponse.json({
      success: true,
      firstLoginDone,
      user: {
        userId: employee.Employee_ID,
        email: employee.Email,
        name: employee.Name,
        role: employee.Role,
        employeeType: employee.Employee_Type,
      },
    });

    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
