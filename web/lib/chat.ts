import jwt from "jsonwebtoken";

export const CHAT_SESSION_COOKIE = "wasp_chat_session";
export const CHAT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function chatAuthSecret(): string {
  const value = process.env.CHAT_AUTH_SECRET;
  if (!value) {
    throw new Error("Missing CHAT_AUTH_SECRET. Check web/.env.local against .env.example.");
  }
  return value;
}

export function createChatSessionToken(
  payload: { userProfileId: string; nickname: string },
  secret: string,
  ttlMs: number
): string {
  return jwt.sign(payload, secret, {
    expiresIn: Math.floor(ttlMs / 1000),
  });
}

export function verifyChatSessionToken(token: string, secret: string) {
  try {
    return jwt.verify(token, secret) as { userProfileId: string; nickname: string };
  } catch {
    return null;
  }
}
