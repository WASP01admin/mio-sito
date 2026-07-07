import { createHmac, timingSafeEqual } from "crypto";

// Shared between /web (issues tokens via the card's wallet_authentication_token)
// and /chat-service (verifies them on every socket connection). Both services
// must be configured with the same CHAT_AUTH_SECRET value.
export interface ChatSessionPayload {
  userProfileId: string;
  nickname: string;
  expiresAt: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createChatSessionToken(
  data: { userProfileId: string; nickname: string },
  secret: string,
  ttlMs: number
): string {
  const payload: ChatSessionPayload = {
    userProfileId: data.userProfileId,
    nickname: data.nickname,
    expiresAt: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyChatSessionToken(
  token: string | undefined | null,
  secret: string
): ChatSessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = sign(encoded, secret);
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as ChatSessionPayload;
    if (typeof payload.expiresAt !== "number" || payload.expiresAt < Date.now()) {
      return null;
    }
    if (typeof payload.userProfileId !== "string" || typeof payload.nickname !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
