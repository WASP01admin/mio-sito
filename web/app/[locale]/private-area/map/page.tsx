"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface AssociationMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  address: string;
  phone?: string;
  email?: string;
}

interface VisitorMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function AssociationMapPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [marker, setMarker] = useState<AssociationMarker | null>(null);
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formData, setFormData] = useState({
    latitude: 0,
    longitude: 0,
    title: "",
    description: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchMarkerData();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!showMapPicker || !mapContainerRef.current) return;

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        return;
      }

      const map = L.map(mapContainerRef.current!).setView([41.8719, 12.5674], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (formData.latitude && formData.longitude) {
        markerRef.current = L.marker([formData.latitude, formData.longitude])
          .addTo(map)
          .setOpacity(0.8);
        map.setView([formData.latitude, formData.longitude], 12);
      }

      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6)),
        }));

        if (markerRef.current) map.removeLayer(markerRef.current);
        markerRef.current = L.marker([lat, lng]).addTo(map).setOpacity(0.8);
      });

      mapRef.current = map;
    }, 100);

    return () => {
      if (mapRef.current && showMapPicker === false) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker]);

  async function fetchMarkerData() {
    try {
      const response = await fetch("/api/association/my-marker");
      if (!response.ok) throw new Error("Failed to fetch marker");
      const data = await response.json();
      setMarker(data);
      setFormData({
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        title: data.title || "",
        description: data.description || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    } catch (error) {
      console.error("Error fetching marker:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const response = await fetch("/api/association/my-marker-messages");
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function handleLogout() {
    await fetch("/api/association/logout", { method: "POST" });
    router.push(`/${locale}/private-area`);
  }

  async function handleSaveMarker(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch("/api/association/my-marker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save marker");

      const data = await response.json();
      setMarker(data);
      setEditing(false);
    } catch (error) {
      console.error("Error saving marker:", error);
      alert("Failed to save marker");
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!confirm("Delete this message?")) return;

    try {
      const response = await fetch(`/api/association/my-marker-messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete message");

      setMessages(messages.filter(m => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Association Map</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marker Management */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Map Marker</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-yellow-400 text-gray-900 px-3 py-1 rounded hover:bg-yellow-500 transition-colors text-sm font-semibold"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSaveMarker} className="space-y-4">
              {showMapPicker && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-700">Click on map to place marker</label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Close Map
                    </button>
                  </div>
                  <div
                    ref={mapContainerRef}
                    className="w-full h-64 rounded-lg border-2 border-yellow-300 z-10"
                  />
                  <p className="text-xs text-gray-500 italic">
                    📍 Click anywhere on the map to position your marker
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                {showMapPicker ? "🗺️ Hide Map Picker" : "🗺️ Pick Location on Map"}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  placeholder="Your Association Name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 min-h-24"
                  placeholder="Brief description of your association"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="+39..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : marker ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="text-lg font-semibold text-gray-900">{marker.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{marker.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-700">{marker.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Latitude</p>
                  <p className="font-mono text-sm">{marker.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Longitude</p>
                  <p className="font-mono text-sm">{marker.longitude.toFixed(6)}</p>
                </div>
              </div>
              {marker.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-700">{marker.phone}</p>
                </div>
              )}
              {marker.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-700">{marker.email}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No marker information yet. Click Edit to add your location.</p>
          )}
        </div>

        {/* Visitor Messages */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Visitor Messages ({messages.length})</h2>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`p-4 rounded-lg border-2 ${msg.is_read ? 'border-gray-200 bg-gray-50' : 'border-yellow-300 bg-yellow-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{msg.sender_name}</p>
                      <p className="text-sm text-gray-500">{msg.sender_email}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-700 mb-2">{msg.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
