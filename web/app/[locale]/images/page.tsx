"use client";

import { useState, useEffect } from "react";

interface GalleryImage {
  id: string;
  url: string;
  association_name: string;
  created_at: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const response = await fetch("/api/public/images");
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setImages(data || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6">
        <p className="text-center text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-gray-50 p-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Global Image Gallery</h1>
        <p className="text-gray-600 mt-2">
          Discover images from animal welfare associations worldwide
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {images.length === 0 ? (
          <p className="text-center text-gray-600 py-12">No images yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="flex flex-col cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={image.url}
                    alt={image.association_name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-gray-900">
                    {image.association_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
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
    </main>
  );
}
