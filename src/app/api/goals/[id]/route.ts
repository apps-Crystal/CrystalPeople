import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, cachedReadSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import type { Goal, Employee, ReviewCycle } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/goals/[id] ────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, target, status, drop_reason } = body;

  const allGoals = await readSheet("Goals") as unknown as Goal[];
  const goal = allGoals.find(g => g.Goal_ID === id);
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  // Authorization: employee who owns goal, their manager, hr, or md
  const canEdit =
    session.role === "hr" ||
    session.role === "md" ||
    goal.Employee_ID === session.userId ||
    (session.role === "manager" && goal.Manager_ID === session.userId);

  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check if goal belongs to a locked cycle
  const cycles = await readSheet("Review_Cycles") as unknown as ReviewCycle[];
  const lockedCycle = cycles.find(
    c =>
      c.Employee_ID === goal.Employee_ID &&
      c.Month === goal.Month &&
      c.Year === goal.Year &&
      c.Status === "locked"
  );
  if (lockedCycle) {
    return NextResponse.json({ error: "Cannot edit goals in a locked review cycle" }, { status: 400 });
  }

  // Validate status change
  if (status === "dropped") {
    if (!drop_reason || drop_reason.trim().length < 10) {
      return NextResponse.json({ error: "Drop reason must be at least 10 characters" }, { status: 400 });
    }
  }

  const updates: Record<string, string> = {};
  if (title !== undefined) {
    if (title.trim().length < 5) return NextResponse.json({ error: "Title must be at least 5 characters" }, { status: 400 });
    updates.Title = title.trim();
  }
  if (description !== undefined) {
    if (description.trim().length < 10) return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    updates.Description = description.trim();
  }
  if (target !== undefined) updates.Target = target.trim();
  if (status !== undefined) updates.Status = status;
  if (drop_reason !== undefined) updates.Drop_Reason = drop_reason.trim();

  await updateRowWhere("Goals", "Goal_ID", id, updates);
  invalidateCache("Goals");

  // Return updated goal
  const refreshed = await readSheet("Goals") as unknown as Goal[];
  const updated = refreshed.find(g => g.Goal_ID === id) ?? { ...goal, ...updates };
  return NextResponse.json({ goal: updated });
}

// ─── DELETE /api/goals/[id] ───────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden: only HR and MD can delete goals" }, { status: 403 });
  }

  const { id } = await params;
  const allGoals = await readSheet("Goals") as unknown as Goal[];
  const goal = allGoals.find(g => g.Goal_ID === id);
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  if (goal.Self_Score || goal.Manager_Score) {
    return NextResponse.json({ error: "Cannot delete a goal that has been scored" }, { status: 400 });
  }

  // Mark as dropped (Google Sheets doesn't support row deletion easily — use status="dropped")
  await updateRowWhere("Goals", "Goal_ID", id, { Status: "dropped", Drop_Reason: "Deleted by HR/MD" });
  invalidateCache("Goals");

  return NextResponse.json({ success: true });
}
