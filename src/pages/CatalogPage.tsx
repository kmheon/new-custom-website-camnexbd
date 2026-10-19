import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Filter, SlidersHorizontal, ShoppingBag, X, ChevronDown, Check, ArrowRight, Layers, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { productService, categoryService, brandService, specTemplateService } from '../services';
import { Product, Category, Brand, SpecTemplate, SpecFacetGroup, ProductVariantOption } from '../types';
import { useCartStore, useCompareStore } from '../store';
import { getVariantGroupForProduct, hasProductVariants } from '../utils/productVariants';
import { SmartImage } from '../components/common/ImagePlaceholder';

interface CatalogPageProps {
  onNavigate: (route: string, param?: string) => void;
  categorySlug?: string;
  brandSlug?: string;
}

interface ExpandableFilterListProps {
  groupKey: string;
  options: { label: string; value: string; count?: number }[];
  selectedValues: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleOption: (value: string) => void;
  testIdPrefix: string;
  isMobile?: boolean;
}

export const ExpandableFilterList: React.FC<ExpandableFilterListProps> = ({
  groupKey,
  options,
  selectedValues,
  isExpanded,
  onToggleExpand,
  onToggleOption,
  testIdPrefix,
  isMobile = false
}) => {
  const visibleOptions = useMemo(() => {
    if (options.length <= 5 || isExpanded) {
      return options;
    }
    // First 5 options, plus any selected options beyond the first 5
    return options.filter((opt, idx) => idx < 5 || selectedValues.includes(opt.value));
  }, [options, isExpanded, selectedValues]);

  const hasMore = options.length > 5;
  const remainingCount = options.length - 5;

  if (isMobile) {
    return (
      <div className="space-y-1.5 pt-1.5" data-testid={`expandable-filter-list-${groupKey}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {visibleOptions.map((opt) => {
            const isChecked = selectedValues.includes(opt.value);
            return (
              <button
                key={`m-${groupKey}-${opt.value}`}
                type="button"
                data-testid={`mobile-${testIdPrefix}-${opt.value}`}
                onClick={() => onToggleOption(opt.value)}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between border transition-colors cursor-pointer ${
                  isChecked
                    ? 'bg-orange-50 border-[#F15A24] text-[#F15A24] font-bold'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isChecked
                        ? 'bg-[#F15A24] border-[#F15A24] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </div>
                {typeof opt.count === 'number' && (
                  <span className={`text-[10px] font-mono shrink-0 ml-1 ${isChecked ? 'text-[#F15A24]' : 'text-slate-400'}`}>
                    ({opt.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {hasMore && (
          <button
            type="button"
            data-testid={isExpanded ? `mobile-show-less-btn-${groupKey}` : `mobile-show-more-btn-${groupKey}`}
            onClick={onToggleExpand}
            className="w-full text-center py-1.5 px-3 rounded-lg text-xs font-bold text-[#F15A24] hover:bg-orange-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <span>Show less</span>
            ) : (
              <span>Show more ({remainingCount})</span>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 pt-1.5" data-testid={`expandable-filter-list-${groupKey}`}>
      {visibleOptions.map((opt) => {
        const isChecked = selectedValues.includes(opt.value);
        return (
          <button
            key={`${groupKey}-${opt.value}`}
            type="button"
            data-testid={`${testIdPrefix}-${opt.value}`}
            onClick={() => onToggleOption(opt.value)}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
              isChecked
                ? 'bg-orange-50 text-[#F15A24] font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  isChecked
                    ? 'bg-[#F15A24] border-[#F15A24] text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span className="truncate">{opt.label}</span>
            </div>
            {typeof opt.count === 'number' && (
              <span className={`text-[11px] font-mono shrink-0 ml-1.5 ${isChecked ? 'text-[#F15A24]' : 'text-slate-400'}`}>
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
      {hasMore && (
        <button
          type="button"
          data-testid={isExpanded ? `show-less-btn-${groupKey}` : `show-more-btn-${groupKey}`}
          onClick={onToggleExpand}
          className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1 px-2 pt-1 cursor-pointer"
        >
          {isExpanded ? (
            <span>Show less</span>
          ) : (
            <span>Show more ({remainingCount})</span>
          )}
        </button>
      )}
    </div>
  );
};

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onNavigate,
  categorySlug,
  brandSlug
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [specFacets, setSpecFacets] = useState<SpecFacetGroup[]>([]);
  
  // Pagination & Display Controls State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(24);
  const [totalPages, setTotalPages] = useState<number>(1);
  const gridTopRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    if (brandSlug) return [brandSlug];
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const brandsParam = urlParams.get('brands');
      if (brandsParam) return brandsParam.split(',').map(s => s.trim()).filter(Boolean);
      const brandParam = urlParams.get('brand');
      if (brandParam) return [brandParam.trim()];
    } catch (_) {}
    return [];
  });
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'name_asc'>('popular');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Card Variant and Buy State
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addingStatus, setAddingStatus] = useState<Record<string, 'idle' | 'loading' | 'added' | 'error'>>({});
  const [variantCache, setVariantCache] = useState<Record<string, ProductVariantOption[]>>({});

  const addItemToCart = useCartStore((s) => s.addItem);
  const compareProductIds = useCompareStore((s) => s.productIds);
  const addToCompare = useCompareStore((s) => s.addProduct);
  const removeFromCompare = useCompareStore((s) => s.removeProduct);
  const isInCompare = (id: string) => compareProductIds.includes(id);

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
    brandService.getBrands().then(setBrands);
  }, []);

  useEffect(() => {
    if (brandSlug) {
      setSelectedBrands(prev => (prev.includes(brandSlug) ? prev : [...prev, brandSlug]));
      brandService.getBrandBySlug(brandSlug).then(setCurrentBrand);
    } else {
      setCurrentBrand(null);
    }
  }, [brandSlug]);

  useEffect(() => {
    setSelectedSpecs({});
    setCurrentPage(1);
    const cleanCategorySlug = (categorySlug || '').split('?')[0];
    const subcatParam = new URLSearchParams(categorySlug?.includes('?') ? categorySlug.split('?')[1] : window.location.search).get('subcat');

    if (cleanCategorySlug) {
      categoryService.getCategoryBySlug(cleanCategorySlug).then(cat => {
        setCurrentCategory(cat);
        const targetSlug = cat?.slug || cleanCategorySlug;
        if (productService.getCategoryFacets) {
          productService.getCategoryFacets(targetSlug, subcatParam || undefined).then(res => {
            setSpecFacets(res.facets || []);
          });
        }
      });
    } else {
      setCurrentCategory(null);
      setSpecFacets([]);
    }
  }, [categorySlug]);

  const toggleExpandGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBrandToggle = (slug: string) => {
    setCurrentPage(1);
    setSelectedBrands(prev => {
      const exists = prev.includes(slug);
      return exists ? prev.filter(s => s !== slug) : [...prev, slug];
    });
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const cleanCategorySlug = (categorySlug || '').split('?')[0];
      const subcatParam = new URLSearchParams(categorySlug?.includes('?') ? categorySlug.split('?')[1] : window.location.search).get('subcat');
      const limitParam = pageSize === 'all' ? 1000 : pageSize;
      const res = await productService.getProducts({
        categorySlug: cleanCategorySlug,
        brandSlug: selectedBrands.length === 1 ? selectedBrands[0] : (selectedBrands.length === 0 ? brandSlug : undefined),
        brands: selectedBrands.length > 0 ? selectedBrands : (brandSlug ? [brandSlug] : undefined),
        subcat: subcatParam && subcatParam !== 'all' ? subcatParam : undefined,
        subcategory: subcatParam && subcatParam !== 'all' ? subcatParam : undefined,
        specFilters: selectedSpecs,
        sortBy,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        page: currentPage,
        limit: limitParam
      });
      let items = res.items || [];
      if (subcatParam && subcatParam !== 'all') {
        const norm = subcatParam.toLowerCase();
        items = items.filter(p => {
          if (p.subcategoryId && (p.subcategoryId === norm || p.subcategoryId === `subcat-${norm}`)) return true;
          return p.subcategorySlug === norm ||
            (norm.includes('doorbell') && p.subcategoryId === 'subcat-video-doorbells') ||
            (norm.includes('camera') && p.subcategoryId === 'subcat-wifi-cameras') ||
            (norm.includes('light') && p.subcategoryId === 'subcat-smart-lights') ||
            (norm.includes('plug') && p.subcategoryId === 'subcat-smart-plugs') ||
            (norm.includes('lock') && p.subcategoryId === 'subcat-smart-locks');
        });
      }
      setProducts(items);
      const computedTotal = subcatParam && subcatParam !== 'all' ? items.length : res.total;
      setTotalProducts(computedTotal);
      const pagesCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(computedTotal / (pageSize as number)));
      setTotalPages(pagesCount);
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug, brandSlug, selectedBrands, selectedSpecs, sortBy, priceRange, currentPage, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleBuyProduct = async (prod: Product) => {
    const varGroup = getVariantGroupForProduct(prod.id);
    const isVariable = Boolean(varGroup && varGroup.variants.length > 1);
    const selectedVariantId = selectedVariants[prod.id];

    // If variable product and no variant selected, open existing product detail page
    if (isVariable && !selectedVariantId) {
      onNavigate('product', prod.id);
      return;
    }

    // Guard against repeated rapid clicks
    if (addingStatus[prod.id] === 'loading' || addingStatus[prod.id] === 'added') {
      return;
    }

    let targetProduct: Product = prod;
    if (isVariable && selectedVariantId && selectedVariantId !== prod.id) {
      setAddingStatus(prev => ({ ...prev, [prod.id]: 'loading' }));
      try {
        const fetched = await productService.getProductById(selectedVariantId);
        if (fetched) {
          targetProduct = fetched;
        }
      } catch (err) {
        console.error('Failed to fetch selected variant:', err);
      }
    }

    // Validate stock
    const isOutOfStock = Boolean(
      (targetProduct.inventory && (targetProduct.inventory.available <= 0 || targetProduct.inventory.status === 'out_of_stock')) ||
      (targetProduct.stock_quantity !== undefined && targetProduct.stock_quantity <= 0)
    );
    if (isOutOfStock) {
      setAddingStatus(prev => ({ ...prev, [prod.id]: 'error' }));
      setTimeout(() => {
        setAddingStatus(prev => ({ ...prev, [prod.id]: 'idle' }));
      }, 2000);
      return;
    }

    // Validate price
    const unitPrice = targetProduct.pricing?.salePrice || targetProduct.pricing?.regularPrice;
    if (!unitPrice || unitPrice <= 0) {
      onNavigate('quote', targetProduct.id);
      return;
    }

    try {
      setAddingStatus(prev => ({ ...prev, [prod.id]: 'loading' }));
      await addItemToCart(targetProduct, 1);
      setAddingStatus(prev => ({ ...prev, [prod.id]: 'added' }));
      setTimeout(() => {
        setAddingStatus(prev => ({ ...prev, [prod.id]: 'idle' }));
      }, 1800);
    } catch (err) {
      console.error('Failed to add product to cart:', err);
      setAddingStatus(prev => ({ ...prev, [prod.id]: 'error' }));
      setTimeout(() => {
        setAddingStatus(prev => ({ ...prev, [prod.id]: 'idle' }));
      }, 2000);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (totalPages && newPage > totalPages) || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      const yOffset = -90;
      const y = gridTopRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  const handleSpecToggle = (key: string, val: string) => {
    setCurrentPage(1);
    setSelectedSpecs(prev => {
      const current = prev[key] || [];
      const exists = current.includes(val);
      const next = exists ? current.filter(v => v !== val) : [...current, val];
      const updated = { ...prev };
      if (next.length === 0) {
        delete updated[key];
      } else {
        updated[key] = next;
      }
      return updated;
    });
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSpecs({});
    setPriceRange({});
    setCurrentPage(1);
    if (brandSlug && currentCategory) {
      onNavigate('category', currentCategory.slug);
    } else if (brandSlug) {
      onNavigate('catalog');
    }
  };

  const brandOptions = useMemo(() => {
    return brands.map(b => ({
      label: b.name,
      value: b.slug,
      count: b.productCount
    }));
  }, [brands]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const activeSpecFilterCount = Object.values(selectedSpecs).reduce((acc, arr) => acc + arr.length, 0);
  const hasActiveFilters = selectedBrands.length > 0 || activeSpecFilterCount > 0 || priceRange.min !== undefined || priceRange.max !== undefined;

  const pageTitle = currentCategory
    ? `${currentCategory.name} | CamneX Bangladesh`
    : currentBrand
    ? `${currentBrand.name} Security Hardware | CamneX Bangladesh`
    : 'Hardware Catalog | CamneX Bangladesh';

  const canonicalPath = currentCategory
    ? `/category/${currentCategory.slug}`
    : currentBrand
    ? `/brand/${currentBrand.slug}`
    : '/catalog';

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title={pageTitle}
        description={currentCategory?.description || currentBrand?.description || "Browse genuine surveillance and networking hardware."}
        canonicalPath={canonicalPath}
        noIndex={hasActiveFilters} // Prevent indexing faceted filter combinations
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={
            currentBrand
              ? [
                  { label: 'Home', onClick: () => onNavigate('home') },
                  { label: 'Brands', onClick: () => onNavigate('brands') },
                  { label: currentBrand.name }
                ]
              : [
                  { label: 'Home', onClick: () => onNavigate('home') },
                  { label: 'Catalog', onClick: () => onNavigate('catalog') },
                  ...(currentCategory ? [{ label: currentCategory.name }] : [])
                ]
          }
        />

        {/* Title & Introduction */}
        <div className="mb-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              {currentBrand && (
                <div className="h-14 w-28 sm:w-32 rounded-xl bg-[#FAF7F2] border border-[#EDE8E1] px-3 py-2 flex items-center justify-center shrink-0 overflow-hidden">
                  {currentBrand.logo && currentBrand.logo.trim() ? (
                    <img
                      src={currentBrand.logo}
                      alt={`${currentBrand.name} logo`}
                      className="max-h-9 max-w-full w-auto h-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-extrabold text-[#111827] font-heading text-center leading-tight">
                      {currentBrand.name}
                    </span>
                  )}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                    {currentCategory?.name || currentBrand?.name || 'All Surveillance & IT Hardware'}
                  </h1>
                  {currentBrand?.showBadge && currentBrand?.badgeText && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-[#F15A24] border border-orange-200/70">
                      {currentBrand.badgeText}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                  {currentCategory?.description || currentBrand?.description || 'Explore our verified catalog of genuine security cameras, digital recorders, network switches, and biometric access control devices with official warranties.'}
                </p>
              </div>
            </div>

            {currentBrand && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="back-to-brands-btn"
                  onClick={() => onNavigate('brands')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#F15A24] text-xs font-bold text-[#111827] hover:text-[#F15A24] bg-slate-50 hover:bg-orange-50/40 transition-colors"
                >
                  ← All Brands
                </button>
                <button
                  type="button"
                  data-testid="clear-brand-filter-btn"
                  onClick={() => onNavigate('catalog')}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-[#111827] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Brand Filter</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Catalog Main Layout (Sidebar Filters + Product Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[#F15A24]" />
                  <span>Faceted Filters</span>
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] font-bold text-[#F15A24] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories Filter List */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2 uppercase">
                  Categories
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => onNavigate('catalog')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !categorySlug && !brandSlug ? 'bg-orange-50 text-[#F15A24] font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onNavigate('category', cat.slug)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        categorySlug === cat.slug ? 'bg-orange-50 text-[#F15A24] font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands Filter List */}
              <div className="pt-4 border-t border-slate-100" data-testid="filter-group-brand">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5" data-testid="filter-group-header-brand">
                    <span>Manufacturers</span>
                    {selectedBrands.length > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F15A24] text-white text-[10px] font-black">
                        {selectedBrands.length}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedBrands.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedBrands([]); setCurrentPage(1); }}
                        className="text-[11px] font-bold text-slate-400 hover:text-[#F15A24] cursor-pointer"
                        title="Clear brand selections"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('brands')}
                      className="text-[11px] font-bold text-[#F15A24] hover:underline"
                    >
                      Directory →
                    </button>
                  </div>
                </div>

                <ExpandableFilterList
                  groupKey="brand"
                  options={brandOptions}
                  selectedValues={selectedBrands}
                  isExpanded={Boolean(expandedGroups['brand'])}
                  onToggleExpand={() => toggleExpandGroup('brand')}
                  onToggleOption={handleBrandToggle}
                  testIdPrefix="facet-brand"
                  isMobile={false}
                />
              </div>

              {/* Dynamic Category-Specific Specification Filters */}
              {specFacets.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-4" data-testid="dynamic-spec-filters">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#F15A24] flex items-center justify-between">
                    <span>Product Specifications</span>
                    {activeSpecFilterCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-500">
                        {activeSpecFilterCount} active
                      </span>
                    )}
                  </div>

                  {specFacets.map((facet) => {
                    const isCollapsed = Boolean(collapsedGroups[facet.key]);
                    const selectedInGroup = selectedSpecs[facet.key] || [];

                    return (
                      <div key={facet.key} className="pt-3 border-t border-slate-100 first:pt-0 first:border-t-0" data-testid={`filter-group-${facet.key}`}>
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(facet.key)}
                          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
                        >
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#F15A24] transition-colors" data-testid={`filter-group-header-${facet.key}`}>
                            <span>{facet.label}</span>
                            {selectedInGroup.length > 0 && (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F15A24] text-white text-[10px] font-black">
                                {selectedInGroup.length}
                              </span>
                            )}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>

                        {!isCollapsed && (
                          <ExpandableFilterList
                            groupKey={facet.key}
                            options={facet.options}
                            selectedValues={selectedInGroup}
                            isExpanded={Boolean(expandedGroups[facet.key])}
                            onToggleExpand={() => toggleExpandGroup(facet.key)}
                            onToggleOption={(val) => handleSpecToggle(facet.key, val)}
                            testIdPrefix={`facet-${facet.key}`}
                            isMobile={false}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* Product Grid Area (3-col) */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* Sorting & Result Counts Bar */}
            <div ref={gridTopRef} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-xs font-semibold text-slate-500" data-testid="results-count-text">
                {totalProducts === 0 ? (
                  'Showing 0 products'
                ) : pageSize === 'all' ? (
                  <>
                    Showing all <strong className="text-[#111827] font-bold">{totalProducts}</strong> verified products
                  </>
                ) : (
                  <>
                    Showing <strong className="text-[#111827] font-bold">{(currentPage - 1) * (pageSize as number) + 1}–{Math.min(currentPage * (pageSize as number), totalProducts)}</strong> of <strong className="text-[#111827] font-bold">{totalProducts}</strong> verified products
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeSpecFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#F15A24] text-white text-[10px] font-bold rounded-full">
                      {activeSpecFilterCount}
                    </span>
                  )}
                </button>

                {/* Per Page Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Show:</span>
                  <select
                    data-testid="products-per-page-select"
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                      setPageSize(val as any);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F15A24] cursor-pointer"
                  >
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={48}>48 per page</option>
                    <option value="all">All products</option>
                  </select>
                </div>

                {/* Sort By Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                  <select
                    data-testid="catalog-sort-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F15A24] cursor-pointer"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Alphabetical</option>
                  </select>
                </div>

                {/* Top Compact Pagination (when multiple pages exist) */}
                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200" data-testid="top-pagination">
                    <button
                      type="button"
                      data-testid="top-prev-page-btn"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#111827] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Previous Page"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 px-1 whitespace-nowrap">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      data-testid="top-next-page-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#111827] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Next Page"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {hasActiveFilters && (
              <div
                data-testid="active-filter-chips-bar"
                className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2"
              >
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-[#F15A24]" />
                  <span>Active Filters:</span>
                </span>

                {/* Brand chips if filtered */}
                {selectedBrands.map((bSlug) => {
                  const bObj = brands.find((b) => b.slug === bSlug || b.id === bSlug);
                  const bName = bObj?.name || (currentBrand?.slug === bSlug ? currentBrand.name : bSlug);
                  return (
                    <span
                      key={`active-brand-${bSlug}`}
                      data-testid={`active-chip-brand active-chip-brand-${bSlug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-[#F15A24] border border-orange-200"
                    >
                      <span>Brand: {bName}</span>
                      <button
                        type="button"
                        data-testid={`remove-brand-chip-${bSlug}`}
                        onClick={() => handleBrandToggle(bSlug)}
                        className="hover:text-red-600 ml-1 cursor-pointer"
                        title={`Remove Brand ${bName}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}

                {/* Dynamic spec chips */}
                {Object.entries(selectedSpecs).map(([key, vals]) => {
                  const facet = specFacets.find(f => f.key === key);
                  const groupLabel = facet?.label || key;
                  return vals.map(val => {
                    const opt = facet?.options.find(o => o.value === val);
                    const optLabel = opt?.label || val;
                    return (
                      <span
                        key={`${key}-${val}`}
                        data-testid={`active-chip-${key}-${val}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-[#111827] border border-slate-200 hover:border-slate-300"
                      >
                        <span className="text-slate-500">{groupLabel}:</span>
                        <span className="font-bold">{optLabel}</span>
                        <button
                          type="button"
                          onClick={() => handleSpecToggle(key, val)}
                          className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                          title={`Remove ${groupLabel}: ${optLabel}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  });
                })}

                {/* Price range chip */}
                {(priceRange.min !== undefined || priceRange.max !== undefined) && (
                  <span
                    data-testid="active-chip-price"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-[#111827] border border-slate-200"
                  >
                    <span>Price: ৳{priceRange.min ?? 0} - ৳{priceRange.max ?? 'Max'}</span>
                    <button
                      type="button"
                      onClick={() => setPriceRange({})}
                      className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  data-testid="clear-all-chips-btn"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-[#F15A24] hover:underline ml-auto flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse p-4" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => {
                  const varGroup = getVariantGroupForProduct(prod.id);
                  const isVariable = Boolean(varGroup && varGroup.variants.length > 1);
                  const selectedVariantId = selectedVariants[prod.id];
                  const activeVariant = isVariable && selectedVariantId
                    ? varGroup.variants.find(v => v.productId === selectedVariantId)
                    : null;
                  const activeOption = activeVariant && variantCache[prod.id]
                    ? variantCache[prod.id].find(o => o.productId === activeVariant.productId)
                    : null;

                  const isOutOfStock = Boolean(
                    (prod.inventory && (prod.inventory.available <= 0 || prod.inventory.status === 'out_of_stock')) ||
                    (prod.stock_quantity !== undefined && prod.stock_quantity <= 0)
                  );

                  const regularPrice = activeOption?.regularPrice ?? activeOption?.price ?? prod.pricing?.regularPrice;
                  const salePrice = activeOption?.salePrice ?? prod.pricing?.salePrice;
                  const hasPrice = typeof regularPrice === 'number' && regularPrice > 0;
                  const currentStatus = addingStatus[prod.id] || 'idle';

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Preview */}
                        <div
                          onClick={() => onNavigate('product', activeVariant?.productId || prod.id)}
                          className="h-48 rounded-xl overflow-hidden bg-slate-100 cursor-pointer mb-4 relative flex items-center justify-center"
                        >
                          <SmartImage
                            src={activeOption?.primaryImage || prod.primaryImage}
                            alt={prod.name}
                            category={prod.categoryId || prod.category}
                            name={prod.name}
                            model={activeVariant?.modelNumber || prod.modelNumber}
                            className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                            placeholderClassName="w-20 h-20"
                            placeholderContainerClassName="w-full h-full flex flex-col items-center justify-center bg-transparent p-4"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <Badge variant="dark">{prod.brand}</Badge>
                          </div>
                          {isOutOfStock && (
                            <div className="absolute top-2.5 right-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white shadow-xs">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Model & Name */}
                        <div className="text-xs font-mono text-slate-400 mb-1">
                          {activeVariant?.modelNumber || prod.modelNumber}
                        </div>
                        <h3
                          onClick={() => onNavigate('product', activeVariant?.productId || prod.id)}
                          className="font-bold text-base text-[#111827] hover:text-[#F15A24] cursor-pointer transition-colors font-heading mb-2 line-clamp-2"
                        >
                          {prod.name}
                        </h3>
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                          {prod.shortDescription}
                        </p>

                        {/* Variable Product Model / Variant Selector */}
                        {isVariable && varGroup && (
                          <div className="mb-4 pt-1 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                              <span>{varGroup.distinguishingFeatureLabel || 'Model Variant'}:</span>
                              {activeVariant && (
                                <span className="text-[10px] font-bold text-[#F15A24]">
                                  {activeVariant.modelNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5" data-testid={`variant-selector-${prod.id}`}>
                              {varGroup.variants.map((v) => {
                                const isSelected = selectedVariantId === v.productId;
                                return (
                                  <button
                                    key={v.productId}
                                    type="button"
                                    data-testid={`catalog-variant-${prod.id}-${v.productId}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedVariants(prev => ({
                                        ...prev,
                                        [prod.id]: isSelected ? '' : v.productId
                                      }));
                                      // Preload variant details if not cached
                                      if (!variantCache[prod.id] && productService.getProductVariants) {
                                        productService.getProductVariants(prod.id).then(vars => {
                                          if (vars) setVariantCache(c => ({ ...c, [prod.id]: vars }));
                                        });
                                      }
                                    }}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-orange-50 text-[#F15A24] border-[#F15A24] font-bold shadow-xs'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                  >
                                    {v.distinguishingSpec || v.modelNumber}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pricing & Actions */}
                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-baseline justify-between mb-3">
                          {hasPrice ? (
                            <div className="flex items-baseline gap-2">
                              {salePrice && salePrice < regularPrice! ? (
                                <>
                                  <div className="text-lg font-black text-[#F15A24] font-heading">
                                    ৳{salePrice.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-slate-400 line-through">
                                    ৳{regularPrice!.toLocaleString()}
                                  </div>
                                </>
                              ) : (
                                <div className="text-lg font-black text-[#F15A24] font-heading">
                                  {isVariable && !selectedVariantId ? 'From ' : ''}৳{regularPrice!.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-slate-500">
                              Request quotation
                            </div>
                          )}
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Warranty
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigate('product', activeVariant?.productId || prod.id)}
                            className="w-full py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                          >
                            Details
                          </button>

                          {isOutOfStock ? (
                            <button
                              type="button"
                              disabled
                              data-testid={`catalog-buy-${prod.id}`}
                              className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed text-center select-none"
                            >
                              Out of Stock
                            </button>
                          ) : !hasPrice ? (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`catalog-buy-${prod.id}`}
                              onClick={() => onNavigate('quote', prod.id)}
                            >
                              <span>Quote</span>
                            </Button>
                          ) : isVariable && !selectedVariantId ? (
                            <Button
                              size="sm"
                              data-testid={`catalog-buy-${prod.id}`}
                              onClick={() => handleBuyProduct(prod)}
                            >
                              <span>Select Model</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              data-testid={`catalog-buy-${prod.id}`}
                              onClick={() => handleBuyProduct(prod)}
                              disabled={currentStatus === 'loading'}
                              className={currentStatus === 'added' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                            >
                              {currentStatus === 'loading' ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  <span>Adding...</span>
                                </>
                              ) : currentStatus === 'added' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                                  <span>Buy</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Compare Checkbox / Action */}
                        <div className="pt-2 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              data-testid={`catalog-compare-${prod.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCompare(activeVariant?.productId || prod.id);
                              }}
                              className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                                isInCompare(activeVariant?.productId || prod.id)
                                  ? 'text-emerald-600 font-bold'
                                  : 'text-slate-400 hover:text-[#F15A24]'
                              }`}
                            >
                              {isInCompare(activeVariant?.productId || prod.id) ? '✓ Added to Compare' : '+ Compare Specs'}
                            </button>
                            {isInCompare(activeVariant?.productId || prod.id) && (
                              <button
                                type="button"
                                data-testid={`catalog-remove-compare-${prod.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCompare(activeVariant?.productId || prod.id);
                                }}
                                className="text-[10px] text-slate-400 hover:text-red-500 underline cursor-pointer"
                                title="Remove from comparison"
                              >
                                (Remove)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : currentBrand && !hasActiveFilters ? (
              <div
                data-testid="brand-zero-products-state"
                className="bg-white p-10 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center mx-auto font-extrabold text-lg">
                  {currentBrand.name.charAt(0)}
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <p className="text-base sm:text-lg font-extrabold text-[#111827] font-heading">
                    No {currentBrand.name} products are currently listed online
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    CamneX Bangladesh supplies genuine {currentBrand.name} equipment for commercial and project deployments. Request an official quotation or contact our engineering team for specific model availability and project pricing.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Button size="sm" onClick={() => onNavigate('quote')}>
                    Request Quotation
                  </Button>
                  <button
                    type="button"
                    onClick={() => onNavigate('brands')}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-[#111827] bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    Explore All Brands
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog')}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-[#111827] bg-white hover:bg-slate-50 transition-colors"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-base font-bold text-[#111827]">No products match the selected filters</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing some faceted filter tags or search for a specific model number.
                </p>
                <Button size="sm" onClick={clearAllFilters}>
                  Reset All Filters
                </Button>
              </div>
            )}

            {/* Bottom Pagination Controls */}
            {!isLoading && products.length > 0 && pageSize !== 'all' && totalPages > 1 && (
              <div
                data-testid="pagination-controls"
                className="mt-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="text-xs font-semibold text-slate-500 order-2 sm:order-1 text-center sm:text-left">
                  Showing <span className="font-bold text-[#111827]">{(currentPage - 1) * (pageSize as number) + 1}</span> to{' '}
                  <span className="font-bold text-[#111827]">{Math.min(currentPage * (pageSize as number), totalProducts)}</span> of{' '}
                  <span className="font-bold text-[#111827]">{totalProducts}</span> items
                </div>

                <nav className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center" aria-label="Pagination">
                  {/* Previous Button */}
                  <button
                    type="button"
                    data-testid="prev-page-btn"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      currentPage <= 1
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-white border-slate-200 text-slate-700 hover:text-[#111827] hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                    }`}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden xs:inline">Previous</span>
                  </button>

                  {/* Numbered Page Buttons */}
                  {pageNumbers.map((p, idx) => {
                    if (typeof p === 'string') {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
                        >
                          …
                        </span>
                      );
                    }
                    const isCurrent = p === currentPage;
                    return (
                      <button
                        key={`page-${p}`}
                        type="button"
                        data-testid={`page-num-${p}`}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? 'bg-[#F15A24] text-white border border-[#F15A24] shadow-sm font-extrabold ring-2 ring-orange-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-[#111827] hover:bg-slate-50 hover:border-slate-300'
                        }`}
                        aria-current={isCurrent ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    type="button"
                    data-testid="next-page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      currentPage >= totalPages
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-white border-slate-200 text-slate-700 hover:text-[#111827] hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                    }`}
                    aria-label="Next Page"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* Mobile Filter Sheet Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 flex flex-col justify-end" data-testid="mobile-filter-modal">
          <div className="bg-white rounded-3xl p-6 max-h-[88vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[#111827] font-heading">Filter Hardware</span>
                {hasActiveFilters && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F15A24] text-white">
                    {activeSpecFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-[#F15A24] hover:underline"
                  >
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Categories
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => { setMobileFilterOpen(false); onNavigate('catalog'); }}
                  className={`p-2.5 text-xs font-medium border rounded-xl text-left transition-colors ${
                    !categorySlug && !brandSlug ? 'bg-orange-50 border-[#F15A24] text-[#F15A24] font-bold' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setMobileFilterOpen(false); onNavigate('category', c.slug); }}
                    className={`p-2.5 text-xs font-medium border rounded-xl text-left transition-colors ${
                      categorySlug === c.slug ? 'bg-orange-50 border-[#F15A24] text-[#F15A24] font-bold' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Brands */}
            <div className="space-y-2 pt-3 border-t border-slate-100" data-testid="mobile-filter-group-brand">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5" data-testid="mobile-filter-group-header-brand">
                  <span>Manufacturers</span>
                  {selectedBrands.length > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F15A24] text-white text-[10px] font-black">
                      {selectedBrands.length}
                    </span>
                  )}
                </span>
                {selectedBrands.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSelectedBrands([]); setCurrentPage(1); }}
                    className="text-[11px] font-bold text-[#F15A24] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <ExpandableFilterList
                groupKey="brand"
                options={brandOptions}
                selectedValues={selectedBrands}
                isExpanded={Boolean(expandedGroups['mobile-brand'])}
                onToggleExpand={() => toggleExpandGroup('mobile-brand')}
                onToggleOption={handleBrandToggle}
                testIdPrefix="facet-brand"
                isMobile={true}
              />
            </div>

            {/* Mobile Dynamic Specification Filters */}
            {specFacets.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#F15A24] block">
                  Product Specifications
                </span>

                {specFacets.map(facet => {
                  const selectedInGroup = selectedSpecs[facet.key] || [];
                  const isCollapsed = Boolean(collapsedGroups[`mobile-${facet.key}`]);

                  return (
                    <div key={`m-${facet.key}`} className="pt-3 border-t border-slate-100 first:pt-0 first:border-t-0" data-testid={`mobile-filter-group-${facet.key}`}>
                      <button
                        type="button"
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, [`mobile-${facet.key}`]: !prev[`mobile-${facet.key}`] }))}
                        className="w-full flex items-center justify-between py-1 text-left"
                      >
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5" data-testid={`mobile-filter-group-header-${facet.key}`}>
                          <span>{facet.label}</span>
                          {selectedInGroup.length > 0 && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#F15A24] text-white text-[10px] font-black">
                              {selectedInGroup.length}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      </button>

                      {!isCollapsed && (
                        <ExpandableFilterList
                          groupKey={facet.key}
                          options={facet.options}
                          selectedValues={selectedInGroup}
                          isExpanded={Boolean(expandedGroups[`mobile-${facet.key}`])}
                          onToggleExpand={() => toggleExpandGroup(`mobile-${facet.key}`)}
                          onToggleOption={(val) => handleSpecToggle(facet.key, val)}
                          testIdPrefix={`facet-${facet.key}`}
                          isMobile={true}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <Button size="md" className="w-full font-bold shadow-lg" onClick={() => setMobileFilterOpen(false)}>
                Apply Filters ({totalProducts} Products)
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
