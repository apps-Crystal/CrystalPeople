import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cachedReadSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import type { Assignment } from "@/lib/types";

// ─── PATCH /api/assignments/[id] ─────────────────────────────────────────────
// Managers/HR/MD: full edit (title, description, target, due_date, status, drop)
// Employees: can only update progress_note + mark completed on their OWN assignments

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const assignments = await cachedReadSheet("Assignments") as unknown as Assignment[];
  const assignment = assignments.find(a => a.Assignment_ID === id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const isEmployee = session.role === "employee";

  // Employees can only update their own assignments
  if (isEmployee && assignment.Employee_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: not your assignment" }, { status: 403 });
  }

  // Managers can only edit assignments they manage
  if (session.role === "manager" && assignment.Manager_ID !== session.userId) {
    return NextResponse.json({ error: "Forbidden: not your assignment" }, { status: 403 });
  }

  const updates: Record<string, string> = {};

  if (isEmployee) {
    // Employees: only progress_note and marking completed
    if (body.progress_note !== undefined) {
      updates.Progress_Note = body.progress_note.trim();
    }
    if (body.status !== undefined) {
      if (body.status !== "completed") {
        return NextResponse.json({ error: "Employees can only mark assignments as completed" }, { status: 403 });
      }
      updates.Status = "completed";
      updates.Completed_At = new Date().toISOString();
    }
  } else {
    // Managers / HR / MD: full edit
    if (body.title !== undefined) {
      if (body.title.trim().length < 3) return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 });
      updates.Title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (body.description.trim().length < 5) return NextResponse.json({ error: "Description must be at least 5 characters" }, { status: 400 });
      updates.Description = body.description.trim();
    }
    if (body.target !== undefined) {
      if (body.target.trim().length < 3) return NextResponse.json({ error: "Target must be at least 3 characters" }, { status: 400 });
      updates.Target = body.target.trim();
    }
    if (body.status !== undefined) {
      if (!["active", "completed", "dropped"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.Status = body.status;
      if (body.status === "completed") {
        updates.Completed_At = new Date().toISOString();
      }
      if (body.status === "dropped") {
        if (!body.drop_reason || body.drop_reason.trim().length < 5) {
          return NextResponse.json({ error: "Drop reason is required (min 5 characters)" }, { status: 400 });
        }
        updates.Drop_Reason = body.drop_reason.trim();
      }
    }
    if (body.due_date !== undefined) {
      updates.Due_Date = body.due_date.trim();
    }
    if (body.progress_note !== undefined) {
      updates.Progress_Note = body.progress_note.trim();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await updateRowWhere("Assignments", "Assignment_ID", id, updates);
  invalidateCache("Assignments");

  return NextResponse.json({ success: true });
}
