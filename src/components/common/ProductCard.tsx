import React, { useState } from 'react';
import { ShoppingBag, Check, ShieldCheck, Camera, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { useCartStore, useCompareStore } from '../../store';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, param?: string) => void;
  className?: string;
  showSampleBadge?: boolean;
}

// Strip brand and model number repetitions from title
export function cleanProductTitle(name: string, brand?: string, model?: string): string {
  if (!name) return '';
  let cleaned = name;

  if (brand) {
    const brandRegex = new RegExp(`^${brand}\\s+`, 'i');
    cleaned = cleaned.replace(brandRegex, '');
  }

  if (model) {
    const escapedModel = model.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const modelRegex = new RegExp(`\\s*\\(?${escapedModel}\\)?\\s*`, 'gi');
    cleaned = cleaned.replace(modelRegex, ' ');
  }

  return cleaned.trim() || name;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  className = '',
  showSampleBadge = true
}) => {
  const [imageError, setImageError] = useState(false);
  const addItemToCart = useCartStore((s) => s.addItem);
  const { hasProduct, addProduct, removeProduct } = useCompareStore();
  const [justAdded, setJustAdded] = useState(false);

  const inCompare = hasProduct(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addItemToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) {
      removeProduct(product.id);
    } else {
      addProduct(product.id);
    }
  };

  const regularPrice = product.pricing?.regularPrice;
  const salePrice = product.pricing?.salePrice;
  const hasPrice = typeof regularPrice === 'number' && regularPrice > 0;
  const hasSale = typeof salePrice === 'number' && salePrice > 0 && hasPrice && salePrice < regularPrice;
  const discountPct = hasSale ? Math.round((1 - salePrice / regularPrice) * 100) : 0;

  // Clean title without repeated brand or model
  const cleanTitle = cleanProductTitle(product.name, product.brand, product.modelNumber);

  // Extract 3-4 highlight features (from specs flagged isHighlight or keyFeatures)
  const highlights: string[] = [];
  if (product.specs) {
    Object.values(product.specs).forEach((sp: any) => {
      if (sp && (sp.isHighlight || sp.showInHighlights) && sp.value && highlights.length < 4) {
        highlights.push(`${sp.label ? sp.label + ': ' : ''}${sp.value}`);
      }
    });
  }
  if (highlights.length === 0 && Array.isArray(product.keyFeatures)) {
    product.keyFeatures.slice(0, 3).forEach((kf) => {
      if (typeof kf === 'string' && kf.trim()) {
        highlights.push(kf.trim());
      }
    });
  }

  // Warranty data exists check
  const hasWarranty = typeof product.warranty === 'string' && product.warranty.trim().length > 0;

  return (
    <div
      onClick={() => onNavigate('product', product.id)}
      className={`bg-white rounded-2xl border border-[#EDE8E1] p-4 sm:p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer h-full ${className}`}
    >
      <div>
        {/* LARGER IMAGE AREA ON SOFT GRADIENT */}
        <div className="h-48 sm:h-52 rounded-xl overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-[#F4EEE6] mb-4 relative flex items-center justify-center p-3">
          {!imageError && product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt=""
              onError={() => setImageError(true)}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-[#F4EEE6] rounded-lg p-4 text-center">
              <Camera className="w-8 h-8 text-[#5B6472]/40 mb-1" />
              <span className="text-[10px] font-bold text-[#5B6472]/70 uppercase tracking-wider font-mono">
                {product.modelNumber || 'Hardware'}
              </span>
            </div>
          )}

          {/* Top-Left Brand Logo / Chip */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#141210] text-white shadow-xs">
              {product.brand}
            </span>
          </div>

          {/* Top-Right Optional Badge (Sale -X% / New / Hot / Sample) */}
          <div className="absolute top-2.5 right-2.5">
            {hasSale ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F15A24] text-white shadow-xs">
                -{discountPct}%
              </span>
            ) : product.isFeatured ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                Hot
              </span>
            ) : showSampleBadge && product.isDemo ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-900/80 text-slate-300 backdrop-blur-xs">
                Sample
              </span>
            ) : null}
          </div>

          {/* Quick-action compare button on hover */}
          <button
            type="button"
            onClick={handleToggleCompare}
            title={inCompare ? 'Remove from compare' : 'Add to compare'}
            className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-full border shadow-md transition-all ${
              inCompare
                ? 'bg-[#F15A24] border-[#F15A24] text-white opacity-100'
                : 'bg-white/90 hover:bg-white border-[#EDE8E1] text-[#111827] opacity-0 group-hover:opacity-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MODEL NUMBER IN SMALL MUTED MONOSPACE ABOVE TITLE */}
        <div className="text-[11px] font-mono text-[#5B6472] uppercase tracking-wider mb-1 truncate">
          {product.modelNumber}
        </div>

        {/* CLEAN TITLE WITHOUT REPEATED BRAND OR MODEL */}
        <h3
          className="font-bold text-sm sm:text-base text-[#111827] group-hover:text-[#F15A24] transition-colors font-heading line-clamp-2 leading-snug mb-3"
          title={product.name}
        >
          {cleanTitle}
        </h3>

        {/* 3-4 HIGHLIGHT FEATURES (NO DESCRIPTION TEXT) */}
        {highlights.length > 0 && (
          <div className="space-y-1 mb-4">
            {highlights.map((hl, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#5B6472] truncate">
                <CheckCircle2 className="w-3 h-3 text-[#F15A24] flex-shrink-0" />
                <span className="truncate">{hl}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRICING & ACTION BUTTONS */}
      <div className="pt-3 border-t border-[#EDE8E1]/80 mt-2">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            {hasSale ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-black text-[#111827] font-heading">
                  ৳{salePrice.toLocaleString()}
                </span>
                <span className="text-xs text-[#5B6472] line-through">
                  ৳{regularPrice.toLocaleString()}
                </span>
              </div>
            ) : hasPrice ? (
              <div className="text-lg sm:text-xl font-black text-[#111827] font-heading">
                ৳{regularPrice.toLocaleString()}
              </div>
            ) : (
              <div className="text-xs font-bold text-[#5B6472]">
                Request quotation
              </div>
            )}
          </div>

          {hasWarranty && (
            <span className="text-[10px] font-semibold text-emerald-600 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{product.warranty}</span>
            </span>
          )}
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('product', product.id);
            }}
            className="w-full py-2.5 px-3 text-xs font-bold text-[#111827] bg-[#FAF7F2] hover:bg-[#F4EEE6] rounded-full transition-colors text-center border border-[#EDE8E1] cursor-pointer"
          >
            Details
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-3 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#F15A24] hover:bg-[#D94D1C] text-white'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E1] p-4 sm:p-5 animate-pulse flex flex-col justify-between h-[420px]">
      <div>
        <div className="h-48 sm:h-52 rounded-xl bg-slate-200 mb-4" />
        <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
        <div className="h-5 w-4/5 bg-slate-200 rounded mb-3" />
        <div className="space-y-1.5 mb-4">
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="pt-3 border-t border-[#EDE8E1]">
        <div className="h-6 w-24 bg-slate-200 rounded mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-slate-200 rounded-full" />
          <div className="h-9 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};
