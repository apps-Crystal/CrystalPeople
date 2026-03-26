module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/(dashboard)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COOKIE_NAME",
    ()=>COOKIE_NAME,
    "generateResetToken",
    ()=>generateResetToken,
    "getSession",
    ()=>getSession,
    "hashPassword",
    ()=>hashPassword,
    "isResetTokenExpired",
    ()=>isResetTokenExpired,
    "resetTokenExpiry",
    ()=>resetTokenExpiry,
    "sessionCookieOptions",
    ()=>sessionCookieOptions,
    "signJwt",
    ()=>signJwt,
    "verifyJwt",
    ()=>verifyJwt,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/sign.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
const COOKIE_NAME = "cp_session";
const JWT_EXPIRY = "10h";
function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");
    return new TextEncoder().encode(secret);
}
async function signJwt(payload) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SignJWT"]({
        ...payload
    }).setProtectedHeader({
        alg: "HS256"
    }).setIssuedAt().setExpirationTime(JWT_EXPIRY).sign(getSecret());
}
async function verifyJwt(token) {
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jwtVerify"])(token, getSecret());
        return payload;
    } catch  {
        return null;
    }
}
function hashPassword(password) {
    const salt = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(16).toString("hex");
    const hash = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].scryptSync(password, salt, 64).toString("hex");
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}
function sessionCookieOptions(maxAge = 10 * 60 * 60) {
    return {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === "production",
        sameSite: "lax",
        path: "/",
        maxAge
    };
}
async function getSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJwt(token);
}
function generateResetToken() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString("hex");
}
function resetTokenExpiry() {
    return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}
