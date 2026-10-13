import React, { useState, useEffect, useMemo } from 'react';
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
  Flame,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { SectionHeader } from '../components/common/SectionHeader';
import { ProductRow } from '../components/common/ProductRow';
import { HeroSlider } from '../components/HeroSlider';
import { SpecialOfferSlider } from '../components/SpecialOfferSlider';
import { CategoryGrid } from '../components/CategoryGrid';
import { CardGrid } from '../components/cards/CardGrid';
import { CardRow } from '../components/cards/CardRow';
import { PackageCard } from '../components/cards/PackageCard';
import { PackageFilterBar } from '../components/packages/PackageFilterBar';
import { Term } from '../components/common/Term';
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
  PackageSeries,
  PackageSystemType,
  ServiceOffering,
  Testimonial,
  ProjectCaseStudy,
  ScenarioItem
} from '../types';
import {
  filterPackages,
  calculateBadgeCounts,
  resolveDependentFilterSelection,
  getFilterConflictState,
  buildFilterQuery,
  parseFilterQuery,
  slugifyFilter,
  normalizeCameraCount,
  getAvailableCameraCounts,
  getPackageSystemSlug
} from '../utils/packageFilters';
import { SmartImage, ImagePlaceholder } from '../components/common/ImagePlaceholder';
import { IconTile } from '../components/common/IconTile';
import { useSettingsStore, useAdminAuthStore, useCartStore } from '../store';
import { DEFAULT_SCENARIOS } from '../services/seedData';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

