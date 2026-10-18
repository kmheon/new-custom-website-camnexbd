import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShieldCheck, Download, Check, Wrench, Truck, ArrowRight, Layers, FileText, Phone } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge, Card, Alert } from '../components/common/UI';
import { productService, categoryService, specTemplateService, packageService } from '../services';
import { Product, SpecTemplate, SecurityPackage, ProductVariantOption } from '../types';
import { useCartStore, useCompareStore } from '../store';
import { getVariantGroupForProduct } from '../utils/productVariants';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (route: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onNavigate }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [specTemplate, setSpecTemplate] = useState<SpecTemplate | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'features' | 'downloads'>('specs');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [compatibleAccessories, setCompatibleAccessories] = useState<Product[]>([]);
  const [packagesContaining, setPackagesContaining] = useState<SecurityPackage[]>([]);
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [variants, setVariants] = useState<ProductVariantOption[]>([]);

  const addItemToCart = useCartStore((s) => s.addItem);
  const { addProduct: addToCompare, removeProduct: removeFromCompare, hasProduct: isInCompare } = useCompareStore();

  useEffect(() => {
    productService.getProductById(productId).then(async (prod) => {
      setProduct(prod);
      if (prod) {
        // Load variants if this product belongs to a genuine catalog model family
        const varGroup = getVariantGroupForProduct(prod.id);
        if (varGroup && varGroup.variants.length > 1) {
          productService.getProductVariants(prod.id).then((apiVars) => {
            if (apiVars && apiVars.length > 1) {
              setVariants(apiVars);
            } else {
              setVariants(varGroup.variants.map(v => ({
                productId: v.productId,
                modelNumber: v.modelNumber,
                name: v.modelNumber,
                distinguishingSpec: v.distinguishingSpec,
                price: null
              })));
            }
          });
        } else {
          setVariants([]);
        }

        const cat = await categoryService.getCategories().then(cats =>
          cats.find(c => c.id === prod.categoryId || c.slug === prod.categoryId || c.name.toLowerCase() === prod.category.toLowerCase())
        );
        const resolvedSlug = cat?.slug || prod.categoryId;
        setCategorySlug(resolvedSlug);
        specTemplateService.getTemplateByCategorySlug(resolvedSlug).then(setSpecTemplate);
        productService.getRelatedProducts(prod.id).then(setRelatedProducts);
        productService.getCompatibleAccessories(prod.id).then(setCompatibleAccessories);
        packageService.getPackages().then(setPackagesContaining);
      }
    });
  }, [productId]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-[#111827]">Product not found or loading...</h2>
        <Button size="sm" onClick={() => onNavigate('catalog')} className="mt-4">
          Return to Catalog
        </Button>
      </div>
    );
  }

  const handleSelectModel = async (targetId: string) => {
    if (!targetId || targetId === product.id) return;
    try {
      const selectedProd = await productService.getProductById(targetId);
      if (selectedProd) {
        setProduct(selectedProd);
        setActiveImageIndex(0);

        // Update browser URL silently without full navigation flash
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(null, '', `/product/${selectedProd.id}`);
        }

        // If category template differs, update it
        if (selectedProd.categoryId && selectedProd.categoryId !== product.categoryId) {
          const cat = await categoryService.getCategories().then(cats =>
            cats.find(c => c.id === selectedProd.categoryId || c.slug === selectedProd.categoryId || c.name.toLowerCase() === selectedProd.category.toLowerCase())
          );
          const resolvedSlug = cat?.slug || selectedProd.categoryId;
          setCategorySlug(resolvedSlug);
          specTemplateService.getTemplateByCategorySlug(resolvedSlug).then(setSpecTemplate);
        }

        // Update related and accessories for the selected model
        productService.getRelatedProducts(selectedProd.id).then(setRelatedProducts);
        productService.getCompatibleAccessories(selectedProd.id).then(setCompatibleAccessories);
      }
    } catch (err) {
      console.error('Failed to select model variant:', err);
    }
  };

  const handleAddToCart = () => {
    addItemToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addItemToCart(product, quantity);
    onNavigate('checkout');
  };

  const unitPrice = product.pricing.salePrice || product.pricing.regularPrice;
  const installationFee = includeInstallation ? 500 * quantity : 0;
  const totalPrice = unitPrice ? (unitPrice * quantity) + installationFee : null;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 pb-24 lg:pb-12">
      <SEO
        title={`${product.name} (${product.modelNumber}) | CamneX Bangladesh`}
        description={product.shortDescription}
        canonicalPath={`/product/${product.id}`}
        ogType="product"
        ogImage={product.primaryImage}
        jsonLd={unitPrice ? {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "image": product.images,
          "description": product.shortDescription,
          "sku": product.sku,
          "mpn": product.modelNumber,
          "brand": {
            "@type": "Brand",
            "name": product.brand
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "BDT",
            "price": unitPrice,
            "availability": product.inventory.status === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
              "@type": "Organization",
              "name": "CamneX Bangladesh"
            }
          }
        } : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Catalog', onClick: () => onNavigate('catalog') },
            { label: product.category, onClick: () => onNavigate('category', categorySlug || product.categoryId) },
            { label: product.name }
          ]}
        />

        {/* Top Product Hero (Gallery + Purchasing Box) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
          
          {/* Gallery (7-col) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="h-96 sm:h-[450px] rounded-xl overflow-hidden bg-slate-50 relative flex items-center justify-center">
              <img
                src={(product.images && product.images[activeImageIndex]) || product.primaryImage || '/images/products/hikvision-dome.svg'}
                alt={`${product.name} - View ${activeImageIndex + 1}`}
                className="max-h-full max-w-full object-contain p-4"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="dark">{product.brand}</Badge>
                {product.isDemo && (
                  <span className="text-[10px] bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded font-mono">
                    Sample Item
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {Boolean(product.images && product.images.length > 1) && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-[#F15A24] ring-2 ring-orange-500/20' : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Purchase Panel (5-col) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                <span>SKU: {product.sku}</span>
                <span>Model: {product.modelNumber}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#111827] font-heading leading-tight mb-3">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {product.shortDescription}
              </p>

              {/* Price Banner */}
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 mb-5">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Selling Price in Bangladesh</span>
                {unitPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#F15A24] font-heading">
                      ৳{unitPrice.toLocaleString()}
                    </span>
                    {product.pricing.regularPrice && product.pricing.salePrice && (
                      <span className="text-sm text-slate-400 line-through">
                        ৳{product.pricing.regularPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500">/ {product.unit}</span>
                  </div>
                ) : (
                  <div className="text-lg font-bold text-slate-700">
                    Request quotation
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  Availability: <strong className="text-emerald-600 font-bold">Genuine Bangladesh Stock</strong>
                </div>
              </div>

              {/* Compact Model / Variant Selector (Displayed only when genuine catalog variants exist) */}
              {variants.length > 1 && (
                <div data-testid="product-model-selector" className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 uppercase tracking-wider block">
                      Available Models
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Active: <strong className="text-slate-800">{product.modelNumber}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {variants.map((v) => {
                      const isSelected = v.productId === product.id;
                      const displayPrice = v.price != null && v.price > 0
                        ? `৳${v.price.toLocaleString()}`
                        : (v.price === 0 || v.price === null ? 'Quote' : '');
                      return (
                        <button
                          key={v.productId}
                          type="button"
                          data-testid={`model-selector-option-${v.modelNumber}`}
                          onClick={() => handleSelectModel(v.productId)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[58px] ${
                            isSelected
                              ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] shadow-xs ring-1 ring-[#F15A24]/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={`text-xs font-bold font-mono truncate ${isSelected ? 'text-[#F15A24]' : 'text-[#111827]'}`}>
                              {v.modelNumber}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24] shrink-0" />
                            )}
                          </div>
                          {v.distinguishingSpec && (
                            <span className="text-[11px] text-slate-500 font-medium truncate block mt-0.5">
                              {v.distinguishingSpec}
                            </span>
                          )}
                          {displayPrice && (
                            <div className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-[#F15A24]' : 'text-slate-800'}`}>
                              {displayPrice}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Installation Add-on */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="install-opt"
                  checked={includeInstallation}
                  onChange={(e) => setIncludeInstallation(e.target.checked)}
                  className="w-4 h-4 text-[#F15A24] rounded mt-0.5 focus:ring-[#F15A24]"
                />
                <label htmlFor="install-opt" className="text-xs cursor-pointer">
                  <strong className="text-[#111827] block">Add Professional On-Site Installation (+৳500 / unit)</strong>
                  <span className="text-slate-500">Casing installation, angle tuning, and DVR/NVR configuration in Dhaka.</span>
                </label>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-slate-700 uppercase">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-bold text-xs text-[#111827] min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="md"
                  data-testid="buy-now-button"
                  onClick={handleBuyNow}
                  className="w-full"
                >
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  data-testid="add-to-cart-button"
                  onClick={handleAddToCart}
                  className="w-full"
                >
                  <ShoppingBag className="w-4 h-4 mr-1.5" />
                  <span>Add to Cart</span>
                </Button>
              </div>

              {!unitPrice && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNavigate('quote', product.id)}
                  className="w-full text-xs font-semibold text-slate-600 border border-dashed border-slate-300 hover:bg-slate-50"
                >
                  Request Official Written Quotation
                </Button>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="detail-compare-button"
                    onClick={() => {
                      addToCompare(product.id);
                    }}
                    className={`font-bold transition-colors ${
                      isInCompare(product.id)
                        ? 'text-emerald-600 font-bold'
                        : 'text-[#F15A24] hover:underline cursor-pointer'
                    }`}
                  >
                    {isInCompare(product.id) ? '✓ Added to Compare' : '+ Add to Spec Comparison'}
                  </button>
                  {isInCompare(product.id) && (
                    <button
                      type="button"
                      data-testid="detail-remove-compare-button"
                      onClick={() => removeFromCompare(product.id)}
                      className="text-[11px] text-slate-400 hover:text-red-500 underline ml-1 cursor-pointer"
                      title="Remove from comparison"
                    >
                      (Remove)
                    </button>
                  )}
                </div>
                <span>Official Serial Verified</span>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Specifications & Content Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 my-8">
          
          <div className="flex items-center space-x-6 border-b border-slate-200 pb-4 mb-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'specs' ? 'border-[#F15A24] text-[#F15A24]' : 'border-transparent text-slate-500 hover:text-black'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-2 border-b-2 transition-colors ${
                activeTab === 'features' ? 'border-[#F15A24] text-[#F15A24]' : 'border-transparent text-slate-500 hover:text-black'
              }`}
            >
              Key Features & Story
            </button>
            {product.documents && product.documents.length > 0 && (
              <button
                onClick={() => setActiveTab('downloads')}
                className={`pb-2 border-b-2 transition-colors ${
                  activeTab === 'downloads' ? 'border-[#F15A24] text-[#F15A24]' : 'border-transparent text-slate-500 hover:text-black'
                }`}
              >
                Downloads & Datasheets
              </button>
            )}
          </div>

          {/* TAB 1: DYNAMIC SPECIFICATIONS (Rendered from Category Template) */}
          {activeTab === 'specs' && (
            <div>
              <h3 className="text-base font-bold text-[#111827] font-heading mb-4">
                Structured Technical Specifications ({product.category})
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm">
                {Object.entries(product.specifications).map(([key, val]) => {
                  const fieldDef = specTemplate?.fields.find(f => f.key === key);
                  const label = fieldDef?.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div key={key} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 bg-white even:bg-slate-50/50">
                      <div className="font-bold text-slate-700">{label}</div>
                      <div className="sm:col-span-2 text-slate-900 font-medium">{String(val)}</div>
                    </div>
                  );
                })}
              </div>

              {product.warrantyText && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span><strong>Warranty Assurance:</strong> {product.warrantyText}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FEATURES */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="prose max-w-none text-sm text-slate-700 leading-relaxed">
                <p>{product.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#111827] font-heading uppercase tracking-wider mb-3">
                  Hardware Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.keyFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 p-2.5 bg-slate-50 rounded-lg">
                      <Check className="w-4 h-4 text-[#F15A24] mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Official manufacturer documents and technical sheets:</p>
              <div className="space-y-2">
                {product.documents?.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-[#111827] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#F15A24]" />
                      <span>{doc.title}</span>
                      {doc.size && <span className="text-slate-400 font-normal">({doc.size})</span>}
                    </div>
                    <Download className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Packages Containing This Product */}
        {packagesContaining.length > 0 && (
          <div className="my-10 bg-[#0F172A] text-white p-6 sm:p-8 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="orange" className="mb-1">Available in Ready-Made Packages</Badge>
                <h3 className="text-lg font-bold font-heading">Need this camera as part of a complete system?</h3>
              </div>
              <Button size="sm" onClick={() => onNavigate('packages')}>
                View Packages
              </Button>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              This model is included in our Night Vision CCTV packages paired with matching DVRs, surveillance storage, cables, and connectors.
            </p>
          </div>
        )}

      </div>

      {/* Sticky Buy Bar on Mobile (< 768px) */}
      <div
        id="product-sticky-bar"
        data-testid="product-sticky-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-500 font-mono truncate">{product.modelNumber}</div>
            <div className="text-base font-black text-[#F15A24] font-heading">
              {unitPrice ? `৳${unitPrice.toLocaleString()}` : 'Quote'}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" data-testid="mobile-sticky-cart-btn" onClick={handleAddToCart}>
              Cart
            </Button>
            <Button size="sm" data-testid="mobile-sticky-buy-btn" onClick={handleBuyNow}>
              Buy Now
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};
