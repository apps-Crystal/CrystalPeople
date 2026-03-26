import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readSheet } from "@/lib/sheets";
import type { Notification } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const limit = Number(searchParams.get("limit") ?? "20");

  const rows = await readSheet("Notifications") as unknown as Notification[];
  const mine = (rows as Notification[])
    .filter(n => n.Employee_ID === session.userId)
    .sort((a, b) => new Date(b.Created_At).getTime() - new Date(a.Created_At).getTime())
    .slice(0, limit);

  const unread_count = mine.filter(n => n.Status !== "read").length;

  return NextResponse.json({ notifications: mine, unread_count });
}
