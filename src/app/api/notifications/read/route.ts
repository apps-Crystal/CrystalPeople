import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet, updateRowWhere } from "@/lib/sheets";
import type { Notification } from "@/lib/types";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { notification_ids } = body as { notification_ids: string[] };
  if (!notification_ids?.length) return NextResponse.json({ error: "notification_ids is required" }, { status: 400 });

  const rows = await readSheet("Notifications") as unknown as Notification[];

  let updated = 0;
  for (const id of notification_ids) {
    const notif = (rows as Notification[]).find(n => n.Notification_ID === id);
    if (!notif || notif.Employee_ID !== session.userId) continue;
    await updateRowWhere("Notifications", "Notification_ID", id, { Status: "read" });
    updated++;
  }

  return NextResponse.json({ updated });
}
