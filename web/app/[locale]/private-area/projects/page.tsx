"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ProjectItem {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  created_at: string;
  associations?: {
    code: string;
    name: string;
  };
}

export default function AssociationProjectsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    headline: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch("/api/association/my-projects");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setProjectsList(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();

    const headline = (e.currentTarget.querySelector('[placeholder="Headline"]') as HTMLInputElement)?.value || "";
    const description = (e.currentTarget.querySelector('[placeholder="Description"]') as HTMLTextAreaElement)?.value || "";

    if (!headline.trim() || !description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFile);

        const uploadRes = await fetch("/api/association/projects-upload-image", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) throw new Error("Image upload failed");

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      }

      const response = await fetch("/api/association/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          description,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      setFormData({ headline: "", description: "" });
      setImageFile(null);
      setShowForm(false);
      await fetchProjects();
      alert("Project created successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("Delete this project?")) return;

    try {
      const response = await fetch(`/api/association/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchProjects();
      alert("Project deleted");
    } catch (error) {
      alert("Failed to delete project");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-yellow-400 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
          <Link href={`/${locale}/private-area/dashboard`} className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Project Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : projectsList.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No projects yet</div>
        ) : (
          <div className="space-y-4 mb-8">
            {projectsList.map((project) => {
              const date = new Date(project.created_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "2-digit",
              });

              return (
                <div key={project.id} className="flex bg-white rounded-lg shadow hover:shadow-lg transition-shadow group">
                  {/* Left Panel - Date */}
                  <div className="w-20 bg-gray-100 p-4 flex items-center justify-center border-r border-gray-300">
                    <div className="text-sm font-bold text-gray-900">{date}</div>
                  </div>

                  {/* Middle Panel - Content (Clickable) */}
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 p-4 text-left hover:bg-gray-50"
                  >
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">
                      {project.headline}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {project.description}
                    </p>
                  </button>

                  {/* Right Panel - Actions */}
                  <div className="w-24 bg-gray-50 p-2 flex flex-col gap-2 items-center justify-center border-l border-gray-300">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Project Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-6 py-3 rounded-full font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition-colors shadow-md"
        >
          {showForm ? "Cancel" : "+ Create Project"}
        </button>

        {/* Post Form */}
        {showForm && (
          <div className="mt-6 max-w-2xl bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input
                type="text"
                placeholder="Headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                required
                disabled={submitting}
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                rows={4}
                required
                disabled={submitting}
              />
              <div>
                <label className="block text-xs text-gray-600 mb-2">📸 Image (optional)</label>
                <label className="block w-full px-4 py-2 border border-gray-300 rounded text-sm bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={submitting}
                  />
                  <span className="text-gray-700">
                    {imageFile ? `📎 ${imageFile.name}` : "Browse... No file selected."}
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded hover:bg-yellow-500 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

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
                  <div className="text-sm text-gray-600">
                    {new Date(selectedProject.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
