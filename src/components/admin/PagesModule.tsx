import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Eye, Globe } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

interface CmsPageItem {
  id: string;
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
}

export const PagesModule: React.FC = () => {
  const [pages, setPages] = useState<CmsPageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<CmsPageItem> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<CmsPageItem[]>('/cms/pages');
      setPages(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleOpenCreate = () => {
    setEditingPage({
      id: '',
      title: '',
      slug: '',
      content: '',
      metaTitle: '',
      metaDescription: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: CmsPageItem) => {
    setEditingPage({ ...p });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage?.title || !editingPage?.slug) {
      setError('Title and slug are required.');
      return;
    }

    try {
      if (editingPage.id) {
        await apiFetch(`/cms/pages/${encodeURIComponent(editingPage.id)}`, {
          method: 'PUT',
          body: JSON.stringify(editingPage)
        });
        setSuccess(`Page "${editingPage.title}" updated.`);
      } else {
        await apiFetch('/cms/pages', {
          method: 'POST',
          body: JSON.stringify(editingPage)
        });
        setSuccess(`Page "${editingPage.title}" created.`);
      }
      setModalOpen(false);
      loadPages();
    } catch (err: any) {
      setError(err.message || 'Failed to save page');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    try {
      await apiFetch(`/cms/pages/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setPages(pages.filter(p => p.id !== id));
      setSuccess('Page deleted.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete page');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>Custom Static Pages (CMS)</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
              SSR Injected
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Create and edit custom content pages (e.g. specialized solution overviews, branch directories, corporate agreements) with individual SEO meta tags.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#F15A24] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Page</span>
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

      {/* Pages List */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300">Configured Pages ({pages.length})</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No custom pages configured. Click "New Page" to create landing pages or policies.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {pages.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 text-xs">
                <div>
                  <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <span>{p.title}</span>
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5 font-mono">
                    /{p.slug}
                  </div>
                  {p.metaDescription && <p className="text-slate-500 text-xs mt-1 line-clamp-1">{p.metaDescription}</p>}
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
                    title="Delete page"
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
      {modalOpen && editingPage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">
              {editingPage.id ? 'Edit Content Page' : 'Create New Content Page'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Page Title *</span>
                <input
                  type="text"
                  required
                  value={editingPage.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingPage({
                      ...editingPage,
                      title,
                      slug: editingPage.id ? editingPage.slug : slug
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">URL Path Slug *</span>
                <input
                  type="text"
                  required
                  value={editingPage.slug || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                  placeholder="e.g. enterprise-cctv or dahua-migration"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl font-mono focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">SEO Title (meta)</span>
                  <input
                    type="text"
                    value={editingPage.metaTitle || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, metaTitle: e.target.value })}
                    placeholder="Page Title | CamneX Bangladesh"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">SEO Description (meta)</span>
                  <input
                    type="text"
                    value={editingPage.metaDescription || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                    placeholder="150-160 character description..."
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 block mb-1">Page Body Content (Markdown / HTML)</span>
                <textarea
                  rows={6}
                  value={editingPage.content || ''}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl font-mono focus:border-[#F15A24] focus:outline-none"
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
                  Save Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

