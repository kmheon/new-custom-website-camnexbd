import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { SectionHeader } from './SectionHeader';
import { ProductCard } from './ProductCard';

import { CardRow } from '../cards/CardRow';

export interface LeadInConfig {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  subcategories?: { id?: string; name: string; slug?: string }[];
  bullets?: string[];
  buttonText?: string;
  link?: string;
}

interface ProductRowProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  actionText?: string;
  onAction?: () => void;
  onNavigate: (route: string, param?: string) => void;
  variant?: 'canvas' | 'panel';
  promoTile?: LeadInConfig;
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
  promoTile
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalItems = (products ? products.length : 0) + (promoTile ? 1 : 0);
  if (!products || totalItems <= 1) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleLeadInNavigate = () => {
    if (promoTile?.link?.startsWith('/category/')) {
      onNavigate('category', promoTile.link.replace('/category/', ''));
    } else if (promoTile?.link?.startsWith('/packages')) {
      onNavigate('packages');
    } else {
      onNavigate('catalog');
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

      {/* On mobile: Lead-in becomes a heading line / banner above the scroll row */}
      {promoTile && (
        <div className="sm:hidden mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#F4EEE6] to-orange-50/60 border border-[#EDE8E1] flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {promoTile.badge && (
                <span className="inline-block px-2.5 py-0.5 bg-[#F15A24] text-white text-[9px] font-black uppercase tracking-wider rounded-full mb-1">
                  {promoTile.badge}
                </span>
              )}
              <h3 className="text-base font-bold text-[#111827] font-heading truncate">
                {promoTile.title}
              </h3>
              <p className="text-xs text-[#5B6472] line-clamp-1">
                {promoTile.subtitle || promoTile.description}
              </p>
            </div>
            {promoTile.image && (
              <img
                src={promoTile.image}
                alt=""
                className="w-14 h-14 object-contain flex-shrink-0 bg-white/70 rounded-xl p-1 border border-orange-100"
              />
            )}
          </div>
          {promoTile.subcategories && promoTile.subcategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {promoTile.subcategories.slice(0, 4).map((sc, i) => (
                <button
                  key={sc.id || i}
                  type="button"
                  onClick={() => sc.slug && onNavigate('category', sc.slug)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 border border-[#EDE8E1] text-[#374151]"
                >
                  {sc.name}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleLeadInNavigate}
            className="w-full py-2 bg-[#F15A24] text-white text-xs font-bold rounded-full flex items-center justify-center gap-1 shadow-xs"
          >
            <span>{promoTile.buttonText || 'View all'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Horizontal Container using CardRow */}
      <CardRow
        scrollerRef={scrollRef}
        itemCount={totalItems}
        showArrows={false}
        aria-label={title}
      >
        {/* Filled Lead-in Panel (Desktop/Tablet): visible sm and up, exactly one card wide */}
        {promoTile && (
          <div className="lead-in-tile card-item-fixed snap-start hidden sm:flex bg-gradient-to-br from-[#F4EEE6] to-orange-50/60 rounded-2xl border border-[#EDE8E1] p-4 flex-col justify-between shadow-2xs">
            {/* Top: Category Title, Subtitle, and Badge */}
            <div>
              {promoTile.badge && (
                <span className="inline-block px-3 py-1 bg-[#F15A24] text-white text-[10px] font-black uppercase tracking-wider rounded-full mb-2">
                  {promoTile.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-[#111827] font-heading mb-1 [overflow-wrap:anywhere] break-words">
                {promoTile.title}
              </h3>
              <p className="text-xs text-[#5B6472] leading-snug line-clamp-2 [overflow-wrap:anywhere] break-words">
                {promoTile.subtitle || promoTile.description}
              </p>
            </div>

            {/* Middle: Category Image, Subcategory Chips, Bullets */}
            <div className="my-auto py-2 flex flex-col items-center">
              {/* Category Image with permanent illustration fallback */}
              <div className="w-full h-24 flex items-center justify-center p-2 mb-2 relative">
                {promoTile.image ? (
                  <img
                    src={promoTile.image}
                    alt={promoTile.title}
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.lead-in-fallback-svg');
                      if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`lead-in-fallback-svg w-16 h-16 rounded-2xl bg-orange-100/70 border border-orange-200/80 items-center justify-center text-[#F15A24] ${
                    promoTile.image ? 'hidden' : 'flex'
                  }`}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Up to 4 chips built from real subcategories (hidden when none) */}
              {promoTile.subcategories && promoTile.subcategories.length > 0 && (
                <div className="w-full flex flex-wrap gap-1.5 justify-start mb-2.5">
                  {promoTile.subcategories.slice(0, 4).map((sc, i) => (
                    <button
                      key={sc.id || i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (sc.slug) onNavigate('category', sc.slug);
                      }}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/90 border border-[#EDE8E1] text-[#374151] hover:border-[#F15A24] hover:text-[#F15A24] transition-colors"
                    >
                      {sc.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Up to 3 admin-entered bullet points (max 60 chars each, hidden when empty) */}
              {promoTile.bullets && promoTile.bullets.length > 0 && (
                <ul className="w-full space-y-1 mb-1">
                  {promoTile.bullets.slice(0, 3).filter(b => Boolean(b && b.trim())).map((bullet, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#4B5563] leading-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24] flex-shrink-0 mt-1" />
                      <span className="line-clamp-1">{bullet.slice(0, 60)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bottom: Pinned Action Button */}
            <button
              type="button"
              onClick={handleLeadInNavigate}
              className="mt-2 w-full py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{promoTile.buttonText || 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

