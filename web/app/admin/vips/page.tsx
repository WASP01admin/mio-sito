"use client";

import { useEffect, useState } from "react";

interface VIP {
  id: string;
  first_name: string;
  surname_initial?: string;
  surname?: string;
  nationality_code: string;
  bio: string;
  image_url: string;
  created_at: string;
}

export default function VIPsAdminPage() {
  const [vips, setVips] = useState<VIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    surname: "",
    nationality_code: "",
    bio: "",
    image_url: "",
  });

  useEffect(() => {
    fetchVIPs();
  }, []);

  async function fetchVIPs() {
    try {
      const res = await fetch("/api/admin/vips");
      const data = await res.json();
      setVips(data);
    } catch (error) {
      console.error("Error fetching VIPs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingId) {
        // Update
        await fetch("/api/admin/vips", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
      } else {
        // Create
        await fetch("/api/admin/vips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      setFormData({ first_name: "", surname: "", nationality_code: "", bio: "", image_url: "" });
      setEditingId(null);
      fetchVIPs();
    } catch (error) {
      console.error("Error saving VIP:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this VIP?")) return;

    try {
      await fetch(`/api/admin/vips?id=${id}`, { method: "DELETE" });
      fetchVIPs();
    } catch (error) {
      console.error("Error deleting VIP:", error);
    }
  }

  function handleEdit(vip: VIP) {
    setEditingId(vip.id);
    setFormData({
      first_name: vip.first_name,
      surname: vip.surname || vip.surname_initial || "",
      nationality_code: vip.nationality_code,
      bio: vip.bio,
      image_url: vip.image_url,
    });
  }

  async function handleImageUpload(vipId: string, file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setUploadingImageId(vipId);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("vipId", vipId);

      const response = await fetch("/api/admin/vip-upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      fetchVIPs();
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setUploadingImageId(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">VIP Management</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">{editingId ? "Edit VIP" : "Add New VIP"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Full Surname (e.g., Innocenzi)"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Country Code (IT, US, etc)"
            maxLength={3}
            value={formData.nationality_code}
            onChange={(e) => setFormData({ ...formData, nationality_code: e.target.value.toUpperCase() })}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <textarea
            placeholder="Bio (profession/description)"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="border p-2 rounded col-span-2"
            rows={3}
            required
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editingId ? "Update" : "Add"} VIP
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ first_name: "", surname: "", nationality_code: "", bio: "", image_url: "" });
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* VIP List */}
      <div>
        <h2 className="text-xl font-bold mb-4">Current VIPs ({vips.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vips.map((vip) => (
              <div key={vip.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  <img src={vip.image_url} alt={vip.first_name} className="w-20 h-20 rounded-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">
                    {vip.first_name} {vip.surname || vip.surname_initial}
                  </h3>
                  <p className="text-sm text-gray-600">{vip.nationality_code}</p>
                  <p className="text-sm">{vip.bio}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <label className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 cursor-pointer">
                    {uploadingImageId === vip.id ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={uploadingImageId === vip.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(vip.id, file);
                      }}
                    />
                  </label>
                  <button
                    onClick={() => handleEdit(vip)}
                    className="bg-amber-500 text-white px-3 py-1 rounded text-sm hover:bg-amber-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vip.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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
