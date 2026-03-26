import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import type { ReviewCycle } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden: hr or md only" }, { status: 403 });
  }

  const body = await req.json();
  const { month, year } = body as { month: number; year: number };
  if (!month || !year) return NextResponse.json({ error: "month and year are required" }, { status: 400 });

  const cycles = await readSheet("Review_Cycles") as unknown as ReviewCycle[];
  const eligible = (cycles as ReviewCycle[]).filter(
    c =>
      c.Month === String(month) &&
      c.Year === String(year) &&
      (c.Status === "acknowledged" || c.Status === "manager_scored")
  );

  let locked_count = 0;
  const skipped_count = (cycles as ReviewCycle[]).filter(
    c => c.Month === String(month) && c.Year === String(year)
  ).length - eligible.length;

  for (const cycle of eligible) {
    await updateRowWhere("Review_Cycles", "Cycle_ID", cycle.Cycle_ID, { Status: "locked" });
    locked_count++;
  }

  if (locked_count > 0) {
    invalidateCache("Review_Cycles");
  }

  return NextResponse.json({ locked_count, skipped_count });
}
