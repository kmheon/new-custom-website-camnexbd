import React, { useState, useEffect, useRef } from 'react';

export interface GlossaryItem {
  id: string;
  term: string;
  slug: string;
  shortMeaning: string;
  longMeaning?: string;
  order?: number;
  isActive?: boolean;
}

// Built-in neutral glossary explanations (instantaneous render, updated via /api/glossary)
export const DEFAULT_GLOSSARY: Record<string, { short: string; long?: string }> = {
  'ip camera': {
    short: 'Digital camera that connects to a computer network',
    long: 'Sends and receives video data over an Ethernet network cable without separate coaxial lines.'
  },
  'analogue camera': {
    short: 'Camera that sends video over coaxial cable',
    long: 'Standard surveillance camera connected directly to a DVR recorder using coaxial video cable.'
  },
  'dvr': {
    short: 'The box that records video from analogue cameras',
    long: 'Digital Video Recorder that connects to coaxial cameras and stores footage on hard drives.'
  },
  'nvr': {
    short: 'The box that records video from network IP cameras',
    long: 'Network Video Recorder that connects to IP cameras over network switches or built-in PoE ports.'
  },
  'poe': {
    short: 'Power sent through the network cable',
    long: 'Power over Ethernet technology that sends both electrical power and data over one network cable.'
  },
  'ir': {
    short: 'Black-and-white picture in the dark',
    long: 'Uses invisible infrared light LEDs to illuminate the scene in black and white at night.'
  },
  'ir (infrared)': {
    short: 'Black-and-white picture in the dark',
    long: 'Uses invisible infrared light LEDs to illuminate the scene in black and white at night.'
  },
  'night vision (ir)': {
    short: 'Black-and-white picture in the dark',
    long: 'Uses invisible infrared light LEDs to illuminate the scene in black and white at night.'
  },
  'ptz': {
    short: 'A camera you can turn and zoom by remote',
    long: 'Pan-Tilt-Zoom camera that can rotate horizontally, tilt vertically, and zoom optically via app or joystick.'
  },
  'hybrid light': {
    short: 'Infrared in the dark, plus a white light that gives a color picture when motion is detected',
    long: 'Stays discreet with infrared night vision, then switches to a soft white light for color video when motion is detected.'
  },
  'full-color': {
    short: 'Color picture at night',
    long: 'Uses large lens apertures and sensitive sensors to deliver vibrant color video even in dark conditions.'
  },
  'wi-fi camera': {
    short: 'Camera that connects wirelessly to your router',
    long: 'Standalone security camera that streams and records video directly through your Wi-Fi network.'
  },
  'microsd': {
    short: 'Small memory card inside the camera for recordings',
    long: 'Local onboard flash memory storage card inserted into the camera so it records without an NVR.'
  },
  'bullet': {
    short: 'Cylinder-shaped camera with visible pointing direction',
    long: 'Elongated cylindrical camera body with sunshield, easy to aim and mount on walls or poles.'
  },
  'dome': {
    short: 'Circular dome-shaped camera mounted flat to ceilings or walls',
    long: 'Compact circular dome camera with transparent casing, ideal for clean indoor ceilings.'
  },
  'turret': {
    short: 'Ball-and-socket camera with no glass dome reflection',
    long: 'Eyeball design that prevents infrared light glare and dust buildup commonly seen on glass domes.'
  },
  'mp': {
    short: 'Millions of pixels measuring picture sharpness',
    long: 'Megapixels indicate image detail: 2MP is 1080p Full HD, 4MP is 2K Quad HD, and 8MP is 4K Ultra HD.'
  },
  'mp (resolution)': {
    short: 'Millions of pixels measuring picture sharpness',
    long: 'Megapixels indicate image detail: 2MP is 1080p Full HD, 4MP is 2K Quad HD, and 8MP is 4K Ultra HD.'
  }
};

let cachedGlossary: Record<string, { short: string; long?: string }> = { ...DEFAULT_GLOSSARY };
let isFetching = false;

export function fetchGlossaryOnce() {
  if (isFetching || typeof window === 'undefined') return;
  isFetching = true;
  fetch('/api/glossary')
    .then(r => r.ok ? r.json() : [])
    .then((items: GlossaryItem[]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          const key = item.term.toLowerCase().trim();
          cachedGlossary[key] = { short: item.shortMeaning, long: item.longMeaning };
          if (item.slug) {
            cachedGlossary[item.slug.toLowerCase().trim()] = { short: item.shortMeaning, long: item.longMeaning };
          }
        });
      }
    })
    .catch(() => {});
}

interface TermProps {
  term?: string;
  text?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Term: React.FC<TermProps> = ({
  term,
  text,
  description,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    fetchGlossaryOnce();
  }, []);

  const rawTerm = (term || text || (typeof children === 'string' ? children : '') || '').toString();
  const lookupKey = rawTerm.toLowerCase().trim();
  const entry = lookupKey ? (cachedGlossary[lookupKey] || cachedGlossary[lookupKey.replace(/[^a-z0-9]+/g, '-')] || null) : null;
  const meaning = description || entry?.short || '';
  const detailed = entry?.long;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // If no term or no meaning available, simply render children
  if (!lookupKey || !meaning) {
    return <>{children || rawTerm}</>;
  }

  const termId = `term-${lookupKey.replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-describedby={termId}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`inline-flex items-center cursor-help border-b border-dotted border-slate-400 hover:border-[#F15A24] hover:text-[#F15A24] transition-colors ${className}`}
      >
        {children || rawTerm}
      </span>

      {/* Accessible tooltip / popover */}
      {isOpen && (
        <span
          id={termId}
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl pointer-events-auto leading-relaxed text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="font-bold text-orange-400 block mb-0.5">{term}</span>
          <span className="block text-slate-200">{meaning}</span>
          {detailed && (
            <span className="block mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              {detailed}
            </span>
          )}
          {/* Caret pointing down */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
};

export default Term;

