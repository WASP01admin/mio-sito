"use client";

import { useState, useEffect, useCallback } from "react";
import RichTextEditor from "@/components/RichTextEditor";

interface NewsItem {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  created_at: string;
  published_date?: string | null;
  original_source?: string | null;
  author_type?: "hq" | "association" | "blogger";
  blogger_id?: string;
  blogger?: {
    name: string;
    blog_url?: string;
  };
  associations?: {
    code: string;
    name: string;
  };
}

interface PressArticle {
  id: string;
  title: string;
  content: string;
  created_at: string;
  image_url?: string;
  published_date?: string;
}

type SortBy = "date" | "country" | "association";

export default function PublicNewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [sortedNews, setSortedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Press login states
  const [isPressLoggedIn, setIsPressLoggedIn] = useState(false);
  const [showPressLogin, setShowPressLogin] = useState(false);
  const [pressCode, setPressCode] = useState("");
  const [pressPassword, setPressPassword] = useState("");
  const [pressLoggingIn, setPressLoggingIn] = useState(false);
  const [pressError, setPressError] = useState("");
  const [pressName, setPressName] = useState("");

  // Press registration states
  const [showPressRegister, setShowPressRegister] = useState(false);
  const [registerPublisherName, setRegisterPublisherName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerCountry, setRegisterCountry] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Press dashboard states
  const [pressArticles, setPressArticles] = useState<PressArticle[]>([]);
  const [pressArticlesLoading, setPressArticlesLoading] = useState(false);
  const [showNewArticleForm, setShowNewArticleForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    published_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Like states
  const [sessionId, setSessionId] = useState<string>("");
  const [articleLikes, setArticleLikes] = useState<{ [key: string]: { count: number; userLiked: boolean } }>({});
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
    checkPressLogin();
    initSessionId();
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

  // Fetch likes for all articles
  useEffect(() => {
    if (sessionId && sortedNews.length > 0) {
      sortedNews.forEach((news) => {
        if (!articleLikes[news.id]) {
          fetchArticleLikes(news.id);
        }
      });
    }
  }, [sessionId, sortedNews]);

  function initSessionId() {
    let sid = localStorage.getItem("session_id");
    if (!sid) {
      sid = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("session_id", sid);
    }
    setSessionId(sid);
  }

  async function fetchArticleLikes(articleId: string) {
    try {
      const response = await fetch(`/api/press/articles/like?article_id=${articleId}`, {
        headers: {
          "X-Session-ID": sessionId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setArticleLikes((prev) => ({
          ...prev,
          [articleId]: { count: data.likeCount, userLiked: data.userLiked },
        }));
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  }

  async function handleLikeToggle(articleId: string, currentLiked: boolean) {
    console.log("🤍 Like toggle clicked:", { articleId, currentLiked, sessionId });

    if (!sessionId) {
      alert("Session not initialized yet, please refresh");
      return;
    }

    setLikeLoading(articleId);
    try {
      const response = await fetch("/api/press/articles/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify({
          article_id: articleId,
          action: currentLiked ? "unlike" : "like",
        }),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Like success:", data);
        setArticleLikes((prev) => ({
          ...prev,
          [articleId]: { count: data.likeCount, userLiked: data.liked },
        }));
      } else {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLikeLoading(null);
    }
  }

  function checkPressLogin() {
    const stored_press_id = localStorage.getItem("press_id");
    const stored_press_code = localStorage.getItem("press_code");
    const stored_press_name = localStorage.getItem("press_name");

    if (stored_press_id && stored_press_code) {
      setIsPressLoggedIn(true);
      setPressName(stored_press_name || "");
      fetchPressArticles(stored_press_id, stored_press_code);
    }
  }

  async function fetchNews() {
    try {
      const response = await fetch("/api/all-news");
      const data = await response.json();
      setNewsList(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPressArticles(id: string, code: string) {
    setPressArticlesLoading(true);
    try {
      const response = await fetch("/api/press/articles", {
        headers: {
          "X-Press-ID": id,
          "X-Press-Code": code,
        },
      });

      if (!response.ok) {
        setIsPressLoggedIn(false);
        localStorage.removeItem("press_id");
        localStorage.removeItem("press_code");
        localStorage.removeItem("press_name");
        return;
      }

      const data = await response.json();
      setPressArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setPressArticlesLoading(false);
    }
  }

  async function handlePressLogin(e: React.FormEvent) {
    e.preventDefault();
    setPressError("");
    setPressLoggingIn(true);

    try {
      const response = await fetch("/api/press/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pressCode, password: pressPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPressError(data.error || "Login failed");
        return;
      }

      // Login successful
      localStorage.setItem("press_id", data.press_id);
      localStorage.setItem("press_code", data.press_code);
      localStorage.setItem("press_name", data.press_name);

      setIsPressLoggedIn(true);
      setPressName(data.press_name);
      setShowPressLogin(false);
      setPressCode("");
      setPressPassword("");

      await fetchPressArticles(data.press_id, data.press_code);
    } catch (error) {
      setPressError("An error occurred during login");
      console.error(error);
    } finally {
      setPressLoggingIn(false);
    }
  }

  async function handlePressRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess(false);
    setRegisterLoading(true);

    try {
      const response = await fetch("/api/press/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publisher_name: registerPublisherName,
          email: registerEmail,
          country: registerCountry,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || "Registration failed");
        return;
      }

      // Success
      setRegisterSuccess(true);
      setRegisterPublisherName("");
      setRegisterEmail("");
      setRegisterCountry("");
    } catch (error) {
      setRegisterError("An error occurred during registration");
      console.error(error);
    } finally {
      setRegisterLoading(false);
    }
  }


  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, published_date: e.target.value }));
  }, []);

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      alert("Title and content required");
      return;
    }

    if (formData.content.length < 500) {
      alert("Content must be at least 500 characters");
      return;
    }

    const press_id = localStorage.getItem("press_id");
    const press_code = localStorage.getItem("press_code");

    if (!press_id || !press_code) {
      alert("Not authenticated");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";

      // Upload image if provided
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);
        formDataImage.append("press_id", press_id);

        const uploadResponse = await fetch("/api/press/upload", {
          method: "POST",
          body: formDataImage,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const response = await fetch("/api/press/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Press-ID": press_id,
          "X-Press-Code": press_code,
        },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to create article");
      const data = await response.json();

      setPressArticles([data.article, ...pressArticles]);
      setFormData({
        title: "",
        content: "",
        image_url: "",
        published_date: new Date().toISOString().split("T")[0],
      });
      setImageFile(null);
      setImagePreview("");
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

    const press_id = localStorage.getItem("press_id");
    const press_code = localStorage.getItem("press_code");

    if (!press_id || !press_code) {
      alert("Not authenticated");
      return;
    }

    try {
      const response = await fetch(`/api/press/articles?id=${id}`, {
        method: "DELETE",
        headers: {
          "X-Press-ID": press_id,
          "X-Press-Code": press_code,
        },
      });

      if (!response.ok) throw new Error("Failed to delete article");
      setPressArticles(pressArticles.filter((a) => a.id !== id));
      alert("Article deleted");
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article");
    }
  }

  function handlePressLogout() {
    localStorage.removeItem("press_id");
    localStorage.removeItem("press_code");
    localStorage.removeItem("press_name");
    setIsPressLoggedIn(false);
    setPressArticles([]);
    setPressName("");
  }

  // If press is logged in, show dashboard
  if (isPressLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Press Publisher: {pressName}</h1>
            <button
              onClick={handlePressLogout}
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
                    onChange={handleTitleChange}
                    placeholder="Article title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold">Content *</label>
                    <span
                      className={`text-sm font-semibold ${
                        formData.content.length >= 500 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formData.content.length}/500 characters
                    </span>
                  </div>

                  <RichTextEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Write your article... (minimum 500 characters)"
                  />

                  {formData.content.length < 500 && (
                    <p className="text-red-600 text-sm mt-1">
                      Minimum 500 characters required ({500 - formData.content.length} more needed)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Image <span className="text-gray-500 text-xs">(max 1 per article)</span>
                  </label>
                  {!imagePreview ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs h-32 object-cover rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Published Date</label>
                  <input
                    type="date"
                    value={formData.published_date}
                    onChange={handleDateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || formData.content.length < 500}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Publishing..." : "Publish Article"}
                </button>
              </form>
            )}
          </div>

          {/* Articles List */}
          {pressArticlesLoading ? (
            <div className="text-center py-12">Loading articles...</div>
          ) : pressArticles.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600 text-lg">No articles yet</p>
              <p className="text-gray-500 mt-2">
                Click "New Article" to publish your first story
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pressArticles.map((article) => (
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

  // Otherwise, show public news page with press login button
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
        {/* Press Login Button */}
        <div className="mb-6 flex justify-end gap-3">
          <button
            onClick={() => setShowPressRegister(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            📝 Diventa Publisher
          </button>
          <button
            onClick={() => setShowPressLogin(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            📰 Press Login
          </button>
        </div>

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
            📰 Publisher
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

              const likes = articleLikes[news.id] || { count: 0, userLiked: false };

              // Debug log
              if (news.id === sortedNews[0]?.id) {
                console.log("📊 First article render:", { articleId: news.id, likes, sessionId });
              }

              return (
                <div
                  key={news.id}
                  className="w-full flex bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left hover:bg-gray-50 overflow-hidden"
                >
                  {/* Left Panel - Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0 p-1 flex items-center justify-center bg-gray-100 border-r border-gray-300">
                    {news.image_url ? (
                      <img
                        src={news.image_url}
                        alt={news.headline}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-2xl">📄</span>
                    )}
                  </div>

                  {/* Middle Panel - Metadata + Content */}
                  <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                    <div className="flex gap-3 text-xs text-gray-600 mb-2 truncate">
                      <span className="font-semibold flex-shrink-0">{date}</span>
                      <span className="font-semibold flex-shrink-0">{countryCode}</span>
                      <span className="line-clamp-1 truncate">{news.associations?.name || "WASP"}</span>
                    </div>
                    <button
                      onClick={() => setSelectedNews(news)}
                      className="text-left"
                    >
                      <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1 break-words">
                        {news.headline}
                      </h3>
                      <div
                        className="text-sm text-gray-700 line-clamp-2 break-words prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: news.description }}
                      />
                    </button>
                  </div>

                  {/* Right Panel - Like Counter */}
                  <div className="flex flex-col items-center justify-center gap-1 px-3 py-4 border-l border-gray-300 min-w-[60px]">
                    <button
                      onClick={(e) => {
                        console.log("🖱️ Button clicked!");
                        e.stopPropagation();
                        handleLikeToggle(news.id, likes.userLiked);
                      }}
                      disabled={likeLoading === news.id}
                      className="text-2xl hover:scale-110 transition-transform disabled:opacity-50 cursor-pointer"
                    >
                      {likes.userLiked ? "❤️" : "🤍"}
                    </button>
                    <span className="text-xs font-semibold text-gray-700">
                      {likes.count}
                    </span>
                  </div>
                </div>
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
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex gap-4">
                      <span>
                        <strong>By:</strong>{" "}
                        {selectedNews.author_type === "blogger" && selectedNews.blogger ? (
                          selectedNews.blogger.blog_url ? (
                            <a
                              href={selectedNews.blogger.blog_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedNews.blogger.name} 🔗
                            </a>
                          ) : (
                            <span>{selectedNews.blogger.name}</span>
                          )
                        ) : (
                          selectedNews.associations?.name || "WASP"
                        )}
                      </span>
                      <span>
                        <strong>Country:</strong> {selectedNews.associations?.code?.substring(0, 3) || "---"}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span>
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
                      </span>
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

                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800"
                  dangerouslySetInnerHTML={{ __html: selectedNews.description }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Press Login Modal */}
      {showPressLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Press Login</h2>
              <p className="text-gray-600 mt-2">Publish your news stories</p>
            </div>

            {pressError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {pressError}
              </div>
            )}

            <form onSubmit={handlePressLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Press Code
                </label>
                <input
                  type="text"
                  value={pressCode}
                  onChange={(e) => setPressCode(e.target.value)}
                  placeholder="e.g., ITA0099"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={pressPassword}
                  onChange={(e) => setPressPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={pressLoggingIn}
                className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {pressLoggingIn ? "Logging in..." : "Login"}
              </button>
            </form>

            <button
              onClick={() => setShowPressLogin(false)}
              className="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Press Registration Modal */}
      {showPressRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Diventa Publisher</h2>
              <p className="text-gray-600 mt-2">Registra la tua testata giornalistica</p>
            </div>

            {registerError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {registerError}
              </div>
            )}

            {registerSuccess ? (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <p className="font-semibold">Verifica la tua email! 📧</p>
                <p className="text-sm mt-2">
                  Abbiamo inviato un link di verifica a <strong>{registerEmail}</strong>
                </p>
                <p className="text-sm mt-2">
                  Clicca il link per completare la registrazione e ricevere le tue credenziali di accesso.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePressRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Testata/Publisher *
                  </label>
                  <input
                    type="text"
                    value={registerPublisherName}
                    onChange={(e) => setRegisterPublisherName(e.target.value)}
                    placeholder="es. La Gazzetta del Web"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paese *
                  </label>
                  <input
                    type="text"
                    list="countries"
                    value={registerCountry}
                    onChange={(e) => setRegisterCountry(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="es. Italia (ITA)"
                    maxLength={3}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 uppercase"
                  />
                  <datalist id="countries">
                    <option value="ITA">Italia</option>
                    <option value="USA">USA</option>
                    <option value="GBR">Regno Unito</option>
                    <option value="FRA">Francia</option>
                    <option value="DEU">Germania</option>
                    <option value="ESP">Spagna</option>
                    <option value="POR">Portogallo</option>
                    <option value="GRC">Grecia</option>
                    <option value="AUT">Austria</option>
                    <option value="BEL">Belgio</option>
                    <option value="NLD">Olanda</option>
                    <option value="POL">Polonia</option>
                    <option value="CZE">Repubblica Ceca</option>
                    <option value="SWE">Svezia</option>
                    <option value="NOR">Norvegia</option>
                    <option value="DNK">Danimarca</option>
                    <option value="FIN">Finlandia</option>
                    <option value="IRL">Irlanda</option>
                    <option value="CHE">Svizzera</option>
                    <option value="CAN">Canada</option>
                    <option value="AUS">Australia</option>
                    <option value="NZL">Nuova Zelanda</option>
                    <option value="JPN">Giappone</option>
                    <option value="CHN">Cina</option>
                    <option value="IND">India</option>
                    <option value="BRA">Brasile</option>
                    <option value="MEX">Messico</option>
                    <option value="ZAF">Sud Africa</option>
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="nome@esempio.it"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  La password ti verrà inviata via email dopo la verifica dell'account.
                </p>

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {registerLoading ? "Registrazione..." : "Registrati"}
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setShowPressRegister(false);
                setRegisterError("");
                setRegisterSuccess(false);
              }}
              className="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
