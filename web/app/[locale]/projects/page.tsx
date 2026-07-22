"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ProjectItem {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  created_at: string;
  needs_online_personnel: boolean;
  needs_online_personnel_details: string | null;
  needs_field_personnel: boolean;
  needs_field_personnel_details: string | null;
  needs_volunteers: boolean;
  needs_volunteers_details: string | null;
  needs_instruments: boolean;
  needs_instruments_details: string | null;
  needs_financial: boolean;
  needs_financial_details: string | null;
  financial_target: number | null;
  associations?: {
    code: string;
    name: string;
    website?: string;
    extra_details?: {
      facebook?: string;
      instagram?: string;
      [key: string]: any;
    };
  };
}

type SortBy = "date" | "country" | "association";

export default function PublicProjectsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [sortedProjects, setSortedProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const sorted = [...projectsList];
    if (sortBy === "date") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "country") {
      sorted.sort((a, b) => (a.associations?.code || "").localeCompare(b.associations?.code || ""));
    } else if (sortBy === "association") {
      sorted.sort((a, b) => (a.associations?.name || "").localeCompare(b.associations?.name || ""));
    }
    setSortedProjects(sorted);
  }, [projectsList, sortBy]);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/association/projects");
      const data = await response.json();
      setProjectsList(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">WASP Projects & Fundraising</h1>
          <p className="text-gray-600 mt-1">Support our initiatives around the world</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Sort Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setSortBy("date")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              sortBy === "date"
                ? "bg-yellow-400 text-gray-900 shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📅 Date
          </button>
          <button
            onClick={() => setSortBy("country")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              sortBy === "country"
                ? "bg-yellow-400 text-gray-900 shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🌍 Country
          </button>
          <button
            onClick={() => setSortBy("association")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              sortBy === "association"
                ? "bg-yellow-400 text-gray-900 shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🏢 Association
          </button>
        </div>

        {/* Project Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : sortedProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No projects yet</div>
        ) : (
          <div className="space-y-4">
            {sortedProjects.map((project) => {
              const countryCode = project.associations?.code?.substring(0, 3) || "---";
              const date = new Date(project.created_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              });

              return (
                <div
                  key={project.id}
                  className="w-full flex bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  {/* Left Panel - Country + Association */}
                  <div className="w-32 bg-gray-100 p-4 flex flex-col justify-center items-center border-r border-gray-300">
                    <div className="text-2xl font-bold text-gray-700">{countryCode}</div>
                    <div className="text-xs text-gray-600 text-center mt-2 line-clamp-2 font-semibold">
                      {project.associations?.name || "WASP"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{date}</div>
                  </div>

                  {/* Middle Panel - Content */}
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">
                      {project.headline}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  {/* Resource Icons */}
                  <div className="flex items-center gap-3 px-4 border-l border-gray-300">
                    {project.needs_online_personnel && (
                      <img src="/icons/resources/online-personnel.png" alt="Online Personnel" title="Online Personnel" className="w-10 h-10" />
                    )}
                    {project.needs_field_personnel && (
                      <img src="/icons/resources/field-personnel.png" alt="Field Personnel" title="Field Personnel" className="w-10 h-10" />
                    )}
                    {project.needs_volunteers && (
                      <img src="/icons/resources/volunteer.png" alt="Volunteers" title="Volunteers" className="w-10 h-10" />
                    )}
                    {project.needs_instruments && (
                      <img src="/icons/resources/instruments.png" alt="Instruments & Tools" title="Instruments & Tools" className="w-10 h-10" />
                    )}
                    {project.needs_financial && (
                      <img src="/icons/resources/financial.png" alt="Financial Support" title="Financial Support" className="w-10 h-10" />
                    )}
                  </div>

                  {/* Right Panel - Image */}
                  {project.image_url && (
                    <div className="w-24 p-2">
                      <img
                        src={project.image_url}
                        alt={project.headline}
                        className="w-full h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {selectedProject.image_url && (
                <img
                  src={selectedProject.image_url}
                  alt={selectedProject.headline}
                  className="w-full h-96 object-cover rounded-lg mb-6"
                />
              )}

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedProject.headline}
                  </h1>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>
                      <strong>By:</strong> {selectedProject.associations?.name || "WASP"}
                    </span>
                    <span>
                      <strong>Country:</strong> {selectedProject.associations?.code?.substring(0, 3) || "---"}
                    </span>
                    <span>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedProject.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Contact Section */}
                <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3">📞 Get in Touch</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 mb-3">
                      Interested in this project? Contact the association to discuss how you can help:
                    </p>
                    {selectedProject.associations?.website && (
                      <a
                        href={selectedProject.associations.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded font-bold hover:bg-blue-700 transition-colors"
                      >
                        🌐 Visit Association Website
                      </a>
                    )}
                    {selectedProject.associations?.extra_details?.facebook && (
                      <a
                        href={selectedProject.associations.extra_details.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded font-bold hover:bg-blue-600 transition-colors"
                      >
                        f Follow on Facebook
                      </a>
                    )}
                    {selectedProject.associations?.extra_details?.instagram && (
                      <a
                        href={selectedProject.associations.extra_details.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-pink-500 text-white text-center py-2 px-4 rounded font-bold hover:bg-pink-600 transition-colors"
                      >
                        📷 Follow on Instagram
                      </a>
                    )}
                  </div>
                </div>

                {/* Resources Needed */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3">🎯 Resources Needed</h3>
                  <div className="space-y-3">
                    {selectedProject.needs_online_personnel && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <img src="/icons/resources/online-personnel.png" alt="Online Personnel" className="w-5 h-5" />
                          <span className="font-semibold">Online Personnel (remote skills)</span>
                        </div>
                        {selectedProject.needs_online_personnel_details && (
                          <p className="text-sm text-gray-600 ml-7">{selectedProject.needs_online_personnel_details}</p>
                        )}
                      </div>
                    )}
                    {selectedProject.needs_field_personnel && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <img src="/icons/resources/field-personnel.png" alt="Field Personnel" className="w-5 h-5" />
                          <span className="font-semibold">Field Personnel (on-site professionals)</span>
                        </div>
                        {selectedProject.needs_field_personnel_details && (
                          <p className="text-sm text-gray-600 ml-7">{selectedProject.needs_field_personnel_details}</p>
                        )}
                      </div>
                    )}
                    {selectedProject.needs_volunteers && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <img src="/icons/resources/volunteer.png" alt="Volunteers" className="w-5 h-5" />
                          <span className="font-semibold">Volunteers</span>
                        </div>
                        {selectedProject.needs_volunteers_details && (
                          <p className="text-sm text-gray-600 ml-7">{selectedProject.needs_volunteers_details}</p>
                        )}
                      </div>
                    )}
                    {selectedProject.needs_instruments && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <img src="/icons/resources/instruments.png" alt="Instruments & Tools" className="w-5 h-5" />
                          <span className="font-semibold">Instruments & Tools / Machinery</span>
                        </div>
                        {selectedProject.needs_instruments_details && (
                          <p className="text-sm text-gray-600 ml-7">{selectedProject.needs_instruments_details}</p>
                        )}
                      </div>
                    )}
                    {selectedProject.needs_financial && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <img src="/icons/resources/financial.png" alt="Financial Support" className="w-5 h-5" />
                          <span className="font-semibold">Financial Support</span>
                          {selectedProject.financial_target && (
                            <span className="font-semibold text-wasp-yellow">€{selectedProject.financial_target.toLocaleString()}</span>
                          )}
                        </div>
                        {selectedProject.needs_financial_details && (
                          <p className="text-sm text-gray-600 ml-7">{selectedProject.needs_financial_details}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
