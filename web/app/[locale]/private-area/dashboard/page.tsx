"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

interface ProjectPreview {
  id: string;
  headline: string;
  description: string;
  created_at: string;
  needs_online_personnel: boolean;
  needs_field_personnel: boolean;
  needs_volunteers: boolean;
  needs_instruments: boolean;
  needs_financial: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [projects, setProjects] = useState<ProjectPreview[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/association/my-projects", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("✅ Projects loaded:", data);
          setProjects(Array.isArray(data) ? data.slice(0, 3) : []);
        } else {
          console.error("❌ API returned:", res.status);
        }
      } catch (err) {
        console.error("💥 Fetch failed:", err);
      }
    };
    loadProjects();

    // TEST: Add hardcoded project to verify rendering
    setTimeout(() => {
      setProjects([{
        id: "test-123",
        headline: "TEST PROJECT - If you see this, rendering works!",
        description: "This is a hardcoded test to verify the dashboard section renders.",
        created_at: new Date().toISOString(),
        needs_online_personnel: true,
        needs_field_personnel: false,
        needs_volunteers: false,
        needs_instruments: false,
        needs_financial: false,
      }]);
    }, 1000);
  }, []);

  async function handleLogout() {
    await fetch("/api/association/logout", { method: "POST" });
    router.push(`/${locale}/private-area`);
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
          <Link href={`/${locale}/private-area/calendar`}>
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">📅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Events Calendar</h2>
              <p className="text-gray-600">Create, manage, and promote your association events</p>
            </div>
          </Link>

          {/* News */}
          <Link href={`/${locale}/private-area/news`}>
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">📰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">News</h2>
              <p className="text-gray-600">Share news with the community (auto-deletes after 180 days)</p>
            </div>
          </Link>

          {/* Map */}
          <Link href={`/${locale}/private-area/map`}>
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Association Map</h2>
              <p className="text-gray-600">View your marker and manage visitor messages</p>
            </div>
          </Link>

          {/* Projects */}
          <Link href={`/${locale}/private-area/projects`}>
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
              <p className="text-gray-600">Post fundraising initiatives and ongoing projects</p>
            </div>
          </Link>

          {/* Donors */}
          <Link href={`/${locale}/private-area/donors`}>
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Donor Network</h2>
              <p className="text-gray-600">Add and manage donor businesses in your territory</p>
            </div>
          </Link>

          {/* Images */}
          <Link href={`/${locale}/private-area/images`}>
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-300">
              <div className="text-5xl mb-4">🖼️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Images</h2>
              <p className="text-gray-600">Upload and manage your association image gallery</p>
            </div>
          </Link>
        </div>

        {/* Projects Preview Section */}
        <div className="mt-12 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Recent Projects</h2>
          {projects.length === 0 ? (
            <p className="text-gray-600">No projects yet. <Link href={`/${locale}/private-area/projects`} className="text-blue-600 underline">Create one</Link></p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/${locale}/private-area/projects`}>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-400 hover:shadow-lg transition-shadow cursor-pointer">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{project.headline}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-4">Debug: {projects.length} projects loaded</p>
        </div>
      </div>
    </div>
  );
}
