"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface CardData {
  number: string;
  issuedAt: string;
  expiresAt: string;
  status: string;
  type: "associated" | "direct";
  isExpired: boolean;
  userName: string;
  associationName: string;
  userImage?: string | null;
}

export default function CardViewer() {
  const t = useTranslations("Card");
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCard();
  }, []);

  async function fetchCard() {
    try {
      const response = await fetch("/api/card/me");
      if (!response.ok) throw new Error("Failed to fetch card");
      const data = await response.json();
      setCard(data.card);
    } catch (error) {
      console.error("Error fetching card:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPass() {
    setDownloading(true);
    try {
      const response = await fetch("/api/card/download");
      if (!response.ok) throw new Error("Failed to download pass");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `WASP-${card?.number}.pkpass`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading pass:", error);
      alert("Failed to download wallet pass");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-600">Loading card...</div>;
  }

  if (!card) {
    return (
      <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-8 text-center">
        <p className="mb-4 text-lg font-semibold text-gray-900">
          {t("noCardYet")}
        </p>
        <p className="mb-6 text-gray-600">
          {t("requestCardDescription")}
        </p>
        <button className="bg-yellow-400 px-6 py-3 font-bold text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors">
          {t("requestCard")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Visual */}
      <div className="rounded-xl border-2 border-gray-900 bg-gradient-to-br from-gray-900 to-black p-8 text-white shadow-xl">
        {/* Top Section - Association & Type */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Association</p>
            <p className="text-lg font-bold text-wasp-yellow">
              {card.associationName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Type</p>
            <p className="text-sm font-bold text-gray-300">
              {card.type === "associated" ? "ASSOCIATED" : "DIRECT"}
            </p>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mb-8 flex gap-4 pb-8 border-b border-gray-700">
          {/* User Image */}
          {card.userImage && (
            <div className="flex-shrink-0">
              <img
                src={card.userImage}
                alt={card.userName}
                className="w-16 h-16 rounded-full border-2 border-wasp-yellow object-cover"
              />
            </div>
          )}
          {/* User Name */}
          <div className="flex-1">
            <p className="text-xs text-gray-400">Member</p>
            <p className="text-xl font-bold text-white">{card.userName}</p>
          </div>
        </div>

        {/* Card Number */}
        <div className="mb-8 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider">{t("cardNumber")}</p>
          <p className="text-3xl font-mono font-bold tracking-wider">
            {card.number}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 border-t border-gray-700 pt-8">
          <div>
            <p className="text-xs text-gray-400">{t("issued")}</p>
            <p className="text-sm font-semibold">
              {new Date(card.issuedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">{t("expires")}</p>
            <p className={`text-sm font-semibold ${card.isExpired ? "text-red-400" : "text-green-400"}`}>
              {new Date(card.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {card.isExpired && (
          <div className="rounded-lg bg-red-500/20 border border-red-500 p-3">
            <p className="text-sm font-semibold text-red-300">
              {t("cardExpired")}
            </p>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">{t("status")}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            card.isExpired
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}>
            {card.isExpired ? "EXPIRED" : "ACTIVE"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">{t("type")}</span>
          <span className="text-sm text-gray-600">
            {card.type === "associated" ? t("typeAssociated") : t("typeDirect")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleDownloadPass}
          disabled={downloading || card.isExpired}
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
        >
          {downloading ? "Downloading..." : "📱 Add to Wallet"}
        </button>
        {card.isExpired && (
          <button className="flex-1 bg-yellow-400 text-gray-900 px-4 py-3 rounded-lg hover:bg-yellow-500 font-semibold transition-colors">
            {t("renewCard")}
          </button>
        )}
      </div>
    </div>
  );
}
