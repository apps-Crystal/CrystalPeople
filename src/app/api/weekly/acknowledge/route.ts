import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, updateRowWhere } from "@/lib/sheets";
import { getWeekStart } from "@/lib/utils";
import type { WeeklyReflection, WeeklyCheckin } from "@/lib/types";

// POST /api/weekly/acknowledge
// Body: { checkin_id: string } or auto-detects from current week
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { checkin_id } = body as { checkin_id?: string };

  const week = getWeekStart();

  // Validate the check-in belongs to this employee
  const checkins = await readSheet("Weekly_Checkins") as unknown as WeeklyCheckin[];
  let checkin: WeeklyCheckin | undefined;

  if (checkin_id) {
    checkin = checkins.find(c => c.Checkin_ID === checkin_id && c.Employee_ID === session.userId);
  } else {
    checkin = checkins.find(c => c.Employee_ID === session.userId && c.Week_Start_Date === week);
  }

  if (!checkin) {
    return NextResponse.json({ error: "No check-in found for this employee" }, { status: 404 });
  }

  // Update the corresponding reflection's Acknowledged_At
  const reflections = await readSheet("Weekly_Reflections") as unknown as WeeklyReflection[];
  const reflection = reflections.find(
    r => r.Employee_ID === session.userId && r.Week_Start_Date === checkin!.Week_Start_Date
  );
  if (!reflection) {
    return NextResponse.json({ error: "Reflection not found" }, { status: 404 });
  }
  if (reflection.Acknowledged_At) {
    return NextResponse.json({ success: true, message: "Already acknowledged" });
  }

  await updateRowWhere("Weekly_Reflections", "Reflection_ID", reflection.Reflection_ID, {
    Acknowledged_At: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
