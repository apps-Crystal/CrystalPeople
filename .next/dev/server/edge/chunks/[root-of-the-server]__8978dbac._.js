(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__8978dbac._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jose/dist/webapi/jwt/verify.js [middleware-edge] (ecmascript)");
;
;
const COOKIE_NAME = "cp_session";
const PUBLIC_PATHS = [
    "/auth/",
    "/api/auth/login",
    "/api/auth/logout",
    "/_next/",
    "/favicon.ico"
];
// Paths that require specific roles (checked after auth)
const ROLE_GUARDS = [
    {
        prefix: "/admin",
        allowed: [
            "hr",
            "md"
        ]
    },
    {
        prefix: "/executive",
        allowed: [
            "md"
        ]
    },
    {
        prefix: "/api/admin",
        allowed: [
            "hr",
            "md"
        ]
    },
    {
        prefix: "/api/increments/approve",
        allowed: [
            "md"
        ]
    },
    {
        prefix: "/api/increments/override",
        allowed: [
            "md"
        ]
    }
];
function getSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET ?? "");
}
async function middleware(req) {
    const { pathname } = req.nextUrl;
    // Allow public paths
    if (PUBLIC_PATHS.some((p)=>pathname.startsWith(p))) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Verify JWT
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
        const loginUrl = new URL("/auth/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
    }
    let user;
    try {
        const { payload } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jose$2f$dist$2f$webapi$2f$jwt$2f$verify$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["jwtVerify"])(token, getSecret());
        user = payload;
    } catch  {
        const loginUrl = new URL("/auth/login", req.url);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
    }
    // First login — must go to welcome page (allow welcome + first-login API through)
    if (!user.firstLoginDone && pathname !== "/welcome" && pathname !== "/api/auth/first-login") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/welcome", req.url));
    }
    // Role-based path guards
    for (const guard of ROLE_GUARDS){
        if (pathname.startsWith(guard.prefix)) {
            if (!guard.allowed.includes(user.role)) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Forbidden — insufficient role"
                }, {
                    status: 403
                });
            }
        }
    }
    // Forward user info to downstream server components via headers
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    res.headers.set("x-user-id", user.userId);
    res.headers.set("x-user-role", user.role);
    res.headers.set("x-user-employee-type", user.employeeType);
    res.headers.set("x-user-manager-id", user.managerId ?? "");
    res.headers.set("x-user-name", user.name);
    return res;
}
const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|public/).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__8978dbac._.js.map