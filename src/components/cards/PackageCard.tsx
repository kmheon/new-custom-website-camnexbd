import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SecurityPackage } from '../../types';
import {
  CardContainer,
  CardMediaSlot,
  CardMetaSlot,
  CardTitleSlot,
  CardDescriptionSlot,
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

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onNavigate,
  renderSvgFallback
}) => {
  const isQuoteOnly = Boolean(pkg.isQuoteOnly || (pkg.cameraCount && pkg.cameraCount >= 32));
  
  const items = (pkg.inclusions && pkg.inclusions.length > 0)
    ? pkg.inclusions
    : (pkg.rules && pkg.rules.length > 0)
      ? pkg.rules.map((r: any) => r.name)
      : ['Standard components included'];

  const displayItems = items.slice(0, 4);
  const extraCount = items.length - 4;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isQuoteOnly) {
      onNavigate('quote');
    } else {
      onNavigate('packages', pkg.slug);
    }
  };

  return (
    <CardContainer
      data-card-id={pkg.id}
      data-package-id={pkg.id}
      onClick={() => onNavigate('packages', pkg.slug)}
      className="group/pkg"
    >
      {/* 1. MEDIA SLOT */}
      <CardMediaSlot>
        {pkg.image ? (
          <div className="h-36 sm:h-44 bg-[#F4EEE6] rounded-xl flex items-center justify-center p-3 overflow-hidden">
            <img
              src={pkg.image}
              alt={pkg.name}
              className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ) : renderSvgFallback ? (
          renderSvgFallback(pkg)
        ) : (
          <div className="h-36 sm:h-44 bg-[#F4EEE6] rounded-xl flex items-center justify-center p-3 text-slate-400">
            <span className="text-xs font-bold">{pkg.name}</span>
          </div>
        )}
      </CardMediaSlot>

      {/* 2. META SLOT */}
      <CardMetaSlot>
        <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F15A24] px-2.5 py-0.5 rounded-full truncate max-w-[170px]">
          <Term text={pkg.technologyLabel || pkg.seriesName || pkg.badge || 'Complete Set'}>
            {pkg.technologyLabel || pkg.seriesName || pkg.badge || 'Complete Set'}
          </Term>
        </span>
        <span className="text-[11px] font-bold text-[#5B6472] shrink-0">
          {pkg.cameraCount ? `${pkg.cameraCount} Camera set` : 'Camera set'}
        </span>
      </CardMetaSlot>

      {/* 3. TITLE SLOT (Clamped to 2 lines, clean ellipsis) */}
      <CardTitleSlot>
        <h3
          className="font-heading font-bold text-base sm:text-lg text-[#111827] group-hover:text-[#F15A24] transition-colors leading-tight line-clamp-2 min-h-[2.8rem]"
          title={pkg.name}
        >
          {pkg.name}
        </h3>
      </CardTitleSlot>

      {/* 4. DESCRIPTION SLOT (Clamped to 2 lines, clean ellipsis) */}
      <CardDescriptionSlot>
        <p className="text-xs text-[#5B6472] leading-relaxed line-clamp-2 min-h-[2.4rem] [overflow-wrap:anywhere] break-words">
          {pkg.description || ''}
        </p>
      </CardDescriptionSlot>

      {/* 5. DETAILS SLOT (Components with reserved slot for '+N more parts' line) */}
      <CardDetailsSlot>
        <div className="py-2.5 border-y border-[#EDE8E1] text-xs text-[#111827] min-h-[104px] flex flex-col justify-center space-y-1.5">
          {displayItems.map((item: string, rIdx: number) => (
            <div key={rIdx} className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
              <span className="truncate text-[11px] font-medium text-slate-700">{item}</span>
            </div>
          ))}

          {/* Reserved row: visibility:hidden when extraCount <= 0 so all cards stay equal height */}
          <div className="text-[10px] font-bold text-[#F15A24] pl-5.5 min-h-[16px] flex items-center">
            {extraCount > 0 ? (
              <span>+{extraCount} more parts</span>
            ) : (
              <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
            )}
          </div>
        </div>
      </CardDetailsSlot>

      {/* 6. PRICE SLOT (Reserved label and value) */}
      <CardPriceSlot>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6472] block min-h-[15px]">
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
          className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
        >
          <span>{isQuoteOnly ? 'Ask for price' : 'Customize package'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </CardActionsSlot>
    </CardContainer>
  );
};
