"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  lat: number;
  lng: number;
  onPlace: (lat: number, lng: number) => void;
  onClose: () => void;
}

export default function MapPicker({ lat, lng, onPlace, onClose }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Leaflet dynamically
    const loadMap = async () => {
      // Use CDN for Leaflet (no npm install needed)
      if (!(window as any).L) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapRef.current) return;

      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([lat || 41.9028, lng || 12.4964], 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add initial marker
      const marker = L.marker([lat || 41.9028, lng || 12.4964]).addTo(map);
      markerRef.current = marker;

      // Handle map clicks
      map.on("click", (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
      });

      mapInstanceRef.current = map;
      setIsLoading(false);
    };

    loadMap();
  }, [lat, lng]);

  const handlePlace = () => {
    if (markerRef.current) {
      const { lat: markerLat, lng: markerLng } = markerRef.current.getLatLng();
      onPlace(markerLat, markerLng);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-11/12 max-w-2xl rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold">Click on map to place marker</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div
          ref={mapRef}
          className="h-96 w-full bg-gray-100"
          style={{ minHeight: "400px" }}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading map...</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handlePlace}
            className="rounded bg-wasp-yellow px-4 py-2 font-semibold text-black hover:bg-yellow-400"
          >
            Place Marker
          </button>
        </div>
      </div>
    </div>
  );
}
