import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cachedReadSheet, updateRowWhere, appendRowByFields, invalidateCache, readSheet } from "@/lib/sheets";
import { parseConfigRows } from "@/lib/utils";

// GET /api/config — returns current ConfigMap (any authenticated user)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await cachedReadSheet("Config") as { Key: string; Value: string }[];
  const config = parseConfigRows(rows);
  return NextResponse.json({ config });
}

// POST /api/config — update a config value (hr and md only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "hr" && session.role !== "md") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined || value === null) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  // Check if key exists — update or insert
  const rows = await readSheet("Config") as { Key: string; Value: string }[];
  const existing = rows.find(r => r.Key === key);

  if (existing) {
    await updateRowWhere("Config", "Key", key, { Value: String(value) });
  } else {
    await appendRowByFields("Config", { Key: key, Value: String(value) });
  }

  invalidateCache("Config");

  const updated = await cachedReadSheet("Config", 0) as { Key: string; Value: string }[];
  const config = parseConfigRows(updated);
  return NextResponse.json({ config });
}