function isResetTokenExpired(expiry) {
    if (!expiry || expiry === "USED") return true;
    return new Date(expiry) < new Date();
}
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[project]/src/lib/sheet-schema.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Single source of truth for all Google Sheets column definitions.
// All writes validate against this schema before touching the spreadsheet.
__turbopack_context__.s([
    "SHEET_SCHEMA",
    ()=>SHEET_SCHEMA,
    "getMissingFields",
    ()=>getMissingFields,
    "getSheetColumns",
    ()=>getSheetColumns,
    "getUnknownFields",
    ()=>getUnknownFields,
    "isKnownSheet",
    ()=>isKnownSheet
]);
const SHEET_SCHEMA = {
    Employees: [
        "Employee_ID",
        "Name",
        "Email",
        "Password_Hash",
        "Mobile",
        "Department",
        "Role",
        "Employee_Type",
        "Manager_ID",
        "Join_Date",
        "Status",
        "First_Login_Done",
        "Reset_Token",
        "Reset_Token_Expiry"
    ],
    Managers: [
        "Manager_ID",
        "Employee_ID"
    ],
    Review_Cycles: [
        "Cycle_ID",
        "Employee_ID",
        "Month",
        "Year",
        "Self_Scores",
        "Manager_Scores",
        "Self_Comments",
        "Manager_Comments",
        "Review_Notes",
        "Next_Month_Focus",
        "Status",
        "Acknowledged_At",
        "Flagged_Dimensions",
        "AI_Note_Flag",
        "Locked_Average"
    ],
    Goals: [
        "Goal_ID",
        "Employee_ID",
        "Manager_ID",
        "Month",
        "Year",
        "Title",
        "Description",
        "Target",
        "Status",
        "Drop_Reason",
        "Self_Score",
        "Manager_Score",
        "Created_At"
    ],
    Tasks: [
        "Task_ID",
        "Employee_ID",
        "Manager_ID",
        "Task_Description",
        "Target",
        "Status",
        "Monthly_Scores",
        "Created_At",
        "Updated_At"
    ],
    Weekly_Reflections: [
        "Reflection_ID",
        "Employee_ID",
        "Week_Start_Date",
        "Accomplishments",
        "Next_Week_Plan",
        "Blockers",
        "Mood",
        "Submitted_At",
        "Acknowledged_At"
    ],
    Weekly_Checkins: [
        "Checkin_ID",
        "Manager_ID",
        "Employee_ID",
        "Week_Start_Date",
        "Main_Thing_On_Mind",
        "Committed_To",
        "Did_Well",
        "Improve",
        "Concern",
        "Submitted_At"
    ],
    Org_Changes: [
        "Change_ID",
        "Changed_By",
        "Employee_ID",
        "Field_Changed",
        "Old_Value",
        "New_Value",
        "Changed_At"
    ],
    Notifications: [
        "Notification_ID",
        "Employee_ID",
        "Type",
        "Message",
        "Status",
        "Created_At",
        "Sent_At"
    ],
    Config: [
        "Key",
        "Value"
    ],
    SEQUENCES: [
        "SHEET_NAME",
        "LAST_SEQ"
    ]
};
function getSheetColumns(sheetName) {
    return SHEET_SCHEMA[sheetName] ?? [];
}
function isKnownSheet(sheetName) {
    return sheetName in SHEET_SCHEMA;
}
function getMissingFields(sheetName, fields) {
    const required = SHEET_SCHEMA[sheetName] ?? [];
    return required.filter((col)=>!(col in fields));
}
function getUnknownFields(sheetName, fields) {
    const known = new Set(SHEET_SCHEMA[sheetName] ?? []);
    return Object.keys(fields).filter((k)=>!known.has(k));
}
}),
"[project]/src/lib/sheets.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appendBatchRows",
    ()=>appendBatchRows,
    "appendRowByFields",
    ()=>appendRowByFields,
    "cachedReadSheet",
    ()=>cachedReadSheet,
    "generateId",
    ()=>generateId,
    "getNextSeq",
    ()=>getNextSeq,
    "getNextSeqBatch",
    ()=>getNextSeqBatch,
    "invalidateCache",
    ()=>invalidateCache,
    "readSheet",
    ()=>readSheet,
    "updateAllRowsWhere",
    ()=>updateAllRowsWhere,
    "updateRowWhere",
    ()=>updateRowWhere
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/googleapis/build/src/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sheet-schema.ts [app-rsc] (ecmascript)");
;
;
// ─── Google Sheets client ────────────────────────────────────────────────────
function getAuth() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    if (!privateKey || !clientEmail) {
        throw new Error("Missing Google service account credentials in env");
    }
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["google"].auth.GoogleAuth({
        credentials: {
            private_key: privateKey,
            client_email: clientEmail
        },
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    });
}
function getSpreadsheetId() {
    const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!id) throw new Error("Missing GOOGLE_SHEETS_SPREADSHEET_ID in env");
    return id;
}
async function getSheetsClient() {
    const auth = getAuth();
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["google"].sheets({
        version: "v4",
        auth
    });
}
const cache = new Map();
async function cachedReadSheet(sheetName, ttlMs = 60_000) {
    const now = Date.now();
    const entry = cache.get(sheetName);
    if (entry && entry.expiresAt > now) return entry.data;
    const data = await readSheet(sheetName);
    cache.set(sheetName, {
        data,
        expiresAt: now + ttlMs
    });
    return data;
}
function invalidateCache(sheetName) {
    cache.delete(sheetName);
}
async function readSheet(sheetName) {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: sheetName
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map((row)=>{
        const record = {};
        headers.forEach((h, i)=>{
            record[h] = row[i] ?? "";
        });
        return record;
    });
}
async function appendRowByFields(sheetName, fields) {
    const unknown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getUnknownFields"])(sheetName, fields);
    if (unknown.length > 0) {
        throw new Error(`Unknown fields for sheet "${sheetName}": ${unknown.join(", ")}`);
    }
    const columns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSheetColumns"])(sheetName);
    const row = columns.map((col)=>fields[col] ?? "");
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: sheetName,
        valueInputOption: "RAW",
        requestBody: {
            values: [
                row
            ]
        }
    });
}
async function appendBatchRows(sheetName, rows) {
    if (rows.length === 0) return;
    const columns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSheetColumns"])(sheetName);
    const values = rows.map((fields)=>columns.map((col)=>fields[col] ?? ""));
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId: getSpreadsheetId(),
        range: sheetName,
        valueInputOption: "RAW",
        requestBody: {
            values
        }
    });
}
async function updateRowWhere(sheetName, matchCol, matchVal, updates) {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) return false;
    const headers = rows[0];
    const matchIdx = headers.indexOf(matchCol);
    if (matchIdx === -1) return false;
    const rowIndex = rows.findIndex((row, i)=>i > 0 && row[matchIdx] === matchVal);
    if (rowIndex === -1) return false;
    const row = [
        ...rows[rowIndex]
    ];
    for (const [key, value] of Object.entries(updates)){
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
        requestBody: {
            values: [
                row
            ]
        }
    });
    return true;
}
async function updateAllRowsWhere(sheetName, matchCol, matchVal, updates) {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) return 0;
    const headers = rows[0];
    const matchIdx = headers.indexOf(matchCol);
    if (matchIdx === -1) return 0;
    const updateRequests = [];
    rows.forEach((row, i)=>{
        if (i === 0) return;
        if (row[matchIdx] !== matchVal) return;
        const updatedRow = [
            ...row
        ];
        for (const [key, value] of Object.entries(updates)){
            const colIdx = headers.indexOf(key);
            if (colIdx !== -1) updatedRow[colIdx] = value;
        }
        updateRequests.push({
            range: `${sheetName}!A${i + 1}`,
            values: [
                updatedRow
            ]
        });
    });
    if (updateRequests.length === 0) return 0;
    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
            valueInputOption: "RAW",
            data: updateRequests
        }
    });
    return updateRequests.length;
}
async function getNextSeq(sheetName) {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "SEQUENCES"
    });
    const rows = res.data.values ?? [];
    if (rows.length < 2) throw new Error("SEQUENCES sheet not initialized");
    const headers = rows[0];
    const nameIdx = headers.indexOf("SHEET_NAME");
    const seqIdx = headers.indexOf("LAST_SEQ");
    const rowIndex = rows.findIndex((row, i)=>i > 0 && row[nameIdx] === sheetName);
    if (rowIndex === -1) throw new Error(`No sequence row found for sheet: ${sheetName}`);
    const current = parseInt(rows[rowIndex][seqIdx] ?? "0", 10);
    const next = current + 1;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `SEQUENCES!B${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
            values: [
                [
                    String(next)
                ]
            ]
        }
    });
    return next;
}
async function getNextSeqBatch(sheetName, count) {
    if (count <= 0) return [];
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "SEQUENCES"
    });
    const rows = res.data.values ?? [];
    const headers = rows[0];
    const nameIdx = headers.indexOf("SHEET_NAME");
    const seqIdx = headers.indexOf("LAST_SEQ");
    const rowIndex = rows.findIndex((row, i)=>i > 0 && row[nameIdx] === sheetName);
    if (rowIndex === -1) throw new Error(`No sequence row found for sheet: ${sheetName}`);
    const current = parseInt(rows[rowIndex][seqIdx] ?? "0", 10);
    const newLast = current + count;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `SEQUENCES!B${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
            values: [
                [
                    String(newLast)
                ]
            ]
        }
    });
    return Array.from({
        length: count
    }, (_, i)=>current + i + 1);
}
function generateId(prefix, seq) {
    return `${prefix}-${String(seq).padStart(4, "0")}`;
}
}),
"[project]/src/lib/utils.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "computeAverage",
    ()=>computeAverage,
    "fmtDate",
    ()=>fmtDate,
    "fmtDateTime",
    ()=>fmtDateTime,
    "getRatingBand",
    ()=>getRatingBand,
    "getRatingColor",
    ()=>getRatingColor,
    "getRatingDot",
    ()=>getRatingDot,
    "getScoreDimensions",
    ()=>getScoreDimensions,
    "getWeekLabel",
    ()=>getWeekLabel,
    "getWeekStart",
    ()=>getWeekStart,
    "isFriday",
    ()=>isFriday,
    "isWindowOpen",
    ()=>isWindowOpen,
    "monthLabel",
    ()=>monthLabel,
    "parseConfigRows",
    ()=>parseConfigRows,
    "safeJsonParse",
    ()=>safeJsonParse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-rsc] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function fmtDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}
