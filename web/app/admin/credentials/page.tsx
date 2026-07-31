"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

export default function CredentialsPage() {
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Get credentials from env (only non-secret parts visible)
  const credentials = [
    {
      id: "supabase_url",
      name: "Supabase URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isSecret: false,
    },
    {
      id: "supabase_anon",
      name: "Supabase Anon Key",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      isSecret: true,
    },
    {
      id: "resend_api",
      name: "Resend API Key",
      value: process.env.RESEND_API_KEY,
      isSecret: true,
    },
    {
      id: "resend_email",
      name: "Resend From Email",
      value: process.env.RESEND_FROM_EMAIL,
      isSecret: false,
    },
  ];

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskValue = (value: string) => {
    if (!value) return "NOT SET";
    if (value.length <= 8) return "•".repeat(value.length);
    return value.substring(0, 4) + "•".repeat(value.length - 8) + value.substring(value.length - 4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-red-600 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">🔐 Credentials & Configuration</h1>
          </div>
          <p className="text-gray-600 mt-2">Manage API keys, secrets, and sensitive configuration</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Sensitive Information:</strong> These credentials are required for production. Never share or commit them to version control.
          </p>
        </div>

        <div className="space-y-4">
          {credentials.map((cred) => (
            <div key={cred.id} className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-gray-300 transition">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{cred.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cred.id}</p>
                </div>
                {cred.isSecret && (
                  <button
                    onClick={() => toggleVisibility(cred.id)}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    {visibleKeys[cred.id] ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded border border-gray-300 p-3 font-mono text-sm text-gray-700 break-all">
                  {visibleKeys[cred.id] ? cred.value : maskValue(cred.value)}
                </div>
                {cred.value && (
                  <button
                    onClick={() => copyToClipboard(cred.value, cred.id)}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      copiedKey === cred.id
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {copiedKey === cred.id ? (
                      <Check className="w-4 h-4 inline mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 inline mr-2" />
                    )}
                    {copiedKey === cred.id ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">📝 Configuration Notes</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Supabase URL:</strong> The base URL for your Supabase project. Used for all API requests.
            </li>
            <li>
              <strong>Supabase Anon Key:</strong> Public key for client-side Supabase access. Safe to expose.
            </li>
            <li>
              <strong>Resend API Key:</strong> Email service authentication. Keep secret.
            </li>
            <li>
              <strong>Resend From Email:</strong> Default sender email for notifications.
            </li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to GOD-ADMIN
          </Link>
        </div>
      </div>
    </div>
  );
}
