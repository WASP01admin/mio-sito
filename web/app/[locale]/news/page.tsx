"use client";

import { useState, useEffect } from "react";

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

export default function PublicNewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [sortedNews, setSortedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">WASP News</h1>
          <p className="text-gray-600 mt-1">Latest updates from our community</p>
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
          <div className="space-y-4">
            {sortedNews.map((news) => {
              const countryCode = news.associations?.code?.substring(0, 3) || "---";
              const date = new Date(news.created_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              });

              return (
                <button
                  key={news.id}
                  onClick={() => setSelectedNews(news)}
                  className="w-full flex bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left hover:bg-gray-50"
                >
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">News Article</h2>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
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
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>
                      <strong>By:</strong> {selectedNews.associations?.name || "WASP"}
                    </span>
                    <span>
                      <strong>Country:</strong> {selectedNews.associations?.code?.substring(0, 3) || "---"}
                    </span>
                    <span>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedNews.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNews.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
