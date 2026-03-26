import { NextResponse } from "next/server";
import { getSession, signJwt, sessionCookieOptions, COOKIE_NAME } from "@/lib/auth";
import { updateRowWhere, invalidateCache } from "@/lib/sheets";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mark first login done in the sheet
  await updateRowWhere("Employees", "Employee_ID", session.userId, {
    First_Login_Done: "TRUE",
  });
  invalidateCache("Employees");

  // Re-sign JWT with firstLoginDone: true
  const newToken = await signJwt({ ...session, firstLoginDone: true });

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, newToken, sessionCookieOptions());
  return res;
}
