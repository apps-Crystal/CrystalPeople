module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/sign.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
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
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$sign$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignJWT"]({
        ...payload
    }).setProtectedHeader({
        alg: "HS256"
    }).setIssuedAt().setExpirationTime(JWT_EXPIRY).sign(getSecret());
}
async function verifyJwt(token) {
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jwtVerify"])(token, getSecret());
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
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
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
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

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
"[project]/src/lib/sheet-schema.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/sheets.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/googleapis/build/src/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sheet-schema.ts [app-route] (ecmascript)");
;
;
// ─── Google Sheets client ────────────────────────────────────────────────────
function getAuth() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    if (!privateKey || !clientEmail) {
        throw new Error("Missing Google service account credentials in env");
    }
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["google"].auth.GoogleAuth({
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["google"].sheets({
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
    const unknown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUnknownFields"])(sheetName, fields);
    if (unknown.length > 0) {
        throw new Error(`Unknown fields for sheet "${sheetName}": ${unknown.join(", ")}`);
    }
    const columns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSheetColumns"])(sheetName);
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
    const columns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheet$2d$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSheetColumns"])(sheetName);
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
"[project]/src/lib/utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-route] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
"[project]/src/app/api/monthly/self-score/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sheets.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(req) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    if (!session) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Unauthorized"
    }, {
        status: 401
    });
    const configRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cachedReadSheet"])("Config");
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseConfigRows"])(configRows);
    const { searchParams } = req.nextUrl;
    const month = searchParams.get("month") ?? String(config.current_month);
    const year = searchParams.get("year") ?? String(config.current_year);
    const [employees, goals, tasks, cycles] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cachedReadSheet"])("Employees"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Goals"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Tasks"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Review_Cycles")
    ]);
    const employee = employees.find((e)=>e.Employee_ID === session.userId);
    if (!employee) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Employee not found"
    }, {
        status: 404
    });
    const myGoals = goals.filter((g)=>g.Employee_ID === session.userId && g.Month === month && g.Year === year);
    const myTasks = tasks.filter((t)=>t.Employee_ID === session.userId);
    const dimensions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getScoreDimensions"])(employee, myGoals, myTasks);
    const cycle = cycles.find((c)=>c.Employee_ID === session.userId && c.Month === month && c.Year === year) ?? null;
    // Populate existing self-scores into dimensions
    if (cycle?.Self_Scores) {
        const selfScores = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safeJsonParse"])(cycle.Self_Scores, {});
        dimensions.forEach((d)=>{
            if (selfScores[d.key] !== undefined) d.selfScore = selfScores[d.key];
        });
    }
    const windowOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isWindowOpen"])("employee", config);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        cycle,
        dimensions,
        windowOpen,
        config
    });
}
async function POST(req) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    if (!session) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Unauthorized"
    }, {
        status: 401
    });
    const configRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cachedReadSheet"])("Config");
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseConfigRows"])(configRows);
    // Window check
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isWindowOpen"])("employee", config)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Self-scoring window is currently closed"
        }, {
            status: 400
        });
    }
    const body = await req.json();
    const { scores, comments } = body;
    if (!comments || comments.trim().length < 20) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Comments must be at least 20 characters"
        }, {
            status: 400
        });
    }
    const month = String(config.current_month);
    const year = String(config.current_year);
    // Validate all dimensions present
    const [employees, goals, tasks] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cachedReadSheet"])("Employees"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Goals"),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Tasks")
    ]);
    const employee = employees.find((e)=>e.Employee_ID === session.userId);
    if (!employee) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Employee not found"
    }, {
        status: 404
    });
    const myGoals = goals.filter((g)=>g.Employee_ID === session.userId && g.Month === month && g.Year === year);
    const myTasks = tasks.filter((t)=>t.Employee_ID === session.userId);
    const dimensions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getScoreDimensions"])(employee, myGoals, myTasks);
    for (const dim of dimensions){
        const score = scores[dim.key];
        if (score === undefined || score === null) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Score missing for: ${dim.label}`
            }, {
                status: 400
            });
        }
        if (score < 1 || score > 5) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Score for ${dim.label} must be between 1 and 5`
            }, {
                status: 400
            });
        }
    }
    const cycles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Review_Cycles");
    const existing = cycles.find((c)=>c.Employee_ID === session.userId && c.Month === month && c.Year === year);
    if (existing && existing.Status !== "pending") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Already self-scored for this month"
        }, {
            status: 400
        });
    }
    const scoresJson = JSON.stringify(scores);
    let cycle;
    if (!existing) {
        // Create new cycle
        const seq = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNextSeq"])("Review_Cycles");
        const cycleId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateId"])("CYC", seq);
        const newCycle = {
            Cycle_ID: cycleId,
            Employee_ID: session.userId,
            Month: month,
            Year: year,
            Self_Scores: scoresJson,
            Manager_Scores: "",
            Self_Comments: comments.trim(),
            Manager_Comments: "",
            Review_Notes: "",
            Next_Month_Focus: "",
            Status: "self_scored",
            Acknowledged_At: "",
            Flagged_Dimensions: "",
            AI_Note_Flag: "FALSE",
            Locked_Average: ""
        };
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appendRowByFields"])("Review_Cycles", newCycle);
        cycle = newCycle;
    } else {
        // Update existing pending cycle
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateRowWhere"])("Review_Cycles", "Cycle_ID", existing.Cycle_ID, {
            Self_Scores: scoresJson,
            Self_Comments: comments.trim(),
            Status: "self_scored"
        });
        cycle = {
            ...existing,
            Self_Scores: scoresJson,
            Self_Comments: comments.trim(),
            Status: "self_scored"
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateCache"])("Review_Cycles");
    // Update individual goal Self_Score fields
    for (const dim of dimensions){
        if (dim.type === "goal" && scores[dim.key] !== undefined) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateRowWhere"])("Goals", "Goal_ID", dim.key, {
                Self_Score: String(scores[dim.key])
            });
        } else if (dim.type === "task" && scores[dim.key] !== undefined) {
            // Update task Monthly_Scores JSON
            const taskRow = myTasks.find((t)=>t.Task_ID === dim.key);
            if (taskRow) {
                const monthlyScores = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["safeJsonParse"])(taskRow.Monthly_Scores, []);
                const idx = monthlyScores.findIndex((ms)=>ms.month === config.current_month && ms.year === config.current_year);
                if (idx >= 0) {
                    monthlyScores[idx].self_score = scores[dim.key];
                } else {
                    monthlyScores.push({
                        month: config.current_month,
                        year: config.current_year,
                        self_score: scores[dim.key],
                        manager_score: 0
                    });
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateRowWhere"])("Tasks", "Task_ID", dim.key, {
                    Monthly_Scores: JSON.stringify(monthlyScores),
                    Updated_At: new Date().toISOString()
                });
            }
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateCache"])("Goals");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateCache"])("Tasks");
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        cycle
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4bb2f8b2._.js.map