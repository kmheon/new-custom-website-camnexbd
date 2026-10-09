import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  client?: string;
  industry?: string;
  location?: string;
  completedAt?: string;
  summary?: string;
  scope?: string[];
  featuredImage?: string;
  isDemo?: boolean;
}

export const ProjectsModule: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<ProjectItem> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ProjectItem[]>('/cms/projects');
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenCreate = () => {
    setEditingProject({
      id: '',
      title: '',
      slug: '',
      client: '',
      industry: 'Corporate Office',
      location: 'Dhaka, Bangladesh',
      summary: '',
      featuredImage: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: ProjectItem) => {
    setEditingProject({ ...p });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.title || !editingProject?.slug) {
      setError('Title and slug are required.');
      return;
    }

    if (editingProject.title.length > 100) {
      setError('Project title cannot exceed 100 characters.');
      return;
    }

    if (editingProject.client && editingProject.client.length > 80) {
      setError('Client name cannot exceed 80 characters.');
      return;
    }

    try {
      if (editingProject.id) {
        await apiFetch(`/cms/projects/${encodeURIComponent(editingProject.id)}`, {
          method: 'PUT',
          body: JSON.stringify(editingProject)
        });
        setSuccess(`Project "${editingProject.title}" updated.`);
      } else {
        await apiFetch('/cms/projects', {
          method: 'POST',
          body: JSON.stringify(editingProject)
        });
        setSuccess(`Project "${editingProject.title}" created.`);
      }
      setModalOpen(false);
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete project "${title}"?`)) return;
    try {
      await apiFetch(`/cms/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== id));
      setSuccess('Project deleted.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>Verified Projects & Case Studies</span>
            <span className="text-xs bg-[#F15A24]/20 text-[#F15A24] border border-[#F15A24]/30 px-2 py-0.5 rounded-full font-mono">
              CMS Editor
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Publish enterprise deployments, camera counts, and technical case studies. Note: Only authentic, client-consented projects may be published.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#F15A24] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Projects List */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300">Published Project Portfolio ({projects.length})</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading case studies...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No projects found. Click "Add Project" above to create an authentic case study.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {projects.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.featuredImage ? (
                      <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <span>{p.title}</span>
                      {p.isDemo && (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded">
                          Sample / Demo
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5 font-mono">
                      /projects/{p.slug} · {p.client || 'Client'} ({p.location || 'Dhaka'})
                    </div>
                    {p.summary && <p className="text-slate-500 text-xs mt-1 line-clamp-1">{p.summary}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {modalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">
              {editingProject.id ? 'Edit Project Case Study' : 'Create New Project Case Study'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-400">Project Title *</span>
                  <span className="text-[10px] text-slate-500 font-mono">{(editingProject.title || '').length}/100</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editingProject.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingProject({
                      ...editingProject,
                      title,
                      slug: editingProject.id ? editingProject.slug : slug
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">URL Slug *</span>
                <input
                  type="text"
                  required
                  value={editingProject.slug || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl font-mono focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-400">Client Name</span>
                    <span className="text-[10px] text-slate-500 font-mono">{(editingProject.client || '').length}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    value={editingProject.client || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Industry</span>
                  <input
                    type="text"
                    value={editingProject.industry || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, industry: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Featured Image URL</span>
                <input
                  type="text"
                  value={editingProject.featuredImage || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, featuredImage: e.target.value })}
                  placeholder="/images/hero/hikvision-bullet.jpg or /uploads/..."
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl font-mono focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Executive Summary</span>
                <textarea
                  rows={3}
                  value={editingProject.summary || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, summary: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F15A24] hover:bg-orange-600 text-white font-bold rounded-xl shadow-md"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

