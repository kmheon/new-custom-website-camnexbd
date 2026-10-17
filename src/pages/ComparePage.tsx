import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, Layers, AlertCircle, Trash2, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { useCompareStore, useCartStore } from '../store';
import { productService, specTemplateService } from '../services';
import { Product, SpecTemplate } from '../types';

interface ComparePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({ onNavigate }) => {
  const { productIds, removeProduct, clearCompare } = useCompareStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [specTemplate, setSpecTemplate] = useState<SpecTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    setIsLoading(true);
    if (productIds.length > 0) {
      Promise.all(productIds.map(id => productService.getProductById(id))).then(list => {
        const valid = list.filter((p): p is Product => p !== null && p !== undefined);
        setProducts(valid);
        if (valid.length > 0) {
          specTemplateService.getTemplateByCategorySlug(valid[0].categoryId).then(setSpecTemplate).catch(() => setSpecTemplate(null));
        } else {
          setSpecTemplate(null);
        }
        setIsLoading(false);
      }).catch(() => {
        setProducts([]);
        setIsLoading(false);
      });
    } else {
      setProducts([]);
      setSpecTemplate(null);
      setIsLoading(false);
    }
  }, [productIds]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title="Product Comparison Matrix | CamneX Bangladesh"
        description="Compare specifications, resolutions, and features side-by-side."
        canonicalPath="/compare"
        noIndex={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Catalog', onClick: () => onNavigate('catalog') },
            { label: 'Product Comparison' }
          ]}
        />

        {/* Page Heading & Action Bar */}
        <div className="my-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
              Technical Specification Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Comparing up to 4 devices side-by-side using genuine catalog specifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              data-testid="compare-continue-shopping"
              onClick={() => onNavigate('catalog')}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Button>

            {products.length > 0 && (
              <button
                type="button"
                data-testid="compare-clear-all"
                onClick={clearCompare}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 my-8">
            <div className="w-8 h-8 border-3 border-[#F15A24] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading comparison data...</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div data-testid="compare-empty-state" className="bg-white p-12 sm:p-16 rounded-2xl border border-slate-200 text-center space-y-4 my-8">
            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#F15A24]">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#111827]">Your comparison list is empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Select products from the catalog, category listings, or product pages to compare technical specifications, features, and pricing side-by-side.
            </p>
            <div className="pt-2">
              <Button
                size="md"
                data-testid="compare-empty-continue"
                onClick={() => onNavigate('catalog')}
              >
                Browse Catalog & Compare
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* If fewer than two products selected, show notice banner but do NOT redirect */}
            {products.length === 1 && (
              <div
                data-testid="compare-single-product-alert"
                className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <strong className="font-bold text-amber-800">Add Another Product:</strong> You have selected 1 product for comparison. Add at least one more product to compare technical specifications side-by-side.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="compare-add-more"
                  onClick={() => onNavigate('catalog')}
                  className="shrink-0 bg-white hover:bg-amber-100/50 border-amber-300 text-amber-900"
                >
                  Browse Catalog
                </Button>
              </div>
            )}

            {/* Comparison Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
                
                {/* Product Header Row */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="p-4 w-44 font-bold text-slate-500 uppercase text-xs align-top">
                      <div className="pt-2">
                        <span>Selected Devices</span>
                        <span className="block text-[11px] text-slate-400 font-normal mt-0.5 font-mono">
                          ({products.length} of 4 max)
                        </span>
                      </div>
                    </th>
                    {products.map((p) => {
                      const imageSrc = p.primaryImage || (p.images && p.images[0]) || '/images/products/hikvision-dome.svg';
                      const displayPrice = p.pricing?.regularPrice
                        ? `৳${p.pricing.regularPrice.toLocaleString()}`
                        : 'Quote';
                      return (
                        <th key={p.id} className="p-4 w-64 align-top">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="dark">{p.brand}</Badge>
                            <button
                              type="button"
                              data-testid={`compare-remove-${p.id}`}
                              onClick={() => removeProduct(p.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                              title="Remove from comparison"
                              aria-label={`Remove ${p.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="h-32 mb-2 flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-100">
                            <img src={imageSrc} alt={p.name} className="max-h-full max-w-full object-contain" />
                          </div>

                          <div className="font-mono text-[11px] text-slate-400">{p.modelNumber}</div>
                          <h4
                            onClick={() => onNavigate('product', p.id)}
                            className="font-bold text-sm text-[#111827] hover:text-[#F15A24] cursor-pointer font-heading line-clamp-2 min-h-[2.5rem] mb-2 leading-tight"
                          >
                            {p.name}
                          </h4>

                          <div className="text-base font-black text-[#F15A24] font-heading mb-3">
                            {displayPrice}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                            <button
                              type="button"
                              onClick={() => onNavigate('product', p.id)}
                              className="py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors"
                            >
                              Details
                            </button>
                            <Button
                              size="sm"
                              data-testid={`compare-add-cart-${p.id}`}
                              className="w-full"
                              onClick={() => addItemToCart(p, 1)}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                              <span>Add</span>
                            </Button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Specification Rows */}
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/80">
                    <td colSpan={products.length + 1} className="p-3 font-bold text-xs text-slate-700 uppercase tracking-wider">
                      Core Specifications {products[0]?.category ? `(${products[0]?.category})` : ''}
                    </td>
                  </tr>

                  {specTemplate ? (
                    specTemplate.fields.map((field) => (
                      <tr key={field.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-700">{field.name}</td>
                        {products.map((p) => {
                          const val = p.specifications ? p.specifications[field.key] : undefined;
                          const displayVal = val === true ? 'Yes' : val === false ? 'No' : val !== undefined && val !== null ? `${val}${field.unit ? ' ' + field.unit : ''}` : '—';
                          return (
                            <td key={p.id} className="p-4 text-slate-900 font-medium">
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    Array.from(new Set(products.flatMap(p => Object.keys(p.specifications || {})))).map((specKey) => (
                      <tr key={specKey} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-700 capitalize">{specKey.replace(/_/g, ' ')}</td>
                        {products.map((p) => {
                          const val = p.specifications ? p.specifications[specKey] : undefined;
                          const displayVal = val === true ? 'Yes' : val === false ? 'No' : val !== undefined && val !== null ? String(val) : '—';
                          return (
                            <td key={p.id} className="p-4 text-slate-900 font-medium">
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}

                  <tr className="bg-slate-50/80">
                    <td colSpan={products.length + 1} className="p-3 font-bold text-xs text-slate-700 uppercase tracking-wider">
                      Warranty & Service
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-slate-700">Warranty</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-4 text-emerald-700 font-semibold text-xs">
                        {p.warrantyText || `${p.warrantyMonths || 12} Months Official Warranty`}
                      </td>
                    ))}
                  </tr>

                  {/* Bottom Action Footer Row */}
                  <tr className="bg-slate-50/40 border-t border-slate-200">
                    <td className="p-4 font-bold text-xs text-slate-500 uppercase">
                      Actions
                    </td>
                    {products.map((p) => (
                      <td key={p.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeProduct(p.id)}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>

              </table>
            </div>

            {/* Bottom Continue Shopping bar */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('catalog')}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping in Catalog</span>
              </Button>

              <button
                type="button"
                onClick={clearCompare}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Clear All Products
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
