import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet } from "@/lib/sheets";
import type { WeeklyReflection } from "@/lib/types";

// GET /api/weekly/reflection/history — all past reflections for the logged-in user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await readSheet("Weekly_Reflections") as unknown as WeeklyReflection[];
  const mine = rows
    .filter(r => r.Employee_ID === session.userId && r.Week_Start_Date)
    .sort((a, b) => b.Week_Start_Date.localeCompare(a.Week_Start_Date));

  return NextResponse.json({ reflections: mine });
}