function fmtDateTime(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
}
function isFriday(date = new Date()) {
    return date.getDay() === 5;
}
function getWeekLabel(mondayStr) {
    const monday = new Date(mondayStr + "T00:00:00");
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const opts = {
        month: "short",
        day: "numeric"
    };
    return `Week of ${monday.toLocaleDateString("en-IN", opts)} – ${sunday.toLocaleDateString("en-IN", {
        ...opts,
        year: "numeric"
    })}`;
}
function computeAverage(scores) {
    const valid = scores.filter((s)=>!isNaN(s) && s >= 1 && s <= 5);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((a, b)=>a + b, 0);
    return Math.round(sum / valid.length * 100) / 100;
}
function getRatingBand(avg) {
    if (avg >= 4.5) return "Outstanding";
    if (avg >= 3.5) return "Exceeds Expectation";
    if (avg >= 2.5) return "Meets Expectation";
    if (avg >= 1.5) return "Below Expectation";
    return "Unsatisfactory";
}
function getRatingColor(avg) {
    if (avg >= 4.5) return "text-green-600 bg-green-50";
    if (avg >= 3.5) return "text-teal-600 bg-teal-50";
    if (avg >= 2.5) return "text-blue-600 bg-blue-50";
    if (avg >= 1.5) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
}
function getRatingDot(avg) {
    if (avg >= 4.5) return "bg-green-500";
    if (avg >= 3.5) return "bg-teal-500";
    if (avg >= 2.5) return "bg-blue-500";
    if (avg >= 1.5) return "bg-orange-500";
    return "bg-red-500";
}
function isWindowOpen(role, config, today = new Date()) {
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    if (month !== config.current_month || year !== config.current_year) {
        return false;
    }
    if (role === "employee") {
        return day >= config.window_open_day && day <= config.window_close_day;
    }
    if (role === "manager") {
        return day >= config.window_open_day && day <= config.window_close_day + 3;
    }
    if (role === "hr" || role === "md") {
        return day >= config.window_open_day;
    }
    return false;
}
// ─── Score dimensions builder ─────────────────────────────────────────────────
const BEHAVIOUR_DIMENSIONS = [
    {
        key: "behaviour_attendance",
        label: "Attendance & Punctuality",
        type: "behaviour"
    },
    {
        key: "behaviour_teamwork",
        label: "Teamwork & Collaboration",
        type: "behaviour"
    },
    {
        key: "behaviour_ownership",
        label: "Ownership & Initiative",
        type: "behaviour"
    }
];
function getScoreDimensions(employee, goals, tasks) {
    if (employee.Employee_Type === "white_collar") {
        const goalDims = goals.filter((g)=>g.Status === "active").map((g)=>({
                key: g.Goal_ID,
                label: g.Title,
                type: "goal"
            }));
        return [
            ...goalDims,
            ...BEHAVIOUR_DIMENSIONS
        ];
    } else {
        const taskDims = tasks.filter((t)=>t.Status === "active").map((t)=>({
                key: t.Task_ID,
                label: t.Task_Description,
                type: "task"
            }));
        return [
            ...taskDims,
            ...BEHAVIOUR_DIMENSIONS
        ];
    }
}
function parseConfigRows(rows) {
    const map = {};
    rows.forEach((r)=>map[r.Key] = r.Value);
    return {
        current_month: parseInt(map.current_month ?? "3", 10),
        current_year: parseInt(map.current_year ?? "2026", 10),
        window_open_day: parseInt(map.window_open_day ?? "1", 10),
        window_close_day: parseInt(map.window_close_day ?? "11", 10),
        reminder_day_1: parseInt(map.reminder_day_1 ?? "3", 10),
        reminder_day_2: parseInt(map.reminder_day_2 ?? "6", 10),
        hr_visibility_day: parseInt(map.hr_visibility_day ?? "7", 10),
        md_visibility_day: parseInt(map.md_visibility_day ?? "10", 10),
        min_goals: parseInt(map.min_goals ?? "3", 10),
        max_goals: parseInt(map.max_goals ?? "5", 10)
    };
}
function safeJsonParse(str, fallback) {
    if (!str || str.trim() === "") return fallback;
    try {
        return JSON.parse(str);
    } catch  {
        return fallback;
    }
}
function monthLabel(month, year) {
    return new Date(year, month - 1, 1).toLocaleString("en-GB", {
        month: "long",
        year: "numeric"
    });
}
}),
"[project]/src/components/ui/Badge.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "cycleStatusBadge",
    ()=>cycleStatusBadge,
    "goalStatusBadge",
    ()=>goalStatusBadge,
    "notifStatusBadge",
    ()=>notifStatusBadge,
    "taskStatusBadge",
    ()=>taskStatusBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
