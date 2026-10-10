import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Wrench, ArrowUp, ArrowDown } from 'lucide-react';
import { quoteService } from '../../services';
import { ServiceOffering } from '../../types';

export const ServicesModule: React.FC = () => {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ServiceOffering> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await quoteService.getAllServiceOfferings();
      setServices(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem({
      id: '',
      title: '',
      shortLabel: '',
      description: '',
      icon: 'Wrench',
      enabled: true,
      order: services.length + 1,
      solutionLink: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ServiceOffering) => {
    setEditingItem({ ...s });
    setModalOpen(true);
  };

  const handleToggleEnabled = async (s: ServiceOffering) => {
    try {
      const updated = { ...s, enabled: !s.enabled };
      await quoteService.saveServiceOffering(updated);
      setSuccess(`Service "${s.title}" ${updated.enabled ? 'enabled' : 'disabled'}.`);
      loadServices();
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle service status');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title?.trim()) {
      setError('Service title is required.');
      return;
    }

    const shortLabel = (editingItem.shortLabel?.trim() || editingItem.title.trim()).slice(0, 30);
    const itemToSave: ServiceOffering = {
      id: editingItem.id || `srv-${Date.now()}`,
      title: editingItem.title.trim(),
      shortLabel,
      description: editingItem.description?.trim() || '',
      icon: editingItem.icon?.trim() || 'Wrench',
      enabled: editingItem.enabled ?? true,
      order: editingItem.order ?? (services.length + 1),
      solutionLink: editingItem.solutionLink?.trim() || ''
    };

    try {
      await quoteService.saveServiceOffering(itemToSave);
      setSuccess(`Service "${itemToSave.title}" saved successfully.`);
      setModalOpen(false);
      setEditingItem(null);
      loadServices();
    } catch (err: any) {
      setError(err?.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete service "${title}"?`)) return;
    try {
      await quoteService.deleteServiceOffering(id);
      setSuccess(`Service "${title}" deleted.`);
      loadServices();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#F15A24]" />
            <span>Technician & Engineering Services</span>
          </h2>
          <p className="text-xs text-slate-400">
            Fully admin-driven services list powering the homepage Quick Service chips and Request Callback dropdown.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase">
            <tr>
              <th className="p-3.5 w-16">Order</th>
              <th className="p-3.5">Service Title</th>
              <th className="p-3.5">Chip Label</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5 w-24">Status</th>
              <th className="p-3.5 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {services.map((s, idx) => (
              <tr key={s.id} className="hover:bg-slate-900/50 transition">
                <td className="p-3.5 font-mono text-slate-400 font-bold">
                  #{s.order}
                </td>
                <td className="p-3.5 font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span>{s.title}</span>
                    {idx < 6 && s.enabled && (
                      <span className="text-[10px] font-semibold bg-orange-500/20 text-[#F15A24] px-1.5 py-0.5 rounded">
                        Chip #{idx + 1}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3.5 font-medium text-slate-300">
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-[11px]">
                    {s.shortLabel}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400 max-w-xs truncate">
                  {s.description || '—'}
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => handleToggleEnabled(s)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                      s.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {s.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="p-3.5 text-right space-x-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Service"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.title)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                  {isLoading ? 'Loading services...' : 'No services configured. Click "Add New Service" above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Modal */}
      {modalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-lg w-full text-white shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-heading text-white">
              {editingItem.id ? 'Edit Service Offering' : 'Add New Service Offering'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={editingItem.title || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. CCTV Camera Installation"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Short Label (for Chip) *</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={editingItem.shortLabel || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, shortLabel: e.target.value })}
                    placeholder="e.g. CCTV Setup"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingItem.order ?? 1}
                    onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Brief description of work scope..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Icon Name</label>
                  <input
                    type="text"
                    value={editingItem.icon || 'Wrench'}
                    onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                    placeholder="e.g. Video, Cable, Wrench, Shield"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Solution Link (Optional)</label>
                  <input
                    type="text"
                    value={editingItem.solutionLink || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, solutionLink: e.target.value })}
                    placeholder="e.g. /solutions/home-residence"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="service-enabled-toggle"
                  checked={editingItem.enabled !== false}
                  onChange={(e) => setEditingItem({ ...editingItem, enabled: e.target.checked })}
                  className="rounded text-[#F15A24] focus:ring-[#F15A24] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="service-enabled-toggle" className="text-slate-300 font-bold cursor-pointer">
                  Service Enabled (visible on homepage and callback dropdown)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

