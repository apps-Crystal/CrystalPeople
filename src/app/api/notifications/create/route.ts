import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import type { NotificationType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden: hr or md only" }, { status: 403 });
  }

  const body = await req.json();
  const { employee_id, type, message } = body as {
    employee_id: string;
    type: NotificationType;
    message: string;
  };

  if (!employee_id || !type || !message) {
    return NextResponse.json({ error: "employee_id, type, and message are required" }, { status: 400 });
  }

  await createNotification(employee_id, type, message);
  return NextResponse.json({ ok: true });
}
