import Link from "next/link";
import { Users as UsersIcon, MapPin } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function AdminDashboardPage() {
  // Fetch map coverage data
  let mapCoverage = { total: 0, onMap: 0, byCountry: {} };

  try {
    let allRecords: any[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabaseAdmin
        .from("associations")
        .select("country, lat, lng")
        .range(offset, offset + pageSize - 1);

      if (error || !data || data.length === 0) break;

      allRecords = allRecords.concat(data);

      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Count by country
    const byCountry: Record<string, { total: number; onMap: number }> = {};

    allRecords.forEach((record) => {
      const country = record.country || "Unknown";

      if (!byCountry[country]) {
        byCountry[country] = { total: 0, onMap: 0 };
      }

      byCountry[country].total++;

      if (record.lat && record.lng) {
        byCountry[country].onMap++;
      }
    });

    const total = allRecords.length;
    const onMap = allRecords.filter((r) => r.lat && r.lng).length;

    mapCoverage = {
      total,
      onMap,
      byCountry: Object.fromEntries(
        Object.entries(byCountry).sort(([, a], [, b]) => b.total - a.total)
      ),
    };
  } catch (err) {
    console.error("Error fetching map coverage:", err);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-900 p-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">WASP Admin Dashboard</h1>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Members */}
          <Link href="/admin/members">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-300">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Members</h2>
              <p className="text-gray-600">Manage memberships and approvals</p>
            </div>
          </Link>

          {/* Associations */}
          <Link href="/admin/associations">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-wasp-yellow">
              <div className="text-5xl mb-4">🏢</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Associations</h2>
              <p className="text-gray-600">5,069 associations across 7 countries</p>
            </div>
          </Link>

          {/* Users */}
          <Link href="/admin/users">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-blue-300">
              <div className="mb-4">
                <UsersIcon className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Users</h2>
              <p className="text-gray-600">Search and manage 5M+ user cards</p>
            </div>
          </Link>

          {/* VIPs */}
          <Link href="/admin/vips">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-300">
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">VIP Cards</h2>
              <p className="text-gray-600">Manage VIP card recipients</p>
            </div>
          </Link>

          {/* Chat */}
          <Link href="/admin/chat">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-300">
              <div className="text-5xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat Moderation</h2>
              <p className="text-gray-600">Manage chat channels and messages</p>
            </div>
          </Link>

          {/* Pending */}
          <Link href="/admin/pending">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-300">
              <div className="text-5xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Approvals</h2>
              <p className="text-gray-600">Review pending member approvals</p>
            </div>
          </Link>

          {/* Donors */}
          <Link href="/admin/donors">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-gray-300">
              <div className="text-5xl mb-4">💝</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Donors</h2>
              <p className="text-gray-600">Manage donor information</p>
            </div>
          </Link>

          {/* Calendar */}
          <Link href="/admin/calendar">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendar</h2>
              <p className="text-gray-600">Create WASP events</p>
            </div>
          </Link>

          {/* News */}
          <Link href="/admin/news">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">📰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">News</h2>
              <p className="text-gray-600">Post WASP announcements</p>
            </div>
          </Link>

          {/* Projects */}
          <Link href="/admin/projects">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
              <p className="text-gray-600">Create fundraising initiatives</p>
            </div>
          </Link>
        </div>

        {/* Map Coverage Stats */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-300">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Map Coverage</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-gray-600 font-medium">On Map</p>
                <p className="text-3xl font-bold text-green-700">{mapCoverage.onMap.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 font-medium">Total Associations</p>
                <p className="text-3xl font-bold text-gray-700">{mapCoverage.total.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-600 font-medium">Coverage</p>
                <p className="text-3xl font-bold text-blue-700">
                  {mapCoverage.total > 0
                    ? ((mapCoverage.onMap / mapCoverage.total) * 100).toFixed(1)
                    : "0"}
                  %
                </p>
              </div>
            </div>

            {/* By Country Breakdown */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Country</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">On Map</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mapCoverage.byCountry).map(([country, stats]: [string, any]) => {
                    const coverage = ((stats.onMap / stats.total) * 100).toFixed(1);
                    const isHighCoverage = parseFloat(coverage) >= 70;
                    const isMediumCoverage = parseFloat(coverage) >= 50;

                    return (
                      <tr key={country} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{country}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{stats.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{stats.onMap.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          isHighCoverage
                            ? "text-green-700"
                            : isMediumCoverage
                              ? "text-blue-700"
                              : "text-orange-700"
                        }`}>
                          {coverage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              📍 Associations with coordinates (lat + lng) are visible on the map. Missing coordinates can be added manually or via geocoding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
