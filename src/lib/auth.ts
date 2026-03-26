import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { Role, EmployeeType } from "./types";

export const COOKIE_NAME = "cp_session";
const JWT_EXPIRY = "10h";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  employeeType: EmployeeType;
  managerId: string;
  firstLoginDone: boolean;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(secret);
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signJwt(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(candidate, "hex"),
    Buffer.from(hash, "hex")
  );
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export function sessionCookieOptions(maxAge = 10 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

// ─── Password reset tokens ────────────────────────────────────────────────────

/** Generates a cryptographically secure 32-byte hex reset token. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Returns an ISO expiry string 1 hour from now. */
export function resetTokenExpiry(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

/** Returns true if the stored expiry string has passed. */
export function isResetTokenExpired(expiry: string): boolean {
  if (!expiry || expiry === "USED") return true;
  return new Date(expiry) < new Date();
}
