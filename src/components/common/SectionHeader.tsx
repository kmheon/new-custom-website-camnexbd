import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SectionHeaderProps {
  eyebrow: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  actionText?: string;
  onAction?: () => void;
  dark?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  align = 'left',
  actionText,
  onAction,
  dark = false,
  className = ''
}) => {
  const isCentered = align === 'center';

  return (
    <div
      className={`flex flex-col ${
        isCentered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      } gap-4 ${className}`}
    >
      <div className={`space-y-2 max-w-2xl ${isCentered ? 'mx-auto' : ''}`}>
        {/* Small Orange Eyebrow: tiny line icon + UPPERCASE 12px tracking label */}
        <div
          className={`inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider ${
            dark ? 'text-[#F15A24]' : 'text-[#F15A24]'
          } ${isCentered ? 'justify-center' : ''}`}
        >
          {eyebrowIcon || <Sparkles className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />}
          <span>{eyebrow}</span>
        </div>

        {/* H2: 36px desktop / 26px mobile, bold, tight line-height */}
        <h2
          className={`text-[26px] md:text-[36px] font-bold font-heading tracking-tight leading-[1.18] ${
            dark ? 'text-white' : 'text-[#111827]'
          }`}
        >
          {title}
        </h2>

        {/* Muted one-line subtext */}
        {subtitle && (
          <p
            className={`text-sm md:text-base leading-relaxed ${
              dark ? 'text-white/70' : 'text-[#5B6472]'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Action link (View all) on the right for left-aligned headers */}
      {!isCentered && actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`shrink-0 inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#F15A24] hover:text-[#D94D1C] transition-colors group cursor-pointer self-start sm:self-end pb-1`}
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};

