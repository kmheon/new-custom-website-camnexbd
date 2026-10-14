import React, { useState, useEffect } from 'react';
import { Brand } from '../../types';
import { brandService } from '../../services';
import {
  Building2, Check, Edit2, ExternalLink, Image as ImageIcon, ShieldCheck,
  Plus, Trash2, Globe, ArrowUp, ArrowDown
} from 'lucide-react';
import { MediaPickerModal } from './MediaLibraryModal';

export const BrandsModule: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (!editingBrand || !editingBrand.name?.trim()) return;

    setErrorMessage(null);
    try {
      const slug = editingBrand.slug?.trim() || editingBrand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload: Partial<Brand> = {
        ...editingBrand,
        slug,
        order: editingBrand.order ?? (brands.length + 1),
        showInBrandStrip: editingBrand.showInBrandStrip !== false
      };

      if (editingBrand.id) {
        const updated = await brandService.updateBrand(editingBrand.id, payload);
        setBrands(prev => prev.map(b => b.id === updated.id ? updated : b));
      } else {
        const created = await brandService.createBrand(payload as any);
        setBrands(prev => [...prev, created]);
      }
      setEditingBrand(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving brand');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"? This action will check for catalog product references.`)) {
      return;
    }
    try {
      await brandService.deleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Cannot delete brand: ${err.message || 'It may be referenced by catalog products. Archive or reassign products first.'}`);
    }
  };

  const handleToggleStrip = async (brand: Brand) => {
    try {
      const updated = await brandService.updateBrand(brand.id, {
        showInBrandStrip: !brand.showInBrandStrip
      });
      setBrands(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (err: any) {
      alert('Error updating brand strip toggle: ' + err.message);
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
            Manage manufacturer brand logos, website links, homepage marquee strip display, and authorized partner badges.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              <span>Saved successfully!</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setEditingBrand({
              name: '',
              slug: '',
              order: brands.length + 1,
              showInBrandStrip: true,
              showBadge: false
            })}
            className="px-3.5 py-1.5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading brands...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs"
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBrand({ ...b })}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-[#F15A24] text-slate-300 hover:text-white transition-colors"
                      title="Edit Brand & Badge"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.name)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white transition-colors"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-white">{b.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400">/brand/{b.slug}</div>
                  {b.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{b.description}</p>
                  )}
                </div>

                {/* Brand Strip & Badge Status */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Strip Display:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStrip(b)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        b.showInBrandStrip !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                      }`}
                      title="Click to toggle display in homepage brand strip"
                    >
                      {b.showInBrandStrip !== false ? `Active (Order #${b.order ?? 1})` : 'Hidden (Click to show)'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Partner Badge:</span>
                    {b.showBadge && b.badgeText ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F15A24]/20 text-[#F15A24] border border-[#F15A24]/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{b.badgeText}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[10px]">None</span>
                    )}
                  </div>
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
                    <span>Official Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#F15A24]" />
              <span>{editingBrand.id ? `Edit Brand: ${editingBrand.name}` : 'Create New Brand'}</span>
            </h3>

            {errorMessage && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={editingBrand.name || ''}
                    onChange={e => setEditingBrand({
                      ...editingBrand,
                      name: e.target.value,
                      slug: editingBrand.id ? editingBrand.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    })}
                    placeholder="e.g. Ruijie Reyee"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={editingBrand.order ?? 1}
                    onChange={e => setEditingBrand({ ...editingBrand, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Slug *</label>
                <input
                  type="text"
                  value={editingBrand.slug || ''}
                  onChange={e => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                  placeholder="e.g. ruijie"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#F15A24]"
                  required
                />
              </div>

              {/* Logo Field with Media Library / URL support */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Logo URL or Path (SVG/PNG)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingBrand.logo || ''}
                    onChange={e => {
                      const newLogo = e.target.value;
                      setEditingBrand({
                        ...editingBrand,
                        logo: newLogo,
                        showInBrandStrip: newLogo ? true : (editingBrand.showInBrandStrip ?? true)
                      });
                    }}
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

              {/* Show in Brand Strip Checkbox */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Show in Brand Strip</label>
                    <span className="text-[11px] text-slate-400">Display this brand in the homepage scrolling marquee</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingBrand.showInBrandStrip !== false}
                    onChange={e => setEditingBrand({ ...editingBrand, showInBrandStrip: e.target.checked })}
                    className="w-4 h-4 accent-[#F15A24] cursor-pointer"
                  />
                </div>
              </div>

              {/* Storefront Badge Settings */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Enable Partner Badge</label>
                    <span className="text-[11px] text-slate-400">Authorized warranty partner badge on product cards</span>
                  </div>
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
                      placeholder="Authorized Partner"
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
                  placeholder="https://www.hikvision.com"
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

              {/* Brand SEO Fields */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#F15A24]" />
                  <span>Brand SEO Metadata</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingBrand.seo?.metaTitle || ''}
                    onChange={e => setEditingBrand({
                      ...editingBrand,
                      seo: { ...(editingBrand.seo || {}), metaTitle: e.target.value }
                    })}
                    placeholder="Meta Title Override"
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    value={editingBrand.seo?.metaDescription || ''}
                    onChange={e => setEditingBrand({
                      ...editingBrand,
                      seo: { ...(editingBrand.seo || {}), metaDescription: e.target.value }
                    })}
                    placeholder="Meta Description"
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {editingBrand.id ? 'Save Changes' : 'Create Brand'}
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
              setEditingBrand({ ...editingBrand, logo: url, showInBrandStrip: true });
            }
            setShowMediaModal(false);
          }}
        />
      )}
    </div>
  );
};
