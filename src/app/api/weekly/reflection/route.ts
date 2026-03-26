import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, appendRowByFields, getNextSeq, generateId } from "@/lib/sheets";
import { getWeekStart } from "@/lib/utils";
import type { WeeklyReflection } from "@/lib/types";

// GET /api/weekly/reflection?week=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const week = req.nextUrl.searchParams.get("week") ?? getWeekStart();

  const rows = await readSheet("Weekly_Reflections") as unknown as WeeklyReflection[];
  const reflection = rows.find(
    r => r.Employee_ID === session.userId && r.Week_Start_Date === week
  ) ?? null;

  return NextResponse.json({ reflection, week });
}

// POST /api/weekly/reflection
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { accomplishments, next_week_plan, blockers = "", mood } = body;

  if (!accomplishments?.trim() || accomplishments.trim().length < 10) {
    return NextResponse.json({ error: "Accomplishments must be at least 10 characters" }, { status: 400 });
  }
  if (!next_week_plan?.trim() || next_week_plan.trim().length < 10) {
    return NextResponse.json({ error: "Next week plan must be at least 10 characters" }, { status: 400 });
  }
  if (!mood || mood < 1 || mood > 5) {
    return NextResponse.json({ error: "Mood must be between 1 and 5" }, { status: 400 });
  }

  const week = getWeekStart();

  const existing = await readSheet("Weekly_Reflections") as unknown as WeeklyReflection[];
  const dup = existing.find(r => r.Employee_ID === session.userId && r.Week_Start_Date === week);
  if (dup) return NextResponse.json({ error: "Already submitted for this week" }, { status: 409 });

  const seq = await getNextSeq("Weekly_Reflections");
  const reflectionId = generateId("REF", seq);

  await appendRowByFields("Weekly_Reflections", {
    Reflection_ID: reflectionId,
    Employee_ID: session.userId,
    Week_Start_Date: week,
    Accomplishments: accomplishments.trim(),
    Next_Week_Plan: next_week_plan.trim(),
    Blockers: blockers.trim(),
    Mood: String(mood),
    Submitted_At: new Date().toISOString(),
    Acknowledged_At: "",
  });

  return NextResponse.json({ success: true, reflectionId }, { status: 201 });
}
