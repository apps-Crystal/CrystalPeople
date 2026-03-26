import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cachedReadSheet, updateRowWhere, invalidateCache } from "@/lib/sheets";
import { createNotification } from "@/lib/notifications";
import type { Grievance } from "@/lib/types";

// ─── PATCH /api/grievances/[id] ───────────────────────────────────────────────
// Only HR/MD can update grievance status / add resolution notes

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden: only HR or MD can update grievances" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const grievances = await cachedReadSheet("Grievances") as unknown as Grievance[];
  const grievance = grievances.find(g => g.Grievance_ID === id);
  if (!grievance) return NextResponse.json({ error: "Grievance not found" }, { status: 404 });

  const validStatuses = ["in_review", "resolved", "closed"];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: `Status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const updates: Record<string, string> = {
    Status: body.status,
    Reviewed_By: session.userId,
    Resolution_Notes: (body.resolution_notes ?? "").trim(),
  };

  if (body.status === "resolved") {
    updates.Resolved_At = new Date().toISOString();
  }

  await updateRowWhere("Grievances", "Grievance_ID", id, updates);
  invalidateCache("Grievances");

  // Notify employee on status change
  const statusMessages: Record<string, string> = {
    in_review: "Your grievance is now under review by HR.",
    resolved: "Your grievance has been resolved. Please check the resolution notes.",
    closed: "Your grievance has been closed.",
  };
  const msg = statusMessages[body.status];
  if (msg) {
    void createNotification(grievance.Employee_ID, "manual", msg);
  }

  return NextResponse.json({ success: true });
}
