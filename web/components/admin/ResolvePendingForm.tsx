"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssociationSearchResult } from "@wasp/shared";
import AssociationPicker from "./AssociationPicker";

export default function ResolvePendingForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AssociationSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    if (!selected) return;
    setIsSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/pending/${submissionId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ associationId: selected.id }),
    });
    const data = await res.json();
    setIsSubmitting(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "server_error");
      return;
    }
    router.refresh();
  }

  async function handleDiscard() {
    setIsSubmitting(true);
    await fetch(`/api/admin/pending/${submissionId}/discard`, { method: "POST" });
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <AssociationPicker onSelect={setSelected} className="w-56" />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!selected || isSubmitting}
          onClick={handleResolve}
          className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          Resolve
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleDiscard}
          className="rounded bg-gray-400 px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          Discard
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
