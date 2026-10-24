import React, { useState, useEffect } from 'react';
import {
  Package, Check, X, Plus, Trash2, Image as ImageIcon, Sliders, Shield, Tag, HelpCircle,
  Globe, QrCode, Barcode, Calendar, ArrowUp, ArrowDown, FileText, CheckCircle2,
  AlertTriangle, Eye, Layers, Wrench, ChevronLeft, ChevronRight, Sparkles, RefreshCw, Star, UploadCloud
} from 'lucide-react';
import { Button, Modal, Badge } from '../common/UI';
import { MediaPickerModal } from './MediaLibraryModal';
import { ImagePickerField } from './ImagePickerField';
import { productService, mediaService } from '../../services';
import { useAdminAuthStore } from '../../store';
import { hasPermission, PERMISSIONS } from '../../shared/permissions';
import {
  Product, Category, Brand, SpecTemplate, ProductSeo,
  ProductDocument, ProductGalleryItem
} from '../../types';
import { getShortDisplayName } from '../../utils/displayName';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Partial<Product> | null;
  categories: Category[];
  brands: Brand[];
  templates: SpecTemplate[];
  allProducts?: Product[];
  onSaveSuccess: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  brands,
  templates,
  allProducts = [],
  onSaveSuccess
}) => {
  const { currentUser } = useAdminAuthStore();
  const canReadCost = hasPermission(currentUser?.permissions, PERMISSIONS.PRICING_COST_READ);

  const [formData, setFormData] = useState<Partial<Product>>({});
  const [keyFeaturesText, setKeyFeaturesText] = useState('');
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [specHighlights, setSpecHighlights] = useState<string[]>([]);
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string; highlight?: boolean }>>([]);
  const [galleryImages, setGalleryImages] = useState<ProductGalleryItem[]>([]);
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [seo, setSeo] = useState<ProductSeo>({
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    canonicalUrl: ''
  });
  const [keywordsText, setKeywordsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alpha transparency preview mode for primary image: 'checker' | 'white' | 'dark'
  const [alphaBgMode, setAlphaBgMode] = useState<'checker' | 'white' | 'dark'>('checker');

  // Media Picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'primary' | 'gallery'>('primary');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement>(null);


  // Active section tab for clean organizing
  const [activeTab, setActiveTab] = useState<'basics' | 'pricing' | 'inventory' | 'media' | 'specs' | 'descriptions' | 'seo' | 'relations'>('basics');

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        name: product.name || '',
        slug: product.slug || '',
        modelNumber: product.modelNumber || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        barcodeFormat: product.barcodeFormat || 'Code 128',
        brand: product.brand || (brands[0]?.name || 'Hikvision'),
        brandId: product.brandId || (brands[0]?.id || 'b-hikvision'),
        category: product.category || (categories[0]?.name || 'CCTV Cameras'),
        categoryId: product.categoryId || (categories[0]?.id || 'cctv-cameras'),
        subcategoryId: product.subcategoryId || '',
        subcategory: product.subcategory || '',
        subcategorySlug: product.subcategorySlug || '',
        productType: product.productType || 'physical',
        status: product.status || 'active',
        websiteVisible: product.websiteVisible !== false,
        posAvailable: product.posAvailable !== false,
        primaryImage: product.primaryImage || '',
        images: product.images || [],
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        unit: product.unit || 'Piece',
        warrantyMonths: product.warrantyMonths ?? 12,
        warrantyType: product.warrantyType || 'official',
        warrantyText: product.warrantyText || 'Standard Manufacturer Warranty',
        isFeatured: !!product.isFeatured,
        isPopular: !!product.isPopular,
        isNew: !!product.isNew,
        isHot: !!product.isHot,
        isAccessory: !!product.isAccessory,
        showOnHomepage: product.showOnHomepage !== false,
        packageEligible: product.packageEligible !== false,
        packageRoles: product.packageRoles || ['camera'],
        serialTracking: !!product.serialTracking,
        batchTracking: !!product.batchTracking,
        costPrice: product.costPrice ?? product.pricing?.costPrice,
        wholesalePrice: product.wholesalePrice ?? product.pricing?.wholesalePrice,
        pricing: {
          ...product.pricing,
          regularPrice: product.pricing?.regularPrice,
          salePrice: product.pricing?.salePrice,
          wholesalePrice: product.pricing?.wholesalePrice,
          costPrice: product.pricing?.costPrice,
          saleStartDate: product.pricing?.saleStartDate || '',
          saleEndDate: product.pricing?.saleEndDate || '',
          currency: 'BDT'
        },
        inventory: {
          ...product.inventory,
          available: product.inventory?.available ?? 10,
          lowStockThreshold: product.inventory?.lowStockThreshold ?? 5,
          allowBackorder: !!product.inventory?.allowBackorder,
          warehouseId: product.inventory?.warehouseId || 'main',
          status: product.inventory?.status || 'in_stock'
        },
        relatedProductIds: product.relatedProductIds || [],
        compatibleProductIds: product.compatibleProductIds || []
      });

      setKeyFeaturesText((product.keyFeatures || []).join('\n'));
      setSpecs(product.specifications || {});
      setDocuments(product.documents || []);

      // Parse gallery items
      if (product.galleryItems && product.galleryItems.length > 0) {
        setGalleryImages(product.galleryItems);
      } else if (product.images && product.images.length > 0) {
        setGalleryImages(product.images.map(url => ({ url, altText: product.name || '' })));
      } else {
        setGalleryImages([]);
      }

      setSeo({
        metaTitle: product.seo?.metaTitle || '',
        metaDescription: product.seo?.metaDescription || '',
        keywords: product.seo?.keywords || [],
        canonicalUrl: product.seo?.canonicalUrl || ''
      });
      setKeywordsText((product.seo?.keywords || []).join(', '));

      // Parse custom specs
      const currentTemplate = templates.find(
        t => t.id === product.categoryId || t.categorySlug === product.categoryId || t.name === product.category
      );
      const templateKeys = new Set((currentTemplate?.fields || []).map(f => f.key));
      const extraList: Array<{ key: string; value: string; highlight?: boolean }> = [];
      if (product.specifications) {
        Object.entries(product.specifications).forEach(([k, v]) => {
          if (!templateKeys.has(k) && v !== undefined && v !== null && v !== '') {
            extraList.push({ key: k, value: String(v) });
          }
        });
      }
      setCustomSpecs(extraList);
    }
  }, [product, categories, brands, templates]);

  const selectedCategoryObj = categories.find(c => c.id === formData.categoryId);
  const matchedTemplate = templates.find(
    t => t.id === formData.categoryId || t.categorySlug === selectedCategoryObj?.slug || t.name === formData.category
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

  const toggleSpecHighlight = (key: string) => {
    setSpecHighlights(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleAddCustomSpec = () => {
    setCustomSpecs(prev => [...prev, { key: '', value: '', highlight: false }]);
  };

  const handleRemoveCustomSpec = (idx: number) => {
    setCustomSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCustomSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
    setCustomSpecs(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleAddGalleryImage = (url: string) => {
    if (!url.trim()) return;
    setGalleryImages(prev => [...prev, { url: url.trim(), altText: formData.name || '' }]);
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveGalleryImage = (idx: number, direction: 'up' | 'down') => {
    setGalleryImages(prev => {
      const next = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleUploadGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setGalleryUploadError('Invalid format: PNG, JPG, WebP, or SVG accepted.');
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGalleryUploadError('File exceeds 5 MB limit.');
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }
    setIsUploadingGallery(true);
    setGalleryUploadError(null);
    try {
      const uploaded = await mediaService.uploadMedia(file);
      if (uploaded && uploaded.url) {
        handleAddGalleryImage(uploaded.url);
      }
    } catch (err: any) {
      setGalleryUploadError(err.message || 'Image upload failed');
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  const handleSetPrimaryFromGallery = (url: string) => {
    setFormData(prev => ({ ...prev, primaryImage: url }));
  };

  const handleAddDocument = () => {
    setDocuments(prev => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        title: 'Product Datasheet (PDF)',
        type: 'datasheet',
        url: ''
      }
    ]);
  };

  const handleRemoveDocument = (idx: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDocumentChange = (idx: number, field: keyof ProductDocument, val: string) => {
    setDocuments(prev => prev.map((doc, i) => i === idx ? { ...doc, [field]: val } : doc));
  };

  const handleMediaSelect = (url: string) => {
    if (pickerTarget === 'primary') {
      setFormData(prev => ({ ...prev, primaryImage: url }));
    } else {
      handleAddGalleryImage(url);
    }
  };

  const handleAutoGenerateSlug = () => {
    const base = `${formData.name || ''} ${formData.modelNumber || ''}`.trim();
    if (!base) return;
    const clean = base
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({ ...prev, slug: clean }));
  };

  const isTransparentCandidate = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.webp');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim()) {
      setError('Product title is required.');
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

    const rawRegPrice = formData.pricing?.regularPrice;
    const rawSalePrice = formData.pricing?.salePrice;
    const regPrice = rawRegPrice !== undefined && rawRegPrice !== ('' as any) ? Number(rawRegPrice) : undefined;
    const salePrice = rawSalePrice !== undefined && rawSalePrice !== ('' as any) ? Number(rawSalePrice) : undefined;
    const rawStock = formData.inventory?.available;
    const stockQty = rawStock !== undefined && rawStock !== ('' as any) ? Number(rawStock) : undefined;

    if (regPrice !== undefined && (isNaN(regPrice) || regPrice < 0)) {
      setError('Regular price cannot be negative.');
      return;
    }
    if (salePrice !== undefined && (isNaN(salePrice) || salePrice < 0)) {
      setError('Sale price cannot be negative.');
      return;
    }
    if (salePrice !== undefined && regPrice !== undefined && salePrice >= regPrice) {
      setError('Sale promotional price must be strictly lower than regular price.');
      return;
    }
    if (stockQty !== undefined && (isNaN(stockQty) || stockQty < 0)) {
      setError('Available stock quantity cannot be negative.');
      return;
    }

    // Combine template specs and custom specs
    const combinedSpecs: Record<string, any> = { ...specs };
    customSpecs.forEach(({ key, value }) => {
      if (key.trim()) {
        combinedSpecs[key.trim()] = value.trim();
      }
    });

    // Parse features from lines
    const parsedFeatures = keyFeaturesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Parse keywords
    const parsedKeywords = keywordsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const galleryUrls = galleryImages.map(g => g.url);

    // Generate or clean slug
    const finalSlug = (formData.slug?.trim() || `${formData.name || ''}-${formData.modelNumber || ''}`)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const payload: Partial<Product> = {
      ...formData,
      slug: finalSlug,
      keyFeatures: parsedFeatures,
      specifications: combinedSpecs,
      images: galleryUrls,
      galleryItems: galleryImages,
      documents: documents.filter(d => d.url.trim().length > 0),
      pricing: {
        currency: 'BDT',
        regularPrice: regPrice,
        salePrice: salePrice,
        wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
        costPrice: canReadCost && formData.costPrice ? Number(formData.costPrice) : undefined,
        saleStartDate: formData.pricing?.saleStartDate || undefined,
        saleEndDate: formData.pricing?.saleEndDate || undefined
      },
      wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
      costPrice: canReadCost && formData.costPrice ? Number(formData.costPrice) : undefined,
      inventory: {
        available: Number(formData.inventory?.available || 0),
        lowStockThreshold: Number(formData.inventory?.lowStockThreshold || 5),
        allowBackorder: !!formData.inventory?.allowBackorder,
        warehouseId: formData.inventory?.warehouseId || 'main',
        status: formData.inventory?.status || 'in_stock'
      },
      seo: {
        ...(product?.seo || {}),
        metaTitle: seo.metaTitle?.trim() || undefined,
        metaDescription: seo.metaDescription?.trim() || undefined,
        keywords: parsedKeywords.length > 0 ? parsedKeywords : undefined,
        canonicalUrl: seo.canonicalUrl?.trim() || undefined
      }
    };

    setIsSaving(true);
    try {
      if (product?.id) {
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
        theme="dark"
        title={
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F15A24]/10 border border-[#F15A24]/20 flex items-center justify-center text-[#F15A24] shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-black font-heading text-white tracking-tight">
                {product?.id ? `Edit Hardware Asset: ${product.name}` : 'Add New Security Hardware Product'}
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                Phase 2 Multi-tier Pricing, Warehouse Location & Barcode Engine
              </div>
            </div>
          </div>
        }
        maxWidth="max-w-5xl"
      >
        <div className="text-slate-200 max-h-[84vh] flex flex-col">
          {error && (
            <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center justify-between">
              <span className="font-medium">{error}</span>
              <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Navigation Pill Grid: Strict Zero Horizontal Scroll */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-4 shrink-0 text-xs font-bold">
            {[
              { id: 'basics', label: '1. Identity', icon: Tag },
              { id: 'pricing', label: '2. Pricing', icon: Percent },
              { id: 'inventory', label: '3. Stock & ERP', icon: Sliders },
              { id: 'media', label: '4. Media PNG', icon: ImageIcon },
              { id: 'specs', label: '5. Specs', icon: Wrench },
              { id: 'descriptions', label: '6. Features', icon: FileText },
              { id: 'seo', label: '7. SEO SERP', icon: Globe },
              { id: 'relations', label: '8. Packages', icon: Layers }
            ].map(t => {
              const Icon = t.icon;
              const isCur = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all ${
                    isCur
                      ? 'bg-[#F15A24] text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6">
            {/* TAB 1: BASICS & IDENTIFIERS */}
            {activeTab === 'basics' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Identity</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1">Product Title *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Hikvision 2MP Fixed Bullet Turbo HD Camera"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24] font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Model Number *</label>
                      <input
                        type="text"
                        value={formData.modelNumber || ''}
                        onChange={e => setFormData({ ...formData, modelNumber: e.target.value })}
                        placeholder="e.g. DS-2CE16D0T-IRPF"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24] font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Slug with Auto-generate & preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300">URL Slug *</label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          /product/{formData.slug || 'url-slug'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="e.g. hikvision-2mp-fixed-bullet-turbo-hd"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24] font-mono"
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoGenerateSlug}
                        className="w-full text-xs flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#F15A24]" />
                        <span>Auto-generate Slug</span>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Short display name (max 36 characters)</label>
                    <input
                      type="text"
                      maxLength={36}
                      value={formData.shortName || ''}
                      onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                      placeholder={getShortDisplayName(formData.name || '') || 'e.g. Bullet Camera'}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Used on compact package cards. If empty, auto-derived: “{getShortDisplayName(formData.name || '') || '—'}”.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">SKU *</label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. HIK-2CE16D0T-IRPF"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-mono focus:outline-none focus:border-[#F15A24]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Brand *</label>
                      <select
                        value={formData.brandId || ''}
                        onChange={e => handleBrandChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-[#F15A24]"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Category *</label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={e => {
                          handleCategoryChange(e.target.value);
                          const catObj = categories.find(item => item.id === e.target.value);
                          const defaultSub = catObj?.subcategories?.[0];
                          setFormData(prev => ({
                            ...prev,
                            subcategoryId: defaultSub ? defaultSub.id : undefined,
                            subcategory: defaultSub ? defaultSub.name : undefined,
                            subcategorySlug: defaultSub ? defaultSub.slug : undefined
                          }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-[#F15A24]"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      {selectedCategoryObj?.subcategories && selectedCategoryObj.subcategories.length > 0 && (
                        <div className="mt-2">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">Subcategory</label>
                          <select
                            value={formData.subcategoryId || ''}
                            onChange={e => {
                              const sc = selectedCategoryObj.subcategories?.find(s => s.id === e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                subcategoryId: e.target.value || undefined,
                                subcategory: sc ? sc.name : undefined,
                                subcategorySlug: sc ? sc.slug : undefined
                              }));
                            }}
                            className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-medium focus:outline-none focus:border-[#F15A24]"
                          >
                            <option value="">-- General Category (None) --</option>
                            {selectedCategoryObj.subcategories.map(sc => (
                              <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Unit of Measure</label>
                      <select
                        value={formData.unit || 'Piece'}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                      >
                        <option value="Piece">Piece</option>
                        <option value="Meter">Meter</option>
                        <option value="Box">Box</option>
                        <option value="Set">Set</option>
                        <option value="Roll">Roll</option>
                        <option value="Pack">Pack</option>
                      </select>
                    </div>
                  </div>

                  {/* Barcode & Format */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Barcode / UPC / EAN</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const randomBarcode = `880${Math.floor(1000000000 + Math.random() * 9000000000)}`;
                            setFormData(prev => ({ ...prev, barcode: randomBarcode, barcodeFormat: prev.barcodeFormat || 'Code 128' }));
                          }}
                          className="text-[10px] text-[#F15A24] font-bold hover:underline flex items-center gap-0.5"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Auto-Generate</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="e.g. 8801234567890"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-mono focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Barcode Format</label>
                      <select
                        value={formData.barcodeFormat || 'Code 128'}
                        onChange={e => setFormData({ ...formData, barcodeFormat: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                      >
                        <option value="Code 128">Code 128 (Standard POS)</option>
                        <option value="EAN-13">EAN-13 (International)</option>
                        <option value="UPC-A">UPC-A (Retail)</option>
                        <option value="QR Code">QR Code</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      {formData.barcode ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Barcode Validated ({formData.barcodeFormat})</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No barcode assigned yet</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Channels */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lifecycle & Visibility</h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Publication Status</label>
                      <select
                        value={formData.status || 'active'}
                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
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
                      <label htmlFor="visibleToggle" className="text-xs font-bold text-slate-300 cursor-pointer">
                        Website Storefront
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="posToggle"
                        checked={formData.posAvailable !== false}
                        onChange={e => setFormData({ ...formData, posAvailable: e.target.checked })}
                        className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                      />
                      <label htmlFor="posToggle" className="text-xs font-bold text-slate-300 cursor-pointer">
                        POS / Physical Desk
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="homepageToggle"
                        checked={formData.showOnHomepage !== false}
                        onChange={e => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                        className="w-4 h-4 rounded text-[#F15A24] focus:ring-[#F15A24]"
                      />
                      <label htmlFor="homepageToggle" className="text-xs font-bold text-slate-300 cursor-pointer">
                        Show on Homepage
                      </label>
                    </div>
                  </div>

                  {/* Commercial Flags */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Merchandising Badges</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.isFeatured}
                          onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                          className="rounded text-[#F15A24]"
                        />
                        <span>Featured</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.isPopular}
                          onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                          className="rounded text-[#F15A24]"
                        />
                        <span>Best Seller</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.isNew}
                          onChange={e => setFormData({ ...formData, isNew: e.target.checked })}
                          className="rounded text-[#F15A24]"
                        />
                        <span>New Arrival</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.isHot}
                          onChange={e => setFormData({ ...formData, isHot: e.target.checked })}
                          className="rounded text-[#F15A24]"
                        />
                        <span>Hot / Trending</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.isAccessory}
                          onChange={e => setFormData({ ...formData, isAccessory: e.target.checked })}
                          className="rounded text-[#F15A24]"
                        />
                        <span>Accessory Only</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING & B2B */}
            {activeTab === 'pricing' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Commercial Pricing & Schedules</h3>
                  <span className="text-[10px] text-slate-400">Currency: BDT (৳)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Regular Retail Price (৳)
                      <span className="text-[10px] text-slate-400 font-normal block">Empty for "Request Quote"</span>
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
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#F15A24] text-[#F15A24]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Sale Promotional Price (৳)
                      <span className="text-[10px] text-slate-400 font-normal block">Must be &lt; Regular Price</span>
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
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#F15A24] text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Wholesale / B2B Price (৳)
                      <span className="text-[10px] text-slate-400 font-normal block">Dealer / Corporate tier</span>
                    </label>
                    <input
                      type="number"
                      value={formData.wholesalePrice ?? ''}
                      onChange={e => setFormData({
                        ...formData,
                        wholesalePrice: e.target.value ? Number(e.target.value) : undefined
                      })}
                      placeholder="e.g. 1750"
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#F15A24] text-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Purchase Cost (৳)</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Guarded</span>
                    </label>
                    {canReadCost ? (
                      <input
                        type="number"
                        value={formData.costPrice ?? ''}
                        onChange={e => setFormData({
                          ...formData,
                          costPrice: e.target.value ? Number(e.target.value) : undefined
                        })}
                        placeholder="e.g. 1400"
                        className="w-full bg-slate-900 border border-amber-500/40 text-amber-300 font-mono text-xs p-2.5 rounded-xl focus:outline-none focus:border-amber-400"
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 italic">
                        •••• (Redacted)
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 font-normal block mt-1">Requires <code>pricing.cost.read</code></span>
                  </div>
                </div>

                {/* Real-time Profit Margin Indicator */}
                {(() => {
                  const reg = Number(formData.pricing?.regularPrice || 0);
                  const cost = Number(formData.costPrice || formData.pricing?.costPrice || 0);
                  if (reg > 0 && cost > 0) {
                    const margin = reg - cost;
                    const pct = ((margin / reg) * 100).toFixed(1);
                    return (
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300">Gross Margin Estimation:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">Profit: ৳{margin.toLocaleString()}</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            Number(pct) >= 20 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {pct}% Gross Margin
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Promotional Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Sale Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.pricing?.saleStartDate || ''}
                      onChange={e => setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing!,
                          saleStartDate: e.target.value
                        }
                      })}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Sale End Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.pricing?.saleEndDate || ''}
                      onChange={e => setFormData({
                        ...formData,
                        pricing: {
                          ...formData.pricing!,
                          saleEndDate: e.target.value
                        }
                      })}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STOCK & INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory & Tracking Controls</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Available Quantity</label>
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
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      value={formData.inventory?.lowStockThreshold ?? 5}
                      onChange={e => setFormData({
                        ...formData,
                        inventory: {
                          ...formData.inventory!,
                          lowStockThreshold: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Stock Status</label>
                    <select
                      value={formData.inventory?.status || 'in_stock'}
                      onChange={e => setFormData({
                        ...formData,
                        inventory: {
                          ...formData.inventory!,
                          status: e.target.value as any
                        }
                      })}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre-Order</option>
                      <option value="request_quote">Request Quote</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Default Warehouse</label>
                    <select
                      value={formData.inventory?.warehouseId || 'main'}
                      onChange={e => setFormData({
                        ...formData,
                        inventory: {
                          ...formData.inventory!,
                          warehouseId: e.target.value
                        }
                      })}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    >
                      <option value="main">Main Warehouse (Dhaka Central)</option>
                      <option value="depot-chittagong">Chittagong Distribution Depot</option>
                      <option value="depot-sylhet">Sylhet Regional Depot</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Shelf Location (Rack / Bin)</label>
                    <input
                      type="text"
                      value={formData.inventory?.shelfLocation || ''}
                      onChange={e => setFormData({
                        ...formData,
                        inventory: {
                          ...formData.inventory!,
                          shelfLocation: e.target.value
                        }
                      })}
                      placeholder="e.g. Rack A-02 / Bin 04"
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-mono focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>
                </div>

                {/* Phase 2 ERP Serial & Batch Tracking */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Phase 2 ERP Tracking Capabilities</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.inventory?.allowBackorder}
                        onChange={e => setFormData({
                          ...formData,
                          inventory: {
                            ...formData.inventory!,
                            allowBackorder: e.target.checked
                          }
                        })}
                        className="rounded text-[#F15A24]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Allow Backorders</div>
                        <div className="text-[10px] text-slate-400">Accept checkout when stock reaches 0</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.serialTracking}
                        onChange={e => setFormData({ ...formData, serialTracking: e.target.checked })}
                        className="rounded text-[#F15A24]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Serial Tracking</div>
                        <div className="text-[10px] text-slate-400">Enforce serial numbers on dispatch</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.batchTracking}
                        onChange={e => setFormData({ ...formData, batchTracking: e.target.checked })}
                        className="rounded text-[#F15A24]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Batch / Lot Tracking</div>
                        <div className="text-[10px] text-slate-400">Track shipment batches & manufacturing dates</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MEDIA & TRANSPARENT PNG */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                {/* Primary Image with Alpha Checker & ImagePickerField */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Product Photography</h3>
                    <p className="text-[11px] text-slate-400">Used across storefront catalog rows, search suggestions, and hero presentations</p>
                  </div>
                  <ImagePickerField
                    value={formData.primaryImage || ''}
                    onChange={url => setFormData(prev => ({ ...prev, primaryImage: url }))}
                    placeholder="/uploads/filename.png or /images/hero/..."
                    helperText="Transparent PNG or WebP with no background is recommended for clean card floating."
                    theme="light"
                    required
                    modalTitle="Select Primary Product Photography"
                  />
                </div>

                {/* Gallery Manager */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Gallery (Multi-angle Views)</h3>
                      <p className="text-[11px] text-slate-400">Reorder views, assign captions, upload new photos, or designate primary</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPickerTarget('gallery');
                          setMediaPickerOpen(true);
                        }}
                      >
                        <ImageIcon className="w-3.5 h-3.5 mr-1 text-[#F15A24]" />
                        <span>Add from Library</span>
                      </Button>

                      <input
                        ref={galleryFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleUploadGalleryFile}
                        className="hidden"
                        disabled={isUploadingGallery}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingGallery}
                        onClick={() => galleryFileInputRef.current?.click()}
                      >
                        {isUploadingGallery ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin text-[#F15A24]" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5 mr-1 text-[#F15A24]" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {galleryUploadError && (
                    <div className="p-2 bg-rose-50 border border-rose-300 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{galleryUploadError}</span>
                    </div>
                  )}

                  {/* Quick URL Input for Gallery */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={galleryUrlInput}
                      onChange={e => setGalleryUrlInput(e.target.value)}
                      placeholder="Paste image URL to append to gallery..."
                      className="flex-1 bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]-lg font-mono"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (galleryUrlInput.trim()) {
                            handleAddGalleryImage(galleryUrlInput);
                            setGalleryUrlInput('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (galleryUrlInput.trim()) {
                          handleAddGalleryImage(galleryUrlInput);
                          setGalleryUrlInput('');
                        }
                      }}
                      disabled={!galleryUrlInput.trim()}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Add URL</span>
                    </Button>
                  </div>

                  {galleryImages.length > 0 ? (
                    <div className="space-y-2">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg">
                          <img src={img.url} alt="" className="w-12 h-12 object-contain rounded bg-slate-50 p-1 border" />
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={img.altText || ''}
                              onChange={e => {
                                const next = [...galleryImages];
                                next[idx] = { ...next[idx], altText: e.target.value };
                                setGalleryImages(next);
                              }}
                              placeholder="Alt text (for accessibility and SEO)"
                              className="bg-slate-50 border border-slate-200 text-xs p-1.5 rounded"
                            />
                            <input
                              type="text"
                              value={img.caption || ''}
                              onChange={e => {
                                const next = [...galleryImages];
                                next[idx] = { ...next[idx], caption: e.target.value };
                                setGalleryImages(next);
                              }}
                              placeholder="Caption (e.g. Rear Port Panel)"
                              className="bg-slate-50 border border-slate-200 text-xs p-1.5 rounded"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryFromGallery(img.url)}
                              className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-colors ${
                                formData.primaryImage === img.url
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                              title={formData.primaryImage === img.url ? 'Current Primary Image' : 'Set as Primary Image'}
                            >
                              <Star className={`w-3 h-3 ${formData.primaryImage === img.url ? 'fill-current' : ''}`} />
                              <span>{formData.primaryImage === img.url ? 'Primary' : 'Make Primary'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveGalleryImage(idx, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-300 disabled:opacity-30"
                              title="Move Left"
                            >
                              <ArrowUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === galleryImages.length - 1}
                              onClick={() => handleMoveGalleryImage(idx, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-300 disabled:opacity-30"
                              title="Move Right"
                            >
                              <ArrowDown className="w-3.5 h-3.5 rotate-[-90deg]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400">
                      No gallery images added yet. Click above to add additional angles.
                    </div>
                  )}
                </div>

                {/* Documents & PDF Datasheets */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Downloadable Technical Documents</h3>
                      <p className="text-[11px] text-slate-400">Datasheets, user manuals, and warranty cards for client downloads</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDocument}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Add Document</span>
                    </Button>
                  </div>

                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc, idx) => (
                        <div key={doc.id || idx} className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                          <input
                            type="text"
                            value={doc.title}
                            onChange={e => handleDocumentChange(idx, 'title', e.target.value)}
                            placeholder="Document Title (e.g. Technical Datasheet PDF)"
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs p-1.5 rounded font-medium"
                          />
                          <select
                            value={doc.type}
                            onChange={e => handleDocumentChange(idx, 'type', e.target.value as any)}
                            className="bg-slate-50 border border-slate-200 text-xs p-1.5 rounded"
                          >
                            <option value="datasheet">Datasheet</option>
                            <option value="user_manual">User Manual</option>
                            <option value="firmware">Firmware</option>
                            <option value="quick_start_guide">Quick Start</option>
                            <option value="warranty_card">Warranty Card</option>
                          </select>
                          <input
                            type="text"
                            value={doc.url}
                            onChange={e => handleDocumentChange(idx, 'url', e.target.value)}
                            placeholder="/uploads/datasheet.pdf or URL"
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs p-1.5 rounded font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed border-slate-300 rounded-lg text-xs text-slate-400">
                      No documents attached. Customers can view PDF downloads on the product page when provided.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: SPECIFICATIONS */}
            {activeTab === 'specs' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Technical Specifications</h3>
                    {matchedTemplate ? (
                      <p className="text-[10px] text-slate-500">
                        Template: <strong>{matchedTemplate.name}</strong> ({matchedTemplate.fields.length} dynamic attributes)
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-600">
                        No template assigned to "{formData.category}". You can specify custom attributes below.
                      </p>
                    )}
                  </div>
                </div>

                {/* Render Template Fields */}
                {matchedTemplate && matchedTemplate.fields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    {matchedTemplate.fields.map(field => {
                      const currentValue = specs[field.key] ?? '';
                      const isHighlighted = specHighlights.includes(field.key);

                      return (
                        <div key={field.id} className="space-y-1 p-2 rounded-lg bg-slate-50/60 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300">
                              {field.name}
                              {field.unit && <span className="text-slate-400 font-normal ml-1">({field.unit})</span>}
                              {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleSpecHighlight(field.key)}
                                className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                                  isHighlighted ? 'bg-orange-500 text-white font-bold' : 'bg-slate-200 text-slate-600'
                                }`}
                                title="Toggle highlight on product cards"
                              >
                                {isHighlighted ? 'Highlighted' : 'Highlight'}
                              </button>
                              {field.filterable && (
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">Filter</span>
                              )}
                            </div>
                          </div>

                          {field.type === 'enum' && field.options && field.options.length > 0 ? (
                            <select
                              value={String(currentValue)}
                              onChange={e => handleSpecFieldChange(field.key, e.target.value)}
                              className="w-full bg-white border border-slate-300 text-xs p-1.5 rounded"
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
                              className="w-full bg-white border border-slate-300 text-xs p-1.5 rounded"
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
                              placeholder="e.g. 4"
                              className="w-full bg-white border border-slate-300 text-xs p-1.5 rounded"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(currentValue)}
                              onChange={e => handleSpecFieldChange(field.key, e.target.value)}
                              placeholder={`Enter ${field.name.toLowerCase()}...`}
                              className="w-full bg-white border border-slate-300 text-xs p-1.5 rounded"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom Extra Specs */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Custom / Ad-hoc Specifications</label>
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
                        placeholder="Key (e.g. Ingress Protection)"
                        className="flex-1 bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={e => handleCustomSpecChange(idx, 'value', e.target.value)}
                        placeholder="Value (e.g. IP67 Weatherproof)"
                        className="flex-1 bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
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
            )}

            {/* TAB 6: DESCRIPTIONS & WARRANTY */}
            {activeTab === 'descriptions' && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Marketing Descriptions</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Short Description (Summary)</label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription || ''}
                      onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="One or two sentences summarizing the product for listing cards..."
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]-lg"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Key Features (One bullet per line)</label>
                    <textarea
                      rows={4}
                      value={keyFeaturesText}
                      onChange={e => setKeyFeaturesText(e.target.value)}
                      placeholder="2 MP high performance CMOS sensor&#10;1920 × 1080 resolution&#10;Up to 20m IR distance&#10;IP66 weatherproof casing"
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Full Detailed Product Description</label>
                    <textarea
                      rows={5}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Comprehensive product details, operational tolerances, and technical overview..."
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]-lg"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Warranty Policy & Terms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Warranty Period (Months)</label>
                      <input
                        type="number"
                        value={formData.warrantyMonths ?? 12}
                        onChange={e => setFormData({ ...formData, warrantyMonths: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-bold focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Warranty Type</label>
                      <select
                        value={formData.warrantyType || 'official'}
                        onChange={e => setFormData({ ...formData, warrantyType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                      >
                        <option value="official">Official Brand Warranty</option>
                        <option value="vendor">Vendor / Importer Warranty</option>
                        <option value="replacement">Direct Replacement Warranty</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Warranty Description Note</label>
                      <input
                        type="text"
                        value={formData.warrantyText || ''}
                        onChange={e => setFormData({ ...formData, warrantyText: e.target.value })}
                        placeholder="e.g. 1 Year Official Brand Warranty"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SEO & SERP */}
            {activeTab === 'seo' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#F15A24]" />
                    <span>Search Engine Optimization & SERP Preview</span>
                  </h3>
                </div>

                {/* Google SERP Preview Card */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xs">
                  <div className="text-[10px] text-slate-400 font-mono">Google Search Preview</div>
                  <div className="text-blue-700 font-medium text-sm hover:underline cursor-pointer truncate">
                    {seo.metaTitle || formData.name || 'CamneX Security Hardware'}
                  </div>
                  <div className="text-emerald-700 text-xs font-mono truncate">
                    https://camnexbd.com/product/{formData.slug || 'product-slug'}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {seo.metaDescription || formData.shortDescription || 'Genuine security and networking hardware in Bangladesh with official manufacturer warranty.'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Meta Title</label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(seo.metaTitle || '').length}/60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={70}
                      value={seo.metaTitle || ''}
                      onChange={e => setSeo({ ...seo, metaTitle: e.target.value })}
                      placeholder={formData.name || 'e.g. Hikvision 2MP Turbo HD Bullet Camera | CamneX BD'}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Meta Description</label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(seo.metaDescription || '').length}/160 chars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={180}
                      value={seo.metaDescription || ''}
                      onChange={e => setSeo({ ...seo, metaDescription: e.target.value })}
                      placeholder={formData.shortDescription || 'Enter search engine snippet description...'}
                      className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Keywords (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={keywordsText}
                        onChange={e => setKeywordsText(e.target.value)}
                        placeholder="cctv camera, 2mp bullet, hikvision dhaka"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Canonical URL Override (Optional)
                      </label>
                      <input
                        type="text"
                        value={seo.canonicalUrl || ''}
                        onChange={e => setSeo({ ...seo, canonicalUrl: e.target.value })}
                        placeholder="/product/ds-2ce16d0t-irpf"
                        className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs p-2.5 rounded-xl font-mono focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: CCTV PACKAGES & RELATIONS */}
            {activeTab === 'relations' && (
              <div className="space-y-4">
                {/* CCTV Turnkey Package Compatibility */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">CCTV Package Component Eligibility</h3>
                      <p className="text-[11px] text-slate-400">Controls whether this product can be selected in Package Builder BOMs</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.packageEligible !== false}
                        onChange={e => setFormData({ ...formData, packageEligible: e.target.checked })}
                        className="rounded text-[#F15A24]"
                      />
                      <span className="text-xs font-bold text-slate-800">Eligible in Packages</span>
                    </label>
                  </div>

                  {formData.packageEligible !== false && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-bold text-slate-600 block mb-2">Supported Turnkey Roles</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { role: 'camera', label: 'Camera Unit' },
                          { role: 'recorder', label: 'Recorder (DVR/NVR)' },
                          { role: 'storage', label: 'Storage (Hard Drive)' },
                          { role: 'cable', label: 'Video / Coaxial Cable' },
                          { role: 'power', label: 'Power Supply / Adapter' },
                          { role: 'connectors', label: 'BNC / DC Connectors' },
                          { role: 'accessory', label: 'Package Accessory' }
                        ].map(item => {
                          const isChecked = (formData.packageRoles || []).includes(item.role as any);
                          return (
                            <label key={item.role} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const currentRoles = formData.packageRoles || [];
                                  const nextRoles = e.target.checked
                                    ? [...currentRoles, item.role as any]
                                    : currentRoles.filter(r => r !== item.role);
                                  setFormData({ ...formData, packageRoles: nextRoles });
                                }}
                                className="rounded text-[#F15A24]"
                              />
                              <span className="text-slate-300 font-medium">{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Related & Compatible Products */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cross-Sell & Compatibility</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Related Alternative Products
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(Shown on PDP "Alternative Choices")</span>
                    </label>
                    <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg p-2 space-y-1">
                      {allProducts.filter(p => p.id !== product?.id).map(p => {
                        const isSelected = (formData.relatedProductIds || []).includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-xs p-1 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const list = formData.relatedProductIds || [];
                                setFormData({
                                  ...formData,
                                  relatedProductIds: e.target.checked ? [...list, p.id] : list.filter(id => id !== p.id)
                                });
                              }}
                              className="rounded text-[#F15A24]"
                            />
                            <span className="font-medium text-slate-800">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({p.modelNumber})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Compatible Accessories
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(Shown on PDP "Frequently Bought Together")</span>
                    </label>
                    <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg p-2 space-y-1">
                      {allProducts.filter(p => p.id !== product?.id).map(p => {
                        const isSelected = (formData.compatibleProductIds || []).includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-xs p-1 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                const list = formData.compatibleProductIds || [];
                                setFormData({
                                  ...formData,
                                  compatibleProductIds: e.target.checked ? [...list, p.id] : list.filter(id => id !== p.id)
                                });
                              }}
                              className="rounded text-[#F15A24]"
                            />
                            <span className="font-medium text-slate-800">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({p.modelNumber})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Footer Action Bar */}
            {/* Step Navigation & Action Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between shrink-0">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-white">
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {(() => {
                  const tabOrder: Array<'basics' | 'pricing' | 'inventory' | 'media' | 'specs' | 'descriptions' | 'seo' | 'relations'> = [
                    'basics', 'pricing', 'inventory', 'media', 'specs', 'descriptions', 'seo', 'relations'
                  ];
                  const curIdx = tabOrder.indexOf(activeTab);
                  return (
                    <>
                      {curIdx > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab(tabOrder[curIdx - 1])}
                          className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          <span>Back</span>
                        </Button>
                      )}
                      {curIdx < tabOrder.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab(tabOrder[curIdx + 1])}
                          className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <span>Next Section</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </>
                  );
                })()}
                <Button type="submit" disabled={isSaving} className="bg-[#F15A24] text-white hover:bg-[#D94D1C] font-bold">
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>{isSaving ? 'Saving Changes...' : product?.id ? 'Update Product' : 'Create Product'}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
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
