import React, { useState } from 'react';
import {
  SlidersHorizontal, ArrowRight, Percent, FolderTree, Tag,
  Eye, EyeOff, Check, AlertTriangle, FileSpreadsheet,
  Download, Upload, RefreshCw, X, AlertCircle, Boxes, Warehouse, Barcode,
  CheckCircle2, Layers, TrendingUp, TrendingDown, DollarSign, Sparkles
} from 'lucide-react';
import { Button, Modal, Badge } from '../common/UI';
import { productService } from '../../services';
import { Product, Category, BulkPriceMode } from '../../types';

interface BulkToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  products: Product[];
  categories: Category[];
  onSuccess: () => void;
}

export const BulkToolsModal: React.FC<BulkToolsModalProps> = ({
  isOpen,
  onClose,
  selectedProductIds,
  products,
  categories,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'prices' | 'stock' | 'category' | 'visibility' | 'tags' | 'impexp'>('prices');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Target scope: apply to selected items or entire catalog
  const [scopeMode, setScopeMode] = useState<'selected' | 'all'>(selectedProductIds.length > 0 ? 'selected' : 'all');

  // Bulk Price adjustment state
  const [priceMode, setPriceMode] = useState<BulkPriceMode>('percent_increase');
  const [priceAmount, setPriceAmount] = useState<number>(5);
  const [targetField, setTargetField] = useState<'regularPrice' | 'salePrice' | 'wholesalePrice'>('regularPrice');
  const [roundToNearest, setRoundToNearest] = useState<number>(50);

  // Bulk Stock & Inventory state (Phase 2 ERP/POS)
  const [stockMode, setStockMode] = useState<'add_stock' | 'set_fixed' | 'reduce_stock'>('add_stock');
  const [stockAmount, setStockAmount] = useState<number>(10);
  const [shelfLocationInput, setShelfLocationInput] = useState<string>('');
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState<number>(5);

  // Bulk Category Move state
  const [targetCategory, setTargetCategory] = useState<string>('');

  // Bulk Visibility state
  const [visibilityOption, setVisibilityOption] = useState<'publish' | 'hide' | 'pos_only'>('publish');

  // Bulk Tags state
  const [tagFeatured, setTagFeatured] = useState<boolean | undefined>(undefined);
  const [tagPopular, setTagPopular] = useState<boolean | undefined>(undefined);
  const [tagNew, setTagNew] = useState<boolean | undefined>(undefined);
  const [tagHot, setTagHot] = useState<boolean | undefined>(undefined);

  // Import / Export state
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreview, setImportPreview] = useState<any>(null);

  if (!isOpen) return null;

  // Determine active target items
  const activeProducts = (scopeMode === 'selected' && selectedProductIds.length > 0)
    ? products.filter(p => selectedProductIds.includes(p.id))
    : products;

  const targetIds = activeProducts.map(p => p.id);

  // Compute live price preview on first 3 products
  const previewProducts = activeProducts.slice(0, 3).map(p => {
    const cur = p.pricing[targetField] ?? p.pricing.regularPrice ?? 0;
    let next = cur;
    if (priceMode === 'percent_increase') next = cur * (1 + priceAmount / 100);
    else if (priceMode === 'percent_decrease') next = cur * (1 - priceAmount / 100);
    else if (priceMode === 'fixed_increase') next = cur + priceAmount;
    else if (priceMode === 'fixed_decrease') next = Math.max(0, cur - priceAmount);
    else if (priceMode === 'set_fixed') next = priceAmount;

    if (roundToNearest > 0) {
      next = Math.round(next / roundToNearest) * roundToNearest;
    }
    const delta = next - cur;
    return { name: p.name, sku: p.sku, oldVal: cur, newVal: next, delta };
  });

  // Compute live stock preview on first 3 products
  const previewStockProducts = activeProducts.slice(0, 3).map(p => {
    const cur = p.inventory?.available ?? 0;
    let next = cur;
    if (stockMode === 'set_fixed') next = Math.max(0, stockAmount);
    else if (stockMode === 'add_stock') next = Math.max(0, cur + stockAmount);
    else if (stockMode === 'reduce_stock') next = Math.max(0, cur - stockAmount);
    return { name: p.name, sku: p.sku, oldVal: cur, newVal: next, shelf: p.inventory?.shelfLocation || '—' };
  });

  const handleApplyPrice = async () => {
    if (targetIds.length === 0) {
      setErrorMsg('No products found to adjust.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (productService.bulkAdjustPrices) {
        await productService.bulkAdjustPrices({
          productIds: targetIds,
          mode: priceMode,
          amount: priceAmount,
          targetField,
          roundToNearest
        });
        setSuccessMsg(`Successfully adjusted prices for ${targetIds.length} products.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Bulk price update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStock = async () => {
    if (targetIds.length === 0) {
      setErrorMsg('No products found to adjust.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (productService.bulkAdjustStock) {
        await productService.bulkAdjustStock({
          productIds: targetIds,
          mode: stockMode,
          amount: stockAmount,
          shelfLocation: shelfLocationInput.trim() ? shelfLocationInput.trim() : undefined,
          lowStockThreshold: lowStockThresholdInput
        });
        setSuccessMsg(`Successfully updated inventory & shelf tracking for ${targetIds.length} products.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Bulk stock update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCategoryMove = async () => {
    if (targetIds.length === 0 || !targetCategory) {
      setErrorMsg('Please select a target category.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const cat = categories.find(c => c.id === targetCategory || c.slug === targetCategory);
      if (productService.bulkMoveCategory) {
        await productService.bulkMoveCategory({
          productIds: targetIds,
          categoryId: targetCategory,
          categoryName: cat?.name
        });
        setSuccessMsg(`Moved ${targetIds.length} products to ${cat?.name || targetCategory}.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Bulk category move failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVisibility = async () => {
    if (targetIds.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (productService.bulkUpdateVisibility) {
        await productService.bulkUpdateVisibility({
          productIds: targetIds,
          websiteVisible: visibilityOption === 'publish',
          posAvailable: true,
          status: visibilityOption === 'publish' ? 'active' : 'draft'
        });
        setSuccessMsg(`Updated publication status for ${targetIds.length} products.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Bulk visibility update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTags = async () => {
    if (targetIds.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const tags: any = {};
      if (tagFeatured !== undefined) tags.isFeatured = tagFeatured;
      if (tagPopular !== undefined) tags.isPopular = tagPopular;
      if (tagNew !== undefined) tags.isNewArrival = tagNew;
      if (tagHot !== undefined) tags.isHot = tagHot;

      if (productService.bulkUpdateTags) {
        await productService.bulkUpdateTags({
          productIds: targetIds,
          tags
        });
        setSuccessMsg(`Applied catalog badge tags to ${targetIds.length} products.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update tags');
    } finally {
      setLoading(false);
    }
  };

  // Client-side Instant POS CSV Export with Barcodes & Multi-tier Pricing
  const handleExportCustomCsv = (onlySelected: boolean) => {
    const targetProducts = onlySelected && selectedProductIds.length > 0
      ? products.filter(p => selectedProductIds.includes(p.id))
      : products;

    const headers = [
      'ID', 'Name', 'SKU', 'Model', 'Brand', 'Category',
      'Regular Price (BDT)', 'Sale Price (BDT)', 'Wholesale Price (BDT)', 'Cost Price (BDT)',
      'Stock Available', 'Shelf Location', 'Status', 'POS Barcode'
    ];
    const escape = (val: any) => {
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = [headers.join(',')];
    for (const p of targetProducts) {
      rows.push([
        escape(p.id),
        escape(p.name),
        escape(p.sku),
        escape(p.modelNumber || ''),
        escape(p.brand || ''),
        escape(p.category || ''),
        escape(p.pricing?.regularPrice ?? ''),
        escape(p.pricing?.salePrice ?? ''),
        escape(p.pricing?.wholesalePrice ?? ''),
        escape(p.costPrice ?? p.pricing?.costPrice ?? ''),
        escape(p.inventory?.available ?? 0),
        escape(p.inventory?.shelfLocation ?? ''),
        escape(p.status || 'active'),
        escape(p.barcode || '')
      ].join(','));
    }

    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `camnex_pos_inventory_${onlySelected ? 'selected_' : 'full_catalog_'}${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDryRun = async () => {
    try {
      setErrorMsg('');
      const rows = JSON.parse(importJsonText);
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dryRun: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import preview failed');
      setImportPreview(data);
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid JSON rows data');
    }
  };

  const handleExecuteImport = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const rows = JSON.parse(importJsonText);
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dryRun: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setSuccessMsg(`Imported ${data.importedCount} products successfully.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to execute import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      theme="dark"
      maxWidth="max-w-4xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F15A24]/10 border border-[#F15A24]/20 flex items-center justify-center text-[#F15A24] shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-black font-heading text-white tracking-tight">Bulk Catalog Operations & Phase 2 Tools</div>
            <div className="text-[11px] text-slate-400 font-normal">Pricing Margins, Warehouse Inventory & POS Handheld Scanner Exports</div>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-200">
        {/* Navigation Tabs (High Contrast Dark Segmented Control) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          {[
            { id: 'prices', label: 'Price & Margin', icon: Percent },
            { id: 'stock', label: 'Stock & Shelf', icon: Boxes },
            { id: 'category', label: 'Category Move', icon: FolderTree },
            { id: 'visibility', label: 'Visibility / POS', icon: Eye },
            { id: 'tags', label: 'Badges & Ribbons', icon: Tag },
            { id: 'impexp', label: 'POS Barcode CSV', icon: FileSpreadsheet }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#F15A24] text-white shadow-lg shadow-orange-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Scope Controller Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[#F15A24]">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Operation Target Scope:</span>
                <span className="text-[#F15A24] font-black">{targetIds.length} Products</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {scopeMode === 'selected' && selectedProductIds.length > 0
                  ? `Applying only to the ${selectedProductIds.length} checked rows from the catalog table.`
                  : `Applying globally across all ${products.length} products in the catalog.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setScopeMode('selected')}
              disabled={selectedProductIds.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                scopeMode === 'selected' && selectedProductIds.length > 0
                  ? 'bg-[#F15A24] text-white'
                  : 'text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400'
              }`}
            >
              Selected ({selectedProductIds.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                scopeMode === 'all' ? 'bg-[#F15A24] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Catalog ({products.length})
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: BULK PRICE & MARGIN ADJUSTMENT */}
        {activeTab === 'prices' && (
          <div className="space-y-4">
            {/* Mode Cards */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1. Select Adjustment Formula
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'percent_increase', label: '+ Markup (%)', desc: 'Inflation / Margins', icon: TrendingUp },
                  { id: 'percent_decrease', label: '- Discount (%)', desc: 'Promotional sale', icon: TrendingDown },
                  { id: 'fixed_increase', label: '+ Fixed (৳)', desc: 'Add exact BDT', icon: DollarSign },
                  { id: 'fixed_decrease', label: '- Markdown (৳)', desc: 'Deduct exact BDT', icon: DollarSign },
                  { id: 'set_fixed', label: '= Set Price (৳)', desc: 'Exact flat rate', icon: Sparkles }
                ].map(m => {
                  const Icon = m.icon;
                  const isCur = priceMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPriceMode(m.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isCur
                          ? 'bg-orange-500/10 border-[#F15A24] text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{m.label}</span>
                        <Icon className={`w-3.5 h-3.5 ${isCur ? 'text-[#F15A24]' : 'text-slate-500'}`} />
                      </div>
                      <span className="text-[10px] text-slate-500">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Tier & Adjustment Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Target Price Field Tier
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  {[
                    { id: 'regularPrice', label: 'Regular Retail' },
                    { id: 'salePrice', label: 'Sale Promo' },
                    { id: 'wholesalePrice', label: 'B2B Wholesale' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTargetField(f.id as any)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                        targetField === f.id
                          ? 'bg-[#F15A24] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Adjustment Amount ({priceMode.includes('percent') ? '%' : 'BDT ৳'})
                  </label>
                  <div className="flex items-center gap-1">
                    {(priceMode.includes('percent') ? [5, 10, 15, 20] : [100, 500, 1000, 2000]).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPriceAmount(val)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      >
                        {priceMode.includes('percent') ? `+${val}%` : `+৳${val}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700/80 text-white font-mono font-bold text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {priceMode.includes('percent') ? '%' : '৳ BDT'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Rounding Chips */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Commercial Price Rounding Rules
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { val: 1, label: 'Exact BDT', desc: 'No rounding (e.g. ৳1,483)' },
                  { val: 10, label: 'Nearest ৳10', desc: 'Tidy digits (e.g. ৳1,480)' },
                  { val: 50, label: 'Nearest ৳50', desc: 'Standard retail (e.g. ৳1,450 / ৳1,500)' },
                  { val: 100, label: 'Nearest ৳100', desc: 'Clean high-value (e.g. ৳2,400 / ৳2,500)' }
                ].map(r => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setRoundToNearest(r.val)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      roundToNearest === r.val
                        ? 'bg-orange-500/10 border-[#F15A24] text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation Preview */}
            {previewProducts.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Live Calculation Preview (First {previewProducts.length} items):</span>
                  <span className="text-emerald-400 font-mono">Real-time simulation</span>
                </div>
                <div className="space-y-2">
                  {previewProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800/80">
                      <span className="font-medium text-slate-200 truncate max-w-sm">{p.name} ({p.sku})</span>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-slate-500 line-through font-mono">৳{p.oldVal.toLocaleString()}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[#F15A24] font-black font-mono text-sm">৳{p.newVal.toLocaleString()}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          p.delta >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {p.delta >= 0 ? `+৳${p.delta.toLocaleString()}` : `-৳${Math.abs(p.delta).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              size="md"
              onClick={handleApplyPrice}
              disabled={loading || targetIds.length === 0}
              className="w-full bg-[#F15A24] hover:bg-[#D94D1C] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>Apply Price Formula to {targetIds.length} Products</span>
            </Button>
          </div>
        )}

        {/* TAB 2: BULK STOCK & SHELF LOCATION (PHASE 2 ERP/POS) */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Mode Cards */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1. Select Inventory Action Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'add_stock', label: '+ Inward Stock Receipt', desc: 'Add +X units to current warehouse count', color: 'emerald' },
                  { id: 'set_fixed', label: '= Stock Audit / Count', desc: 'Set exact physical on-hand quantity', color: 'sky' },
                  { id: 'reduce_stock', label: '- Stock Outflow / Write-off', desc: 'Deduct -X units (minimum 0)', color: 'rose' }
                ].map(m => {
                  const isCur = stockMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setStockMode(m.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isCur
                          ? 'bg-orange-500/10 border-[#F15A24] text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-0.5">{m.label}</div>
                      <div className="text-[10px] text-slate-500">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs: Amount, Threshold, Shelf */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quantity (Units)</label>
                  <div className="flex items-center gap-1">
                    {[5, 10, 25, 50].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStockAmount(val)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-700/80 text-emerald-400 font-mono font-bold text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Low Stock Warning Limit</label>
                <input
                  type="number"
                  value={lowStockThresholdInput}
                  onChange={(e) => setLowStockThresholdInput(parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-900 border border-slate-700/80 text-amber-400 font-mono font-bold text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Warehouse Shelf Location</label>
                <input
                  type="text"
                  value={shelfLocationInput}
                  onChange={(e) => setShelfLocationInput(e.target.value)}
                  placeholder="e.g. Rack A-01 / Shelf 2"
                  className="w-full bg-slate-900 border border-slate-700/80 text-white font-mono text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                />
              </div>
            </div>

            {/* Stock Live Preview */}
            {previewStockProducts.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Live Stock Simulation (First {previewStockProducts.length} items):
                </div>
                <div className="space-y-2">
                  {previewStockProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800/80">
                      <span className="font-medium text-slate-200 truncate max-w-sm">{p.name} ({p.sku})</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400 font-mono">{p.oldVal} units</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-emerald-400 font-black font-mono">{p.newVal} units</span>
                        {shelfLocationInput && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                            {shelfLocationInput}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              size="md"
              onClick={handleApplyStock}
              disabled={loading || targetIds.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold"
            >
              <Boxes className="w-4 h-4 mr-1.5" />
              <span>Update Inventory & Shelf for {targetIds.length} Products</span>
            </Button>
          </div>
        )}

        {/* TAB 3: BULK CATEGORY MOVE */}
        {activeTab === 'category' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Hardware Category
              </label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm p-3 rounded-xl font-bold focus:outline-none focus:border-[#F15A24]"
              >
                <option value="" className="bg-slate-900 text-slate-400">-- Choose Category Destination --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white font-medium">{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Moving products will reassign their canonical category hierarchy and update live storefront breadcrumbs immediately.
              </p>
            </div>

            <Button
              size="md"
              onClick={handleApplyCategoryMove}
              disabled={loading || targetIds.length === 0 || !targetCategory}
              className="w-full bg-[#F15A24] hover:bg-[#D94D1C] text-white py-3 rounded-xl font-bold"
            >
              <FolderTree className="w-4 h-4 mr-1.5" />
              <span>Relocate {targetIds.length} Products to Category</span>
            </Button>
          </div>
        )}

        {/* TAB 4: VISIBILITY & STATUS */}
        {activeTab === 'visibility' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'publish', title: 'Active & Published', desc: 'Visible on live storefront and POS terminals', icon: Eye, activeBorder: 'border-emerald-500', activeBg: 'bg-emerald-500/10' },
                { id: 'hide', title: 'Draft / Hidden', desc: 'Hidden from customers; preserved in back-office', icon: EyeOff, activeBorder: 'border-amber-500', activeBg: 'bg-amber-500/10' },
                { id: 'pos_only', title: 'POS / Physical Desk Only', desc: 'Hidden on web; available on physical checkout registers', icon: Warehouse, activeBorder: 'border-sky-500', activeBg: 'bg-sky-500/10' }
              ].map(opt => {
                const Icon = opt.icon;
                const isCur = visibilityOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVisibilityOption(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isCur
                        ? `${opt.activeBg} ${opt.activeBorder} text-white`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                      <Icon className="w-4 h-4 text-[#F15A24]" />
                      <span>{opt.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            <Button
              size="md"
              onClick={handleApplyVisibility}
              disabled={loading || targetIds.length === 0}
              className="w-full bg-[#F15A24] hover:bg-[#D94D1C] text-white py-3 rounded-xl font-bold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>Apply Publication Status to {targetIds.length} Products</span>
            </Button>
          </div>
        )}

        {/* TAB 5: BADGES & FLAGS */}
        {activeTab === 'tags' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { state: tagFeatured, set: setTagFeatured, label: 'Featured' },
                { state: tagPopular, set: setTagPopular, label: 'Popular' },
                { state: tagNew, set: setTagNew, label: 'New Arrival' },
                { state: tagHot, set: setTagHot, label: 'Hot Item' }
              ].map(tag => (
                <label key={tag.label} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700">
                  <span className="text-xs font-bold text-white">{tag.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(tag.state)}
                    onChange={(e) => tag.set(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-[#F15A24] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <Button
              size="md"
              onClick={handleApplyTags}
              disabled={loading || targetIds.length === 0}
              className="w-full bg-[#F15A24] hover:bg-[#D94D1C] text-white py-3 rounded-xl font-bold"
            >
              <Tag className="w-4 h-4 mr-1.5" />
              <span>Save Badge Flags for {targetIds.length} Products</span>
            </Button>
          </div>
        )}

        {/* TAB 6: POS BARCODE & CSV SPREADSHEETS */}
        {activeTab === 'impexp' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-[#F15A24]" />
                    <span>Export POS Scanner & Inventory CSV</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Formatted for barcode handheld terminals & reconciliation. Includes Barcode (UPC/EAN), SKU, Regular Price, Wholesale Price, Cost, Stock, and Shelf Location.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportCustomCsv(true)}
                  disabled={selectedProductIds.length === 0}
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download Selected ({selectedProductIds.length} items)</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleExportCustomCsv(false)}
                  className="bg-[#F15A24] hover:bg-[#D94D1C] text-white"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download Full Catalog ({products.length} items)</span>
                </Button>
              </div>
            </div>

            {/* JSON Catalog Import */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white block">Import Catalog JSON Payload</label>
                <button
                  type="button"
                  onClick={() => {
                    setImportJsonText(JSON.stringify([
                      {
                        name: "Hikvision DS-2CD2047G2-LU 4MP ColorVu",
                        sku: "CNX-HIK-2CD2047",
                        modelNumber: "DS-2CD2047G2-LU",
                        brand: "Hikvision",
                        category: "CCTV Cameras",
                        regularPrice: 8500,
                        salePrice: 7990,
                        wholesalePrice: 6800,
                        availableStock: 15,
                        barcode: "8801234567890",
                        shelfLocation: "Rack H-01"
                      }
                    ], null, 2));
                  }}
                  className="text-[10px] text-[#F15A24] font-bold hover:underline"
                >
                  Load Sample Template
                </button>
              </div>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste JSON array of products here..."
                className="w-full h-28 p-3 font-mono text-xs bg-slate-900 border border-slate-700/80 text-slate-200 rounded-xl focus:outline-none focus:border-[#F15A24]"
              />

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImportDryRun}
                  disabled={!importJsonText.trim()}
                  className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white"
                >
                  Validate & Preview
                </Button>

                {importPreview && (
                  <Button
                    size="sm"
                    onClick={handleExecuteImport}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Commit {importPreview.validRows?.length || 0} Products
                  </Button>
                )}
              </div>

              {importPreview && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-white">Import Validation Summary:</div>
                  <div className="text-emerald-400">Valid Products: {importPreview.validRows?.length || 0}</div>
                  {importPreview.invalidRows?.length > 0 && (
                    <div className="text-rose-400">Errors: {importPreview.invalidRows.length} rows failed validation.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
