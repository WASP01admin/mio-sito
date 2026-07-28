"use client";

import { useState } from "react";

export default function WalletButtons({ cardId }: { cardId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToGoogleWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/google-wallet/save-link?cardId=${cardId}`);
      const data = await response.json();
      if (data.ok && data.saveUrl) {
        window.location.href = data.saveUrl;
      } else {
        alert("Error generating wallet pass. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating wallet pass. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        disabled={isLoading}
        onClick={handleAddToGoogleWallet}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-black px-6 py-3 font-bold text-white hover:bg-black/80 disabled:opacity-50"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.05 13.5c-.91 0-1.64.75-1.64 1.67.02.93.73 1.67 1.64 1.67.9 0 1.64-.74 1.64-1.67-.01-.92-.74-1.67-1.64-1.67zM17.05 10.5c-1.84 0-3.34 1.52-3.34 3.37 0 1.85 1.5 3.37 3.34 3.37 1.84 0 3.34-1.52 3.34-3.37 0-1.85-1.5-3.37-3.34-3.37z" />
          <path d="M20.5 2H3.5C2.1 2 1 3.1 1 4.5v15C1 20.9 2.1 22 3.5 22h17c1.4 0 2.5-1.1 2.5-2.5v-15C23 3.1 21.9 2 20.5 2zm-9.5 16.5H4V8h7v10.5zm7-7h-4v4.5h4v-4.5z" />
        </svg>
        {isLoading ? "Loading..." : "Add to Apple Wallet"}
      </button>
      <button
        disabled={isLoading}
        onClick={handleAddToGoogleWallet}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-bold text-black hover:bg-gray-50 disabled:opacity-50"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.06 9h-1.42L12 5.5 7.36 9H5.94L12 2l6.06 7zm-1.42 0l-2.14-2.49-2.14 2.49H8.88L12 5.5l3.12 3.5h-2.48zM19.5 10.5H4.5v11h15v-11zm-1 10h-13v-9h13v9z" />
        </svg>
        {isLoading ? "Loading..." : "Add to Google Wallet"}
      </button>
    </div>
  );
}
