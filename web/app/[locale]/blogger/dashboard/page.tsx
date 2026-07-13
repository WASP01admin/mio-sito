"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BloggerArticle {
  id: string;
  title: string;
  content: string;
  created_at: string;
  image_url?: string;
  published_date?: string;
}

export default function BloggerDashboard() {
  const router = useRouter();
  const [articles, setArticles] = useState<BloggerArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewArticleForm, setShowNewArticleForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    published_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const response = await fetch("/api/blogger/news", {
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/blogger/login");
        return;
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert("Title and content required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/blogger/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create article");
      const data = await response.json();

      setArticles([data.article, ...articles]);
      setFormData({
        title: "",
        content: "",
        image_url: "",
        published_date: new Date().toISOString().split("T")[0],
      });
      setShowNewArticleForm(false);
      alert("Article published!");
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Failed to publish article");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteArticle(id: string) {
    if (!confirm("Delete this article?")) return;

    try {
      const response = await fetch(`/api/blogger/news?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete article");
      setArticles(articles.filter((a) => a.id !== id));
      alert("Article deleted");
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article");
    }
  }

  function handleLogout() {
    router.push("/blogger/login");
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">WASP News Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* New Article Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Articles</h2>
            <button
              onClick={() => setShowNewArticleForm(!showNewArticleForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showNewArticleForm ? "Cancel" : "+ New Article"}
            </button>
          </div>

          {showNewArticleForm && (
            <form onSubmit={handleCreateArticle} className="space-y-4 pb-6 border-b">
              <div>
                <label className="block text-sm font-semibold mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Article title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Write your article..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Published Date</label>
                <input
                  type="date"
                  value={formData.published_date}
                  onChange={(e) =>
                    setFormData({ ...formData, published_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Publishing..." : "Publish Article"}
              </button>
            </form>
          )}
        </div>

        {/* Articles List */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No articles yet</p>
            <p className="text-gray-500 mt-2">
              Click "New Article" to publish your first story
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {article.content}
                    </p>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>
                        Published:{" "}
                        {new Date(article.published_date || article.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        Created:{" "}
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteArticle(article.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
