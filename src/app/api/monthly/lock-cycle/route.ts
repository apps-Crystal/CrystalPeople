import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, updateRowWhere, invalidateCache, cachedReadSheet } from "@/lib/sheets";
import { parseConfigRows, monthLabel } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import type { ReviewCycle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden: hr or md only" }, { status: 403 });
  }

  const body = await req.json();
  const { cycle_id } = body as { cycle_id: string };
  if (!cycle_id) return NextResponse.json({ error: "cycle_id is required" }, { status: 400 });

  const cycles = await readSheet("Review_Cycles") as unknown as ReviewCycle[];
  const cycle = cycles.find(c => c.Cycle_ID === cycle_id);
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

  if (cycle.Status !== "manager_scored" && cycle.Status !== "acknowledged") {
    return NextResponse.json(
      { error: "Cycle must be manager_scored or acknowledged to lock" },
      { status: 400 }
    );
  }

  await updateRowWhere("Review_Cycles", "Cycle_ID", cycle_id, { Status: "locked" });
  invalidateCache("Review_Cycles");

  // Notify the employee
  const configRows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(configRows);
  const label = monthLabel(Number(cycle.Month), Number(cycle.Year)) || `${cycle.Month}/${cycle.Year}`;
  const avg = cycle.Locked_Average ? ` with a score of ${Number(cycle.Locked_Average).toFixed(2)}` : "";
  void createNotification(
    cycle.Employee_ID,
    "manual",
    `Your ${label} review has been locked${avg}.`
  ).catch(() => {/* fire and forget */});

  const updatedCycle: ReviewCycle = { ...cycle, Status: "locked" };
  return NextResponse.json({ cycle: updatedCycle });
}
