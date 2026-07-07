"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(false);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError(true);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-bold">WASP Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to continue.</p>

        <input
          type="password"
          autoFocus
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
        />

        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            Incorrect password.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full rounded-md bg-black px-4 py-2 text-sm font-bold text-wasp-yellow disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
