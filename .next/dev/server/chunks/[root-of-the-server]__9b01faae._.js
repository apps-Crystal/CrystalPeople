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
"[project]/src/app/api/tasks/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PATCH",
    ()=>PATCH
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sheets.ts [app-route] (ecmascript)");
;
;
;
async function PATCH(req, { params }) {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    if (!session) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Unauthorized"
    }, {
        status: 401
    });
    const { id } = await params;
    const body = await req.json();
    const { task_description, target, status } = body;
    const allTasks = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Tasks");
    const task = allTasks.find((t)=>t.Task_ID === id);
    if (!task) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Task not found"
    }, {
        status: 404
    });
    // Only the manager who owns the task, hr, or md can update
    const canEdit = session.role === "hr" || session.role === "md" || session.role === "manager" && task.Manager_ID === session.userId;
    if (!canEdit) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Forbidden"
    }, {
        status: 403
    });
    const updates = {
        Updated_At: new Date().toISOString()
    };
    if (task_description !== undefined) {
        if (task_description.trim().length < 10) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Task description must be at least 10 characters"
            }, {
                status: 400
            });
        }
        updates.Task_Description = task_description.trim();
    }
    if (target !== undefined) {
        if (target.trim().length < 5) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Target must be at least 5 characters"
            }, {
                status: 400
            });
        }
        updates.Target = target.trim();
    }
    if (status !== undefined) {
        if (status !== "active" && status !== "inactive") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Status must be active or inactive"
            }, {
                status: 400
            });
        }
        updates.Status = status;
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["updateRowWhere"])("Tasks", "Task_ID", id, updates);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["invalidateCache"])("Tasks");
    const refreshed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readSheet"])("Tasks");
    const updated = refreshed.find((t)=>t.Task_ID === id) ?? {
        ...task,
        ...updates
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        task: updated
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9b01faae._.js.map