import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import type { Task } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/tasks/[id] ────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { task_description, target, status } = body;

  const allTasks = await readSheet("Tasks") as unknown as Task[];
  const task = allTasks.find(t => t.Task_ID === id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Only the manager who owns the task, hr, or md can update
  const canEdit =
    session.role === "hr" ||
    session.role === "md" ||
    (session.role === "manager" && task.Manager_ID === session.userId);

  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updates: Record<string, string> = { Updated_At: new Date().toISOString() };

  if (task_description !== undefined) {
    if (task_description.trim().length < 10) {
      return NextResponse.json({ error: "Task description must be at least 10 characters" }, { status: 400 });
    }
    updates.Task_Description = task_description.trim();
  }
  if (target !== undefined) {
    if (target.trim().length < 5) {
      return NextResponse.json({ error: "Target must be at least 5 characters" }, { status: 400 });
    }
    updates.Target = target.trim();
  }
  if (status !== undefined) {
    if (status !== "active" && status !== "inactive") {
      return NextResponse.json({ error: "Status must be active or inactive" }, { status: 400 });
    }
    updates.Status = status;
  }

  await updateRowWhere("Tasks", "Task_ID", id, updates);
  invalidateCache("Tasks");

  const refreshed = await readSheet("Tasks") as unknown as Task[];
  const updated = refreshed.find(t => t.Task_ID === id) ?? { ...task, ...updates };
  return NextResponse.json({ task: updated });
}
