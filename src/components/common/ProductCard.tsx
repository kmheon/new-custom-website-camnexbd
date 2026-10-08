import React, { useState } from 'react';
import { ShoppingBag, Check, ShieldCheck, Camera, Layers } from 'lucide-react';
import { Product } from '../../types';
import { useCartStore, useCompareStore } from '../../store';

interface ProductCardProps {
  product: Product;
  onNavigate: (route: string, param?: string) => void;
  className?: string;
  showSampleBadge?: boolean;
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

  const price = product.pricing?.regularPrice;
  const salePrice = product.pricing?.salePrice;
  const hasPrice = typeof price === 'number' && price > 0;
  const hasSale = typeof salePrice === 'number' && salePrice > 0 && hasPrice && salePrice < price;

  return (
    <div
      className={`bg-white rounded-[20px] border border-[#EDE8E1] p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${className}`}
    >
      <div>
        {/* IMAGE PREVIEW CONTAINER */}
        <div
          onClick={() => onNavigate('product', product.id)}
          className="h-48 rounded-[16px] overflow-hidden bg-[#FAF7F2] cursor-pointer mb-4 relative flex items-center justify-center p-3"
        >
          {/* Real Image or Fallback Branded Tile */}
          {!imageError && product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt=""
              onError={() => setImageError(true)}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-[#F4EEE6] rounded-[12px] p-4 text-center">
              <Camera className="w-8 h-8 text-[#5B6472]/40 mb-1" />
              <span className="text-[10px] font-bold text-[#5B6472]/70 uppercase tracking-wider font-mono">
                {product.modelNumber || 'Hardware'}
              </span>
            </div>
          )}

          {/* Top Brand Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#141210] text-white">
              {product.brand}
            </span>
          </div>

          {/* Special Offer Sale Badge */}
          {hasSale && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F15A24] text-white">
                Sale
              </span>
            </div>
          )}

          {/* Sample Demo Item Chip */}
          {showSampleBadge && product.isDemo && (
            <div className="absolute bottom-2 left-2">
              <span className="text-[9px] bg-slate-900/80 backdrop-blur-xs text-slate-300 px-2 py-0.5 rounded-full font-mono">
                Sample item
              </span>
            </div>
          )}
        </div>

        {/* MODEL NUMBER & TITLE */}
        <div className="text-[11px] font-mono text-slate-400 mb-1 truncate">
          {product.modelNumber}
        </div>
        
        <h3
          onClick={() => onNavigate('product', product.id)}
          className="font-bold text-[15px] sm:text-base text-[#111827] group-hover:text-[#F15A24] cursor-pointer transition-colors font-heading mb-1.5 line-clamp-2 leading-snug"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Short description */}
        <p className="text-xs text-[#5B6472] line-clamp-2 mb-4 leading-relaxed">
          {product.shortDescription || product.description}
        </p>
      </div>

      {/* PRICING & ACTIONS ROW */}
      <div className="pt-4 border-t border-[#EDE8E1]/80">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            {hasSale ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-[#F15A24] font-heading">
                  ৳{salePrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  ৳{price.toLocaleString()}
                </span>
              </div>
            ) : hasPrice ? (
              <div className="text-lg font-black text-[#F15A24] font-heading">
                ৳{price.toLocaleString()}
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-500">
                Request quotation
              </div>
            )}
          </div>

          <span className="text-[10px] font-semibold text-emerald-600 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Official Warranty</span>
          </span>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavigate('product', product.id)}
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
                <span>Buy</span>
              </>
            )}
          </button>
        </div>

        {/* Compare specs toggle */}
        <div className="pt-2.5 text-center">
          <button
            type="button"
            onClick={handleToggleCompare}
            className="text-[11px] font-semibold text-slate-400 hover:text-[#F15A24] transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            {inCompare ? (
              <>
                <Check className="w-3 h-3 text-[#F15A24]" />
                <span className="text-[#F15A24]">In Compare</span>
              </>
            ) : (
              <span>+ Compare specs</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader with identical exact dimensions
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[20px] border border-[#EDE8E1] p-5 animate-pulse flex flex-col justify-between h-[410px]">
      <div>
        <div className="h-48 rounded-[16px] bg-[#FAF7F2] mb-4" />
        <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
        <div className="h-5 w-4/5 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-full bg-slate-100 rounded mb-1" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="pt-4 border-t border-[#EDE8E1]">
        <div className="h-6 w-24 bg-slate-200 rounded mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-slate-200 rounded-full" />
          <div className="h-9 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};
