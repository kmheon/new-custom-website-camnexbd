import React, { useState } from 'react';

export type HardwarePlaceholderType =
  | 'bullet-camera'
  | 'dome-camera'
  | 'recorder'
  | 'switch'
  | 'access-point'
  | 'biometric'
  | 'poe'
  | 'kit'
  | 'accessory'
  | 'generic'
  | 'brand';

export interface ImagePlaceholderProps {
  type?: HardwarePlaceholderType;
  category?: string;
  name?: string;
  model?: string;
  brandName?: string;
  className?: string;
  containerClassName?: string;
  iconOnly?: boolean;
}

/**
 * Resolves the appropriate hardware placeholder type based on category, name, or model strings.
 */
export function resolveHardwareType(category = '', name = '', model = '', explicitType?: HardwarePlaceholderType): HardwarePlaceholderType {
  if (explicitType) return explicitType;
  const s = `${category} ${name} ${model}`.toLowerCase();

  if (s.includes('dome') || s.includes('turret') || s.includes('eyeball')) return 'dome-camera';
  if (s.includes('bullet') || s.includes('cctv') || s.includes('camera') || s.includes('colorvu') || s.includes('ip camera')) return 'bullet-camera';
  if (s.includes('dvr') || s.includes('nvr') || s.includes('recorder') || s.includes('xvr') || s.includes('surveillance station')) return 'recorder';
  if (s.includes('biometric') || s.includes('fingerprint') || s.includes('facial') || s.includes('access control') || s.includes('time attendance') || s.includes('rfid')) return 'biometric';
  if (s.includes('switch') || s.includes('router') || s.includes('ethernet') || s.includes('gigabit')) return 'switch';
  if (s.includes('access point') || s.includes('access-point') || s.includes('ap') || s.includes('wifi') || s.includes('wireless') || s.includes('reyee')) return 'access-point';
  if (s.includes('poe') || s.includes('power over ethernet') || s.includes('injector')) return 'poe';
  if (s.includes('kit') || s.includes('package') || s.includes('bundle') || s.includes('combo')) return 'kit';
  if (s.includes('cable') || s.includes('bracket') || s.includes('mount') || s.includes('adapter') || s.includes('power supply') || s.includes('balun') || s.includes('connector') || s.includes('hdd') || s.includes('storage') || s.includes('hard drive') || s.includes('accessory') || s.includes('accessories')) return 'accessory';

  return 'generic';
}

/**
 * Clean hardware SVGs in consistent CamneX engineering style (#1E293B base, #64748B outline, #F15A24 CamneX orange accent)
 */
