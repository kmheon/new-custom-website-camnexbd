import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Camera,
  Eye,
  Shield,
  Cpu,
  Wifi,
  Zap,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { HeroSlide, HeroFeatureHighlight } from '../types';
import { cmsService } from '../services';

interface HeroSliderProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onNavigate }) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Fetch resolved display slides
  useEffect(() => {
    cmsService.resolveDisplaySlides().then((res) => {
      if (res && res.length > 0) {
        setSlides(res);
      }
    });
  }, []);

  const totalSlides = slides.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (totalSlides || 1));
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (totalSlides || 1)) % (totalSlides || 1));
  }, [totalSlides]);

  // Autoplay timer (6 seconds, pauses on hover/focus and reduced-motion)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || reducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPaused, reducedMotion, goToNext, currentIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  // Helper to render icon for chips
  const renderHighlightIcon = (iconName?: string) => {
    const className = "w-3.5 h-3.5 text-[#F15A24] flex-shrink-0";
    switch (iconName?.toLowerCase()) {
      case 'camera':
        return <Camera className={className} />;
      case 'eye':
        return <Eye className={className} />;
      case 'shield':
        return <Shield className={className} />;
      case 'cpu':
        return <Cpu className={className} />;
      case 'wifi':
        return <Wifi className={className} />;
      case 'zap':
        return <Zap className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  if (slides.length === 0) {
    return (
      <section className="bg-white min-h-[560px] lg:h-[620px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#F15A24] border-t-transparent rounded-full animate-spin"></div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Security & Hardware Highlights"
      aria-live="polite"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative bg-white text-[#111827] overflow-hidden select-none outline-none border-b border-gray-100 min-h-[580px] lg:h-[620px] flex flex-col justify-center"
    >
      {/* 1. FAINT BACKGROUND PATTERN: 4-6% Neutral Dot Grid fading out radially */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#4B5563 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)'
        }}
      />

      {/* 2. SOFT ORANGE RADIAL GLOW: #F15A24 at 6-8% opacity positioned behind product */}
      <div
        className="absolute right-0 lg:right-[8%] top-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] lg:w-[580px] h-[340px] sm:h-[480px] lg:h-[580px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(241, 90, 36, 0.08) 0%, rgba(241, 90, 36, 0.02) 50%, transparent 75%)'
        }}
      />

      {/* MAIN CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12 lg:py-0">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* LEFT COLUMN: Text Content & Actions (45-50% desktop) */}
          <div className="w-full lg:w-[48%] space-y-5 text-center lg:text-left transition-all duration-500 ease-out">
            
            {/* Small Badge Pill */}
            {currentSlide.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-50 text-[#F15A24] border border-orange-200/90 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24]"></span>
                <span>{currentSlide.badge}</span>
              </div>
            )}

            {/* Headline: Brand + Product Name */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-black font-heading text-[#111827] leading-[1.15] tracking-tight">
              {currentSlide.headline}
            </h1>

            {/* Short Description */}
            <p className="text-base sm:text-lg text-[#4B5563] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {currentSlide.description}
            </p>

            {/* 3-4 Highlight Feature Chips */}
            {currentSlide.highlights && currentSlide.highlights.length > 0 && (
              <div className="pt-1">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  {currentSlide.highlights.slice(0, 4).map((chip, idx) => (
                    <div
                      key={idx}
                      className="bg-white/95 border border-gray-200/90 shadow-2xs px-3.5 py-1.5 rounded-full flex items-center justify-center sm:justify-start gap-2 text-xs backdrop-blur-2xs hover:border-[#F15A24]/40 transition-colors"
                    >
                      {renderHighlightIcon(chip.icon)}
                      <span className="font-bold text-[#111827]">{chip.value}</span>
                      <span className="text-[#6B7280] font-medium hidden sm:inline">· {chip.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Primary/Secondary CTAs */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6">
              
              {/* Optional Real Price */}
              {currentSlide.priceText && (
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Starting Price
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
                    {currentSlide.priceText}
                  </span>
                </div>
              )}

              {/* Primary "View Product" Orange Button */}
              <button
                type="button"
                onClick={() => {
                  const target = currentSlide.buttonLink || '/catalog';
                  if (target.startsWith('/product/')) {
                    onNavigate('product', target.replace('/product/', ''));
                  } else if (target === '/catalog') {
                    onNavigate('catalog');
                  } else {
                    onNavigate('home');
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{currentSlide.buttonText || 'View Product'}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              {/* Secondary Quiet Link: Request quotation or Add to cart */}
              {currentSlide.secondaryText && (
                <button
                  type="button"
                  onClick={() => {
                    const secTarget = currentSlide.secondaryLink || '/quote';
                    if (secTarget === '/cart') {
                      onNavigate('cart');
                    } else if (secTarget === '/quote') {
                      onNavigate('quote');
                    } else {
                      onNavigate('quote');
                    }
                  }}
                  className="text-sm font-semibold text-[#4B5563] hover:text-[#111827] underline-offset-4 hover:underline transition-colors py-2"
                >
                  {currentSlide.secondaryText}
                </button>
              )}

            </div>

          </div>

          {/* RIGHT COLUMN: Large Floating Transparent Product Image (50-55% desktop) */}
          <div className="w-full lg:w-[52%] flex flex-col items-center justify-center relative">
            <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] flex flex-col items-center justify-center group">
              
              {/* Transparent Floating Product Image: NO box, NO border, NO card */}
              <div className="relative w-full h-[260px] sm:h-[320px] lg:h-[380px] flex items-center justify-center">
                <img
                  key={currentSlide.id}
                  src={currentSlide.image || '/images/hero/hikvision-bullet.jpg'}
                  alt={currentSlide.headline || 'Product Hardware'}
                  loading={currentIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ mixBlendMode: 'multiply' }}
                  className={`max-w-full max-h-full object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)] transition-all duration-700 ease-out ${
                    reducedMotion ? '' : 'motion-safe:hover:-translate-y-1'
                  }`}
                />
              </div>

              {/* Soft Ground Shadow: blurred, low-opacity ellipse floating under the product */}
              <div
                aria-hidden="true"
                className="w-3/4 max-w-[320px] h-4 bg-black/15 blur-md rounded-[100%] mx-auto mt-[-10px] pointer-events-none"
              />

            </div>
          </div>

        </div>
      </div>

      {/* CONTROLS (Only visible if more than 1 slide) */}
      {totalSlides > 1 && (
        <>
          {/* Subtle Previous & Next Navigation Arrows (Desktop) */}
          <div className="hidden lg:flex items-center justify-between absolute inset-x-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous Slide"
              className="pointer-events-auto p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-[#111827] border border-gray-200/80 shadow-xs hover:shadow-sm transition-all transform hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next Slide"
              className="pointer-events-auto p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-[#111827] border border-gray-200/80 shadow-xs hover:shadow-sm transition-all transform hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dot Indicators with Progress Bar on the active dot */}
          <div className="relative z-20 pb-4 pt-2 flex items-center justify-center gap-2">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}: ${slide.title || slide.headline}`}
                  className={`h-2 rounded-full transition-all duration-500 overflow-hidden relative ${
                    isActive ? 'w-10 bg-gray-200' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {isActive && !isPaused && !reducedMotion && (
                    <div
                      className="absolute inset-y-0 left-0 bg-[#F15A24] rounded-full"
                      style={{
                        animation: 'fillProgress 6s linear forwards'
                      }}
                    />
                  )}
                  {isActive && (isPaused || reducedMotion) && (
                    <div className="absolute inset-0 bg-[#F15A24] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Progress Animation Style */}
      <style>{`
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
};

