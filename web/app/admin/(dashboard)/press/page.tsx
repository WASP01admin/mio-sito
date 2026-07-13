"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface Publisher {
  id: string;
  code: string;
  name: string;
  email: string;
  verified: boolean;
  password: string;
  articles_count: number;
  created_at: string;
  last_login: string | null;
}

export default function PressAdminPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPublishers();
  }, []);

  async function fetchPublishers() {
    try {
      const response = await fetch("/api/admin/press/list", {
        headers: {
          "X-Admin-Token": process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch publishers");
      const data = await response.json();
      setPublishers(data.publishers || []);
    } catch (error) {
      console.error("Error fetching publishers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(publisherId: string, action: string, extraData?: any) {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/press/${publisherId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "",
        },
        body: JSON.stringify({ action, ...extraData }),
      });

      if (!response.ok) throw new Error("Action failed");

      // Refresh list
      await fetchPublishers();
      setSelectedPublisher(null);
    } catch (error) {
      console.error("Error:", error);
      alert("Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📰 Publisher Management</h1>
        <p className="text-gray-600 mt-2">Supervise and control all bloggers (TOTAL CONTROL! 😈)</p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading publishers...</div>
      ) : publishers.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center text-gray-600">
          No publishers registered yet
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Testata</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Verified</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Articles</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Registered</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Last Login</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {publishers.map((pub) => (
                <tr key={pub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600">{pub.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{pub.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pub.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pub.verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {pub.verified ? "✓ Verified" : "⏳ Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    {pub.articles_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(pub.created_at).toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pub.last_login ? new Date(pub.last_login).toLocaleDateString("it-IT") : "Never"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedPublisher(pub)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Management Modal */}
      {selectedPublisher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Manage: {selectedPublisher.name}
            </h2>

            <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
              <div>
                <strong>Code:</strong> {selectedPublisher.code}
              </div>
              <div>
                <strong>Email:</strong> {selectedPublisher.email}
              </div>
              <div>
                <strong>Password:</strong> <code className="bg-white px-2 py-1 rounded">{selectedPublisher.password}</code>
              </div>
              <div>
                <strong>Status:</strong> {selectedPublisher.verified ? "✓ Verified" : "⏳ Pending"}
              </div>
              <div>
                <strong>Articles:</strong> {selectedPublisher.articles_count}
              </div>
            </div>

            <div className="space-y-2">
              {!selectedPublisher.verified && (
                <button
                  onClick={() =>
                    handleAction(selectedPublisher.id, "toggle-verify", { verified: true })
                  }
                  disabled={actionLoading}
                  className="w-full py-2 px-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading ? "Processing..." : "✓ Verify Publisher"}
                </button>
              )}

              {selectedPublisher.verified && (
                <button
                  onClick={() =>
                    handleAction(selectedPublisher.id, "toggle-verify", { verified: false })
                  }
                  disabled={actionLoading}
                  className="w-full py-2 px-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading ? "Processing..." : "⏸ Disable Publisher"}
                </button>
              )}

              <button
                onClick={() => handleAction(selectedPublisher.id, "reset-password")}
                disabled={actionLoading}
                className="w-full py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading ? "Processing..." : "🔑 Reset Password"}
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      `Delete ${selectedPublisher.name}? All their articles will be deleted too!`
                    )
                  ) {
                    handleAction(selectedPublisher.id, "delete");
                  }
                }}
                disabled={actionLoading}
                className="w-full py-2 px-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                {actionLoading ? "Processing..." : "🗑 Delete Publisher"}
              </button>
            </div>

            <button
              onClick={() => setSelectedPublisher(null)}
              className="w-full py-2 px-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
