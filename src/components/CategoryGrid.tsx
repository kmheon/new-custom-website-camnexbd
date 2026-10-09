import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Layers, Camera, HardDrive, Cpu, Radio, Shield, Wrench, Server } from 'lucide-react';
import { Category } from '../types';

export interface CategoryGridProps {
  categories: Category[];
  onNavigate: (route: string, param?: string) => void;
  maxHomepage?: number;
  disableLimit?: boolean;
}

// Crisp Vector SVG Fallback Illustration in ONE consistent hardware engineering style
export const CategorySvgIllustration: React.FC<{ slug?: string; name?: string; className?: string }> = ({
  slug = '',
  name = '',
  className = 'w-16 h-16 object-contain'
}) => {
  const s = (slug + ' ' + name).toLowerCase();

  if (s.includes('cctv') || s.includes('camera')) {
    return (
      <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CCTV Camera">
        <rect x="18" y="22" width="46" height="26" rx="5" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
        <path d="M64 27 L82 17 L82 53 L64 43 Z" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="32" cy="35" r="8" fill="#0F172A" />
        <circle cx="32" cy="35" r="3.5" fill="#F15A24" />
        <circle cx="33" cy="34" r="1" fill="#FFFFFF" />
        <rect x="36" y="48" width="10" height="16" rx="2" fill="#64748B" />
        <rect x="28" y="64" width="26" height="4" rx="2" fill="#475569" />
      </svg>
    );
  }

  if (s.includes('dvr') || s.includes('nvr') || s.includes('recorder')) {
    return (
      <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Video Recorder">
        <rect x="14" y="26" width="72" height="28" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
        <rect x="22" y="34" width="22" height="4" rx="1" fill="#475569" />
        <circle cx="66" cy="36" r="2.5" fill="#22C55E" />
        <circle cx="74" cy="36" r="2.5" fill="#F15A24" />
        <circle cx="82" cy="36" r="2.5" fill="#3B82F6" />
        <line x1="20" y1="44" x2="80" y2="44" stroke="#334155" strokeWidth="1" />
      </svg>
    );
  }

  if (s.includes('access') || s.includes('biometric')) {
    return (
      <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Biometric Terminal">
        <rect x="28" y="14" width="44" height="52" rx="6" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
        <rect x="34" y="20" width="32" height="22" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="1" />
        <circle cx="50" cy="27" r="3.5" fill="#38BDF8" />
        <circle cx="50" cy="54" r="8" fill="#0F172A" stroke="#F15A24" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M46 54 C46 51 54 51 54 54" stroke="#F15A24" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (s.includes('switch') || s.includes('network')) {
    return (
      <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Network Switch">
        <rect x="12" y="28" width="76" height="24" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(${20 + i * 10}, 34)`}>
            <rect x="0" y="0" width="6" height="8" rx="1" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
            <circle cx="3" cy="-3" r="1.2" fill={i % 2 === 0 ? '#22C55E' : '#38BDF8'} />
          </g>
        ))}
      </svg>
    );
  }

  if (s.includes('wifi') || s.includes('access-point')) {
    return (
      <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Wi-Fi Access Point">
        <circle cx="50" cy="42" r="26" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="50" cy="42" r="16" fill="#0F172A" />
        <circle cx="50" cy="42" r="6" fill="#F15A24" />
        <circle cx="50" cy="42" r="2" fill="#FFFFFF" />
      </svg>
    );
  }

  if (s.includes('storage') || s.includes('hard-drive') || s.includes('hdd')) {
    return (
      <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Surveillance HDD">
        <rect x="22" y="16" width="56" height="48" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
        <circle cx="50" cy="38" r="16" fill="#0F172A" stroke="#475569" strokeWidth="1" />
        <circle cx="50" cy="38" r="5" fill="#64748B" />
        <rect x="28" y="20" width="22" height="6" rx="1" fill="#475569" />
      </svg>
    );
  }

  // Generic Hardware Module fallback
  return (
    <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Hardware Module">
      <rect x="18" y="20" width="64" height="40" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
      <circle cx="34" cy="40" r="8" fill="#0F172A" stroke="#F15A24" strokeWidth="1.5" />
      <rect x="50" y="32" width="22" height="4" rx="1" fill="#475569" />
      <rect x="50" y="42" width="16" height="4" rx="1" fill="#475569" />
    </svg>
  );
};

// Tag chip lookup helper
export const getCategoryTag = (slug: string, name: string = '') => {
  const s = (slug + ' ' + name).toLowerCase();
  if (s.includes('cctv') || s.includes('camera')) return 'SURVEILLANCE';
  if (s.includes('recorders') || s.includes('dvr') || s.includes('nvr')) return 'RECORDING';
  if (s.includes('access') || s.includes('biometric')) return 'ACCESS CONTROL';
  if (s.includes('switch') || s.includes('network')) return 'NETWORKING';
  if (s.includes('wifi') || s.includes('access-point')) return 'WI-FI 6';
  if (s.includes('hard-drive') || s.includes('storage') || s.includes('hdd')) return 'STORAGE';
  if (s.includes('cable') || s.includes('accessories')) return 'ACCESSORIES';
  if (s.includes('intercom')) return 'INTERCOM';
  if (s.includes('power') || s.includes('ups')) return 'POWER';
  return 'HARDWARE';
};

export interface AdaptiveGridResult {
  columns: number;
  spans: number[];
}

/**
 * Adaptive row-fill function:
 * With n categories and c columns:
 * - Columns by viewport: 4 at >= 1024px, 3 at 640-1023px, 2 below 640px.
 * - If n < c, use n columns.
 * - Lay tiles out in rows of c. Last row has r = n mod c tiles (if r != 0).
 * - Each of those r tiles gets floor(c/r), and first (c mod r) get +1 extra column.
 * - Never an orphan, never a gap.
 */
export function computeAdaptiveGrid(totalItems: number, viewportWidth: number): AdaptiveGridResult {
  if (totalItems <= 0) {
    return { columns: 1, spans: [] };
  }

  // Viewport columns breakpoint
  const maxCols = viewportWidth >= 1024 ? 4 : viewportWidth >= 640 ? 3 : 2;

  // If n is less than c, use n columns (1 tile fills full width, 2 tiles split in half, etc.)
  const c = totalItems < maxCols ? Math.max(1, totalItems) : maxCols;

  const spans: number[] = [];
  const fullRows = Math.floor(totalItems / c);
  const r = totalItems % c;

  // All items in full rows get span 1
  for (let i = 0; i < fullRows * c; i++) {
    spans.push(1);
  }

  // Last row items share the full row
  if (r > 0) {
    const baseSpan = Math.floor(c / r);
    const extraCols = c % r;
    for (let i = 0; i < r; i++) {
      const span = i < extraCols ? baseSpan + 1 : baseSpan;
      spans.push(span);
    }
  }

  return { columns: c, spans };
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  onNavigate,
  maxHomepage = 8,
  disableLimit = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport tracking
  const [viewportWidth, setViewportWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter eligible categories: active, not hidden from homepage
  const eligibleCategories = useMemo(() => {
    const list = [...categories].filter(c => c.showOnHomepage !== false && c.status !== 'inactive');
    list.sort((a, b) => ((a.displayOrder ?? a.order ?? 999) - (b.displayOrder ?? b.order ?? 999)));
    return list;
  }, [categories]);

  // Determine displayed tiles
  // Homepage shows at most 8 categories. If more exist, the 8th tile becomes a "+N more categories" tile.
  const displayTiles = useMemo(() => {
    // Check if test harness requested rendering all categories unconstrained
    const allowUncapped = disableLimit || (typeof window !== 'undefined' && (window as any).__CAMNEX_TEST_DISABLE_8_CAP);

    if (allowUncapped || eligibleCategories.length <= maxHomepage) {
      return eligibleCategories.map(c => ({
        ...c,
        isMoreTile: false
      }));
    }

    // When eligible categories > 8: show first 7 categories + 1 "+N more categories" tile
    const first7 = eligibleCategories.slice(0, 7).map(c => ({ ...c, isMoreTile: false }));
    const moreCount = eligibleCategories.length - 7;
    const moreTile = {
      id: 'more-categories-tile',
      name: `+${moreCount} More Categories`,
      slug: 'all-categories',
      description: `Browse full hardware catalog (${eligibleCategories.length} categories total)`,
      image: '',
      specTemplateId: '',
      order: 999,
      displayOrder: 999,
      isMoreTile: true
    };
    return [...first7, moreTile];
  }, [eligibleCategories, maxHomepage, disableLimit]);

  // Compute adaptive grid columns and spans
  const { columns, spans } = useMemo(() => {
    return computeAdaptiveGrid(displayTiles.length, viewportWidth);
  }, [displayTiles.length, viewportWidth]);

  const isMobile = viewportWidth < 640;

  if (displayTiles.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="grid w-full gap-3 sm:gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
      data-testid="category-grid"
      data-columns={columns}
      data-tile-count={displayTiles.length}
    >
      {displayTiles.map((cat, idx) => {
        const span = spans[idx] || 1;
        const isMoreTile = (cat as any).isMoreTile === true;
        const tag = getCategoryTag(cat.slug, cat.name);
        const isWide = span >= 2 && !isMobile;

        // Ensure stock photo URLs (like Unsplash) are never used
        const rawImg = cat.image || '';
        const isUnrelatedStockPhoto = rawImg.includes('unsplash.com') || rawImg.includes('stock');
        const validImage = !isUnrelatedStockPhoto && rawImg.trim().length > 0 ? rawImg : null;

        // Mobile Layout: Vertical (Image on top 64px, name below, no description or tag, link text hidden)
        if (isMobile) {
          return (
            <div
              key={cat.id || idx}
              data-category-tile
              data-tile-index={idx}
              data-span={span}
              data-slug={cat.slug}
              data-more-tile={isMoreTile ? 'true' : 'false'}
              onClick={() => {
                if (isMoreTile) {
                  onNavigate('catalog');
                } else {
                  onNavigate('category', cat.slug);
                }
              }}
              style={{
                gridColumn: `span ${span} / span ${span}`
              }}
              className={`bg-gradient-to-br from-white via-white to-[#F7F3EE] rounded-[16px] border border-[#EDE8E1] p-3 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[136px] h-full ${
                span === 2 ? 'col-span-2' : 'col-span-1'
              }`}
            >
              {/* Image on top (64px high) */}
              <div className="h-[64px] max-h-[64px] w-full flex items-center justify-center pointer-events-none mb-1.5 shrink-0">
                {isMoreTile ? (
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center">
                    <Layers className="w-6 h-6 stroke-[1.75]" />
                  </div>
                ) : validImage ? (
                  <img
                    src={validImage}
                    alt={cat.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="max-h-[64px] max-w-[85%] object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <CategorySvgIllustration slug={cat.slug} name={cat.name} className="w-14 h-14 object-contain opacity-85" />
                )}
              </div>

              {/* Name below (up to 2 lines, word wrapping, never cut with ... before 2nd line) */}
              <div className="w-full min-w-0">
                <h3 className="font-heading font-bold text-[13px] text-[#111827] group-hover:text-[#F15A24] transition-colors leading-snug line-clamp-2 break-words [overflow-wrap:anywhere] px-1">
                  {cat.name}
                </h3>
              </div>
            </div>
          );
        }

        // Desktop / Tablet Layout: Horizontal (Left ~60%, Right ~40%, 140-160px height)
        return (
          <div
            key={cat.id || idx}
            data-category-tile
            data-tile-index={idx}
            data-span={span}
            data-slug={cat.slug}
            data-more-tile={isMoreTile ? 'true' : 'false'}
            onClick={() => {
              if (isMoreTile) {
                onNavigate('catalog');
              } else {
                onNavigate('category', cat.slug);
              }
            }}
            style={{
              gridColumn: `span ${span} / span ${span}`
            }}
            className={`bg-gradient-to-br from-white via-white to-[#F7F3EE] rounded-[16px] border border-[#EDE8E1] p-3.5 sm:p-4 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex justify-between relative overflow-hidden min-h-[144px] h-[152px] sm:h-[156px] min-w-0 ${
              span === 4 ? 'col-span-4' : span === 3 ? 'col-span-3' : span === 2 ? 'col-span-2' : 'col-span-1'
            }`}
          >
            {/* Left Side (~60%): Tag chip, Category name (18px bold max 2 lines), Description (max 2 lines), Explore link */}
            <div className={`min-w-0 pr-2 flex flex-col justify-between z-10 ${isWide ? 'w-[58%] max-w-[62%]' : 'w-[60%] sm:w-[62%] flex-1'}`}>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#F15A24] bg-orange-50 px-2 py-0.5 rounded-full inline-block mb-1 truncate max-w-full">
                  {isMoreTile ? 'CATALOG' : tag}
                </span>

                <h3 className="font-heading font-bold text-[15px] sm:text-[17px] text-[#111827] group-hover:text-[#F15A24] transition-colors leading-snug line-clamp-2 min-w-0 [overflow-wrap:anywhere] break-words">
                  {cat.name}
                </h3>

                <p className="text-[11px] text-[#5B6472] leading-tight line-clamp-2 mt-0.5 min-w-0 [overflow-wrap:anywhere] break-words">
                  {cat.description || (isMoreTile ? 'Browse our full hardware catalog' : 'Hardware & accessories')}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-[#F15A24] pt-1">
                <span>{isMoreTile ? 'View All Items' : 'Explore Category'}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right Side (~40%): Transparent PNG/SVG product image, object-contain, bottom-right, NO white box and NO border */}
            <div className={`${isWide ? 'w-[42%]' : 'w-[38%] sm:w-[40%]'} flex items-end justify-end pointer-events-none self-end h-full relative overflow-hidden`}>
              {isMoreTile ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50/80 border border-orange-100/60 flex items-center justify-center text-[#F15A24] group-hover:scale-105 transition-transform duration-300 mb-1 mr-1">
                  <Layers className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.6]" />
                </div>
              ) : validImage ? (
                <img
                  src={validImage}
                  alt={cat.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className={`${isWide ? 'max-h-[105px]' : 'max-h-[88px] sm:max-h-[92px]'} max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300`}
                />
              ) : (
                <CategorySvgIllustration slug={cat.slug} name={cat.name} className={`${isWide ? 'w-18 h-18' : 'w-14 h-14'} object-contain opacity-85 group-hover:scale-105 transition-transform duration-300`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
