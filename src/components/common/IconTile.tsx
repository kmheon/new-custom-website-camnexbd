import React from 'react';

export interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
  variant?: 'default' | 'inverted' | 'subtle';
  active?: boolean;
}

const sizeClasses: Record<NonNullable<IconTileProps['size']>, string> = {
  xs: 'w-6 h-6 p-1 text-xs',
  sm: 'w-8 h-8 p-1.5 text-sm',
  md: 'w-9 h-9 p-2 text-base',
  lg: 'w-11 h-11 p-2.5 text-lg',
  xl: 'w-12 h-12 p-3 text-xl'
};

/**
 * Shared IconTile component adhering to strict contrast and hover rules:
 * - Default state: Tinted background (bg-orange-50 / #FFF4EC) with brand orange icon (text-[#F15A24]), >= 3.5:1 contrast.
 * - Hover / Focus / Active: Turns solid brand orange (bg-[#F15A24]) and icon turns pure white (text-white / rgb(255,255,255)).
 * - All icons inside must use currentColor for stroke and fill to automatically adopt the white text color.
 * - Supports group-hover from parent cards/tiles as well as self-hover.
 */
export const IconTile: React.FC<IconTileProps> = ({
  children,
  size = 'md',
  rounded = 'rounded-xl',
  variant = 'default',
  active = false,
  className = '',
  ...props
}) => {
  const baseSize = sizeClasses[size];

  // Inverted: Solid orange by default, darker on hover
  if (variant === 'inverted') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 transition-colors duration-200 select-none ${baseSize} ${rounded} bg-[#F15A24] text-white shadow-2xs group-hover:bg-[#D94D1C] group-focus-visible:bg-[#D94D1C] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Active / Selected state: solid orange with white icon
  if (active) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 transition-colors duration-200 select-none ${baseSize} ${rounded} bg-[#F15A24] text-white shadow-2xs ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Default interactive tile: tinted bg with orange icon; on self-hover or parent group-hover turns solid orange with white icon
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-200 select-none ${baseSize} ${rounded} bg-orange-50 text-[#F15A24] shadow-2xs group-hover:bg-[#F15A24] group-hover:text-white group-focus-visible:bg-[#F15A24] group-focus-visible:text-white group-active:bg-[#F15A24] group-active:text-white hover:bg-[#F15A24] hover:text-white focus-visible:bg-[#F15A24] focus-visible:text-white active:bg-[#F15A24] active:text-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
