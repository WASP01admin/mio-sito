import type { Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@wasp/shared";
import { verifyChatSessionToken } from "@wasp/shared";
import { supabase } from "./supabase";

export interface AuthedSocketData {
  userProfileId: string;
  nickname: string;
}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  AuthedSocketData
>;

function chatAuthSecret(): string {
  const value = process.env.CHAT_AUTH_SECRET;
  if (!value) {
    throw new Error(
      "Missing CHAT_AUTH_SECRET. Check chat-service/.env against .env.example."
    );
  }
  return value;
}

// The signed token only proves identity (who they claim to be). Eligibility
// -- rejected membership, active ban -- is re-checked live against the
// database on every connection, never trusted from the token alone.
export async function authenticateSocket(
  socket: AppSocket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token;
  const payload = verifyChatSessionToken(token, chatAuthSecret());

  if (!payload) {
    next(new Error("unauthorized"));
    return;
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id, nickname, membership_status")
    .eq("id", payload.userProfileId)
    .maybeSingle();

  if (error || !profile || profile.membership_status === "rejected") {
    next(new Error("unauthorized"));
    return;
  }

  const { data: ban } = await supabase
    .from("chat_bans")
    .select("id")
    .eq("user_profile_id", profile.id)
    .maybeSingle();

  if (ban) {
    next(new Error("banned"));
    return;
  }

  socket.data = {
    userProfileId: profile.id,
    nickname: profile.nickname ?? payload.nickname,
  };
  next();
}
