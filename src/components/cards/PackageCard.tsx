import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Info, X } from 'lucide-react';
import { SecurityPackage } from '../../types';
import {
  CardContainer,
  CardMediaSlot,
  CardMetaSlot,
  CardTitleSlot,
  CardDetailsSlot,
  CardPriceSlot,
  CardActionsSlot
} from './CardSlots';
import { Term } from '../common/Term';

export interface PackageCardProps {
  pkg: SecurityPackage;
  onNavigate: (route: string, param?: string) => void;
  renderSvgFallback?: (pkg: SecurityPackage) => React.ReactNode;
}

// Generate concise summary line from package specifications
function generatePackageSummary(pkg: SecurityPackage): string {
  const parts: string[] = [];
  if (pkg.cameraCount) {
    parts.push(`${pkg.cameraCount} cameras`);
  }
  const sys = (pkg.systemType || '').toLowerCase();
  const inclusions = pkg.inclusions || [];
  if (sys.includes('ip') || inclusions.some(i => i.toLowerCase().includes('nvr'))) {
    parts.push('1 NVR recorder');
  } else if (sys.includes('analogue') || inclusions.some(i => i.toLowerCase().includes('dvr'))) {
    parts.push('1 DVR recorder');
  }
  const storageItem = inclusions.find(i => /\b\d+\s*(tb|gb)\b/i.test(i));
  if (storageItem) {
    const match = storageItem.match(/\b\d+\s*(tb|gb)\b/i);
    if (match) parts.push(`${match[0].toUpperCase()} storage`);
  } else if (pkg.cameraCount) {
    const est = pkg.cameraCount >= 16 ? '2 TB' : pkg.cameraCount >= 8 ? '1 TB' : '500 GB';
    parts.push(`${est} storage`);
  }
  if (pkg.cameraCount && !sys.includes('wireless') && !sys.includes('wi-fi')) {
    parts.push(`${pkg.cameraCount * 10} m cable`);
  }
  return parts.join(', ') || 'Camera set with recorder, storage and cables';
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onNavigate,
  renderSvgFallback
}) => {
  const [showInclusionsModal, setShowInclusionsModal] = useState(false);
  const isQuoteOnly = Boolean(pkg.isQuoteOnly || (pkg.cameraCount && pkg.cameraCount >= 32));
  
  const allInclusions = (pkg.inclusions && pkg.inclusions.length > 0)
    ? pkg.inclusions
    : (pkg.rules && pkg.rules.length > 0)
      ? pkg.rules.map((r: any) => r.name)
      : ['Camera unit', 'Matching recorder', 'Surveillance storage', 'Cables & connectors'];

  const top3Items = allInclusions.slice(0, 3);
  const summaryLine = generatePackageSummary(pkg);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isQuoteOnly) {
      onNavigate('quote');
    } else {
      onNavigate('packages', pkg.slug);
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInclusionsModal(true);
  };

  return (
    <>
      <CardContainer
        data-card-id={pkg.id}
        data-package-id={pkg.id}
        onClick={() => onNavigate('packages', pkg.slug)}
        className="group/pkg"
      >
        {/* 1. MEDIA SLOT (aspect 16/10, max 140px tall) */}
        <CardMediaSlot>
          <div className="aspect-[16/10] max-h-[140px] w-full bg-[#F4EEE6] rounded-xl flex items-center justify-center p-3 overflow-hidden relative">
            {pkg.image ? (
              <img
                src={pkg.image}
                alt={pkg.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : renderSvgFallback ? (
              renderSvgFallback(pkg)
            ) : (
              <div className="text-xs font-bold text-slate-400">{pkg.name}</div>
            )}
          </div>
        </CardMediaSlot>

        {/* 2. META SLOT (tag chip and camera count row) */}
        <CardMetaSlot>
          <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F15A24] px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
            <Term text={pkg.technologyLabel || pkg.seriesName || pkg.badge || 'Complete Set'}>
              {pkg.technologyLabel || pkg.seriesName || pkg.badge || 'Complete Set'}
            </Term>
          </span>
          <span className="text-[11px] font-bold text-[#5B6472] shrink-0">
            {pkg.cameraCount ? `${pkg.cameraCount} Camera set` : 'Camera set'}
          </span>
        </CardMetaSlot>

        {/* 3. TITLE SLOT (Clamped to 2 lines) */}
        <CardTitleSlot>
          <h3
            className="font-heading font-bold text-base text-[#111827] group-hover:text-[#F15A24] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]"
            title={pkg.name}
          >
            {pkg.name}
          </h3>
        </CardTitleSlot>

        {/* 4. SUMMARY LINE (Generated from data, at most 2 lines, reserved height) */}
        <div className="mb-2 min-h-[2.2rem]">
          <p className="text-xs text-[#5B6472] leading-snug line-clamp-2 font-medium">
            {summaryLine}
          </p>
        </div>

        {/* 5. TOP 3 INCLUDED ITEMS & "See what's included" button */}
        <CardDetailsSlot className="mb-3">
          <div className="py-2 border-y border-[#EDE8E1] text-xs space-y-1 min-h-[92px] flex flex-col justify-between">
            <div className="space-y-1">
              {top3Items.map((item: string, rIdx: number) => (
                <div key={rIdx} className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
                  <span className="truncate text-[11px] font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleOpenModal}
              className="text-[11px] font-bold text-[#F15A24] hover:underline flex items-center gap-1 pt-1 self-start cursor-pointer focus:outline-none"
            >
              <Info className="w-3 h-3" />
              <span>See what's included ({allInclusions.length} items)</span>
            </button>
          </div>
        </CardDetailsSlot>

        {/* 6. PRICE SLOT (Pinned to bottom with mt-auto) */}
        <CardPriceSlot className="mt-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6472] block min-h-[14px]">
            {isQuoteOnly ? 'Pricing' : 'Starting From'}
          </span>
          <div className="text-xl font-black text-[#111827] font-heading min-h-[28px] flex items-baseline">
            {isQuoteOnly || !pkg.basePrice ? (
              <span>Ask for price</span>
            ) : (
              <span>৳{pkg.basePrice.toLocaleString()}</span>
            )}
          </div>
        </CardPriceSlot>

        {/* 7. ACTIONS SLOT */}
        <CardActionsSlot>
          <button
            type="button"
            onClick={handleAction}
            className="w-full min-h-[42px] py-2 px-4 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
          >
            <span>{isQuoteOnly ? 'Ask for price' : 'Customize package'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </CardActionsSlot>
      </CardContainer>

      {/* Popover / Dialog for "See what's included" */}
      {showInclusionsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`inclusions-title-${pkg.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowInclusionsModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F15A24]">
                  Included in Package
                </span>
                <h4 id={`inclusions-title-${pkg.id}`} className="font-heading font-bold text-base text-[#111827]">
                  {pkg.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowInclusionsModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 text-xs">
              {allInclusions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Official Bangladesh warranty included
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowInclusionsModal(false);
                  onNavigate('packages', pkg.slug);
                }}
                className="px-4 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-full transition shadow-xs cursor-pointer"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
