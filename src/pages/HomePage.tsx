import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Wrench,
  Layers,
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  Camera,
  Cpu,
  Wifi,
  Eye,
  Settings,
  HardDrive,
  Home,
  Building2,
  Factory,
  GraduationCap,
  Tag,
  Check,
  Send,
  SlidersHorizontal
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { SectionHeader } from '../components/common/SectionHeader';
import { ProductCard } from '../components/common/ProductCard';
import { ProductRow } from '../components/common/ProductRow';
import { HeroSlider } from '../components/HeroSlider';
import {
  cmsService,
  productService,
  categoryService,
  packageService,
  quoteService
} from '../services';
import {
  Product,
  Category,
  SecurityPackage,
  Testimonial,
  ProjectCaseStudy,
  ScenarioItem
} from '../types';
import { useSettingsStore, useAdminAuthStore, useCartStore } from '../store';
import {
  DEFAULT_SCENARIOS,
  DEFAULT_HOW_IT_WORKS
} from '../services/seedData';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

// Crisp Vector SVG Fallback for CCTV Package kits (Camera + Recorder + Cat6 coil)
const CctvKitSvgFallback: React.FC = () => (
  <div className="w-full h-36 sm:h-44 bg-[#F4EEE6] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
    <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Recorder / NVR base */}
      <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
      <rect x="35" y="74" width="32" height="4" rx="2" fill="#F15A24" />
      <circle cx="155" cy="84" r="3" fill="#22C55E" />
      <circle cx="165" cy="84" r="3" fill="#3B82F6" />
      <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
      {/* Cat6 Cable Coil */}
      <circle cx="145" cy="40" r="22" stroke="#3B82F6" strokeWidth="6" strokeDasharray="6 4" fill="none" />
      <circle cx="145" cy="40" r="10" fill="#E2E8F0" />
      {/* Bullet Camera */}
      <rect x="42" y="22" width="55" height="26" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M97 26 L118 18 L118 52 L97 44 Z" fill="#64748B" />
      <circle cx="52" cy="35" r="7" fill="#0F172A" />
      <circle cx="52" cy="35" r="3" fill="#38BDF8" />
      {/* Mount arm */}
      <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
      <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
    </svg>
  </div>
);

