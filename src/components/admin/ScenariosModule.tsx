import React, { useState, useEffect } from 'react';
import { ScenarioItem, Category, SecurityPackage, Product } from '../../types';
import { useSettingsStore } from '../../store';
import { categoryService, packageService, productService, cmsService } from '../../services';
import { DEFAULT_SCENARIOS } from '../../services/seedData';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Check,
  Home,
  Building2,
  ShoppingBag,
  Factory,
  GraduationCap,
  Layers,
  ArrowRight
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Home', label: 'Home / Residential', icon: <Home className="w-4 h-4" /> },
  { name: 'Building2', label: 'Office / Corporate', icon: <Building2 className="w-4 h-4" /> },
  { name: 'ShoppingBag', label: 'Shop / Retail', icon: <ShoppingBag className="w-4 h-4" /> },
  { name: 'Factory', label: 'Factory / Warehouse', icon: <Factory className="w-4 h-4" /> },
  { name: 'GraduationCap', label: 'School / Institute', icon: <GraduationCap className="w-4 h-4" /> }
];

export const ScenariosModule: React.FC = () => {
  const { settings, loadSettings } = useSettingsStore();
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingItem, setEditingItem] = useState<ScenarioItem | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
    categoryService.getCategories().then(setCategories);
    packageService.getPackages().then(setPackages);
    productService.getProducts({ limit: 50 }).then(res => setProducts(res.items));
  }, [loadSettings]);

  useEffect(() => {
    if (settings?.scenarios && settings.scenarios.length > 0) {
      setScenarios(settings.scenarios);
    } else {
      setScenarios(DEFAULT_SCENARIOS);
    }
  }, [settings]);

  const handleSaveScenarios = async (newList: ScenarioItem[]) => {
    try {
      await cmsService.updateSiteSettings({ scenarios: newList });
      setScenarios(newList);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error saving scenarios: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let updated: ScenarioItem[];
    const exists = scenarios.some(s => s.id === editingItem.id);
    if (exists) {
      updated = scenarios.map(s => s.id === editingItem.id ? editingItem : s);
    } else {
      updated = [...scenarios, editingItem];
    }

    handleSaveScenarios(updated);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this scenario configuration?')) {
      const updated = scenarios.filter(s => s.id !== id);
      handleSaveScenarios(updated);
    }
  };

  const handleToggle = (id: string) => {
    const updated = scenarios.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    handleSaveScenarios(updated);
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Home': return <Home className="w-5 h-5 text-[#F15A24]" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-[#F15A24]" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-[#F15A24]" />;
      case 'Factory': return <Factory className="w-5 h-5 text-[#F15A24]" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-[#F15A24]" />;
      default: return <Compass className="w-5 h-5 text-[#F15A24]" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#F15A24]" />
            <span>Shop by Scenario Editor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure full-width scenario tiles (Home, Office, Retail, Factory, School) with recommended packages and hardware.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </span>
          )}
          <button
            onClick={() => setEditingItem({
              id: `scen-${Date.now()}`,
              slug: `scenario-${Date.now().toString().slice(-4)}`,
              title: '',
              description: '',
              iconName: 'Building2',
              recommendedCategories: [],
              recommendedPackages: [],
              recommendedProducts: [],
              enabled: true,
              order: scenarios.length + 1
            })}
            className="px-3.5 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Scenario</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
              scen.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  {renderIcon(scen.iconName)}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(scen.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      scen.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {scen.enabled ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => setEditingItem({ ...scen })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#F15A24] text-slate-300 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(scen.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-sm text-white mb-1">{scen.title || 'Untitled Scenario'}</h3>
              <div className="text-[11px] font-mono text-slate-400 mb-2">/solutions/{scen.slug}</div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{scen.description}</p>

              <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px]">
                {scen.recommendedCategories && scen.recommendedCategories.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block">Categories:</span>
                    <span className="text-slate-300">{scen.recommendedCategories.join(', ')}</span>
                  </div>
                )}
                {scen.recommendedPackages && scen.recommendedPackages.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block">Packages:</span>
                    <span className="text-slate-300">{scen.recommendedPackages.join(', ')}</span>
                  </div>
                )}
                {scen.recommendedProducts && scen.recommendedProducts.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-semibold block">Products:</span>
                    <span className="text-slate-300">{scen.recommendedProducts.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Scenario Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#F15A24]" />
              <span>Configure Scenario: {editingItem.title || 'New Scenario'}</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Scenario Title *</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. Home & Residential"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Slug (URL identifier) *</label>
                <input
                  type="text"
                  value={editingItem.slug}
                  onChange={e => setEditingItem({ ...editingItem, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                  placeholder="home-residence"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#F15A24]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Icon *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, iconName: opt.name })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        editingItem.iconName === opt.name
                          ? 'border-[#F15A24] bg-[#F15A24]/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">One-Line Description *</label>
                <textarea
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                  placeholder="Discreet indoor and outdoor surveillance with smartphone live view..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#F15A24]"
                  required
                />
              </div>

              {/* Recommended Categories Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Linked Recommended Categories</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {categories.map(cat => {
                    const selected = editingItem.recommendedCategories?.includes(cat.slug);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const curr = editingItem.recommendedCategories || [];
                          const next = selected ? curr.filter(s => s !== cat.slug) : [...curr, cat.slug];
                          setEditingItem({ ...editingItem, recommendedCategories: next });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selected ? 'bg-[#F15A24] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Packages Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Linked Turnkey Packages</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {packages.map(pkg => {
                    const selected = editingItem.recommendedPackages?.includes(pkg.slug);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          const curr = editingItem.recommendedPackages || [];
                          const next = selected ? curr.filter(s => s !== pkg.slug) : [...curr, pkg.slug];
                          setEditingItem({ ...editingItem, recommendedPackages: next });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selected ? 'bg-[#F15A24] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pkg.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold text-slate-300">Enabled on Storefront</label>
                <input
                  type="checkbox"
                  checked={editingItem.enabled}
                  onChange={e => setEditingItem({ ...editingItem, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#F15A24] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Save Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
