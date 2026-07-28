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
  needs_online_personnel?: boolean;
  needs_online_personnel_details?: string;
  needs_field_personnel?: boolean;
  needs_field_personnel_details?: string;
  needs_volunteers?: boolean;
  needs_volunteers_details?: string;
  needs_instruments?: boolean;
  needs_instruments_details?: string;
  needs_financial?: boolean;
  needs_financial_details?: string;
  financial_target?: string | number;
}

const translations = {
  it: {
    title: "I Tuoi Progetti",
    backToDashboard: "← Torna alla Dashboard",
    explanatory: "Condividi i progetti che la tua organizzazione intende realizzare e che richiedono risorse aggiuntive per avanzare. Questa piattaforma ti connette con professionisti qualificati, volontari, attrezzature e finanziamenti sia dalla comunità WASP che dal pubblico più ampio. Usala come uno strumento di matching delle risorse per identificare e mobilitare efficientemente il supporto di cui hai bisogno per trasformare la tua visione in azione.",
    noProjects: "Nessun progetto ancora",
    createProject: "+ Crea Progetto",
    cancel: "Annulla",
    editProject: "Modifica Progetto",
    image: "📸 Immagine (opzionale)",
    resources: "Quali risorse stai cercando? (seleziona almeno una)",
    targetAmount: "Importo Obiettivo (€)",
    createBtn: "Crea Progetto",
    editBtn: "Modifica Progetto",
    creating: "Creazione...",
    editing: "Modifica...",
    view: "Visualizza",
    edit: "Modifica",
    delete: "Elimina",
  },
  en: {
    title: "Your Projects",
    backToDashboard: "← Back to Dashboard",
    explanatory: "Share the projects your organization plans to undertake that require additional resources to move forward. This platform connects you with skilled professionals, volunteers, equipment, and funding from both the WASP community and the broader public. Use it as a resource-matching tool to efficiently identify and mobilize the support you need to turn your vision into action.",
    noProjects: "No projects yet",
    createProject: "+ Create Project",
    cancel: "Cancel",
    editProject: "Edit Project",
    image: "📸 Image (optional)",
    resources: "What resources are you looking for? (select at least one)",
    targetAmount: "Target Amount (€)",
    createBtn: "Create Project",
    editBtn: "Edit Project",
    creating: "Creating...",
    editing: "Editing...",
    view: "View",
    edit: "Edit",
    delete: "Delete",
  },
};

