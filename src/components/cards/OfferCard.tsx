import React from 'react';
import { ArrowRight, Tag, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';
import {
  CardContainer,
  CardMediaSlot,
  CardMetaSlot,
  CardTitleSlot,
  CardDescriptionSlot,
  CardDetailsSlot,
  CardPriceSlot,
  CardActionsSlot
} from './CardSlots';

export interface OfferCardProps {
  product: Product;
  onNavigate: (route: string, param?: string) => void;
  onAddToCart?: (product: Product) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  product,
  onNavigate,
  onAddToCart
}) => {
  const [justAdded, setJustAdded] = React.useState(false);

  const regularPrice = product.pricing?.regularPrice;
  const salePrice = product.pricing?.salePrice;
  const hasSale = typeof salePrice === 'number' && salePrice > 0 && typeof regularPrice === 'number' && salePrice < regularPrice;
  const discountPct = hasSale ? Math.round((1 - salePrice / regularPrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } else {
      onNavigate('product', product.id);
    }
  };

  return (
    <CardContainer
      data-card-id={product.id}
      onClick={() => onNavigate('product', product.id)}
      className="group/offer"
    >
      {/* 1. MEDIA */}
      <CardMediaSlot>
        <div className="h-44 sm:h-48 rounded-xl bg-gradient-to-b from-[#FAF7F2] to-[#F4EEE6] flex items-center justify-center p-3 relative">
          {product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="text-slate-300 flex items-center justify-center">
              <Tag className="w-12 h-12" />
            </div>
          )}

          {hasSale && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#F15A24] text-white shadow-xs">
                -{discountPct}% OFF
              </span>
            </div>
          )}
        </div>
      </CardMediaSlot>

      {/* 2. META */}
      <CardMetaSlot>
        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#0F172A] text-white px-2 py-0.5 rounded-full">
          {product.brand}
        </span>
        <span className="text-[10px] font-mono text-[#5B6472] uppercase truncate">
          {product.modelNumber}
        </span>
      </CardMetaSlot>

      {/* 3. TITLE */}
      <CardTitleSlot>
        <h3
          className="font-heading font-bold text-sm sm:text-base text-[#111827] group-hover:text-[#F15A24] transition-colors leading-snug line-clamp-2 min-h-[2.6rem]"
          title={product.name}
        >
          {product.name}
        </h3>
      </CardTitleSlot>

      {/* 4. DESCRIPTION */}
      <CardDescriptionSlot>
        <p className="text-xs text-[#5B6472] leading-relaxed line-clamp-2 min-h-[2.4rem] [overflow-wrap:anywhere] break-words">
          {product.shortDescription || product.description || ''}
        </p>
      </CardDescriptionSlot>

      {/* 5. DETAILS (Offer Highlights) */}
      <CardDetailsSlot>
        <div className="min-h-[48px] flex items-center bg-orange-50/60 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-950">
          <span className="font-semibold text-[11px] truncate">
            {hasSale ? `Special Offer: Save ৳${((regularPrice || 0) - (salePrice || 0)).toLocaleString()}` : 'Limited Time Promotion'}
          </span>
        </div>
      </CardDetailsSlot>

      {/* 6. PRICE */}
      <CardPriceSlot>
        <div className="min-h-[32px] flex items-baseline gap-2">
          {hasSale ? (
            <>
              <span className="text-lg sm:text-xl font-black text-[#111827] font-heading">
                ৳{salePrice.toLocaleString()}
              </span>
              <span className="text-xs text-[#5B6472] line-through">
                ৳{regularPrice.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="text-lg sm:text-xl font-black text-[#111827] font-heading">
              {regularPrice ? `৳${regularPrice.toLocaleString()}` : 'Price on request'}
            </span>
          )}
        </div>
      </CardPriceSlot>

      {/* 7. ACTIONS */}
      <CardActionsSlot>
        <button
          type="button"
          onClick={handleAdd}
          className={`w-full min-h-[44px] py-2.5 px-4 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
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
      </CardActionsSlot>
    </CardContainer>
  );
};
