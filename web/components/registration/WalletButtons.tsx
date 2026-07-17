"use client";

import { useState } from "react";

interface WalletButtonsProps {
  code: string;
}

export default function WalletButtons({ code }: WalletButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wallet/google-link?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      if (data.url) {
        // Redirect to Google Wallet save URL
        window.location.href = data.url;
      } else {
        alert("Failed to generate Google Wallet link");
      }
    } catch (error) {
      console.error("Error getting Google Wallet link:", error);
      alert("Error connecting to Google Wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      <a
        href={`/api/wallet/pass?code=${encodeURIComponent(code)}`}
        download={`WASP-${code}.pkpass`}
        className="inline-block rounded-md bg-black px-6 py-3 text-sm font-bold text-wasp-yellow hover:bg-gray-900"
      >
        Add to Apple Wallet
      </a>
      <button
        onClick={handleGoogleWallet}
        disabled={isLoading}
        className="inline-block rounded-md bg-black px-6 py-3 text-sm font-bold text-wasp-yellow hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading..." : "Add to Google Wallet"}
      </button>
    </div>
  );
}
