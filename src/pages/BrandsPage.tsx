import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowRight,
  ShieldCheck,
  Package,
  Building2,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { Brand, Product } from '../types';
import { brandService, productService } from '../services';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button } from '../components/common/UI';

interface BrandsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

function countBrandProducts(brand: Brand, products: Product[]): number {
  const bId = String(brand.id || '').toLowerCase();
  const bIdBase = bId.replace(/^(b-|brand-)/i, '');
  const bSlug = String(brand.slug || '').toLowerCase();
  const bSlugSpaced = bSlug.replace(/-/g, ' ');
  const bSlugFirst = bSlug.split('-')[0];
  const bName = String(brand.name || '').toLowerCase();

  let count = 0;
  for (const p of products) {
    const pBrandId = String(p.brandId || '').toLowerCase();
    const pBrandIdBase = pBrandId.replace(/^(b-|brand-)/i, '');
    const pBrandName = String(p.brand || '').toLowerCase();

    if (
      pBrandId &&
      (pBrandId === bId ||
        pBrandId === bSlug ||
        (bIdBase && pBrandIdBase === bIdBase) ||
        (bSlug && pBrandIdBase === bSlug))
    ) {
      count++;
      continue;
    }
    if (
      pBrandName &&
      (pBrandName === bName ||
        pBrandName === bSlug ||
        pBrandName === bSlugSpaced ||
        (bIdBase && pBrandName === bIdBase) ||
        (bSlugFirst.length >= 4 && pBrandName.includes(bSlugFirst)) ||
        (bName.length >= 3 && pBrandName.length >= 3 && bName.includes(pBrandName)))
    ) {
      count++;
    }
  }
  return count;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({ onNavigate }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    Promise.all([
      brandService.getBrands(),
      productService.getProducts({ limit: 500 })
    ])
      .then(([brandList, prodResult]) => {
        if (!mounted) return;
        setBrands(brandList || []);
        setProducts(prodResult?.items || []);
      })
      .catch(() => {
        if (!mounted) return;
        setBrands([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const enrichedBrands = useMemo(() => {
    return brands.map((brand) => {
      const calculatedCount =
        products.length > 0
          ? countBrandProducts(brand, products)
          : typeof brand.productCount === 'number'
          ? brand.productCount
          : 0;
      return {
        ...brand,
        resolvedProductCount: calculatedCount
      };
    });
  }, [brands, products]);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return enrichedBrands;
    return enrichedBrands.filter((b) => b.name.toLowerCase().includes(q));
  }, [enrichedBrands, searchQuery]);

  const handleLogoError = (brandId: string) => {
    setFailedLogos((prev) => ({ ...prev, [brandId]: true }));
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-6 sm:py-10">
      <SEO
        title="Explore Our Brands | CamneX Bangladesh"
        description="Discover security, surveillance, networking, and IT brands available through CamneX Bangladesh."
        canonicalPath="/brands"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Brands' }
          ]}
        />

        {/* A. Page Heading & B. Brand Search */}
        <div className="bg-white rounded-2xl border border-[#EDE8E1] p-6 sm:p-8 lg:p-10 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-[#F15A24] text-xs font-bold uppercase tracking-wider mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>Brand Directory</span>
              </div>
              <h1
                data-testid="brands-page-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111827] font-heading tracking-tight mb-2.5"
              >
                Explore Our Brands
              </h1>
              <p
                data-testid="brands-page-subtitle"
                className="text-sm sm:text-base text-slate-600 leading-relaxed"
              >
                Discover security, surveillance, networking, and IT brands available through CamneX Bangladesh.
              </p>
            </div>

            {/* Responsive Search Field */}
            <div className="w-full lg:w-96 shrink-0">
              <label htmlFor="brand-directory-search" className="sr-only">
                Search brands by name
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="brand-directory-search"
                  data-testid="brand-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brands by name..."
                  className="w-full bg-[#FAF7F2] border border-[#EDE8E1] focus:bg-white focus:border-[#F15A24] focus:ring-2 focus:ring-[#F15A24]/15 rounded-xl pl-10 pr-10 py-3 text-sm text-[#111827] placeholder:text-slate-400 font-medium transition-all outline-none"
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    data-testid="brand-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear brand search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-[#111827] hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Showing <strong className="text-[#111827]">{filteredBrands.length}</strong> of{' '}
                  {enrichedBrands.length} brands
                </span>
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#F15A24] font-semibold hover:underline"
                  >
                    Reset search
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* C. Brand Directory Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-64 bg-white rounded-2xl border border-[#EDE8E1] p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="h-16 bg-slate-100 rounded-xl w-full" />
                <div className="space-y-2">
                  <div className="h-5 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
                <div className="h-9 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredBrands.length > 0 ? (
          <div
            data-testid="brands-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredBrands.map((brand) => {
              const hasValidLogo =
                Boolean(brand.logo && brand.logo.trim()) && !failedLogos[brand.id];
              const count = brand.resolvedProductCount;

              return (
                <div
                  key={brand.id}
                  data-testid={`brand-card-${brand.slug}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate('brand', brand.slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate('brand', brand.slug);
                    }
                  }}
                  className="group bg-white rounded-2xl border border-[#EDE8E1] hover:border-[#F15A24]/50 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                >
                  <div>
                    {/* Top Row: Logo or Clean Typographic Fallback + Product Count Badge */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="h-14 w-36 rounded-xl bg-[#FAF7F2] border border-[#EDE8E1]/80 px-3.5 py-2 flex items-center justify-center shrink-0 overflow-hidden">
                        {hasValidLogo ? (
                          <img
                            src={brand.logo}
                            alt={`${brand.name} logo`}
                            onError={() => handleLogoError(brand.id)}
                            className="max-h-9 max-w-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <span
                            data-testid={`brand-fallback-badge-${brand.slug}`}
                            className="text-sm font-extrabold text-[#111827] font-heading tracking-tight text-center leading-tight select-none"
                          >
                            {brand.name}
                          </span>
                        )}
                      </div>

                      <span
                        data-testid={`brand-product-count-${brand.slug}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          count > 0
                            ? 'bg-orange-50 text-[#F15A24] border border-orange-200/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                        }`}
                      >
                        <Package className="w-3 h-3" />
                        <span>
                          {count === 1 ? '1 Product' : `${count} Products`}
                        </span>
                      </span>
                    </div>

                    {/* Brand Name & Optional Verified Partner Badge */}
                    <div className="mb-2">
                      <h2 className="text-lg font-extrabold text-[#111827] group-hover:text-[#F15A24] transition-colors font-heading leading-snug">
                        {brand.name}
                      </h2>
                      {brand.showBadge && brand.badgeText && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{brand.badgeText}</span>
                        </div>
                      )}
                    </div>

                    {/* Short Brand Description (1-2 lines when present) */}
                    {brand.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-5">
                        {brand.description}
                      </p>
                    )}
                  </div>

                  {/* Clear Action Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827] group-hover:text-[#F15A24] transition-colors">
                      {count > 0 ? 'Explore Products' : 'View Brand & Inquire'}
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-[#FAF7F2] group-hover:bg-[#F15A24] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div
            data-testid="brands-empty-search"
            className="bg-white rounded-2xl border border-[#EDE8E1] p-12 text-center max-w-xl mx-auto my-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-[#111827] font-heading mb-1.5">
              No brands match &ldquo;{searchQuery.trim()}&rdquo;
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
              We couldn&apos;t find a brand matching your search term. Try clearing the search filter to browse all available brands, or request a custom quotation if you need specific hardware.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Show All Brands
              </Button>
              <button
                type="button"
                onClick={() => onNavigate('quote')}
                className="px-4 py-2 rounded-xl border border-[#EDE8E1] hover:border-slate-300 text-xs font-bold text-[#111827] bg-[#FAF7F2] hover:bg-slate-100 transition-colors"
              >
                Request Custom Quotation
              </button>
            </div>
          </div>
        )}

        {/* Bottom Assistance Banner for Special Project Sourcing */}
        <div className="mt-10 bg-white rounded-2xl border border-[#EDE8E1] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F15A24]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Commercial &amp; Turnkey Procurement</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#111827] font-heading">
              Looking for a specific model or bulk project quotation?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our engineering team supplies genuine surveillance, networking, and access control equipment across Bangladesh. Contact us for model availability, datasheets, or custom bills of materials.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button
              size="md"
              onClick={() => onNavigate('quote')}
              className="w-full sm:w-auto justify-center"
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              <span>Request Quotation</span>
            </Button>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#EDE8E1] hover:border-slate-300 text-xs font-bold text-[#111827] bg-[#FAF7F2] hover:bg-slate-100 transition-colors text-center"
            >
              Browse All Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
