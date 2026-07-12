"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GalleryImage {
  id: string;
  url: string;
  association_name: string;
  created_at: string;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const response = await fetch("/api/admin/images");
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteImage(imageId: string, imageName: string) {
    if (!confirm(`Delete image from ${imageName}?`)) return;

    try {
      const response = await fetch(`/api/admin/images/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete image");

      setImages(images.filter((img) => img.id !== imageId));
      setSelectedImage(null);
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-900 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Image Moderation</h1>
          <p className="text-gray-600 mt-2">Review and manage gallery images</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-gray-300">
          <p className="text-2xl font-bold text-gray-900">
            Total Images: <span className="text-blue-600">{images.length}</span>
          </p>
        </div>

        {/* Images Gallery */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {images.length === 0 ? (
            <p className="text-center text-gray-600 py-12">No images to moderate</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className="flex flex-col">
                  <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={image.url}
                      alt={image.association_name}
                      className="w-full h-48 object-cover cursor-pointer group-hover:opacity-75 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                    />
                    <button
                      onClick={() =>
                        handleDeleteImage(image.id, image.association_name)
                      }
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
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

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-900">
                {selectedImage.association_name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleDeleteImage(
                      selectedImage.id,
                      selectedImage.association_name
                    )
                  }
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <img
              src={selectedImage.url}
              alt={selectedImage.association_name}
              className="w-full h-auto max-h-96 object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Published: {new Date(selectedImage.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
