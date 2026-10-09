import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { SectionHeader } from './SectionHeader';
import { ProductCard } from './ProductCard';

interface ProductRowProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  actionText?: string;
  onAction?: () => void;
  onNavigate: (route: string, param?: string) => void;
  variant?: 'canvas' | 'panel';
  promoTile?: {
    title: string;
    description: string;
    badge?: string;
    buttonText?: string;
    link?: string;
  };
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

  const content = (
    <div>
      {/* Header with Navigation Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
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

      {/* Horizontal Container (exact 4-card fit desktop, scroll with arrows only when > 4) */}
      <div
        ref={scrollRef}
        className={`flex gap-5 no-scrollbar ${
          totalItems > 4 ? 'overflow-x-auto snap-x snap-mandatory' : 'overflow-x-hidden'
        } ${totalItems < 4 ? 'justify-center' : ''}`}
      >
        {/* Optional Promo Tile as First Item */}
        {promoTile && (
          <div className={`snap-start ${
            totalItems < 4 ? 'w-[260px] sm:w-[280px]' : 'w-[260px] sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]'
          } flex-shrink-0 min-w-0 bg-gradient-to-br from-[#F4EEE6] to-orange-50/60 rounded-[20px] border border-[#EDE8E1] p-6 flex flex-col justify-between shadow-2xs`}>
            <div>
              {promoTile.badge && (
                <span className="inline-block px-3 py-1 bg-[#F15A24] text-white text-[10px] font-black uppercase tracking-wider rounded-full mb-3">
                  {promoTile.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-[#111827] font-heading mb-2 [overflow-wrap:anywhere] break-words">
                {promoTile.title}
              </h3>
              <p className="text-xs text-[#5B6472] leading-relaxed [overflow-wrap:anywhere] break-words">
                {promoTile.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (promoTile.link?.startsWith('/category/')) {
                  onNavigate('category', promoTile.link.replace('/category/', ''));
                } else if (promoTile.link?.startsWith('/packages')) {
                  onNavigate('packages');
                } else {
                  onNavigate('catalog');
                }
              }}
              className="mt-6 w-full py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{promoTile.buttonText || 'Explore'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Product Cards */}
        {products.map((prod) => (
          <div
            key={prod.id}
            className={`snap-start ${
              totalItems < 4 ? 'w-[260px] sm:w-[280px]' : 'w-[260px] sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]'
            } flex-shrink-0 min-w-0`}
          >
            <ProductCard product={prod} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
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

