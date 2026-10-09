import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
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
  Quote,
  MapPin,
  Star,
  Flame
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { SectionHeader } from '../components/common/SectionHeader';
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
import { DEFAULT_SCENARIOS } from '../services/seedData';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

// Crisp Vector SVG Fallback for CCTV Package kits (Camera + Recorder + Cat6 coil)
const CctvKitSvgFallback: React.FC = () => (
  <div className="w-full h-36 sm:h-44 bg-[#F4EEE6] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
    <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
      <rect x="35" y="74" width="32" height="4" rx="2" fill="#F15A24" />
      <circle cx="155" cy="84" r="3" fill="#22C55E" />
      <circle cx="165" cy="84" r="3" fill="#3B82F6" />
      <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
      <circle cx="145" cy="40" r="22" stroke="#3B82F6" strokeWidth="6" strokeDasharray="6 4" fill="none" />
      <circle cx="145" cy="40" r="10" fill="#E2E8F0" />
      <rect x="42" y="22" width="55" height="26" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
      <path d="M97 26 L118 18 L118 52 L97 44 Z" fill="#64748B" />
      <circle cx="52" cy="35" r="7" fill="#0F172A" />
      <circle cx="52" cy="35" r="3" fill="#38BDF8" />
      <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
      <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
    </svg>
  </div>
);

// Crisp Vector SVG Fallback for Category images
const CategorySvgFallback: React.FC = () => (
  <svg viewBox="0 0 80 80" className="w-16 h-16 object-contain opacity-80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="24" width="40" height="24" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
    <path d="M50 28 L68 20 L68 52 L50 44 Z" fill="#94A3B8" />
    <circle cx="22" cy="36" r="6" fill="#0F172A" />
    <circle cx="22" cy="36" r="2.5" fill="#38BDF8" />
    <rect x="26" y="48" width="8" height="14" fill="#94A3B8" />
    <rect x="20" y="62" width="20" height="4" rx="2" fill="#64748B" />
  </svg>
);

