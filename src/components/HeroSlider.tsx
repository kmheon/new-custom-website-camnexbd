import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { SmartImage, ImagePlaceholder } from './common/ImagePlaceholder';
import { formatSpecValue } from '../utils/specUtils';

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

  const [progress, setProgress] = useState(0);

  const totalSlides = slides.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (totalSlides || 1));
    setProgress(0);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (totalSlides || 1)) % (totalSlides || 1));
    setProgress(0);
  }, [totalSlides]);

  // Autoplay timer with 6-second progress bar (pauses on hover/focus and reduced motion)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || reducedMotion) {
      setProgress(0);
      return;
    }

    const intervalMs = 60;
    const step = (intervalMs / 6000) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused, reducedMotion, goToNext, currentIndex]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

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

  const FALLBACK_SLIDE: HeroSlide = {
    id: 'slide-fallback',
    title: 'Professional Security Hardware',
    headline: 'Commercial Security & Network Hardware',
    eyebrow: 'ENTERPRISE SURVEILLANCE',
    modelNumber: 'DS-2CD2087G2-LU',
    tabLabel: 'ColorVu 4K Bullet',
    description: 'Enterprise 4K Ultra HD surveillance featuring dual smart lighting, AcuSense AI vehicle classification, and IP67 weather-sealed all-metal housing.',
    image: '/images/hero/hikvision-bullet.png',
    buttonText: 'Shop Catalog',
    buttonLink: '/catalog',
    secondaryButtonText: 'Request Quotation',
    secondaryButtonLink: '/quote',
    badge: 'NEW ARRIVAL',
    showBadge: true,
    enabled: true,
    order: 1,
    sourceMode: 'manual',
    highlights: [
      { value: '4K Ultra HD', label: 'Resolution', icon: 'camera' },
      { value: '40m Dual-Light', label: 'Smart Hybrid IR', icon: 'eye' },
      { value: 'IP67 Rating', label: 'Weatherproof', icon: 'shield' },
      { value: 'AcuSense AI', label: 'Classification', icon: 'cpu' }
    ]
  };

  const currentSlide = slides.length > 0 ? slides[currentIndex] : FALLBACK_SLIDE;

  // Format up to 4 highlights using formatSpecValue and length limits
  const formattedHighlights: Array<{ val: string; label: string }> = useMemo(() => {
    if (!currentSlide.highlights || !Array.isArray(currentSlide.highlights)) return [];
    return currentSlide.highlights
      .slice(0, 4)
      .map((hl) => {
        let val = String(hl.value || '').trim();
        // If longer than 14 chars, extract first number + unit or slice
        if (val.length > 14) {
          const match = val.match(/^(\d+(?:\.\d+)?\s*[a-zA-Z]+)/);
          val = match ? match[1].slice(0, 14) : val.slice(0, 14);
        }
        const label = String(hl.label || '').slice(0, 14);
        return { val, label };
      })
      .filter((h) => h.val.length > 0);
  }, [currentSlide.highlights]);

  // Eligible brands for the one-line scrolling strip
  const eligibleBrands = (brands.length > 0 ? brands : DEFAULT_BRAND_DATA)
    .filter((b) => (b.showInBrandStrip !== false) || Boolean(b.logo && b.logo.trim()))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const displayStripBrands = eligibleBrands.length > 0 ? eligibleBrands : DEFAULT_BRAND_DATA;
  const isFew = displayStripBrands.length <= 3;

  let baseTrack = [...displayStripBrands];
  while (baseTrack.length < 8) {
    baseTrack = [...baseTrack, ...displayStripBrands];
  }

  return (
    <div className="w-full">
      {/* HERO SECTION - Reserved min-height to prevent layout shift */}
      <section
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured Security Hardware"
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
        className="relative bg-gradient-to-b from-[#FFF8F1] via-[#FFFBF6] to-[#FAF7F2] text-[#111827] overflow-hidden select-none outline-none min-h-[580px] lg:min-h-[640px] flex flex-col justify-between pt-4 pb-6"
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
          className="absolute right-0 lg:right-[12%] top-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] lg:w-[560px] h-[340px] sm:h-[480px] lg:h-[560px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(241, 90, 36, 0.08) 0%, rgba(241, 90, 36, 0.02) 50%, transparent 75%)'
          }}
        />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto py-2">
          {/* Mobile: image comes first (flex-col). Desktop: classic 2-column (flex-row) */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
            
            {/* RIGHT COLUMN ON MOBILE (comes first on mobile, right on desktop) */}
            <div className="w-full lg:w-[50%] lg:order-2 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[560px] flex flex-col items-center justify-center group">
                
                {/* Transparent Product Image: NO box, NO border, floats directly on hero background with only soft ground shadow */}
                <div className="relative w-full h-[260px] sm:h-[340px] lg:h-[420px] flex items-center justify-center bg-transparent border-0 shadow-none">
                  {currentSlide.image ? (
                    <img
                      id="hero-product-image"
                      key={currentSlide.id}
                      src={currentSlide.image}
                      alt={currentSlide.headline || 'Product Hardware'}
                      loading={currentIndex === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                      className={`max-w-full max-h-full object-contain filter drop-shadow-[0_22px_36px_rgba(0,0,0,0.14)] transition-all duration-700 ease-out ${
                        reducedMotion ? '' : 'motion-safe:hover:-translate-y-1'
                      }`}
                    />
                  ) : (
                    <ImagePlaceholder
                      category={currentSlide.title}
                      name={currentSlide.headline}
                      model={currentSlide.modelNumber}
                      className="w-36 h-36"
                      containerClassName="w-full h-full flex flex-col items-center justify-center bg-transparent p-4"
                    />
                  )}
                </div>

                {/* Ground Shadow */}
                <div
                  aria-hidden="true"
                  className="w-3/4 max-w-[340px] h-4 bg-black/15 blur-md rounded-[100%] mx-auto mt-[-10px] pointer-events-none"
                />

                {/* Over Right Edge: Vertical Spec Card (Desktop) */}
                {formattedHighlights.length > 0 && (
                  <div className="hidden md:flex flex-col absolute -right-2 lg:-right-6 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-md border border-[#EDE8E1] rounded-[14px] shadow-xl p-2 min-w-[150px] max-w-[190px] divide-y divide-[#EDE8E1]">
                    {formattedHighlights.map((hl, idx) => (
                      <div key={idx} className="py-2 px-2.5 flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F15A24] mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#111827] text-xs sm:text-sm tracking-tight truncate">
                            {hl.val}
                          </div>
                          {hl.label && (
                            <div className="text-[10px] text-[#5B6472] uppercase tracking-wider font-semibold truncate">
                              {hl.label}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile 2x2 Spec Grid under Image */}
                {formattedHighlights.length > 0 && (
                  <div className="md:hidden grid grid-cols-2 gap-2 w-full max-w-sm mt-3">
                    {formattedHighlights.map((hl, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 border border-[#EDE8E1] rounded-xl p-2 flex items-center gap-2 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24] flex-shrink-0" />
                        <div className="min-w-0 text-left">
                          <div className="font-extrabold text-[#111827] text-xs truncate">{hl.val}</div>
                          {hl.label && (
                            <div className="text-[9px] text-[#5B6472] uppercase font-bold truncate">
                              {hl.label}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* LEFT COLUMN: Headline & CTAs (50% desktop) */}
            <div className="w-full lg:w-[50%] lg:order-1 space-y-4 sm:space-y-5 text-center lg:text-left transition-all duration-500 ease-out">
              
              {/* Badge + Monospace Muted Model Number */}
              <div className="flex items-center justify-center lg:justify-start gap-2.5 flex-wrap">
                {currentSlide.showBadge !== false && currentSlide.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#F15A24] border border-[#F15A24] bg-orange-50/70 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24]"></span>
                    <span>{currentSlide.badge}</span>
                  </span>
                )}

                {currentSlide.modelNumber && (
                  <span className="font-mono text-xs font-bold text-[#5B6472] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100/80 border border-slate-200/60">
                    {currentSlide.modelNumber}
                  </span>
                )}
              </div>

              {/* Orange Eyebrow Text */}
              <div className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#F15A24]">
                {currentSlide.eyebrow || 'ENTERPRISE SURVEILLANCE'}
              </div>

              {/* Big Bold H1 (clamp(34px, 5vw, 60px), max 2 lines, zero overlap) */}
              <h1
                style={{
                  fontSize: 'clamp(30px, 3.8vw, 46px)',
                  lineHeight: 1.15
                }}
                className="font-black font-heading text-[#111827] tracking-tight line-clamp-2 overflow-hidden break-words"
              >
                {currentSlide.headline}
              </h1>

              {/* 16-18px Muted Description (max 2-3 lines) */}
              <p className="text-base sm:text-[17px] text-[#5B6472] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal line-clamp-3">
                {currentSlide.description}
              </p>

              {/* Two Pill Buttons: Primary Orange Pill + Secondary Outlined Pill */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                {/* Primary Orange Pill with Arrow */}
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-3 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-sm shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>{currentSlide.buttonText || 'Shop Catalog'}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                {/* Secondary Outlined Pill */}
                <button
                  type="button"
                  onClick={() => {
                    const target = currentSlide.secondaryButtonLink || currentSlide.secondaryLink || '/quote';
                    if (target === '/quote') {
                      onNavigate('quote');
                    } else if (target === '/cart') {
                      onNavigate('cart');
                    } else {
                      onNavigate('quote');
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-7 py-3 rounded-full bg-white hover:bg-slate-50 text-[#111827] border border-[#EDE8E1] font-bold text-sm shadow-2xs transition-all cursor-pointer"
                >
                  <span>{currentSlide.secondaryButtonText || currentSlide.secondaryText || 'Request Quotation'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* BOTTOM TAB STRIP: Numbered tabs ("01 ColorVu Camera", "02 ...", max 22 chars) with active tab progress bar */}
        {totalSlides > 1 && (
          <div
            role="tablist"
            aria-label="Hero Highlights Navigation"
            className="relative z-20 max-w-[1200px] mx-auto px-4 sm:px-6 w-full pt-4 pb-1"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
              {slides.map((s, idx) => {
                const isActive = idx === currentIndex;
                const numStr = String(idx + 1).padStart(2, '0');
                const rawLabel = s.tabLabel || s.modelNumber || s.title || `Slide ${idx + 1}`;
                const shortLabel = rawLabel.length > 22 ? rawLabel.slice(0, 20) + '…' : rawLabel;

                return (
                  <button
                    key={s.id}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setProgress(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        goToNext();
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        goToPrev();
                      }
                    }}
                    className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap overflow-hidden flex-shrink-0 ${
                      isActive
                        ? 'bg-white text-[#111827] border-2 border-[#F15A24] shadow-sm'
                        : 'bg-white/70 hover:bg-white text-[#5B6472] hover:text-[#111827] border border-[#EDE8E1]'
                    }`}
                  >
                    <span className={isActive ? 'text-[#F15A24] font-black' : 'text-[#5B6472]/70 font-mono'}>
                      {numStr}
                    </span>
                    <span>{shortLabel}</span>

                    {/* Active Tab Autoplay Progress Bar */}
                    {isActive && !reducedMotion && (
                      <div
                        className="absolute bottom-0 left-0 h-0.5 bg-[#F15A24] transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
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
