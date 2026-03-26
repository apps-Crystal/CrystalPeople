/**
 * Setup script: Creates Assignments & Grievances sheets in Google Sheets,
 * adds SEQUENCES rows, and adds Config rows.
 *
 * Run with: npx tsx scripts/setup-new-sheets.ts
 */

import { google } from "googleapis";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")!;

const auth = new google.auth.GoogleAuth({
  credentials: { private_key: PRIVATE_KEY, client_email: SERVICE_ACCOUNT_EMAIL },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ── Sheet definitions ────────────────────────────────────────────────────────

const NEW_SHEETS = [
  {
    title: "Assignments",
    headers: [
      "Assignment_ID", "Employee_ID", "Manager_ID", "Month", "Year",
      "Title", "Description", "Target", "Type", "Status",
      "Drop_Reason", "Self_Score", "Manager_Score", "Created_At",
    ],
  },
  {
    title: "Grievances",
    headers: [
      "Grievance_ID", "Employee_ID", "Subject", "Description", "Category",
      "Status", "Filed_At", "Reviewed_By", "Resolution_Notes", "Resolved_At",
    ],
  },
];

const SEQUENCE_ROWS = [
  ["Assignments", "0"],
  ["Grievances", "0"],
];

const CONFIG_ROWS = [
  ["self_score_window", "last_week"],
  ["manager_score_window", "first_week_next"],
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getExistingSheetNames(): Promise<string[]> {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return (res.data.sheets ?? []).map((s) => s.properties?.title ?? "");
}

async function createSheetTab(title: string): Promise<void> {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
  console.log(`  ✅ Created sheet tab: "${title}"`);
}

async function writeHeaders(sheetName: string, headers: string[]): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
  console.log(`  ✅ Wrote ${headers.length} headers to "${sheetName}"`);
}

async function appendRows(sheetName: string, rows: string[][]): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

async function checkExistingRows(
  sheetName: string,
  keyCol: number,
  keysToCheck: string[]
): Promise<Set<string>> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  const rows = res.data.values ?? [];
  const existingKeys = new Set<string>();
  rows.forEach((row, i) => {
    if (i === 0) return; // skip header
    const key = (row[keyCol] as string) ?? "";
    if (keysToCheck.includes(key)) existingKeys.add(key);
  });
  return existingKeys;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔧 Crystal People — Sheet Setup Script\n");
  console.log(`📄 Spreadsheet: ${SPREADSHEET_ID}\n`);

  const existing = await getExistingSheetNames();
  console.log(`📋 Existing sheets: ${existing.join(", ")}\n`);

  // 1. Create new sheet tabs + headers
  for (const sheet of NEW_SHEETS) {
    if (existing.includes(sheet.title)) {
      console.log(`  ⏭️  Sheet "${sheet.title}" already exists — skipping creation`);
      // Still check headers
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheet.title}!1:1`,
      });
      const currentHeaders = (res.data.values?.[0] as string[]) ?? [];
      if (currentHeaders.length === 0) {
        await writeHeaders(sheet.title, sheet.headers);
      } else {
        console.log(`  ✅ "${sheet.title}" already has ${currentHeaders.length} headers`);
      }
    } else {
      await createSheetTab(sheet.title);
      await writeHeaders(sheet.title, sheet.headers);
    }
  }

  // 2. Add SEQUENCES rows (skip if already exist)
  console.log("\n📊 Adding SEQUENCES rows...");
  const existingSeqKeys = await checkExistingRows(
    "SEQUENCES",
    0, // SHEET_NAME is column A (index 0)
    SEQUENCE_ROWS.map((r) => r[0])
  );

  const newSeqRows = SEQUENCE_ROWS.filter((r) => !existingSeqKeys.has(r[0]));
  if (newSeqRows.length > 0) {
    await appendRows("SEQUENCES", newSeqRows);
    newSeqRows.forEach((r) => console.log(`  ✅ Added sequence: ${r[0]} = ${r[1]}`));
  } else {
    console.log("  ⏭️  All SEQUENCES rows already exist");
  }

  // 3. Add Config rows (skip if already exist)
  console.log("\n⚙️  Adding Config rows...");
  const existingConfigKeys = await checkExistingRows(
    "Config",
    0, // Key is column A (index 0)
    CONFIG_ROWS.map((r) => r[0])
  );

  const newConfigRows = CONFIG_ROWS.filter((r) => !existingConfigKeys.has(r[0]));
  if (newConfigRows.length > 0) {
    await appendRows("Config", newConfigRows);
    newConfigRows.forEach((r) => console.log(`  ✅ Added config: ${r[0]} = ${r[1]}`));
  } else {
    console.log("  ⏭️  All Config rows already exist");
  }

  console.log("\n✨ Setup complete!\n");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
