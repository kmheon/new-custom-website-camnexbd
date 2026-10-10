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

const DEFAULT_BRAND_DATA: Brand[] = [
  { id: 'b-hikvision', name: 'Hikvision', slug: 'hikvision', logo: '/images/brands/hikvision.svg', showBadge: true, badgeText: 'Authorized Support Partner', showInBrandStrip: true, order: 1 },
  { id: 'b-dahua', name: 'Dahua Technology', slug: 'dahua', logo: '/images/brands/dahua.svg', showBadge: true, badgeText: 'Authorized Support Partner', showInBrandStrip: true, order: 2 },
  { id: 'b-zkteco', name: 'ZKTeco', slug: 'zkteco', logo: '/images/brands/zkteco.svg', showBadge: false, showInBrandStrip: true, order: 3 },
  { id: 'b-ruijie', name: 'Ruijie Reyee', slug: 'ruijie-reyee', logo: '/images/brands/ruijie.svg', showBadge: false, showInBrandStrip: true, order: 4 },
  { id: 'b-wd', name: 'Western Digital', slug: 'western-digital', logo: '/images/brands/western-digital.svg', showBadge: false, showInBrandStrip: true, order: 5 },
  { id: 'b-seagate', name: 'Seagate', slug: 'seagate', logo: '', showBadge: false, showInBrandStrip: true, order: 6 },
  { id: 'b-tplink', name: 'TP-Link', slug: 'tp-link', logo: '', showBadge: false, showInBrandStrip: true, order: 7 },
  { id: 'b-uniview', name: 'Uniview', slug: 'uniview', logo: '', showBadge: false, showInBrandStrip: true, order: 8 },
  { id: 'b-cisco', name: 'Cisco', slug: 'cisco', logo: '', showBadge: false, showInBrandStrip: true, order: 9 },
  { id: 'b-honeywell', name: 'Honeywell', slug: 'honeywell', logo: '', showBadge: false, showInBrandStrip: true, order: 10 },
];

