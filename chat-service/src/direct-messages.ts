import type { DirectMessage } from "@wasp/shared";
import { containsBlockedWord } from "@wasp/shared";
import { supabase } from "./supabase";

const HISTORY_LIMIT = 50;
const MAX_MESSAGE_LENGTH = 2000;
const CHAT_IMAGE_BUCKET = "chat-images";

interface DirectMessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
}

const DIRECT_MESSAGE_COLUMNS =
  "id, sender_id, recipient_id, body, image_path, created_at";

function imageUrlFromPath(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(CHAT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function toDirectMessage(row: DirectMessageRow, senderNickname: string): DirectMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    senderNickname,
    body: row.body ?? "",
    imageUrl: imageUrlFromPath(row.image_path),
    createdAt: row.created_at,
  };
}

export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  body: string,
  senderNickname: string,
  imagePath?: string
): Promise<DirectMessage> {
  // Validate message
  if (!body.trim()) throw new Error("Message body is empty");
  if (body.length > MAX_MESSAGE_LENGTH) throw new Error("Message too long");
  if (containsBlockedWord(body)) throw new Error("Message contains blocked words");

  // Check if sender is blocked by recipient
  const isBlocked = await isUserBlocked(senderId, recipientId);
  if (isBlocked) throw new Error("User has blocked you");

  const { data, error } = await supabase
    .from("chat_direct_messages")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      body,
      image_path: imagePath ?? null,
    })
    .select(DIRECT_MESSAGE_COLUMNS)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to send message");

  return toDirectMessage(data, senderNickname);
}

export async function getDirectMessageHistory(
  userId: string,
  otherUserId: string,
  userNicknames: Map<string, string>
): Promise<DirectMessage[]> {
  // Get messages between two users (both directions)
  const { data, error } = await supabase
    .from("chat_direct_messages")
    .select(DIRECT_MESSAGE_COLUMNS)
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT);

  if (error) throw error;

  return (data ?? []).map((row: DirectMessageRow) => {
    const senderNickname = userNicknames.get(row.sender_id) ?? "Unknown";
    return toDirectMessage(row, senderNickname);
  });
}

export async function getUserDirectConversations(userId: string): Promise<
  Array<{
    partnerId: string;
    lastMessageId: string;
    lastMessage: string;
    lastMessageAt: string;
  }>
> {
  // Get unique conversation partners and their last message
  // TODO: Implement with SQL window function or RPC for performance
  // For MVP, this can be simplified on the client side
  return [];
}

export async function blockUser(
  blockerId: string,
  blockedUserId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase.from("chat_user_blocks").insert({
    blocker_id: blockerId,
    blocked_user_id: blockedUserId,
    reason: reason ?? null,
  });

  // Ignore unique constraint violation (already blocked)
  if (error && error.code !== "23505") throw error;
}

export async function unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
  const { error } = await supabase
    .from("chat_user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_user_id", blockedUserId);

  if (error) throw error;
}

export async function isUserBlocked(senderId: string, recipientId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("chat_user_blocks")
    .select("id")
    .eq("blocker_id", recipientId)
    .eq("blocked_user_id", senderId)
    .limit(1);

  if (error) throw error;
  return data && data.length > 0;
}

export async function getBlockedUsers(userId: string): Promise<
  Array<{
    blockedUserId: string;
    blockedNickname: string;
    reason: string | null;
    blockedAt: string;
  }>
> {
  const { data, error } = await supabase
    .from("chat_user_blocks")
    .select("blocked_user_id, reason, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // TODO: fetch nicknames for blocked users (requires joining with user_profiles)
  return (data ?? []).map((row: any) => ({
    blockedUserId: row.blocked_user_id,
    blockedNickname: "Unknown", // Will be populated by caller if needed
    reason: row.reason,
    blockedAt: row.created_at,
  }));
}

export async function deleteDirectMessage(messageId: string, userId: string): Promise<void> {
  // Soft-delete: only sender can delete their own message
  const { error } = await supabase
    .from("chat_direct_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", userId);

  if (error) throw error;
}
