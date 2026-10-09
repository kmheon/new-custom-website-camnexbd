import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Quote } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';

interface TestimonialItem {
  id: string;
  client_name: string;
  company?: string;
  role?: string;
  rating?: number;
  content: string;
  verified?: boolean;
  display_order?: number;
}

export const TestimonialsModule: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<TestimonialItem> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<TestimonialItem[]>('/cms/testimonials');
      setTestimonials(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem({
      id: '',
      client_name: '',
      company: '',
      role: 'IT Manager',
      rating: 5,
      content: '',
      verified: true,
      display_order: testimonials.length + 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: TestimonialItem) => {
    setEditingItem({ ...t });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.client_name || !editingItem?.content) {
      setError('Client name and review content are required.');
      return;
    }

    if (editingItem.client_name.length > 80) {
      setError('Client name cannot exceed 80 characters.');
      return;
    }

    if (editingItem.content.length > 300) {
      setError('Testimonial quote cannot exceed 300 characters.');
      return;
    }

    try {
      if (editingItem.id) {
        await apiFetch(`/cms/testimonials/${encodeURIComponent(editingItem.id)}`, {
          method: 'PUT',
          body: JSON.stringify(editingItem)
        });
        setSuccess(`Review for "${editingItem.client_name}" updated.`);
      } else {
        await apiFetch('/cms/testimonials', {
          method: 'POST',
          body: JSON.stringify(editingItem)
        });
        setSuccess(`Review for "${editingItem.client_name}" created.`);
      }
      setModalOpen(false);
      loadTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to save testimonial');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete testimonial from "${name}"?`)) return;
    try {
      await apiFetch(`/cms/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setTestimonials(testimonials.filter(t => t.id !== id));
      setSuccess('Testimonial deleted.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete testimonial');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>Verified Customer Testimonials</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
              Authentic Reviews Only
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage client testimonials displayed across the storefront. Per CamneX compliance rules, only real client statements with verified installations may be published.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#F15A24] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
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

      {/* Testimonials List */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300">Published Testimonials ({testimonials.length})</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading testimonials...</div>
        ) : testimonials.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No testimonials found. Add authentic client feedback above.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {testimonials.map((t) => (
              <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-900/40 text-xs">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">{t.client_name}</span>
                    <span className="text-slate-400">· {t.company || 'Private Client'} {t.role ? `(${t.role})` : ''}</span>
                    {t.verified && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.2 rounded font-medium">
                        Verified Installation
                      </span>
                    )}
                  </div>
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}
                  </div>
                  <p className="text-slate-300 text-xs italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    "{t.content}"
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.client_name)}
                    className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                    title="Delete testimonial"
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
      {modalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">
              {editingItem.id ? 'Edit Testimonial' : 'Add Client Testimonial'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-400">Client / Representative Name *</span>
                  <span className="text-[10px] text-slate-500 font-mono">{(editingItem.client_name || '').length}/80</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editingItem.client_name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, client_name: e.target.value })}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Company / Organization</span>
                  <input
                    type="text"
                    maxLength={80}
                    value={editingItem.company || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })}
                    placeholder="e.g. Apex Holdings"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Role / Designation</span>
                  <input
                    type="text"
                    maxLength={80}
                    value={editingItem.role || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                    placeholder="e.g. Facility Manager"
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Star Rating (1 - 5)</span>
                  <select
                    value={editingItem.rating || 5}
                    onChange={(e) => setEditingItem({ ...editingItem, rating: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                  </select>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Display Order</span>
                  <input
                    type="number"
                    value={editingItem.display_order || 1}
                    onChange={(e) => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-400">Client Statement / Review Content *</span>
                  <span className="text-[10px] text-slate-500 font-mono">{(editingItem.content || '').length}/300</span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={300}
                  value={editingItem.content || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  placeholder="Enter authentic feedback regarding equipment or installation quality..."
                  className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl focus:border-[#F15A24] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verifiedReview"
                  checked={editingItem.verified !== false}
                  onChange={(e) => setEditingItem({ ...editingItem, verified: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                />
                <label htmlFor="verifiedReview" className="text-slate-300 font-semibold cursor-pointer">
                  Mark as Verified Installation Customer
                </label>
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
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