// Testimonial Card (Reference a): quote tile top-left, 5-star rating top-right, 4-line clamped quote + "Read more",
// "Installed solution" mini panel, avatar/initial, client name & role.
const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = (testimonial.content || '').length > 150;

  return (
    <div className="bg-white rounded-[20px] border border-[#EDE8E1] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-w-0 w-full h-full">
      <div>
        {/* Top Row: Quote tile on top-left, 5-star rating on top-right */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center shadow-2xs shrink-0">
            <Quote className="w-4 h-4 fill-[#F15A24]" />
          </div>
          <div className="flex items-center gap-0.5 text-amber-400">
            {[...Array(testimonial.rating || 5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
            ))}
          </div>
        </div>

        {/* 4-Line Clamped Quote with [overflow-wrap:anywhere] */}
        <p
          className={`text-xs text-[#111827] leading-relaxed italic mb-2 min-w-0 [overflow-wrap:anywhere] break-words ${
            !isExpanded ? 'line-clamp-4' : ''
          }`}
        >
          "{testimonial.content}"
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-[#F15A24] hover:underline mb-2 inline-block cursor-pointer focus:outline-none"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}

        {/* "Installed solution" mini panel */}
        <div className="bg-[#FAF7F2] rounded-xl p-2.5 my-3 border border-[#EDE8E1] flex items-center justify-between text-[11px] text-[#5B6472]">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
            <span className="font-semibold text-[#111827] truncate">
              {testimonial.company ? `${testimonial.company} Setup` : 'Turnkey Hardware Setup'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#5B6472] shrink-0">
            <MapPin className="w-3 h-3 text-[#5B6472]" />
            <span>Dhaka</span>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="pt-3 border-t border-[#EDE8E1] flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#141210] text-white flex items-center justify-center font-bold text-xs shrink-0">
          {(testimonial.clientName || 'C').charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs text-[#111827] [overflow-wrap:anywhere] break-words truncate">
            {testimonial.clientName}
          </div>
          <div className="text-[11px] text-[#5B6472] [overflow-wrap:anywhere] break-words truncate">
            {testimonial.clientRole || testimonial.company}
          </div>
        </div>
      </div>
    </div>
  );
};

// Project Case Study Card with [overflow-wrap:anywhere] and real image / neutral blueprint vector
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
      className="bg-white rounded-[20px] border border-[#EDE8E1] overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 w-full h-full"
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
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
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

  // Slider state for Testimonials
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [testimonialsPaused, setTestimonialsPaused] = useState(false);

  // Slider state for Projects
  const [projectIdx, setProjectIdx] = useState(0);
  const [projectsPaused, setProjectsPaused] = useState(false);

  // Responsive items-per-view calculation
  const [sliderItemsPerView, setSliderItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSliderItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setSliderItemsPerView(2);
      } else {
        setSliderItemsPerView(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 6s Autoplay for Testimonials Slider (with pause on hover/focus and reduced motion support)
  useEffect(() => {
    if (testimonials.length <= sliderItemsPerView || testimonialsPaused) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const maxIdx = Math.max(0, testimonials.length - sliderItemsPerView);
    const interval = setInterval(() => {
      setTestimonialIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length, sliderItemsPerView, testimonialsPaused]);

  // 6s Autoplay for Projects Slider (with pause on hover/focus and reduced motion support)
  useEffect(() => {
    if (projects.length <= sliderItemsPerView || projectsPaused) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const maxIdx = Math.max(0, projects.length - sliderItemsPerView);
    const interval = setInterval(() => {
      setProjectIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [projects.length, sliderItemsPerView, projectsPaused]);

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

    // Fetch all products to identify REAL special offers and Trending items
    productService.getProducts({ limit: 40 }).then((res) => {
      const discounted = res.items.filter(
        (p) => p.pricing.salePrice && p.pricing.regularPrice && p.pricing.salePrice < p.pricing.regularPrice
      );
      setSpecialOffers(discounted);

      // Identify trending items (products with isTrending === true)
      const trending = res.items.filter((p) => (p as any).isTrending);
      setTrendingProducts(trending);
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

  // Active Scenarios (renamed to Our Solutions)
  const scenarios: ScenarioItem[] = (settings?.scenarios && settings.scenarios.length > 0)
    ? settings.scenarios.filter((s) => s.enabled)
    : DEFAULT_SCENARIOS;

  // Helper for Scenario line icons
  const renderScenarioIcon = (iconName?: string) => {
    const className = "w-5 h-5 text-[#F15A24]";
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

  const phone = settings?.phone || '+880 1540-535150';
  const whatsappNumber = settings?.whatsappNumber || '8801540535150';
  const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20CamneX,%20I%20would%20like%20to%20inquire%20about%20a%20security%20system`;

  const configuredReassurances = settings?.reassurances
    ? (settings.reassurances as any[]).filter(r => r && r.enabled).map(r => r.label)
    : [];
  const reassuranceItems = configuredReassurances;

  // ============================================================================
  // STRICT HOMEPAGE ROW DEDUPLICATION (Special Offers claims first, then Popular, then New Arrivals, then Trending, then Category rows)
  // ============================================================================
  const displayedProductIds = new Set<string>();

  // 1. Special Offers claims first (products with genuine salePrice < regularPrice)
  const dedupSpecialOffers = specialOffers.filter((p) => {
    if (displayedProductIds.has(p.id)) return false;
    displayedProductIds.add(p.id);
    return true;
  });

  // 2. Popular Products claims next
  const dedupPopular = popularProducts.filter((p) => {
    if (displayedProductIds.has(p.id)) return false;
    displayedProductIds.add(p.id);
    return true;
  });

  // 3. New Arrivals claims next
  const dedupNewArrivals = newArrivals.filter((p) => {
    if (displayedProductIds.has(p.id)) return false;
    displayedProductIds.add(p.id);
    return true;
  });

  // 4. Trending row claims next (products with isTrending === true)
  const dedupTrending = trendingProducts.filter((p) => {
    if (displayedProductIds.has(p.id)) return false;
    displayedProductIds.add(p.id);
    return true;
  });

  // 5. Category rows claim next
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

  // Derive 7 categories for the 8-tile grid
  const topCategories = categories.slice(0, 7);

  // Category tag lookup helper
  const getCategoryTag = (slug: string) => {
    if (slug.includes('cctv') || slug.includes('camera')) return 'SURVEILLANCE';
    if (slug.includes('recorders') || slug.includes('dvr') || slug.includes('nvr')) return 'RECORDING';
    if (slug.includes('access') || slug.includes('biometric')) return 'ACCESS CONTROL';
    if (slug.includes('switch') || slug.includes('network')) return 'NETWORKING';
    if (slug.includes('wifi') || slug.includes('access-points')) return 'WI-FI 6';
    if (slug.includes('hard-drive') || slug.includes('storage')) return 'STORAGE';
    return 'HARDWARE';
  };

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

      {/* 2. SHOP BY CATEGORY (Definitive Section: Reference b cards, 4 cols desktop, 3 tablet, 2 mobile, 8 tiles total) */}
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

          {/* 8-Tile Grid (7 categories + 1 'All categories' tile = 2 full rows on desktop) */}
          <div className={topCategories.length < 7 ? "flex flex-wrap justify-center gap-4 sm:gap-5" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"}>
            {topCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('category', cat.slug)}
                className={`bg-gradient-to-br from-white via-white to-[#F7F3EE] rounded-[16px] border border-[#EDE8E1] p-4 sm:p-5 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex justify-between relative overflow-hidden min-h-[155px] h-[160px] min-w-0 ${
                  topCategories.length < 7 ? 'w-full max-w-[280px]' : ''
                }`}
              >
                {/* Left Side: Tag chip, 18px bold title (max 2 lines), 1-line description (max 60 chars), Explore link */}
                <div className="flex-1 min-w-0 pr-2 flex flex-col justify-between z-10">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#F15A24] bg-orange-50 px-2 py-0.5 rounded-full inline-block mb-1 truncate max-w-full">
                      {getCategoryTag(cat.slug)}
                    </span>
                    <h3 className="font-heading font-bold text-base sm:text-[17px] text-[#111827] group-hover:text-[#F15A24] transition-colors leading-snug line-clamp-2 min-w-0 [overflow-wrap:anywhere] break-words">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-[#5B6472] leading-tight line-clamp-1 mt-0.5 min-w-0 [overflow-wrap:anywhere] break-words">
                      {cat.description || 'Hardware & accessories'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#F15A24] pt-1">
                    <span>Explore Category</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Right Side: Transparent PNG product image (about 40% width, contained, bottom-right, NO white box) */}
                <div className="w-[38%] sm:w-[40%] flex items-end justify-end pointer-events-none self-end h-full">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="max-h-[90%] max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <CategorySvgFallback />
                  )}
                </div>
              </div>
            ))}

            {/* 8th Tile: 'All Categories' */}
            <div
              onClick={() => onNavigate('catalog')}
              className={`bg-gradient-to-br from-white via-white to-[#F7F3EE] rounded-[16px] border border-[#EDE8E1] p-4 sm:p-5 hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex justify-between relative overflow-hidden min-h-[155px] h-[160px] min-w-0 ${
                topCategories.length < 7 ? 'w-full max-w-[280px]' : ''
              }`}
            >
              <div className="flex-1 min-w-0 pr-2 flex flex-col justify-between z-10">
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#F15A24] bg-orange-50 px-2 py-0.5 rounded-full inline-block mb-1">
                    CATALOG
                  </span>
                  <h3 className="font-heading font-bold text-base sm:text-[17px] text-[#111827] group-hover:text-[#F15A24] transition-colors leading-snug line-clamp-2">
                    All Categories
                  </h3>
                  <p className="text-[11px] text-[#5B6472] leading-tight line-clamp-1 mt-0.5">
                    Browse our full hardware catalog
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-[#F15A24] pt-1">
                  <span>View All Items</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="w-[38%] sm:w-[40%] flex items-center justify-center self-center h-full text-orange-200 group-hover:text-[#F15A24] transition-colors">
                <Layers className="w-12 h-12 stroke-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR PRODUCTS (Definitive Deduplicated Row on Canvas #FAF7F2) */}
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

      {/* 4. SPECIAL OFFERS (With 1 item: show wide highlighted card; with > 1: show grid) */}
      {dedupSpecialOffers.length === 1 && (
        <section className="w-full bg-gradient-to-r from-[#FFF1E8] via-[#FFEADB] to-[#FFE0CC] py-10 md:py-14 border-y border-orange-200/60">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Special Deal"
              title="Special Offer"
              subtitle="Promotional pricing on security hardware"
              actionText="View catalog"
              onAction={() => onNavigate('catalog')}
              className="mb-6"
            />
            {(() => {
              const p = dedupSpecialOffers[0];
              const discountPct = p.pricing.regularPrice && p.pricing.salePrice
                ? Math.round(((p.pricing.regularPrice - p.pricing.salePrice) / p.pricing.regularPrice) * 100)
                : 0;
              const savings = (p.pricing.regularPrice || 0) - (p.pricing.salePrice || 0);

              return (
                <div className="bg-white rounded-[24px] border border-orange-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                        -{discountPct}% OFF
                      </span>
                      <span className="text-xs font-bold text-[#5B6472] uppercase">
                        {p.brand}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#5B6472]">
                      {p.model}
                    </div>
                    <h3
                      onClick={() => onNavigate('product', p.id)}
                      className="text-xl sm:text-2xl font-black font-heading text-[#111827] hover:text-[#F15A24] cursor-pointer transition-colors"
                    >
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#5B6472] max-w-xl line-clamp-2">
                      {p.shortDescription || p.description}
                    </p>
                    <div className="flex items-baseline gap-3 pt-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
                        ৳{p.pricing.salePrice?.toLocaleString()}
                      </span>
                      <span className="text-sm text-[#5B6472] line-through">
                        ৳{p.pricing.regularPrice?.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Save ৳{savings.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => addItem(p, 1)}
                        className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('product', p.id)}
                        className="min-h-[44px] px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#111827] text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <span>View details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div
                    onClick={() => onNavigate('product', p.id)}
                    className="w-full md:w-80 h-56 bg-gradient-to-b from-[#FFF8F4] to-[#F4EEE6] rounded-2xl flex items-center justify-center p-4 cursor-pointer overflow-hidden shrink-0"
                  >
                    <img
                      src={p.images?.[0] || '/images/hero/hikvision-bullet.jpg'}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {dedupSpecialOffers.length > 1 && (
        <section className="w-full bg-gradient-to-r from-[#FFF1E8] via-[#FFEADB] to-[#FFE0CC] py-12 md:py-[72px] border-y border-orange-200/60">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Special Deals"
              title="Special Offers"
              subtitle="Promotional pricing on security and networking equipment"
              actionText={`View all deals (${dedupSpecialOffers.length})`}
              onAction={() => onNavigate('catalog')}
              className="mb-8"
            />

            <div className={dedupSpecialOffers.length === 2 ? "flex flex-wrap justify-center gap-5 pt-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2"}>
              {dedupSpecialOffers.slice(0, 4).map((p) => {
                const discountPct = p.pricing.regularPrice && p.pricing.salePrice
                  ? Math.round(((p.pricing.regularPrice - p.pricing.salePrice) / p.pricing.regularPrice) * 100)
                  : 0;
                const savings = (p.pricing.regularPrice || 0) - (p.pricing.salePrice || 0);

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-[20px] border border-orange-200/80 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group min-w-0 ${
                      dedupSpecialOffers.length === 2 ? 'w-full max-w-[320px]' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                          -{discountPct}% OFF
                        </span>
                        <span className="text-[10px] font-bold text-[#5B6472] uppercase truncate">
                          {p.brand}
                        </span>
                      </div>

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

                      <div className="text-[11px] font-mono font-medium text-[#5B6472] mb-1 line-clamp-1 [overflow-wrap:anywhere] break-words">
                        {p.model}
                      </div>

                      <h3
                        onClick={() => onNavigate('product', p.id)}
                        className="font-heading font-bold text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors mb-2 line-clamp-2 cursor-pointer [overflow-wrap:anywhere] break-words"
                      >
                        {p.name}
                      </h3>
                    </div>

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

      {/* 5. NEW ARRIVALS (Definitive Deduplicated Row on White #FFFFFF) */}
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

      {/* 6. QUICK SERVICE REQUEST (Dark Band #141210) */}
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
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

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

                  {callbackStatus === 'error' && (
                    <div className="text-xs text-rose-400 font-medium">
                      {callbackMessage}
                    </div>
                  )}

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

      {/* 7. OUR SOLUTIONS (Renamed from Shop by Scenario, Compact soft band 48-56px padding, 6 tiles across desktop, ~120px tall, neutral one-liners) */}
      {scenarios.length > 0 && (
        <section className="w-full bg-[#F4EEE6] py-12 md:py-14 border-y border-[#EDE8E1]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Solutions"
              title="Our Solutions"
              subtitle="Turnkey surveillance and networking setups engineered for specific deployment environments"
              centered
              className="mb-8"
            />

            {/* 6 Tiles Across Desktop (3x2 tablet, 2 mobile), ~120px tall */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {scenarios.slice(0, 6).map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => onNavigate('solutions', scenario.slug)}
                  className="bg-white rounded-[16px] border border-[#EDE8E1] p-3.5 hover:shadow-md hover:border-orange-300 transition-all duration-300 cursor-pointer group flex flex-col justify-between min-w-0 h-[120px]"
                >
                  <div className="min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F15A24] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      {renderScenarioIcon(scenario.iconName)}
                    </div>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors line-clamp-1 min-w-0 [overflow-wrap:anywhere] break-words">
                      {scenario.title}
                    </h3>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-[#5B6472] line-clamp-2 leading-tight min-w-0 [overflow-wrap:anywhere] break-words">
                    {scenario.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. CCTV PACKAGE SELECTOR (Show when packages >= 1, hide filter chips if < 3 packages) */}
      {displayPackages.length >= 1 && (
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

            {/* Filter chips shown ONLY if packages >= 3 */}
            {packages.length >= 3 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
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
            )}

            {/* Package Cards Grid (centered if < 3 items) */}
            <div className={displayPackages.length < 3 ? "flex flex-wrap justify-center gap-5" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"}>
              {displayPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-[20px] border border-[#EDE8E1] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xl transition-all h-full group ${
                    displayPackages.length < 3 ? 'w-full max-w-[360px]' : ''
                  }`}
                >
                  <div>
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

                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F15A24] px-2.5 py-0.5 rounded-full">
                        {pkg.badge || 'Complete Kit'}
                      </span>
                      <span className="text-[11px] font-bold text-[#5B6472]">
                        Hardware Kit
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#111827] mb-2 leading-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-[#5B6472] leading-relaxed mb-4">
                      {pkg.description}
                    </p>

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

      {/* 9. TRENDING HARDWARE (Admin flag isTrending, row hidden if nothing flagged) */}
      {dedupTrending.length > 0 && (
        <ProductRow
          eyebrow="Market Popularity"
          title="Trending Hardware"
          subtitle="Top selected security and networking equipment this season"
          products={dedupTrending}
          actionText={`View all (${dedupTrending.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="panel"
        />
      )}

      {/* 10. CATEGORY PRODUCT ROWS (Alternating White & Canvas) */}
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

      {/* 11. TESTIMONIALS SLIDER (3 desktop, 2 tablet, 1 mobile; 6s autoplay with pause on hover/focus/drag; static centered if <= 3 items) */}
      {testimonials.length > 0 ? (
        <section
          className="w-full bg-[#FAF7F2] py-12 md:py-[72px]"
          onMouseEnter={() => setTestimonialsPaused(true)}
          onMouseLeave={() => setTestimonialsPaused(false)}
          onFocusCapture={() => setTestimonialsPaused(true)}
          onBlurCapture={() => setTestimonialsPaused(false)}
          onTouchStart={() => setTestimonialsPaused(true)}
          onTouchEnd={() => setTestimonialsPaused(false)}
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block mb-1">
                  Client Experiences
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                  Client Feedback
                </h2>
                <p className="text-xs sm:text-sm text-[#5B6472] mt-1">
                  Feedback from commercial and residential project clients
                </p>
              </div>

              {testimonials.length > sliderItemsPerView && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const maxIdx = Math.max(0, testimonials.length - sliderItemsPerView);
                      setTestimonialIdx((prev) => (prev <= 0 ? maxIdx : prev - 1));
                    }}
                    className="w-9 h-9 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:text-[#F15A24] bg-white text-[#111827] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    aria-label="Previous testimonials"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const maxIdx = Math.max(0, testimonials.length - sliderItemsPerView);
                      setTestimonialIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
                    }}
                    className="w-9 h-9 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:text-[#F15A24] bg-white text-[#111827] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    aria-label="Next testimonials"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {testimonials.length <= sliderItemsPerView ? (
              <div className="flex flex-wrap justify-center gap-6">
                {testimonials.map((t) => (
                  <div key={t.id} className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] max-w-[380px] min-w-0 flex">
                    <TestimonialCard testimonial={t} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${testimonialIdx * (100 / sliderItemsPerView)}%)`
                  }}
                >
                  {testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="px-2.5 shrink-0 min-w-0 flex"
                      style={{ width: `${100 / sliderItemsPerView}%` }}
                    >
                      <TestimonialCard testimonial={t} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-6">
                  {Array.from({ length: Math.max(1, testimonials.length - sliderItemsPerView + 1) }).map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setTestimonialIdx(dotIdx)}
                      className={`h-2 rounded-full transition-all ${
                        testimonialIdx === dotIdx ? 'w-6 bg-[#F15A24]' : 'w-2 bg-[#EDE8E1] hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
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

      {/* 12. PROJECTS SLIDER (3 desktop, 2 tablet, 1 mobile; 6s autoplay; static centered if <= 3 items) */}
      {projects.length > 0 ? (
        <section
          className="w-full bg-white py-12 md:py-[72px] border-y border-[#EDE8E1]"
          onMouseEnter={() => setProjectsPaused(true)}
          onMouseLeave={() => setProjectsPaused(false)}
          onFocusCapture={() => setProjectsPaused(true)}
          onBlurCapture={() => setProjectsPaused(false)}
          onTouchStart={() => setProjectsPaused(true)}
          onTouchEnd={() => setProjectsPaused(false)}
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block mb-1">
                  Case Studies
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                  Recent Installation Projects
                </h2>
                <p className="text-xs sm:text-sm text-[#5B6472] mt-1">
                  Commercial surveillance, factory Wi-Fi, and corporate biometric deployments
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#F15A24] hover:text-[#D94D1C]"
                >
                  <span>View all projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {projects.length > sliderItemsPerView && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const maxIdx = Math.max(0, projects.length - sliderItemsPerView);
                        setProjectIdx((prev) => (prev <= 0 ? maxIdx : prev - 1));
                      }}
                      className="w-9 h-9 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:text-[#F15A24] bg-white text-[#111827] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      aria-label="Previous projects"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const maxIdx = Math.max(0, projects.length - sliderItemsPerView);
                        setProjectIdx((prev) => (prev >= maxIdx ? 0 : prev + 1));
                      }}
                      className="w-9 h-9 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:text-[#F15A24] bg-white text-[#111827] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      aria-label="Next projects"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {projects.length <= sliderItemsPerView ? (
              <div className="flex flex-wrap justify-center gap-6">
                {projects.map((p) => (
                  <div key={p.id} className="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] max-w-[380px] min-w-0 flex">
                    <ProjectCard project={p} onNavigate={onNavigate} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${projectIdx * (100 / sliderItemsPerView)}%)`
                  }}
                >
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="px-2.5 shrink-0 min-w-0 flex"
                      style={{ width: `${100 / sliderItemsPerView}%` }}
                    >
                      <ProjectCard project={p} onNavigate={onNavigate} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 pt-6">
                  {Array.from({ length: Math.max(1, projects.length - sliderItemsPerView + 1) }).map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setProjectIdx(dotIdx)}
                      className={`h-2 rounded-full transition-all ${
                        projectIdx === dotIdx ? 'w-6 bg-[#F15A24]' : 'w-2 bg-[#EDE8E1] hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
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

      {/* 13. FINAL CTA BAND (Full-Width Brand Orange Band Touching Footer With Zero Gap, 3 White Clickable Cards) */}
      <section id="site-cta" className="w-full bg-gradient-to-br from-[#F15A24] via-[#ea5019] to-[#D94D1C] text-white py-12 md:py-[72px] m-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Engineering & Security Assistance</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
              Need a customized security or network setup?
            </h2>

            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Our engineering team provides technical consultations and hardware quotations in Dhaka.
            </p>
          </div>

          {/* 3 White Clickable Cards (WhatsApp, Call, Book Site Visit) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto pt-2">
            {/* 1. WhatsApp Card */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#111827] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between group cursor-pointer w-full"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#25D366] flex items-center justify-center mb-4 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold font-heading text-lg text-[#111827]">Chat on WhatsApp</h3>
                  <ArrowRight className="w-4 h-4 text-[#F15A24] transform group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs sm:text-sm text-[#5B6472] mt-1.5 leading-snug">
                  Direct engineering consultation and quotation inquiries
                </p>
              </div>
            </a>

            {/* 2. Call Card */}
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="bg-white text-[#111827] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between group cursor-pointer w-full"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center mb-4 group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold font-heading text-lg text-[#111827]">Call {phone}</h3>
                  <ArrowRight className="w-4 h-4 text-[#F15A24] transform group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs sm:text-sm text-[#5B6472] mt-1.5 leading-snug">
                  Speak directly with our technical support and sales team
                </p>
              </div>
            </a>

            {/* 3. Book Site Visit Card */}
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="bg-white text-[#111827] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between group cursor-pointer w-full"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center mb-4 group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold font-heading text-lg text-[#111827]">Book Site Visit</h3>
                  <ArrowRight className="w-4 h-4 text-[#F15A24] transform group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs sm:text-sm text-[#5B6472] mt-1.5 leading-snug">
                  Schedule an on-site evaluation for your premises
                </p>
              </div>
            </button>
          </div>

          {/* Reassurance Row Below (rendered ONLY if admin typed items) */}
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
