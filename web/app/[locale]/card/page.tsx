"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import CardViewer from "@/components/card/CardViewer";

export default function CardPage() {
  const t = useTranslations("Card");
  const [step, setStep] = useState<"check" | "choose" | "loading" | "success">("check");
  const [hasCard, setHasCard] = useState(false);
  const [isAssociated, setIsAssociated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserStatus();
  }, []);

  async function checkUserStatus() {
    try {
      const response = await fetch("/api/card/me");
      if (response.ok) {
        const data = await response.json();
        if (data.card) {
          setHasCard(true);
          setStep("success");
          return;
        }
      }

      // Get current user
      const userResponse = await fetch("/api/user/profile");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserId(userData.id);
        setIsAssociated(!!userData.association_id);
      }

      setStep("choose");
    } catch (err) {
      console.error("Error checking status:", err);
      setError("Failed to load user status");
    } finally {
      setLoading(false);
    }
  }

  async function requestCard(type: "associated" | "direct") {
    if (!userId) {
      setError("User not found. Please log in.");
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const response = await fetch("/api/card/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId,
          requestType: type 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to request card");
      }

      const data = await response.json();
      setStep("success");
      setHasCard(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request card");
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎫 WASP Card</h1>
          <p className="text-gray-600">
            Your digital membership card for the global animal welfare movement
          </p>
        </div>

        {step === "success" && hasCard && (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 border-2 border-green-300 p-6 text-center mb-6">
              <p className="text-lg font-semibold text-green-700">
                ✓ Your WASP Card is ready!
              </p>
            </div>
            <CardViewer />
          </div>
        )}

        {step === "choose" && !hasCard && (
          <div className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border-2 border-red-300 p-4">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`rounded-lg border-3 p-8 cursor-pointer transition-all ${
                  isAssociated
                    ? "border-green-400 bg-green-50 hover:shadow-lg"
                    : "border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">FREE</h2>
                <p className="text-sm text-gray-600 mb-6">
                  If you're associated with any animal welfare organization
                </p>
                <div className="mb-6 space-y-2">
                  <p className="text-3xl font-bold text-green-600">€0.00</p>
                  <p className="text-xs text-gray-500">No payment required</p>
                </div>
                <button
                  onClick={() => requestCard("associated")}
                  disabled={!isAssociated || requesting}
                  className={`w-full py-3 rounded-lg font-bold transition-colors ${
                    isAssociated && !requesting
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {requesting ? "Creating..." : "Get Free Card"}
                </button>
                {!isAssociated && (
                  <p className="text-sm text-red-600 mt-3">
                    You're not associated with an organization yet
                  </p>
                )}
              </div>

              <div className="rounded-lg border-3 border-yellow-400 bg-yellow-50 p-8 cursor-pointer transition-all hover:shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">DIRECT</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Request directly to WASP without an organization
                </p>
                <div className="mb-6 space-y-2">
                  <p className="text-3xl font-bold text-yellow-600">€2.00</p>
                  <p className="text-xs text-gray-500">One-time payment</p>
                </div>
                <button
                  onClick={() => requestCard("direct")}
                  disabled={requesting}
                  className={`w-full py-3 rounded-lg font-bold transition-colors ${
                    !requesting
                      ? "bg-yellow-600 text-white hover:bg-yellow-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {requesting ? "Creating..." : "Pay & Get Card"}
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Payment method will be added soon
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
