import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, Search } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

export interface GlossaryItem {
  id: string;
  term: string;
  slug: string;
  short_meaning: string;
  long_meaning?: string;
  category?: string;
  display_order: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export const GlossaryModule: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GlossaryItem | null>(null);
  const [formTerm, setFormTerm] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formShortMeaning, setFormShortMeaning] = useState('');
  const [formLongMeaning, setFormLongMeaning] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const loadTerms = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<GlossaryItem[]>('/admin/glossary');
      setTerms(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load glossary terms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTerm('');
    setFormSlug('');
    setFormShortMeaning('');
    setFormLongMeaning('');
    setFormCategory('cctv');
    setFormOrder(terms.length + 1);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: GlossaryItem) => {
    setEditingItem(item);
    setFormTerm(item.term);
    setFormSlug(item.slug || '');
    setFormShortMeaning(item.short_meaning);
    setFormLongMeaning(item.long_meaning || '');
    setFormCategory(item.category || '');
    setFormOrder(item.display_order ?? 0);
    setFormActive(Boolean(item.is_active));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTerm.trim() || !formShortMeaning.trim()) {
      setError('Term and short meaning are required.');
      return;
    }

    setError(null);
    setSuccess(null);

    const payload = {
      term: formTerm.trim(),
      slug: formSlug.trim() || formTerm.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      short_meaning: formShortMeaning.trim(),
      long_meaning: formLongMeaning.trim() || undefined,
      category: formCategory.trim() || 'general',
      display_order: Number(formOrder) || 0,
      is_active: formActive ? 1 : 0
    };

    try {
      if (editingItem) {
        await apiFetch(`/admin/glossary/${encodeURIComponent(editingItem.id)}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccess(`Term "${formTerm}" updated successfully.`);
      } else {
        await apiFetch('/admin/glossary', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess(`Term "${formTerm}" created successfully.`);
      }
      setIsModalOpen(false);
      loadTerms();
    } catch (err: any) {
      setError(err.message || 'Failed to save glossary term');
    }
  };

  const handleDelete = async (item: GlossaryItem) => {
    if (!confirm(`Delete glossary term "${item.term}"?`)) return;
    try {
      await apiFetch(`/admin/glossary/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      setTerms(terms.filter(t => t.id !== item.id));
      setSuccess(`Term "${item.term}" deleted.`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete glossary term');
    }
  };

  const filteredTerms = terms.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.term.toLowerCase().includes(q) || t.short_meaning.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>Technical Glossary & Plain-Language Explanations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explain technical camera and networking terms in plain everyday words. Tooltips automatically show across the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition shadow cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Glossary Term</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search glossary terms or explanations..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Term</th>
                <th className="py-3 px-4">Short Meaning (Tooltip)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Order</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading glossary terms...
                  </td>
                </tr>
              ) : filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No glossary terms found.
                  </td>
                </tr>
              ) : (
                filteredTerms.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {item.term}
                    </td>
                    <td className="py-3 px-4 max-w-md text-slate-300">
                      <div>{item.short_meaning}</div>
                      {item.long_meaning && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.long_meaning}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {item.category || 'general'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                      {item.display_order}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Edit term"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Delete term"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base font-heading">
                {editingItem ? `Edit Term: ${editingItem.term}` : 'Add New Glossary Term'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Technical Term *
                </label>
                <input
                  type="text"
                  required
                  value={formTerm}
                  onChange={(e) => setFormTerm(e.target.value)}
                  placeholder="e.g. PoE, DVR, Full-Color"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Plain-Language Meaning (Tooltip) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formShortMeaning}
                  onChange={(e) => setFormShortMeaning(e.target.value)}
                  placeholder="e.g. power sent through the network cable"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
                />
                <span className="text-[10px] text-slate-500">Keep it short, clear, and neutral without warranty claims.</span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Optional Detailed Meaning
                </label>
                <textarea
                  rows={2}
                  value={formLongMeaning}
                  onChange={(e) => setFormLongMeaning(e.target.value)}
                  placeholder="Additional explanation for more details..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="cctv / network / power"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="termActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-slate-800 text-[#F15A24] focus:ring-[#F15A24]"
                />
                <label htmlFor="termActive" className="text-slate-300 font-bold cursor-pointer">
                  Active (show tooltips on public storefront)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold cursor-pointer shadow"
                >
                  Save Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