;
;
const VARIANT_CLASSES = {
    pending: "bg-warning/10 text-warning border-warning/30",
    active: "bg-primary-50 text-primary-700 border-primary-200",
    locked: "bg-primary-100 text-primary-800 border-primary-300",
    complete: "bg-success/10 text-success border-success/30",
    dropped: "bg-primary-50 text-text-secondary border-border",
    inactive: "bg-primary-50 text-text-secondary border-border",
    self_scored: "bg-primary-100 text-primary-700 border-primary-200",
    manager_scored: "bg-accent-500/10 text-accent-600 border-accent-500/30",
    acknowledged: "bg-success/10 text-success border-success/30",
    sent: "bg-primary-50 text-primary-700 border-primary-200",
    read: "bg-primary-50 text-text-secondary border-border",
    escalation: "bg-danger/10 text-danger border-danger/30",
    default: "bg-primary-50 text-text-secondary border-border"
};
const VARIANT_LABELS = {
    pending: "Pending",
    active: "Active",
    locked: "Locked",
    complete: "Complete",
    dropped: "Dropped",
    inactive: "Inactive",
    self_scored: "Self-Scored",
    manager_scored: "Manager-Scored",
    acknowledged: "Acknowledged",
    sent: "Sent",
    read: "Read",
    escalation: "Escalation",
    default: "—"
};
function Badge({ variant = "default", label, size = "sm", className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("inline-flex items-center font-medium border rounded-sm", size === "sm" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-1", VARIANT_CLASSES[variant], className),
        children: label ?? VARIANT_LABELS[variant]
    }, void 0, false, {
        fileName: "[project]/src/components/ui/Badge.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
function cycleStatusBadge(status) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
        variant: status
    }, void 0, false, {
        fileName: "[project]/src/components/ui/Badge.tsx",
        lineNumber: 53,
        columnNumber: 10
    }, this);
}
function goalStatusBadge(status) {
    const map = {
        active: "active",
        completed: "complete",
        dropped: "dropped"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
        variant: map[status]
    }, void 0, false, {
        fileName: "[project]/src/components/ui/Badge.tsx",
        lineNumber: 57,
        columnNumber: 10
    }, this);
}
function taskStatusBadge(status) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
        variant: status
    }, void 0, false, {
        fileName: "[project]/src/components/ui/Badge.tsx",
        lineNumber: 60,
        columnNumber: 10
    }, this);
}
function notifStatusBadge(status) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
        variant: status
    }, void 0, false, {
        fileName: "[project]/src/components/ui/Badge.tsx",
        lineNumber: 63,
        columnNumber: 10
    }, this);
}
}),
"[project]/src/components/ui/RatingBadge.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RatingBadge",
    ()=>RatingBadge,
    "RatingDot",
    ()=>RatingDot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
