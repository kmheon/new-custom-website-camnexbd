import React, { useState } from 'react';
import { ShoppingBag, Check, ShieldCheck, Camera, Layers, CheckCircle2, Heart, Eye, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useCartStore, useCompareStore, useWishlistStore, useCustomerAuthStore } from '../../store';
import { QuickViewModal } from './QuickViewModal';

import { FormattedSpecResult, formatSpecValue } from '../../utils/specUtils';
import { ImagePlaceholder } from './ImagePlaceholder';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, param?: string) => void;
  className?: string;
  showSampleBadge?: boolean;
  allowHot?: boolean; // When false (more than 2 Hot cards in this row), Hot badge is suppressed
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
  showSampleBadge = true,
  allowHot = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  const addItemToCart = useCartStore((s) => s.addItem);
  const { hasProduct, addProduct, removeProduct } = useCompareStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isCustomerAuthenticated } = useCustomerAuthStore();
  const [justAdded, setJustAdded] = useState(false);

  const inCompare = hasProduct(product.id);
  const inWishlist = isInWishlist(product.id);

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

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await toggleWishlist(product, isCustomerAuthenticated);
    const msg = added ? `${product.name} saved to wishlist` : `${product.name} removed from wishlist`;
    setToastText(msg);
    setTimeout(() => setToastText(null), 3000);
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const regularPrice = product.pricing?.regularPrice;
  const salePrice = product.pricing?.salePrice;
  const hasPrice = typeof regularPrice === 'number' && regularPrice > 0;
  const hasSale = typeof salePrice === 'number' && salePrice > 0 && hasPrice && salePrice < regularPrice;
  const discountPct = hasSale ? Math.round((1 - salePrice / regularPrice) * 100) : 0;

  // Clean title without repeated brand or model
  const cleanTitle = cleanProductTitle(product.name, product.brand, product.modelNumber);

  // Extract up to 4 highlights using formatSpecValue:
  // - use field's highlightValue when set
  // - booleans show check icon with field's short label (no tile when false)
  // - numbers append unit
  // - strings > 14 chars fall back to first number + unit, else skipped
  // - never "..." and never raw words "true" or "false"
  const highlightCards: FormattedSpecResult[] = [];

  if (product.specs) {
    Object.entries(product.specs).forEach(([k, sp]: [string, any]) => {
      if (sp && highlightCards.length < 4) {
        const val = sp.value;
        const res = formatSpecValue(sp, val);
        if (res) highlightCards.push(res);
      }
    });
  }

  if (highlightCards.length === 0 && product.specifications) {
    Object.entries(product.specifications).forEach(([k, v]: [string, any]) => {
      if (highlightCards.length < 4) {
        const res = formatSpecValue({ key: k, label: k.replace(/_/g, ' ') }, v);
        if (res) highlightCards.push(res);
      }
    });
  }

  // Fallback to keyFeatures if still empty
  if (highlightCards.length === 0 && Array.isArray(product.keyFeatures)) {
    product.keyFeatures.slice(0, 2).forEach((kf) => {
      if (typeof kf === 'string' && kf.trim() && highlightCards.length < 4) {
        const res = formatSpecValue({ label: 'Feature' }, kf.trim());
        if (res) highlightCards.push(res);
      }
    });
  }

  // Warranty data exists check
  const hasWarranty = typeof product.warranty === 'string' && product.warranty.trim().length > 0;

  return (
    <>
      <div
        onClick={() => onNavigate('product', product.id)}
        className={`bg-white rounded-2xl border border-[#EDE8E1] p-4 sm:p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer h-full min-w-0 ${className}`}
      >
        {/* Aria-live announcement for wishlist toggle */}
        <div aria-live="polite" className="sr-only">
          {toastText}
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
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
              <ImagePlaceholder
                category={product.categoryId || product.category}
                name={product.name}
                model={product.modelNumber}
                className="w-20 h-20"
                containerClassName="w-full h-full flex flex-col items-center justify-center bg-transparent p-4"
              />
            )}

            {/* Top-Left Brand Logo / Chip */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0F172A] text-white shadow-xs">
                {product.brand}
              </span>
            </div>

            {/* Top-Right: Wishlist Heart Button & Quick-View Eye Button directly below */}
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-center gap-1.5">
              {/* Wishlist Heart */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`w-8 h-8 rounded-full border shadow-xs flex items-center justify-center transition-all cursor-pointer ${
                  inWishlist
                    ? 'bg-white border-orange-200 text-[#F15A24]'
                    : 'bg-white/90 hover:bg-white border-[#EDE8E1] text-[#111827] hover:text-[#F15A24]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'text-[#F15A24] fill-[#F15A24]' : ''}`} />
              </button>

              {/* Quick-View Eye Button directly below heart (hover desktop, always visible touch) */}
              <button
                type="button"
                onClick={handleOpenQuickView}
                aria-label="Quick preview product"
                title="Quick View"
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[#EDE8E1] text-[#111827] hover:text-[#F15A24] shadow-xs flex items-center justify-center transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Top-Left Corner Demo tag when sample content is ON (shows "Demo") */}
            {showSampleBadge && (product.isDemo || (product as any).sample) && (
              <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/90 text-slate-950 shadow-xs uppercase tracking-wider">
                  Demo
                </span>
              </div>
            )}

            {/* Bottom-Left Badge: EXACTLY ONE BADGE MAX, priority: Sale (-X%) > Hot > New.
                "Hot" only on admin-flagged products (isFeatured / isHot), never if allowHot is false. */}
            <div className="absolute bottom-2.5 left-2.5 z-10">
              {hasSale ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F15A24] text-white shadow-xs">
                  -{discountPct}%
                </span>
              ) : (product.isFeatured || (product as any).isHot) && allowHot ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs">
                  Hot
                </span>
              ) : (product.isNewArrival || (product as any).isNew) ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                  New
                </span>
              ) : null}
            </div>

            {/* Bottom-Right Compare toggle on hover */}
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
          <div className="text-[11px] font-mono text-[#5B6472] uppercase tracking-wider mb-1 truncate min-w-0">
            {product.modelNumber}
          </div>

          {/* CLEAN TITLE WITHOUT REPEATED BRAND OR MODEL */}
          <h3
            className="font-bold text-sm sm:text-base text-[#111827] group-hover:text-[#F15A24] transition-colors font-heading line-clamp-2 leading-snug mb-3 min-w-0 [overflow-wrap:anywhere] break-words"
            title={product.name}
          >
            {cleanTitle}
          </h3>

          {/* HIGHLIGHTS AS MINI-CARDS: 2x2 grid (1-2 items: 1 row). Reserved height so cards in a row stay equal */}
          <div className="min-h-[58px] mb-3">
            {highlightCards.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {highlightCards.map((hl, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FFF4ED] border border-[#FBE3D6] rounded-[10px] px-2 py-1 flex items-center gap-1.5 overflow-hidden"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#F15A24] shrink-0" />
                    <div className="min-w-0 flex-1 leading-none">
                      <span className="block text-[11px] font-bold text-[#111827] truncate">
                        {hl.value}
                      </span>
                      <span className="block text-[9px] font-medium text-[#5B6472] uppercase truncate mt-0.5">
                        {hl.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('quote', product.id);
                  }}
                  className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Request quotation</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
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

      {/* Accessible Quick View Dialog */}
      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        onNavigate={onNavigate}
      />
    </>
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
