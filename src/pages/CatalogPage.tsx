import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ShoppingBag, X, ChevronDown, Check, ArrowRight, Layers } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { productService, categoryService, brandService, specTemplateService } from '../services';
import { Product, Category, Brand, SpecTemplate } from '../types';
import { useCartStore, useCompareStore } from '../store';

interface CatalogPageProps {
  onNavigate: (route: string, param?: string) => void;
  categorySlug?: string;
  brandSlug?: string;
}

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
  const [specTemplate, setSpecTemplate] = useState<SpecTemplate | null>(null);
  const [availableSpecFilters, setAvailableSpecFilters] = useState<Record<string, string[]>>({});
  
  // Filter States
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'name_asc'>('popular');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addItemToCart = useCartStore((s) => s.addItem);
  const { addProduct: addToCompare, hasProduct: isInCompare } = useCompareStore();

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
    brandService.getBrands().then(setBrands);
  }, []);

  useEffect(() => {
    setSelectedSpecs({});
    if (categorySlug) {
      categoryService.getCategoryBySlug(categorySlug).then(cat => {
        setCurrentCategory(cat);
        if (cat) {
          specTemplateService.getTemplateByCategorySlug(cat.slug).then(setSpecTemplate);
          productService.getAvailableSpecFiltersForCategory(cat.slug).then(setAvailableSpecFilters);
        } else {
          setSpecTemplate(null);
          setAvailableSpecFilters({});
        }
      });
    } else {
      setCurrentCategory(null);
      setSpecTemplate(null);
      setAvailableSpecFilters({});
    }

    if (brandSlug) {
      brandService.getBrandBySlug(brandSlug).then(setCurrentBrand);
    } else {
      setCurrentBrand(null);
    }
  }, [categorySlug, brandSlug]);

  useEffect(() => {
    fetchProducts();
  }, [categorySlug, brandSlug, selectedSpecs, sortBy, priceRange]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productService.getProducts({
        categorySlug,
        brandSlug,
        specFilters: selectedSpecs,
        sortBy,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        limit: 24
      });
      setProducts(res.items);
      setTotalProducts(res.total);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecSelect = (key: string, val: string) => {
    const updated = { ...selectedSpecs };
    if (updated[key] === val) {
      delete updated[key];
    } else {
      updated[key] = val;
    }
    setSelectedSpecs(updated);
  };

  const clearAllFilters = () => {
    setSelectedSpecs({});
    setPriceRange({});
  };

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

  const hasActiveFilters = Object.keys(selectedSpecs).length > 0 || priceRange.min !== undefined || priceRange.max !== undefined;

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
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Catalog', onClick: () => onNavigate('catalog') },
            ...(currentCategory ? [{ label: currentCategory.name }] : []),
            ...(currentBrand ? [{ label: currentBrand.name }] : [])
          ]}
        />

        {/* Title & Introduction */}
        <div className="mb-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading mb-2">
            {currentCategory?.name || currentBrand?.name || 'All Surveillance & IT Hardware'}
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            {currentCategory?.description || currentBrand?.description || 'Explore our verified catalog of genuine security cameras, digital recorders, network switches, and biometric access control devices with official warranties.'}
          </p>
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
                      !categorySlug ? 'bg-orange-50 text-[#F15A24] font-bold' : 'text-slate-600 hover:bg-slate-50'
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
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-2 uppercase">
                  Manufacturers
                </span>
                <div className="space-y-1">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onNavigate('brand', b.slug)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        brandSlug === b.slug ? 'bg-orange-50 text-[#F15A24] font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Category-Aware Spec Filters (From Template) */}
              {specTemplate && specTemplate.fields.filter(f => f.filterable).map((field) => {
                const availableOpts = availableSpecFilters[field.key] || field.options || [];
                if (availableOpts.length === 0) return null;

                return (
                  <div key={field.id} className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block mb-2 uppercase">
                      {field.name}
                    </span>
                    <div className="space-y-1">
                      {availableOpts.map((opt) => {
                        const isChecked = selectedSpecs[field.key] === String(opt);
                        return (
                          <button
                            key={String(opt)}
                            type="button"
                            onClick={() => handleSpecSelect(field.key, String(opt))}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                              isChecked ? 'bg-orange-500/10 text-[#F15A24] font-bold' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="line-clamp-1">{String(opt)}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-[#F15A24]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </div>
          </aside>

          {/* Product Grid Area (3-col) */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* Sorting & Result Counts Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-semibold text-slate-500">
                Showing <strong className="text-[#111827]">{products.length}</strong> of {totalProducts} verified products
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F15A24]"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse p-4" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview */}
                      <div
                        onClick={() => onNavigate('product', prod.id)}
                        className="h-48 rounded-xl overflow-hidden bg-slate-100 cursor-pointer mb-4 relative"
                      >
                        <img
                          src={prod.primaryImage}
                          alt={prod.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <Badge variant="dark">{prod.brand}</Badge>
                        </div>
                      </div>

                      {/* Model & Name */}
                      <div className="text-xs font-mono text-slate-400 mb-1">{prod.modelNumber}</div>
                      <h3
                        onClick={() => onNavigate('product', prod.id)}
                        className="font-bold text-base text-[#111827] hover:text-[#F15A24] cursor-pointer transition-colors font-heading mb-2 line-clamp-2"
                      >
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        {prod.shortDescription}
                      </p>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        {prod.pricing.regularPrice ? (
                          <div className="text-lg font-black text-[#F15A24] font-heading">
                            ৳{prod.pricing.regularPrice.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-500">
                            Request quotation
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-emerald-600">
                          Hardware Warranty
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onNavigate('product', prod.id)}
                          className="w-full py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                        >
                          Details
                        </button>
                        <Button
                          size="sm"
                          onClick={() => addItemToCart(prod, 1)}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                          <span>Buy</span>
                        </Button>
                      </div>

                      {/* Compare Checkbox */}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            addToCompare(prod.id);
                            onNavigate('compare');
                          }}
                          className="text-[11px] font-semibold text-slate-400 hover:text-[#F15A24]"
                        >
                          {isInCompare(prod.id) ? '✓ Added to Compare' : '+ Compare Specs'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

          </main>

        </div>

      </div>

      {/* Mobile Filter Sheet Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 flex flex-col justify-end">
          <div className="bg-white rounded-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-sm text-[#111827]">Filter Hardware</span>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 block">Categories</span>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setMobileFilterOpen(false); onNavigate('category', c.slug); }}
                    className="p-2 text-xs font-medium border rounded-lg text-left"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <Button size="md" className="w-full" onClick={() => setMobileFilterOpen(false)}>
              Apply Filters ({totalProducts} Results)
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
