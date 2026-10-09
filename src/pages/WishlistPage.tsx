import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button } from '../components/common/UI';
import { ProductCard } from '../components/common/ProductCard';
import { useWishlistStore, useCustomerAuthStore, useCartStore } from '../store';
import { productService } from '../services';
import { Product } from '../types';

interface WishlistPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlistIds, removeFromWishlist, loadWishlist } = useWishlistStore();
  const { isCustomerAuthenticated } = useCustomerAuthStore();
  const addItemToCart = useCartStore((s) => s.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist(isCustomerAuthenticated);
  }, [isCustomerAuthenticated, loadWishlist]);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (wishlistIds.length === 0) {
          if (active) setProducts([]);
          return;
        }
        const prods = await Promise.all(
          wishlistIds.map(async (id) => {
            try {
              return await productService.getProductById(id);
            } catch (_) {
              return null;
            }
          })
        );
        if (active) {
          setProducts(prods.filter((p): p is Product => p !== null));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      active = false;
    };
  }, [wishlistIds]);

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId, isCustomerAuthenticated);
  };

  const handleAddToCart = async (product: Product) => {
    await addItemToCart(product, 1);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12">
      <SEO
        title="My Wishlist | CamneX Bangladesh"
        description="View and manage your saved security and surveillance equipment."
        noIndex={true}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Wishlist' }
          ]}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 mb-8 pb-4 border-b border-[#EDE8E1]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F15A24] mb-1">
              <Heart className="w-3.5 h-3.5 fill-[#F15A24]" />
              <span>Saved Items</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              My Wishlist ({wishlistIds.length})
            </h1>
          </div>
          {wishlistIds.length > 0 && (
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-[#5B6472]">Loading your saved products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE8E1] p-10 sm:p-16 text-center max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-2 font-heading">
              Your wishlist is empty
            </h2>
            <p className="text-xs text-[#5B6472] mb-6 leading-relaxed">
              Explore our security cameras, DVRs, networking switches and access control hardware to save items for later.
            </p>
            <Button
              size="md"
              onClick={() => onNavigate('catalog')}
              className="w-full sm:w-auto"
            >
              Browse products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

