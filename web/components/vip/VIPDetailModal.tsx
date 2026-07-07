"use client";

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

export default function VIPDetailModal({
  vip,
  onClose,
}: {
  vip: VIP;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="sticky top-0 right-0 p-4 flex justify-end bg-gradient-to-r from-yellow-50 to-white">
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Card Content */}
        <div className="p-8">
          {/* Real Card Design */}
          <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-2xl p-6 relative overflow-hidden shadow-xl mb-6">
            {/* Honeycomb pattern background */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(120deg, transparent, transparent 2px, rgba(0,0,0,.1) 2px, rgba(0,0,0,.1) 4px)',
              }}
            ></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-yellow-600">
                <p className="text-4xl font-black text-gray-900">WASP</p>
                <p className="text-xs text-gray-700 font-semibold">
                  WASP HQ - ROMA, ITA
                </p>
              </div>

              {/* Photo + Badge Section */}
              <div className="flex gap-4 items-start mb-6">
                {/* Photo in frame */}
                <div className="flex-shrink-0 rounded-lg border-4 border-yellow-600 overflow-hidden shadow-lg">
                  <VIPImageWithFallback
                    src={vip.image_url}
                    alt={vip.first_name}
                    initials={vip.first_name[0] + vip.surname_initial}
                  />
                </div>

                {/* Info + Badge */}
                <div className="flex-1">
                  {/* Name */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-700 font-bold uppercase tracking-wider">
                      VIP - {vip.first_name}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {vip.surname || vip.surname_initial}
                    </p>
                  </div>

                  {/* Country + Expiry */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">
                      {vip.nationality_code}
                    </span>
                    <span className="text-xs text-gray-700">exp. 2028</span>
                  </div>

                  {/* VIP Crown Badge */}
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-yellow-300 text-lg font-bold border-2 border-yellow-300 shadow-lg">
                      👑
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="h-1 bg-gray-700 rounded my-4"></div>

              {/* Card Number */}
              <div className="text-center pb-4 border-b-2 border-yellow-600">
                <p className="text-xs text-gray-700 font-semibold tracking-wider">
                  n. {vip.nationality_code.toUpperCase()}WASP0042{(vip.surname_initial || vip.surname || '').charAt(0).toUpperCase()}
                </p>
              </div>

              {/* Wallet Indicator */}
              <div className="flex justify-center mt-4">
                <div className="w-8 h-6 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-sm shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              About {vip.first_name}
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              {vip.bio}
            </p>
          </div>

          {/* Close Button */}
          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:shadow-lg transition-shadow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
