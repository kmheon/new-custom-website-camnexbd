import React, { useRef, forwardRef, useState, useEffect, useCallback } from 'react';
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkScroll = useCallback(() => {
    const el = targetRef && 'current' in targetRef ? targetRef.current : null;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth + 4;
      setIsOverflowing(hasOverflow);
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  }, [targetRef]);

  useEffect(() => {
    checkScroll();
    const el = targetRef && 'current' in targetRef ? targetRef.current : null;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      const timer = setTimeout(checkScroll, 100);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [checkScroll, children, itemCount, targetRef]);

  const scroll = (direction: 'left' | 'right') => {
    const el = targetRef && 'current' in targetRef ? targetRef.current : null;
    if (el) {
      const cardWidth = el.clientWidth >= 1024 ? (el.clientWidth - 3 * 16) / 4 : (el.clientWidth - 2 * 16) / 3;
      const offset = direction === 'left' ? -cardWidth * 1.5 : cardWidth * 1.5;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className={`card-row-wrapper relative w-full ${className}`}>
      {/* Round arrow controls: appear ONLY when the row overflows */}
      {showArrows && isOverflowing && (
        <div className="hidden sm:flex items-center gap-2 absolute -top-14 right-0 z-20">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#EDE8E1] text-[#111827] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-2xs hover:shadow-sm transition-all focus:outline-none cursor-pointer"
            aria-label="Scroll cards left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#EDE8E1] text-[#111827] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shadow-2xs hover:shadow-sm transition-all focus:outline-none cursor-pointer"
            aria-label="Scroll cards right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scroller with:
          display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x proximity; align-items: stretch;
          padding-block: 24px top / 32px bottom with matching negative margins -mt-6 -mb-8 */}
      <div
        ref={targetRef as any}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="card-row-scroller no-scrollbar pt-6 pb-8 -mt-6 -mb-8 px-4 -mx-4 scroll-px-4 focus:outline-none flex items-stretch gap-4 overflow-x-auto [scroll-snap-type:x_proximity]"
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
