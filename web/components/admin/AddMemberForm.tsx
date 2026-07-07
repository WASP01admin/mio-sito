"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssociationSearchResult } from "@wasp/shared";
import AssociationPicker from "./AssociationPicker";

const EMPTY_FORM = {
  nickname: "",
  email: "",
  firstName: "",
  lastName: "",
  fiscalCode: "",
  notes1: "",
  notes2: "",
  membershipStatus: "pending",
  isVerified: false,
  expiresAt: "",
};

type FormState = typeof EMPTY_FORM;

export default function AddMemberForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [association, setAssociation] = useState<AssociationSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!association) {
      setError("association_required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessCode(null);

    const res = await fetch("/api/admin/members/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, associationId: association.id }),
    });
    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "server_error");
      return;
    }

    setSuccessCode(data.code ?? "created (not yet verified)");
    setForm(EMPTY_FORM);
    setAssociation(null);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4"
    >
      <input
        required
        placeholder="Nickname"
        value={form.nickname}
        onChange={(e) => update("nickname", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="First name"
        value={form.firstName}
        onChange={(e) => update("firstName", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Last name"
        value={form.lastName}
        onChange={(e) => update("lastName", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Fiscal code"
        value={form.fiscalCode}
        onChange={(e) => update("fiscalCode", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <AssociationPicker onSelect={setAssociation} />
      <select
        value={form.membershipStatus}
        onChange={(e) => update("membershipStatus", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <input
        type="date"
        title="Expires at (optional)"
        value={form.expiresAt}
        onChange={(e) => update("expiresAt", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <label className="col-span-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isVerified}
          onChange={(e) => update("isVerified", e.target.checked)}
        />
        Email verified (generates membership code immediately)
      </label>
      <input
        placeholder="Notes 1"
        value={form.notes1}
        onChange={(e) => update("notes1", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Notes 2"
        value={form.notes2}
        onChange={(e) => update("notes2", e.target.value)}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-3 py-1.5 text-sm font-bold text-wasp-yellow disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add member"}
      </button>
      {error && (
        <p className="col-span-full text-sm font-semibold text-red-600">Error: {error}</p>
      )}
      {successCode && (
        <p className="col-span-full text-sm font-semibold text-green-700">
          Member created: {successCode}
        </p>
      )}
    </form>
  );
}
