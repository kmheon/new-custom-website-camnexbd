import React, { useState } from 'react';
import {
  SlidersHorizontal, ArrowRight, Percent, DollarSign, FolderTree, Tag,
  Eye, EyeOff, Trash2, Archive, Check, AlertTriangle, FileSpreadsheet,
  Download, Upload, RefreshCw, X, AlertCircle
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
  const [activeTab, setActiveTab] = useState<'prices' | 'category' | 'visibility' | 'tags' | 'impexp'>('prices');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bulk Price adjustment state
  const [priceMode, setPriceMode] = useState<BulkPriceMode>('percent_increase');
  const [priceAmount, setPriceAmount] = useState<number>(5);
  const [targetField, setTargetField] = useState<'regularPrice' | 'salePrice' | 'wholesalePrice'>('regularPrice');
  const [roundToNearest, setRoundToNearest] = useState<number>(50);

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

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  // Compute live price preview on first 3 products
  const previewProducts = selectedProducts.slice(0, 3).map(p => {
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
    return { name: p.name, sku: p.sku, oldVal: cur, newVal: next };
  });

  const handleApplyPrice = async () => {
    if (selectedProductIds.length === 0) {
      setErrorMsg('No products selected');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (productService.bulkAdjustPrices) {
        await productService.bulkAdjustPrices({
          productIds: selectedProductIds,
          mode: priceMode,
          amount: priceAmount,
          targetField,
          roundToNearest
        });
        setSuccessMsg(`Successfully adjusted prices for ${selectedProductIds.length} products`);
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

  const handleApplyCategoryMove = async () => {
    if (selectedProductIds.length === 0 || !targetCategory) {
      setErrorMsg('Please select a target category');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const cat = categories.find(c => c.id === targetCategory || c.slug === targetCategory);
      if (productService.bulkMoveCategory) {
        await productService.bulkMoveCategory({
          productIds: selectedProductIds,
          categoryId: targetCategory,
          categoryName: cat?.name
        });
        setSuccessMsg(`Moved ${selectedProductIds.length} products to ${cat?.name || targetCategory}`);
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
    if (selectedProductIds.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (productService.bulkUpdateVisibility) {
        await productService.bulkUpdateVisibility({
          productIds: selectedProductIds,
          websiteVisible: visibilityOption === 'publish',
          posAvailable: true,
          status: visibilityOption === 'publish' ? 'active' : 'draft'
        });
        setSuccessMsg(`Updated publication visibility for ${selectedProductIds.length} products`);
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
    if (selectedProductIds.length === 0) return;
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
          productIds: selectedProductIds,
          tags
        });
        setSuccessMsg(`Applied catalog tags to ${selectedProductIds.length} products`);
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

  const handleExportCsv = () => {
    window.open('/api/admin/products/export?format=csv', '_blank');
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
      title="Bulk Catalog Operations & CSV Importer/Exporter"
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 mb-4 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('prices')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'prices' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Bulk Price Adjust</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'category' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Category Move</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'visibility' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visibility & Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'tags' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Badges & Flags</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impexp')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'impexp' ? 'bg-[#F15A24] text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV / JSON Tools</span>
          </button>
        </div>

        {/* Selected target info banner */}
        <div className="mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <div>
            <strong>{selectedProductIds.length}</strong> products selected for bulk action
          </div>
          {selectedProductIds.length === 0 && activeTab !== 'impexp' && (
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Select products using checkboxes in the table first
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: BULK PRICE ADJUSTMENT */}
          {activeTab === 'prices' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Mode</label>
                  <select
                    value={priceMode}
                    onChange={(e) => setPriceMode(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-bold"
                  >
                    <option value="percent_increase">+ Percentage Increase (%)</option>
                    <option value="percent_decrease">- Percentage Decrease (%)</option>
                    <option value="fixed_increase">+ Fixed Amount Increase (BDT)</option>
                    <option value="fixed_decrease">- Fixed Amount Decrease (BDT)</option>
                    <option value="set_fixed">Set Exact Price (BDT)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount / Value</label>
                  <input
                    type="number"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-bold text-[#F15A24]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Price Field</label>
                  <select
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-medium"
                  >
                    <option value="regularPrice">Regular Price (Storefront)</option>
                    <option value="salePrice">Sale / Promotional Price</option>
                    <option value="wholesalePrice">B2B Wholesale Price</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Commercial Rounding Rule</label>
                <select
                  value={roundToNearest}
                  onChange={(e) => setRoundToNearest(parseInt(e.target.value, 10) || 1)}
                  className="w-full sm:w-1/2 bg-white border border-slate-300 text-xs p-2 rounded-lg"
                >
                  <option value={1}>Exact (No rounding)</option>
                  <option value={10}>Round to nearest ৳10</option>
                  <option value={50}>Round to nearest ৳50 (e.g. ৳1,450 / ৳1,500)</option>
                  <option value={100}>Round to nearest ৳100 (e.g. ৳2,400 / ৳2,500)</option>
                </select>
              </div>

              {/* Live Preview Card */}
              {previewProducts.length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live Calculation Preview (First {previewProducts.length} items):
                  </span>
                  <div className="space-y-1.5">
                    {previewProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                        <span className="font-medium text-slate-800 truncate max-w-xs">{p.name} ({p.sku})</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 line-through">৳{p.oldVal.toLocaleString()}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <strong className="text-[#F15A24]">৳{p.newVal.toLocaleString()}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                size="md"
                onClick={handleApplyPrice}
                disabled={loading || selectedProductIds.length === 0}
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>Apply Price Adjustment ({selectedProductIds.length} items)</span>
              </Button>
            </div>
          )}

          {/* TAB 2: BULK CATEGORY MOVE */}
          {activeTab === 'category' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Category *</label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold"
                >
                  <option value="">-- Choose Category to Move Selected Products Into --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-500">
                Moving products will reassign their canonical category and update storefront breadcrumbs immediately.
              </p>

              <Button
                size="md"
                onClick={handleApplyCategoryMove}
                disabled={loading || selectedProductIds.length === 0 || !targetCategory}
              >
                <FolderTree className="w-4 h-4 mr-1.5" />
                <span>Move Selected to Category</span>
              </Button>
            </div>
          )}

          {/* TAB 3: VISIBILITY & STATUS */}
          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibilityOption('publish')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    visibilityOption === 'publish'
                      ? 'border-[#F15A24] bg-orange-50 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-4 h-4 text-emerald-600 mb-1" />
                  <div className="text-xs font-bold">Publish to Website</div>
                  <div className="text-[10px] text-slate-500">Active and visible to all visitors</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibilityOption('hide')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    visibilityOption === 'hide'
                      ? 'border-[#F15A24] bg-orange-50 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <EyeOff className="w-4 h-4 text-amber-600 mb-1" />
                  <div className="text-xs font-bold">Unpublish / Draft</div>
                  <div className="text-[10px] text-slate-500">Hidden from storefront search & catalog</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibilityOption('pos_only')}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    visibilityOption === 'pos_only'
                      ? 'border-[#F15A24] bg-orange-50 text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-blue-600 mb-1" />
                  <div className="text-xs font-bold">POS / ERP Only</div>
                  <div className="text-[10px] text-slate-500">Internal retail counter checkout only</div>
                </button>
              </div>

              <Button
                size="md"
                onClick={handleApplyVisibility}
                disabled={loading || selectedProductIds.length === 0}
              >
                <Check className="w-4 h-4 mr-1.5" />
                <span>Apply Visibility State</span>
              </Button>
            </div>
          )}

          {/* TAB 4: BADGES & FLAGS */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <span className="text-xs text-slate-600 block">
                Update marketing ribbon tags across all selected catalog items:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">Featured</span>
                  <input
                    type="checkbox"
                    checked={Boolean(tagFeatured)}
                    onChange={(e) => setTagFeatured(e.target.checked)}
                    className="rounded text-[#F15A24]"
                  />
                </label>

                <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">Popular</span>
                  <input
                    type="checkbox"
                    checked={Boolean(tagPopular)}
                    onChange={(e) => setTagPopular(e.target.checked)}
                    className="rounded text-[#F15A24]"
                  />
                </label>

                <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">New Arrival</span>
                  <input
                    type="checkbox"
                    checked={Boolean(tagNew)}
                    onChange={(e) => setTagNew(e.target.checked)}
                    className="rounded text-[#F15A24]"
                  />
                </label>

                <label className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800">Hot Item</span>
                  <input
                    type="checkbox"
                    checked={Boolean(tagHot)}
                    onChange={(e) => setTagHot(e.target.checked)}
                    className="rounded text-[#F15A24]"
                  />
                </label>
              </div>

              <Button
                size="md"
                onClick={handleApplyTags}
                disabled={loading || selectedProductIds.length === 0}
              >
                <Tag className="w-4 h-4 mr-1.5" />
                <span>Save Badge Flags</span>
              </Button>
            </div>
          )}

          {/* TAB 5: CSV / JSON EXPORT & IMPORT */}
          {activeTab === 'impexp' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Export Catalog to CSV Spreadsheet</h4>
                  <p className="text-[11px] text-slate-500">
                    Exports SKU, Model, Category, Regular Price, Cost Price, Stock & Barcode.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleExportCsv}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download CSV</span>
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Import Products JSON Data</label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportJsonText(JSON.stringify([
                        {
                          name: "Hikvision DS-2CD2047G2-LU 4MP ColorVu",
                          sku: "prod-hik-4mp-colorvu",
                          modelNumber: "DS-2CD2047G2-LU",
                          brand: "Hikvision",
                          category: "IP Cameras",
                          regularPrice: 8500,
                          salePrice: 7990,
                          availableStock: 15,
                          barcode: "8801234567890"
                        }
                      ], null, 2));
                    }}
                    className="text-[10px] text-[#F15A24] font-bold hover:underline"
                  >
                    Paste Sample Template
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste JSON array of products here..."
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono text-slate-800"
                />

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImportDryRun}
                    disabled={!importJsonText.trim()}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Dry-Run Validation Preview</span>
                  </Button>

                  {importPreview && importPreview.validRows > 0 && (
                    <Button
                      size="sm"
                      onClick={handleExecuteImport}
                      disabled={loading}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>Execute Import ({importPreview.validRows} Valid Rows)</span>
                    </Button>
                  )}
                </div>

                {/* Import preview report */}
                {importPreview && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">Total: {importPreview.totalRows}</span>
                      <span className="text-emerald-600 font-bold">Valid: {importPreview.validRows}</span>
                      {importPreview.invalidRows > 0 && (
                        <span className="text-red-600 font-bold">Invalid: {importPreview.invalidRows}</span>
                      )}
                    </div>
                    {importPreview.errors?.length > 0 && (
                      <div className="text-red-600 text-[11px] space-y-1">
                        {importPreview.errors.map((err: any, idx: number) => (
                          <div key={idx}>Row #{err.row}: {err.error} ({err.field})</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

