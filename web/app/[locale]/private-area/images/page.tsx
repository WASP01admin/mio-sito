"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

interface GalleryImage {
  id: string;
  url: string;
  association_name: string;
  created_at: string;
}

export default function ImagesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const response = await fetch("/api/association/my-images");
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an image");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/association/images-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchImages();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm("Delete this image?")) return;

    try {
      const response = await fetch(`/api/association/my-images/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete image");

      setImages(images.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  }

  async function handleLogout() {
    await fetch("/api/association/logout", { method: "POST" });
    router.push(`/${locale}/private-area`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <Link href={`/${locale}/private-area/dashboard`} className="text-yellow-600 hover:text-yellow-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Image Gallery</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New Image</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Image (Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (Max 5MB)</p>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50 font-semibold transition-colors"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg border border-gray-300"
                />
              </div>
            )}
          </form>
        </div>

        {/* Images Gallery */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Images ({images.length})
          </h2>

          {images.length === 0 ? (
            <p className="text-center text-gray-600 py-12">
              No images yet. Upload your first image above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className="flex flex-col">
                  <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={image.url}
                      alt={image.association_name}
                      className="w-full h-48 object-cover cursor-pointer group-hover:opacity-75 transition-opacity"
                      onClick={() => window.open(image.url, "_blank")}
                    />
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {image.association_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
