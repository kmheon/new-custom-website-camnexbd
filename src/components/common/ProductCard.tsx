import React, { useState } from 'react';
import { ShoppingBag, Check, ShieldCheck, Camera, Layers, CheckCircle2, Heart, Eye, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useCartStore, useCompareStore, useWishlistStore, useCustomerAuthStore } from '../../store';
import { QuickViewModal } from './QuickViewModal';

import { FormattedSpecResult, formatSpecValue } from '../../utils/specUtils';
import { ImagePlaceholder } from './ImagePlaceholder';
import { Term } from './Term';
import { UI_STRINGS } from '../../content/strings';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, param?: string) => void;
  className?: string;
  showSampleBadge?: boolean;
  allowHot?: boolean; // When false (more than 2 Hot cards in this row), Hot badge is suppressed
}

import {
  CardContainer,
  CardMediaSlot,
  CardMetaSlot,
  CardTitleSlot,
  CardDetailsSlot,
  CardPriceSlot,
  CardActionsSlot
} from '../cards/CardSlots';

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

  if (highlightCards.length === 0 && Array.isArray(product.keyFeatures)) {
    product.keyFeatures.slice(0, 2).forEach((kf) => {
      if (typeof kf === 'string' && kf.trim() && highlightCards.length < 4) {
        const res = formatSpecValue({ label: 'Feature' }, kf.trim());
        if (res) highlightCards.push(res);
      }
    });
  }

  const hasWarranty = typeof product.warranty === 'string' && product.warranty.trim().length > 0;

  return (
    <>
      <CardContainer
        data-card-id={product.id}
        data-product-id={product.id}
        onClick={() => onNavigate('product', product.id)}
        className={`group/card ${className}`}
      >
        <div aria-live="polite" className="sr-only">
          {toastText}
        </div>

        {/* 1. MEDIA SLOT (aspect 4/3) */}
        <CardMediaSlot>
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-[#F4EEE6] relative flex items-center justify-center p-3">
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

            {/* Top-Right: Wishlist Heart Button & Quick-View Eye Button */}
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-center gap-1.5">
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

            {/* Top-Left Corner Demo tag when sample content is ON */}
            {showSampleBadge && (product.isDemo || (product as any).sample) && (
              <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/90 text-slate-950 shadow-xs uppercase tracking-wider">
                  Demo
                </span>
              </div>
            )}

            {/* Bottom-Left Badge: EXACTLY ONE BADGE MAX, priority: Sale > Hot > New */}
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

            {/* Bottom-Right Compare toggle */}
            <button
              type="button"
              onClick={handleToggleCompare}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-full border shadow-md transition-all cursor-pointer ${
                inCompare
                  ? 'bg-[#F15A24] border-[#F15A24] text-white opacity-100'
                  : 'bg-white/90 hover:bg-white border-[#EDE8E1] text-[#111827] opacity-0 group-hover:opacity-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardMediaSlot>

        {/* 2. META SLOT (Model number line: 1 line, ellipsis, plus warranty; brand is in top-left chip) */}
        <CardMetaSlot>
          <span className="text-[11px] font-mono text-[#5B6472] uppercase tracking-wider truncate min-w-0 flex-1">
            {product.modelNumber || ''}
          </span>
          {hasWarranty ? (
            <span className="text-[10px] font-semibold text-emerald-600 inline-flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>{product.warranty}</span>
            </span>
          ) : (
            <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
          )}
        </CardMetaSlot>

        {/* 3. TITLE SLOT (Clamped to 2 lines with min-height for 2 lines) */}
        <CardTitleSlot>
          <h3
            className="font-bold text-sm sm:text-base text-[#111827] group-hover:text-[#F15A24] transition-colors font-heading line-clamp-2 leading-snug min-h-[2.6rem] min-w-0 [overflow-wrap:anywhere] break-words"
            title={product.name}
          >
            {cleanTitle}
          </h3>
        </CardTitleSlot>

        {/* 4. DETAILS SLOT (Highlight tile area reserved at height of 2 tile rows; visibility hidden when empty) */}
        <CardDetailsSlot>
          <div className="min-h-[70px]">
            {highlightCards.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {highlightCards.slice(0, 4).map((hl, idx) => {
                  const isSingleLabel = hl.isBoolean || hl.value.toLowerCase().replace(/[\s\-_]+/g, '') === hl.label.toLowerCase().replace(/[\s\-_]+/g, '');
                  return (
                    <div
                      key={idx}
                      className="bg-[#FFF4ED] border border-[#FBE3D6] rounded-[10px] px-2 py-1 flex items-center gap-1.5 overflow-hidden"
                    >
                      <Check className="w-3 h-3 text-[#F15A24] shrink-0" />
                      <div className="min-w-0 flex-1 leading-none">
                        {isSingleLabel ? (
                          <span className="block text-[11px] font-bold text-[#111827] truncate">
                            <Term text={hl.label}>{hl.label}</Term>
                          </span>
                        ) : (
                          <>
                            <span className="block text-[11px] font-bold text-[#111827] truncate">
                              <Term text={hl.value}>{hl.value}</Term>
                            </span>
                            <span className="block text-[9px] font-medium text-[#5B6472] uppercase truncate mt-0.5">
                              <Term text={hl.label}>{hl.label}</Term>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="invisible select-none min-h-[70px]" aria-hidden="true">&nbsp;</div>
            )}
          </div>
        </CardDetailsSlot>

        {/* 5. PRICE SLOT (Pinned towards bottom with margin-top: auto) */}
        <CardPriceSlot className="mt-auto">
          <div className="flex items-baseline justify-between min-h-[30px]">
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
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black text-[#111827] font-heading">
                    ৳{regularPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-transparent select-none" aria-hidden="true">
                    &nbsp;
                  </span>
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
                  <span>{UI_STRINGS.common.askForPrice}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </CardPriceSlot>

        {/* 7. ACTIONS SLOT */}
        <CardActionsSlot>
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
        </CardActionsSlot>
      </CardContainer>

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
