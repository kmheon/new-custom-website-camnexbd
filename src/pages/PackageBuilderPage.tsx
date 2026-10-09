import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, ShoppingBag, ShieldCheck, HardDrive, Cpu, Cable, Zap, ArrowRight, HelpCircle } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { packageService } from '../services';
import { SecurityPackage, CameraFormFactor } from '../types';
import { useCartStore } from '../store';

interface PackageBuilderPageProps {
  onNavigate: (route: string, param?: string) => void;
  packageSlug?: string;
}

export const PackageBuilderPage: React.FC<PackageBuilderPageProps> = ({ onNavigate, packageSlug }) => {
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SecurityPackage | null>(null);
  const [cameraCount, setCameraCount] = useState<number>(4);
  const [formFactor, setFormFactor] = useState<CameraFormFactor>('bullet');
  const [computedBreakdown, setComputedBreakdown] = useState<{
    totalPrice: number | null;
    quotationRequired?: boolean;
    quotationReason?: string | null;
    components: Array<{
      role?: string;
      name: string;
      model: string;
      qty: number;
      unitPrice?: number | null;
      sku?: string;
      lineTotal?: number | null;
    }>;
  } | null>(null);

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    packageService.getPackages().then(list => {
      setPackages(list);
      if (list.length > 0) {
        const found = packageSlug ? list.find(p => p.slug === packageSlug) : list[0];
        setSelectedPackage(found || list[0]);
      }
    });
  }, [packageSlug]);

  useEffect(() => {
    if (selectedPackage) {
      packageService.calculatePackagePrice({
        packageId: selectedPackage.id,
        cameraCount,
        formFactor
      }).then(setComputedBreakdown);
    }
  }, [selectedPackage, cameraCount, formFactor]);

  const handleAddPackageToCart = () => {
    if (!selectedPackage || !computedBreakdown || computedBreakdown.totalPrice === null || computedBreakdown.quotationRequired) {
      onNavigate('quote');
      return;
    }

    // Construct mock product bundle for cart
    const bundleProduct: any = {
      id: `pkg-${selectedPackage.id}-${cameraCount}-${formFactor}`,
      name: `${cameraCount}-Camera ${selectedPackage.name} (${formFactor.toUpperCase()})`,
      brand: 'Hikvision',
      modelNumber: `BUNDLE-${cameraCount}CAM-${formFactor.toUpperCase()}`,
      sku: `PKG-${cameraCount}C-${formFactor.toUpperCase()}`,
      category: 'CCTV Packages',
      categoryId: 'packages',
      productType: 'package_bundle',
      status: 'active',
      images: ['/images/products/hikvision-bullet.svg'],
      primaryImage: '/images/products/hikvision-bullet.svg',
      shortDescription: `Turnkey ${cameraCount}-camera surveillance setup with DVR, ${cameraCount >= 16 ? '2TB' : cameraCount >= 8 ? '1TB' : '500GB'} HDD, and ${cameraCount * 10}m Cat6 cable.`,
      description: 'Turnkey bundle',
      keyFeatures: [],
      specifications: {},
      pricing: { regularPrice: computedBreakdown.totalPrice, currency: 'BDT' },
      inventory: { available: 10, status: 'in_stock' },
      unit: 'Complete Set'
    };

    addItemToCart(bundleProduct, 1, formFactor, {
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      cameraCount,
      storageSize: cameraCount >= 16 ? '2TB' : cameraCount >= 8 ? '1TB' : '500GB',
      formFactor
    });

    onNavigate('cart');
  };

  if (!selectedPackage) {
    return <div className="p-12 text-center text-slate-500">Loading package builder...</div>;
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10">
      <SEO
        title="Interactive CCTV Package Builder | CamneX Bangladesh"
        description="Configure your 2, 4, 8, or 16 camera security system. Transparent rules for hard drive capacity, cable length, and genuine Hikvision IRPF hardware."
        canonicalPath="/packages"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'CCTV Packages' },
            { label: selectedPackage.name }
          ]}
        />

        {/* Header */}
        <div className="my-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Badge variant="orange" className="mb-2">Turnkey Estimator</Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading mb-2">
              Interactive CCTV Package Builder
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Build your customized system. Hard drive storage and Cat6 cable lengths are calculated dynamically using engineering rules.
            </p>
          </div>

          <Button variant="outline" size="md" onClick={() => onNavigate('quote')}>
            Request Consultation Instead
          </Button>
        </div>

        {/* Builder Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Column (5-col) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Camera Count Step */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                1. Select Camera Channels
              </label>
              <div className="grid grid-cols-4 gap-2">
                {selectedPackage.cameraCountsSupported.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setCameraCount(count)}
                    className={`py-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      cameraCount === count
                        ? 'bg-[#F15A24] border-[#F15A24] text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm">{count} Cams</div>
                    <div className={`text-[10px] ${cameraCount === count ? 'text-white/80' : 'text-slate-400'}`}>
                      {count <= 4 ? 'Small' : count <= 8 ? 'Medium' : 'Enterprise'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Form Factor Step */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                2. Camera Form Factor
              </label>
              <div className="grid grid-cols-3 gap-2">
                {selectedPackage.supportedFormFactors.map((ff) => (
                  <button
                    key={ff}
                    type="button"
                    onClick={() => setFormFactor(ff)}
                    className={`py-3 text-xs font-bold rounded-xl border capitalize text-center transition-all ${
                      formFactor === ff
                        ? 'bg-[#111827] border-[#111827] text-white shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-heading text-sm">{ff}</div>
                    <div className="text-[10px] text-slate-400">
                      {ff === 'bullet' ? 'Wall mount' : ff === 'dome' ? 'Ceiling mount' : 'Angle flexible'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pure Infrared Disclaimer Notice */}
            {selectedPackage.isNightVisionIrOnly && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-orange-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pure Infrared Night Vision Standard</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  This package utilizes Hikvision IRPF series infrared sensors. It does not fabricate artificial full-color or two-way audio claims. Real night visibility up to 20 meters.
                </p>
              </div>
            )}

            {/* Engineering Rules Explanation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-[#111827] uppercase tracking-wider block">
                Automated Engineering Rules:
              </span>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                <span>Storage rule: 2-4 cams = 500GB, 8 cams = 1TB, 16 cams = 2TB surveillance HDD.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                <span>Cabling rule: 10 meters of Cat6 network cable per camera.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                <span>Centralized regulated 12V power supply with surge protection.</span>
              </div>
            </div>

          </div>

          {/* Bill of Materials & Live Price Summary (7-col) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-base text-[#111827] font-heading">
                  Itemized Bill of Materials ({cameraCount} Cameras · {formFactor.toUpperCase()})
                </h3>
                <Badge variant="dark">Turnkey BOM</Badge>
              </div>

              {/* Component Breakdown Table */}
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm">
                {computedBreakdown?.components.map((comp, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-bold text-[#111827]">{comp.name}</div>
                      <div className="text-xs text-slate-500 font-mono">Model: {comp.model}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#111827]">Qty: {comp.qty}</div>
                      {comp.unitPrice !== null && comp.unitPrice !== undefined ? (
                        <div className="text-xs text-slate-500">@ ৳{comp.unitPrice.toLocaleString()}</div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Quotation Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Total & Actions */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {computedBreakdown?.quotationRequired ? 'Deployment Pricing' : 'Calculated Turnkey Package Price'}
                  </span>
                  {computedBreakdown?.totalPrice !== null && computedBreakdown?.totalPrice !== undefined ? (
                    <div className="text-3xl sm:text-4xl font-black text-[#F15A24] font-heading mt-1">
                      ৳{computedBreakdown.totalPrice.toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-black text-amber-600 font-heading mt-1">
                      Request Quotation
                    </div>
                  )}
                  <span className="text-xs text-slate-500">
                    {computedBreakdown?.quotationRequired
                      ? (computedBreakdown.quotationReason || 'Enterprise or custom setup requires engineer review.')
                      : 'Includes all components, storage, cables & connectors (BDT)'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 text-right sm:text-left">
                  Delivery available nationwide in Bangladesh
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {computedBreakdown?.quotationRequired ? (
                  <Button
                    size="lg"
                    onClick={() => onNavigate('quote')}
                    className="w-full bg-[#111827] hover:bg-black text-white"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    <span>Request Quotation for Setup</span>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleAddPackageToCart}
                    className="w-full"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    <span>Add Package to Cart</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate('quote')}
                  className="w-full"
                >
                  <span>Book Site Survey for this Setup</span>
                </Button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
