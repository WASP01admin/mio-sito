"use client";

interface VIP {
  id: string;
  first_name: string;
  surname_initial: string;
  nationality_code: string;
  bio: string;
  image_url: string;
}

export default function VIPCard({ vip }: { vip: VIP }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-yellow-300">
      {/* Image */}
      <div className="h-64 overflow-hidden bg-gray-200">
        <img
          src={vip.image_url}
          alt={vip.first_name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=" + vip.first_name;
          }}
        />
      </div>

      {/* Info */}
      <div className="p-6 bg-gradient-to-b from-white to-yellow-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {vip.first_name} {vip.surname_initial}.
          </h3>
          <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold">
            {vip.nationality_code}
          </span>
        </div>

        <p className="text-gray-700 text-sm mb-3 leading-relaxed">{vip.bio}</p>

        <div className="pt-3 border-t-2 border-yellow-300 flex items-center justify-between">
          <span className="text-xs text-gray-600">WASP VIP</span>
          <span className="text-lg">🏆</span>
        </div>
      </div>
    </div>
  );
}
