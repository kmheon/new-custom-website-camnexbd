import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
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

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (productIds.length > 0) {
      Promise.all(productIds.map(id => productService.getProductById(id))).then(list => {
        const valid = list.filter((p): p is Product => p !== null);
        setProducts(valid);
        if (valid.length > 0) {
          specTemplateService.getTemplateByCategorySlug(valid[0].categoryId).then(setSpecTemplate);
        }
      });
    } else {
      setProducts([]);
      setSpecTemplate(null);
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

        <div className="my-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
              Technical Specification Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Comparing up to 4 devices side-by-side using shared category fields.
            </p>
          </div>

          {products.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Clear Comparison
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 my-8">
            <h2 className="text-lg font-bold text-[#111827]">No products selected for comparison</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "+ Add to Spec Comparison" on any product card in the catalog to compare features.
            </p>
            <Button size="md" onClick={() => onNavigate('catalog')}>
              Browse Catalog
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
              
              {/* Product Header Row */}
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 w-48 font-bold text-slate-500 uppercase text-xs">Device</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-4 w-64 align-top">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="dark">{p.brand}</Badge>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="h-32 mb-2 flex items-center justify-center bg-slate-100 rounded-lg p-2">
                        <img src={p.primaryImage} alt="" className="max-h-full max-w-full object-contain" />
                      </div>

                      <div className="font-mono text-[11px] text-slate-400">{p.modelNumber}</div>
                      <h4
                        onClick={() => onNavigate('product', p.id)}
                        className="font-bold text-sm text-[#111827] hover:text-[#F15A24] cursor-pointer font-heading line-clamp-1 mb-2"
                      >
                        {p.name}
                      </h4>

                      <div className="text-base font-black text-[#F15A24] font-heading mb-3">
                        {p.pricing.regularPrice ? `৳${p.pricing.regularPrice.toLocaleString()}` : 'Quote'}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <button
                          onClick={() => onNavigate('product', p.id)}
                          className="py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center"
                        >
                          Details
                        </button>
                        <Button size="sm" className="w-full" onClick={() => addItemToCart(p, 1)}>
                          <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                          <span>Add</span>
                        </Button>
                      </div>
                    </th>
                  ))}
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
                        const val = p.specifications[field.key];
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
                        const val = p.specifications[specKey];
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
                      {p.warrantyText || `${p.warrantyMonths || 12} Months Warranty`}
                    </td>
                  ))}
                </tr>
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  );
};
