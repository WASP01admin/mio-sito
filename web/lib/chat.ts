export const CHAT_SESSION_COOKIE = "wasp_chat_session";
export const CHAT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function chatAuthSecret(): string {
  const value = process.env.CHAT_AUTH_SECRET;
  if (!value) {
    throw new Error("Missing CHAT_AUTH_SECRET. Check web/.env.local against .env.example.");
  }
  return value;
}
