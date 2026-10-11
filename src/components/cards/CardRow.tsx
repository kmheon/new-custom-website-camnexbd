import React, { useRef, forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CardRowProps {
  children: React.ReactNode;
  itemCount?: number;
  className?: string;
  showArrows?: boolean;
  'aria-label'?: string;
  scrollerRef?: React.RefObject<HTMLDivElement | null>;
}

export const CardRow = forwardRef<HTMLDivElement, CardRowProps>(({
  children,
  itemCount = 0,
  className = '',
  showArrows = true,
  'aria-label': ariaLabel = 'Horizontal card list',
  scrollerRef
}, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  const targetRef = scrollerRef || (ref as React.RefObject<HTMLDivElement | null>) || localRef;

  const scroll = (direction: 'left' | 'right') => {
    if (targetRef && 'current' in targetRef && targetRef.current) {
      const cardWidth = 320;
      const offset = direction === 'left' ? -cardWidth : cardWidth;
      targetRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const hasOverflow = itemCount > 4;

  return (
    <div className={`card-row-wrapper relative w-full ${className}`}>
      {/* Arrow Controls Container (if header didn't render them and arrows enabled) */}
      {showArrows && hasOverflow && (
        <div className="hidden sm:flex items-center gap-2 absolute -top-16 right-0 z-20">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#EDE8E1] text-[#111827] flex items-center justify-center shadow-2xs hover:shadow-sm transition-all focus:outline-none cursor-pointer"
            aria-label="Scroll cards left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#EDE8E1] text-[#111827] flex items-center justify-center shadow-2xs hover:shadow-sm transition-all focus:outline-none cursor-pointer"
            aria-label="Scroll cards right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scroller with 24px Top and 32px Bottom Padding-Block and Matching Negative Margins
          This ensures hover translateY and box-shadow are never clipped in any direction */}
      <div
        ref={targetRef as any}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={`card-row-scroller card-subgrid-row no-scrollbar pt-6 pb-8 -mt-6 -mb-8 px-3 -mx-3 scroll-px-3 focus:outline-none flex items-stretch gap-5 ${
          itemCount > 4 ? 'overflow-x-auto snap-x snap-mandatory' : 'overflow-x-hidden'
        } ${itemCount < 4 ? 'justify-center' : ''}`}
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        {children}
      </div>
    </div>
  );
});

CardRow.displayName = 'CardRow';
