"use client";

import { useState } from "react";
import { ALLOWED_REACTION_EMOJIS, type ChatReactionSummary } from "";

interface MessageReactionsProps {
  reactions: ChatReactionSummary[];
  userProfileId: string;
  onToggle: (emoji: string) => void;
}

export default function MessageReactions({
  reactions,
  userProfileId,
  onToggle,
}: MessageReactionsProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const activeReactions = reactions.filter((r) => r.userProfileIds.length > 0);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {activeReactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={`rounded-full border px-1.5 py-0.5 text-xs ${
            r.userProfileIds.includes(userProfileId)
              ? "border-wasp-yellow bg-wasp-yellow/20 text-wasp-yellow"
              : "border-gray-700 text-gray-300 hover:border-gray-500"
          }`}
        >
          {r.emoji} {r.userProfileIds.length}
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsPickerOpen((prev) => !prev)}
          className="rounded-full border border-gray-700 px-1.5 py-0.5 text-xs text-gray-400 opacity-0 hover:border-gray-500 group-hover:opacity-100"
        >
          +
        </button>
        {isPickerOpen && (
          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded border border-gray-700 bg-gray-900 p-1">
            {ALLOWED_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggle(emoji);
                  setIsPickerOpen(false);
                }}
                className="rounded px-1 py-0.5 text-sm hover:bg-gray-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
