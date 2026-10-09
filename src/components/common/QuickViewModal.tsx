import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { Product } from '../../types';
import { useCartStore, useWishlistStore, useCustomerAuthStore } from '../../store';
import { productService } from '../../services';
import { cleanProductTitle } from './ProductCard';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, param?: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product: initialProduct,
  isOpen,
  onClose,
  onNavigate
}) => {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const addItemToCart = useCartStore((s) => s.addItem);
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isCustomerAuthenticated } = useCustomerAuthStore();

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setActiveImageIndex(0);
      setProduct(initialProduct);

      if (initialProduct?.id) {
        setLoading(true);
        productService
          .getProductById(initialProduct.id)
          .then((fullProd) => {
            if (fullProd) setProduct(fullProd);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialProduct]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const inWishlist = isInWishlist(product.id);
  const regularPrice = product.pricing?.regularPrice;
  const salePrice = product.pricing?.salePrice;
  const hasPrice = typeof regularPrice === 'number' && regularPrice > 0;
  const hasSale = typeof salePrice === 'number' && salePrice > 0 && hasPrice && salePrice < regularPrice;
  const cleanTitle = cleanProductTitle(product.name, product.brand, product.modelNumber);

  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.primaryImage ? [product.primaryImage] : []);

  // Format highlights
  const highlightList: { label: string; value: string }[] = [];
  if (product.specs) {
    Object.entries(product.specs).forEach(([_, sp]: [string, any]) => {
      if (sp && (sp.isHighlight || sp.showInHighlights) && sp.value && highlightList.length < 4) {
        let val = String(sp.highlightValue || sp.value).trim();
        if (val.length > 14) val = val.slice(0, 14);
        const lbl = String(sp.label || 'Feature').trim().split(' ').slice(0, 2).join(' ');
        highlightList.push({ label: lbl, value: val });
      }
    });
  }
  if (highlightList.length === 0 && product.specifications) {
    Object.entries(product.specifications).forEach(([k, v]: [string, any]) => {
      if (v !== undefined && v !== null && String(v).trim() && highlightList.length < 4) {
        let val = String(v).trim();
        if (val.length > 14) val = val.slice(0, 14);
        const lbl = k.replace(/_/g, ' ').split(' ').slice(0, 2).join(' ');
        highlightList.push({ label: lbl, value: val });
      }
    });
  }

  const handleAddToCart = async () => {
    await addItemToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleToggleWishlist = async () => {
    await toggleWishlist(product, isCustomerAuthenticated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl border border-[#EDE8E1] shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto relative flex flex-col p-5 sm:p-7"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#F4EEE6] border border-[#EDE8E1] flex items-center justify-center text-[#111827] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Left: Gallery */}
          <div className="space-y-3">
            <div className="h-64 sm:h-72 rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F4EEE6] border border-[#EDE8E1] flex items-center justify-center p-4 relative overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs font-mono">{product.modelNumber}</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#111827] shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#111827] shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl border p-1 bg-white flex-shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-[#F15A24] ring-2 ring-[#F15A24]/20' : 'border-[#EDE8E1]'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Actions */}
          <div className="flex flex-col justify-between h-full space-y-4">
            <div>
              {/* Brand Chip & Monospace Model */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#141210] text-white px-2 py-0.5 rounded-full">
                  {product.brand}
                </span>
                <span className="text-xs font-mono text-[#5B6472] uppercase">
                  {product.modelNumber}
                </span>
              </div>

              {/* Title */}
              <h2
                id="quickview-title"
                className="text-lg sm:text-xl font-bold font-heading text-[#111827] leading-snug mb-2"
              >
                {cleanTitle}
              </h2>

              {/* Price or Request Quotation */}
              <div className="mb-4">
                {hasSale ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#111827] font-heading">
                      ৳{salePrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-[#5B6472] line-through">
                      ৳{regularPrice.toLocaleString()}
                    </span>
                  </div>
                ) : hasPrice ? (
                  <div className="text-2xl font-black text-[#111827] font-heading">
                    ৳{regularPrice.toLocaleString()}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate('quote', product.id);
                    }}
                    className="text-sm font-bold text-[#F15A24] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Request quotation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Highlight Mini-Cards 2x2 */}
              {highlightList.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {highlightList.map((hl, i) => (
                    <div
                      key={i}
                      className="bg-[#FFF4ED] border border-[#FBE3D6] rounded-[10px] p-2 flex flex-col justify-center min-h-[46px]"
                    >
                      <span className="text-xs font-bold text-[#111827] truncate leading-tight">
                        {hl.value}
                      </span>
                      <span className="text-[10px] text-[#5B6472] uppercase font-medium truncate mt-0.5">
                        {hl.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-xs text-[#5B6472] leading-relaxed line-clamp-3 mb-4">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-3 border-t border-[#EDE8E1]">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-[#EDE8E1] rounded-full bg-[#FAF7F2] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full bg-white text-[#111827] font-bold text-xs flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#111827]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-full bg-white text-[#111827] font-bold text-xs flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add To Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 min-h-[44px] px-5 py-2.5 rounded-full font-bold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                    justAdded ? 'bg-emerald-600' : 'bg-[#F15A24] hover:bg-[#D94D1C]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to cart</span>
                    </>
                  )}
                </button>

                {/* Wishlist Heart */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`w-11 h-11 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] flex items-center justify-center transition-colors cursor-pointer ${
                    inWishlist ? 'bg-orange-50 border-orange-200 text-[#F15A24]' : 'bg-[#FAF7F2] text-[#111827]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-[#F15A24]' : ''}`} />
                </button>
              </div>

              {/* View Full Details Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('product', product.id);
                }}
                className="w-full text-center py-2 text-xs font-bold text-[#F15A24] hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View full details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

