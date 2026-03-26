import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validateReviewNotes } from "@/lib/ai-review";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { review_notes, employee_name } = body;

  if (!review_notes || typeof review_notes !== "string") {
    return NextResponse.json({ error: "review_notes is required" }, { status: 400 });
  }

  const result = validateReviewNotes(review_notes, employee_name ?? "");
  return NextResponse.json(result);
}
