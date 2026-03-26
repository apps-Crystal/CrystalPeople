/**
 * Seed script — run once to:
 * 1. Initialize all 11 sheets with header rows
 * 2. Seed the Config sheet with default values
 * 3. Seed the SEQUENCES sheet
 * 4. Create the first HR admin user
 *
 * Usage:
 *   cp .env.local.example .env.local  (fill in your values)
 *   node scripts/seed-admin.mjs
 */

import { config } from "dotenv";
import { google } from "googleapis";
import crypto from "crypto";

config({ path: ".env.local" });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error("Missing required env vars. Copy .env.local.example to .env.local and fill in values.");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: { private_key: PRIVATE_KEY, client_email: SERVICE_ACCOUNT_EMAIL },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// ─── Sheet schemas ───────────────────────────────────────────────────────────

const SHEET_HEADERS = {
  Employees: ["Employee_ID","Name","Email","Password_Hash","Mobile","Department","Role","Employee_Type","Manager_ID","Join_Date","Status","First_Login_Done"],
  Managers: ["Manager_ID","Employee_ID"],
  Review_Cycles: ["Cycle_ID","Employee_ID","Month","Year","Self_Scores","Manager_Scores","Self_Comments","Manager_Comments","Review_Notes","Next_Month_Focus","Status","Acknowledged_At","Flagged_Dimensions","AI_Note_Flag","Locked_Average"],
  Goals: ["Goal_ID","Employee_ID","Manager_ID","Month","Year","Title","Description","Target","Status","Drop_Reason","Self_Score","Manager_Score","Created_At"],
  Tasks: ["Task_ID","Employee_ID","Manager_ID","Task_Description","Target","Status","Monthly_Scores","Created_At","Updated_At"],
  Weekly_Reflections: ["Reflection_ID","Employee_ID","Week_Start_Date","Accomplishments","Next_Week_Plan","Blockers","Mood","Submitted_At","Acknowledged_At"],
  Weekly_Checkins: ["Checkin_ID","Manager_ID","Employee_ID","Week_Start_Date","Main_Thing_On_Mind","Committed_To","Did_Well","Improve","Concern","Submitted_At"],
  Org_Changes: ["Change_ID","Changed_By","Employee_ID","Field_Changed","Old_Value","New_Value","Changed_At"],
  Notifications: ["Notification_ID","Employee_ID","Type","Message","Status","Created_At","Sent_At"],
  Config: ["Key","Value"],
  SEQUENCES: ["SHEET_NAME","LAST_SEQ"],
};

const CONFIG_DEFAULTS = [
  ["current_month", "3"],
  ["current_year", "2026"],
  ["window_open_day", "1"],
  ["window_close_day", "11"],
  ["reminder_day_1", "3"],
  ["reminder_day_2", "6"],
  ["hr_visibility_day", "7"],
  ["md_visibility_day", "10"],
  ["min_goals", "3"],
  ["max_goals", "5"],
];

const SEQUENCE_SHEETS = [
  "Employees","Review_Cycles","Goals","Tasks",
  "Weekly_Reflections","Weekly_Checkins","Org_Changes","Notifications"
];

// ─── Password hashing ────────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getSheetNames() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return res.data.sheets.map((s) => s.properties.title);
}

async function createSheet(title) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
  console.log(`  Created sheet: ${title}`);
}

async function writeHeaders(sheetName, headers) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
}

async function appendRows(sheetName, rows) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔧 Crystal People — Seed Script\n");

  // 1. Create missing sheets
  console.log("Step 1: Creating sheets...");
  const existing = await getSheetNames();
  for (const [name, headers] of Object.entries(SHEET_HEADERS)) {
    if (!existing.includes(name)) {
      await createSheet(name);
      await writeHeaders(name, headers);
    } else {
      console.log(`  Sheet already exists: ${name}`);
    }
  }

  // 2. Seed Config
  console.log("\nStep 2: Seeding Config...");
  const configRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Config",
  });
  const configRows = configRes.data.values ?? [];
  if (configRows.length <= 1) {
    await appendRows("Config", CONFIG_DEFAULTS);
    console.log("  Config seeded with defaults.");
  } else {
    console.log("  Config already has data — skipping.");
  }

  // 3. Seed SEQUENCES
  console.log("\nStep 3: Seeding SEQUENCES...");
  const seqRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "SEQUENCES",
  });
  const seqRows = seqRes.data.values ?? [];
  if (seqRows.length <= 1) {
    await appendRows("SEQUENCES", SEQUENCE_SHEETS.map((s) => [s, "0"]));
    console.log("  SEQUENCES seeded.");
  } else {
    console.log("  SEQUENCES already has data — skipping.");
  }

  // 4. Create first HR admin
  console.log("\nStep 4: Creating first HR admin user...");
  const empRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Employees",
  });
  const empRows = empRes.data.values ?? [];

  // Check if any HR user exists
  const hasHR = empRows.slice(1).some((row) => row[6] === "hr");
  if (hasHR) {
    console.log("  HR user already exists — skipping.");
  } else {
    const password = "CrystalHR@2026";
    const hash = hashPassword(password);
    const now = new Date().toISOString();
    const adminRow = [
      "EMP-0001",          // Employee_ID
      "HR Administrator",  // Name
      "hr@crystalgroup.com", // Email
      hash,                // Password_Hash
      "",                  // Mobile
      "HR",                // Department
      "hr",                // Role
      "white_collar",      // Employee_Type
      "",                  // Manager_ID
      now.split("T")[0],   // Join_Date
      "active",            // Status
      "FALSE",             // First_Login_Done
    ];
    await appendRows("Employees", [adminRow]);

    // Update SEQUENCES for Employees to start from 1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "SEQUENCES!B2",
      valueInputOption: "RAW",
      requestBody: { values: [["1"]] },
    });

    console.log("  ✅ HR admin created!");
    console.log("     Email:    hr@crystalgroup.com");
    console.log(`     Password: ${password}`);
    console.log("     ⚠️  Change this password immediately after first login.");
  }

  console.log("\n✅ Seed complete! Your Crystal People spreadsheet is ready.\n");
  console.log("Next steps:");
  console.log("  1. Open your Google Sheet and verify all 11 sheets are created");
  console.log("  2. npm install && npm run dev");
  console.log("  3. Login with hr@crystalgroup.com / CrystalHR@2026");
  console.log("  4. Add employees via the Admin panel\n");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
