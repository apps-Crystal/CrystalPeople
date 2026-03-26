import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  cachedReadSheet, appendRowByFields, getNextSeq, generateId, invalidateCache,
} from "@/lib/sheets";
import type { Employee, Grievance } from "@/lib/types";

// ─── GET /api/grievances ──────────────────────────────────────────────────────
// Employees see own, managers see their reports', HR/MD see all
// ?status= optional filter

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status");

  const [employees, grievances] = await Promise.all([
    cachedReadSheet("Employees") as unknown as Promise<Employee[]>,
    cachedReadSheet("Grievances") as unknown as Promise<Grievance[]>,
  ]);

  let filtered = grievances as Grievance[];

  if (session.role === "employee") {
    filtered = filtered.filter(g => g.Employee_ID === session.userId);
  } else if (session.role === "manager") {
    const reports = (employees as Employee[])
      .filter(e => e.Manager_ID === session.userId && e.Status === "active")
      .map(e => e.Employee_ID);
    // Managers see their own and their reports'
    filtered = filtered.filter(g => g.Employee_ID === session.userId || reports.includes(g.Employee_ID));
  }
  // hr/md see all (no filter)

  if (statusFilter) {
    filtered = filtered.filter(g => g.Status === statusFilter);
  }

  // Sort by filed date descending
  filtered = [...filtered].sort(
    (a, b) => new Date(b.Filed_At).getTime() - new Date(a.Filed_At).getTime()
  );

  // Enrich with employee name for manager/hr/md
  if (session.role !== "employee") {
    const empMap = new Map((employees as Employee[]).map(e => [e.Employee_ID, e]));
    const enriched = filtered.map(g => ({
      ...g,
      employeeName: empMap.get(g.Employee_ID)?.Name ?? g.Employee_ID,
      department: empMap.get(g.Employee_ID)?.Department ?? "",
    }));
    return NextResponse.json({ grievances: enriched });
  }

  return NextResponse.json({ grievances: filtered });
}

// ─── POST /api/grievances ─────────────────────────────────────────────────────
// Any logged-in user can file a grievance

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subject, description, category } = body as {
    subject: string;
    description: string;
    category: string;
  };

  if (!subject || subject.trim().length < 10) {
    return NextResponse.json({ error: "Subject must be at least 10 characters" }, { status: 400 });
  }
  if (!description || description.trim().length < 20) {
    return NextResponse.json({ error: "Description must be at least 20 characters" }, { status: 400 });
  }
  const validCategories = ["workplace", "harassment", "policy", "compensation", "other"];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const seq = await getNextSeq("Grievances");
    const grievanceId = generateId("GRV", seq);

    await appendRowByFields("Grievances", {
      Grievance_ID: grievanceId,
      Employee_ID: session.userId,
      Subject: subject.trim(),
      Description: description.trim(),
      Category: category,
      Status: "submitted",
      Filed_At: new Date().toISOString(),
      Reviewed_By: "",
      Resolution_Notes: "",
      Resolved_At: "",
    });

    invalidateCache("Grievances");

    return NextResponse.json({ success: true, grievanceId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/grievances]", err);
    return NextResponse.json({ error: "Failed to file grievance. Check SEQUENCES sheet." }, { status: 500 });
  }
}
