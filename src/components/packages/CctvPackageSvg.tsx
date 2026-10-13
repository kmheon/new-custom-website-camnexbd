import React from 'react';
import { SecurityPackage } from '../../types';

export const CctvPackageSvg: React.FC<{ pkg: SecurityPackage }> = ({ pkg }) => {
  const series = (pkg.seriesId || pkg.seriesName || '').toLowerCase();
  const name = (pkg.name || '').toLowerCase();
  const desc = (pkg.description || '').toLowerCase();

  const isWireless = series.includes('wireless') || name.includes('wireless') || name.includes('wi-fi') || desc.includes('wireless');
  const isColor = series.includes('full-color') || series.includes('color') || name.includes('color') || desc.includes('color');
  const isHybrid = series.includes('hybrid') || name.includes('hybrid') || desc.includes('hybrid');
  const isEnterprise = (pkg.cameraCount && pkg.cameraCount >= 16) || series.includes('enterprise') || series.includes('ptz') || name.includes('enterprise') || name.includes('ptz');

  if (isWireless) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#F0FDF4] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Wireless CCTV Kit">
          <rect x="70" y="40" width="60" height="55" rx="12" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2" />
          <circle cx="100" cy="65" r="15" fill="#0F172A" />
          <circle cx="100" cy="65" r="7" fill="#3B82F6" />
          <circle cx="103" cy="62" r="2.5" fill="#FFFFFF" />
          <line x1="120" y1="40" x2="135" y2="15" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="137" cy="12" r="3" fill="#16A34A" />
          <path d="M142 8 A 8 8 0 0 1 148 18" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M147 4 A 14 14 0 0 1 155 20" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="25" y="70" width="28" height="24" rx="4" fill="#334155" />
          <line x1="28" y1="94" x2="28" y2="102" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="94" x2="34" y2="102" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <path d="M53 82 C60 82 62 80 70 80" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
          <rect x="150" y="72" width="22" height="26" rx="3" fill="#0F172A" stroke="#22C55E" strokeWidth="1.5" />
          <text x="154" y="88" fill="#22C55E" fontSize="7" fontWeight="bold">SD</text>
        </svg>
      </div>
    );
  }

  if (isHybrid) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#FFFBEB] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Smart Hybrid Light CCTV Kit">
          <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
          <rect x="35" y="74" width="32" height="4" rx="2" fill="#F59E0B" />
          <circle cx="155" cy="84" r="3" fill="#22C55E" />
          <circle cx="165" cy="84" r="3" fill="#3B82F6" />
          <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
          <circle cx="145" cy="40" r="22" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <circle cx="145" cy="40" r="16" stroke="#EF4444" strokeWidth="3" strokeDasharray="4 3" fill="none" />
          <circle cx="145" cy="40" r="8" fill="#FEF3C7" />
          <rect x="42" y="22" width="55" height="26" rx="4" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
          <path d="M97 26 L118 18 L118 52 L97 44 Z" fill="#B45309" />
          <circle cx="52" cy="35" r="7" fill="#0F172A" />
          <circle cx="52" cy="35" r="3" fill="#F59E0B" />
          <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
          <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
        </svg>
      </div>
    );
  }

  if (isColor) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#FFF8F4] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ColorVu CCTV Kit">
          <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
          <rect x="35" y="74" width="32" height="4" rx="2" fill="#F15A24" />
          <circle cx="155" cy="84" r="3" fill="#22C55E" />
          <circle cx="165" cy="84" r="3" fill="#3B82F6" />
          <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
          <circle cx="145" cy="40" r="22" stroke="#F15A24" strokeWidth="4" strokeDasharray="4 4" fill="none" />
          <circle cx="145" cy="40" r="10" fill="#FED7AA" />
          <rect x="42" y="22" width="55" height="26" rx="4" fill="#FFFFFF" stroke="#F97316" strokeWidth="1.5" />
          <path d="M97 26 L118 18 L118 52 L97 44 Z" fill="#EA580C" />
          <circle cx="52" cy="35" r="7" fill="#0F172A" />
          <circle cx="52" cy="35" r="3" fill="#FBBF24" />
          <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
          <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
        </svg>
      </div>
    );
  }

  if (isEnterprise) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#F8FAFC] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Enterprise CCTV Kit">
          <rect x="20" y="70" width="160" height="35" rx="5" fill="#0F172A" />
          <rect x="30" y="80" width="40" height="5" rx="2" fill="#3B82F6" />
          <circle cx="150" cy="87" r="4" fill="#22C55E" />
          <circle cx="162" cy="87" r="4" fill="#3B82F6" />
          <circle cx="174" cy="87" r="4" fill="#EAB308" />
          <path d="M80 30 C80 18 120 18 120 30 L115 50 L85 50 Z" fill="#334155" />
          <circle cx="100" cy="52" r="14" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
          <circle cx="100" cy="52" r="6" fill="#0284C7" />
          <line x1="75" y1="18" x2="125" y2="18" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Pure IR standard
  return (
    <div className="w-full h-36 sm:h-44 bg-[#F1F5F9] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
      <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Infrared CCTV Kit">
        <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
        <rect x="35" y="74" width="30" height="4" rx="2" fill="#64748B" />
        <circle cx="155" cy="84" r="3" fill="#22C55E" />
        <circle cx="165" cy="84" r="3" fill="#3B82F6" />
        <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
        <circle cx="145" cy="40" r="18" stroke="#DC2626" strokeWidth="2.5" fill="none" />
        <circle cx="145" cy="40" r="10" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
        <rect x="42" y="24" width="55" height="24" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        <path d="M97 27 L116 20 L116 50 L97 43 Z" fill="#94A3B8" />
        <circle cx="52" cy="36" r="6" fill="#0F172A" />
        <circle cx="52" cy="36" r="2.5" fill="#38BDF8" />
        <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
        <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
      </svg>
    </div>
  );
};

