import React, { useState, useEffect } from 'react';
import {
  X, Check, Plus, Trash2, Sliders, Shield, Tag, HelpCircle,
  Package as PackageIcon, RefreshCw, Calculator, Layers, AlertCircle,
  FileText, ArrowRight, DollarSign, Camera, Server, HardDrive, Cpu
} from 'lucide-react';
import { Button, Modal, Badge } from '../common/UI';
import { MediaPickerModal } from './MediaLibraryModal';
import { packageService } from '../../services';
import {
  SecurityPackage, PackageSeries, PackageSystemType,
  Product, PackageComponentRule
} from '../../types';

interface PackageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: Partial<SecurityPackage> | null;
  packageSystemTypes: PackageSystemType[];
  packageSeries: PackageSeries[];
  allProducts: Product[];
  onSaveSuccess: (saved: SecurityPackage) => void;
}

export const PackageEditModal: React.FC<PackageEditModalProps> = ({
  isOpen,
  onClose,
  pkg,
  packageSystemTypes,
  packageSeries,
  allProducts,
  onSaveSuccess
}) => {
  if (!isOpen || !pkg) return null;

  const [activeTab, setActiveTab] = useState<'basics' | 'components' | 'rules' | 'pricing'>('basics');
  const [formData, setFormData] = useState<Partial<SecurityPackage>>({
    id: pkg.id || `pkg-${Date.now()}`,
    name: pkg.name || '',
    slug: pkg.slug || '',
    badge: pkg.badge || '',
    featuredOnHomepage: Boolean(pkg.featuredOnHomepage),
    description: pkg.description || '',
    image: pkg.image || '',
    systemTypeId: pkg.systemTypeId || '',
    systemTypeSlug: pkg.systemTypeSlug || '',
    systemTypeName: pkg.systemTypeName || '',
    seriesId: pkg.seriesId || '',
    seriesName: pkg.seriesName || '',
    nightViewId: pkg.nightViewId || pkg.seriesId || '',
    nightViewName: pkg.nightViewName || pkg.seriesName || '',
    technologyLabel: pkg.technologyLabel || '',
    cameraResolution: pkg.cameraResolution || '2MP Full HD',
    cameraModel: pkg.cameraModel || '',
    dvrModel: pkg.dvrModel || '',
    storageDescription: pkg.storageDescription || '1TB Surveillance HDD',
    inclusions: pkg.inclusions ? [...pkg.inclusions] : [],
    cameraCountsSupported: pkg.cameraCountsSupported ? [...pkg.cameraCountsSupported] : [2, 4, 8, 16],
    cameraCount: pkg.cameraCount || 4,
    isQuoteOnly: Boolean(pkg.isQuoteOnly),
    components: pkg.components ? JSON.parse(JSON.stringify(pkg.components)) : [],
    rules: pkg.rules ? JSON.parse(JSON.stringify(pkg.rules)) : [],
    pricingRules: pkg.pricingRules ? { ...pkg.pricingRules } : {
      twoCamPrice: 11500,
      fourCamPrice: 16500,
      eightCamPrice: 28500,
      sixteenCamPrice: 52000
    },
    basePrice: pkg.basePrice ?? 16500,
    isActive: pkg.isActive ?? true
  });

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter package-eligible products
  const eligibleProducts = allProducts.filter(p => p.packageEligible !== false);

  // Calculate dynamic BOM price preview
  const calculatedBOMTotal = (formData.components || []).reduce((sum, item) => {
    const unitPrice = item.unitPrice ?? 0;
    return sum + (unitPrice * (item.qty || 1));
  }, 0);

  const hasUnpricedComponents = (formData.components || []).some(c => c.unitPrice == null || c.unitPrice === 0);

  const handleSlugGen = (nameVal: string) => {
    return nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddComponentRow = () => {
    const nextComponents = [
      ...(formData.components || []),
      { name: '', sku: '', qty: 1, unitPrice: null, lineTotal: null }
    ];
    setFormData({ ...formData, components: nextComponents });
  };

  const handleRemoveComponentRow = (index: number) => {
    const nextComponents = (formData.components || []).filter((_, idx) => idx !== index);
    setFormData({ ...formData, components: nextComponents });
  };

  const handleComponentChange = (index: number, field: string, val: any) => {
    const list = [...(formData.components || [])];
    const item = { ...list[index], [field]: val };

    if (field === 'sku') {
      const matched = eligibleProducts.find(p => p.sku === val || p.id === val);
      if (matched) {
        if (!item.name || item.name.trim() === '') {
          item.name = matched.name;
        }
        item.unitPrice = matched.pricing?.salePrice ?? matched.pricing?.regularPrice ?? null;
        item.lineTotal = (item.unitPrice || 0) * (item.qty || 1);
      }
    }

    if (field === 'qty' || field === 'unitPrice') {
      const q = field === 'qty' ? parseFloat(val) || 0 : item.qty || 1;
      const p = field === 'unitPrice' ? (val === '' ? null : parseFloat(val) || 0) : item.unitPrice;
      item.lineTotal = p != null ? p * q : null;
    }

    list[index] = item;
    setFormData({ ...formData, components: list });
  };

  const handleAddRuleRow = () => {
    const nextRules: PackageComponentRule[] = [
      ...(formData.rules || []),
      {
        role: 'camera',
        defaultModelId: '',
        name: 'Turnkey Cameras',
        quantityFormula: 'per_camera',
        qtyPerCamera: 1
      }
    ];
    setFormData({ ...formData, rules: nextRules });
  };

  const handleRemoveRuleRow = (index: number) => {
    const nextRules = (formData.rules || []).filter((_, idx) => idx !== index);
    setFormData({ ...formData, rules: nextRules });
  };

  const handleRuleChange = (index: number, field: keyof PackageComponentRule, val: any) => {
    const list = [...(formData.rules || [])];
    list[index] = { ...list[index], [field]: val };
    setFormData({ ...formData, rules: list });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('Package name is required');
      setActiveTab('basics');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload: SecurityPackage = {
        id: formData.id || `pkg-${Date.now()}`,
        name: formData.name.trim(),
        slug: formData.slug?.trim() || handleSlugGen(formData.name),
        description: formData.description || '',
        badge: formData.badge?.trim() || undefined,
        featuredOnHomepage: Boolean(formData.featuredOnHomepage),
        image: formData.image || '',
        systemTypeId: formData.systemTypeId || undefined,
        systemTypeSlug: formData.systemTypeSlug || undefined,
        systemTypeName: formData.systemTypeName || undefined,
        seriesId: formData.seriesId || undefined,
        seriesName: formData.seriesName || undefined,
        nightViewId: formData.seriesId || undefined,
        nightViewName: formData.seriesName || undefined,
        technologyLabel: formData.technologyLabel || undefined,
        cameraResolution: formData.cameraResolution || '2MP',
        cameraModel: formData.cameraModel || '',
        dvrModel: formData.dvrModel || '',
        storageDescription: formData.storageDescription || '1TB HDD',
        inclusions: formData.inclusions || [],
        cameraCountsSupported: formData.cameraCountsSupported && formData.cameraCountsSupported.length > 0
          ? formData.cameraCountsSupported
          : [4],
        cameraCount: formData.cameraCount || 4,
        isQuoteOnly: Boolean(formData.isQuoteOnly),
        components: formData.components || [],
        rules: formData.rules || [],
        pricingRules: formData.pricingRules || {},
        basePrice: formData.isQuoteOnly ? null : (formData.basePrice ?? calculatedBOMTotal ?? 0),
        isActive: formData.isActive ?? true
      };

      await packageService.savePackage(payload);
      onSaveSuccess(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save package');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formData.id && !formData.id.startsWith('pkg-') ? `Edit Package: ${formData.name}` : 'Create Turnkey CCTV Package'}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'basics' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <PackageIcon className="w-3.5 h-3.5" />
            <span>1. Basics & System</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'components' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Bill of Materials (BOM)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20">
              {formData.components?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Scaling Rules</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/20">
              {formData.rules?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'pricing' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>4. Pricing & Quotation</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* TAB 1: BASICS & SYSTEM TYPE */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      name: val,
                      slug: formData.id && !formData.id.startsWith('pkg-') ? formData.slug : handleSlugGen(val)
                    });
                  }}
                  placeholder="e.g. 2MP Turbo HD Full Turnkey Package"
                  className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: handleSlugGen(e.target.value) })}
                    placeholder="2mp-turbo-hd-full-turnkey-package"
                    className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-lg font-mono text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Badge Ribbon (Optional)</label>
                  <input
                    type="text"
                    list="package-tag-options"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Most Popular, Best Value"
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-900"
                  />
                  <datalist id="package-tag-options">
                    <option value="Most Popular" />
                    <option value="Best for Small Homes" />
                    <option value="Affordable" />
                    <option value="Top Tier" />
                    <option value="Best Value" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">System Type *</label>
                  <select
                    value={formData.systemTypeId || ''}
                    onChange={(e) => {
                      const stId = e.target.value;
                      const matched = packageSystemTypes.find(st => st.id === stId);
                      setFormData({
                        ...formData,
                        systemTypeId: stId,
                        systemTypeSlug: matched?.slug || formData.systemTypeSlug,
                        systemTypeName: matched?.name || formData.systemTypeName
                      });
                    }}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-bold text-slate-800"
                  >
                    <option value="">-- Choose System Type --</option>
                    {packageSystemTypes.map(st => (
                      <option key={st.id} value={st.id}>{st.name} ({st.slug})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Night View Series</label>
                  <select
                    value={formData.seriesId || ''}
                    onChange={(e) => {
                      const sid = e.target.value;
                      const matched = packageSeries.find(s => s.id === sid);
                      setFormData({
                        ...formData,
                        seriesId: sid,
                        seriesName: matched?.name || formData.seriesName,
                        nightViewId: sid,
                        nightViewName: matched?.name || formData.nightViewName
                      });
                    }}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-medium text-slate-800"
                  >
                    <option value="">-- Choose Night View Series --</option>
                    {packageSeries.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Technology Subtitle</label>
                  <input
                    type="text"
                    value={formData.technologyLabel || ''}
                    onChange={(e) => setFormData({ ...formData, technologyLabel: e.target.value })}
                    placeholder="e.g. Hikvision ColorVu, Smart Dual Light"
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Camera Resolution *</label>
                  <input
                    type="text"
                    value={formData.cameraResolution || ''}
                    onChange={(e) => setFormData({ ...formData, cameraResolution: e.target.value })}
                    placeholder="e.g. 2MP Full HD (1080p)"
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hero Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://... or /images/packages/..."
                    className="flex-1 bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono text-slate-800"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    Select Media
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Package Narrative Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete turnkey package tailored for homes, retail shops, or branch offices..."
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg text-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Turnkey Inclusions Summary (One per line)</label>
                <textarea
                  rows={4}
                  value={(formData.inclusions || []).join('\n')}
                  onChange={(e) => setFormData({
                    ...formData,
                    inclusions: e.target.value.split('\n').filter(Boolean)
                  })}
                  placeholder="Hikvision Bullet / Dome Cameras&#10;Turbo HD 4-Channel DVR&#10;1TB Surveillance HDD&#10;Cat6 Pure Copper Cable..."
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Homepage Priority Mix</span>
                  <span className="text-[11px] text-slate-500">Feature this package prominently in the homepage turnkey tabs</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(formData.featuredOnHomepage)}
                  onChange={(e) => setFormData({ ...formData, featuredOnHomepage: e.target.checked })}
                  className="rounded border-slate-300 text-[#F15A24] focus:ring-[#F15A24] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BILL OF MATERIALS (BOM) */}
          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Turnkey Hardware Components (BOM)</h3>
                  <p className="text-[11px] text-slate-500">
                    Map individual catalog SKUs to this package. Unit prices are synced from the products catalog.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={handleAddComponentRow}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Line Item</span>
                </Button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Component Name *</th>
                      <th className="p-2.5 w-44">Catalog SKU / Model</th>
                      <th className="p-2.5 w-20 text-center">Qty</th>
                      <th className="p-2.5 w-28 text-right">Unit Price (BDT)</th>
                      <th className="p-2.5 w-28 text-right">Line Total</th>
                      <th className="p-2.5 w-12 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(!formData.components || formData.components.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          No Bill of Materials items defined yet. Click "+ Add Line Item" to attach cameras, DVR, storage, or cabling.
                        </td>
                      </tr>
                    ) : (
                      formData.components.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleComponentChange(idx, 'name', e.target.value)}
                              placeholder="e.g. 2MP Fixed Bullet Camera"
                              className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-medium text-slate-800"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.sku || ''}
                              onChange={(e) => handleComponentChange(idx, 'sku', e.target.value)}
                              className="w-full bg-white border border-slate-200 p-1.5 rounded text-xs font-mono text-slate-700"
                            >
                              <option value="">Custom / Unlinked</option>
                              {eligibleProducts.map(p => {
                                const pr = p.pricing?.salePrice ?? p.pricing?.regularPrice;
                                return (
                                  <option key={p.id} value={p.sku || p.id}>
                                    {p.modelNumber || p.sku} — {p.name.slice(0, 24)}... ({pr ? `৳${pr}` : 'Quote'})
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleComponentChange(idx, 'qty', e.target.value)}
                              className="w-16 bg-white border border-slate-200 p-1.5 rounded text-xs text-center font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={item.unitPrice ?? ''}
                              onChange={(e) => handleComponentChange(idx, 'unitPrice', e.target.value)}
                              placeholder="Quote"
                              className="w-24 bg-white border border-slate-200 p-1.5 rounded text-xs text-right font-medium text-slate-800"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {item.lineTotal != null ? `৳${item.lineTotal.toLocaleString()}` : <span className="text-amber-600 text-[11px] font-sans">Requires Quote</span>}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveComponentRow(idx)}
                              className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {formData.components && formData.components.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right text-slate-600">Dynamic BOM Computed Total:</td>
                        <td className="p-2.5 text-right font-mono text-[#F15A24] text-sm">
                          {hasUnpricedComponents ? (
                            <span className="text-amber-600 font-sans text-xs">Quote Only Required</span>
                          ) : (
                            `৳${calculatedBOMTotal.toLocaleString()}`
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Quick sync button */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Components auto-update total price when users toggle bullet/dome options.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (calculatedBOMTotal > 0 && !hasUnpricedComponents) {
                      setFormData({ ...formData, basePrice: calculatedBOMTotal });
                    }
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  <span>Sync Base Price to BOM Total</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: SCALING RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Camera Count Scaling Rules</h3>
                  <p className="text-[11px] text-slate-500">
                    Formulas for scaling recorders, cabling, power supplies, and storage across 2, 4, 8, 16 camera selections.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={handleAddRuleRow}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Rule</span>
                </Button>
              </div>

              <div className="space-y-3">
                {(!formData.rules || formData.rules.length === 0) ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                    No custom scaling rules configured. Default system rules (cables per camera, HDD tiering) will apply.
                  </div>
                ) : (
                  formData.rules.map((rule, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#F15A24]" />
                          Rule #{idx + 1}: {rule.name || rule.role}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRuleRow(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Role</label>
                          <select
                            value={rule.role}
                            onChange={(e) => handleRuleChange(idx, 'role', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-xs font-medium"
                          >
                            <option value="camera">Camera Unit</option>
                            <option value="recorder">DVR / NVR</option>
                            <option value="storage">Storage HDD</option>
                            <option value="cable">Cabling (Meters)</option>
                            <option value="power">Power Supply</option>
                            <option value="connectors">Baluns / Connectors</option>
                            <option value="installation">Installation</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Formula</label>
                          <select
                            value={rule.quantityFormula}
                            onChange={(e) => handleRuleChange(idx, 'quantityFormula', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-xs font-medium"
                          >
                            <option value="fixed">Fixed Quantity</option>
                            <option value="per_camera">Per Camera (Multiply)</option>
                            <option value="lookup_camera_count">Lookup Table Tier</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Quantity / Multiplier</label>
                          <input
                            type="number"
                            value={rule.quantityFormula === 'per_camera' ? rule.qtyPerCamera || 1 : rule.fixedQty || 1}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 1;
                              if (rule.quantityFormula === 'per_camera') {
                                handleRuleChange(idx, 'qtyPerCamera', v);
                              } else {
                                handleRuleChange(idx, 'fixedQty', v);
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRICING & QUOTATION */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Quotation Mode Toggle</h3>
                    <p className="text-[11px] text-slate-500">
                      When enabled, disables checkout and shows "Request Quotation" for enterprise setups (32/64 cameras).
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isQuoteOnly)}
                      onChange={(e) => setFormData({ ...formData, isQuoteOnly: e.target.checked })}
                      className="rounded border-slate-300 text-[#F15A24] focus:ring-[#F15A24] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Quote Only</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Base Price (BDT)</label>
                  <input
                    type="number"
                    disabled={formData.isQuoteOnly}
                    value={formData.basePrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.isQuoteOnly ? 'Quotation Required' : '16500'}
                    className={`w-full border p-2.5 rounded-lg text-sm font-bold ${
                      formData.isQuoteOnly
                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-white border-slate-300 text-[#F15A24]'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Storefront default base package price. Dynamic BOM price is: ৳{calculatedBOMTotal.toLocaleString()}.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Default Camera Count</label>
                  <select
                    value={formData.cameraCount || 4}
                    onChange={(e) => {
                      const c = parseInt(e.target.value, 10) || 4;
                      setFormData({
                        ...formData,
                        cameraCount: c,
                        isQuoteOnly: c >= 32 ? true : formData.isQuoteOnly
                      });
                    }}
                    className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold text-slate-800"
                  >
                    {[2, 4, 8, 16, 32, 64].map(num => (
                      <option key={num} value={num}>{num} Cameras {num >= 32 ? '(Enterprise / Quote)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supported Camera Counts Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Supported Camera Count Options</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[2, 4, 8, 16, 32, 64].map(cnt => {
                    const isSelected = (formData.cameraCountsSupported || []).includes(cnt);
                    return (
                      <label
                        key={cnt}
                        className={`flex items-center justify-center p-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-orange-50 border-[#F15A24] text-[#F15A24]'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          onChange={(e) => {
                            const cur = formData.cameraCountsSupported || [];
                            const next = e.target.checked
                              ? [...cur, cnt].sort((a, b) => a - b)
                              : cur.filter(x => x !== cnt);
                            setFormData({
                              ...formData,
                              cameraCountsSupported: next,
                              isQuoteOnly: next.every(x => x >= 32) ? true : formData.isQuoteOnly
                            });
                          }}
                        />
                        <span>{cnt} Cameras</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Rules Table for 2, 4, 8, 16 Cam */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Pricing Matrix Overrides (BDT)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">2-Cam Setup</span>
                    <input
                      type="number"
                      value={formData.pricingRules?.twoCamPrice ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricingRules: { ...formData.pricingRules, twoCamPrice: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">4-Cam Setup</span>
                    <input
                      type="number"
                      value={formData.pricingRules?.fourCamPrice ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricingRules: { ...formData.pricingRules, fourCamPrice: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">8-Cam Setup</span>
                    <input
                      type="number"
                      value={formData.pricingRules?.eightCamPrice ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricingRules: { ...formData.pricingRules, eightCamPrice: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">16-Cam Setup</span>
                    <input
                      type="number"
                      value={formData.pricingRules?.sixteenCamPrice ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricingRules: { ...formData.pricingRules, sixteenCamPrice: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button type="submit" size="md" disabled={isSaving}>
                <Check className="w-4 h-4 mr-1.5" />
                <span>{isSaving ? 'Saving...' : 'Save CCTV Package'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>

      {mediaPickerOpen && (
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(url) => {
            setFormData({ ...formData, image: url });
            setMediaPickerOpen(false);
          }}
        />
      )}
    </Modal>
  );
};
