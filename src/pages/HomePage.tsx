import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, CheckCircle2, ChevronRight, Star, ShoppingBag, Wrench, Layers, Award, Sparkles, Phone, MessageSquare, Calendar } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Button, Badge, Card } from '../components/common/UI';
import { HeroSlider } from '../components/HeroSlider';
import { cmsService, productService, categoryService, brandService, packageService } from '../services';
import { INITIAL_CTA_DATA } from '../services/seedData';
import { HomepageSection, Product, Category, Brand, SecurityPackage } from '../types';
import { useCartStore } from '../store';

interface HomePageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [selectedPremise, setSelectedPremise] = useState<'Home' | 'Shop' | 'Office' | 'Factory'>('Home');
  const [selectedCamCount, setSelectedCamCount] = useState<number>(4);

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    cmsService.getHomepageSections().then(setSections);
    categoryService.getCategories().then(setCategories);
    productService.getFeaturedProducts(6).then(setFeaturedProducts);
    productService.getPopularProducts(6).then(setPopularProducts);
    brandService.getBrands().then(setBrands);
    packageService.getPackages().then(setPackages);
  }, []);

  const calculateQuickEstimate = () => {
    let base = 8500;
    if (selectedCamCount === 2) base = 8500;
    else if (selectedCamCount === 4) base = 14500;
    else if (selectedCamCount === 8) base = 27500;
    else if (selectedCamCount >= 16) base = 54000;

    if (selectedPremise === 'Office') base += 2500;
    if (selectedPremise === 'Factory') base += 6000;
    return `৳${base.toLocaleString()} - ৳${Math.round(base * 1.25).toLocaleString()}`;
  };

  const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);

  return (
    <div>
      <SEO
        title="CamneX Bangladesh"
        description="Authorized Hikvision Partner and ZKTeco Installer in Bangladesh. Genuine CCTV cameras, Turbo HD DVRs, enterprise switches, and biometric access control."
        canonicalPath="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
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

      {/* RENDER ADMIN-EDITABLE SECTIONS */}
      {enabledSections.map((section) => {
        
        // 1. HERO SLIDER SECTION (Light & Airy Phase 1 Master Slider)
        if (section.type === 'hero') {
          return <HeroSlider key={section.id} onNavigate={onNavigate} />;
        }

        // 2. CREDENTIALS STRIP
        if (section.type === 'credentials') {
          return (
            <section key={section.id} className="bg-slate-900 border-b border-slate-800 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="w-10 h-10 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center font-black">
                      HIK
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Hikvision Authorized Partner</div>
                      <div className="text-xs text-slate-400">Genuine cameras, DVRs & NVRs with verified warranty</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-500 flex items-center justify-center font-black">
                      ZK
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">ZKTeco Authorized Installer</div>
                      <div className="text-xs text-slate-400">Certified biometric attendance & electronic door access</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // 3. CATEGORIES SECTION
        if (section.type === 'categories') {
          return (
            <section key={section.id} className="py-16 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block mb-1">
                      Hardware Categories
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                      Shop by Engineering Category
                    </h2>
                  </div>
                  <button
                    onClick={() => onNavigate('catalog')}
                    className="text-xs font-bold text-[#F15A24] hover:text-[#D94D1C] flex items-center gap-1"
                  >
                    <span>View all products</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => onNavigate('category', cat.slug)}
                      className="group p-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="h-32 mb-3 rounded-xl overflow-hidden bg-slate-200">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#F15A24] transition-colors font-heading mb-1">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // 4. FEATURED PRODUCTS SECTION
        if (section.type === 'featured_products') {
          return (
            <section key={section.id} className="py-16 bg-[#F8FAFC] border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block mb-1">
                      Top Hardware Selections
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                      Featured Surveillance & IT Hardware
                    </h2>
                  </div>
                  <button
                    onClick={() => onNavigate('catalog')}
                    className="text-xs font-bold text-[#F15A24] hover:underline"
                  >
                    Complete Catalog →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image */}
                        <div
                          onClick={() => onNavigate('product', prod.id)}
                          className="h-48 rounded-xl overflow-hidden bg-slate-100 cursor-pointer mb-4 relative"
                        >
                          <img
                            src={prod.primaryImage}
                            alt={prod.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <Badge variant="dark">{prod.brand}</Badge>
                          </div>
                          {prod.isDemo && (
                            <div className="absolute bottom-2 left-2">
                              <span className="text-[10px] bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded font-mono">
                                Sample item
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & Model */}
                        <div className="text-xs font-mono text-slate-500 mb-1">{prod.modelNumber}</div>
                        <h3
                          onClick={() => onNavigate('product', prod.id)}
                          className="font-bold text-base text-[#111827] hover:text-[#F15A24] cursor-pointer transition-colors font-heading mb-2 line-clamp-1"
                        >
                          {prod.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                          {prod.shortDescription}
                        </p>
                      </div>

                      {/* Pricing & Add to Cart */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          {prod.pricing.regularPrice ? (
                            <div className="text-lg font-black text-[#F15A24] font-heading">
                              ৳{prod.pricing.regularPrice.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-slate-500">
                              Request quotation
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate('product', prod.id)}
                            className="text-xs font-bold text-slate-600 hover:text-black px-2.5 py-1.5 rounded-lg border border-slate-200"
                          >
                            Details
                          </button>
                          <Button
                            size="sm"
                            onClick={() => addItemToCart(prod, 1)}
                          >
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                            <span>Add</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // 5. PACKAGES SECTION
        if (section.type === 'packages') {
          return (
            <section key={section.id} className="py-16 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <Badge variant="orange" className="mb-2">Configurable Bundles</Badge>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                    Turnkey CCTV Security Packages
                  </h2>
                  <p className="text-sm text-slate-600 mt-2">
                    Pure infrared night vision packages. Rules-based storage and cable formulas without surprise fees.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-[#111827] text-white p-7 rounded-2xl shadow-xl border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="orange">{pkg.badge || 'Turnkey System'}</Badge>
                          <span className="text-xs text-slate-400 font-mono">2, 4, 8, 16 Cams</span>
                        </div>

                        <h3 className="text-xl font-bold font-heading mb-2 text-white">
                          {pkg.name}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed mb-6">
                          {pkg.description}
                        </p>

                        <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24]" />
                            <span>Hikvision 2MP IRPF Infrared Cameras</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24]" />
                            <span>WD Purple Surveillance HDD</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24]" />
                            <span>10 Meters Pure Cat6 Cable per camera</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24]" />
                            <span>Free Hik-Connect Smartphone Live View</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-2xl font-black text-[#F15A24] font-heading mb-4">
                          {pkg.basePrice ? `Starting at ৳${pkg.basePrice.toLocaleString()}` : 'Pricing by Specification'}
                        </div>

                        <Button
                          size="md"
                          onClick={() => onNavigate('packages', pkg.slug)}
                          className="w-full"
                        >
                          <span>Open Package Builder</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // 6. BRANDS SECTION
        if (section.type === 'brands') {
          return (
            <section key={section.id} className="py-12 bg-[#F8FAFC] border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-6">
                  Authorized Manufacturer Partners & Official Brands
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onNavigate('brand', b.slug)}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-400 cursor-pointer shadow-sm transition-all text-center"
                    >
                      <span className="text-sm font-black text-[#111827] tracking-wider block font-heading">
                        {b.name.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">Official Hardware</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // 7. SOLUTIONS / SERVICES
        if (section.type === 'solutions') {
          return (
            <section key={section.id} className="py-16 bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <Badge variant="dark" className="mb-2">Engineering Capabilities</Badge>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-heading">
                    Turnkey Engineering & IT Infrastructure
                  </h2>
                  <p className="text-sm text-slate-600 mt-2">
                    Professional deployment with clean concealed trunking and dedicated maintenance SLAs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#F15A24]/10 text-[#F15A24] flex items-center justify-center font-bold mb-4">
                        01
                      </div>
                      <h3 className="text-lg font-bold text-[#111827] font-heading mb-2">
                        CCTV & Video Surveillance
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        Analog HD and IP optical network camera setups designed to eliminate blind spots across homes, duplex villas, and manufacturing plants.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('services')}
                      className="text-xs font-bold text-[#F15A24] hover:underline text-left"
                    >
                      Learn more →
                    </button>
                  </div>

                  <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-4">
                        02
                      </div>
                      <h3 className="text-lg font-bold text-[#111827] font-heading mb-2">
                        Structured Cabling & Wi-Fi 6
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        Server rack termination, patch panel labeling, Cat6 copper cabling, and high-density commercial access point deployments.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('services')}
                      className="text-xs font-bold text-blue-600 hover:underline text-left"
                    >
                      Learn more →
                    </button>
                  </div>

                  <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-4">
                        03
                      </div>
                      <h3 className="text-lg font-bold text-[#111827] font-heading mb-2">
                        Biometric Access Control
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        ZKTeco facial recognition, biometric fingerprint scanners, magnetic locks, and automated shift-wise Excel payroll reporting.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('services')}
                      className="text-xs font-bold text-emerald-600 hover:underline text-left"
                    >
                      Learn more →
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // 8. FINAL CTA SECTION (Orange Panel with 3 White Cards and Reassurance Row)
        if (section.type === 'quote_cta') {
          const cta = section.ctaData || INITIAL_CTA_DATA;
          const activeReassurances = (cta.reassurances || INITIAL_CTA_DATA.reassurances).filter(r => r.enabled);
          const cardsList = (cta.cards && cta.cards.length > 0) ? cta.cards : INITIAL_CTA_DATA.cards;

          return (
            <section key={section.id} className="py-12 sm:py-16 bg-slate-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-3xl bg-gradient-to-br from-[#F15A24] via-[#ea5019] to-[#D94D1C] text-white overflow-hidden shadow-2xl p-8 sm:p-12 lg:p-16 text-center space-y-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_50%)] pointer-events-none"></div>

                  <div className="relative z-10 max-w-4xl mx-auto space-y-4">
                    {/* Small pill eyebrow at the top */}
                    {cta.eyebrow && (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{cta.eyebrow}</span>
                      </div>
                    )}

                    {/* H2 */}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
                      {cta.heading || 'Need Help Choosing the Right Security Solution?'}
                    </h2>

                    {/* Subtext */}
                    <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
                      {cta.subtext || 'Our specialists are ready to help you choose the perfect CCTV, networking, access control or smart security solution for your home or business.'}
                    </p>
                  </div>

                  {/* Three white rounded action cards in a row */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto pt-2">
                    {cardsList.map((card) => {
                      const isSurvey = card.type === 'survey';
                      const isCall = card.type === 'call';
                      const isWa = card.type === 'whatsapp';
                      const IconComponent = isWa ? MessageSquare : isCall ? Phone : Calendar;

                      if (isSurvey) {
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => onNavigate('quote')}
                            className="bg-white text-[#111827] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between group cursor-pointer w-full"
                          >
                            <div>
                              <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center mb-4 group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold font-heading text-lg text-[#111827]">{card.title}</h3>
                                <ArrowRight className="w-4 h-4 text-[#F15A24] transform group-hover:translate-x-1 transition-transform" />
                              </div>
                              <p className="text-sm text-slate-500 mt-1.5 leading-snug">{card.description}</p>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <a
                          key={card.id}
                          href={card.actionUrl || (isCall ? 'tel:+8801540535150' : 'https://wa.me/8801540535150')}
                          target={isWa ? '_blank' : undefined}
                          rel={isWa ? 'noopener noreferrer' : undefined}
                          className="bg-white text-[#111827] rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between group"
                        >
                          <div>
                            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#F15A24] flex items-center justify-center mb-4 group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold font-heading text-lg text-[#111827]">{card.title}</h3>
                              <ArrowRight className="w-4 h-4 text-[#F15A24] transform group-hover:translate-x-1 transition-transform" />
                            </div>
                            {card.phoneDisplay && (
                              <p className="text-xs font-bold text-[#F15A24] mt-0.5">{card.phoneDisplay}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-1 leading-snug">{card.description}</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>

                  {/* Reassurance row below the cards */}
                  {activeReassurances.length > 0 && (
                    <div className="relative z-10 pt-6 border-t border-white/20 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 sm:gap-x-10 text-xs sm:text-sm text-white/95 font-medium">
                      {activeReassurances.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
};
