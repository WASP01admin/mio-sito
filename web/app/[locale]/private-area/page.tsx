"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function PrivateAreaLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/association/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to dashboard
      router.push(`/${locale}/private-area/dashboard`);
    } catch (err) {
      setError("An error occurred during login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WASP</h1>
          <p className="text-gray-600">Association Private Area</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Association ID (e.g., ITA0125)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              placeholder="ITA0125"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password (e.g., bear53)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-2">Need credentials?</p>
          <p>Contact WASP to request your Association ID and password.</p>
        </div>
      </div>
    </div>
  );
}
