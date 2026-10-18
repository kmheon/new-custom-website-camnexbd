import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, Layers, AlertCircle, Trash2, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { useCompareStore, useCartStore } from '../store';
import { productService, specTemplateService } from '../services';
import { Product, SpecTemplate } from '../types';

// Fields that already appear in comparison header cards or should not be duplicated in the matrix
export const IGNORED_SPEC_KEYS = new Set([
  'id',
  'name',
  'title',
  'brand',
  'model',
  'modelnumber',
  'model_number',
  'sku',
  'price',
  'regularprice',
  'regular_price',
  'saleprice',
  'sale_price',
  'images',
  'primaryimage',
  'primary_image',
  'description',
  'shortdescription',
  'short_description',
  'category',
  'categoryid',
  'category_id',
  'stock',
  'inventory',
  'createdat',
  'created_at',
  'updatedat',
  'updated_at'
]);

/**
 * Normalizes specification values for precise catalog comparisons.
 * Normalizes units (e.g. "3 MP" vs "3MP"), boolean values ("Yes" vs true),
 * whitespace, delimiters, degrees, and handles missing/empty values consistently.
 */
export function normalizeSpecValue(val: any, unit?: string): string {
  if (val === null || val === undefined) return '__EMPTY__';
  if (typeof val === 'boolean') return val ? 'true' : 'false';

  let str = String(val).trim();
  if (!str || str === '—' || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'none') {
    return '__EMPTY__';
  }

  // Boolean-like text normalization
  const lower = str.toLowerCase();
  if (lower === 'yes' || lower === 'true' || lower === 'supported' || lower === 'enabled') return 'true';
  if (lower === 'no' || lower === 'false' || lower === 'not supported' || lower === 'disabled') return 'false';

  // If unit is provided and not already included in val
  if (unit && !str.toLowerCase().includes(unit.toLowerCase().trim())) {
    str = `${str} ${unit}`;
  }

  str = str.toLowerCase();

  // Normalize Wi-Fi variations
  str = str.replace(/wi[- ]?fi/g, 'wifi');

  // Normalize degrees (355° vs 355 deg vs 355 degree vs 355 degrees)
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:°|deg(?:ree(?:s)?)?)\b/g, '$1°');

  // Normalize common separators: / , & +
  str = str.replace(/\s*([\/,&+])\s*/g, '/');
  str = str.replace(/\s*([:x×\-])\s*/g, '$1');

  // Normalize trailing .0 in numbers: 3.0 -> 3
  str = str.replace(/(\d+)\.0+(\b|\D)/g, '$1$2');

  // Normalize units (case-insensitive, strip space between number and unit)
  str = str.replace(/(\d+(?:\.\d+)?)\s*(mp|megapixel|megapixels)\b/g, '$1mp');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(gb|tb|mb|kb)\b/g, '$1$2');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(ghz|mhz|fps)\b/g, '$1$2');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(mm)\b/g, '$1mm');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(m|meter|meters)\b/g, '$1m');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(v|volt|volts)\b/g, '$1v');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(w|watt|watts)\b/g, '$1w');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(port|ports)\b/g, '$1ports');
  str = str.replace(/(\d+(?:\.\d+)?)\s*(ch|channel|channels)\b/g, '$1ch');

  // Normalize warranty representations
  str = str.replace(/1\s*(?:yr|year|years)\b/g, '12 months');
  str = str.replace(/2\s*(?:yrs|years)\b/g, '24 months');
  str = str.replace(/3\s*(?:yrs|years)\b/g, '36 months');
  str = str.replace(/\b(?:official|brand|manufacturer)\s+warranty\b/g, 'warranty');

  // Collapse multiple whitespace
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

interface ComparePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({ onNavigate }) => {
  const { productIds, removeProduct, clearCompare } = useCompareStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [specTemplate, setSpecTemplate] = useState<SpecTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState<boolean>(false);

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

  // Generate comparison rows
  // 1. Template fields first (if category template available)
  const templateRows = (specTemplate?.fields || [])
    .filter((f) => !IGNORED_SPEC_KEYS.has(f.key.toLowerCase().replace(/[-_]/g, '')))
    .map((f) => ({
      key: f.key,
      name: f.name || f.label || f.key.replace(/_/g, ' '),
      unit: f.unit
    }));

  const templateKeys = new Set(templateRows.map((r) => r.key.toLowerCase()));

