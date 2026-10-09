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

const BrandStripItem: React.FC<{
  brand: Brand;
  onNavigate: (route: string, param?: string) => void;
}> = ({ brand, onNavigate }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasLogo = Boolean(brand.logo && brand.logo.trim() && !imgFailed);

  return (
    <button
      onClick={() => onNavigate('brand', brand.slug)}
      className="group flex-shrink-0 flex flex-col items-center justify-center transition-all p-1 focus:outline-none cursor-pointer"
      title={brand.name}
    >
      <div className="h-7 sm:h-8 flex items-center justify-center">
        {hasLogo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="max-h-7 sm:max-h-8 max-w-[110px] w-auto object-contain filter grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#5B6472] group-hover:text-[#111827] transition-colors whitespace-nowrap">
            {brand.name}
          </span>
        )}
      </div>

      {brand.showBadge && brand.badgeText && (
        <span className="mt-1 text-[9px] font-bold text-[#F15A24] bg-orange-100/90 border border-orange-200 px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
          {brand.badgeText}
        </span>
      )}
    </button>
  );
};

export const HeroSlider: React.FC<HeroSliderProps> = ({ onNavigate }) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

const FALLBACK_SLIDE: HeroSlide = {
  id: 'slide-fallback',
  title: 'Professional Security Hardware',
  headline: 'Commercial Security & Network Hardware',
  description: 'Enterprise CCTV surveillance, biometric access control, and structured networking equipment with professional installation.',
  image: '/images/hero/hikvision-bullet.png',
  buttonText: 'Shop Catalog',
  buttonLink: '/catalog',
  badge: 'Hardware Solutions',
  enabled: true,
  order: 1,
  sourceMode: 'manual'
};

  const currentSlide = slides.length > 0 ? slides[currentIndex] : FALLBACK_SLIDE;
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

              {/* Big Bold H1 (clamp(34px, 5vw, 60px), line-height >= 1.1, max 2 lines clean wrapping, no overlap) */}
              <h1
                style={{
                  fontSize: (currentSlide.headline && currentSlide.headline.length > 38)
                    ? 'clamp(32px, 3.2vw, 36px)'
                    : (currentSlide.headline && currentSlide.headline.length > 25)
                    ? 'clamp(34px, 4vw, 44px)'
                    : 'clamp(34px, 5vw, 60px)',
                  lineHeight: 1.18
                }}
                className="font-black font-heading text-[#111827] tracking-tight line-clamp-2 overflow-hidden break-words"
              >
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
                  <span>Get Quote</span>
                </button>

              </div>

            </div>

            {/* RIGHT COLUMN: Transparent Floating Product & Frosted Glass Mini-Cards */}
            <div className="w-full lg:w-[50%] flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[480px] sm:max-w-[540px] lg:max-w-[580px] flex flex-col items-center justify-center group">
                
                {/* Overlapping Frosted Glass Chip (Top Right) - Only if real highlight exists */}
                {primaryHighlight && (
                  <div className="absolute top-2 -right-1 sm:right-2 z-20 bg-white/85 backdrop-blur-md border border-[#EDE8E1] rounded-full px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs animate-fade-in pointer-events-none">
                    {renderHighlightIcon(primaryHighlight.icon)}
                    <span className="font-extrabold text-[#111827]">{primaryHighlight.value}</span>
                    <span className="text-[#5B6472] font-medium hidden sm:inline">{primaryHighlight.label}</span>
                  </div>
                )}

                {/* Transparent Product Image: NO box, NO border, floats directly on hero background */}
                <div className="relative w-full h-[300px] sm:h-[380px] lg:h-[440px] flex items-center justify-center bg-transparent border-0 shadow-none">
                  <img
                    id="hero-product-image"
                    key={currentSlide.id}
                    src={currentSlide.image || '/images/hero/hikvision-bullet.png'}
                    alt={currentSlide.headline || 'Product Hardware'}
                    loading={currentIndex === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                    className={`max-w-full max-h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] transition-all duration-700 ease-out ${
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
                  className="w-3/4 max-w-[360px] h-4 bg-black/15 blur-md rounded-[100%] mx-auto mt-[-10px] pointer-events-none"
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

      {/* BRAND STRIP DIRECTLY BELOW HERO (Full-width row with real logos, badges, fallback wordmarks) */}
      <section id="hero-brands" className="w-full bg-[#FAF7F2] border-b border-[#EDE8E1] py-6 sm:py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8">
            {/* Left Label */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#F15A24]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">
                Brands we work with
              </span>
            </div>

            {/* Right Brand Logos Row */}
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar flex items-center justify-center md:justify-center gap-6 sm:gap-8 px-4 sm:px-6 py-1">
              {brands.length > 0 ? (
                brands.map((b) => (
                  <BrandStripItem key={b.id} brand={b} onNavigate={onNavigate} />
                ))
              ) : (
                <div className="flex items-center justify-center gap-6 px-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">HIKVISION</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">DAHUA</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">ZKTECO</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">RUIJIE</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5B6472]">WESTERN DIGITAL</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
