import type { ChatChannel, ChatMessage, ChatReactionSummary } from "@wasp/shared";
import { containsBlockedWord } from "@wasp/shared";
import { supabase } from "./supabase";

const HISTORY_LIMIT = 50;
const MAX_MESSAGE_LENGTH = 2000;
const SLUG_PATTERN = /^[a-z0-9-]{2,32}$/;
const CHAT_IMAGE_BUCKET = "chat-images";

interface ChannelRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

interface MessageRow {
  id: string;
  channel_id: string;
  user_profile_id: string;
  nickname: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
}

const MESSAGE_COLUMNS =
  "id, channel_id, user_profile_id, nickname, body, image_path, created_at";

function imageUrlFromPath(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(CHAT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function toChannel(row: ChannelRow): ChatChannel {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
  };
}

function toMessage(row: MessageRow, reactions: ChatReactionSummary[] = []): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    userProfileId: row.user_profile_id,
    nickname: row.nickname,
    body: row.body ?? "",
    imageUrl: imageUrlFromPath(row.image_path),
    createdAt: row.created_at,
    reactions,
  };
}

interface ReactionRow {
  message_id: string;
  user_profile_id: string;
  emoji: string;
}

async function getReactionsForMessages(
  messageIds: string[]
): Promise<Map<string, ChatReactionSummary[]>> {
  const result = new Map<string, ChatReactionSummary[]>();
  if (messageIds.length === 0) return result;

  const { data, error } = await supabase
    .from("chat_message_reactions")
    .select("message_id, user_profile_id, emoji")
    .in("message_id", messageIds);

  if (error) throw error;

  // message_id -> emoji -> userProfileId[]
  const grouped = new Map<string, Map<string, string[]>>();
  for (const row of (data ?? []) as ReactionRow[]) {
    if (!grouped.has(row.message_id)) grouped.set(row.message_id, new Map());
    const byEmoji = grouped.get(row.message_id)!;
    if (!byEmoji.has(row.emoji)) byEmoji.set(row.emoji, []);
    byEmoji.get(row.emoji)!.push(row.user_profile_id);
  }

  for (const [messageId, byEmoji] of grouped) {
    result.set(
      messageId,
      Array.from(byEmoji.entries()).map(([emoji, userProfileIds]) => ({ emoji, userProfileIds }))
    );
  }
  return result;
}

export async function getReactionsForMessage(messageId: string): Promise<ChatReactionSummary[]> {
  const map = await getReactionsForMessages([messageId]);
  return map.get(messageId) ?? [];
}

// Toggling: if the user already reacted with this emoji, remove it;
// otherwise add it. Returns the updated summary for the message.
export async function toggleReaction(
  messageId: string,
  userProfileId: string,
  emoji: string
): Promise<ChatReactionSummary[]> {
  const { data: existing, error: fetchError } = await supabase
    .from("chat_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_profile_id", userProfileId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { error } = await supabase
      .from("chat_message_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("chat_message_reactions")
      .insert({ message_id: messageId, user_profile_id: userProfileId, emoji });
    if (error) throw error;
  }

  return getReactionsForMessage(messageId);
}

// Silently no-ops on a duplicate report (unique constraint) -- the reporter
// already made their point, no need to error at them for reporting twice.
export async function reportMessage(messageId: string, reporterUserProfileId: string): Promise<void> {
  const { error } = await supabase
    .from("chat_message_reports")
    .insert({ message_id: messageId, reporter_user_profile_id: reporterUserProfileId });

  if (error && error.code !== "23505") throw error;
}

export async function listChannels(): Promise<ChatChannel[]> {
  const { data, error } = await supabase
    .from("chat_channels")
    .select("id, slug, name, description, is_default")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as ChannelRow[]).map(toChannel);
}

export async function getDefaultChannel(): Promise<ChatChannel | null> {
  const { data, error } = await supabase
    .from("chat_channels")
    .select("id, slug, name, description, is_default")
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? toChannel(data as ChannelRow) : null;
}

export async function channelExists(channelId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("chat_channels")
    .select("id")
    .eq("id", channelId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function getChannelHistory(channelId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("channel_id", channelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) throw error;
  const rows = (data as MessageRow[]).reverse();
  const reactionsByMessage = await getReactionsForMessages(rows.map((r) => r.id));
  return rows.map((row) => toMessage(row, reactionsByMessage.get(row.id) ?? []));
}

export type MessageValidationResult =
  | { valid: true; value: string }
  | { valid: false; error: "empty" | "too_long" | "inappropriate" };

// When an image is attached, the body is an optional caption -- empty is fine.
// Without an image, the body is the whole message and can't be empty.
export function validateMessageBody(
  body: unknown,
  hasImage: boolean = false
): MessageValidationResult {
  if (typeof body !== "string") return hasImage ? { valid: true, value: "" } : { valid: false, error: "empty" };
  const trimmed = body.trim();
  if (!trimmed) return hasImage ? { valid: true, value: "" } : { valid: false, error: "empty" };
  if (trimmed.length > MAX_MESSAGE_LENGTH) return { valid: false, error: "too_long" };
  if (containsBlockedWord(trimmed)) return { valid: false, error: "inappropriate" };
  return { valid: true, value: trimmed };
}

export function validateImagePath(imagePath: unknown): string | null {
  if (typeof imagePath !== "string") return null;
  if (imagePath.length === 0 || imagePath.length > 300) return null;
  return imagePath;
}

export async function insertMessage(
  channelId: string,
  userProfileId: string,
  nickname: string,
  body: string,
  imagePath: string | null = null
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      channel_id: channelId,
      user_profile_id: userProfileId,
      nickname,
      body: body || null,
      image_path: imagePath,
    })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) throw error;
  return toMessage(data as MessageRow);
}

// Only soft-deletes the message if it actually belongs to this user --
// this is the enforcement point for "delete your own messages only".
export async function deleteMessageIfOwner(
  messageId: string,
  userProfileId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_profile_id", userProfileId)
    .is("deleted_at", null)
    .select("channel_id")
    .maybeSingle();

  if (error) throw error;
  return data ? (data as { channel_id: string }).channel_id : null;
}

export function validateSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;
  const normalized = slug.trim().toLowerCase();
  return SLUG_PATTERN.test(normalized) ? normalized : null;
}

export async function createChannel(
  slug: string,
  name: string,
  description: string | undefined,
  createdBy: string
): Promise<ChatChannel | null> {
  const { data, error } = await supabase
    .from("chat_channels")
    .insert({
      slug,
      name: name.trim() || slug,
      description: description?.trim() || null,
      created_by: createdBy,
    })
    .select("id, slug, name, description, is_default")
    .single();

  if (error) {
    if (error.code === "23505") return null; // slug already taken
    throw error;
  }
  return toChannel(data as ChannelRow);
}
