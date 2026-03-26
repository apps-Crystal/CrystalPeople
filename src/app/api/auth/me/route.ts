import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Never send the full JWT payload — only safe fields
  return NextResponse.json({
    user: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      employeeType: session.employeeType,
      managerId: session.managerId,
      firstLoginDone: session.firstLoginDone,
    },
  });
}
