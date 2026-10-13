import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Info,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ArrowUpDown,
  Camera,
  Shield,
  Wifi,
  Video
} from 'lucide-react';
import { SecurityPackage, PackageSystemType, PackageSeries } from '../../types';
import {
  FilterState,
  AvailableOptions,
  availableOptions,
  filterPackages,
  buildFilterQuery,
  slugifyFilter,
  normalizeNightViewSlug
} from '../../utils/packageFilters';

export interface PackageFilterBarProps {
  variant: 'compact' | 'full';
  packages: SecurityPackage[];
  systemTypes: PackageSystemType[];
  seriesList: PackageSeries[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onClearFilters?: () => void;
  className?: string;
  totalFilteredCount?: number;
  totalPackagesCount?: number;
}

export const PackageFilterBar: React.FC<PackageFilterBarProps> = ({
  variant,
  packages,
  systemTypes,
  seriesList,
  filters,
  onFilterChange,
  onClearFilters,
  className = '',
  totalFilteredCount,
  totalPackagesCount
}) => {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Derive pure options and live filtered list
  const options: AvailableOptions = availableOptions(packages, filters, { systemTypes, seriesList });
  const filteredList = filterPackages(packages, filters, { systemTypes, seriesList });

  const totalCount = totalPackagesCount ?? packages.length;
  const filteredCount = totalFilteredCount ?? filteredList.length;
  const shownCount = variant === 'compact' ? Math.min(filteredCount, 4) : filteredCount;

  // Check if any filter is active
  const isFilterActive =
    (filters.systemSlug && filters.systemSlug !== 'all') ||
    (filters.cameraCount && filters.cameraCount !== 'All') ||
    (filters.nightViewSlug && filters.nightViewSlug !== 'all') ||
    (filters.minPrice != null && filters.minPrice > 0) ||
    (filters.maxPrice != null && filters.maxPrice < 10000000) ||
    Boolean(filters.storage && filters.storage !== 'all') ||
    Boolean(filters.channels && filters.channels !== 'all') ||
    Boolean(filters.cameraType && filters.cameraType !== 'all') ||
    Boolean(filters.resolution && filters.resolution !== 'all') ||
    Boolean(filters.audio && filters.audio !== 'all') ||
    Boolean(filters.brand && filters.brand !== 'all') ||
    Boolean(filters.tag && filters.tag !== 'all') ||
    Boolean(filters.installation && filters.installation !== 'all');

  // Count active secondary filters for "More filters" badge
  const secondaryFilterCount = [
    Boolean(filters.minPrice != null && filters.minPrice > 0),
    Boolean(filters.maxPrice != null && filters.maxPrice < 10000000),
    Boolean(filters.storage && filters.storage !== 'all'),
    Boolean(filters.channels && filters.channels !== 'all'),
    Boolean(filters.cameraType && filters.cameraType !== 'all'),
    Boolean(filters.resolution && filters.resolution !== 'all'),
    Boolean(filters.audio && filters.audio !== 'all'),
    Boolean(filters.brand && filters.brand !== 'all'),
    Boolean(filters.tag && filters.tag !== 'all'),
    Boolean(filters.installation && filters.installation !== 'all')
  ].filter(Boolean).length;

  // Handle outside click for info tooltip
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfoTooltip(false);
      }
    }
    if (showInfoTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInfoTooltip]);

  // Selected system type description
  const activeSystem = options.systemTypes.find(st => st.slug === (filters.systemSlug || 'all'));
  const selectedSystemDescription = activeSystem?.description || 'Camera sets for homes, shops and offices';

  // Handler for clearing all filters
  const handleClear = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      onFilterChange({
        systemSlug: 'all',
        cameraCount: 'All',
        nightViewSlug: 'all',
        minPrice: undefined,
        maxPrice: undefined,
        includeAskForPrice: false,
        storage: undefined,
        channels: undefined,
        cameraType: undefined,
        resolution: undefined,
        audio: undefined,
        brand: undefined,
        tag: undefined,
        installation: undefined,
        sortBy: 'recommended',
        page: 1
      });
    }
  };

  // Icon resolver for system types
  const getSystemIcon = (slug: string) => {
    switch (slug) {
      case 'ip':
        return <Video className="w-3.5 h-3.5 shrink-0" />;
      case 'wireless':
        return <Wifi className="w-3.5 h-3.5 shrink-0" />;
      case 'analogue':
        return <Camera className="w-3.5 h-3.5 shrink-0" />;
      case 'all':
      default:
        return <Shield className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  // Keyboard navigation for segmented control tabs
  const handleSegmentKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.systemTypes.length;
      const targetSlug = options.systemTypes[nextIndex].slug;
      onFilterChange({ ...filters, systemSlug: targetSlug, page: 1 });
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.systemTypes.length) % options.systemTypes.length;
      const targetSlug = options.systemTypes[prevIndex].slug;
      onFilterChange({ ...filters, systemSlug: targetSlug, page: 1 });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 
        PACKAGE FILTER BAR:
        Desktop (>= 1100px): Exactly ONE single row (56-64px high, #FFFFFF, 1px #EDE8E1 border, 16px radius, soft shadow, 12px padding, 16px gaps).
        Tablet (768-1099px): Two rows inside the same bar (Row 1: segments full width; Row 2: selects + counter/clear).
        Mobile (< 768px): Segments 2x2 grid, selects with stacked labels, counter row.
      */}
      <div
        data-filterbar
        className="w-full bg-white border border-[#EDE8E1] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-3 flex flex-col min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between gap-3 min-[1100px]:gap-4 min-[1100px]:h-[58px]"
      >
        {/* GROUP 1: Segmented Control + Info Button */}
        {options.systemTypes.length >= 2 && (
          <div className="flex items-center gap-2 w-full min-[1100px]:w-auto shrink-0">
            <span className="text-[13px] uppercase font-semibold text-[#5B6472] shrink-0 select-none hidden min-[1100px]:inline">
              System
            </span>
            <div
              role="tablist"
              aria-label="System"
              className="grid grid-cols-2 md:grid-cols-4 min-[1100px]:flex items-center gap-1.5 w-full min-[1100px]:w-auto shrink-0"
            >
              {options.systemTypes.map((seg, idx) => {
                const isActive = (filters.systemSlug || 'all') === seg.slug;
                return (
                  <button
                    key={seg.slug}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-pressed={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(e) => handleSegmentKeyDown(e, idx)}
                    onClick={() => onFilterChange({ ...filters, systemSlug: seg.slug, page: 1 })}
                    className={`h-[44px] min-[1100px]:h-[38px] px-3 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-1.5 min-w-[70px] whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                      isActive
                        ? 'bg-[#F15A24] text-white shadow-xs'
                        : 'bg-white text-[#111827] border border-[#EDE8E1] hover:bg-slate-50'
                    }`}
                  >
                    {getSystemIcon(seg.slug)}
                    <span>{seg.shortLabel}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#5B6472]'
                      }`}
                    >
                      {seg.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Info Button & Popover */}
            <div className="relative flex items-center h-[38px] shrink-0" ref={infoRef}>
              <button
                type="button"
                aria-label="System type descriptions"
                aria-expanded={showInfoTooltip}
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#5B6472] hover:text-[#111827] hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
              >
                <Info className="w-4 h-4" />
              </button>

              {showInfoTooltip && (
                <div
                  role="tooltip"
                  className="absolute left-0 min-[1100px]:left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#EDE8E1] p-3.5 z-50 text-left space-y-2 text-xs"
                >
                  <p className="font-bold text-[#111827] text-sm border-b border-[#EDE8E1] pb-1.5">
                    Security System Types
                  </p>
                  {options.systemTypes
                    .filter(s => s.slug !== 'all')
                    .map(s => (
                      <div key={s.slug} className="space-y-0.5">
                        <span className="font-semibold text-[#111827]">{s.shortLabel}:</span>{' '}
                        <span className="text-[#5B6472]">{s.description}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROW 2 on tablet, ROW 2+3 on mobile, INLINE on desktop */}
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full min-[1100px]:w-auto gap-3 min-[1100px]:gap-4 shrink-0">
          {/* Selects: side by side on mobile (grid-cols-2) and tablet/desktop (flex-row) */}
          <div className="grid grid-cols-2 md:flex md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3 shrink-0">
            {/* GROUP 2: Cameras Select */}
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label
                htmlFor="filter-cameras"
                className="text-[13px] uppercase font-semibold text-[#5B6472] shrink-0 select-none text-left"
              >
                Cameras
              </label>
              <div className="relative w-full md:w-[170px] min-[1100px]:w-[185px] h-[44px] min-[1100px]:h-[38px]">
                <select
                  id="filter-cameras"
                  aria-label="Filter packages by camera count"
                  value={filters.cameraCount || 'All'}
                  onChange={(e) => onFilterChange({ ...filters, cameraCount: e.target.value, page: 1 })}
                  className="w-full h-[44px] min-[1100px]:h-[38px] pl-3 pr-7 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none shadow-2xs"
                >
                  {options.cameraCounts.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      title={opt.disabled ? 'No packages' : undefined}
                    >
                      {opt.label} ({opt.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* GROUP 3: Night vision Select */}
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <label
                htmlFor="filter-night-view"
                className="text-[13px] uppercase font-semibold text-[#5B6472] shrink-0 select-none text-left"
              >
                Night vision
              </label>
              <div className="relative w-full md:w-[170px] min-[1100px]:w-[185px] h-[44px] min-[1100px]:h-[38px]">
                <select
                  id="filter-night-view"
                  aria-label="Filter packages by night vision"
                  value={filters.nightViewSlug || 'all'}
                  onChange={(e) => onFilterChange({ ...filters, nightViewSlug: e.target.value, page: 1 })}
                  className="w-full h-[44px] min-[1100px]:h-[38px] pl-3 pr-7 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none shadow-2xs"
                >
                  {options.nightViews.map((opt) => (
                    <option
                      key={opt.slug}
                      value={opt.slug}
                      disabled={opt.disabled}
                      title={opt.disabled ? 'No packages' : undefined}
                    >
                      {opt.label} ({opt.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* FULL VARIANT: Extra "More filters" button & Sort select */}
            {variant === 'full' && (
              <div className="col-span-2 md:col-span-1 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className={`h-[38px] px-3.5 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                    secondaryFilterCount > 0 || showMoreFilters
                      ? 'bg-orange-50 text-[#F15A24] border border-[#F15A24]'
                      : 'bg-white text-[#111827] border border-[#EDE8E1] hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>More filters</span>
                  {secondaryFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#F15A24] text-white text-[11px] font-bold flex items-center justify-center ml-0.5">
                      {secondaryFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Select */}
                <div className="relative min-w-[140px] h-[38px]">
                  <select
                    aria-label="Sort packages"
                    value={filters.sortBy || 'recommended'}
                    onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none shadow-2xs"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-asc">Price low to high</option>
                    <option value="price-desc">Price high to low</option>
                    <option value="cameras-asc">Cameras low to high</option>
                    <option value="newest">Newest</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Counter + Clear: right-aligned on tablet & desktop, bottom row on mobile */}
          <div
            data-slot="filterbar-counter"
            className="min-w-[140px] shrink-0 flex items-center justify-between md:justify-end gap-3 h-[38px] pt-2 md:pt-0 border-t border-[#EDE8E1] md:border-0"
          >
            <span className="text-[14px] text-[#5B6472] whitespace-nowrap">
              Showing <strong className="font-bold text-[#111827]">{shownCount}</strong> of{' '}
              <strong className="font-bold text-[#111827]">{totalCount}</strong>
            </span>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[14px] font-semibold text-[#F15A24] hover:underline cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#F15A24] rounded px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE ONLY (< 768px): One-line plain-language description of selected system type below bar with reserved height */}
      <div
        data-slot="system-type-description"
        className="block md:hidden text-[14px] text-[#5B6472] min-h-[22px] mt-2 px-1 text-left"
      >
        {selectedSystemDescription}
      </div>

      {/* EXTENDED FILTERS: Expandable Panel (Desktop) or Drawer (Mobile) */}
      {variant === 'full' && showMoreFilters && (
        <div
          data-slot="extended-filters-panel"
          className="mt-4 p-5 bg-white border border-[#EDE8E1] rounded-[16px] shadow-sm space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E1]">
            <h4 className="font-bold text-[15px] text-[#111827] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#F15A24]" />
              Detailed Package Filters
            </h4>
            <button
              type="button"
              onClick={() => setShowMoreFilters(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#5B6472] hover:text-[#111827] hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {/* Price Range */}
            {options.priceRange && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Price Range (BDT)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    aria-label="Minimum price"
                    value={filters.minPrice ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      onFilterChange({ ...filters, minPrice: val, page: 1 });
                    }}
                    className="w-full h-[38px] px-2.5 rounded-xl border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                  />
                  <span className="text-[#5B6472]">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    aria-label="Maximum price"
                    value={filters.maxPrice ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      onFilterChange({ ...filters, maxPrice: val, page: 1 });
                    }}
                    className="w-full h-[38px] px-2.5 rounded-xl border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                  />
                </div>
                {options.priceRange.hasAskForPrice && (
                  <label className="flex items-center gap-2 pt-1 text-[13px] text-[#5B6472] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.includeAskForPrice)}
                      onChange={(e) => onFilterChange({ ...filters, includeAskForPrice: e.target.checked, page: 1 })}
                      className="rounded border-[#EDE8E1] text-[#F15A24] focus:ring-[#F15A24]"
                    />
                    Include "Ask for price" packages
                  </label>
                )}
              </div>
            )}

            {/* Storage Size */}
            {options.storageSizes && options.storageSizes.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Storage Size
                </label>
                <div className="relative">
                  <select
                    value={filters.storage || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, storage: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Storage Sizes</option>
                    {options.storageSizes.map((s) => (
                      <option key={s.value} value={s.value} disabled={s.disabled}>
                        {s.label} ({s.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Recorder Channels */}
            {options.recorderChannels && options.recorderChannels.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Recorder Channels
                </label>
                <div className="relative">
                  <select
                    value={filters.channels || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, channels: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Recorder Sizes</option>
                    {options.recorderChannels.map((c) => (
                      <option key={c.value} value={c.value} disabled={c.disabled}>
                        {c.label} ({c.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Camera Type */}
            {options.cameraTypes && options.cameraTypes.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Camera Form Factor
                </label>
                <div className="relative">
                  <select
                    value={filters.cameraType || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, cameraType: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Camera Types</option>
                    {options.cameraTypes.map((t) => (
                      <option key={t.value} value={t.value} disabled={t.disabled}>
                        {t.label} ({t.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Resolution */}
            {options.resolutions && options.resolutions.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Resolution
                </label>
                <div className="relative">
                  <select
                    value={filters.resolution || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, resolution: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Resolutions</option>
                    {options.resolutions.map((r) => (
                      <option key={r.value} value={r.value} disabled={r.disabled}>
                        {r.label} ({r.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Audio */}
            {options.audioOptions && options.audioOptions.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Audio
                </label>
                <div className="relative">
                  <select
                    value={filters.audio || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, audio: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Audio Options</option>
                    {options.audioOptions.map((a) => (
                      <option key={a.value} value={a.value} disabled={a.disabled}>
                        {a.label} ({a.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Brand */}
            {options.brands && options.brands.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Brand
                </label>
                <div className="relative">
                  <select
                    value={filters.brand || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, brand: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Brands</option>
                    {options.brands.map((b) => (
                      <option key={b.value} value={b.value} disabled={b.disabled}>
                        {b.label} ({b.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Tag */}
            {options.tags && options.tags.length >= 2 && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Tag / Tier
                </label>
                <div className="relative">
                  <select
                    value={filters.tag || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, tag: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Tags</option>
                    {options.tags.map((t) => (
                      <option key={t.value} value={t.value} disabled={t.disabled}>
                        {t.label} ({t.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Installation */}
            {options.installationOptions && (
              <div className="space-y-2">
                <label className="text-[13px] uppercase font-semibold text-[#5B6472]">
                  Installation
                </label>
                <div className="relative">
                  <select
                    value={filters.installation || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, installation: e.target.value, page: 1 })}
                    className="w-full h-[38px] pl-3 pr-8 rounded-xl bg-white border border-[#EDE8E1] text-[14px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#F15A24] cursor-pointer appearance-none"
                  >
                    <option value="all">All Packages</option>
                    <option value="available">Installation Available</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#5B6472] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE FILTER CHIPS (Removable chips under the bar with "Clear all") */}
      {variant === 'full' && isFilterActive && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[13px] font-semibold text-[#5B6472]">Active filters:</span>

          {filters.systemSlug && filters.systemSlug !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, systemSlug: 'all', page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>System: {options.systemTypes.find(s => s.slug === filters.systemSlug)?.shortLabel || filters.systemSlug}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.cameraCount && filters.cameraCount !== 'All' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, cameraCount: 'All', page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>{filters.cameraCount} cameras</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.nightViewSlug && filters.nightViewSlug !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, nightViewSlug: 'all', page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Night vision: {options.nightViews.find(s => s.slug === filters.nightViewSlug)?.label || filters.nightViewSlug}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.minPrice != null && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, minPrice: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Min BDT {filters.minPrice.toLocaleString()}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.maxPrice != null && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, maxPrice: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Max BDT {filters.maxPrice.toLocaleString()}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.storage && filters.storage !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, storage: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Storage: {filters.storage.toUpperCase()}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.channels && filters.channels !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, channels: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>{filters.channels}-Channel</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.cameraType && filters.cameraType !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, cameraType: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Type: {filters.cameraType}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.resolution && filters.resolution !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, resolution: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Resolution: {filters.resolution.toUpperCase()}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.brand && filters.brand !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, brand: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Brand: {filters.brand}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.tag && filters.tag !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, tag: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Tag: {filters.tag}</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          {filters.installation && filters.installation !== 'all' && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, installation: undefined, page: 1 })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-[13px] font-medium transition-colors"
            >
              <span>Installation available</span>
              <X className="w-3 h-3 text-[#5B6472]" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="text-[13px] font-semibold text-[#F15A24] hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
