"use client";

import Link from "next/link";
import {
  Users,
  Heart,
  Clock,
  Building2,
  Newspaper,
  Gift,
  MessageSquare,
  Search,
} from "lucide-react";

const dashboardItems = [
  {
    href: "/admin/users-search",
    icon: Search,
    title: "Delete Users",
    description: "Search and delete user accounts",
    color: "from-red-600 to-red-800",
    borderColor: "border-red-400",
  },
  {
    href: "/admin/members",
    icon: Users,
    title: "Cardholders",
    description: "Manage WASP Card members and their profiles",
    color: "from-blue-600 to-blue-800",
    borderColor: "border-blue-400",
  },
  {
    href: "/admin/pending",
    icon: Clock,
    title: "Pending Submissions",
    description: "Review and approve pending member requests",
    color: "from-yellow-600 to-yellow-800",
    borderColor: "border-yellow-400",
  },
  {
    href: "/admin/associations",
    icon: Building2,
    title: "Associations",
    description: "Manage animal welfare organizations database",
    color: "from-green-600 to-green-800",
    borderColor: "border-green-400",
  },
  {
    href: "/admin/press",
    icon: Newspaper,
    title: "Publishers",
    description: "Manage news publishers and content",
    color: "from-purple-600 to-purple-800",
    borderColor: "border-purple-400",
  },
  {
    href: "/admin/donors",
    icon: Gift,
    title: "Donors",
    description: "Manage donor profiles and contributions",
    color: "from-pink-600 to-pink-800",
    borderColor: "border-pink-400",
  },
  {
    href: "/admin/chat",
    icon: MessageSquare,
    title: "Chat",
    description: "Monitor and moderate chat channels",
    color: "from-indigo-600 to-indigo-800",
    borderColor: "border-indigo-400",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <div className="bg-black border-b-4 border-wasp-yellow p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-wasp-yellow">📊 Dashboard</h1>
          <p className="text-gray-300 mt-2 text-lg">
            Manage all aspects of WASP
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`bg-gradient-to-br ${item.color} rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border-2 ${item.borderColor} h-full`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {item.title}
                  </h2>
                  <p className="text-white/80 text-sm">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
