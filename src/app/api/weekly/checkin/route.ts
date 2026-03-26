import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  readSheet, appendRowByFields, updateRowWhere, getNextSeq, generateId,
} from "@/lib/sheets";
import { getWeekStart } from "@/lib/utils";
import type { Employee, WeeklyCheckin } from "@/lib/types";

// GET /api/weekly/checkin?employee_id=EMP-XXXX
// Employees can fetch their OWN check-in (filtered fields only: Did_Well, Improve)
// Managers/HR/MD can fetch any check-in (all fields)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const week = req.nextUrl.searchParams.get("week") ?? getWeekStart();
  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const isManagerRole = ["manager", "hr", "md"].includes(session.role);

  if (!isManagerRole) {
    const targetId = employeeId ?? session.userId;
    if (targetId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await readSheet("Weekly_Checkins") as unknown as WeeklyCheckin[];
    const checkin = rows.find(
      r => r.Employee_ID === session.userId && r.Week_Start_Date === week
    ) ?? null;

    if (!checkin) return NextResponse.json({ checkin: null });

    return NextResponse.json({
      checkin: {
        Checkin_ID: checkin.Checkin_ID,
        Employee_ID: checkin.Employee_ID,
        Week_Start_Date: checkin.Week_Start_Date,
        Did_Well: checkin.Did_Well,
        Improve: checkin.Improve,
        Submitted_At: checkin.Submitted_At,
      },
    });
  }

  const rows = await readSheet("Weekly_Checkins") as unknown as WeeklyCheckin[];

  if (employeeId) {
    const checkin = rows.find(
      r => r.Employee_ID === employeeId && r.Week_Start_Date === week
    ) ?? null;
    return NextResponse.json({ checkin });
  }

  const mine = rows.filter(
    r => r.Manager_ID === session.userId && r.Week_Start_Date === week
  );
  return NextResponse.json({ checkins: mine });
}

// POST /api/weekly/checkin
// Managers/HR/MD can check in on any employee at any time — no reflection required.
// Upserts: one check-in per manager-employee-week combination.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["manager", "hr", "md"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { employee_id, main_thing_on_mind, committed_to, did_well, improve, concern = "" } = body;

  if (!employee_id) return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
  if (!main_thing_on_mind?.trim()) return NextResponse.json({ error: "main_thing_on_mind is required" }, { status: 400 });
  if (!committed_to?.trim()) return NextResponse.json({ error: "committed_to is required" }, { status: 400 });
  if (!did_well?.trim()) return NextResponse.json({ error: "did_well is required" }, { status: 400 });
  if (!improve?.trim()) return NextResponse.json({ error: "improve is required" }, { status: 400 });

  const employees = await readSheet("Employees") as unknown as Employee[];
  const emp = employees.find(e => e.Employee_ID === employee_id);
  if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  if (session.role === "manager" && emp.Manager_ID !== session.userId) {
    return NextResponse.json({ error: "This employee does not report to you" }, { status: 403 });
  }

  const week = getWeekStart();
  const existing = await readSheet("Weekly_Checkins") as unknown as WeeklyCheckin[];
  const dup = existing.find(
    r => r.Manager_ID === session.userId && r.Employee_ID === employee_id && r.Week_Start_Date === week
  );

  // Upsert: update if already exists
  if (dup) {
    await updateRowWhere("Weekly_Checkins", "Checkin_ID", dup.Checkin_ID, {
      Main_Thing_On_Mind: main_thing_on_mind.trim(),
      Committed_To: committed_to.trim(),
      Did_Well: did_well.trim(),
      Improve: improve.trim(),
      Concern: concern.trim(),
      Submitted_At: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, checkinId: dup.Checkin_ID });
  }

  const seq = await getNextSeq("Weekly_Checkins");
  const checkinId = generateId("CHK", seq);

  await appendRowByFields("Weekly_Checkins", {
    Checkin_ID: checkinId,
    Manager_ID: session.userId,
    Employee_ID: employee_id,
    Week_Start_Date: week,
    Main_Thing_On_Mind: main_thing_on_mind.trim(),
    Committed_To: committed_to.trim(),
    Did_Well: did_well.trim(),
    Improve: improve.trim(),
    Concern: concern.trim(),
    Submitted_At: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, checkinId }, { status: 201 });
}
