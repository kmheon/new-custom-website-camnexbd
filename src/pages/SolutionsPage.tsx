import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Building2,
  ShoppingBag,
  Factory,
  GraduationCap,
  Shield,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wrench,
  Sparkles,
  Phone,
  MessageSquare,
  Layers,
  Wifi,
  Cpu,
  HardDrive
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { ProductCard } from '../components/common/ProductCard';
import { PackageCard } from '../components/cards/PackageCard';
import { cmsService, productService, packageService } from '../services';
import { useSettingsStore } from '../store';
import { ScenarioItem, Product, SecurityPackage } from '../types';
import { DEFAULT_SCENARIOS } from '../services/seedData';

interface SolutionsPageProps {
  param?: string;
  onNavigate: (route: string, param?: string) => void;
}

const getScenarioIcon = (iconName: string, className = 'w-6 h-6') => {
  switch (iconName) {
    case 'Home':
      return <Home className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Factory':
      return <Factory className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    default:
      return <Shield className={className} />;
  }
};

export const CANONICAL_SCENARIO_CONFIGS = [
  { slug: 'home-residence', title: 'Home & Residential', defaultScale: '1–4 Rooms / Duplex Residences' },
  { slug: 'corporate-office', title: 'Corporate Office', defaultScale: '20–150 Workstations / Multi-Room Floor' },
  { slug: 'shop-retail', title: 'Shop & Retail Store', defaultScale: 'Single Store / Boutique / Supermarket Aisle' },
  { slug: 'factory-warehouse', title: 'Factory & Warehouse', defaultScale: '10,000+ sq ft Production Floor & Perimeter' },
  { slug: 'school-institute', title: 'School & Institute', defaultScale: 'Multi-Floor Campus / Academic Building' }
];

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ param, onNavigate }) => {
  const { settings, loadSettings } = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    loadSettings();
    setIsLoadingCatalog(true);
    Promise.all([
      productService.getProducts({ limit: 80 }).catch(() => ({ items: [] })),
      packageService.getPackages().catch(() => [])
    ]).then(([prodRes, pkgList]) => {
      setProducts(prodRes.items || []);
      setPackages(pkgList || []);
      setIsLoadingCatalog(false);
    });
  }, [loadSettings]);

  // Master scenarios: merge DB site_settings scenarios with DEFAULT_SCENARIOS rich specifications
  const allScenarios = useMemo(() => {
    const rawList = (settings?.scenarios && settings.scenarios.length > 0)
      ? settings.scenarios
      : DEFAULT_SCENARIOS;

    // Filter strictly to the 5 canonical scenarios specified by CamneX
    const allowedSlugs = CANONICAL_SCENARIO_CONFIGS.map(c => c.slug);

    const list = rawList
      .filter((s) => allowedSlugs.includes(s.slug) && s.enabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // If DB list was missing any canonical scenario, fill from DEFAULT_SCENARIOS
    return allowedSlugs.map((slug) => {
      const dbMatch = list.find((s) => s.slug === slug);
      const defaultMatch = DEFAULT_SCENARIOS.find((s) => s.slug === slug);
      if (dbMatch && defaultMatch) {
        return {
          ...defaultMatch,
          ...dbMatch,
          highlights: dbMatch.highlights || defaultMatch.highlights || [],
          requirements: dbMatch.requirements || defaultMatch.requirements || [],
          engineeringStandards: dbMatch.engineeringStandards || defaultMatch.engineeringStandards || [],
          scale: dbMatch.scale || defaultMatch.scale,
          cablingStandard: dbMatch.cablingStandard || defaultMatch.cablingStandard,
          networkType: dbMatch.networkType || defaultMatch.networkType,
          recommendedPackages: (dbMatch.recommendedPackages && dbMatch.recommendedPackages.length > 0 && !dbMatch.recommendedPackages.includes('night-vision-cctv-package'))
            ? dbMatch.recommendedPackages
            : (defaultMatch.recommendedPackages || []),
          recommendedProducts: (dbMatch.recommendedProducts && dbMatch.recommendedProducts.length > 0)
            ? dbMatch.recommendedProducts
            : (defaultMatch.recommendedProducts || []),
          recommendedCategories: (dbMatch.recommendedCategories && dbMatch.recommendedCategories.length > 0)
            ? dbMatch.recommendedCategories
            : (defaultMatch.recommendedCategories || [])
        };
      }
      return defaultMatch || dbMatch!;
    }).filter(Boolean);
  }, [settings?.scenarios]);

  const currentScenario = useMemo(() => {
    if (!param) return null;
    return allScenarios.find((s) => s.slug === param || s.id === param) || null;
  }, [param, allScenarios]);

  // Filter relevant products and packages for current scenario
  const scenarioProducts = useMemo(() => {
    if (!currentScenario) return [];
    const recIds = currentScenario.recommendedProducts || [];
    const recCats = currentScenario.recommendedCategories || [];

    // First try exact ID matches
    const matched = products.filter((p) => recIds.includes(p.id));
    if (matched.length >= 2) return matched.slice(0, 4);

    // Fall back or augment with category matches
    const catMatches = products.filter((p) => p.categorySlug && recCats.includes(p.categorySlug));
    const combined = [...matched, ...catMatches.filter((p) => !matched.some((m) => m.id === p.id))];
    return combined.slice(0, 4);
  }, [currentScenario, products]);

  const scenarioPackages = useMemo(() => {
    if (!currentScenario) return [];
    const recSlugs = currentScenario.recommendedPackages || [];

    const matched = packages.filter((pkg) => {
      return recSlugs.some((s) => pkg.slug === s || pkg.slug.includes(s) || s.includes(pkg.slug));
    });

    if (matched.length > 0) return matched.slice(0, 2);
    return packages.slice(0, 2);
  }, [currentScenario, packages]);

  // ==========================================================================
  // VIEW 1: SCENARIO DETAIL PAGE (/solutions/:slug)
  // ==========================================================================
  if (currentScenario) {
    const otherScenarios = allScenarios.filter((s) => s.id !== currentScenario.id);

    return (
      <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
        <SEO
          title={`${currentScenario.title} Security Solutions & Engineering | CamneX Bangladesh`}
          description={currentScenario.description}
          canonicalPath={`/solutions/${currentScenario.slug}`}
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', onClick: () => onNavigate('home') },
              { label: 'Solutions & Engineering', onClick: () => onNavigate('solutions') },
              { label: currentScenario.title }
            ]}
          />

          {/* Hero Banner Card */}
          <div className="bg-white p-7 sm:p-10 lg:p-12 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deployment Scenario · Engineered for Dhaka Facilities</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('solutions')}
                className="text-xs font-bold text-[#5B6472] hover:text-[#F15A24] flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F15A24] rounded-lg px-2 py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Scenarios</span>
              </button>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center font-bold shrink-0">
                    {getScenarioIcon(currentScenario.iconName, 'w-6 h-6')}
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-[#111827]">
                    {currentScenario.title} Security & Surveillance
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-[#5B6472] leading-relaxed pt-1">
                  {currentScenario.description} CamneX provides end-to-end hardware procurement, rigid conduit cable concealment, power safety, and cloud application configuration across all Dhaka districts.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 pt-2 lg:pt-0">
                <Button
                  size="md"
                  onClick={() => onNavigate('quote')}
                  className="min-h-[44px] justify-center text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20"
                >
                  Get Quote for this Scenario
                </Button>
                <a
                  href={`https://wa.me/8801540535150?text=${encodeURIComponent(
                    `Hello CamneX Engineering, I am interested in planning a ${currentScenario.title} setup in Dhaka.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center justify-center font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-[#F15A24]" />
                  <span>WhatsApp Engineer</span>
                </a>
              </div>
            </div>

            {/* Quick Spec Highlights Strip */}
            <div className="pt-6 border-t border-[#EDE8E1] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]/80 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#F15A24] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Deployment Scale</span>
                </div>
                <p className="text-xs font-bold text-[#111827]">
                  {currentScenario.scale || 'Custom Single or Multi-Floor Layout'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]/80 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#F15A24] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Cabling Standard</span>
                </div>
                <p className="text-xs font-bold text-[#111827]">
                  {currentScenario.cablingStandard || 'Rigid PVC Pipe Conduit & 100% Solid Copper Cat6'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]/80 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#F15A24] flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Network Topology</span>
                </div>
                <p className="text-xs font-bold text-[#111827]">
                  {currentScenario.networkType || 'Hik-Connect / Ruijie Cloud Encrypted P2P'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Relevant Deployment Requirements */}
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                Functional Architecture
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-[#111827]">
                Key Deployment Requirements
              </h2>
              <p className="text-xs sm:text-sm text-[#5B6472]">
                Critical parameters engineered specifically for {currentScenario.title.toLowerCase()} environments in Dhaka.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {(currentScenario.requirements || [
                'Perimeter Entryway Coverage: High-definition cameras monitoring all entry gates, doors, and boundary walls.',
                'Night Vision & Audio Recording: 24/7 night vision with built-in audio capture for clear identification.',
                'Encrypted Smartphone Streaming: Multi-device mobile app live view with instant push notification alerts.',
                'Power Safety & Surge Suppression: Regulated DC power supply protecting equipment from voltage spikes.'
              ]).map((req, idx) => {
                const [title, ...descParts] = req.split(':');
                const desc = descParts.join(':').trim();

                return (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-[24px] border border-[#EDE8E1] shadow-xs space-y-2 hover:border-[#F15A24]/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-[#111827]">
                          {title.trim()}
                        </h3>
                        <p className="text-xs text-[#5B6472] leading-relaxed">
                          {desc || title.trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Recommended Packages */}
          {scenarioPackages.length > 0 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                    Ready-to-Deploy Hardware Bundles
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-[#111827]">
                    Recommended CCTV & Security Packages
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5B6472]">
                    Pre-engineered packages with verified camera counts, DVR/NVR recorders, surveillance HDD, and accessories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('packages')}
                  className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Browse All Packages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenarioPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Recommended Hardware & Equipment */}
          {scenarioProducts.length > 0 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                    Component Selection
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-[#111827]">
                    Suitable Hardware Components
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5B6472]">
                    Individual authentic equipment from authorized partners (Hikvision, Dahua, ZKTeco, Ruijie) with official manufacturer warranties.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View Full Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {scenarioProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Relevant Hardware Categories */}
          {currentScenario.recommendedCategories && currentScenario.recommendedCategories.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading font-black text-lg text-[#111827]">
                  Explore Equipment by Category
                </h3>
                <p className="text-xs text-[#5B6472]">
                  Direct access to hardware catalogs suitable for {currentScenario.title.toLowerCase()} configurations:
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {currentScenario.recommendedCategories.map((catSlug) => (
                  <button
                    key={catSlug}
                    type="button"
                    onClick={() => onNavigate('category', catSlug)}
                    className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-orange-50 border border-[#EDE8E1] text-xs font-bold text-[#111827] hover:text-[#F15A24] transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                  >
                    <span className="capitalize">{catSlug.replace(/-/g, ' ')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#F15A24]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Standard Installation & Engineering Considerations */}
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                Field Engineering Standards
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-[#111827]">
                Installation Considerations & Quality Checklist
              </h2>
              <p className="text-xs sm:text-sm text-[#5B6472]">
                CamneX technicians adhere to strict engineering protocols on every deployment across Dhaka.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {(currentScenario.engineeringStandards || [
                'Wiring Concealment: Cables routed inside heavy-gauge surface PVC casing channels matching wall finishes.',
                'Weatherproof Enclosures: Exterior camera joints housed in IP66 sealed terminal base boxes.',
                'Power Regulation: Central switching power adapter equipped with transient surge protection.',
                'End-User Onboarding: Full on-site assistance configuring the mobile app on all smartphones.'
              ]).map((std, idx) => {
                const [title, ...descParts] = std.split(':');
                const desc = descParts.join(':').trim();

                return (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-[24px] border border-[#EDE8E1] shadow-xs space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-[#111827]">
                          {title.trim()}
                        </h3>
                        <p className="text-xs text-[#5B6472] leading-relaxed">
                          {desc || title.trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Quote & Contact Call-to-Action Banner */}
          <div className="bg-[#0F172A] text-white p-8 sm:p-12 rounded-[28px] border border-slate-800 shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#F15A24]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-[#F15A24] border border-[#F15A24]/30 text-xs font-bold uppercase tracking-wider">
                <span>Direct Engineering Inquiry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-white">
                Planning a {currentScenario.title} Setup in Dhaka?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Get a transparent bill of materials (BOM), verified authentic hardware, and certified installation backed by warranty. Our certified engineers conduct physical site surveys across Gulshan, Banani, Uttara, Dhanmondi, Mirpur, Motijheel, and surrounding industrial zones.
              </p>

              <div className="pt-2 flex flex-wrap gap-4 items-center">
                <Button
                  size="md"
                  onClick={() => onNavigate('quote')}
                  className="min-h-[44px] px-8 text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/20"
                >
                  Request Site Survey & Quote
                </Button>
                <a
                  href={`https://wa.me/8801540535150?text=${encodeURIComponent(
                    `Hello CamneX Engineering, I need assistance with a ${currentScenario.title} installation in Dhaka.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center justify-center font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-[#F15A24]" />
                  <span>Call / WhatsApp: +880 1540-535150</span>
                </a>
              </div>
            </div>
          </div>

          {/* Section 7: Explore Other Scenarios Navigation Grid */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold font-heading text-[#111827]">
              Explore Other Deployment Scenarios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {otherScenarios.map((scen) => (
                <div
                  key={scen.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${scen.title} setup`}
                  onClick={() => onNavigate('solutions', scen.slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate('solutions', scen.slug);
                    }
                  }}
                  className="bg-white rounded-2xl border border-[#EDE8E1] p-5 hover:border-[#F15A24]/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:ring-offset-2"
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center font-bold group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                      {getScenarioIcon(scen.iconName, 'w-4 h-4')}
                    </div>
                    <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors">
                      {scen.title}
                    </h3>
                    <p className="text-xs text-[#5B6472] line-clamp-2">
                      {scen.description}
                    </p>
                  </div>
                  <div className="pt-3 text-[11px] font-bold text-[#F15A24] flex items-center gap-1">
                    <span>Explore Setup</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: MAIN SOLUTIONS LISTING PAGE (/solutions)
  // ==========================================================================
  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
      <SEO
        title="Engineering Solutions & Deployment Scenarios | CamneX Bangladesh"
        description="Tailored security and networking setups for home, office, retail, warehouse, and school deployments across Dhaka."
        canonicalPath="/solutions"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Solutions & Engineering' }
          ]}
        />

        {/* Hero Section Header Card */}
        <div className="bg-white p-7 sm:p-10 lg:p-12 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Engineering Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-[#111827]">
            Deployment Solutions by Scenario
          </h1>
          <p className="text-sm sm:text-base text-[#5B6472] leading-relaxed max-w-3xl">
            CamneX delivers turnkey hardware and structured installation across Dhaka. Every scenario is engineered with exact hardware specifications, power budgets, and cabling and installation standards.
          </p>
        </div>

        {/* 5 Scenario Cards Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allScenarios.map((scen) => (
            <div
              key={scen.id}
              role="button"
              tabIndex={0}
              aria-label={`Explore ${scen.title} setup`}
              onClick={() => onNavigate('solutions', scen.slug)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate('solutions', scen.slug);
                }
              }}
              className="bg-white rounded-[24px] border border-[#EDE8E1] p-7 hover:border-[#F15A24]/40 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:ring-offset-2"
            >
              <div>
                {/* Icon Tile */}
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center font-bold mb-4 group-hover:scale-105 group-hover:bg-[#F15A24] group-hover:text-white transition-all duration-300">
                  {getScenarioIcon(scen.iconName, 'w-6 h-6')}
                </div>

                {/* Title */}
                <h2 className="font-heading font-black text-xl text-[#111827] group-hover:text-[#F15A24] transition-colors mb-2">
                  {scen.title}
                </h2>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#5B6472] leading-relaxed line-clamp-2 mb-4">
                  {scen.description}
                </p>

                {/* Highlight Badges */}
                {scen.highlights && scen.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {scen.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EDE8E1] text-[#334155]"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer: Explore Setup Action */}
              <div className="pt-4 border-t border-[#EDE8E1] flex items-center justify-between">
                <span className="text-xs font-bold text-[#F15A24] group-hover:translate-x-0.5 transition-transform">
                  Explore Setup
                </span>
                <div className="w-9 h-9 rounded-full bg-orange-50 text-[#F15A24] flex items-center justify-center group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CamneX Engineering Standards Guarantee Banner */}
        <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black font-heading text-[#111827]">
              CamneX Engineering Commitments
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6472] max-w-2xl">
              Every surveillance and network project installed in Dhaka is executed under strict technical oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#111827]">
                  100% Genuine Partner Hardware
                </h3>
                <p className="text-xs text-[#5B6472] leading-relaxed">
                  Authorized equipment from Hikvision, Dahua, ZKTeco, and Ruijie with traceable serial records and official warranty.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#111827]">
                  Clean Conduit Concealment
                </h3>
                <p className="text-xs text-[#5B6472] leading-relaxed">
                  Heavy-gauge PVC and GI conduit piping with waterproof junction boxes and secure cable dressing across ceilings and walls.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#111827]">
                  Dedicated Local Support
                </h3>
                <p className="text-xs text-[#5B6472] leading-relaxed">
                  Dhaka-based engineering field technicians for physical on-site surveys, rapid dispatch, and hands-on client training.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
