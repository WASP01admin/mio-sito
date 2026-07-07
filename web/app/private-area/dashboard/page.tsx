"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  async function handleLogout() {
    // Clear session cookie by setting it to empty
    await fetch("/api/association/logout", { method: "POST" });
    router.push("/private-area");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">WASP Private Area</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Link href="/private-area/calendar">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Events Calendar</h2>
              <p className="text-gray-600">Create, manage, and promote your association events</p>
            </div>
          </Link>

          {/* News */}
          <Link href="/private-area/news">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">📰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">News & Updates</h2>
              <p className="text-gray-600">Share news with the community (auto-deletes after 180 days)</p>
            </div>
          </Link>

          {/* Map */}
          <Link href="/private-area/map">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Association Map</h2>
              <p className="text-gray-600">View your marker and manage visitor messages</p>
            </div>
          </Link>

          {/* Projects */}
          <Link href="/private-area/projects">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects & Funding</h2>
              <p className="text-gray-600">Post fundraising initiatives and ongoing projects</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
