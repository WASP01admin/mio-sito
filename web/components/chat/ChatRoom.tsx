"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ChatChannel,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@wasp/shared";
import MessageReactions from "./MessageReactions";

const CHAT_SERVICE_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? "http://localhost:4000";
const TYPING_EMIT_THROTTLE_MS = 2000;
const TYPING_EXPIRY_MS = 3000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

interface ChatRoomProps {
  token: string;
  nickname: string;
  userProfileId: string;
}

export default function ChatRoom({ token, nickname, userProfileId }: ChatRoomProps) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messagesByChannel, setMessagesByChannel] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [presenceByChannel, setPresenceByChannel] = useState<Record<string, string[]>>(
    {}
  );
  const [globalOnlineCount, setGlobalOnlineCount] = useState(0);
  const [messageInput, setMessageInput] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelSlug, setNewChannelSlug] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [toastError, setToastError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [typingByChannel, setTypingByChannel] = useState<Record<string, string[]>>({});
  const [reportedMessageIds, setReportedMessageIds] = useState<Set<string>>(new Set());
  const [unreadChannelIds, setUnreadChannelIds] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTypingEmitRef = useRef(0);
  const activeChannelIdRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  function handleEnableNotifications() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then(setNotificationPermission);
  }

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      CHAT_SERVICE_URL,
      { auth: { token } }
    );
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("channelList", (list) => {
      setChannels(list);
      setActiveChannelId((current) => current ?? list.find((c) => c.isDefault)?.id ?? list[0]?.id ?? null);
    });

    socket.on("channelHistory", ({ channelId, messages }) => {
      setMessagesByChannel((prev) => ({ ...prev, [channelId]: messages }));
    });

    socket.on("newMessage", (message) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [message.channelId]: [...(prev[message.channelId] ?? []), message],
      }));
      const isFromSelf = message.userProfileId === userProfileId;
      const isOtherChannel = message.channelId !== activeChannelIdRef.current;

      if (isOtherChannel && !isFromSelf) {
        setUnreadChannelIds((prev) => new Set(prev).add(message.channelId));
      }

      if (
        !isFromSelf &&
        (isOtherChannel || document.hidden) &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        const notification = new Notification(message.nickname, {
          body: message.imageUrl ? "📷 Sent an image" : message.body,
        });
        notification.onclick = () => window.focus();
      }
    });

    socket.on("messageDeleted", ({ channelId, messageId }) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [channelId]: (prev[channelId] ?? []).filter((m) => m.id !== messageId),
      }));
    });

    socket.on("channelCreated", (channel) => {
      setChannels((prev) => [...prev, channel]);
    });

    socket.on("globalOnlineCount", (count) => setGlobalOnlineCount(count));

    socket.on("channelPresence", ({ channelId, nicknames }) => {
      setPresenceByChannel((prev) => ({ ...prev, [channelId]: nicknames }));
    });

    socket.on("errorMessage", (message) => {
      setToastError(message);
      setTimeout(() => setToastError(null), 4000);
    });

    socket.on("reactionsUpdated", ({ channelId, messageId, reactions }) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [channelId]: (prev[channelId] ?? []).map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        ),
      }));
    });

    socket.on("userTyping", ({ channelId, nickname: typingNickname }) => {
      const key = `${channelId}:${typingNickname}`;

      setTypingByChannel((prev) => {
        const current = prev[channelId] ?? [];
        if (current.includes(typingNickname)) return prev;
        return { ...prev, [channelId]: [...current, typingNickname] };
      });

      const existingTimeout = typingTimeoutsRef.current.get(key);
      if (existingTimeout) clearTimeout(existingTimeout);
      typingTimeoutsRef.current.set(
        key,
        setTimeout(() => {
          setTypingByChannel((prev) => ({
            ...prev,
            [channelId]: (prev[channelId] ?? []).filter((n) => n !== typingNickname),
          }));
          typingTimeoutsRef.current.delete(key);
        }, TYPING_EXPIRY_MS)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannelId, messagesByChannel]);

  function handleSelectChannel(channelId: string) {
    setActiveChannelId(channelId);
    setIsSidebarOpen(false);
    setUnreadChannelIds((prev) => {
      if (!prev.has(channelId)) return prev;
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
    if (!messagesByChannel[channelId]) {
      socketRef.current?.emit("joinChannel", channelId);
    }
  }

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setToastError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      setTimeout(() => setToastError(null), 4000);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setToastError("Image exceeds the 5MB size limit.");
      setTimeout(() => setToastError(null), 4000);
      return;
    }
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function clearSelectedImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImage(null);
    setImagePreviewUrl(null);
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeChannelId || (!messageInput.trim() && !selectedImage)) return;

    const channelId = activeChannelId;
    const body = messageInput.trim();

    if (selectedImage) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append("image", selectedImage);
        const response = await fetch("/api/chat/upload-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          setToastError(
            typeof result.error === "string" ? result.error : "Image upload failed."
          );
          setTimeout(() => setToastError(null), 4000);
          return;
        }
        socketRef.current?.emit("sendMessage", { channelId, body, imagePath: result.imagePath });
        clearSelectedImage();
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      socketRef.current?.emit("sendMessage", { channelId, body });
    }

    setMessageInput("");
  }

  function handleDeleteMessage(channelId: string, messageId: string) {
    socketRef.current?.emit("deleteOwnMessage", { channelId, messageId });
  }

  function handleToggleReaction(channelId: string, messageId: string, emoji: string) {
    socketRef.current?.emit("toggleReaction", { channelId, messageId, emoji });
  }

  function handleReportMessage(channelId: string, messageId: string) {
    socketRef.current?.emit("reportMessage", { channelId, messageId });
    setReportedMessageIds((prev) => new Set(prev).add(messageId));
  }

  function handleMessageInputChange(value: string) {
    setMessageInput(value);
    if (!activeChannelId) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_EMIT_THROTTLE_MS) {
      lastTypingEmitRef.current = now;
      socketRef.current?.emit("typing", activeChannelId);
    }
  }

  function handleCreateChannel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newChannelSlug.trim()) return;
    socketRef.current?.emit("createChannel", {
      slug: newChannelSlug.trim(),
      name: newChannelName.trim() || newChannelSlug.trim(),
    });
    setNewChannelSlug("");
    setNewChannelName("");
    setIsCreatingChannel(false);
  }

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeMessages = activeChannelId ? (messagesByChannel[activeChannelId] ?? []) : [];
  const activePresence = activeChannelId ? (presenceByChannel[activeChannelId] ?? []) : [];
  const activeTyping = (activeChannelId ? (typingByChannel[activeChannelId] ?? []) : []).filter(
    (n) => n !== nickname
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden sm:flex-row">
      {/* Sidebar: full-screen overlay on mobile, static column on desktop */}
      <aside
        className={`${
          isSidebarOpen ? "flex" : "hidden"
        } fixed inset-0 z-20 flex-col bg-gray-950 sm:static sm:z-auto sm:flex sm:h-full sm:w-64 sm:border-r sm:border-gray-800`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-wasp-yellow">WASP Chat</span>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="text-xl leading-none text-gray-400 sm:hidden"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <p className="px-4 pb-1 text-xs text-gray-500">Signed in as {nickname}</p>
        <p className="px-4 pb-2 text-xs text-green-400">
          🟢 {globalOnlineCount} online now
        </p>

        <ul className="flex-1 overflow-y-auto px-2">
          {channels.map((channel) => (
            <li key={channel.id}>
              <button
                type="button"
                onClick={() => handleSelectChannel(channel.id)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                  channel.id === activeChannelId
                    ? "bg-wasp-yellow text-black font-bold"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <span>#{channel.slug}</span>
                {unreadChannelIds.has(channel.id) && channel.id !== activeChannelId && (
                  <span
                    className="ml-2 h-2 w-2 shrink-0 rounded-full bg-wasp-yellow"
                    aria-label="Unread messages"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-800 p-2">
          {isCreatingChannel ? (
            <form onSubmit={handleCreateChannel} className="flex flex-col gap-2">
              <input
                autoFocus
                required
                placeholder="channel-name"
                value={newChannelSlug}
                onChange={(e) => setNewChannelSlug(e.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
              />
              <input
                placeholder="Display name (optional)"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-wasp-yellow px-2 py-1 text-xs font-bold text-black"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingChannel(false)}
                  className="rounded bg-gray-700 px-2 py-1 text-xs font-bold text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingChannel(true)}
              className="w-full rounded border border-dashed border-gray-700 px-2 py-1.5 text-sm text-gray-400 hover:border-wasp-yellow hover:text-wasp-yellow"
            >
              + Create channel
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 sm:pointer-events-none"
          >
            <span className="sm:hidden" aria-hidden="true">
              ☰
            </span>
            <h1 className="font-bold">
              {activeChannel ? `#${activeChannel.slug}` : "Select a channel"}
            </h1>
          </button>
          <div className="flex items-center gap-3">
            {notificationPermission === "default" && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="text-xs text-gray-400 underline hover:text-wasp-yellow"
              >
                🔔 Notify me
              </button>
            )}
            {notificationPermission === "denied" && (
              <span className="text-xs text-gray-600" title="Notifications blocked in browser settings">
                🔕
              </span>
            )}
            {notificationPermission === "granted" && (
              <span className="text-xs text-gray-500" title="Notifications on">
                🔔
              </span>
            )}
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>

        {activeChannel?.description && (
          <p className="border-b border-gray-800 px-4 py-1 text-xs text-gray-500">
            {activeChannel.description}
          </p>
        )}

        {activePresence.length > 0 && (
          <p className="border-b border-gray-800 px-4 py-1.5 text-xs text-gray-400">
            {activePresence.length} online here: {activePresence.join(", ")}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeMessages.map((message) => (
            <div key={message.id} className="group mb-2">
              <span className="font-bold text-wasp-yellow">{message.nickname}</span>{" "}
              <span className="text-xs text-gray-500">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.userProfileId === userProfileId ? (
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(message.channelId, message.id)}
                  className="ml-2 text-xs text-gray-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
                >
                  delete
                </button>
              ) : (
                <button
                  type="button"
                  disabled={reportedMessageIds.has(message.id)}
                  onClick={() => handleReportMessage(message.channelId, message.id)}
                  className="ml-2 text-xs text-gray-600 opacity-0 hover:text-red-400 group-hover:opacity-100 disabled:text-gray-700"
                >
                  {reportedMessageIds.has(message.id) ? "reported" : "report"}
                </button>
              )}
              {message.body && <p className="text-sm text-gray-900">{message.body}</p>}
              {message.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.imageUrl}
                  alt="Shared in chat"
                  className="mt-1 max-h-64 max-w-full rounded border border-gray-800"
                  loading="lazy"
                />
              )}
              <MessageReactions
                reactions={message.reactions}
                userProfileId={userProfileId}
                onToggle={(emoji) => handleToggleReaction(message.channelId, message.id, emoji)}
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {activeTyping.length > 0 && (
          <p className="px-4 py-1 text-xs italic text-gray-500">
            {activeTyping.join(", ")} {activeTyping.length === 1 ? "is" : "are"} typing...
          </p>
        )}

        {toastError && (
          <p className="bg-red-900/50 px-4 py-2 text-sm text-red-200">{toastError}</p>
        )}

        {imagePreviewUrl && (
          <div className="flex items-center gap-2 border-t border-gray-800 px-4 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreviewUrl} alt="Selected" className="h-14 w-14 rounded object-cover" />
            <button
              type="button"
              onClick={clearSelectedImage}
              className="text-xs text-gray-400 underline hover:text-red-400"
            >
              Remove
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-800 p-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!activeChannel}
            className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-wasp-yellow hover:text-wasp-yellow disabled:opacity-50"
            aria-label="Attach image"
          >
            📷
          </button>
          <input
            value={messageInput}
            onChange={(e) => handleMessageInputChange(e.target.value)}
            placeholder={
              activeChannel
                ? selectedImage
                  ? "Add a caption (optional)"
                  : `Message #${activeChannel.slug}`
                : "Select a channel first"
            }
            disabled={!activeChannel}
            className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!activeChannel || (!messageInput.trim() && !selectedImage) || isUploadingImage}
            className="rounded bg-wasp-yellow px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {isUploadingImage ? "Sending…" : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}