;
;
;
function getRatingClass(score) {
    if (score >= 4.5) return "rating-badge-5";
    if (score >= 3.5) return "rating-badge-4";
    if (score >= 2.5) return "rating-badge-3";
    if (score >= 1.5) return "rating-badge-2";
    return "rating-badge-1";
}
const SIZE_CLASSES = {
    sm: "text-[11px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1"
};
function RatingBadge({ score, showLabel = false, size = "sm", className }) {
    if (!score || score === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("rating-badge bg-primary-50 text-text-secondary border border-border", SIZE_CLASSES[size], className),
            children: "—"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/RatingBadge.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("rating-badge", getRatingClass(score), SIZE_CLASSES[size], className),
        children: [
            score.toFixed(1),
            showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-1 font-normal opacity-70 text-[10px]",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRatingBand"])(score)
            }, void 0, false, {
                fileName: "[project]/src/components/ui/RatingBadge.tsx",
                lineNumber: 37,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/RatingBadge.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
function RatingDot({ score }) {
    const dotColor = score >= 4.5 ? "bg-success" : score >= 3.5 ? "bg-primary-600" : score >= 2.5 ? "bg-accent-500" : score >= 1.5 ? "bg-warning" : "bg-danger";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cn"])("inline-block w-2 h-2 rounded-full", dotColor)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/RatingBadge.tsx",
        lineNumber: 50,
        columnNumber: 10
    }, this);
}
}),
"[project]/src/app/(dashboard)/dashboard/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DashboardPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sheets.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/Badge.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$RatingBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/RatingBadge.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/message-square.js [app-rsc] (ecmascript) <export default as MessageSquare>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-rsc] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-rsc] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-rsc] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-rsc] (ecmascript) <export default as CheckCircle>");
;
;
;
;
;
;
;
;
async function DashboardPage() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSession"])();
    if (!session) return null;
    const { role, name, userId } = session;
    const week = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWeekStart"])();
    const [reflections, checkins, employees, configRows, cycles] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readSheet"])("Weekly_Reflections"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readSheet"])("Weekly_Checkins"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readSheet"])("Employees"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cachedReadSheet"])("Config"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["readSheet"])("Review_Cycles")
    ]);
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseConfigRows"])(configRows);
    const curLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["monthLabel"])(config.current_month, config.current_year);
    const curMonth = String(config.current_month);
    const curYear = String(config.current_year);
    const myReflection = reflections.find((r)=>r.Employee_ID === userId && r.Week_Start_Date === week) ?? null;
    const myCheckin = checkins.find((c)=>c.Employee_ID === userId && c.Week_Start_Date === week) ?? null;
    // My monthly cycle
    const myCycle = cycles.find((c)=>c.Employee_ID === userId && c.Month === curMonth && c.Year === curYear) ?? null;
    // Team scoring stats (for managers/hr/md)
    let teamSize = 0, teamReflected = 0, teamCheckedIn = 0;
    let teamScoredCount = 0;
    if (role === "manager" || role === "hr" || role === "md") {
        const team = employees.filter((e)=>role === "manager" ? e.Manager_ID === userId && e.Status === "active" && e.Employee_ID !== userId : e.Status === "active" && e.Employee_ID !== userId);
        teamSize = team.length;
        const reflMap = new Set(reflections.filter((r)=>r.Week_Start_Date === week).map((r)=>r.Employee_ID));
        const chkMap = new Set(checkins.filter((c)=>c.Week_Start_Date === week).map((c)=>c.Employee_ID));
        teamReflected = team.filter((e)=>reflMap.has(e.Employee_ID)).length;
        teamCheckedIn = team.filter((e)=>chkMap.has(e.Employee_ID)).length;
        teamScoredCount = team.filter((e)=>{
            const c = cycles.find((cyc)=>cyc.Employee_ID === e.Employee_ID && cyc.Month === curMonth && cyc.Year === curYear);
            return c && (c.Status === "manager_scored" || c.Status === "acknowledged" || c.Status === "locked");
        }).length;
    }
    const hasFeedback = !!myCheckin && !myReflection?.Acknowledged_At;
    const weekLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWeekLabel"])(week);
    // Compute self average for display
    const selfAvg = myCycle?.Self_Scores ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["computeAverage"])(Object.values((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["safeJsonParse"])(myCycle.Self_Scores, {}))) : 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-lg font-bold text-text-primary",
                        children: [
                            "Good ",
                            getGreeting(),
                            ", ",
                            name.split(" ")[0]
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-text-secondary mt-0.5",
                        children: weekLabel
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 75,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: "/weekly/reflection",
                        className: "enterprise-card p-4 hover:shadow-md transition-shadow block group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                            size: 15,
                                            className: "text-primary-600"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                            lineNumber: 87,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 86,
                                        columnNumber: 13
                                    }, this),
                                    myReflection ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                        variant: "complete",
                                        label: "Done ✓"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 90,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                        variant: "pending",
                                        label: "Pending"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 91,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                                children: "Weekly Reflection"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors",
                                children: myReflection ? hasFeedback ? "New feedback — tap to view →" : "Reflection submitted ✓" : "Submit your reflection →"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    (role === "manager" || role === "hr" || role === "md") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: "/weekly/checkin",
                        className: "enterprise-card p-4 hover:shadow-md transition-shadow block group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                            size: 15,
                                            className: "text-primary-600"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                            lineNumber: 107,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 106,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                        variant: teamCheckedIn === teamSize && teamSize > 0 ? "complete" : "pending",
                                        label: `${teamCheckedIn}/${teamSize}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 109,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 105,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                                children: "Team Check-Ins"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 114,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors",
                                children: teamSize === 0 ? "No team members" : teamCheckedIn === teamSize ? "All check-ins complete ✓" : `${teamSize - teamCheckedIn} pending →`
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 115,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 104,
                        columnNumber: 11
                    }, this),
                    role === "employee" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(MonthlyEmployeeCard, {
                        cycle: myCycle,
                        curLabel: curLabel,
                        selfAvg: selfAvg,
                        windowOpen: new Date().getDate() >= config.window_open_day && new Date().getDate() <= config.window_close_day && new Date().getMonth() + 1 === config.current_month && new Date().getFullYear() === config.current_year
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 127,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: "/monthly/score-team",
                        className: "enterprise-card p-4 hover:shadow-md transition-shadow block group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                            size: 15,
                                            className: "text-primary-600"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                            lineNumber: 137,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 136,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                        variant: teamScoredCount === teamSize && teamSize > 0 ? "complete" : "pending",
                                        label: `${teamScoredCount}/${teamSize}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 139,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                                children: "Team Monthly Scoring"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 144,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors",
                                children: teamSize === 0 ? "No team members" : teamScoredCount === teamSize ? "All scored ✓" : `${teamSize - teamScoredCount} of ${teamSize} scored →`
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 134,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "enterprise-card p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "font-semibold text-sm text-primary-900 mb-3",
                        children: "Pending Actions"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1",
                        children: [
                            !myReflection && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/weekly/reflection",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$message$2d$square$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__MessageSquare$3e$__["MessageSquare"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 161,
                                    columnNumber: 58
                                }, void 0),
                                title: "Submit Weekly Reflection",
                                subtitle: weekLabel,
                                urgency: "medium"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 161,
                                columnNumber: 13
                            }, this),
                            hasFeedback && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/weekly/reflection",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 165,
                                    columnNumber: 58
                                }, void 0),
                                title: "Acknowledge Manager Feedback",
                                subtitle: "Your manager submitted a check-in",
                                urgency: "high"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 165,
                                columnNumber: 13
                            }, this),
                            role === "employee" && !myCycle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/monthly/self-score",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 169,
                                    columnNumber: 59
                                }, void 0),
                                title: "Complete Monthly Self-Assessment",
                                subtitle: curLabel,
                                urgency: "medium"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 169,
                                columnNumber: 13
                            }, this),
                            role === "employee" && myCycle?.Status === "manager_scored" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/monthly/self-score",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 173,
                                    columnNumber: 59
                                }, void 0),
                                title: "Manager has scored you — view results",
                                subtitle: curLabel,
                                urgency: "high"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this),
                            (role === "manager" || role === "hr" || role === "md") && teamReflected > teamCheckedIn && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/weekly/checkin",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 177,
                                    columnNumber: 55
                                }, void 0),
                                title: `${teamReflected - teamCheckedIn} check-in${teamReflected - teamCheckedIn !== 1 ? "s" : ""} to write`,
                                subtitle: `${teamReflected} team member${teamReflected !== 1 ? "s" : ""} submitted reflections`,
                                urgency: "medium"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 177,
                                columnNumber: 13
                            }, this),
                            (role === "manager" || role === "hr" || role === "md") && teamScoredCount < teamSize && teamSize > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/monthly/score-team",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 183,
                                    columnNumber: 59
                                }, void 0),
                                title: `${teamSize - teamScoredCount} team member${teamSize - teamScoredCount !== 1 ? "s" : ""} to score`,
                                subtitle: curLabel,
                                urgency: "medium"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this),
                            (role === "hr" || role === "md") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(PendingItem, {
                                href: "/admin/employees",
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                    lineNumber: 188,
                                    columnNumber: 56
                                }, void 0),
                                title: "Employee Management",
                                subtitle: "Manage your workforce",
                                urgency: "low"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 188,
                                columnNumber: 13
                            }, this),
                            myReflection && !hasFeedback && role === "employee" && myCycle?.Status === "acknowledged" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-text-secondary py-4 text-center",
                                children: "You're all caught up this month. 🎉"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 192,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            role === "employee" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "enterprise-card p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold text-sm text-primary-900",
                                children: [
                                    "This Month's Review — ",
                                    curLabel
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this),
                            myCycle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                variant: myCycle.Status
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 203,
                                columnNumber: 17
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                                variant: "pending",
                                label: "Not started"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 204,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-sm bg-primary-50 p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] text-text-secondary mb-2 uppercase tracking-wide",
                                        children: "Self Score"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 209,
                                        columnNumber: 15
                                    }, this),
                                    selfAvg > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$RatingBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RatingBadge"], {
                                        score: selfAvg,
                                        size: "lg"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 211,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-bold text-text-secondary",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 212,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 208,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-sm bg-primary-50 p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] text-text-secondary mb-2 uppercase tracking-wide",
                                        children: "Manager Score"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 216,
                                        columnNumber: 15
                                    }, this),
                                    myCycle?.Locked_Average ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$RatingBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RatingBadge"], {
                                        score: Number(myCycle.Locked_Average),
                                        size: "lg"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 218,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-bold text-text-secondary",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 219,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 215,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-sm bg-primary-50 p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[11px] text-text-secondary mb-2 uppercase tracking-wide",
                                        children: "Average"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this),
                                    myCycle?.Locked_Average ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$RatingBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RatingBadge"], {
                                        score: Number(myCycle.Locked_Average),
                                        size: "lg",
                                        showLabel: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 225,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xl font-bold text-text-secondary",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                        lineNumber: 226,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 222,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 207,
                        columnNumber: 11
                    }, this),
                    !myCycle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-text-secondary mt-3 text-center",
                        children: [
                            "Monthly scoring opens on day ",
                            config.window_open_day,
                            ". Set up your goals first."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 231,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 199,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
        lineNumber: 73,
        columnNumber: 5
    }, this);
}
function MonthlyEmployeeCard({ cycle, curLabel, selfAvg, windowOpen }) {
    if (!cycle && windowOpen) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
            href: "/monthly/self-score",
            className: "enterprise-card p-4 hover:shadow-md transition-shadow block group",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start justify-between mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                size: 15,
                                className: "text-primary-600"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 251,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 250,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                            variant: "pending",
                            label: "Open"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 253,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 249,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                    children: "Monthly Self-Assessment"
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 255,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-medium text-primary-600 mt-1 group-hover:underline",
                    children: [
                        "Score yourself for ",
                        curLabel,
                        " →"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 256,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
            lineNumber: 248,
            columnNumber: 7
        }, this);
    }
    if (cycle?.Status === "self_scored") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "enterprise-card p-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start justify-between mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                size: 15,
                                className: "text-primary-600"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 268,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 267,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                            variant: "self_scored"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 270,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 266,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                    children: "Monthly Self-Assessment"
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 272,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-medium text-text-secondary mt-1",
                    children: "Submitted — waiting for manager review"
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 273,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
            lineNumber: 265,
            columnNumber: 7
        }, this);
    }
    if (cycle?.Status === "manager_scored") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
            href: "/monthly/self-score",
            className: "enterprise-card p-4 hover:shadow-md transition-shadow block group border-l-4 border-l-accent-500",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start justify-between mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                size: 15,
                                className: "text-accent-500"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 283,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 282,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                            variant: "manager_scored"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 285,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 281,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                    children: "Monthly Self-Assessment"
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 287,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-medium text-text-primary mt-1 group-hover:text-primary-600 transition-colors",
                    children: "Manager scored you — tap to view →"
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 288,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
            lineNumber: 280,
            columnNumber: 7
        }, this);
    }
    if (cycle?.Status === "acknowledged" || cycle?.Status === "locked") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
            href: "/monthly/self-score",
            className: "enterprise-card p-4 hover:shadow-md transition-shadow block group",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start justify-between mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                size: 15,
                                className: "text-success"
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                                lineNumber: 300,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 299,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                            variant: "acknowledged"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 302,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 298,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                    children: "Monthly Self-Assessment"
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 304,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm font-medium text-text-primary mt-1",
                    children: [
                        "Review complete for ",
                        curLabel
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 305,
                    columnNumber: 9
                }, this),
                cycle.Locked_Average && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$RatingBadge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RatingBadge"], {
                        score: Number(cycle.Locked_Average),
                        showLabel: true,
                        size: "md"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 310,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                    lineNumber: 309,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
            lineNumber: 297,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "enterprise-card p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-8 h-8 rounded-sm bg-primary-50 flex items-center justify-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                            size: 15,
                            className: "text-primary-600"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                            lineNumber: 321,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 320,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Badge"], {
                        variant: "default",
                        label: "Closed"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 323,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 319,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[11px] font-semibold text-text-secondary uppercase tracking-wide",
                children: "Monthly Self-Assessment"
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 325,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-text-secondary mt-1",
                children: "Scoring window not open"
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 326,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
        lineNumber: 318,
        columnNumber: 5
    }, this);
}
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
}
function PendingItem({ href, icon, title, subtitle, urgency }) {
    const dot = urgency === "high" ? "bg-danger" : urgency === "medium" ? "bg-warning" : "bg-border";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: "flex items-center gap-3 py-2.5 px-3 rounded-sm hover:bg-primary-50 transition-colors group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-8 h-8 rounded-sm bg-primary-50 group-hover:bg-white flex items-center justify-center text-primary-600 flex-shrink-0 transition-colors border border-transparent group-hover:border-border",
                children: icon
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 345,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm font-medium text-text-primary truncate group-hover:text-primary-600 transition-colors",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 349,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-text-secondary",
                        children: subtitle
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                        lineNumber: 350,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 348,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `w-2 h-2 rounded-full flex-shrink-0 ${dot}`
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
                lineNumber: 352,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/dashboard/page.tsx",
        lineNumber: 344,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/(dashboard)/dashboard/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(dashboard)/dashboard/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5f1a1562._.js.map