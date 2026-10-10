import React from 'react';
import { SmartImage, ImagePlaceholder, HardwarePlaceholderType } from './common/ImagePlaceholder';

export { SmartImage, ImagePlaceholder };
export type { HardwarePlaceholderType };

interface Props {
  src: string;
  alt: string;
  className?: string;
  category?: string;
  fallbackIcon?: React.ReactNode;
}

export const ImageWithFallback: React.FC<Props> = ({
  src,
  alt,
  className = '',
  category,
}) => {
  return (
    <SmartImage
      src={src}
      alt={alt}
      className={className}
      category={category}
    />
  );
};
