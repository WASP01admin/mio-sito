"use client";

import { useState } from "react";

export default function VIPImageWithFallback({
  src,
  alt,
  initials,
}: {
  src: string;
  alt: string;
  initials: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-24 h-32 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg border-2 border-yellow-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {initials.toUpperCase()}
          </div>
          <div className="text-xs text-gray-700 mt-1">{alt}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-24 h-32 bg-gray-200 rounded-lg border-2 border-yellow-400 overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
