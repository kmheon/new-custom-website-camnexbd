import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, PromoTileConfig } from '../../types';
import { SectionHeader } from './SectionHeader';
import { ProductCard } from './ProductCard';
import { PromoTile } from './PromoTile';

import { CardRow } from '../cards/CardRow';

interface ProductRowProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  actionText?: string;
  onAction?: () => void;
  onNavigate: (route: string, param?: string) => void;
  variant?: 'canvas' | 'panel';
  promoTile?: PromoTileConfig;
  filterSlot?: React.ReactNode;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  eyebrow,
  title,
  subtitle,
  products,
  actionText,
  onAction,
  onNavigate,
  variant = 'canvas',
  promoTile,
  filterSlot
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasPromoTile = Boolean(promoTile && (promoTile.enabled !== false) && promoTile.headline);
  const totalItems = (products ? products.length : 0) + (hasPromoTile ? 1 : 0);
  if (!products || totalItems <= 1) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const content = (
    <div>
      {/* Header with Navigation Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actionText={actionText}
          onAction={onAction}
          className="mb-0"
        />

        {/* Desktop Arrow Controls: ONLY when more than 4 items */}
        {totalItems > 4 && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0 self-end">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#EDE8E1] text-[#111827] flex items-center justify-center shadow-2xs hover:shadow-sm transition-all focus:outline-none"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-[#EDE8E1] text-[#111827] flex items-center justify-center shadow-2xs hover:shadow-sm transition-all focus:outline-none"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Optional Filter Slot (e.g. Subcategory filter chips) */}
      {filterSlot && (
        <div className="mb-6 min-h-[44px]" data-slot="product-row-filter">
          {filterSlot}
        </div>
      )}

      {/* Mobile Strip variant (below 768px): banner above the scroll row */}
      {hasPromoTile && promoTile && (
        <div className="md:hidden mb-4">
          <PromoTile
            config={promoTile}
            categoryName={title}
            onNavigate={onNavigate}
            isMobileStrip={true}
          />
        </div>
      )}

      {/* Horizontal Container using CardRow */}
      <CardRow
        scrollerRef={scrollRef}
        itemCount={totalItems}
        showArrows={false}
        aria-label={title}
      >
        {/* Desktop / Tablet Promo Tile: visible md (768px) and up, exactly one card wide */}
        {hasPromoTile && promoTile && (
          <PromoTile
            config={promoTile}
            categoryName={title}
            onNavigate={onNavigate}
            isMobileStrip={false}
            className="hidden md:flex"
          />
        )}

        {/* Product Cards: at most 2 Hot badges per row */}
        {(() => {
          let hotCount = 0;
          return products.map((prod) => {
            const hasSale = typeof prod.pricing?.salePrice === 'number' &&
              prod.pricing.salePrice > 0 &&
              typeof prod.pricing?.regularPrice === 'number' &&
              prod.pricing.salePrice < prod.pricing.regularPrice;
            const isFlaggedHot = Boolean(prod.isFeatured || (prod as any).isHot);
            let allowHot = true;
            if (!hasSale && isFlaggedHot) {
              if (hotCount >= 2) {
                allowHot = false;
              } else {
                hotCount++;
              }
            }

            return (
              <ProductCard
                key={prod.id}
                product={prod}
                onNavigate={onNavigate}
                allowHot={allowHot}
                className="snap-start"
              />
            );
          });
        })()}
      </CardRow>
    </div>
  );


  if (variant === 'panel') {
    return (
      <section className="w-full bg-white py-12 md:py-[72px] border-y border-[#EDE8E1]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {content}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#FAF7F2] py-12 md:py-[72px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
};

