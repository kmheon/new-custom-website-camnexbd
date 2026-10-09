import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { SectionHeader } from './common/SectionHeader';

export interface SpecialOfferSliderConfig {
  enabled?: boolean;
  interval?: number;
  maxOffers?: number;
}

interface SpecialOfferSliderProps {
  offers: Product[];
  onNavigate: (route: string, param?: string) => void;
  onAddToCart: (product: Product) => void;
  sliderConfig?: SpecialOfferSliderConfig;
}

export const SpecialOfferSlider: React.FC<SpecialOfferSliderProps> = ({
  offers,
  onNavigate,
  onAddToCart,
  sliderConfig
}) => {
  // If no offers, handle zero offers gracefully by not rendering the section
  if (!offers || offers.length === 0) {
    return null;
  }

  const isAutoSlideEnabled = sliderConfig?.enabled !== false;
  const intervalSeconds = Math.max(1, sliderConfig?.interval ?? 5);
  const intervalMs = intervalSeconds * 1000;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mobile touch swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Ensure currentIndex stays within bounds when offers change
  useEffect(() => {
    if (currentIndex >= offers.length) {
      setCurrentIndex(0);
    }
  }, [offers.length, currentIndex]);

  const totalOffers = offers.length;

  const goToSlide = useCallback((newIndex: number) => {
    if (totalOffers <= 1 || newIndex === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    const timeout = setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [currentIndex, totalOffers]);

  const goToNext = useCallback(() => {
    if (totalOffers <= 1) return;
    goToSlide((currentIndex + 1) % totalOffers);
  }, [currentIndex, totalOffers, goToSlide]);

  const goToPrev = useCallback(() => {
    if (totalOffers <= 1) return;
    goToSlide((currentIndex - 1 + totalOffers) % totalOffers);
  }, [currentIndex, totalOffers, goToSlide]);

  // Autoplay effect
  useEffect(() => {
    // If only one offer, auto-sliding disabled, paused, or reduced-motion: do not auto-slide
    if (totalOffers <= 1 || !isAutoSlideEnabled || isPaused || reducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalOffers, isAutoSlideEnabled, isPaused, reducedMotion, intervalMs, goToNext]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (totalOffers <= 1) return;
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || totalOffers <= 1) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  const currentProduct = offers[currentIndex] || offers[0];
  const regularPrice = currentProduct.pricing?.regularPrice || 0;
  const salePrice = currentProduct.pricing?.salePrice || 0;
  const discountPct = regularPrice && salePrice
    ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    : 0;
  const savings = regularPrice - salePrice;

  return (
    <section
      id="special-offers"
      className="w-full bg-gradient-to-r from-[#FFF1E8] via-[#FFEADB] to-[#FFE0CC] py-10 md:py-14 border-y border-orange-200/60 overflow-hidden"
      aria-label="Special Offers"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Special Deal"
          title={totalOffers > 1 ? "Special Offers" : "Special Offer"}
          subtitle="Promotional pricing on security hardware"
          actionText={totalOffers > 1 ? `View all deals (${totalOffers})` : "View catalog"}
          onAction={() => onNavigate('catalog')}
          className="mb-6"
        />

        {/* Carousel Container */}
        <div
          className="relative group focus:outline-none"
          tabIndex={totalOffers > 1 ? 0 : undefined}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role={totalOffers > 1 ? "region" : undefined}
          aria-roledescription={totalOffers > 1 ? "carousel" : undefined}
          aria-label={totalOffers > 1 ? "Special Offers Carousel" : undefined}
        >
          {/* Offer Card */}
          <div
            className={`bg-white rounded-[24px] border border-orange-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ease-out ${
              isTransitioning && !reducedMotion ? 'opacity-85 translate-y-0.5' : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Card Content (Left) */}
            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                  -{discountPct}% OFF
                </span>
                <span className="text-xs font-bold text-[#5B6472] uppercase">
                  {currentProduct.brand}
                </span>
                {totalOffers > 1 && (
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full ml-auto sm:ml-0">
                    Deal {currentIndex + 1} of {totalOffers}
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-[#5B6472]">
                {currentProduct.modelNumber || currentProduct.model}
              </div>

              <h3
                onClick={() => onNavigate('product', currentProduct.id)}
                className="text-xl sm:text-2xl font-black font-heading text-[#111827] hover:text-[#F15A24] cursor-pointer transition-colors [overflow-wrap:anywhere] break-words"
              >
                {currentProduct.name}
              </h3>

              <p className="text-xs text-[#5B6472] max-w-xl line-clamp-2 [overflow-wrap:anywhere] break-words">
                {currentProduct.shortDescription || currentProduct.description}
              </p>

              <div className="flex items-baseline gap-3 pt-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
                  ৳{salePrice.toLocaleString()}
                </span>
                <span className="text-sm text-[#5B6472] line-through">
                  ৳{regularPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Save ৳{savings.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onAddToCart(currentProduct)}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:ring-offset-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to cart</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('product', currentProduct.id)}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                >
                  <span>View details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Image Tile (Right) */}
            <div
              onClick={() => onNavigate('product', currentProduct.id)}
              className="w-full md:w-80 h-56 bg-gradient-to-b from-[#FFF8F4] to-[#F4EEE6] rounded-2xl flex items-center justify-center p-4 cursor-pointer overflow-hidden shrink-0 group/img"
            >
              <img
                src={currentProduct.images?.[0] || currentProduct.primaryImage || '/images/hero/hikvision-bullet.jpg'}
                alt={currentProduct.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover/img:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Navigation Controls (Only rendered when > 1 offer) */}
          {totalOffers > 1 && (
            <div className="mt-4 flex items-center justify-between px-1">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2" role="tablist" aria-label="Offer selector">
                {offers.map((offer, idx) => (
                  <button
                    key={offer.id || idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    role="tab"
                    aria-selected={currentIndex === idx}
                    aria-label={`Show offer ${idx + 1}: ${offer.name}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                      currentIndex === idx
                        ? 'w-7 h-2.5 bg-[#F15A24]'
                        : 'w-2.5 h-2.5 bg-orange-300/80 hover:bg-orange-400'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="Previous special offer"
                  className="w-9 h-9 rounded-full border border-orange-200/90 bg-white/90 hover:bg-white text-slate-700 hover:text-[#F15A24] flex items-center justify-center shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Next special offer"
                  className="w-9 h-9 rounded-full border border-orange-200/90 bg-white/90 hover:bg-white text-slate-700 hover:text-[#F15A24] flex items-center justify-center shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
