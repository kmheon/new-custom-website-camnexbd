import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export const ImageWithFallback: React.FC<Props> = ({
  src,
  alt,
  className = '',
  fallbackIcon
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-4 rounded-xl ${className}`}>
        {fallbackIcon || <Camera className="w-8 h-8 text-orange-500/70 mb-2" />}
        <span className="text-xs text-center text-slate-400 font-medium line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};
