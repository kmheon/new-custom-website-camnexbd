import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Eye,
  Shield,
  Cpu,
  Wifi,
  Zap,
  Sparkles
} from 'lucide-react';
import { HeroSlide, Brand } from '../types';
import { cmsService, brandService } from '../services';

interface HeroSliderProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ onNavigate }) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
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

  // Fetch resolved display slides & authorized brands
  useEffect(() => {
    cmsService.resolveDisplaySlides().then((res) => {
      if (res && res.length > 0) {
        setSlides(res);
      }
    });
    brandService.getBrands().then((res) => {
      setBrands(res);
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
      <section className="bg-[#FAF7F2] min-h-[520px] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#F15A24] border-t-transparent rounded-full animate-spin"></div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex];
  const primaryHighlight = currentSlide.highlights?.[0];

  return (
    <div className="w-full">
      {/* HERO SECTION */}
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
        className="relative bg-gradient-to-b from-[#FFF8F1] via-[#FFFBF6] to-[#FAF7F2] text-[#111827] overflow-hidden select-none outline-none min-h-[540px] lg:min-h-[600px] flex flex-col justify-center pt-4 pb-8"
      >
        {/* Faint Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)'
          }}
        />

        {/* Soft Warm Orange Glow behind Product */}
        <div
          className="absolute right-0 lg:right-[10%] top-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] lg:w-[560px] h-[340px] sm:h-[480px] lg:h-[560px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(241, 90, 36, 0.08) 0%, rgba(241, 90, 36, 0.02) 50%, transparent 75%)'
          }}
        />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-4 lg:py-6">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12">
            
            {/* LEFT COLUMN: Headline & CTAs */}
            <div className="w-full lg:w-[50%] space-y-6 text-center lg:text-left transition-all duration-500 ease-out">
              
              {/* Optional Pill Badge (only if slide provides real badge) */}
              {currentSlide.badge && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-[#F15A24] border border-orange-200/60 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24]"></span>
                  <span>{currentSlide.badge}</span>
                </div>
              )}

              {/* Big Bold H1 (56-64px desktop) */}
              <h1 className="text-3xl sm:text-4xl lg:text-[54px] xl:text-[60px] font-black font-heading text-[#111827] leading-[1.08] tracking-tight">
                {currentSlide.headline}
              </h1>

              {/* Muted Subtext */}
              <p className="text-base sm:text-lg text-[#5B6472] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {currentSlide.description}
              </p>

              {/* Two Pill Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                
                {/* Primary Orange Pill */}
                <button
                  type="button"
                  onClick={() => {
                    const target = currentSlide.buttonLink || '/catalog';
                    if (target.startsWith('/product/')) {
                      onNavigate('product', target.replace('/product/', ''));
                    } else if (target === '/catalog') {
                      onNavigate('catalog');
                    } else if (target === '/packages') {
                      onNavigate('packages');
                    } else {
                      onNavigate('catalog');
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-sm shadow-sm transition-all transform hover:-translate-y-0.5"
                >
                  <span>{currentSlide.buttonText || 'Shop now'}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                {/* Secondary White Pill with Border */}
                <button
                  type="button"
                  onClick={() => onNavigate('quote')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-7 py-3 rounded-full bg-white hover:bg-slate-50 text-[#111827] border border-[#EDE8E1] font-bold text-sm shadow-2xs transition-all"
                >
                  <span>Get free quote</span>
                </button>

              </div>

            </div>

            {/* RIGHT COLUMN: Transparent Floating Product & Frosted Glass Mini-Cards */}
            <div className="w-full lg:w-[50%] flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] flex flex-col items-center justify-center group">
                
                {/* Overlapping Frosted Glass Chip (Top Right) - Only if real highlight exists */}
                {primaryHighlight && (
                  <div className="absolute top-2 -right-1 sm:right-2 z-20 bg-white/85 backdrop-blur-md border border-[#EDE8E1] rounded-full px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs animate-fade-in pointer-events-none">
                    {renderHighlightIcon(primaryHighlight.icon)}
                    <span className="font-extrabold text-[#111827]">{primaryHighlight.value}</span>
                    <span className="text-[#5B6472] font-medium hidden sm:inline">{primaryHighlight.label}</span>
                  </div>
                )}

                {/* Transparent Product Image: NO box, NO border */}
                <div className="relative w-full h-[280px] sm:h-[340px] lg:h-[400px] flex items-center justify-center">
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

                {/* Overlapping Frosted Glass Chip (Bottom Left) - Only if real price exists */}
                {currentSlide.priceText && (
                  <div className="absolute bottom-6 -left-2 sm:left-4 z-20 bg-white/85 backdrop-blur-md border border-[#EDE8E1] rounded-[18px] p-2.5 sm:p-3 shadow-lg flex items-center gap-2.5 animate-fade-in pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#F15A24]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6472]">
                        From
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-[#111827]">
                        {currentSlide.priceText}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ground Shadow */}
                <div
                  aria-hidden="true"
                  className="w-3/4 max-w-[320px] h-4 bg-black/15 blur-md rounded-[100%] mx-auto mt-[-10px] pointer-events-none"
                />

              </div>
            </div>

          </div>
        </div>

        {/* Subtle Slider Controls */}
        {totalSlides > 1 && (
          <div className="relative z-20 pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous Slide"
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[#5B6472] hover:text-[#111827] border border-[#EDE8E1] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Slider Dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-6 bg-[#F15A24]' : 'w-2 bg-[#EDE8E1] hover:bg-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next Slide"
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[#5B6472] hover:text-[#111827] border border-[#EDE8E1] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* BRAND STRIP DIRECTLY BELOW HERO (No card, no border) */}
      <section className="w-full bg-[#FAF7F2] py-6 sm:py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            {/* Left Label */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#F15A24]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">
                Authorized Hardware Partners
              </span>
            </div>

            {/* Right Brand Logos Row */}
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar flex items-center justify-start md:justify-end gap-6 sm:gap-10 py-1">
              {brands.length > 0 ? (
                brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onNavigate('brand', b.slug)}
                    className="flex-shrink-0 text-sm font-extrabold uppercase tracking-wider text-[#5B6472] hover:text-[#111827] transition-colors filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  >
                    {b.name}
                  </button>
                ))
              ) : (
                <>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[#5B6472] grayscale opacity-60">HIKVISION</span>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[#5B6472] grayscale opacity-60">ZKTECO</span>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[#5B6472] grayscale opacity-60">RUIJIE REYEE</span>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[#5B6472] grayscale opacity-60">DAHUA</span>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-[#5B6472] grayscale opacity-60">UNIVIEW</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
