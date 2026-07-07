"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY_FORM = {
  nickname: "",
  email: "",
  firstName: "",
  lastName: "",
  notes1: "",
  notes2: "",
};

type FormState = typeof EMPTY_FORM;

export default function AddVipMemberForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  function update(key: keyof FormState) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessCode(null);

    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "server_error");
      return;
    }

    setSuccessCode(data.code);
    setForm(EMPTY_FORM);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3"
    >
      <input
        required
        placeholder="Nickname"
        value={form.nickname}
        onChange={update("nickname")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={update("email")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="First name"
        value={form.firstName}
        onChange={update("firstName")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Last name"
        value={form.lastName}
        onChange={update("lastName")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Notes 1"
        value={form.notes1}
        onChange={update("notes1")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        placeholder="Notes 2"
        value={form.notes2}
        onChange={update("notes2")}
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-3 py-1.5 text-sm font-bold text-wasp-yellow disabled:opacity-50"
      >
        {isSubmitting ? "Issuing..." : "Issue VIP card"}
      </button>
      {error && (
        <p className="col-span-full text-sm font-semibold text-red-600">Error: {error}</p>
      )}
      {successCode && (
        <p className="col-span-full text-sm font-semibold text-green-700">
          Card issued: {successCode}
        </p>
      )}
    </form>
  );
}
