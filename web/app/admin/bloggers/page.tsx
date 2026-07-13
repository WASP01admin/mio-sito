"use client";

import { useState, useEffect } from "react";

interface Blogger {
  id: string;
  name: string;
  email: string;
  blog_url?: string;
  bio?: string;
  status: "active" | "revoked";
  created_at: string;
}

export default function AdminBloggersPage() {
  const [bloggers, setBloggers] = useState<Blogger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    blog_url: "",
    bio: "",
  });
  const [inviting, setInviting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  useEffect(() => {
    fetchBloggers();
  }, []);

  async function fetchBloggers() {
    try {
      // TODO: Create endpoint to fetch all bloggers
      // For now, show empty state
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bloggers:", error);
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Name and email required");
      return;
    }

    setInviting(true);
    const token = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/blogger/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to invite blogger");
      const data = await response.json();

      setTempPassword(data.tempPassword);
      setFormData({ name: "", email: "", blog_url: "", bio: "" });
      alert(`Blogger invited! Share this password: ${data.tempPassword}`);
      setShowInviteForm(false);

      // Refresh bloggers list
      fetchBloggers();
    } catch (error) {
      console.error("Error inviting blogger:", error);
      alert("Failed to invite blogger");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(bloggerId: string) {
    if (!confirm("Revoke this blogger's credentials?")) return;

    const token = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/blogger/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogger_id: bloggerId }),
      });

      if (!response.ok) throw new Error("Failed to revoke blogger");
      fetchBloggers();
      alert("Blogger revoked");
    } catch (error) {
      console.error("Error revoking blogger:", error);
      alert("Failed to revoke blogger");
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Bloggers</h1>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showInviteForm ? "Cancel" : "+ Invite Blogger"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Invite New Blogger</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Journalist name"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="journalist@example.com"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Blog URL</label>
                <input
                  type="url"
                  value={formData.blog_url}
                  onChange={(e) =>
                    setFormData({ ...formData, blog_url: e.target.value })
                  }
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Brief bio..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {inviting ? "Inviting..." : "Send Invite"}
              </button>
            </form>

            {tempPassword && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Temporary Password:</strong> <code className="bg-white px-2 py-1 rounded font-mono">{tempPassword}</code>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Share this password with the blogger. They can change it after first login.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bloggers List */}
        {bloggers.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-600 text-lg">No bloggers invited yet</p>
            <p className="text-gray-500 mt-2">
              Click "Invite Blogger" to add a content creator
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Blog</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bloggers.map((blogger) => (
                  <tr key={blogger.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{blogger.name}</td>
                    <td className="px-6 py-3 text-sm">{blogger.email}</td>
                    <td className="px-6 py-3 text-sm">
                      {blogger.blog_url ? (
                        <a
                          href={blogger.blog_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🔗
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          blogger.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {blogger.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {new Date(blogger.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {blogger.status === "active" && (
                        <button
                          onClick={() => handleRevoke(blogger.id)}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
