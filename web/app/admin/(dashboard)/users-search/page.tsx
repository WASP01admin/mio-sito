"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  email: string;
  nickname: string | null;
  membership_status: string;
  is_verified: boolean;
  created_at: string;
}

export default function UsersSearchPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "User not found");
        return;
      }

      setResult(data.user);
    } catch (err) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!result) return;
    if (!window.confirm(`Delete ${result.email}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/members/${result.id}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setError("Delete failed");
        return;
      }

      setResult(null);
      setEmail("");
      alert(`✅ User ${result.email} deleted`);
    } catch (err) {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Search & Delete Users</h1>
      <p className="mt-2 text-sm text-gray-600">
        Find a user by email and delete them from the system.
      </p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="email"
          required
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:border-black focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-3">
            <div>
              <span className="font-semibold text-gray-600">Email:</span>
              <p className="font-mono text-lg">{result.email}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Nickname:</span>
              <p>{result.nickname || "—"}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Status:</span>
              <p className="font-bold uppercase text-blue-600">{result.membership_status}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Verified:</span>
              <p>{result.is_verified ? "✅ Yes" : "❌ No"}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Created:</span>
              <p>{new Date(result.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-6 w-full rounded-md bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "🗑️ DELETE THIS USER"}
          </button>
        </div>
      )}
    </div>
  );
}
