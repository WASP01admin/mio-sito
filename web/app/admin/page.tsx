import Link from "next/link";
import { Key, LayoutDashboard } from "lucide-react";

export default function AdminHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <div className="bg-black border-b-4 border-wasp-yellow p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-wasp-yellow">👑 GOD-ADMIN</h1>
          <p className="text-gray-300 mt-1 text-lg">Central control center for WASP</p>
        </div>
      </div>

      {/* Hub */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dashboard */}
          <Link href="/admin/dashboard">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-10 hover:shadow-3xl transition-all cursor-pointer transform hover:scale-105 border-2 border-blue-400">
              <div className="flex items-center gap-4 mb-4">
                <LayoutDashboard className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Dashboard</h2>
              <p className="text-blue-100 text-lg">
                Manage all content: news, projects, events, users, associations, donors, VIPs, and more
              </p>
            </div>
          </Link>

          {/* Credentials */}
          <Link href="/admin/credentials">
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl shadow-2xl p-10 hover:shadow-3xl transition-all cursor-pointer transform hover:scale-105 border-2 border-red-400">
              <div className="flex items-center gap-4 mb-4">
                <Key className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Credentials</h2>
              <p className="text-red-100 text-lg">
                Manage API keys, secrets, passwords, and sensitive configuration
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
