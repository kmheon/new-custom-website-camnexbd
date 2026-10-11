import React from 'react';

/**
 * 7 Canonical Named Slots for Equal-Height Cards:
 * 1. media: Image / graphic container with consistent aspect ratio
 * 2. meta: Brand chip, category, model number, badges
 * 3. title: Clamped title with clean ellipsis
 * 4. description: Clamped description or reserved slot
 * 5. details: Highlights / component list with reserved slot for extra lines
 * 6. price: Price block with reserved old-price line
 * 7. actions: CTA buttons pinned to bottom
 */

export interface CardSlotProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const CardContainer: React.FC<CardSlotProps & { 'data-card-id'?: string; 'data-product-id'?: string; 'data-package-id'?: string; role?: string; tabIndex?: number }> = ({
  children,
  className = '',
  onClick,
  'data-card-id': dataCardId,
  'data-product-id': dataProductId,
  'data-package-id': dataPackageId,
  role,
  tabIndex
}) => {
  return (
    <div
      role={role}
      tabIndex={tabIndex}
      data-card-id={dataCardId}
      data-product-id={dataProductId}
      data-package-id={dataPackageId}
      onClick={onClick}
      className={`card-item-fixed bg-white rounded-2xl border border-[#EDE8E1] p-4 sm:p-5 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative cursor-pointer group flex flex-col h-full min-w-0 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardMediaSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-media mb-3 relative overflow-hidden rounded-xl ${className}`}>
    {children}
  </div>
);

export const CardMetaSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-meta mb-1.5 flex items-center justify-between gap-2 min-h-[22px] min-w-0 ${className}`}>
    {children || <span className="invisible select-none" aria-hidden="true">&nbsp;</span>}
  </div>
);

export const CardTitleSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-title mb-2 min-w-0 ${className}`}>
    {children}
  </div>
);

export const CardDescriptionSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-description mb-3 min-w-0 ${className}`}>
    {children || <div className="invisible select-none h-4" aria-hidden="true">&nbsp;</div>}
  </div>
);

export const CardDetailsSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-details mb-4 min-w-0 ${className}`}>
    {children || <div className="invisible select-none" aria-hidden="true">&nbsp;</div>}
  </div>
);

export const CardPriceSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-price pt-3 border-t border-[#EDE8E1]/80 mb-3 min-w-0 ${className}`}>
    {children}
  </div>
);

export const CardActionsSlot: React.FC<CardSlotProps> = ({ children, className = '' }) => (
  <div className={`card-slot-actions mt-auto min-w-0 ${className}`}>
    {children}
  </div>
);
