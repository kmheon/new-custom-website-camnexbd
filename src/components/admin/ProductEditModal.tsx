import React, { useState, useEffect } from 'react';
import { Check, X, Plus, Trash2, Image as ImageIcon, Sliders, Shield, Tag, HelpCircle } from 'lucide-react';
import { Button, Modal, Badge } from '../common/UI';
import { MediaPickerModal } from './MediaLibraryModal';
import { productService } from '../../services';
import { Product, Category, Brand, SpecTemplate } from '../../types';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Partial<Product> | null;
  categories: Category[];
  brands: Brand[];
  templates: SpecTemplate[];
  onSaveSuccess: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  brands,
  templates,
  onSaveSuccess
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [keyFeaturesText, setKeyFeaturesText] = useState('');
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Media Picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'primary' | 'gallery'>('primary');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        modelNumber: product.modelNumber || '',
        sku: product.sku || '',
        brand: product.brand || (brands[0]?.name || 'Hikvision'),
        brandId: product.brandId || (brands[0]?.id || 'b-hikvision'),
        category: product.category || (categories[0]?.name || 'CCTV Cameras'),
        categoryId: product.categoryId || (categories[0]?.id || 'cctv-cameras'),
        productType: product.productType || 'physical',
        status: product.status || 'active',
        websiteVisible: product.websiteVisible !== false,
        posAvailable: product.posAvailable !== false,
        primaryImage: product.primaryImage || '',
        images: product.images || [],
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        unit: product.unit || 'Piece',
        warrantyMonths: product.warrantyMonths || 12,
        warrantyText: product.warrantyText || 'Standard Manufacturer Warranty',
        isFeatured: !!product.isFeatured,
        isPopular: !!product.isPopular,
        pricing: {
          regularPrice: product.pricing?.regularPrice,
          salePrice: product.pricing?.salePrice,
          currency: 'BDT'
        },
        inventory: {
          available: product.inventory?.available ?? 10,
          status: product.inventory?.status || 'in_stock'
        }
      });

      setKeyFeaturesText((product.keyFeatures || []).join('\n'));
      setSpecs(product.specifications || {});
      setGalleryImages(product.images || []);

      // Parse custom specs that are not in the template
      const currentTemplate = templates.find(
        t => t.id === product.categoryId || t.categorySlug === product.categoryId || t.name === product.category
      );
      const templateKeys = new Set((currentTemplate?.fields || []).map(f => f.key));
      const extra: Array<{ key: string; value: string }> = [];
      if (product.specifications) {
        Object.entries(product.specifications).forEach(([k, v]) => {
          if (!templateKeys.has(k)) {
            extra.push({ key: k, value: String(v) });
          }
        });
      }
      setCustomSpecs(extra);
    }
  }, [product, categories, brands, templates]);

  if (!isOpen || !product) return null;

  // Selected Category's Template
  const selectedCategoryObj = categories.find(c => c.id === formData.categoryId || c.slug === formData.categoryId);
  const matchedTemplate = templates.find(
    t => t.id === selectedCategoryObj?.specTemplateId || t.categorySlug === selectedCategoryObj?.slug || t.name.toLowerCase() === formData.category?.toLowerCase()
  );

  const handleBrandChange = (brandId: string) => {
    const b = brands.find(item => item.id === brandId);
    setFormData(prev => ({
      ...prev,
      brandId,
      brand: b ? b.name : prev.brand
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    const c = categories.find(item => item.id === categoryId);
    setFormData(prev => ({
      ...prev,
      categoryId,
      category: c ? c.name : prev.category
    }));
  };

  const handleSpecFieldChange = (key: string, value: any) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  const handleAddCustomSpec = () => {
    setCustomSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveCustomSpec = (idx: number) => {
    setCustomSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCustomSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
    setCustomSpecs(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleAddGalleryImage = (url: string) => {
    if (!url.trim()) return;
    setGalleryImages(prev => [...prev, url.trim()]);
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMediaSelect = (url: string) => {
    if (pickerTarget === 'primary') {
      setFormData(prev => ({ ...prev, primaryImage: url }));
    } else {
      handleAddGalleryImage(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!formData.modelNumber?.trim()) {
      setError('Model number is required.');
      return;
    }
    if (!formData.sku?.trim()) {
      setError('SKU is required.');
      return;
    }

    // Combine template specs and custom specs
    const combinedSpecs: Record<string, any> = { ...specs };
    customSpecs.forEach(({ key, value }) => {
      if (key.trim()) {
        combinedSpecs[key.trim()] = value.trim();
      }
    });

    const featuresList = keyFeaturesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: Partial<Product> = {
      ...formData,
      primaryImage: formData.primaryImage || '/images/hero/hikvision-bullet.png',
      images: galleryImages.length > 0 ? galleryImages : [formData.primaryImage || '/images/hero/hikvision-bullet.png'],
      keyFeatures: featuresList,
      specifications: combinedSpecs,
      pricing: {
        regularPrice: formData.pricing?.regularPrice ? Number(formData.pricing.regularPrice) : undefined,
        salePrice: formData.pricing?.salePrice ? Number(formData.pricing.salePrice) : undefined,
        currency: 'BDT'
      },
      inventory: {
        available: Number(formData.inventory?.available || 0),
        status: formData.inventory?.status || 'in_stock'
      }
    };

    setIsSaving(true);
    try {
      if (product.id) {
        await productService.updateProduct(product.id, payload);
      } else {
        await productService.createProduct(payload as any);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product.id ? `Edit Product: ${product.name}` : 'Add New Hardware Product'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-900 max-h-[82vh] overflow-y-auto pr-2">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Section 1: Core Identifiers */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Product Identification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hikvision 2MP Fixed Bullet Turbo HD Camera"
                  className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Model Number *</label>
                <input
                  type="text"
                  value={formData.modelNumber || ''}
                  onChange={e => setFormData({ ...formData, modelNumber: e.target.value })}
                  placeholder="e.g. DS-2CE16D0T-IRPF"
                  className="w-full bg-white border border-slate-300 text-xs p-2.5 rounded-lg font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">SKU *</label>
                <input
                  type="text"
                  value={formData.sku || ''}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. HIK-2CE16D0T-IRPF"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Brand *</label>
                <select
                  value={formData.brandId || ''}
                  onChange={e => handleBrandChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium"
                >
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                <select
                  value={formData.categoryId || ''}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-medium"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Unit</label>
                <select
                  value={formData.unit || 'Piece'}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                >
                  <option value="Piece">Piece</option>
                  <option value="Meter">Meter</option>
                  <option value="Box">Box</option>
                  <option value="Set">Set</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Publication Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="visibleToggle"
                  checked={formData.websiteVisible !== false}
                  onChange={e => setFormData({ ...formData, websiteVisible: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                />
                <label htmlFor="visibleToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Website Storefront Visible
                </label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={!!formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                />
                <label htmlFor="featuredToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Featured Product
                </label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="popularToggle"
                  checked={!!formData.isPopular}
                  onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                />
                <label htmlFor="popularToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Popular / Best Seller
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Inventory */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Pricing & Stock</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Regular Price (BDT ৳)
                  <span className="text-[10px] text-slate-400 font-normal block">Leave empty for "Request Quotation"</span>
                </label>
                <input
                  type="number"
                  value={formData.pricing?.regularPrice ?? ''}
                  onChange={e => setFormData({
                    ...formData,
                    pricing: {
                      ...formData.pricing!,
                      currency: 'BDT',
                      regularPrice: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="e.g. 2100"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-bold text-[#F15A24]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sale / Promo Price (BDT ৳)
                  <span className="text-[10px] text-slate-400 font-normal block">Optional discount price</span>
                </label>
                <input
                  type="number"
                  value={formData.pricing?.salePrice ?? ''}
                  onChange={e => setFormData({
                    ...formData,
                    pricing: {
                      ...formData.pricing!,
                      currency: 'BDT',
                      salePrice: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="e.g. 1950"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Available Quantity</label>
                <input
                  type="number"
                  value={formData.inventory?.available ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    inventory: {
                      ...formData.inventory!,
                      available: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Stock Status</label>
                <select
                  value={formData.inventory?.status || 'in_stock'}
                  onChange={e => setFormData({
                    ...formData,
                    inventory: {
                      ...formData.inventory!,
                      status: e.target.value as any
                    }
                  })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="pre_order">Pre-Order</option>
                  <option value="request_quote">Request Quote</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Media & Images */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Product Photography & Gallery</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPickerTarget('primary');
                  setMediaPickerOpen(true);
                }}
              >
                <ImageIcon className="w-3.5 h-3.5 mr-1" />
                <span>Media Library</span>
              </Button>
            </div>

            {/* Primary Image */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">Primary Image URL *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.primaryImage || ''}
                    onChange={e => setFormData({ ...formData, primaryImage: e.target.value })}
                    placeholder="/uploads/filename.png or /images/hero/..."
                    className="flex-1 bg-white border border-slate-300 text-xs p-2 rounded font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPickerTarget('primary');
                      setMediaPickerOpen(true);
                    }}
                  >
                    Browse
                  </Button>
                </div>
              </div>

              <div className="flex justify-center items-center">
                {formData.primaryImage ? (
                  <img
                    src={formData.primaryImage}
                    alt="Preview"
                    className="w-16 h-16 object-contain rounded border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-16 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Images */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Additional Gallery Images</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPickerTarget('gallery');
                    setMediaPickerOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add from Library</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="relative group bg-white border border-slate-200 p-1 rounded-lg">
                    <img src={img} alt="" className="w-14 h-14 object-contain rounded" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Specifications (Category Dynamic Specs) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  4. Technical Specifications
                </h3>
                {matchedTemplate ? (
                  <p className="text-[10px] text-slate-500">
                    Template: <strong>{matchedTemplate.name}</strong> ({matchedTemplate.fields.length} dynamic fields)
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-600">
                    No template linked to category "{formData.category}". You can define custom specs below.
                  </p>
                )}
              </div>
            </div>

            {/* Render Template Fields */}
            {matchedTemplate && matchedTemplate.fields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                {matchedTemplate.fields.map(field => {
                  const currentValue = specs[field.key] ?? '';
                  return (
                    <div key={field.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          {field.name}
                          {field.unit && <span className="text-slate-400 font-normal ml-1">({field.unit})</span>}
                          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </label>
                        {field.filterable && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">Filterable</span>
                        )}
                      </div>

                      {field.type === 'enum' && field.options && field.options.length > 0 ? (
                        <select
                          value={String(currentValue)}
                          onChange={e => handleSpecFieldChange(field.key, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded"
                        >
                          <option value="">-- Select {field.name} --</option>
                          {field.options.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <select
                          value={currentValue === true ? 'true' : currentValue === false ? 'false' : ''}
                          onChange={e => handleSpecFieldChange(field.key, e.target.value === 'true')}
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded"
                        >
                          <option value="">-- Not specified --</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={currentValue}
                          onChange={e => handleSpecFieldChange(field.key, e.target.value ? Number(e.target.value) : '')}
                          placeholder={`e.g. 4`}
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(currentValue)}
                          onChange={e => handleSpecFieldChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.name.toLowerCase()}...`}
                          className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Extra Specs */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Custom / Additional Specs</label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCustomSpec}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Spec Row</span>
                </Button>
              </div>

              {customSpecs.map((spec, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={e => handleCustomSpecChange(idx, 'key', e.target.value)}
                    placeholder="Specification Key (e.g. Lens Size)"
                    className="flex-1 bg-white border border-slate-300 text-xs p-2 rounded"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={e => handleCustomSpecChange(idx, 'value', e.target.value)}
                    placeholder="Specification Value (e.g. 2.8mm fixed)"
                    className="flex-1 bg-white border border-slate-300 text-xs p-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSpec(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Descriptions & Key Features */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">5. Marketing Copy & Features</h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Short Description (Summary)</label>
              <textarea
                rows={2}
                value={formData.shortDescription || ''}
                onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="One or two sentences summarizing the product for listing cards..."
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Key Features (One per line)</label>
              <textarea
                rows={4}
                value={keyFeaturesText}
                onChange={e => setKeyFeaturesText(e.target.value)}
                placeholder="2 MP high performance CMOS sensor&#10;1920 × 1080 resolution&#10;Up to 20m IR distance&#10;IP66 weatherproof casing"
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Detailed Description</label>
              <textarea
                rows={4}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Complete product details, deployment instructions and manufacturer specs..."
                className="w-full bg-white border border-slate-300 text-xs p-2 rounded-lg"
              />
            </div>
          </div>

          {/* Section 6: Warranty & Compliance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">6. Warranty Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Warranty Period (Months)</label>
                <input
                  type="number"
                  value={formData.warrantyMonths ?? 12}
                  onChange={e => setFormData({ ...formData, warrantyMonths: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Warranty Description</label>
                <input
                  type="text"
                  value={formData.warrantyText || ''}
                  onChange={e => setFormData({ ...formData, warrantyText: e.target.value })}
                  placeholder="Official Brand Replacement Warranty"
                  className="w-full bg-white border border-slate-300 text-xs p-2 rounded"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#F15A24] text-white hover:bg-[#D94D1C]">
              <Check className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? 'Saving Changes...' : product.id ? 'Update Product' : 'Create Product'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Media Picker Sub-modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </>
  );
};

