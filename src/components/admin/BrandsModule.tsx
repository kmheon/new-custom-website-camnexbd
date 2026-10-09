import React, { useState, useEffect } from 'react';
import { Brand } from '../../types';
import { brandService } from '../../services';
import { Building2, Check, Edit2, ExternalLink, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { MediaPickerModal } from './MediaLibraryModal';

export const BrandsModule: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const list = await brandService.getBrands();
      setBrands(list);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    try {
      const updated = await brandService.updateBrand(editingBrand.id, editingBrand);
      setBrands(prev => prev.map(b => b.id === updated.id ? updated : b));
      setEditingBrand(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error updating brand: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#F15A24]" />
            <span>Brand Partners & Badges</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage manufacturer brand logos, website links, and authorized partner badges.
          </p>
        </div>
        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" />
            <span>Brand changes saved successfully!</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading brands...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="h-10 px-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center max-w-[160px]">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="max-h-7 max-w-full object-contain" />
                    ) : (
                      <span className="text-xs font-black text-slate-300 uppercase tracking-wider">{b.name}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingBrand({ ...b })}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-[#F15A24] text-slate-300 hover:text-white transition-colors"
                    title="Edit Brand & Badge"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-white">{b.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400">/{b.slug}</div>
                  {b.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{b.description}</p>
                  )}
                </div>

                {/* Badge Status */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Storefront Badge
                  </div>
                  {b.showBadge && b.badgeText ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F15A24]/20 text-[#F15A24] border border-[#F15A24]/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{b.badgeText}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No badge displayed</span>
                  )}
                </div>
              </div>

              {b.website && (
                <div className="mt-4 pt-2 flex items-center justify-end">
                  <a
                    href={b.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#F15A24]" />
              <span>Edit Brand: {editingBrand.name}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={editingBrand.name}
                  onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Slug *</label>
                <input
                  type="text"
                  value={editingBrand.slug}
                  onChange={e => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#F15A24]"
                  required
                />
              </div>

              {/* Logo Field with Media Library / URL support */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Logo URL or Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingBrand.logo || ''}
                    onChange={e => setEditingBrand({ ...editingBrand, logo: e.target.value })}
                    placeholder="/images/brands/hikvision.svg"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
                {editingBrand.logo && (
                  <div className="mt-2 p-2 bg-white/5 border border-white/10 rounded-xl inline-block">
                    <img src={editingBrand.logo} alt="Preview" className="h-6 object-contain" />
                  </div>
                )}
              </div>

              {/* Storefront Badge Settings */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white">Enable Partner Badge</label>
                  <input
                    type="checkbox"
                    checked={!!editingBrand.showBadge}
                    onChange={e => setEditingBrand({ ...editingBrand, showBadge: e.target.checked })}
                    className="w-4 h-4 accent-[#F15A24] cursor-pointer"
                  />
                </div>
                {editingBrand.showBadge && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={editingBrand.badgeText || ''}
                      onChange={e => setEditingBrand({ ...editingBrand, badgeText: e.target.value })}
                      placeholder="e.g. Authorized Support Partner"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Official Website</label>
                <input
                  type="url"
                  value={editingBrand.website || ''}
                  onChange={e => setEditingBrand({ ...editingBrand, website: e.target.value })}
                  placeholder="https://www.example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  value={editingBrand.description || ''}
                  onChange={e => setEditingBrand({ ...editingBrand, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Library Modal for Logo Selection */}
      {showMediaModal && (
        <MediaPickerModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          onSelect={(url) => {
            if (editingBrand) {
              setEditingBrand({ ...editingBrand, logo: url });
            }
            setShowMediaModal(false);
          }}
        />
      )}
    </div>
  );
};