// Distinct Crisp Vector SVG Fallbacks for CCTV Package kits by series type
const CctvPackageSvg: React.FC<{ pkg: SecurityPackage }> = ({ pkg }) => {
  const name = (pkg.name || '').toLowerCase();
  const desc = (pkg.description || '').toLowerCase();
  const series = (pkg.seriesName || '').toLowerCase();
  const isWireless = series.includes('wireless') || name.includes('wireless') || name.includes('wi-fi') || desc.includes('wireless');
  const isColor = series.includes('full-color') || series.includes('color') || name.includes('color') || desc.includes('color');
  const isHybrid = series.includes('hybrid') || name.includes('hybrid') || desc.includes('hybrid');
  const isEnterprise = (pkg.cameraCount && pkg.cameraCount >= 16) || series.includes('enterprise') || series.includes('ptz') || name.includes('enterprise') || name.includes('ptz');

  if (isWireless) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#F0FDF4] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Wireless CCTV Kit">
          <rect x="70" y="40" width="60" height="55" rx="12" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2" />
          <circle cx="100" cy="65" r="15" fill="#0F172A" />
          <circle cx="100" cy="65" r="7" fill="#3B82F6" />
          <circle cx="103" cy="62" r="2.5" fill="#FFFFFF" />
          <line x1="120" y1="40" x2="135" y2="15" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="137" cy="12" r="3" fill="#16A34A" />
          <path d="M142 8 A 8 8 0 0 1 148 18" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M147 4 A 14 14 0 0 1 155 20" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="25" y="70" width="28" height="24" rx="4" fill="#334155" />
          <line x1="28" y1="94" x2="28" y2="102" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="94" x2="34" y2="102" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          <path d="M53 82 C60 82 62 80 70 80" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
          <rect x="150" y="72" width="22" height="26" rx="3" fill="#0F172A" stroke="#22C55E" strokeWidth="1.5" />
          <text x="154" y="88" fill="#22C55E" fontSize="7" fontWeight="bold">SD</text>
        </svg>
      </div>
    );
  }

  if (isHybrid) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#FFFBEB] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Smart Hybrid Light CCTV Kit">
          <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
          <rect x="35" y="74" width="32" height="4" rx="2" fill="#F59E0B" />
          <circle cx="155" cy="84" r="3" fill="#22C55E" />
          <circle cx="165" cy="84" r="3" fill="#3B82F6" />
          <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
          <circle cx="145" cy="40" r="22" stroke="#F59E0B" strokeWidth="3" fill="none" />
          <circle cx="145" cy="40" r="16" stroke="#EF4444" strokeWidth="3" strokeDasharray="4 3" fill="none" />
          <circle cx="145" cy="40" r="8" fill="#FEF3C7" />
          <rect x="42" y="22" width="55" height="26" rx="4" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
          <path d="M97 26 L118 18 L118 52 L97 44 Z" fill="#B45309" />
          <circle cx="52" cy="35" r="7" fill="#0F172A" />
          <circle cx="52" cy="35" r="3" fill="#F59E0B" />
          <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
          <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
        </svg>
      </div>
    );
  }

  if (isColor) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#FFF8F4] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ColorVu CCTV Kit">
          <rect x="25" y="65" width="150" height="38" rx="6" fill="#1E293B" />
          <rect x="35" y="74" width="32" height="4" rx="2" fill="#F15A24" />
          <circle cx="155" cy="84" r="3" fill="#22C55E" />
          <circle cx="165" cy="84" r="3" fill="#3B82F6" />
          <line x1="30" y1="92" x2="170" y2="92" stroke="#334155" strokeWidth="1" />
          <circle cx="145" cy="40" r="22" stroke="#F15A24" strokeWidth="4" strokeDasharray="4 4" fill="none" />
          <circle cx="145" cy="40" r="10" fill="#FED7AA" />
          <rect x="42" y="22" width="55" height="26" rx="4" fill="#FFFFFF" stroke="#F97316" strokeWidth="1.5" />
          <path d="M97 26 L118 18 L118 52 L97 44 Z" fill="#EA580C" />
          <circle cx="52" cy="35" r="7" fill="#0F172A" />
          <circle cx="52" cy="35" r="3" fill="#FBBF24" />
          <rect x="65" y="48" width="8" height="18" fill="#94A3B8" />
          <rect x="58" y="64" width="22" height="4" rx="2" fill="#64748B" />
        </svg>
      </div>
    );
  }

  if (isEnterprise) {
    return (
      <div className="w-full h-36 sm:h-44 bg-[#F1F5F9] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Enterprise CCTV Kit">
          <rect x="18" y="58" width="164" height="48" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <rect x="28" y="68" width="45" height="5" rx="2" fill="#3B82F6" />
          <circle cx="148" cy="82" r="3" fill="#22C55E" />
          <circle cx="158" cy="82" r="3" fill="#22C55E" />
          <circle cx="168" cy="82" r="3" fill="#38BDF8" />
          <line x1="24" y1="94" x2="176" y2="94" stroke="#1E293B" strokeWidth="1.5" />
          <path d="M40 38 A 20 20 0 0 1 80 38 Z" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          <circle cx="60" cy="38" r="8" fill="#0F172A" />
          <circle cx="60" cy="38" r="3" fill="#38BDF8" />
          <rect x="110" y="20" width="42" height="22" rx="4" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
          <path d="M152 24 L169 18 L169 44 L152 38 Z" fill="#475569" />
          <circle cx="119" cy="31" r="5" fill="#0F172A" />
        </svg>
      </div>
    );
  }

  // Standard Infrared Night Vision Bullet Kit
  return (
    <div className="w-full h-36 sm:h-44 bg-[#F4EEE6] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
      <svg viewBox="0 0 200 120" className="w-full h-full max-h-36 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Night Vision CCTV Kit">
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
};

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
          <IconTile size="md" rounded="rounded-xl">
            <Quote className="w-4 h-4 fill-current stroke-none" />
          </IconTile>
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

        {/* Optional "Installed solution" mini panel - only if company or solution provided, never fallback strings */}
        {Boolean(testimonial.company || (testimonial as any).solution) && (
          <div className="bg-[#FAF7F2] rounded-xl p-2.5 my-3 border border-[#EDE8E1] flex items-center justify-between text-[11px] text-[#5B6472]">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
              <span className="font-semibold text-[#111827] truncate">
                {testimonial.company ? `${testimonial.company} Setup` : (testimonial as any).solution}
              </span>
            </div>
            {(testimonial as any).city && (
              <div className="flex items-center gap-1 text-[10px] text-[#5B6472] shrink-0">
                <MapPin className="w-3 h-3 text-[#5B6472]" />
                <span>{(testimonial as any).city}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Info: icon circle for avatar, author and role show beside avatar when entered */}
      <div className="pt-3 border-t border-[#EDE8E1] flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          {(testimonial.clientName || 'S').charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          {testimonial.clientName && (
            <div className="font-bold text-xs text-[#111827] [overflow-wrap:anywhere] break-words truncate">
              {testimonial.clientName}
            </div>
          )}
          {(testimonial.clientRole || testimonial.company) && (
            <div className="text-[11px] text-[#5B6472] [overflow-wrap:anywhere] break-words truncate">
              {testimonial.clientRole || testimonial.company}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Case Study Card with [overflow-wrap:anywhere] and real image / neutral vector
const ProjectCard: React.FC<{
  project: ProjectCaseStudy;
  onNavigate: (route: string, param?: string) => void;
}> = ({ project, onNavigate }) => {
  return (
    <div
      onClick={() => onNavigate('projects')}
      className="bg-white rounded-[20px] border border-[#EDE8E1] overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-w-0 w-full h-full"
    >
      <div className="h-44 bg-slate-100 overflow-hidden relative min-w-0 flex items-center justify-center">
        {project.image ? (
          <SmartImage
            src={project.image}
            alt={project.title}
            fallbackType="generic"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ImagePlaceholder type="generic" className="w-full h-full" />
        )}
        {project.category && (
          <span className="absolute top-3 left-3 bg-[#0F172A]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
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
  const [wifiProducts, setWifiProducts] = useState<Product[]>([]);
  const [accessoryProducts, setAccessoryProducts] = useState<Product[]>([]);
  const [categoryRowProducts, setCategoryRowProducts] = useState<{ [catId: string]: Product[] }>({});
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [packageSeriesList, setPackageSeriesList] = useState<PackageSeries[]>([]);
  const [packageSystemTypes, setPackageSystemTypes] = useState<PackageSystemType[]>([]);
  const [serviceOfferings, setServiceOfferings] = useState<ServiceOffering[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);

  // Package filters: System type (IP, Analogue, Wireless), Camera count, and Night view series
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [packageCountFilter, setPackageCountFilter] = useState<string>('All');
  const [nightViewFilter, setNightViewFilter] = useState<string>('all');

  // Quick Service Request callback state (fully dynamic & two-way synced)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-cctv');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('CCTV Camera Setup');
  const [customServiceText, setCustomServiceText] = useState<string>('');
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

    // Expose test hook for headless testing and verification
    (window as any).__setHomepageCategoriesForTest = (testCats: Category[]) => {
      setCategories(testCats);
    };

    // Fetch categories
    categoryService.getCategories().then((allCats) => {
      const initialCats = (window as any).__CAMNEX_TEST_CATEGORIES || allCats;
      setCategories(initialCats);

      // Fetch products for categories configured to show on homepage or as category row
      const homepageCats = allCats.filter((c) => c.showOnHomepage || c.showAsHomepageRow);
      homepageCats.forEach((cat) => {
        productService.getProducts({ category: cat.slug, limit: 8 }).then((res) => {
          setCategoryRowProducts((prev) => ({
            ...prev,
            [cat.id]: res.items
          }));
        });
      });

      // Target accessory categories (flagged isAccessoryCategory or matching slug/name)
      const accessoryCats = allCats.filter((c) => c.isAccessoryCategory);
      const targetAccessoryCats = accessoryCats.length > 0
        ? accessoryCats
        : allCats.filter((c) => {
            const s = (c.slug + ' ' + c.name).toLowerCase();
            return s.includes('cable') || s.includes('accessor') || s.includes('storage') || s.includes('power') || s.includes('connector');
          });

      const accessoryCatSlugs = new Set(targetAccessoryCats.map((c) => c.slug.toLowerCase()));
      const accessoryCatIds = new Set(targetAccessoryCats.map((c) => c.id));

      // Fetch all products to identify REAL special offers, Wi-Fi cameras, and Accessories & Add-ons
      productService.getProducts({ limit: 50 }).then((res) => {
        const discounted = res.items.filter(
          (p) => p.status === 'active' && p.websiteVisible !== false && p.pricing.salePrice && p.pricing.regularPrice && p.pricing.salePrice < p.pricing.regularPrice
        );
        setSpecialOffers(discounted);

        // Filter Wi-Fi / Wireless camera products strictly by category id (cat-wifi and subcategories), never matching strings in names
        const wifiCategoryIds = new Set<string>(['cat-wifi']);
        allCats.forEach((c) => {
          if (c.id === 'cat-wifi' || c.parentId === 'cat-wifi') {
            wifiCategoryIds.add(c.id);
            if (Array.isArray(c.subcategories)) {
              c.subcategories.forEach((sc: any) => { if (sc?.id) wifiCategoryIds.add(sc.id); });
            }
          }
        });
        const wifi = res.items.filter((p) => {
          if (p.status !== 'active' || p.websiteVisible === false) return false;
          return wifiCategoryIds.has(p.categoryId) || (p as any).categorySlug === 'wifi-cameras';
        });
        setWifiProducts(wifi);

        // Identify accessories items
        const accessories = res.items.filter((p) => {
          if (p.status !== 'active' || p.websiteVisible === false) return false;
          if (accessoryCatIds.has(p.categoryId)) return true;
          if (p.category && accessoryCatSlugs.has(p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) return true;
          const catLower = (p.category || '').toLowerCase();
          return catLower.includes('cable') || catLower.includes('accessor') || catLower.includes('storage') || catLower.includes('power');
        });
        setAccessoryProducts(accessories);
      });
    });

    // Fetch popular products
    productService.getPopularProducts(8).then(setPopularProducts);

    // Fetch new arrivals (sorted by newest)
    productService.getProducts({ sortBy: 'created_at', sortOrder: 'desc', limit: 8 }).then((res) => {
      setNewArrivals(res.items);
    });

    // Fetch packages, package series & system types
    packageService.getPackages().then(setPackages);
    packageService.getPackageSeries().then(setPackageSeriesList);
    packageService.getPackageSystemTypes().then(setPackageSystemTypes).catch(() => []);

    // Fetch dynamic service offerings for Quick Service section
    quoteService.getServiceOfferings().then((services) => {
      setServiceOfferings(services || []);
      if (services && services.length > 0) {
        setSelectedServiceId(services[0].id);
        setSelectedServiceType(services[0].title);
      }
    });

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
      const isOther = selectedServiceId === 'other';
      const serviceTypeToSubmit = isOther
        ? (customServiceText.trim() || 'Other / not listed')
        : (selectedServiceType || 'CCTV Camera Setup');

      await quoteService.createServiceRequest({
        customerName: callbackName.trim(),
        phone: callbackPhone.trim(),
        serviceId: !isOther ? selectedServiceId : undefined,
        serviceType: serviceTypeToSubmit,
        area: callbackArea.trim(),
        website: honeypot // Anti-bot honeypot field
      });

      setCallbackStatus('success');
      setCallbackMessage(
        settings?.quickServiceSettings?.successMessage ||
        'Thank you! Our team will call you back within 15 minutes.'
      );
      setCallbackName('');
      setCallbackPhone('');
      setCallbackArea('');
      setCustomServiceText('');
    } catch (err: any) {
      setCallbackStatus('error');
      setCallbackMessage(err?.message || 'Could not submit request. Please call +880 1540-535150 directly.');
    }
  };

  // Initialize filters from URL query parameters on load & on popstate
  useEffect(() => {
    try {
      const parsed = parseFilterQuery(window.location.search, {
        systemTypes: packageSystemTypes,
        seriesList: packageSeriesList
      });
      setSystemFilter(parsed.systemSlug);
      setPackageCountFilter(parsed.cameraCount);
      setNightViewFilter(parsed.nightViewSlug);
    } catch (_) {}

    const handlePopState = () => {
      try {
        const parsed = parseFilterQuery(window.location.search, {
          systemTypes: packageSystemTypes,
          seriesList: packageSeriesList
        });
        setSystemFilter(parsed.systemSlug);
        setPackageCountFilter(parsed.cameraCount);
        setNightViewFilter(parsed.nightViewSlug);
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [packageSystemTypes, packageSeriesList]);

  // Sync filters to URL and resolve dependent selections
  const updatePackageFilters = (newSys: string, newCount: string, newNightView: string) => {
    const resolved = resolveDependentFilterSelection(newSys, newCount, newNightView, packages, {
      systemTypes: packageSystemTypes,
      seriesList: packageSeriesList
    });
    setSystemFilter(resolved.systemSlug);
    setPackageCountFilter(resolved.cameraCount);
    setNightViewFilter(resolved.nightViewSlug);

    try {
      const query = buildFilterQuery(resolved);
      const newUrl = window.location.pathname + query + window.location.hash;
      window.history.pushState({}, '', newUrl);
    } catch (_) {}
  };

  // Derive dynamic camera count numbers from all packages
  const allAvailableCounts = useMemo(() => {
    return [2, 4, 8, 16, 32, 64].filter((count) => {
      return packages.some((pkg) =>
        pkg.cameraCount === count ||
        (Array.isArray(pkg.cameraCountsSupported) && pkg.cameraCountsSupported.includes(count))
      );
    });
  }, [packages]);

  // Calculate badge counts for camera counts and night view options
  const badgeCounts = useMemo(() => {
    return calculateBadgeCounts(
      packages,
      { systemSlug: systemFilter, cameraCount: packageCountFilter, nightViewSlug: nightViewFilter },
      allAvailableCounts,
      packageSeriesList,
      packageSystemTypes
    );
  }, [packages, systemFilter, packageCountFilter, nightViewFilter, allAvailableCounts, packageSeriesList, packageSystemTypes]);

  // Combined AND filtering for Packages (strict no-leak logic via pure filter function)
  const filteredPackages = useMemo(() => {
    return filterPackages(
      packages,
      { systemSlug: systemFilter, cameraCount: packageCountFilter, nightViewSlug: nightViewFilter },
      { systemTypes: packageSystemTypes, seriesList: packageSeriesList }
    );
  }, [packages, systemFilter, packageCountFilter, nightViewFilter, packageSystemTypes, packageSeriesList]);

  // Conflict state when user narrows down to 0 matching packages
  const conflictState = useMemo(() => {
    return getFilterConflictState(
      { systemSlug: systemFilter, cameraCount: packageCountFilter, nightViewSlug: nightViewFilter },
      packages,
      { systemTypes: packageSystemTypes, seriesList: packageSeriesList }
    );
  }, [systemFilter, packageCountFilter, nightViewFilter, packages, packageSystemTypes, packageSeriesList]);

  const isFilterActive = systemFilter !== 'all' || packageCountFilter !== 'All' || nightViewFilter !== 'all';

  const systemTypesOrdered = useMemo(() => {
    const orderMap: Record<string, number> = { ip: 1, analogue: 2, wireless: 3 };
    return [...packageSystemTypes].sort((a, b) => {
      const oa = orderMap[a.slug] || a.order || 99;
      const ob = orderMap[b.slug] || b.order || 99;
      return oa - ob;
    });
  }, [packageSystemTypes]);

  const displayPackages = useMemo(() => {
    if (!isFilterActive) {
      // 1. Identify enabled system types that have packages
      const activeTypes = systemTypesOrdered.filter((st) => {
        if (st.enabled === false) return false;
        return packages.some((p) => getPackageSystemSlug(p, packageSystemTypes) === st.slug);
      });

      const picked: SecurityPackage[] = [];
      const pickedIds = new Set<string>();

      // Step A: Include at least one package of each system type that has packages:
      // First one admin "Featured on homepage" package per type, then fill by tags and sort order
      for (const st of activeTypes) {
        const typePkgs = packages.filter(
          (p) => getPackageSystemSlug(p, packageSystemTypes) === st.slug && !pickedIds.has(p.id)
        );
        if (typePkgs.length === 0) continue;

        const sortedTypePkgs = [...typePkgs].sort((a, b) => {
          const fa = a.featuredOnHomepage ? 1 : 0;
          const fb = b.featuredOnHomepage ? 1 : 0;
          if (fa !== fb) return fb - fa;

          const ta = a.badge && a.badge.trim() ? 1 : 0;
          const tb = b.badge && b.badge.trim() ? 1 : 0;
          if (ta !== tb) return tb - ta;

          return (a.order || 0) - (b.order || 0);
        });

        const chosen = sortedTypePkgs[0];
        picked.push(chosen);
        pickedIds.add(chosen.id);
      }

      // Step B: Fill the remaining slots by tags and sort order (with any remaining featured packages first)
      const remaining = packages
        .filter((p) => !pickedIds.has(p.id))
        .sort((a, b) => {
          const fa = a.featuredOnHomepage ? 1 : 0;
          const fb = b.featuredOnHomepage ? 1 : 0;
          if (fa !== fb) return fb - fa;

          const ta = a.badge && a.badge.trim() ? 1 : 0;
          const tb = b.badge && b.badge.trim() ? 1 : 0;
          if (ta !== tb) return tb - ta;

          return (a.order || 0) - (b.order || 0);
        });

      return [...picked, ...remaining];
    }
    return filteredPackages;
  }, [isFilterActive, packages, packageSystemTypes, systemTypesOrdered, filteredPackages]);

  const systemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const st of packageSystemTypes) {
      counts[st.slug] = packages.filter((p) => getPackageSystemSlug(p, packageSystemTypes) === st.slug).length;
    }
    return counts;
  }, [packages, packageSystemTypes]);

  const visibleSystemTypes = useMemo(() => {
    return systemTypesOrdered.filter((st) => {
      if (st.enabled === false) return false;
      const count = systemCounts[st.slug] || 0;
      return count > 0;
    });
  }, [systemTypesOrdered, systemCounts]);

  const getNightViewOptionLabel = (series: PackageSeries) => {
    const s = series.slug.toLowerCase();
    const n = series.name.toLowerCase();
    if (s === 'series-ir' || s.includes('ir') || n.includes('night vision') || n.includes('infrared') || n.includes('black and white')) {
      return 'Black and white';
    }
    if (s === 'series-hybrid' || n.includes('hybrid')) {
      return 'Hybrid light';
    }
    if (s === 'series-color' || n.includes('color')) {
      return 'Full color';
    }
    return series.name;
  };

  const getSystemTypeLabel = (st: PackageSystemType) => {
    if (st.shortLabel && st.shortLabel.trim()) return st.shortLabel.trim();
    const s = st.slug.toLowerCase();
    if (s.includes('ip')) return 'IP';
    if (s.includes('analogue')) return 'Analogue';
    if (s.includes('wireless') || s.includes('wifi')) return 'Wi-Fi';
    return st.name.split('/')[0].trim();
  };

  const getSystemTypeIcon = (st: PackageSystemType) => {
    const s = st.slug.toLowerCase();
    if (s.includes('ip')) return <Cpu className="w-3.5 h-3.5 shrink-0" />;
    if (s.includes('wireless') || s.includes('wifi')) return <Wifi className="w-3.5 h-3.5 shrink-0" />;
    return <Camera className="w-3.5 h-3.5 shrink-0" />;
  };

  const systemSegments = useMemo(() => {
    const allSeg = {
      id: 'all',
      slug: 'all',
      label: 'All',
      icon: <Layers className="w-3.5 h-3.5 shrink-0" />,
      count: packages.length,
      description: settings?.allSystemTypeDescription || 'Camera sets for homes, shops and offices'
    };
    const typeSegs = visibleSystemTypes.map((st) => ({
      id: st.id,
      slug: st.slug,
      label: getSystemTypeLabel(st),
      icon: getSystemTypeIcon(st),
      count: systemCounts[st.slug] || 0,
      description: st.description || ''
    }));
    return [allSeg, ...typeSegs];
  }, [visibleSystemTypes, packages.length, systemCounts, settings]);

  const selectedSystemDescription = useMemo(() => {
    if (systemFilter === 'all') {
      return settings?.allSystemTypeDescription || 'Camera sets for homes, shops and offices';
    }
    const matched = packageSystemTypes.find((s) => s.slug === systemFilter);
    return matched?.description || '';
  }, [systemFilter, packageSystemTypes, settings]);

  // Active Scenarios (renamed to Our Solutions)
  const scenarios: ScenarioItem[] = (settings?.scenarios && settings.scenarios.length > 0)
    ? settings.scenarios.filter((s) => s.enabled)
    : DEFAULT_SCENARIOS;

  // Helper for Scenario line icons
  const renderScenarioIcon = (iconName?: string) => {
    const className = "w-5 h-5 stroke-current fill-none";
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
  // STRICT HOMEPAGE ROW DEDUPLICATION (Special Offers -> Wi-Fi Cameras -> Popular -> New Arrivals -> Accessories -> Category rows)
  // ============================================================================
  const displayedProductIds = new Set<string>();

  // 1. Special Offers claims first (products with genuine salePrice < regularPrice, up to maxOffers)
  const maxSpecialOffers = Math.max(1, settings?.specialOfferSlider?.maxOffers ?? 5);
  const dedupSpecialOffers = specialOffers
    .filter((p) => !displayedProductIds.has(p.id))
    .slice(0, maxSpecialOffers);
  dedupSpecialOffers.forEach((p) => displayedProductIds.add(p.id));

  // 2. Wi-Fi Series claims next (up to 8 cards; hidden if < 2)
  const wifiCategory = categories.find((c) => c.id === 'cat-wifi' || c.slug === 'wifi-smart-devices' || c.slug === 'wifi-cameras');
  const dedupWifi = wifiProducts
    .filter((p) => !displayedProductIds.has(p.id))
    .slice(0, 8);
  if (dedupWifi.length >= 2) {
    dedupWifi.forEach((p) => displayedProductIds.add(p.id));
  }

  // 3. Popular Products claims next (at least 4 cards per row)
  const dedupPopular = popularProducts
    .filter((p) => !displayedProductIds.has(p.id))
    .slice(0, 4);
  dedupPopular.forEach((p) => displayedProductIds.add(p.id));

  // 4. New Arrivals claims next (at least 4 cards per row)
  const dedupNewArrivals = newArrivals
    .filter((p) => !displayedProductIds.has(p.id))
    .slice(0, 4);
  dedupNewArrivals.forEach((p) => displayedProductIds.add(p.id));

  // 5. Accessories & Add-ons row claims next (categories with isAccessoryCategory, up to 8 cards)
  const dedupAccessories = accessoryProducts
    .filter((p) => !displayedProductIds.has(p.id))
    .slice(0, 8);
  dedupAccessories.forEach((p) => displayedProductIds.add(p.id));

  // 6. Category rows claim next (show if >= 2 cards, hide only if < 2)
  const dedupCategoryRows = categories
    .filter((cat) => (cat.showAsHomepageRow || cat.showOnHomepage) && categoryRowProducts[cat.id]?.length > 0)
    .map((cat) => {
      const items = (categoryRowProducts[cat.id] || []).filter((p) => {
        if (displayedProductIds.has(p.id)) return false;
        displayedProductIds.add(p.id);
        return true;
      });
      return { cat, items };
    })
    .filter((row) => row.items.length >= 2);

  return (
    <div className="bg-[#FAF7F2] text-[#111827] min-h-screen">
      <SEO
        title="CamneX Bangladesh | Security Systems & CCTV Cameras in Dhaka"
        description="Official security systems and CCTV cameras in Bangladesh. Genuine cameras, video recorders, switches, and attendance systems with Dhaka warranty."
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
            eyebrow="Categories"
            title="Shop by Category"
            subtitle="Cameras, recorders, attendance systems, and network gear"
            actionText="All categories"
            onAction={() => onNavigate('catalog')}
            className="mb-8"
          />

          {/* Adaptive Category Grid (Row-fill algorithm, full width alignment) */}
          <CategoryGrid categories={categories} onNavigate={onNavigate} />
        </div>
      </section>

      {/* 3. POPULAR PRODUCTS (Definitive Deduplicated Row: show if >= 2 cards, hide only if < 2) */}
      {dedupPopular.length >= 2 && (
        <ProductRow
          eyebrow="Popular"
          title="Popular Products"
          subtitle="Security cameras, video recorders, and attendance systems"
          products={dedupPopular}
          actionText={`View all (${dedupPopular.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="canvas"
        />
      )}

      {/* 4. SPECIAL OFFERS (Auto-sliding single card with smooth transition & admin controls) */}
      <SpecialOfferSlider
        offers={dedupSpecialOffers}
        onNavigate={onNavigate}
        onAddToCart={(p) => addItem(p, 1)}
        sliderConfig={settings?.specialOfferSlider}
      />

      {/* 4.5. WI-FI / WIRELESS CAMERAS (Lead-in tile + product cards, soft tinted background #FAF7F2) */}
      {dedupWifi.length >= 2 && (
        <ProductRow
          eyebrow="Wi-Fi cameras"
          title={wifiCategory?.name || "Wi-Fi Cameras"}
          subtitle={wifiCategory?.description || "Single cameras you control from a phone app"}
          products={dedupWifi}
          actionText={`View all (${dedupWifi.length})`}
          onAction={() => onNavigate('category', 'wifi-cameras')}
          onNavigate={onNavigate}
          variant="canvas"
          promoTile={wifiCategory?.promoTile || {
            enabled: true,
            headline: 'Smart Wi-Fi Security Cameras',
            subtext: 'Direct phone alerts & wireless storage',
            buttonText: 'Explore Wi-Fi cameras',
            link: '/category/wifi-cameras',
            bgStyle: 'orange',
            image: wifiCategory?.image || '/images/hero/hikvision-bullet.png'
          }}
        />
      )}

      {/* 5. NEW ARRIVALS (Definitive Deduplicated Row: show if >= 2 cards, hide only if < 2) */}
      {dedupNewArrivals.length >= 2 && (
        <ProductRow
          eyebrow="Just added"
          title="New Arrivals"
          subtitle="Fresh camera models, PoE switches, and Wi-Fi gear"
          products={dedupNewArrivals}
          actionText={`View all (${dedupNewArrivals.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="panel"
        />
      )}

      {/* 6. CCTV PACKAGE SELECTOR */}
      {packages.length >= 1 && (
        <section
          id="packages"
          aria-label="CCTV Packages"
          className="w-full bg-[#FAF7F2] py-10 md:py-12"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Ready-made packages"
              title="Complete CCTV Packages"
              subtitle="Camera sets with recorder, storage and cables. Pick a set, then adjust it to fit your place."
              className="mb-5"
            />

            {/* 1. FILTER BAR: Single row compact filter bar */}
            <div className="mb-8">
              <PackageFilterBar
                variant="compact"
                packages={packages}
                systemTypes={packageSystemTypes}
                seriesList={packageSeriesList}
                filters={{
                  systemSlug: systemFilter,
                  cameraCount: packageCountFilter,
                  nightViewSlug: nightViewFilter
                }}
                onFilterChange={(newFilters) => {
                  updatePackageFilters(
                    newFilters.systemSlug || 'all',
                    newFilters.cameraCount || 'All',
                    newFilters.nightViewSlug || 'all'
                  );
                }}
                onClearFilters={() => updatePackageFilters('all', 'All', 'all')}
                totalFilteredCount={filteredPackages.length}
                totalPackagesCount={packages.length}
              />
            </div>

            {/* Package Cards Row (max 4 cards) or Friendly Empty State */}
            {displayPackages.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-[#EDE8E1] p-8 sm:p-10 text-center max-w-lg mx-auto shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F15A24] flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#111827]">
                  No packages match these filters
                </h3>
                <p className="text-xs text-[#5B6472] leading-relaxed">
                  We could not find any CCTV kits for {packageCountFilter !== 'All' ? `${packageCountFilter} cameras` : 'the selected filters'} under this configuration. Try resetting the filters below:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => updatePackageFilters('all', 'All', 'all')}
                    className="px-5 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <CardRow itemCount={Math.min(displayPackages.length, 4)}>
                  {displayPackages.slice(0, 4).map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onNavigate={onNavigate}
                      renderSvgFallback={(p) => <CctvPackageSvg pkg={p} />}
                    />
                  ))}
                </CardRow>

                {displayPackages.length > 4 && (
                  <div className="mt-5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onNavigate('packages')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                    >
                      <span>See all {displayPackages.length} packages</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. OUR SOLUTIONS (Redesigned: 3 cols desktop, 2 cols tablet, 1 col mobile with adaptive row-fill, horizontal tile min-height 112px, 48px tinted icon, 2-line title, 2-line description, whole tile clickable) */}
      {scenarios.length > 0 && (
        <section
          id="solutions"
          aria-label="Our Solutions"
          className="w-full bg-[#F4EEE6] py-14 border-y border-[#EDE8E1]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="By place"
              title="Our Solutions"
              subtitle="Find the right setup for your place."
              actionText="View all"
              onAction={() => onNavigate('solutions')}
              className="mb-8"
            />

            {/* Adaptive 3-col desktop, 2-col tablet, 1-col mobile grid with row-fill */}
            {(() => {
              const total = scenarios.length;
              // Columns by viewport: 3 at >= 1024px, 2 at 640-1023px, 1 below 640px
              const c = total < 3 ? Math.max(1, total) : 3;
              const r = total % c;
              const fullRowsCount = Math.floor(total / c);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {scenarios.map((scenario, idx) => {
                    // Compute adaptive span on desktop for last row items
                    const isInLastRow = r > 0 && idx >= fullRowsCount * c;
                    const lastRowIdx = idx - fullRowsCount * c;
                    const extraCols = c % r;
                    const baseSpan = Math.floor(c / r);
                    const colSpan = isInLastRow ? (lastRowIdx < extraCols ? baseSpan + 1 : baseSpan) : 1;

                    return (
                      <div
                        key={scenario.id}
                        onClick={() => onNavigate('solutions', scenario.slug)}
                        style={{
                          gridColumn: colSpan > 1 ? `span ${colSpan} / span ${colSpan}` : undefined
                        }}
                        data-solution-id={scenario.id}
                        className="bg-white rounded-[20px] border border-[#EDE8E1] p-5 hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer group group/scenario flex items-start gap-4 min-h-[112px]"
                      >
                        {/* 48px Tinted Icon Container on Left with built-in contrast and hover */}
                        <IconTile size="xl" rounded="rounded-2xl" className="group-hover:scale-105 shrink-0">
                          {renderScenarioIcon(scenario.iconName)}
                        </IconTile>

                        {/* Right: 17px Bold Title (up to 2 lines), Description (up to 2 lines), Learn more link */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                          <div>
                            <h3 className="font-heading font-bold text-[17px] text-[#111827] group-hover:text-[#F15A24] transition-colors line-clamp-2 leading-snug mb-1 min-w-0 [overflow-wrap:anywhere] break-words">
                              {scenario.title}
                            </h3>
                            <p className="text-sm text-[#5B6472] line-clamp-2 leading-relaxed min-w-0 [overflow-wrap:anywhere] break-words">
                              {scenario.description || ''}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#F15A24] group-hover:translate-x-0.5 transition-transform">
                            <span>Learn more</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* 8. QUICK SERVICE REQUEST (Dark Navy Band #0F172A - Fully Admin-Driven) */}
      <section
        id="quick-service"
        aria-label="Quick Service Request"
        className="w-full bg-[#0F172A] text-white py-12 md:py-[72px]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Eyebrow + H2 + Clickable Service Chips (from API) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                <Wrench className="w-3.5 h-3.5" />
                <span>Services</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-heading text-white leading-tight">
                {settings?.quickServiceSettings?.heading || 'Need a technician?'}
              </h2>
              <p className="text-xs sm:text-sm text-[#A0A8B4] leading-relaxed max-w-lg">
                {settings?.quickServiceSettings?.subtext || 'Technical consultations, cabling and installation, and hardware maintenance in Dhaka. Click a service below to schedule a call back:'}
              </p>

              {/* Service Chips (first 6 enabled services) */}
              <div role="radiogroup" aria-label="Select Service" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {serviceOfferings.slice(0, 6).map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-service-id={service.id}
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setSelectedServiceType(service.title);
                      }}
                      className={`min-h-[38px] p-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-[#F15A24] text-white border-[#F15A24] shadow-sm'
                          : 'bg-white/10 hover:bg-white/15 text-white/90 border-white/15'
                      }`}
                    >
                      <span className="line-clamp-1">{service.shortLabel || service.title}</span>
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
                  {settings?.quickServiceSettings?.buttonText || 'Request a call back'}
                </span>
                <span className="text-[11px] text-[#A0A8B4]">
                  Selected: <strong className="text-[#F15A24]">{selectedServiceType || 'CCTV Camera Setup'}</strong>
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
                    className="mt-3 text-xs text-white/80 hover:text-white underline cursor-pointer"
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
                      id="serviceType"
                      name="serviceType"
                      value={selectedServiceId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedServiceId(val);
                        if (val === 'other') {
                          setSelectedServiceType('Other / not listed');
                        } else {
                          const match = serviceOfferings.find((s) => s.id === val);
                          if (match) setSelectedServiceType(match.title);
                        }
                      }}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs focus:outline-none focus:border-[#F15A24]"
                    >
                      {serviceOfferings.map((service) => (
                        <option key={service.id} value={service.id} className="text-[#111827]">
                          {service.title}
                        </option>
                      ))}
                      {settings?.quickServiceSettings?.enableOtherOption !== false && (
                        <option value="other" className="text-[#111827]">
                          Other / not listed
                        </option>
                      )}
                    </select>
                  </div>

                  {selectedServiceId === 'other' && (
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                        Please specify service required *
                      </label>
                      <input
                        type="text"
                        required
                        value={customServiceText}
                        onChange={(e) => setCustomServiceText(e.target.value)}
                        placeholder="Describe what equipment or assistance you need..."
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                        {settings?.quickServiceSettings?.nameLabel || 'Your Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={callbackName}
                        onChange={(e) => setCallbackName(e.target.value)}
                        placeholder={settings?.quickServiceSettings?.namePlaceholder || 'e.g. Tanvir Ahmed'}
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                        {settings?.quickServiceSettings?.phoneLabel || 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={callbackPhone}
                        onChange={(e) => setCallbackPhone(e.target.value)}
                        placeholder={settings?.quickServiceSettings?.phonePlaceholder || '017XXXXXXXX'}
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#A0A8B4] mb-1">
                      {settings?.quickServiceSettings?.areaLabel || 'Dhaka Area / Location'}
                    </label>
                    <input
                      type="text"
                      value={callbackArea}
                      onChange={(e) => setCallbackArea(e.target.value)}
                      placeholder={settings?.quickServiceSettings?.areaPlaceholder || 'e.g. Uttara Sector 3, Dhanmondi, Mirpur'}
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
                    className="w-full min-h-[44px] py-2.5 px-6 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {callbackStatus === 'submitting'
                        ? 'Submitting...'
                        : (settings?.quickServiceSettings?.buttonText || 'Request a call back')}
                    </span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>


      {/* 9. ACCESSORIES & ADD-ONS (Categories with isAccessoryCategory, show if >= 2 cards, hide only if < 2) */}
      {dedupAccessories.length >= 2 && (
        <ProductRow
          eyebrow="Add-ons"
          title="Accessories & Add-ons"
          subtitle={settings?.accessoriesSubtitle || "Cables, storage, power and mounting for your setup"}
          products={dedupAccessories}
          actionText={`View all (${dedupAccessories.length})`}
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
          actionText={`View all (${items.length})`}
          onAction={() => onNavigate('category', cat.slug)}
          onNavigate={onNavigate}
          variant={idx % 2 === 0 ? 'panel' : 'canvas'}
          promoTile={cat.promoTile}
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
              <span>Need help?</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
              Need a customized security or network setup?
            </h2>

            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Our technical team provides recommendations and price quotes in Dhaka.
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
                <IconTile size="lg" rounded="rounded-xl" className="mb-4">
                  <MessageCircle className="w-5 h-5 fill-current stroke-none" />
                </IconTile>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold font-heading text-lg text-[#111827]">Chat on WhatsApp</h3>
                  <ArrowRight className="w-4 h-4 text-[#F15A24] transform group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs sm:text-sm text-[#5B6472] mt-1.5 leading-snug">
                  Direct technical advice and price inquiries
                </p>
              </div>
            </a>

            {/* 2. Call Card */}
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="bg-white text-[#111827] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between group cursor-pointer w-full"
            >
              <div>
                <IconTile size="lg" rounded="rounded-xl" className="mb-4">
                  <Phone className="w-5 h-5 stroke-current fill-none" />
                </IconTile>
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
                <IconTile size="lg" rounded="rounded-xl" className="mb-4">
                  <Wrench className="w-5 h-5 stroke-current fill-none" />
                </IconTile>
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
