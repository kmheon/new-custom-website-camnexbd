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
  HardDrive
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
  packageService
} from '../services';
import {
  HomepageSection,
  Product,
  Category,
  SecurityPackage,
  Testimonial,
  ProjectCaseStudy
} from '../types';
import { useSettingsStore, useAdminAuthStore } from '../store';
import {
  DEFAULT_SERVICES_LIST,
  DEFAULT_PROCESS_STEPS,
  DEFAULT_HOW_IT_WORKS
} from '../services/seedData';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { settings, loadSettings } = useSettingsStore();
  const { isAdminAuthenticated, checkAuth } = useAdminAuthStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Product[]>([]);
  const [categoryRowProducts, setCategoryRowProducts] = useState<{ [catId: string]: Product[] }>({});
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);

  // Package section filter
  const [packageFilter, setPackageFilter] = useState<string>('All');

  // Services accordion active state
  const [activeServiceIdx, setActiveServiceIdx] = useState<number>(0);

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

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    if (packageFilter === 'All') return true;
    if (packageFilter === 'Bullet Series') return pkg.name.toLowerCase().includes('bullet') || pkg.description.toLowerCase().includes('bullet');
    if (packageFilter === 'Dome Series') return pkg.name.toLowerCase().includes('dome') || pkg.description.toLowerCase().includes('dome');
    if (packageFilter === 'PoE IP Systems') return pkg.name.toLowerCase().includes('ip') || pkg.name.toLowerCase().includes('poe') || pkg.description.toLowerCase().includes('poe');
    return true;
  });

  const servicesList = settings?.servicesList?.filter((s) => s.enabled) || DEFAULT_SERVICES_LIST;
  const processSteps = settings?.processSteps?.filter((p) => p.enabled) || DEFAULT_PROCESS_STEPS;
  const howItWorks = settings?.howItWorks || DEFAULT_HOW_IT_WORKS;

  const phone = settings?.phone || '+880 1540-535150';
  const whatsappNumber = settings?.whatsappNumber || '8801540535150';
  const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20CamneX,%20I%20would%20like%20to%20consult%20about%20a%20security%20system`;

  // Helper for service icons
  const renderServiceIcon = (iconName?: string) => {
    const className = "w-4 h-4 text-[#F15A24] flex-shrink-0";
    switch (iconName?.toLowerCase()) {
      case 'camera': return <Camera className={className} />;
      case 'wifi': return <Wifi className={className} />;
      case 'cpu': return <Cpu className={className} />;
      case 'eye': return <Eye className={className} />;
      case 'wrench': return <Wrench className={className} />;
      case 'harddrive': return <HardDrive className={className} />;
      case 'shield': return <Shield className={className} />;
      default: return <Settings className={className} />;
    }
  };

  // Helper for Category image fallback
  const handleCatImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/images/hero/hikvision-bullet.jpg';
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

      {/* 1. HERO SLIDER + BRAND STRIP (Definitive Section 2) */}
      <HeroSlider onNavigate={onNavigate} />

      {/* 2. SHOP BY CATEGORY (Definitive Section 3: On the Canvas) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-14 md:my-22">
        <SectionHeader
          eyebrow="Hardware Categories"
          title="Shop by Category"
          subtitle="Authentic surveillance, networking, and biometric equipment from authorized manufacturers"
          actionText="All categories"
          onAction={() => onNavigate('catalog')}
        />

        {/* Six Large Tiles (3x2 desktop, 2x3 mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {categories.slice(0, 6).map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('category', cat.slug)}
              className="bg-white rounded-[20px] border border-[#EDE8E1] p-5 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between h-full"
            >
              <div>
                {/* Illustration/Image on Soft Tinted Area */}
                <div className="bg-[#F4EEE6] rounded-2xl h-36 sm:h-44 flex items-center justify-center p-3 sm:p-4 overflow-hidden mb-4 sm:mb-5 group-hover:bg-[#EDE5DA] transition-colors">
                  <img
                    src={cat.image || '/images/hero/hikvision-bullet.jpg'}
                    alt={cat.name}
                    onError={handleCatImageError}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                  />
                </div>

                {/* Bold Category Name */}
                <h3 className="font-heading font-bold text-base sm:text-lg text-[#111827] group-hover:text-[#F15A24] transition-colors mb-1 line-clamp-1">
                  {cat.name}
                </h3>

                {/* One Short Line */}
                <p className="text-xs text-[#5B6472] line-clamp-1 mb-4">
                  {cat.description || 'Verified hardware with distributor warranty'}
                </p>
              </div>

              {/* Round Orange Arrow Button that lifts on hover */}
              <div className="flex items-center justify-between pt-2 border-t border-[#EDE8E1]/60">
                <span className="text-[11px] font-bold text-[#5B6472] group-hover:text-[#111827] transition-colors">
                  Browse Series
                </span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-50 text-[#F15A24] group-hover:bg-[#F15A24] group-hover:text-white flex items-center justify-center transition-all transform group-hover:-translate-y-1 group-hover:shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PACKAGES (Definitive Section 4: Soft Tinted Panel "surface-soft" #F4EEE6) */}
      <section className="px-3 md:px-6 my-14 md:my-22">
        <div className="max-w-[1200px] mx-auto bg-[#F4EEE6] rounded-[20px] md:rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 lg:p-14">
          
          {/* Centered Header */}
          <SectionHeader
            eyebrow="Turnkey Bundles"
            title="Complete CCTV Packages"
            subtitle="Configurable camera kits with genuine storage, wiring, and certified technician installation"
            centered
          />

          {/* Chips for Form Factor and Package Type */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10">
            {['All', 'Bullet Series', 'Dome Series', 'PoE IP Systems'].map((chip) => {
              const isActive = packageFilter === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setPackageFilter(chip)}
                  className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#F15A24] text-white shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-[#111827] border border-[#EDE8E1]'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* White Package Cards: 4 across desktop, snap-scroll on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-[20px] border border-[#EDE8E1] p-5 sm:p-6 flex flex-col justify-between hover:shadow-lg transition-all h-full"
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F15A24] px-2.5 py-0.5 rounded-full">
                      {pkg.badge || 'Complete Kit'}
                    </span>
                    <span className="text-[11px] font-bold text-[#5B6472]">
                      2-16 Cams
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#111827] mb-2 leading-tight">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-[#5B6472] leading-relaxed mb-4 line-clamp-2">
                    {pkg.description}
                  </p>

                  {/* Included Items Checklist */}
                  <div className="space-y-2 py-3 border-y border-[#EDE8E1] text-xs text-[#111827] mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
                      <span className="line-clamp-1">Hikvision IR Night Vision Cams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
                      <span className="line-clamp-1">WD Purple Surveillance HDD</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
                      <span className="line-clamp-1">Pure Copper Cat6 Cabling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0" />
                      <span className="line-clamp-1">Hik-Connect Smartphone App</span>
                    </div>
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

      {/* 4. SERVICES (Definitive Section 5: Dark Panel "surface-dark" #141210) */}
      <section className="px-3 md:px-6 my-14 md:my-22">
        <div className="max-w-[1200px] mx-auto bg-[#141210] rounded-[20px] md:rounded-[28px] p-6 sm:p-12 lg:p-16 text-white shadow-2xl">
          
          {/* Centered Header */}
          <SectionHeader
            eyebrow="Services"
            title="Installation, setup and support"
            subtitle="Professional deployment with concealed wiring, certified technicians, and dedicated maintenance agreements"
            centered
            dark
          />

          {/* Two Columns Below */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10">
            
            {/* LEFT: Rounded Orange-Gradient Card with Floating Checklist Card */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full rounded-3xl bg-gradient-to-br from-[#F15A24] to-[#D94D1C] p-6 sm:p-8 flex items-center justify-center relative overflow-hidden min-h-[380px] shadow-xl">
                
                {/* Background decorative glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />

                {/* White Floating Card with 3 Process Steps */}
                <div className="relative z-10 bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm text-[#111827] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EDE8E1] pb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#F15A24]">
                      Engineering Workflow
                    </span>
                    <span className="text-[10px] font-bold text-[#5B6472]">
                      3 Step Guarantee
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {processSteps.map((step, idx) => (
                      <div key={step.id || idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-[#F15A24] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#111827]">
                            {step.title}
                          </div>
                          <div className="text-[11px] text-[#5B6472] leading-snug">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#EDE8E1] text-center">
                    <span className="text-[10px] font-bold text-[#5B6472]">
                      Transparent estimates without surprise charges
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT: Vertical List of Services (Accordion) */}
            <div className="lg:col-span-7 space-y-1">
              {servicesList.map((srv, idx) => {
                const isActive = activeServiceIdx === idx;
                return (
                  <div
                    key={srv.id || idx}
                    onMouseEnter={() => setActiveServiceIdx(idx)}
                    onClick={() => setActiveServiceIdx(idx)}
                    className={`p-4 rounded-xl transition-all cursor-pointer border-b border-white/10 ${
                      isActive
                        ? 'border-l-4 border-l-[#F15A24] bg-white/5 pl-4'
                        : 'hover:bg-white/5 pl-2'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          {renderServiceIcon(srv.icon)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white font-heading">
                            {srv.title}
                          </h4>
                          {isActive && (
                            <p className="text-xs text-[#A0A8B4] mt-1 leading-relaxed animate-fade-in">
                              {srv.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'rotate-90 text-[#F15A24]' : ''}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Centered Pill Buttons Below Services */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book a site survey</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-full bg-transparent hover:bg-white/10 text-white border border-white/30 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              <span>Request a quote</span>
            </button>
          </div>

        </div>
      </section>

      {/* 5. PRODUCT ROWS (Definitive Section 6: Alternating Canvas / White Rounded Panels) */}
      
      {/* Row 1: Popular Products (Canvas) */}
      {popularProducts.length > 0 && (
        <ProductRow
          eyebrow="Popular Hardware"
          title="Popular Products"
          subtitle="Top verified security cameras, video recorders, and biometric access hardware"
          products={popularProducts}
          actionText={`View all (${popularProducts.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="canvas"
        />
      )}

      {/* Row 2: New Arrivals (White Rounded Panel) */}
      {newArrivals.length > 0 && (
        <ProductRow
          eyebrow="New Deployments"
          title="New Arrivals"
          subtitle="Latest firmware models, high-density PoE switches, and Wi-Fi 6 hardware additions"
          products={newArrivals}
          actionText={`View all (${newArrivals.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="panel"
        />
      )}

      {/* Row 3: Special Offers (Canvas - ONLY if real discounts exist) */}
      {specialOffers.length > 0 && (
        <ProductRow
          eyebrow="Verified Discounts"
          title="Special Offers"
          subtitle="Genuine sale prices set directly by the distributor without inflated baselines"
          products={specialOffers}
          actionText={`View all (${specialOffers.length})`}
          onAction={() => onNavigate('catalog')}
          onNavigate={onNavigate}
          variant="canvas"
        />
      )}

      {/* Category Rows (marked showOnHomepage) */}
      {categories
        .filter((cat) => cat.showOnHomepage && categoryRowProducts[cat.id]?.length > 0)
        .map((cat, idx) => (
          <ProductRow
            key={cat.id}
            eyebrow="Category Showcase"
            title={cat.name}
            subtitle={cat.description}
            products={categoryRowProducts[cat.id]}
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

      {/* 6. HOW IT WORKS (Definitive Section 7: Optional, Admin-Controlled) */}
      {howItWorks?.enabled && (
        <section className="px-3 md:px-6 my-14 md:my-22">
          <div className="max-w-[1200px] mx-auto bg-white rounded-[20px] md:rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 lg:p-14 shadow-sm">
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

      {/* 7. PROOF SECTIONS (Definitive Section 8: Testimonials & Projects) */}
      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-14 md:my-22">
          <SectionHeader
            eyebrow="Client Experiences"
            title="Verified Client Feedback"
            subtitle="Real deployment feedback from commercial and residential project owners"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-[20px] border border-[#EDE8E1] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-[#111827] leading-relaxed italic mb-4">
                    "{t.content}"
                  </p>
                </div>
                <div className="pt-3 border-t border-[#EDE8E1]">
                  <div className="font-bold text-xs text-[#111827]">{t.clientName}</div>
                  <div className="text-[11px] text-[#5B6472]">{t.clientRole || t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : isAdminAuthenticated ? (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-10">
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
      ) : null}

      {/* Projects */}
      {projects.length > 0 ? (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-14 md:my-22">
          <SectionHeader
            eyebrow="Case Studies"
            title="Recent Installation Projects"
            subtitle="Commercial surveillance, factory Wi-Fi mesh, and corporate biometric deployments"
            actionText="View all projects"
            onAction={() => onNavigate('projects')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => onNavigate('projects')}
                className="bg-white rounded-[20px] border border-[#EDE8E1] overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="h-44 bg-slate-100 overflow-hidden relative">
                  <img
                    src={p.image || '/images/hero/hikvision-bullet.jpg'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.category && (
                    <span className="absolute top-3 left-3 bg-[#111827]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-bold text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors mb-1 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#5B6472] line-clamp-2">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : isAdminAuthenticated ? (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 my-10">
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
      ) : null}

      {/* 8. FINAL CTA (Definitive Section 9: Orange Rounded Panel #F15A24 to #D94D1C) */}
      <section className="px-3 md:px-6 my-14 md:my-22">
        <div className="max-w-[1200px] mx-auto rounded-[20px] md:rounded-[28px] bg-gradient-to-br from-[#F15A24] via-[#ea5019] to-[#D94D1C] text-white p-8 sm:p-12 lg:p-16 text-center space-y-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle radial pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_50%)] pointer-events-none" />

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
              Our certified technicians perform on-site surveys and provide transparent quotations across Dhaka and nationwide.
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
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-full bg-[#141210] text-white hover:bg-black font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Wrench className="w-4 h-4 text-[#F15A24]" />
              <span>Book Site Visit</span>
            </button>

          </div>

          {/* Reassurance Row Below */}
          <div className="relative z-10 border-t border-white/20 pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 sm:gap-x-10 text-xs sm:text-sm font-medium text-white/95">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Authorized Hikvision & ZKTeco Partner</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Genuine Warranty with Serial Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Concealed Trunking & Neat Cabling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Free Mobile Viewing Setup</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