  // 2. Additional product spec keys not in template
  const extraKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specifications || {})))
  ).filter((k) => {
    const normKey = k.toLowerCase().replace(/[-_]/g, '');
    return !IGNORED_SPEC_KEYS.has(normKey) && !templateKeys.has(k.toLowerCase());
  });

  const extraRows = extraKeys.map((k) => ({
    key: k,
    name: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    unit: undefined
  }));

  const allRowDefs = [...templateRows, ...extraRows];

  // 3. Calculate values, display strings, normalized values, and difference flag
  const calculatedSpecRows = allRowDefs.map((def) => {
    const values = products.map((p) => {
      const val = p.specifications ? p.specifications[def.key] : undefined;
      const normalized = normalizeSpecValue(val, def.unit);
      const display = val === true
        ? 'Yes'
        : val === false
        ? 'No'
        : val !== undefined && val !== null && String(val).trim() !== ''
        ? (def.unit && !String(val).toLowerCase().includes(def.unit.toLowerCase()) ? `${val} ${def.unit}` : String(val))
        : '—';
      return { raw: val, display, normalized };
    });

    const isDifferent = products.length >= 2 && !values.every((v) => v.normalized === values[0]?.normalized);

    return {
      key: def.key,
      name: def.name,
      unit: def.unit,
      values,
      isDifferent
    };
  });

  // Warranty difference calculation
  const warrantyValues = products.map((p) => {
    const text = p.warrantyText || `${p.warrantyMonths || 12} Months Official Warranty`;
    return {
      display: text,
      normalized: normalizeSpecValue(text)
    };
  });
  const isWarrantyDifferent = products.length >= 2 && !warrantyValues.every((w) => w.normalized === warrantyValues[0]?.normalized);

  const visibleSpecRows = showOnlyDifferences
    ? calculatedSpecRows.filter((r) => r.isDifferent)
    : calculatedSpecRows;

  const showWarrantyRow = showOnlyDifferences ? isWarrantyDifferent : true;
  const totalDifferencesCount = calculatedSpecRows.filter((r) => r.isDifferent).length + (isWarrantyDifferent ? 1 : 0);
  const hasNoDifferencesToDisplay = showOnlyDifferences && visibleSpecRows.length === 0 && !showWarrantyRow;

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

            {/* Comparison Controls Bar (Show Only Differences Toggle) */}
            <div className="mb-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="show-differences-toggle"
                  className="inline-flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#F15A24] transition-colors"
                >
                  <input
                    type="checkbox"
                    id="show-differences-toggle"
                    data-testid="show-differences-toggle"
                    checked={showOnlyDifferences}
                    onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                    className="w-4 h-4 text-[#F15A24] bg-white border-slate-300 rounded focus:ring-[#F15A24] focus:ring-2 cursor-pointer accent-[#F15A24]"
                  />
                  <span>Show only differences</span>
                </label>

                {showOnlyDifferences && (
                  <Badge variant="outline" className="text-[11px] font-mono text-orange-600 border-orange-200 bg-orange-50 font-bold">
                    {totalDifferencesCount} {totalDifferencesCount === 1 ? 'difference' : 'differences'}
                  </Badge>
                )}
              </div>

              <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {showOnlyDifferences
                  ? `Displaying ${visibleSpecRows.length + (showWarrantyRow ? 1 : 0)} differing specifications`
                  : `Showing all ${calculatedSpecRows.length + 1} specifications`}
              </div>
            </div>

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
                  {hasNoDifferencesToDisplay ? (
                    <tr>
                      <td colSpan={products.length + 1} className="py-12 px-6 text-center bg-slate-50/60">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#F15A24]">
                            <SlidersHorizontal className="w-6 h-6" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800" data-testid="no-differences-message">
                            These products have no differing specifications to display.
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            All compared technical specifications and warranty terms for the selected products are identical.
                          </p>
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid="show-all-specs-button"
                              onClick={() => setShowOnlyDifferences(false)}
                              className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-xs"
                            >
                              Show all specifications
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {visibleSpecRows.length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={products.length + 1} className="p-3 font-bold text-xs text-slate-700 uppercase tracking-wider">
                            Core Specifications {products[0]?.category ? `(${products[0]?.category})` : ''}
                          </td>
                        </tr>
                      )}

                      {visibleSpecRows.map((row) => (
                        <tr key={row.key} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <span>{row.name}</span>
                              {row.isDifferent && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24] inline-block" title="Differs across products" />
                              )}
                            </div>
                          </td>
                          {row.values.map((v, idx) => (
                            <td key={products[idx].id} className="p-4 text-slate-900 font-medium">
                              {v.display}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {showWarrantyRow && (
                        <>
                          <tr className="bg-slate-50/80">
                            <td colSpan={products.length + 1} className="p-3 font-bold text-xs text-slate-700 uppercase tracking-wider">
                              Warranty & Service
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <span>Warranty</span>
                                {isWarrantyDifferent && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24] inline-block" title="Differs across products" />
                                )}
                              </div>
                            </td>
                            {warrantyValues.map((w, idx) => (
                              <td key={products[idx].id} className="p-4 text-emerald-700 font-semibold text-xs">
                                {w.display}
                              </td>
                            ))}
                          </tr>
                        </>
                      )}
                    </>
                  )}

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