export const HardwareIllustration: React.FC<{ type: HardwarePlaceholderType; className?: string }> = ({
  type,
  className = 'w-16 h-16'
}) => {
  switch (type) {
    case 'bullet-camera':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Mounting arm & base */}
          <rect x="24" y="62" width="28" height="6" rx="2" fill="#334155" stroke="#64748B" strokeWidth="1" />
          <path d="M38 48 L38 62" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="38" cy="48" r="4" fill="#1E293B" stroke="#F15A24" strokeWidth="1.5" />
          {/* Main bullet body */}
          <rect x="18" y="24" width="46" height="24" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* Sunshield visor */}
          <path d="M14 22 L68 22 L64 26 L18 26 Z" fill="#334155" stroke="#64748B" strokeWidth="1" />
          {/* Front lens cone & bezel */}
          <path d="M64 26 L80 18 L80 50 L64 42 Z" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
          <ellipse cx="80" cy="34" rx="3" ry="16" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
          {/* IR ring and glass lens */}
          <circle cx="34" cy="36" r="7" fill="#0F172A" />
          <circle cx="34" cy="36" r="3.5" fill="#F15A24" />
          <circle cx="35" cy="35" r="1" fill="#FFFFFF" />
          <circle cx="23" cy="36" r="1.5" fill="#EF4444" />
        </svg>
      );

    case 'dome-camera':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Ceiling mount base */}
          <rect x="18" y="16" width="64" height="8" rx="3" fill="#334155" stroke="#64748B" strokeWidth="1.2" />
          {/* Outer ring */}
          <path d="M22 24 L78 24 L74 34 L26 34 Z" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* Transparent / smoked glass dome */}
          <path d="M26 34 C26 58 74 58 74 34 Z" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
          {/* Internal rotating turret ball & lens */}
          <circle cx="50" cy="42" r="14" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <circle cx="52" cy="43" r="6" fill="#0F172A" stroke="#F15A24" strokeWidth="1.5" />
          <circle cx="53" cy="42" r="2.5" fill="#F15A24" />
          <circle cx="54" cy="41" r="0.8" fill="#FFFFFF" />
        </svg>
      );

    case 'recorder':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* NVR/DVR rack chassis */}
          <rect x="14" y="24" width="72" height="32" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* Rack ears */}
          <rect x="10" y="27" width="4" height="26" rx="1" fill="#334155" stroke="#64748B" strokeWidth="1" />
          <rect x="86" y="27" width="4" height="26" rx="1" fill="#334155" stroke="#64748B" strokeWidth="1" />
          {/* Status LEDs */}
          <circle cx="24" cy="35" r="2" fill="#22C55E" />
          <circle cx="31" cy="35" r="2" fill="#F15A24" />
          <circle cx="38" cy="35" r="2" fill="#38BDF8" />
          {/* Front vent grille */}
          <line x1="22" y1="44" x2="52" y2="44" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="48" x2="52" y2="48" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          {/* USB Port & Power button */}
          <rect x="68" y="38" width="8" height="4" rx="1" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
          <circle cx="80" cy="40" r="3" fill="#0F172A" stroke="#F15A24" strokeWidth="1" />
        </svg>
      );

    case 'switch':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Enterprise switch chassis */}
          <rect x="12" y="26" width="76" height="28" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* System status LED */}
          <circle cx="20" cy="34" r="2" fill="#22C55E" />
          <circle cx="20" cy="44" r="1.5" fill="#F15A24" />
          {/* 6 RJ45 Ports with dual link/activity LEDs */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(${28 + i * 9}, 32)`}>
              <rect x="0" y="0" width="6.5" height="8" rx="1" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
              <circle cx="1.5" cy="-3" r="0.9" fill="#22C55E" />
              <circle cx="5" cy="-3" r="0.9" fill={i % 2 === 0 ? '#38BDF8' : '#22C55E'} />
            </g>
          ))}
          {/* SFP port cage */}
          <rect x="76" y="32" width="7" height="9" rx="1" fill="#0F172A" stroke="#F15A24" strokeWidth="1" />
        </svg>
      );

    case 'access-point':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Ceiling disc access point */}
          <circle cx="50" cy="40" r="28" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="50" cy="40" r="20" fill="#0F172A" stroke="#334155" strokeWidth="1" />
          {/* Elegant status LED ring */}
          <circle cx="50" cy="40" r="12" fill="none" stroke="#F15A24" strokeWidth="1.5" strokeDasharray="6 3" />
          {/* Center logo node */}
          <circle cx="50" cy="40" r="5" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <circle cx="50" cy="40" r="1.8" fill="#FFFFFF" />
        </svg>
      );

    case 'biometric':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Wall-mount terminal body */}
          <rect x="28" y="12" width="44" height="56" rx="6" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* Camera / screen display panel */}
          <rect x="34" y="18" width="32" height="24" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          {/* Dual IR camera and LED */}
          <circle cx="44" cy="24" r="2.5" fill="#38BDF8" />
          <circle cx="56" cy="24" r="2.5" fill="#38BDF8" />
          <line x1="39" y1="33" x2="61" y2="33" stroke="#F15A24" strokeWidth="1.5" strokeLinecap="round" />
          {/* Optical fingerprint sensor window with scanner arc */}
          <rect x="37" y="47" width="26" height="15" rx="3" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
          <path d="M43 57 C43 51 57 51 57 57" stroke="#F15A24" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          <circle cx="50" cy="56" r="1.5" fill="#F15A24" />
        </svg>
      );

    case 'poe':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* PoE power adapter block */}
          <rect x="22" y="20" width="56" height="40" rx="5" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* RJ45 Data & PoE Out ports */}
          <rect x="30" y="48" width="16" height="8" rx="1" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          <rect x="54" y="48" width="16" height="8" rx="1" fill="#0F172A" stroke="#F15A24" strokeWidth="1" />
          {/* High voltage power lightning icon */}
          <path d="M52 26 L44 37 L49 37 L46 45 L56 34 L51 34 Z" fill="#F15A24" stroke="#D94D1C" strokeWidth="0.5" />
          <circle cx="70" cy="28" r="2" fill="#22C55E" />
        </svg>
      );

    case 'kit':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* CCTV Package bundle box */}
          <rect x="18" y="22" width="64" height="42" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* Kit divider / ribbon */}
          <line x1="50" y1="22" x2="50" y2="64" stroke="#F15A24" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Mini camera icon on left */}
          <rect x="24" y="32" width="18" height="12" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          <circle cx="33" cy="38" r="3" fill="#F15A24" />
          {/* Mini NVR icon on right */}
          <rect x="56" y="32" width="20" height="12" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          <circle cx="62" cy="38" r="1.5" fill="#22C55E" />
          <circle cx="67" cy="38" r="1.5" fill="#38BDF8" />
          <circle cx="72" cy="38" r="1.5" fill="#F15A24" />
        </svg>
      );

    case 'accessory':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Heavy-duty bracket mount & connector cable */}
          <path d="M24 24 L52 24 L52 34 L38 34 L38 56 L24 56 Z" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          {/* Hex screw holes */}
          <circle cx="31" cy="29" r="2.5" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
          <circle cx="31" cy="50" r="2.5" fill="#0F172A" stroke="#64748B" strokeWidth="1" />
          {/* Coaxial / network cable connector */}
          <rect x="58" y="36" width="22" height="14" rx="3" fill="#0F172A" stroke="#F15A24" strokeWidth="1.5" />
          <line x1="80" y1="43" x2="88" y2="43" stroke="#F15A24" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="64" cy="43" r="2" fill="#FFFFFF" />
        </svg>
      );

    case 'brand':
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="16" y="24" width="68" height="32" rx="6" fill="#1E293B" stroke="#64748B" strokeWidth="1.2" />
          <circle cx="30" cy="40" r="4.5" fill="#F15A24" />
          <line x1="42" y1="36" x2="72" y2="36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="44" x2="64" y2="44" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'generic':
    default:
      return (
        <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Engineering hardware module */}
          <rect x="18" y="20" width="64" height="40" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="34" cy="40" r="8" fill="#0F172A" stroke="#F15A24" strokeWidth="1.5" />
          <circle cx="34" cy="40" r="3" fill="#F15A24" />
          <rect x="50" y="32" width="22" height="4" rx="1" fill="#475569" />
          <rect x="50" y="42" width="16" height="4" rx="1" fill="#475569" />
        </svg>
      );
  }
};

/**
 * ImagePlaceholder: Permanent production placeholder component.
 * Strict rules:
 * - Render ONLY when no image is uploaded or image failed to load.
 * - Never show raw alt text or a broken-image icon.
 * - No "Sample item" label on placeholders.
 */
export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  type,
  category = '',
  name = '',
  model = '',
  brandName = '',
  className = 'w-16 h-16',
  containerClassName = 'w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#FAF7F2] to-[#F4EEE6] select-none',
  iconOnly = false
}) => {
  const resolvedType = resolveHardwareType(category, name, model, type);

  if (iconOnly) {
    return <HardwareIllustration type={resolvedType} className={className} />;
  }

  // If brand wordmark requested without image
  if (resolvedType === 'brand' || brandName) {
    return (
      <div className={`relative ${containerClassName}`} role="img" aria-label={brandName || 'Hardware Brand'}>
        <div className="flex flex-col items-center justify-center">
          <HardwareIllustration type="brand" className={className} />
          {brandName && (
            <span className="mt-1.5 text-xs font-black tracking-wider uppercase text-[#111827]">
              {brandName}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${containerClassName}`}
      role="img"
      aria-label={`${category || 'Hardware'} illustration`}
    >
      <div className="flex flex-col items-center justify-center">
        <HardwareIllustration type={resolvedType} className={className} />
        {(model || name) && (
          <span className="mt-2 text-[10px] font-bold font-mono tracking-wider uppercase text-[#5B6472]/80 truncate max-w-[140px]">
            {model || name}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * SmartImage: Wraps HTML <img> with bulletproof fallback to ImagePlaceholder.
 * - Shows image if valid and loaded successfully.
 * - If src is missing, empty, or triggers onError/404, cleanly swaps to ImagePlaceholder.
 * - Suppresses all raw browser alt text or broken-image icons.
 */
export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: HardwarePlaceholderType;
  category?: string;
  name?: string;
  model?: string;
  brandName?: string;
  placeholderClassName?: string;
  placeholderContainerClassName?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackType,
  category,
  name,
  model,
  brandName,
  placeholderClassName = 'w-16 h-16',
  placeholderContainerClassName = 'w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-b from-[#FAF7F2] to-[#F4EEE6] select-none',
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const isInvalidSrc = !src || typeof src !== 'string' || src.trim() === '';

  if (hasError || isInvalidSrc) {
    return (
      <ImagePlaceholder
        type={fallbackType}
        category={category}
        name={name}
        model={model}
        brandName={brandName}
        className={placeholderClassName}
        containerClassName={placeholderContainerClassName}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        setHasError(true);
        if (onError) onError(e);
      }}
      loading={props.loading || 'lazy'}
      {...props}
    />
  );
};

