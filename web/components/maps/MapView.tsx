"use client";

import { useEffect, useRef, useState } from "react";

interface Marker {
  id: string;
  name: string;
  website: string | null;
  lat: number;
  lng: number;
  city: string;
  address: string | null;
  messageCount: number;
  is_super_friend?: boolean;
}

interface Message {
  id: string;
  message_text: string;
  created_at: string;
  parent_message_id: string | null;
  user_profiles: { nickname: string; id: string } | null;
}

interface MapViewProps {
  type: "association" | "donor";
  isAuthenticated: boolean;
}

export default function MapView({ type, isAuthenticated }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const clusterGroup = useRef<any>(null);

  // Initialize map with lazy Leaflet loading
  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      if (!mapContainer.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
      await import("leaflet.markercluster");

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      map.current = L.map(mapContainer.current).setView([41.8719, 12.5674], 4);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map.current);

      clusterGroup.current = L.markerClusterGroup({ maxClusterRadius: 80 });
      map.current.addLayer(clusterGroup.current);
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Create marker icon with custom colors - realistic pin style
  const createMarkerIcon = (color: string) => {
    return L.divIcon({
      html: `
        <div style="
          position: absolute;
          width: 32px;
          height: 40px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          border: 2px solid white;
        ">
          <div style="
            position: absolute;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      className: 'custom-marker-icon',
    });
  };

  // Fetch markers
  useEffect(() => {
    async function fetchMarkers() {
      try {
        const res = await fetch(`/api/maps/markers?type=${type}`);
        if (!res.ok) throw new Error("Failed to fetch markers");
        const data = await res.json();
        setMarkers(data.markers);
      } catch (error) {
        console.error("Error fetching markers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkers();
  }, [type]);

  // Add markers to map
  useEffect(() => {
    if (!map.current || !clusterGroup.current || !markers.length) return;

    const addMarkers = async () => {
      const L = (await import("leaflet")).default;
      const markerIcon = createMarkerIcon("#FFCE00");
      const superFriendIcon = createMarkerIcon("#DC143C");

      clusterGroup.current.clearLayers();

      for (const marker of markers) {
        const icon = marker.is_super_friend ? superFriendIcon : markerIcon;
        const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).bindPopup(
          `<div class="p-2">
            <h3 class="font-bold">${marker.name}${marker.is_super_friend ? " ⭐" : ""}</h3>
            ${marker.website ? `<p class="text-sm"><a href="${marker.website}" target="_blank" class="text-blue-600">Website</a></p>` : ""}
            <p class="text-xs text-gray-600">${marker.city}</p>
          </div>`
        );

        leafletMarker.on("click", () => {
          setSelectedMarker(marker);
          fetchMessages(marker.id);
        });

        clusterGroup.current.addLayer(leafletMarker);
      }
    };

    addMarkers();
  }, [markers]);

  // Fetch messages for selected marker
  async function fetchMessages(markerId: string) {
    try {
      const res = await fetch(`/api/maps/messages?type=${type}&markerId=${markerId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  }

  // Post message
  async function handlePostMessage() {
    if (!messageInput.trim() || !selectedMarker) return;

    try {
      const res = await fetch("/api/maps/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          markerId: selectedMarker.id,
          message: messageInput,
        }),
      });

      if (!res.ok) throw new Error("Failed to post message");

      setMessageInput("");
      await fetchMessages(selectedMarker.id);
    } catch (error) {
      console.error("Error posting message:", error);
      alert("Failed to post message");
    }
  }

  return (
    <div className="flex h-full gap-4">
      {/* Map */}
      <div className="flex-1">
        <div
          ref={mapContainer}
          className="h-full rounded-lg border border-gray-200"
          style={{ minHeight: "600px" }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <p className="text-gray-600">Loading {type}s...</p>
          </div>
        )}
      </div>

      {/* Messages sidebar */}
      {selectedMarker && (
        <div className="w-80 flex flex-col border-l border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <h2 className="font-bold text-lg">{selectedMarker.name}</h2>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
            >
              ✕
            </button>
          </div>
          {selectedMarker.website && (
            <a
              href={selectedMarker.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Visit website
            </a>
          )}
          <p className="text-xs text-gray-600">{selectedMarker.city}</p>

          <div className="mt-4 flex-1 overflow-y-auto border-t border-gray-200 pt-2">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="border-l-2 border-blue-200 bg-blue-50 p-2">
                    <p className="text-xs font-semibold text-gray-700">
                      {msg.user_profiles?.nickname || "Anonymous"}
                    </p>
                    <p className="text-sm text-gray-600">{msg.message_text}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message input - only for authenticated users */}
          {isAuthenticated ? (
            <div className="mt-4 border-t border-gray-200 pt-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Add a message..."
                className="w-full rounded border border-gray-300 p-2 text-sm"
                rows={3}
              />
              <button
                onClick={handlePostMessage}
                disabled={!messageInput.trim()}
                className="mt-2 w-full rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
              >
                Post message
              </button>
            </div>
          ) : (
            <p className="mt-4 border-t border-gray-200 pt-2 text-xs text-gray-600">
              Sign in with WASP Card to leave a message
            </p>
          )}
        </div>
      )}
    </div>
  );
}
