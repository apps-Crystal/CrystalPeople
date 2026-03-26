import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import { parseConfigRows, monthLabel } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import type { ReviewCycle, Employee } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { cycle_id } = body;
  if (!cycle_id) return NextResponse.json({ error: "cycle_id is required" }, { status: 400 });

  const cycles = await readSheet("Review_Cycles") as unknown as ReviewCycle[];
  const cycle = cycles.find(c => c.Cycle_ID === cycle_id);
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

  if (cycle.Employee_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: not your review cycle" }, { status: 403 });
  }

  if (cycle.Status === "acknowledged" || cycle.Status === "locked") {
    return NextResponse.json({ error: "Already acknowledged" }, { status: 400 });
  }
  if (cycle.Status !== "manager_scored") {
    return NextResponse.json({ error: "Review has not been scored by manager yet" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await updateRowWhere("Review_Cycles", "Cycle_ID", cycle_id, {
    Status: "acknowledged",
    Acknowledged_At: now,
  });
  invalidateCache("Review_Cycles");

  // Notify the employee's manager that acknowledgement is done
  const [employees, configRows] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Config") as Promise<{ Key: string; Value: string }[]>,
  ]);
  const employee = employees.find(e => e.Employee_ID === cycle.Employee_ID);
  const config = parseConfigRows(configRows);
  const label = monthLabel(config.current_month, config.current_year);
  if (employee?.Manager_ID) {
    void createNotification(
      employee.Manager_ID,
      "manual",
      `${employee.Name} has acknowledged their ${label} review.`
    );
  }

  return NextResponse.json({ cycle: { ...cycle, Status: "acknowledged", Acknowledged_At: now } });
}
