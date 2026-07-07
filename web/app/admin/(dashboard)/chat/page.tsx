import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  DeleteChannelButton,
  DeleteMessageButton,
  ToggleBanButton,
} from "@/components/admin/ChatModerationActions";

interface ChannelRef {
  slug: string;
}

interface FullChannelRow {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
}

interface MessageRow {
  id: string;
  nickname: string;
  body: string;
  created_at: string;
  user_profile_id: string;
  chat_channels: ChannelRef | ChannelRef[] | null;
}

interface ProfileRef {
  nickname: string | null;
  email: string;
}

interface BanRow {
  user_profile_id: string;
  created_at: string;
  user_profiles: ProfileRef | ProfileRef[] | null;
}

interface ReportedMessageRow {
  id: string;
  message_id: string;
  chat_messages:
    | (Pick<MessageRow, "nickname" | "body" | "user_profile_id"> & { chat_channels: ChannelRef | ChannelRef[] | null })
    | (Pick<MessageRow, "nickname" | "body" | "user_profile_id"> & { chat_channels: ChannelRef | ChannelRef[] | null })[]
    | null;
}

interface ReportedMessageSummary {
  messageId: string;
  channelSlug: string;
  nickname: string;
  body: string;
  userProfileId: string;
  reportCount: number;
}

function channelSlug(row: MessageRow): string {
  const value = row.chat_channels;
  if (!value) return "—";
  const c = Array.isArray(value) ? value[0] : value;
  return c ? c.slug : "—";
}

function profileOf(row: BanRow): ProfileRef | null {
  const value = row.user_profiles;
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summarizeReports(rows: ReportedMessageRow[]): ReportedMessageSummary[] {
  const byMessage = new Map<string, ReportedMessageSummary>();

  for (const row of rows) {
    const value = row.chat_messages;
    const message = Array.isArray(value) ? value[0] : value;
    if (!message) continue;

    const existing = byMessage.get(row.message_id);
    if (existing) {
      existing.reportCount += 1;
      continue;
    }

    const channelValue = message.chat_channels;
    const channel = Array.isArray(channelValue) ? channelValue[0] : channelValue;

    byMessage.set(row.message_id, {
      messageId: row.message_id,
      channelSlug: channel?.slug ?? "—",
      nickname: message.nickname,
      body: message.body,
      userProfileId: message.user_profile_id,
      reportCount: 1,
    });
  }

  return Array.from(byMessage.values()).sort((a, b) => b.reportCount - a.reportCount);
}

export default async function AdminChatPage() {
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("chat_messages")
    .select("id, nickname, body, created_at, user_profile_id, chat_channels(slug)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: bans, error: bansError } = await supabaseAdmin
    .from("chat_bans")
    .select("user_profile_id, created_at, user_profiles(nickname, email)")
    .order("created_at", { ascending: false });

  const { data: reports, error: reportsError } = await supabaseAdmin
    .from("chat_message_reports")
    .select(
      "id, message_id, chat_messages(nickname, body, user_profile_id, chat_channels(slug))"
    );

  const { data: allChannels, error: channelsError } = await supabaseAdmin
    .from("chat_channels")
    .select("id, slug, name, is_default")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (messagesError || bansError || reportsError || channelsError) {
    return <p className="text-red-600">Failed to load chat data.</p>;
  }

  const messageRows = (messages ?? []) as MessageRow[];
  const banRows = (bans ?? []) as BanRow[];
  const reportedMessages = summarizeReports((reports ?? []) as ReportedMessageRow[]);
  const channelRows = (allChannels ?? []) as FullChannelRow[];

  return (
    <div>
      <h1 className="text-xl font-bold">Chat Moderation</h1>

      <h2 className="mt-6 text-sm font-bold uppercase text-gray-500">Channels</h2>
      <p className="mt-1 text-xs text-gray-500">
        Deleting a channel doesn&apos;t update anyone connected right now &mdash; it
        disappears from their view on next refresh, but sending to it fails immediately.
      </p>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {channelRows.map((channel) => (
              <tr key={channel.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-mono text-xs">#{channel.slug}</td>
                <td className="px-3 py-2">{channel.name}</td>
                <td className="px-3 py-2">
                  {channel.is_default ? (
                    <span className="text-xs text-gray-400">Default, can&apos;t delete</span>
                  ) : (
                    <DeleteChannelButton channelId={channel.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase text-gray-500">
        Reported messages
      </h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Reports</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Nickname</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reportedMessages.map((r) => (
              <tr key={r.messageId} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-bold text-red-600">{r.reportCount}</td>
                <td className="px-3 py-2">#{r.channelSlug}</td>
                <td className="px-3 py-2">{r.nickname}</td>
                <td className="px-3 py-2">{r.body}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <DeleteMessageButton messageId={r.messageId} />
                    <ToggleBanButton userProfileId={r.userProfileId} banned={false} />
                  </div>
                </td>
              </tr>
            ))}
            {reportedMessages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                  Nothing reported
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase text-gray-500">
        Banned members
      </h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Nickname</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Banned since</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {banRows.map((ban) => {
              const profile = profileOf(ban);
              return (
                <tr key={ban.user_profile_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2">{profile?.nickname ?? "—"}</td>
                  <td className="px-3 py-2">{profile?.email ?? "—"}</td>
                  <td className="px-3 py-2">{formatDateTime(ban.created_at)}</td>
                  <td className="px-3 py-2">
                    <ToggleBanButton userProfileId={ban.user_profile_id} banned />
                  </td>
                </tr>
              );
            })}
            {banRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                  No one banned
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase text-gray-500">
        Recent messages (last 100)
      </h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Nickname</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messageRows.map((message) => (
              <tr key={message.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 text-xs">{formatDateTime(message.created_at)}</td>
                <td className="px-3 py-2">#{channelSlug(message)}</td>
                <td className="px-3 py-2">{message.nickname}</td>
                <td className="px-3 py-2">{message.body}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <DeleteMessageButton messageId={message.id} />
                    <ToggleBanButton userProfileId={message.user_profile_id} banned={false} />
                  </div>
                </td>
              </tr>
            ))}
            {messageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                  No messages yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
