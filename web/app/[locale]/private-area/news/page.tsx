"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface NewsItem {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  created_at: string;
  published_date?: string | null;
  original_source?: string | null;
  associations?: {
    code: string;
    name: string;
  };
}

export default function AssociationNewsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    headline: "",
    description: "",
    published_date: new Date().toISOString().split('T')[0],
    original_source: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      const response = await fetch("/api/association/my-news");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setNewsList(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNews(e: React.FormEvent) {
    e.preventDefault();

    const headline = (e.currentTarget.querySelector('[placeholder="Headline"]') as HTMLInputElement)?.value || "";
    const description = (e.currentTarget.querySelector('[placeholder="Description"]') as HTMLTextAreaElement)?.value || "";
    const published_date = (e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement)?.value || "";
    const original_source = (e.currentTarget.querySelector('[placeholder="Source or link"]') as HTMLInputElement)?.value || "";

    if (!headline.trim() || !description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFile);

        const uploadRes = await fetch("/api/association/news-upload-image", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) throw new Error("Image upload failed");

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      }

      const response = await fetch("/api/association/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          description,
          image_url: imageUrl,
          published_date,
          original_source,
        }),
      });

      if (!response.ok) throw new Error("Failed to create news");

      setFormData({ headline: "", description: "", published_date: new Date().toISOString().split('T')[0], original_source: "" });
      setImageFile(null);
      setShowForm(false);
      await fetchNews();
      alert("News created successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create news");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNews(id: string) {
    if (!confirm("Delete this news?")) return;

    try {
      const response = await fetch(`/api/association/news/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchNews();
      alert("News deleted");
    } catch (error) {
      alert("Failed to delete news");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Your News</h1>
          <Link href={`/${locale}/private-area/dashboard`} className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* News Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : newsList.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No news yet</div>
        ) : (
          <div className="space-y-4 mb-8">
            {newsList.map((news) => {
              const date = new Date(news.created_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              });

              return (
                <div key={news.id} className="flex bg-white rounded-lg shadow hover:shadow-lg transition-shadow group">
                  {/* Left Panel - Date */}
                  <div className="w-20 bg-gray-100 p-4 flex items-center justify-center border-r border-gray-300">
                    <div className="text-sm font-bold text-gray-900">{date}</div>
                  </div>

                  {/* Middle Panel - Content (Clickable) */}
                  <button
                    onClick={() => setSelectedNews(news)}
                    className="flex-1 p-4 text-left hover:bg-gray-50"
                  >
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">
                      {news.headline}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {news.description}
                    </p>
                  </button>

                  {/* Right Panel - Actions */}
                  <div className="w-24 bg-gray-50 p-2 flex flex-col gap-2 items-center justify-center border-l border-gray-300">
                    <button
                      onClick={() => setSelectedNews(news)}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteNews(news.id)}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create News Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-6 py-3 rounded-full font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition-colors shadow-md"
        >
          {showForm ? "Cancel" : "+ Create News"}
        </button>

        {/* Post Form */}
        {showForm && (
          <div className="mt-6 max-w-2xl bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-gray-700">
                ⓘ <strong>Nota:</strong> Se stai rilanciando una notizia non tua, riporta la fonte originale dell'articolo nell'apposito spazio.
              </p>
            </div>

            <form onSubmit={handleCreateNews} className="space-y-4">
              <input
                type="text"
                placeholder="Headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                required
                disabled={submitting}
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                rows={4}
                required
                disabled={submitting}
              />
              <div>
                <label className="block text-xs text-gray-600 mb-2">📅 Publication Date</label>
                <input
                  type="date"
                  value={formData.published_date}
                  onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">🔗 Original Source or Link (optional)</label>
                <input
                  type="text"
                  placeholder="Source or link"
                  value={formData.original_source}
                  onChange={(e) => setFormData({ ...formData, original_source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">📸 Image (optional)</label>
                <label className="block w-full px-4 py-2 border border-gray-300 rounded text-sm bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={submitting}
                  />
                  <span className="text-gray-700">
                    {imageFile ? `📎 ${imageFile.name}` : "Browse... No file selected."}
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded hover:bg-yellow-500 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post News"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="w-full bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">News Article</h2>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {selectedNews.image_url && (
                <img
                  src={selectedNews.image_url}
                  alt={selectedNews.headline}
                  className="w-full h-96 object-cover rounded-lg mb-6"
                />
              )}

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedNews.headline}
                  </h1>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div>
                      <strong>Published:</strong>{" "}
                      {selectedNews.published_date
                        ? new Date(selectedNews.published_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : new Date(selectedNews.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                    </div>
                    {selectedNews.original_source && (
                      <div>
                        <strong>Source:</strong>{" "}
                        {selectedNews.original_source.startsWith("http") ? (
                          <a
                            href={selectedNews.original_source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedNews.original_source}
                          </a>
                        ) : (
                          <span>{selectedNews.original_source}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedNews.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