export default function AssociationProjectsPage() {
  const params = useParams();
  const locale = (params.locale as string) || "it";
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    headline: "",
    description: "",
    needs_online_personnel: false,
    needs_online_personnel_details: "",
    needs_field_personnel: false,
    needs_field_personnel_details: "",
    needs_volunteers: false,
    needs_volunteers_details: "",
    needs_instruments: false,
    needs_instruments_details: "",
    needs_financial: false,
    needs_financial_details: "",
    financial_target: "",
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

      const url = editingProject ? `/api/association/projects/${editingProject.id}` : "/api/association/projects";
      const method = editingProject ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          description,
          image_url: imageUrl || undefined,
          needs_online_personnel: formData.needs_online_personnel,
          needs_online_personnel_details: formData.needs_online_personnel ? formData.needs_online_personnel_details : null,
          needs_field_personnel: formData.needs_field_personnel,
          needs_field_personnel_details: formData.needs_field_personnel ? formData.needs_field_personnel_details : null,
          needs_volunteers: formData.needs_volunteers,
          needs_volunteers_details: formData.needs_volunteers ? formData.needs_volunteers_details : null,
          needs_instruments: formData.needs_instruments,
          needs_instruments_details: formData.needs_instruments ? formData.needs_instruments_details : null,
          needs_financial: formData.needs_financial,
          needs_financial_details: formData.needs_financial ? formData.needs_financial_details : null,
          financial_target: formData.needs_financial ? parseInt(formData.financial_target) : null,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingProject ? "update" : "create"} project`);

      setFormData({
        headline: "",
        description: "",
        needs_online_personnel: false,
        needs_online_personnel_details: "",
        needs_field_personnel: false,
        needs_field_personnel_details: "",
        needs_volunteers: false,
        needs_volunteers_details: "",
        needs_instruments: false,
        needs_instruments_details: "",
        needs_financial: false,
        needs_financial_details: "",
        financial_target: "",
      });
      setImageFile(null);
      setShowForm(false);
      setEditingProject(null);
      await fetchProjects();
      alert(`Project ${editingProject ? "updated" : "created"} successfully!`);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditProject(project: ProjectItem) {
    setEditingProject(project);
    setFormData({
      headline: project.headline,
      description: project.description,
      needs_online_personnel: project.needs_online_personnel || false,
      needs_online_personnel_details: project.needs_online_personnel_details || "",
      needs_field_personnel: project.needs_field_personnel || false,
      needs_field_personnel_details: project.needs_field_personnel_details || "",
      needs_volunteers: project.needs_volunteers || false,
      needs_volunteers_details: project.needs_volunteers_details || "",
      needs_instruments: project.needs_instruments || false,
      needs_instruments_details: project.needs_instruments_details || "",
      needs_financial: project.needs_financial || false,
      needs_financial_details: project.needs_financial_details || "",
      financial_target: project.financial_target?.toString() || "",
    });
    setShowForm(true);
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
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <Link href={`/${locale}/private-area/dashboard`} className="text-blue-600 hover:underline">
            {t.backToDashboard}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Explanatory Section */}
        <div className="mb-8 p-5 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <p className="text-sm text-gray-800 leading-relaxed">
            <strong>{locale === "it" ? "Lancia le tue iniziative qui. " : "Launch your initiatives here. "}</strong>
            {t.explanatory}
          </p>
        </div>

        {/* Project Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">{locale === "it" ? "Caricamento..." : "Loading..."}</div>
        ) : projectsList.length === 0 ? (
          <div className="text-center py-8 text-gray-600">{t.noProjects}</div>
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
                  <div className="w-32 bg-gray-50 p-2 flex flex-col gap-2 items-center justify-center border-l border-gray-300">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-full"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Project Button */}
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingProject(null);
              setFormData({
                headline: "",
                description: "",
                needs_online_personnel: false,
                needs_online_personnel_details: "",
                needs_field_personnel: false,
                needs_field_personnel_details: "",
                needs_volunteers: false,
                needs_volunteers_details: "",
                needs_instruments: false,
                needs_instruments_details: "",
                needs_financial: false,
                needs_financial_details: "",
                financial_target: "",
              });
            }
          }}
          className="w-full px-6 py-3 rounded-full font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition-colors shadow-md"
        >
          {showForm ? t.cancel : editingProject ? t.editProject : t.createProject}
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
                placeholder={locale === "it"
                  ? "Descrizione del progetto... 💡 RICORDA: includi come possono contattarti (email, telefono, sito web)"
                  : "Project description... 💡 REMEMBER: include how people can contact you (email, phone, website)"
                }
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

              {/* Resources Section */}
              <div className="border-t pt-4">
                <p className="text-sm font-bold text-gray-900 mb-3">What resources are you looking for? (select at least one)</p>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.needs_online_personnel}
                        onChange={(e) => setFormData({ ...formData, needs_online_personnel: e.target.checked })}
                        className="mt-1"
                        disabled={submitting}
                      />
                      <img src="/icons/resources/online-personnel.png" alt="Online Personnel" className="w-6 h-6 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Online Personnel</p>
                        <p className="text-xs text-gray-600">Lawyers, software developers, consultants - skills you need remotely</p>
                      </div>
                    </label>
                    {formData.needs_online_personnel && (
                      <input
                        type="text"
                        placeholder="Details (e.g., 2 lawyers specializing in land law)"
                        value={formData.needs_online_personnel_details}
                        onChange={(e) => setFormData({ ...formData, needs_online_personnel_details: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        disabled={submitting}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.needs_field_personnel}
                        onChange={(e) => setFormData({ ...formData, needs_field_personnel: e.target.checked })}
                        className="mt-1"
                        disabled={submitting}
                      />
                      <img src="/icons/resources/field-personnel.png" alt="Field Personnel" className="w-6 h-6 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Field Personnel</p>
                        <p className="text-xs text-gray-600">Architects, engineers, builders - professionals who need to be on-site</p>
                      </div>
                    </label>
                    {formData.needs_field_personnel && (
                      <input
                        type="text"
                        placeholder="Details (e.g., 3 experienced masons, 1 project manager)"
                        value={formData.needs_field_personnel_details}
                        onChange={(e) => setFormData({ ...formData, needs_field_personnel_details: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        disabled={submitting}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.needs_volunteers}
                        onChange={(e) => setFormData({ ...formData, needs_volunteers: e.target.checked })}
                        className="mt-1"
                        disabled={submitting}
                      />
                      <img src="/icons/resources/volunteer.png" alt="Volunteers" className="w-6 h-6 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Volunteers</p>
                        <p className="text-xs text-gray-600">General volunteers to help with your project</p>
                      </div>
                    </label>
                    {formData.needs_volunteers && (
                      <input
                        type="text"
                        placeholder="Details (e.g., 20-30 volunteers for community cleanup)"
                        value={formData.needs_volunteers_details}
                        onChange={(e) => setFormData({ ...formData, needs_volunteers_details: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        disabled={submitting}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.needs_instruments}
                        onChange={(e) => setFormData({ ...formData, needs_instruments: e.target.checked })}
                        className="mt-1"
                        disabled={submitting}
                      />
                      <img src="/icons/resources/instruments.png" alt="Instruments & Tools" className="w-6 h-6 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Instruments & Tools</p>
                        <p className="text-xs text-gray-600">Machinery, equipment, or tools needed to accomplish the project</p>
                      </div>
                    </label>
                    {formData.needs_instruments && (
                      <input
                        type="text"
                        placeholder="Details (e.g., 2x bulldozers, 1x excavator, concrete mixer)"
                        value={formData.needs_instruments_details}
                        onChange={(e) => setFormData({ ...formData, needs_instruments_details: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        disabled={submitting}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.needs_financial}
                        onChange={(e) => setFormData({ ...formData, needs_financial: e.target.checked })}
                        className="mt-1"
                        disabled={submitting}
                      />
                      <img src="/icons/resources/financial.png" alt="Financial Support" className="w-6 h-6 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Financial Support</p>
                        <p className="text-xs text-gray-600">Funds needed to complete the project</p>
                      </div>
                    </label>
                    {formData.needs_financial && (
                      <input
                        type="text"
                        placeholder="Details (e.g., materials, labor costs, permits)"
                        value={formData.needs_financial_details}
                        onChange={(e) => setFormData({ ...formData, needs_financial_details: e.target.value })}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                        disabled={submitting}
                      />
                    )}
                  </div>
                </div>

                {/* Financial Target Input */}
                {formData.needs_financial && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1">Target Amount (€)</label>
                    <input
                      type="number"
                      placeholder="e.g., 5000"
                      value={formData.financial_target}
                      onChange={(e) => setFormData({ ...formData, financial_target: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                      disabled={submitting}
                    />
                  </div>
                )}
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
