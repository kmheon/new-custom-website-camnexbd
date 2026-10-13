import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Subcategory } from '../../types';

export const normalizeWifiSlug = (param: string | null): string => {
  if (!param) return 'all';
  const s = param.toLowerCase().trim();
  if (s === 'all' || !s) return 'all';
  if (s === 'doorbell' || s === 'doorbells' || s === 'video-doorbells') return 'video-doorbells';
  if (s === 'camera' || s === 'cameras' || s === 'wifi-cameras') return 'wifi-cameras';
  if (s === 'light' || s === 'lights' || s === 'smart-lights') return 'smart-lights';
  if (s === 'plug' || s === 'plugs' || s === 'smart-plugs' || s === 'smart-plugs-switches') return 'smart-plugs-switches';
  if (s === 'lock' || s === 'locks' || s === 'smart-locks') return 'smart-locks';
  if (s === 'sensor' || s === 'sensors' || s === 'alarm' || s === 'alarms' || s === 'sensors-alarms') return 'sensors-alarms';
  return s;
};

export const toWifiUrlParam = (slug: string): string => {
  if (slug === 'video-doorbells') return 'doorbells';
  if (slug === 'wifi-cameras') return 'cameras';
  if (slug === 'smart-lights') return 'lights';
  if (slug === 'smart-plugs-switches') return 'plugs';
  if (slug === 'smart-locks') return 'locks';
  if (slug === 'sensors-alarms') return 'sensors';
  return slug;
};

export interface WifiSubcategoryChipsProps {
  subcategories: Subcategory[];
  activeSlug: string;
  onSelect: (slug: string) => void;
  totalCount: number;
  countsBySlug: Record<string, number>;
}

export const WifiSubcategoryChips: React.FC<WifiSubcategoryChipsProps> = ({
  subcategories,
  activeSlug,
  onSelect,
  totalCount,
  countsBySlug
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter subcategories to those with products > 0 and enabled !== false
  const activeSubcats = subcategories.filter(
    (sc) => (sc.enabled !== false) && (countsBySlug[sc.slug] || 0) > 0
  );

  // Chip options: 'All' + active subcategories
  const allOption = { id: 'all', name: 'All', slug: 'all', count: totalCount };
  const subcatOptions = activeSubcats.map((sc) => ({
    id: sc.id,
    name: sc.name,
    slug: sc.slug,
    count: countsBySlug[sc.slug] || 0
  }));

  const totalOptions = [allOption, ...subcatOptions];

  // If > 6 options total: first 5 direct chips + More dropdown for remaining
  const maxDirectChips = 6;
  const hasMore = totalOptions.length > maxDirectChips;
  const directChips = hasMore ? totalOptions.slice(0, 5) : totalOptions;
  const moreOptions = hasMore ? totalOptions.slice(5) : [];

  const isMoreSelected = moreOptions.some((opt) => opt.slug === activeSlug);

  return (
    <div className="w-full min-h-[44px] flex items-center" data-slot="wifi-chips-container">
      {/* 1. DESKTOP / TABLET (>=768px): One line of chips, no wrap, no scroll */}
      <div
        className="hidden md:flex items-center gap-2 overflow-x-hidden flex-nowrap w-full"
        data-slot="wifi-chips-desktop"
      >
        {directChips.map((opt) => {
          const isSelected = activeSlug === opt.slug || (opt.slug === 'all' && (!activeSlug || activeSlug === 'all'));
          return (
            <button
              key={opt.id}
              type="button"
              role="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(opt.slug)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F15A24] ${
                isSelected
                  ? 'bg-[#F15A24] text-white shadow-2xs border border-[#F15A24]'
                  : 'bg-white text-slate-700 hover:text-[#111827] border border-[#EDE8E1] hover:border-[#F15A24]'
              }`}
              data-wifi-chip={opt.slug}
              data-wifi-param={toWifiUrlParam(opt.slug)}
            >
              <span>{opt.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}

        {/* More Dropdown for 6th+ subcategories */}
        {hasMore && (
          <div className="relative shrink-0" ref={moreRef}>
            <button
              type="button"
              role="button"
              aria-pressed={isMoreSelected}
              aria-haspopup="true"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(!moreOpen)}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F15A24] ${
                isMoreSelected
                  ? 'bg-[#F15A24] text-white shadow-2xs border border-[#F15A24]'
                  : 'bg-white text-slate-700 hover:text-[#111827] border border-[#EDE8E1] hover:border-[#F15A24]'
              }`}
              data-wifi-chip="more"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {moreOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-[#EDE8E1] py-1.5 z-30">
                {moreOptions.map((opt) => {
                  const isSelected = activeSlug === opt.slug;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        onSelect(opt.slug);
                        setMoreOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50 font-bold text-[#F15A24]'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#111827]'
                      }`}
                      data-wifi-chip={opt.slug}
                      data-wifi-param={toWifiUrlParam(opt.slug)}
                    >
                      <span>{opt.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-bold">
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. MOBILE (<768px): Native select */}
      <div className="md:hidden w-full" data-slot="wifi-chips-mobile">
        <div className="relative w-full">
          <select
            value={activeSlug || 'all'}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Filter Wi-Fi series subcategory"
            className="w-full h-11 bg-white border border-[#EDE8E1] rounded-xl px-3.5 pr-10 text-xs font-bold text-[#111827] appearance-none focus:outline-none focus:border-[#F15A24] focus:ring-2 focus:ring-[#F15A24]/20 shadow-2xs"
            data-wifi-select
          >
            {totalOptions.map((opt) => (
              <option key={opt.id} value={opt.slug} data-wifi-option={opt.slug} data-wifi-param={toWifiUrlParam(opt.slug)}>
                {opt.name} ({opt.count})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

