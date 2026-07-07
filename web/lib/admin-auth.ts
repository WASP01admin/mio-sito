import { createHmac, timingSafeEqual, scryptSync } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "wasp_admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

function adminPasswordHash(): string {
  const value = process.env.ADMIN_PASSWORD_HASH;
  if (!value) {
    throw new Error("Missing ADMIN_PASSWORD_HASH. Check web/.env.local against .env.example.");
  }
  return value;
}

function sessionSecret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error("Missing ADMIN_SESSION_SECRET. Check web/.env.local against .env.example.");
  }
  return value;
}

export function verifyAdminPassword(password: string): boolean {
  const [salt, storedHash] = adminPasswordHash().split(":");
  if (!salt || !storedHash) return false;

  const candidateHash = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (candidateHash.length !== storedBuffer.length) return false;

  return timingSafeEqual(candidateHash, storedBuffer);
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

// Defense in depth for /api/admin/* route handlers: proxy.ts only guards
// page navigation, it doesn't run for /api paths, so every admin route
// handler must check this itself rather than relying on the proxy alone.
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
