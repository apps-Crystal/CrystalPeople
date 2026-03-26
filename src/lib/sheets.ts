import { google } from "googleapis";
import { getSheetColumns, getUnknownFields } from "./sheet-schema";

// ─── Google Sheets client ────────────────────────────────────────────────────

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error("Missing Google service account credentials in env");
  }

  return new google.auth.GoogleAuth({
    credentials: { private_key: privateKey, client_email: clientEmail },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID in env");
  return id;
}

async function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

// ─── Cache (for Config + Employees roster) ──────────────────────────────────

interface CacheEntry {
  data: Record<string, string>[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function cachedReadSheet(
  sheetName: string,
  ttlMs = 60_000
): Promise<Record<string, string>[]> {
  const now = Date.now();
  const entry = cache.get(sheetName);
  if (entry && entry.expiresAt > now) return entry.data;
  const data = await readSheet(sheetName);
  cache.set(sheetName, { data, expiresAt: now + ttlMs });
  return data;
}

export function invalidateCache(sheetName: string) {
  cache.delete(sheetName);
}

// ─── Core Read / Write ───────────────────────────────────────────────────────

export async function readSheet(
  sheetName: string
): Promise<Record<string, string>[]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0] as string[];
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (row[i] as string) ?? "";
    });
    return record;
  });
}

export async function appendRowByFields(
  sheetName: string,
  fields: Record<string, string>
): Promise<void> {
  const unknown = getUnknownFields(sheetName, fields);
  if (unknown.length > 0) {
    throw new Error(
      `Unknown fields for sheet "${sheetName}": ${unknown.join(", ")}`
    );
  }

  const columns = getSheetColumns(sheetName);
  const row = columns.map((col) => fields[col] ?? "");

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
}

export async function appendBatchRows(
  sheetName: string,
  rows: Record<string, string>[]
): Promise<void> {
  if (rows.length === 0) return;
  const columns = getSheetColumns(sheetName);
  const values = rows.map((fields) => columns.map((col) => fields[col] ?? ""));

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: sheetName,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export async function updateRowWhere(
  sheetName: string,
  matchCol: string,
  matchVal: string,
  updates: Record<string, string>
): Promise<boolean> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return false;

  const headers = rows[0] as string[];
  const matchIdx = headers.indexOf(matchCol);
  if (matchIdx === -1) return false;

  const rowIndex = rows.findIndex(
    (row, i) => i > 0 && (row[matchIdx] as string) === matchVal
  );
  if (rowIndex === -1) return false;

  const row = [...(rows[rowIndex] as string[])];
  for (const [key, value] of Object.entries(updates)) {
    const colIdx = headers.indexOf(key);
    if (colIdx !== -1) row[colIdx] = value;
  }

  // rowIndex is 1-based in Sheets (row 1 is header, rowIndex from findIndex is 0-based array index)
  const sheetRowNumber = rowIndex + 1; // +1 because findIndex result is 0-based in the array including header
  const range = `${sheetName}!A${sheetRowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  return true;
}

export async function updateAllRowsWhere(
  sheetName: string,
  matchCol: string,
  matchVal: string,
  updates: Record<string, string>
): Promise<number> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) return 0;

  const headers = rows[0] as string[];
  const matchIdx = headers.indexOf(matchCol);
  if (matchIdx === -1) return 0;

  const updateRequests: { range: string; values: string[][] }[] = [];

  rows.forEach((row, i) => {
    if (i === 0) return;
    if ((row[matchIdx] as string) !== matchVal) return;

    const updatedRow = [...(row as string[])];
    for (const [key, value] of Object.entries(updates)) {
      const colIdx = headers.indexOf(key);
      if (colIdx !== -1) updatedRow[colIdx] = value;
    }
    updateRequests.push({ range: `${sheetName}!A${i + 1}`, values: [updatedRow] });
  });

  if (updateRequests.length === 0) return 0;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: updateRequests,
    },
  });

  return updateRequests.length;
}

// ─── Sequence / ID generation ─────────────────────────────────────────────

export async function getNextSeq(sheetName: string): Promise<number> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "SEQUENCES",
  });

  const rows = res.data.values ?? [];
  if (rows.length < 2) throw new Error("SEQUENCES sheet not initialized");

  const headers = rows[0] as string[];
  const nameIdx = headers.indexOf("SHEET_NAME");
  const seqIdx = headers.indexOf("LAST_SEQ");

  const rowIndex = rows.findIndex(
    (row, i) => i > 0 && (row[nameIdx] as string) === sheetName
  );
  if (rowIndex === -1)
    throw new Error(`No sequence row found for sheet: ${sheetName}`);

  const current = parseInt((rows[rowIndex][seqIdx] as string) ?? "0", 10);
  const next = current + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `SEQUENCES!B${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [[String(next)]] },
  });

  return next;
}

export async function getNextSeqBatch(
  sheetName: string,
  count: number
): Promise<number[]> {
  if (count <= 0) return [];
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "SEQUENCES",
  });

  const rows = res.data.values ?? [];
  const headers = rows[0] as string[];
  const nameIdx = headers.indexOf("SHEET_NAME");
  const seqIdx = headers.indexOf("LAST_SEQ");

  const rowIndex = rows.findIndex(
    (row, i) => i > 0 && (row[nameIdx] as string) === sheetName
  );
  if (rowIndex === -1)
    throw new Error(`No sequence row found for sheet: ${sheetName}`);

  const current = parseInt((rows[rowIndex][seqIdx] as string) ?? "0", 10);
  const newLast = current + count;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `SEQUENCES!B${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [[String(newLast)]] },
  });

  return Array.from({ length: count }, (_, i) => current + i + 1);
}

export function generateId(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}
