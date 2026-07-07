"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteMessageButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    setIsSubmitting(true);
    await fetch(`/api/admin/chat/messages/${messageId}`, { method: "DELETE" });
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={handleDelete}
      className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
    >
      Delete
    </button>
  );
}

export function DeleteChannelButton({ channelId }: { channelId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this channel and all its messages? This can't be undone.")) return;
    setIsSubmitting(true);
    await fetch(`/api/admin/chat/channels/${channelId}`, { method: "DELETE" });
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={handleDelete}
      className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
    >
      Delete channel
    </button>
  );
}

export function ToggleBanButton({
  userProfileId,
  banned,
}: {
  userProfileId: string;
  banned: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleToggle() {
    setIsSubmitting(true);
    await fetch(`/api/admin/chat/members/${userProfileId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !banned }),
    });
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={handleToggle}
      className={
        banned
          ? "rounded bg-gray-500 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
          : "rounded bg-red-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
      }
    >
      {banned ? "Unban" : "Ban"}
    </button>
  );
}
