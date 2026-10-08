import React, { useState } from 'react';
import { Camera, Shield, Server, Wifi } from 'lucide-react';

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
  fallbackIcon
}) => {
  const [error, setError] = useState(false);

  // If no src or failed to load, show a clean, beautifully styled hardware placeholder tile
  // Never show raw alt text or a broken icon
  if (error || !src || src.trim() === '') {
    const isAccess = category?.toLowerCase().includes('access') || category?.toLowerCase().includes('bio');
    const isNet = category?.toLowerCase().includes('net') || category?.toLowerCase().includes('switch');
    const isWifi = category?.toLowerCase().includes('wifi') || category?.toLowerCase().includes('wireless');

    return (
      <div 
        role="img"
        aria-label={alt}
        className={`relative flex items-center justify-center bg-[#F4EEE6] border border-[#EDE8E1] rounded-2xl overflow-hidden select-none ${className}`}
      >
        <div className="flex flex-col items-center justify-center p-4">
          {fallbackIcon || (
            <div className="w-12 h-12 rounded-xl bg-white border border-[#EDE8E1] shadow-xs flex items-center justify-center text-[#F15A24]">
              {isAccess ? (
                <Shield className="w-6 h-6" strokeWidth={1.75} />
              ) : isNet ? (
                <Server className="w-6 h-6" strokeWidth={1.75} />
              ) : isWifi ? (
                <Wifi className="w-6 h-6" strokeWidth={1.75} />
              ) : (
                <Camera className="w-6 h-6" strokeWidth={1.75} />
              )}
            </div>
          )}
        </div>
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