const BrandMarqueeItem: React.FC<{
  brand: Brand;
  onNavigate: (route: string, param?: string) => void;
}> = ({ brand, onNavigate }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasLogo = Boolean(brand.logo && brand.logo.trim() && !imgFailed);
  const isAuthorized = Boolean(
    brand.showBadge &&
    (brand.slug === 'hikvision' || brand.slug === 'dahua')
  );

  return (
    <a
      href={`/brand/${brand.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onNavigate('brand', brand.slug);
      }}
      title={brand.name}
      aria-label={brand.name}
      className="group relative flex-shrink-0 flex items-center justify-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F15A24]/40"
    >
      <div className="relative flex items-center justify-center h-[24px] md:h-[28px]">
        {hasLogo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            width="110"
            height="28"
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-[24px] md:h-[28px] max-w-[110px] w-auto object-contain filter grayscale opacity-70 transition-all duration-300 ease-out group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
          />
        ) : (
          <span className="h-[24px] md:h-[28px] flex items-center text-xs md:text-sm font-extrabold uppercase tracking-wider text-[#5B6472] transition-all duration-300 ease-out whitespace-nowrap filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105">
            {brand.name}
          </span>
        )}

        {isAuthorized && (
          <span
            className="absolute -top-1.5 -right-2.5 flex items-center justify-center pointer-events-none"
            title={brand.badgeText || 'Authorized Support Partner'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#F15A24]" />
            <span className="sr-only">{brand.badgeText || 'Authorized Support Partner'}</span>
          </span>
        )}
      </div>
    </a>
  );
};

export const HeroSlider: React.FC<HeroSliderProps> = ({ onNavigate }) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTickerPaused, setIsTickerPaused] = useState(false);
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

  // Eligible brands for the one-line scrolling strip (logo exists or marked showInBrandStrip, ordered by order)
  const eligibleBrands = (brands.length > 0 ? brands : DEFAULT_BRAND_DATA)
    .filter((b) => (b.showInBrandStrip !== false) || Boolean(b.logo && b.logo.trim()))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const displayStripBrands = eligibleBrands.length > 0 ? eligibleBrands : DEFAULT_BRAND_DATA;
  const isFew = displayStripBrands.length <= 3;

  // Build duplicated track so Set A + Set B is at least 2x container width and loops seamlessly
  let baseTrack = [...displayStripBrands];
  while (baseTrack.length < 8) {
    baseTrack = [...baseTrack, ...displayStripBrands];
  }

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
                
                {/* Overlapping Frosted Glass Chip: ONE short value only ("2 MP", "4K", "IP67"), never label and value together, never truncated, hidden when no short value exists */}
                {(() => {
                  let shortVal = '';
                  if (primaryHighlight?.value) {
                    const raw = String(primaryHighlight.value).trim();
                    // Prefer values <= 8 chars, or extract first number + unit
                    if (raw.length <= 8) {
                      shortVal = raw;
                    } else {
                      const match = raw.match(/^(\d+(?:\.\d+)?\s*[a-zA-Z]+)/);
                      if (match && match[1].length <= 8) {
                        shortVal = match[1].trim();
                      }
                    }
                  }
                  if (!shortVal) return null;

                  return (
                    <div className="absolute top-2 -right-1 sm:right-2 z-20 bg-white/90 backdrop-blur-md border border-[#EDE8E1] rounded-full px-3 py-1 shadow-md flex items-center gap-1.5 text-xs animate-fade-in pointer-events-none">
                      {renderHighlightIcon(primaryHighlight?.icon)}
                      <span className="font-extrabold text-[#111827]">{shortVal}</span>
                    </div>
                  );
                })()}

                {/* Transparent Product Image: NO box, NO border, floats directly on hero background with only soft ground shadow */}
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

      {/* BRAND STRIP DIRECTLY BELOW HERO (One-line full-width band with seamless marquee) */}
      <section
        id="hero-brands"
        aria-label="Brands we work with"
        className="w-full bg-[#FAF7F2] border-t border-b border-[#EDE8E1] h-[96px] md:h-[78px] flex items-center overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col md:flex-row items-center justify-between">
          {/* Mobile Label: sits above the row in 12px, centered */}
          <div className="md:hidden pt-2 pb-1 text-center w-full flex-shrink-0">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#5B6472]">
              Brands we work with
            </span>
          </div>

          {/* Desktop Left Fixed Label: 13px, uppercase, tracking, no icon, thin vertical divider */}
          <div className="hidden md:flex items-center flex-shrink-0 mr-6 lg:mr-8 h-full">
            <span className="text-[13px] font-bold uppercase tracking-wider text-[#5B6472] whitespace-nowrap">
              Brands we work with
            </span>
            <div className="h-6 w-px bg-[#EDE8E1] ml-6 flex-shrink-0" />
          </div>

          {/* Right Marquee Area filling remaining width */}
          <div
            className={`brand-marquee-container relative flex-1 min-w-0 w-full h-full flex items-center overflow-hidden ${
              reducedMotion ? 'overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar' : ''
            }`}
            style={
              isFew
                ? undefined
                : {
                    maskImage:
                      'linear-gradient(to right, transparent 0px, black 48px, black calc(100% - 48px), transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to right, transparent 0px, black 48px, black calc(100% - 48px), transparent 100%)'
                  }
            }
            onMouseEnter={() => setIsTickerPaused(true)}
            onMouseLeave={() => setIsTickerPaused(false)}
            onFocus={() => setIsTickerPaused(true)}
            onBlur={() => setIsTickerPaused(false)}
          >
            {/* Accessibility Play/Pause button (visible on focus) */}
            {!isFew && (
              <button
                type="button"
                onClick={() => setIsTickerPaused((p) => !p)}
                aria-label={isTickerPaused ? 'Play brand logo marquee' : 'Pause brand logo marquee'}
                className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:left-2 focus:top-1/2 focus:-translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-[#111827] text-white rounded shadow-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
              >
                {isTickerPaused ? 'Play marquee' : 'Pause marquee'}
              </button>
            )}

            {isFew ? (
              /* With 3 or fewer brands: static and centered, no animation */
              <div className="flex items-center justify-center gap-12 w-full h-full">
                {displayStripBrands.map((b, idx) => (
                  <BrandMarqueeItem key={`few-${b.id}-${idx}`} brand={b} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              /* Duplicated track auto-scrolls sideways in a seamless infinite loop */
              <div
                className={`brand-marquee-track flex items-center shrink-0 ${
                  reducedMotion ? '' : 'animate-brand-marquee'
                }`}
                style={{
                  animationPlayState: isTickerPaused ? 'paused' : undefined,
                  willChange: 'transform'
                }}
              >
                {/* Track Set A */}
                <div className="flex items-center gap-12 pr-12 shrink-0">
                  {baseTrack.map((b, idx) => (
                    <BrandMarqueeItem key={`a-${b.id}-${idx}`} brand={b} onNavigate={onNavigate} />
                  ))}
                </div>
                {/* Track Set B (exact duplicate) */}
                <div className="flex items-center gap-12 pr-12 shrink-0">
                  {baseTrack.map((b, idx) => (
                    <BrandMarqueeItem key={`b-${b.id}-${idx}`} brand={b} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