// Expandable Testimonial Card with 5-line clamping & [overflow-wrap:anywhere]
const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = (testimonial.content || '').length > 180;
  return (
    <div className="bg-white rounded-[20px] border border-[#EDE8E1] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-w-0 w-full">
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-amber-400 mb-3">
          {[...Array(testimonial.rating || 5)].map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <p
          className={`text-xs text-[#111827] leading-relaxed italic mb-2 min-w-0 [overflow-wrap:anywhere] break-words ${
            !isExpanded ? 'line-clamp-5' : ''
          }`}
        >
          "{testimonial.content}"
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-[#F15A24] hover:underline mb-3 inline-block cursor-pointer focus:outline-none"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
      <div className="pt-3 border-t border-[#EDE8E1] min-w-0">
        <div className="font-bold text-xs text-[#111827] [overflow-wrap:anywhere] break-words truncate">
          {testimonial.clientName}
        </div>
        <div className="text-[11px] text-[#5B6472] [overflow-wrap:anywhere] break-words truncate">
          {testimonial.clientRole || testimonial.company}
        </div>
      </div>
    </div>
  );
};

// Neutral Fallback Project Card with [overflow-wrap:anywhere] and real image / blueprint vector
const ProjectCard: React.FC<{
  project: ProjectCaseStudy;
  onNavigate: (route: string, param?: string) => void;
}> = ({ project, onNavigate }) => {
  const [imgError, setImgError] = useState(false);
  const fallbackSvg = '/images/projects/project-neutral.svg';
  const hasImage = Boolean(project.image && project.image.trim() && !imgError);

  return (
    <div
      onClick={() => onNavigate('projects')}
      className="bg-white rounded-[20px] border border-[#EDE8E1] overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 w-full"
    >
      <div className="h-44 bg-slate-100 overflow-hidden relative min-w-0">
        <img
          src={hasImage ? project.image : fallbackSvg}
          alt={project.title}
          onError={() => setImgError(true)}
          className={`w-full h-full ${hasImage ? 'object-cover' : 'object-contain p-4'} group-hover:scale-105 transition-transform duration-300`}
        />
        {project.category && (
          <span className="absolute top-3 left-3 bg-[#111827]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {project.category}
          </span>
        )}
      </div>
      <div className="p-5 min-w-0 flex-1 flex flex-col justify-between">
        <h3 className="font-heading font-bold text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors mb-1 line-clamp-1 min-w-0 [overflow-wrap:anywhere] break-words">
          {project.title}
        </h3>
        <p className="text-xs text-[#5B6472] leading-relaxed line-clamp-2 min-w-0 [overflow-wrap:anywhere] break-words">
          {project.description}
        </p>
      </div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { settings, loadSettings } = useSettingsStore();
  const { isAdminAuthenticated, checkAuth } = useAdminAuthStore();
  const { addItem } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Product[]>([]);
  const [categoryRowProducts, setCategoryRowProducts] = useState<{ [catId: string]: Product[] }>({});
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);

  // Package filters: camera count & package type
  const [packageCountFilter, setPackageCountFilter] = useState<string>('All');
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>('All Types');

  // Quick Service Request callback state
  const [selectedServiceChip, setSelectedServiceChip] = useState<string>('CCTV Camera Setup');
  const [callbackName, setCallbackName] = useState<string>('');
  const [callbackPhone, setCallbackPhone] = useState<string>('');
  const [callbackArea, setCallbackArea] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [callbackStatus, setCallbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [callbackMessage, setCallbackMessage] = useState<string>('');

  useEffect(() => {
    loadSettings();
    checkAuth();

    // Fetch categories
    categoryService.getCategories().then((allCats) => {
      setCategories(allCats);

      // Fetch products for categories configured to show on homepage
      const homepageCats = allCats.filter((c) => c.showOnHomepage);
      homepageCats.forEach((cat) => {
        productService.getProducts({ category: cat.slug, limit: 8 }).then((res) => {
          setCategoryRowProducts((prev) => ({
            ...prev,
            [cat.id]: res.items
          }));
        });
      });
    });

    // Fetch popular products
    productService.getPopularProducts(8).then(setPopularProducts);

    // Fetch new arrivals (sorted by newest)
    productService.getProducts({ sortBy: 'created_at', sortOrder: 'desc', limit: 8 }).then((res) => {
      setNewArrivals(res.items);
    });

    // Fetch all products to identify REAL special offers (strictly products with genuine sale price < regular price)
    productService.getProducts({ limit: 40 }).then((res) => {
      const discounted = res.items.filter(
        (p) => p.pricing.salePrice && p.pricing.regularPrice && p.pricing.salePrice < p.pricing.regularPrice
      );
      setSpecialOffers(discounted);
    });

    // Fetch packages
    packageService.getPackages().then(setPackages);

    // Fetch proof sections (testimonials and projects)
    cmsService.getTestimonials().then(setTestimonials);
    cmsService.getProjects().then(setProjects);
  }, [loadSettings, checkAuth]);

  // Quick Service Request callback submit handler
  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackName.trim() || !callbackPhone.trim()) {
      setCallbackMessage('Please enter your full name and valid phone number.');
      setCallbackStatus('error');
      return;
    }

    setCallbackStatus('submitting');
    setCallbackMessage('');

    try {
      await quoteService.createServiceRequest({
        customerName: callbackName.trim(),
        phone: callbackPhone.trim(),
        serviceType: selectedServiceChip,
        area: callbackArea.trim(),
        website: honeypot // Anti-bot honeypot field
      });

      setCallbackStatus('success');
      setCallbackMessage('Thank you! Our engineer will call you back within 15 minutes.');
      setCallbackName('');
      setCallbackPhone('');
      setCallbackArea('');
    } catch (err: any) {
      setCallbackStatus('error');
      setCallbackMessage(err?.message || 'Could not submit request. Please call +880 1540-535150 directly.');
    }
  };

  // Filtered packages by count and type
  const filteredPackages = packages.filter((pkg) => {
    // Camera count filter
    if (packageCountFilter !== 'All') {
      const countMatch = pkg.name.toLowerCase().includes(packageCountFilter.toLowerCase()) ||
        pkg.description.toLowerCase().includes(packageCountFilter.toLowerCase());
      if (!countMatch) return false;
    }

    // Type filter
    if (packageTypeFilter === 'Bullet Series') {
      return pkg.name.toLowerCase().includes('bullet') || pkg.description.toLowerCase().includes('bullet');
    }
    if (packageTypeFilter === 'Dome Series') {
      return pkg.name.toLowerCase().includes('dome') || pkg.description.toLowerCase().includes('dome');
    }
    if (packageTypeFilter === 'PoE IP Systems') {
      return pkg.name.toLowerCase().includes('ip') || pkg.name.toLowerCase().includes('poe') || pkg.description.toLowerCase().includes('poe');
    }

    return true;
  });

  const displayPackages = filteredPackages.length > 0 ? filteredPackages : packages;

  // Active Scenarios
  const scenarios: ScenarioItem[] = (settings?.scenarios && settings.scenarios.length > 0)
    ? settings.scenarios.filter((s) => s.enabled)
    : DEFAULT_SCENARIOS;

  // Helper for Scenario line icons
  const renderScenarioIcon = (iconName?: string) => {
    const className = "w-6 h-6 text-[#F15A24]";
    switch (iconName?.toLowerCase()) {
      case 'home': return <Home className={className} />;
      case 'building2':
      case 'building': return <Building2 className={className} />;
      case 'shoppingbag':
      case 'shop': return <ShoppingBag className={className} />;
      case 'factory': return <Factory className={className} />;
      case 'graduationcap':
      case 'school': return <GraduationCap className={className} />;
      default: return <Shield className={className} />;
    }
  };

  const howItWorks = settings?.howItWorks || DEFAULT_HOW_IT_WORKS;
  const phone = settings?.phone || '+880 1540-535150';
  const whatsappNumber = settings?.whatsappNumber || '8801540535150';
  const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20CamneX,%20I%20would%20like%20to%20inquire%20about%20a%20security%20system`;

  const configuredReassurances = settings?.reassurances
    ? (settings.reassurances as any[]).filter(r => r && r.enabled).map(r => r.label)
    : [];
  const reassuranceItems = configuredReassurances;

  // Real category name lookup for scenario chips (no auto-capitalized slugs)
  const categoryNameMap = React.useMemo(() => {
    const map: Record<string, string> = {
      'cctv-cameras': 'CCTV Cameras',
      'cat-cctv': 'CCTV Cameras',
      'dvr-nvr': 'DVR / NVR Recorders',
      'dvr-nvr-recorders': 'DVR / NVR Recorders',
      'recorders': 'DVR / NVR Recorders',
      'cat-recorders': 'DVR / NVR Recorders',
      'access-control': 'Access Control & Biometrics',
      'biometrics-access-control': 'Access Control & Biometrics',
      'cat-access': 'Access Control & Biometrics',
      'enterprise-networking': 'Enterprise Networking',
      'network-switches': 'Enterprise Networking',
      'networking': 'Enterprise Networking',
      'cat-networking': 'Enterprise Networking',
      'wifi': 'Enterprise Wi-Fi & APs',
      'cat-wifi': 'Enterprise Wi-Fi & APs',
      'storage': 'Surveillance Hard Drives',
      'surveillance-hard-drives': 'Surveillance Hard Drives',
      'cctv-accessories': 'Installation Accessories',
      'accessories': 'Installation Accessories'
    };
    categories.forEach((c) => {
      if (c.slug) map[c.slug] = c.name;
      if (c.id) map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Helper for Category image fallback
  const handleCatImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/images/hero/hikvision-bullet.jpg';
  };

  // ============================================================================
  // STRICT HOMEPAGE ROW DEDUPLICATION (A product appears in only ONE row)
  // ============================================================================
  const displayedProductIds = new Set<string>();

  const dedupPopular = popularProducts.filter((p) => {
    if (displayedProductIds.has(p.id)) return false;
    displayedProductIds.add(p.id);
    return true;
  });

  const dedupNewArrivals = newArrivals.filter((p) => {
    if (displayedProductIds.has(p.id)) return false;
    displayedProductIds.add(p.id);
    return true;
  });

  const dedupCategoryRows = categories
    .filter((cat) => cat.showOnHomepage && categoryRowProducts[cat.id]?.length > 0)
    .map((cat) => {
      const items = (categoryRowProducts[cat.id] || []).filter((p) => {
        if (displayedProductIds.has(p.id)) return false;
        displayedProductIds.add(p.id);
        return true;
      });
      return { cat, items };
    })
    .filter((row) => row.items.length > 0);

  // 6 Quick Service Request Chips (neutral, claim-free)
  const serviceChips = [
    'CCTV Camera Setup',
    'Cabling and installation',
    'Physical Site Survey',
    'Wi-Fi 6 Networking',
    'Biometric Attendance',
    'DVR/NVR Repair'
  ];

  return (
    <div className="bg-[#FAF7F2] text-[#111827] min-h-screen">
      <SEO
        title="CamneX Bangladesh | Authorized Security & Surveillance Engineering"
        description="Authorized Hikvision Partner and ZKTeco Installer in Bangladesh. Genuine CCTV cameras, Turbo HD DVRs, enterprise switches, and biometric access control."
        canonicalPath="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SecurityService",
          "name": "CamneX Bangladesh",
          "telephone": "+8801540535150",
          "email": "contact@camnexbd.com",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Block A, Chandrima Model Town, House 22, Road 06",
            "addressLocality": "Dhaka",
            "postalCode": "1207",
            "addressCountry": "BD"
          },
          "url": "https://camnexbd.com"
        }}
      />

      {/* 1. HERO SLIDER & BRAND STRIP (Definitive Full-Width Band) */}
      <HeroSlider onNavigate={onNavigate} />

      {/* 2. SHOP BY CATEGORY (Definitive Section: Compact Icon Chips) */}
      <section className="w-full bg-[#FAF7F2] py-12 md:py-[72px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Hardware Categories"
            title="Shop by Category"
            subtitle="Surveillance, networking, and biometric equipment"
            actionText="All categories"
            onAction={() => onNavigate('catalog')}
            className="mb-8"
          />

          {/* Compact Chip Strip: Horizontal scroll mobile, wrapping centered grid desktop */}
          <div className="overflow-x-auto no-scrollbar flex md:flex-wrap md:justify-center items-start gap-4 sm:gap-6 pt-2 pb-2">
            {categories.slice(0, 10).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate('category', cat.slug)}
                className="flex flex-col items-center group cursor-pointer text-center w-20 sm:w-24 shrink-0 transition-transform focus:outline-none min-w-0"
              >
                {/* 88-104px Soft Circle with Icon */}
                <div className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-full bg-[#F4EEE6] group-hover:bg-orange-50 border border-[#EDE8E1] group-hover:border-orange-300 transition-all duration-300 flex items-center justify-center p-3 sm:p-4 shadow-2xs group-hover:shadow-md group-hover:-translate-y-1">
                  <img
                    src={cat.image || '/images/hero/hikvision-bullet.jpg'}
                    alt={cat.name}
                    onError={handleCatImageError}
                    className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Category Name Below (No descriptions, no big cards) */}
                <span className="mt-2.5 text-xs font-bold text-[#111827] group-hover:text-[#F15A24] transition-colors leading-tight line-clamp-2 [overflow-wrap:anywhere] break-words">
                  {cat.name}
                </span>
              </button>
            ))}

            {/* "All" Category Chip */}
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="flex flex-col items-center group cursor-pointer text-center w-20 sm:w-24 shrink-0 transition-transform focus:outline-none"
            >
              <div className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] rounded-full bg-white group-hover:bg-orange-50 border border-[#EDE8E1] group-hover:border-orange-300 transition-all duration-300 flex items-center justify-center p-3 sm:p-4 shadow-2xs group-hover:shadow-md group-hover:-translate-y-1">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F15A24] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <span className="mt-2.5 text-xs font-bold text-[#111827] group-hover:text-[#F15A24] transition-colors leading-tight">
                All Items
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY SCENARIO (Definitive Section: Full-Width Soft Band #F4EEE6) */}
      {scenarios.length > 1 && (
        <section className="w-full bg-[#F4EEE6] py-12 md:py-[72px] border-y border-[#EDE8E1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Tailored Engineering"
              title="Shop by Scenario"
              subtitle="Recommended turnkey surveillance and networking setups engineered for specific deployment environments"
              centered
              className="mb-8"
            />

            {/* Large Scenario Tiles (centered if < 3 items) */}
            <div className={scenarios.length === 2 ? "flex flex-wrap justify-center gap-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => onNavigate('solutions', scenario.slug)}
                  className={`bg-white rounded-[24px] border border-[#EDE8E1] p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between min-w-0 ${
                    scenarios.length === 2 ? 'w-full max-w-[380px]' : ''
                  }`}
                >
                  <div className="min-w-0">
                    {/* Large Line Icon on Soft Circle */}
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      {renderScenarioIcon(scenario.iconName)}
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-bold text-lg text-[#111827] group-hover:text-[#F15A24] transition-colors mb-2 min-w-0 [overflow-wrap:anywhere] break-words">
                      {scenario.title}
                    </h3>

                    {/* 1-Line Description (no mid-sentence ellipsis) */}
                    <p className="text-xs text-[#5B6472] leading-relaxed mb-4 min-w-0 [overflow-wrap:anywhere] break-words">
                      {scenario.description}
                    </p>

                    {/* "Recommended" Chips pointing to real categories/packages/products with real category names */}
                    {scenario.recommendedCategories && scenario.recommendedCategories.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[#EDE8E1]/80 mb-4 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6472] block">
                          Recommended Setup:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {scenario.recommendedCategories.slice(0, 3).map((catSlug) => {
                            const realCategoryName = categoryNameMap[catSlug] || catSlug.replace(/-/g, ' ');
                            return (
                              <span
                                key={catSlug}
                                className="text-[10px] font-medium bg-[#FAF7F2] text-[#111827] border border-[#EDE8E1] px-2 py-0.5 rounded-full [overflow-wrap:anywhere] break-words"
                              >
                                {realCategoryName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Explore Scenario Link */}
                  <div className="pt-3 border-t border-[#EDE8E1] flex items-center justify-between text-xs font-bold text-[#F15A24]">
                    <span>Explore Scenario</span>
                    <div className="w-7 h-7 rounded-full bg-orange-50 text-[#F15A24] group-hover:bg-[#F15A24] group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. CCTV PACKAGE SELECTOR (Definitive Section: Full-Width Band #FAF7F2) */}
      {displayPackages.length > 1 && (
        <section className="w-full bg-[#FAF7F2] py-12 md:py-[72px]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Turnkey Bundles"
              title="Complete CCTV Packages"
              subtitle="Configurable camera kits with storage, wiring, and professional installation options"
              actionText="All packages"
              onAction={() => onNavigate('packages')}
              className="mb-8"
            />

            {/* Camera Count Tabs & Type Chips */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              {/* Camera Count Tabs (2 / 4 / 8 / 16 / All) */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-full border border-[#EDE8E1] shadow-2xs">
                {['All', '2 Camera', '4 Camera', '8 Camera', '16 Camera'].map((tab) => {
                  const isActive = packageCountFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPackageCountFilter(tab)}
                      className={`min-h-[34px] px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#F15A24] text-white shadow-xs'
                          : 'text-[#5B6472] hover:text-[#111827]'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Type Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['All Types', 'Bullet Series', 'Dome Series', 'PoE IP Systems'].map((chip) => {
                  const isActive = packageTypeFilter === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setPackageTypeFilter(chip)}
                      className={`min-h-[34px] px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#141210] text-white'
                          : 'bg-white hover:bg-slate-50 text-[#5B6472] border border-[#EDE8E1]'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Package Cards Grid (centered if < 3 items) */}
            <div className={displayPackages.length === 2 ? "flex flex-wrap justify-center gap-5" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"}>
              {displayPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-[20px] border border-[#EDE8E1] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xl transition-all h-full group ${
                    displayPackages.length === 2 ? 'w-full max-w-[360px]' : ''
                  }`}
                >
                  <div>
                    {/* Package Kit Image or Crisp Vector SVG Kit Fallback */}
                    <div className="mb-4 overflow-hidden rounded-2xl">
                      {pkg.image ? (
                        <div className="h-36 sm:h-44 bg-[#F4EEE6] rounded-2xl flex items-center justify-center p-3">
                          <img
                            src={pkg.image}
                            alt={pkg.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <CctvKitSvgFallback />
                      )}
                    </div>

                    {/* Manual Admin Tag Ribbon / Badge */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F15A24] px-2.5 py-0.5 rounded-full">
                        {pkg.badge || 'Complete Kit'}
                      </span>
                      <span className="text-[11px] font-bold text-[#5B6472]">
                        Hardware Kit
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#111827] mb-2 leading-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-[#5B6472] leading-relaxed mb-4">
                      {pkg.description}
                    </p>

                    {/* Real Component Models Checklist */}
                    <div className="space-y-2 py-3 border-y border-[#EDE8E1] text-xs text-[#111827] mb-4">
                      {pkg.rules && pkg.rules.length > 0 ? (
                        pkg.rules.slice(0, 4).map((rule: any, rIdx: number) => (
                          <div key={rIdx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
                            <span className="line-clamp-1 font-mono text-[11px]">{rule.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-[#5B6472]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6472] shrink-0" />
                          <span className="text-[11px]">Components to be confirmed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div>
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6472] block">
                        Starting From
                      </span>
                      <div className="text-xl font-black text-[#111827] font-heading">
                        {pkg.basePrice ? `৳${pkg.basePrice.toLocaleString()}` : 'Request Quotation'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('packages', pkg.slug)}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Configure Package</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. SERVICES: QUICK SERVICE REQUEST (Definitive Short surface-dark Band #141210) */}
      <section className="w-full bg-[#141210] text-white py-12 md:py-[72px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Eyebrow + H2 + 6 Clickable Service Chips */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                <Wrench className="w-3.5 h-3.5" />
                <span>Services</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-heading text-white leading-tight">
                Need a technician?
              </h2>
              <p className="text-xs sm:text-sm text-[#A0A8B4] leading-relaxed max-w-lg">
                Technical consultations, cabling and installation, and hardware maintenance in Dhaka. Click a service below to schedule an engineer callback:
              </p>

              {/* 6 Service Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {serviceChips.map((chip) => {
                  const isSelected = selectedServiceChip === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSelectedServiceChip(chip)}
                      className={`min-h-[38px] p-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border ${
                        isSelected
                          ? 'bg-[#F15A24] text-white border-[#F15A24] shadow-sm'
                          : 'bg-white/10 hover:bg-white/15 text-white/90 border-white/15'
                      }`}
                    >
                      <span className="line-clamp-1">{chip}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Compact Callback Form */}
            <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Request Engineer Callback
                </span>
                <span className="text-[11px] text-[#A0A8B4]">
                  Selected: <strong className="text-[#F15A24]">{selectedServiceChip}</strong>
                </span>
              </div>

              {callbackStatus === 'success' ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-5 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Request Received</h4>
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    {callbackMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCallbackStatus('idle')}
                    className="mt-3 text-xs text-white/80 hover:text-white underline"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-3.5">
                  {/* Honeypot Anti-Bot Field */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {/* Service Select */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                      Service Type
                    </label>
                    <select
                      value={selectedServiceChip}
                      onChange={(e) => setSelectedServiceChip(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    >
                      {serviceChips.map((chip) => (
                        <option key={chip} value={chip} className="text-[#111827]">
                          {chip}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name & Phone in 2 cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={callbackName}
                        onChange={(e) => setCallbackName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={callbackPhone}
                        onChange={(e) => setCallbackPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                  </div>

                  {/* Area Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                      Dhaka Area / Location
                    </label>
                    <input
                      type="text"
                      value={callbackArea}
                      onChange={(e) => setCallbackArea(e.target.value)}
                      placeholder="e.g. Uttara Sector 3, Dhanmondi, Mirpur"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24]"
                    />
                  </div>

                  {/* Error Message */}
                  {callbackStatus === 'error' && (
                    <div className="text-xs text-rose-400 font-medium">
                      {callbackMessage}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={callbackStatus === 'submitting'}
                    className="w-full min-h-[44px] py-2.5 px-6 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{callbackStatus === 'submitting' ? 'Submitting...' : 'Request Callback'}</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 6. POPULAR PRODUCTS (Definitive Deduplicated Row on Canvas #FAF7F2) */}
      {dedupPopular.length > 0 && (
        <ProductRow
          eyebrow="Popular Hardware"
          title="Popular Products"
          subtitle="Security cameras, video recorders, and biometric access hardware"
          products={dedupPopular}
          actionText={`View all (${dedupPopular.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="canvas"
        />
      )}

      {/* 7. NEW ARRIVALS (Definitive Deduplicated Row on White #FFFFFF) */}
      {dedupNewArrivals.length > 0 && (
        <ProductRow
          eyebrow="New Deployments"
          title="New Arrivals"
          subtitle="Latest firmware models, high-density PoE switches, and Wi-Fi 6 hardware additions"
          products={dedupNewArrivals}
          actionText={`View all (${dedupNewArrivals.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="panel"
        />
      )}

      {/* 8. SPECIAL OFFERS (Definitive Section: Full-Width Warm Orange-Tint Gradient) */}
      {specialOffers.length > 1 && (
        <section className="w-full bg-gradient-to-r from-[#FFF1E8] via-[#FFEADB] to-[#FFE0CC] py-12 md:py-[72px] border-y border-orange-200/60">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Special Deals"
              title="Special Offers"
              subtitle="Promotional pricing on security and networking equipment"
              actionText={`View all deals (${specialOffers.length})`}
              onAction={() => onNavigate('catalog')}
              className="mb-8"
            />

            <div className={specialOffers.length === 2 ? "flex flex-wrap justify-center gap-5 pt-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2"}>
              {specialOffers.slice(0, 4).map((p) => {
                const discountPct = p.pricing.regularPrice && p.pricing.salePrice
                  ? Math.round(((p.pricing.regularPrice - p.pricing.salePrice) / p.pricing.regularPrice) * 100)
                  : 0;
                const savings = (p.pricing.regularPrice || 0) - (p.pricing.salePrice || 0);

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-[20px] border border-orange-200/80 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group min-w-0 ${
                      specialOffers.length === 2 ? 'w-full max-w-[320px]' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      {/* Badge Row: Bold -X% Badge & Brand Chip */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          -{discountPct}% OFF
                        </span>
                        <span className="text-[10px] font-bold text-[#5B6472] uppercase truncate">
                          {p.brand}
                        </span>
                      </div>

                      {/* Image Area */}
                      <div
                        onClick={() => onNavigate('product', p.id)}
                        className="bg-gradient-to-b from-[#FFF8F4] to-[#F4EEE6] rounded-2xl h-40 flex items-center justify-center p-3 mb-3 cursor-pointer overflow-hidden"
                      >
                        <img
                          src={p.images?.[0] || '/images/hero/hikvision-bullet.jpg'}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Monospace Model Above Title */}
                      <div className="text-[11px] font-mono font-medium text-[#5B6472] mb-1 line-clamp-1 [overflow-wrap:anywhere] break-words">
                        {p.model}
                      </div>

                      {/* Clean Title */}
                      <h3
                        onClick={() => onNavigate('product', p.id)}
                        className="font-heading font-bold text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors mb-2 line-clamp-2 cursor-pointer [overflow-wrap:anywhere] break-words"
                      >
                        {p.name}
                      </h3>
                    </div>

                    {/* Pricing with Struck-Through Baseline & Savings Pill */}
                    <div className="pt-3 border-t border-[#EDE8E1]">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xl font-black text-[#111827] font-heading">
                          ৳{p.pricing.salePrice?.toLocaleString()}
                        </span>
                        <span className="text-xs text-[#5B6472] line-through">
                          ৳{p.pricing.regularPrice?.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] font-bold text-emerald-600 mb-3">
                        You save ৳{savings.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => addItem(p, 1)}
                        className="w-full min-h-[40px] py-2 px-4 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 9. CATEGORY ROWS (Definitive Deduplicated Rows alternating White & Canvas) */}
      {dedupCategoryRows.map(({ cat, items }, idx) => (
        <ProductRow
          key={cat.id}
          eyebrow="Category Showcase"
          title={cat.name}
          subtitle={cat.description}
          products={items}
          actionText="View category"
          onAction={() => onNavigate('category', cat.slug)}
          onNavigate={onNavigate}
          variant={idx % 2 === 0 ? 'panel' : 'canvas'}
          promoTile={{
            badge: 'Featured',
            title: `${cat.name} Solutions`,
            description: `Explore full technical specifications and commercial stock for ${cat.name}.`,
            buttonText: 'View Series',
            link: `/category/${cat.slug}`
          }}
        />
      ))}

      {/* 10. HOW IT WORKS (Definitive Section: Optional Admin-Controlled) */}
      {howItWorks?.enabled && (
        <section className="w-full bg-white py-14 md:py-20 border-b border-[#EDE8E1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Process"
              title={howItWorks.title || 'How It Works'}
              subtitle={howItWorks.subtitle || 'Transparent workflow from consultation to post-installation support'}
              centered
            />

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EDE8E1] pt-4">
              {howItWorks.steps.map((step, idx) => (
                <div key={idx} className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] font-black text-sm flex items-center justify-center mx-auto shadow-2xs">
                    0{idx + 1}
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#111827]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#5B6472] leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. PROOF SECTIONS (Testimonials & Projects) */}
      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="w-full bg-[#FAF7F2] py-12 md:py-[72px]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              className="mb-8"
              eyebrow="Client Experiences"
              title="Client Feedback"
              subtitle="Feedback from commercial and residential project clients"
            />
            {testimonials.length === 4 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[840px] mx-auto">
                {testimonials.map((t) => (
                  <div key={t.id} className="min-w-0 flex">
                    <TestimonialCard testimonial={t} />
                  </div>
                ))}
              </div>
            ) : testimonials.length < 4 ? (
              <div className="flex flex-wrap justify-center gap-6">
                {testimonials.map((t) => (
                  <div key={t.id} className="w-full max-w-[380px] min-w-0 flex">
                    <TestimonialCard testimonial={t} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {testimonials.map((t) => (
                  <div key={t.id} className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] max-w-[380px] min-w-0 flex">
                    <TestimonialCard testimonial={t} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : isAdminAuthenticated ? (
        <div className="w-full bg-[#FAF7F2] py-8">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-2 border-dashed border-[#EDE8E1] rounded-[20px] p-8 text-center bg-white/50">
              <p className="text-sm font-semibold text-[#5B6472]">No testimonials published yet.</p>
              <p className="text-xs text-slate-400 mt-1">This section is hidden from visitors and only visible to you as admin.</p>
              <button
                onClick={() => onNavigate('admin', 'testimonials')}
                className="mt-3 text-xs font-bold text-[#F15A24] hover:underline"
              >
                + Add Testimonial in Admin
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Projects */}
      {projects.length > 0 ? (
        <section className="w-full bg-white py-12 md:py-[72px] border-y border-[#EDE8E1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              className="mb-8"
              eyebrow="Case Studies"
              title="Recent Installation Projects"
              subtitle="Commercial surveillance, factory Wi-Fi, and corporate biometric deployments"
              actionText="View all projects"
              onAction={() => onNavigate('projects')}
            />
            {projects.length === 4 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[840px] mx-auto">
                {projects.map((p) => (
                  <div key={p.id} className="min-w-0 flex">
                    <ProjectCard project={p} onNavigate={onNavigate} />
                  </div>
                ))}
              </div>
            ) : projects.length < 4 ? (
              <div className="flex flex-wrap justify-center gap-6">
                {projects.map((p) => (
                  <div key={p.id} className="w-full max-w-[380px] min-w-0 flex">
                    <ProjectCard project={p} onNavigate={onNavigate} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {projects.map((p) => (
                  <div key={p.id} className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] max-w-[380px] min-w-0 flex">
                    <ProjectCard project={p} onNavigate={onNavigate} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : isAdminAuthenticated ? (
        <div className="w-full bg-white py-8 border-b border-[#EDE8E1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-2 border-dashed border-[#EDE8E1] rounded-[20px] p-8 text-center bg-white/50">
              <p className="text-sm font-semibold text-[#5B6472]">No project case studies published yet.</p>
              <p className="text-xs text-slate-400 mt-1">This section is hidden from visitors and only visible to you as admin.</p>
              <button
                onClick={() => onNavigate('admin', 'projects')}
                className="mt-3 text-xs font-bold text-[#F15A24] hover:underline"
              >
                + Add Project in Admin
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 12. FINAL CTA BAND (Full-Width Orange Band Touching Footer With Zero Gap) */}
      <section id="site-cta" className="w-full bg-gradient-to-br from-[#F15A24] via-[#ea5019] to-[#D94D1C] text-white py-12 md:py-[72px] m-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            {/* Centered Translucent Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engineering & Security Assistance</span>
            </div>

            {/* White H2 */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
              Need a customized security or network setup?
            </h2>

            {/* White 90% Subtext */}
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Our engineering team provides technical consultations and hardware quotations in Dhaka.
            </p>
          </div>

          {/* Three Pill Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            {/* 1. WhatsApp Pill */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-full bg-white text-[#111827] hover:bg-slate-100 font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
              <span>Chat on WhatsApp</span>
            </a>

            {/* 2. Call Pill */}
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-full bg-white text-[#111827] hover:bg-slate-100 font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4 text-[#F15A24]" />
              <span>Call {phone}</span>
            </a>

            {/* 3. Book Site Visit Pill */}
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-full bg-transparent border border-white text-white hover:bg-white/10 font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Wrench className="w-4 h-4 text-white" />
              <span>Book Site Visit</span>
            </button>
          </div>

          {/* Reassurance Row Below */}
          {reassuranceItems && reassuranceItems.length > 0 && (
            <div className="relative z-10 border-t border-white/20 pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 sm:gap-x-10 text-xs sm:text-sm font-medium text-white/95">
              {reassuranceItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
