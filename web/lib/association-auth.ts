import "server-only";
import { createHmac, timingSafeEqual, scryptSync } from "crypto";
import { cookies } from "next/headers";

export const ASSOCIATION_SESSION_COOKIE = "wasp_association_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function sessionSecret(): string {
  const value = process.env.ASSOCIATION_SESSION_SECRET;
  if (!value) {
    throw new Error("Missing ASSOCIATION_SESSION_SECRET. Check web/.env.local");
  }
  return value;
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

export async function isAssociationAuthenticated(): Promise<string | null> {
  const cookieStore = await cookies();
  const tokenData = cookieStore.get(ASSOCIATION_SESSION_COOKIE)?.value;

  if (!verifySessionToken(tokenData)) {
    return null;
  }

  // Extract association ID from token payload
  const [payload] = tokenData?.split(".") || [];
  return payload ? "authenticated" : null;
}

// Helper to hash passwords (animal+2numbers format)
export function hashPassword(password: string): string {
  const salt = crypto.getRandomValues(new Uint8Array(16)).toString();
  const hash = scryptSync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  if (!salt || !storedHash) return false;

  const candidateHash = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (candidateHash.length !== storedBuffer.length) return false;

  return timingSafeEqual(candidateHash, storedBuffer);
}
