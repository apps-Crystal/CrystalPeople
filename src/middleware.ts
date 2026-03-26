import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { SessionUser } from "@/lib/auth";
import type { Role } from "@/lib/types";

const COOKIE_NAME = "cp_session";

const PUBLIC_PATHS = [
  "/auth/",
  "/api/auth/login",
  "/api/auth/logout",
  "/_next/",
  "/favicon.ico",
];

// Paths that require specific roles (checked after auth)
const ROLE_GUARDS: { prefix: string; allowed: Role[] }[] = [
  { prefix: "/admin", allowed: ["hr", "md"] },
  { prefix: "/executive", allowed: ["md"] },
  { prefix: "/api/admin", allowed: ["hr", "md"] },
  { prefix: "/api/increments/approve", allowed: ["md"] },
  { prefix: "/api/increments/override", allowed: ["md"] },
];

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verify JWT
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let user: SessionUser;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    user = payload as unknown as SessionUser;
  } catch {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // First login — must go to welcome page (allow welcome + first-login API through)
  if (!user.firstLoginDone && pathname !== "/welcome" && pathname !== "/api/auth/first-login") {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  // Role-based path guards
  for (const guard of ROLE_GUARDS) {
    if (pathname.startsWith(guard.prefix)) {
      if (!guard.allowed.includes(user.role)) {
        return NextResponse.json(
          { error: "Forbidden — insufficient role" },
          { status: 403 }
        );
      }
    }
  }

  // Forward user info to downstream server components via headers
  const res = NextResponse.next();
  res.headers.set("x-user-id", user.userId);
  res.headers.set("x-user-role", user.role);
  res.headers.set("x-user-employee-type", user.employeeType);
  res.headers.set("x-user-manager-id", user.managerId ?? "");
  res.headers.set("x-user-name", user.name);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
