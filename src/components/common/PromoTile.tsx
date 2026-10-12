import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PromoTileConfig } from '../../types';
import { HardwareIllustration, resolveHardwareType } from './ImagePlaceholder';

interface PromoTileProps {
  config: PromoTileConfig;
  categoryName?: string;
  onNavigate: (route: string, param?: string) => void;
  className?: string;
  isMobileStrip?: boolean;
}

export const PromoTile: React.FC<PromoTileProps> = ({
  config,
  categoryName = '',
  onNavigate,
  className = '',
  isMobileStrip = false
}) => {
  const [imageError, setImageError] = useState(false);

  const headline = (config.headline || '').slice(0, 40);
  const subtext = (config.subtext || '').slice(0, 60);
  const buttonText = (config.buttonText || 'View all').slice(0, 24);
  const bgStyle = config.bgStyle || 'orange';

  const handleClick = () => {
    if (config.link?.startsWith('/category/')) {
      onNavigate('category', config.link.replace('/category/', ''));
    } else if (config.link?.startsWith('/product/')) {
      onNavigate('product', config.link.replace('/product/', ''));
    } else if (config.link?.startsWith('/packages')) {
      onNavigate('packages');
    } else if (config.link) {
      onNavigate(config.link.replace(/^\//, ''));
    } else {
      onNavigate('catalog');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Styles per bgStyle: Brand orange (white text), Dark (light text), or Soft tint (dark text)
  const isOrange = bgStyle === 'orange';
  const isDark = bgStyle === 'dark';
  const isTint = bgStyle === 'tint';

  const bgClasses = isOrange
    ? 'bg-[#F15A24] text-white'
    : isDark
    ? 'bg-[#141210] text-[#F3F4F6]'
    : 'bg-[#FAF7F2] text-[#111827]';

  const buttonClasses = isOrange || isDark
    ? 'bg-white text-[#111827] hover:bg-slate-100 shadow-sm'
    : 'bg-[#F15A24] text-white hover:bg-[#D94D1C] shadow-sm';

  const subtextClasses = isOrange
    ? 'text-white/85'
    : isDark
    ? 'text-slate-300'
    : 'text-[#5B6472]';

  const resolvedHardwareType = resolveHardwareType(categoryName, headline);

  // Decorative subtle SVG background pattern at 8% opacity
  const decorativePattern = (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="85%" cy="15%" r="140" stroke="currentColor" strokeWidth="24" />
      <circle cx="85%" cy="15%" r="80" stroke="currentColor" strokeWidth="12" />
      <path d="M-20 180 L220 -60" stroke="currentColor" strokeWidth="18" strokeDasharray="8 8" />
    </svg>
  );

  // Mobile Strip variant (below 768px): full-width banner about 120px tall, text left, image right
  if (isMobileStrip) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${headline}${subtext ? ` - ${subtext}` : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`promo-tile promo-tile-mobile group relative w-full h-[120px] rounded-[20px] p-4 flex items-center justify-between overflow-hidden cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:ring-offset-2 transition-all ${bgClasses} ${className}`}
      >
        {decorativePattern}

        {/* Left: Text and button */}
        <div className="relative z-10 flex flex-col justify-between h-full max-w-[62%] min-w-0 pr-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold font-heading leading-tight truncate [overflow-wrap:anywhere]">
              {headline}
            </h3>
            {subtext && (
              <p className={`text-[11px] leading-snug line-clamp-1 mt-0.5 ${subtextClasses}`}>
                {subtext}
              </p>
            )}
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-transform ${buttonClasses}`}
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </span>
          </div>
        </div>

        {/* Right: Large image */}
        <div className="promo-tile-media relative z-0 w-[38%] h-full flex items-center justify-end overflow-hidden">
          {!imageError && config.image ? (
            <img
              src={config.image}
              alt=""
              onError={() => setImageError(true)}
              className="max-h-[110%] w-auto max-w-[130%] object-contain filter drop-shadow-md translate-x-2 translate-y-1 transition-transform duration-300 motion-reduce:transform-none group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 opacity-90 flex items-center justify-center">
              <HardwareIllustration type={resolvedHardwareType} className="w-14 h-14" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop / Tablet variant: exactly one card wide, same CardRow flex sizing
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${headline}${subtext ? ` - ${subtext}` : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`promo-tile card-item-fixed snap-start relative rounded-[20px] p-6 flex flex-col justify-between overflow-hidden cursor-pointer select-none shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:ring-offset-2 ${bgClasses} ${className}`}
    >
      {decorativePattern}

      {/* Top-Left: Headline (max 40 chars, 24-28px bold, up to 3 lines) and optional subtext (max 60 chars) */}
      <div className="relative z-10 min-w-0 pr-2 max-w-[80%]">
        <h3 className="text-xl sm:text-2xl font-black font-heading leading-tight line-clamp-3 [overflow-wrap:anywhere] break-words">
          {headline}
        </h3>
        {subtext && (
          <p className={`text-xs font-medium leading-snug line-clamp-2 mt-2 ${subtextClasses} [overflow-wrap:anywhere] break-words`}>
            {subtext}
          </p>
        )}
      </div>

      {/* Image anchored to bottom-right (about 70% width, anchored strictly to lower half) */}
      <div className="promo-tile-media absolute right-0 bottom-0 w-[70%] h-[48%] pointer-events-none z-0 flex items-end justify-end overflow-hidden">
        {!imageError && config.image ? (
          <img
            src={config.image}
            alt=""
            onError={() => setImageError(true)}
            className="w-full h-full object-contain object-bottom-right translate-x-3 translate-y-2 filter drop-shadow-lg transition-transform duration-300 motion-reduce:transform-none group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-24 h-24 opacity-85 flex items-end justify-end translate-x-2 translate-y-1">
            <HardwareIllustration type={resolvedHardwareType} className="w-20 h-20" />
          </div>
        )}
      </div>

      {/* Bottom-Left Pinned Button */}
      <div className="relative z-10 mt-auto pt-6">
        <span
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${buttonClasses}`}
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </span>
      </div>
    </div>
  );
};
