"use client";

import { useState } from "react";
import VIPDetailModal from "./VIPDetailModal";
import VIPImageWithFallback from "./VIPImageWithFallback";

interface VIP {
  id: string;
  first_name: string;
  surname_initial?: string;
  surname?: string;
  nationality_code: string;
  bio: string;
  image_url: string;
}

type SortKey = "name" | "surname" | "nationality";

export default function VIPList({ vips }: { vips: VIP[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [selectedVIP, setSelectedVIP] = useState<VIP | null>(null);

  const sortedVIPs = [...vips].sort((a, b) => {
    if (sortBy === "surname") {
      const aKey = a.surname_initial || a.surname || '';
      const bKey = b.surname_initial || b.surname || '';
      return aKey.localeCompare(bKey);
    } else if (sortBy === "nationality") {
      return a.nationality_code.localeCompare(b.nationality_code);
    }
    // Default: name
    return a.first_name.localeCompare(b.first_name);
  });

  return (
    <div>
      {/* Sort buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setSortBy("name")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            sortBy === "name"
              ? "bg-yellow-400 text-gray-900"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sort by Name
        </button>
        <button
          onClick={() => setSortBy("surname")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            sortBy === "surname"
              ? "bg-yellow-400 text-gray-900"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sort by Surname
        </button>
        <button
          onClick={() => setSortBy("nationality")}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            sortBy === "nationality"
              ? "bg-yellow-400 text-gray-900"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sort by Country
        </button>
      </div>

      {/* VIP List */}
      <div className="space-y-4">
        {sortedVIPs.map((vip) => (
          <button
            key={vip.id}
            onClick={() => setSelectedVIP(vip)}
            className="w-full text-left bg-gradient-to-r from-yellow-50 to-white border-2 border-yellow-300 rounded-lg hover:shadow-lg hover:from-yellow-100 transition-all group overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              {/* Photo - Left side */}
              <div className="flex-shrink-0">
                <VIPImageWithFallback
                  src={vip.image_url}
                  alt={vip.first_name}
                  initials={vip.first_name[0] + vip.surname_initial}
                />
              </div>

              {/* Info - Right side */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {vip.first_name} {vip.surname || vip.surname_initial}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {vip.bio}
                  </p>
                </div>

                {/* Footer with Country Code and Click indicator */}
                <div className="flex items-center justify-between mt-3">
                  <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-lg font-bold text-sm">
                    {vip.nationality_code}
                  </span>
                  <div className="text-gray-400 group-hover:text-yellow-600 transition-colors">
                    ➜
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedVIP && (
        <VIPDetailModal
          vip={selectedVIP}
          onClose={() => setSelectedVIP(null)}
        />
      )}
    </div>
  );
}
