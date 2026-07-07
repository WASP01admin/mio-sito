"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NewsItem {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  created_at: string;
  associations?: {
    code: string;
    name: string;
  };
}

type SortBy = "date" | "country" | "association";

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [sortedNews, setSortedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [formData, setFormData] = useState({
    headline: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    const sorted = [...newsList];
    if (sortBy === "date") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "country") {
      sorted.sort((a, b) => (a.associations?.code || "").localeCompare(b.associations?.code || ""));
    } else if (sortBy === "association") {
      sorted.sort((a, b) => (a.associations?.name || "").localeCompare(b.associations?.name || ""));
    }
    setSortedNews(sorted);
  }, [newsList, sortBy]);

  async function fetchNews() {
    try {
      const response = await fetch("/api/association/news");
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

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create news");
      }

      setFormData({ headline: "", description: "" });
      setImageFile(null);
      setShowForm(false);
      await fetchNews();
      alert("News created successfully!");
    } catch (error) {
      console.error("Error creating news:", error);
      alert("Failed to create news");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">WASP News</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Sort Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setSortBy("date")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              sortBy === "date"
                ? "bg-yellow-400 text-gray-900 shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📅 Date
          </button>
          <button
            onClick={() => setSortBy("country")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              sortBy === "country"
                ? "bg-yellow-400 text-gray-900 shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🌍 Country
          </button>
          <button
            onClick={() => setSortBy("association")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              sortBy === "association"
                ? "bg-yellow-400 text-gray-900 shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🏢 Association
          </button>
        </div>

        {/* News Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : sortedNews.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No news yet</div>
        ) : (
          <div className="space-y-4 mb-8">
            {sortedNews.map((news) => {
              const countryCode = news.associations?.code?.substring(0, 3) || "---";
              const date = new Date(news.created_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              });

              return (
                <div key={news.id} className="flex bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  {/* Left Panel - Metadata */}
                  <div className="w-32 bg-gray-100 p-4 flex flex-col justify-center items-center border-r border-gray-300">
                    <div className="text-sm font-bold text-gray-900">{date}</div>
                    <div className="text-lg font-bold text-gray-700 mt-2">{countryCode}</div>
                    <div className="text-xs text-gray-600 text-center mt-2 line-clamp-3">
                      {news.associations?.name || "WASP"}
                    </div>
                  </div>

                  {/* Middle Panel - Content */}
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">
                      {news.headline}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {news.description}
                    </p>
                  </div>

                  {/* Right Panel - Image Thumbnail */}
                  {news.image_url && (
                    <div className="w-24 p-2">
                      <img
                        src={news.image_url}
                        alt={news.headline}
                        className="w-full h-20 object-cover rounded"
                      />
                    </div>
                  )}
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
                <label className="block text-xs text-gray-600 mb-2">📸 Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded hover:bg-yellow-500 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post News"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
