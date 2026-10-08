import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Phone, Menu, X, Shield, ChevronDown, User, ArrowRight, Wrench, MessageCircle } from 'lucide-react';
import { useCartStore, useSettingsStore } from '../../store';
import { categoryService, productService, brandService } from '../../services';
import { Category, Product, Brand } from '../../types';

interface HeaderProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentRoute }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = useCartStore((s) => s.totalCount());
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    categoryService.getCategories().then(setCategories);
    brandService.getBrands().then(setBrands);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadSettings]);

  // Click outside to close dropdowns & search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant autocomplete debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await productService.getProducts({ search: searchQuery, limit: 5 });
        setSearchSuggestions(res.items);
      } finally {
        setIsSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      onNavigate('search', searchQuery.trim());
    }
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const toggleMobileAccordion = (name: string) => {
    setMobileAccordion((prev) => (prev === name ? null : name));
  };

  const announcementText = settings?.announcementBar?.enabled ? settings?.announcementBar?.text : (settings?.promoBanner?.enabled ? settings?.promoBanner?.text : '');
  const announcementLink = settings?.announcementBar?.enabled ? settings?.announcementBar?.link : (settings?.promoBanner?.enabled ? settings?.promoBanner?.link : '');

  return (
    <>
      {/* Optional Slim Dismissible Announcement Bar (only if admin configured text) */}
      {announcementText && !announcementDismissed && (
        <div className="bg-[#F15A24] text-white text-xs py-2 px-4 relative z-50 shadow-sm transition-all">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 text-center font-medium">
              {announcementLink ? (
                <a href={announcementLink} className="underline hover:text-white/90">
                  {announcementText}
                </a>
              ) : (
                <span>{announcementText}</span>
              )}
            </div>
            <button
              onClick={() => setAnnouncementDismissed(true)}
              className="p-1 rounded hover:bg-black/10 text-white/90 hover:text-white transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Rounded Header Card */}
      <div className="sticky top-4 z-40 px-3 md:px-6 pointer-events-none transition-all duration-200">
        <header
          ref={navRef}
          className={`sticky top-4 max-w-[1200px] mx-auto pointer-events-auto bg-white/92 backdrop-blur-md rounded-[20px] border border-[#EDE8E1] shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-200 ${
            isScrolled ? 'py-2.5 px-4 md:px-6 shadow-md' : 'py-3.5 px-4 md:px-6'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            
            {/* Left: Brand Logo */}
            <button
              onClick={() => {
                setActiveDropdown(null);
                onNavigate('home');
              }}
              className="flex items-center gap-3 text-left focus:outline-none group flex-shrink-0"
              aria-label="CamneX Bangladesh Home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F15A24] to-[#D94D1C] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-[#111827] font-heading">
                    Camne<span className="text-[#F15A24]">X</span>
                  </span>
                  <span className="bg-[#F15A24]/10 text-[#F15A24] text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase border border-[#F15A24]/20">
                    BD
                  </span>
                </div>
                <span className="text-[10px] text-[#5B6472] font-medium hidden sm:block">
                  Security & Surveillance
                </span>
              </div>
            </button>

            {/* Center: Desktop Navigation Links with Dropdowns */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] font-semibold text-[#111827]">
              
              {/* Shop (Mega Menu) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('shop')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => toggleDropdown('shop')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full transition-colors ${
                    activeDropdown === 'shop' || currentRoute === 'catalog' || currentRoute === 'category'
                      ? 'text-[#F15A24] bg-orange-50/60 font-bold'
                      : 'hover:text-[#F15A24] hover:bg-slate-50'
                  }`}
                >
                  <span>Shop</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'shop' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                </button>

                {activeDropdown === 'shop' && (
                  <div className="absolute top-full left-0 w-[580px] bg-white rounded-[20px] border border-[#EDE8E1] shadow-2xl p-5 z-50 mt-1 animate-fade-in grid grid-cols-12 gap-5">
                    {/* Category Column */}
                    <div className="col-span-7 space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6472] px-2 mb-2">
                        Hardware Categories
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setActiveDropdown(null);
                              onNavigate('category', cat.slug);
                            }}
                            className="text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] flex items-center justify-between transition-colors group"
                          >
                            <span>{cat.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#F15A24] transition-colors" />
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-[#EDE8E1] mt-2">
                        <button
                          onClick={() => {
                            setActiveDropdown(null);
                            onNavigate('catalog');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1.5"
                        >
                          <span>Browse Complete Catalog</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Promo Tile */}
                    <div className="col-span-5 bg-gradient-to-br from-[#F4EEE6] to-orange-50/40 rounded-2xl p-4 border border-[#EDE8E1] flex flex-col justify-between">
                      <div>
                        <span className="inline-block bg-[#F15A24] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                          Ready Packages
                        </span>
                        <h4 className="text-sm font-bold text-[#111827] mb-1">
                          Complete CCTV Kits
                        </h4>
                        <p className="text-[11px] text-[#5B6472] leading-relaxed">
                          2, 4, 8 & 16 camera systems with storage, cabling & verified installation.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onNavigate('packages');
                        }}
                        className="mt-4 w-full py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Package Builder</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('solutions')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => toggleDropdown('solutions')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full transition-colors ${
                    activeDropdown === 'solutions' || currentRoute === 'solutions'
                      ? 'text-[#F15A24] bg-orange-50/60 font-bold'
                      : 'hover:text-[#F15A24] hover:bg-slate-50'
                  }`}
                >
                  <span>Solutions</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'solutions' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                </button>

                {activeDropdown === 'solutions' && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-[20px] border border-[#EDE8E1] shadow-2xl p-2 z-50 mt-1 animate-fade-in space-y-1">
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('solutions');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      <div className="font-bold">Enterprise & Industrial</div>
                      <div className="text-[11px] text-[#5B6472]">Perimeter and warehouse CCTV systems</div>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('solutions');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      <div className="font-bold">Retail & Supermarket</div>
                      <div className="text-[11px] text-[#5B6472]">Loss prevention & POS area coverage</div>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('solutions');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      <div className="font-bold">Corporate Biometrics & SLA</div>
                      <div className="text-[11px] text-[#5B6472]">Attendance integration & yearly support</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('services')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => toggleDropdown('services')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full transition-colors ${
                    activeDropdown === 'services' || currentRoute === 'services'
                      ? 'text-[#F15A24] bg-orange-50/60 font-bold'
                      : 'hover:text-[#F15A24] hover:bg-slate-50'
                  }`}
                >
                  <span>Services</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                </button>

                {activeDropdown === 'services' && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-[20px] border border-[#EDE8E1] shadow-2xl p-2 z-50 mt-1 animate-fade-in space-y-1">
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('services');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      CCTV Installation & Wiring
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('services');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Site Survey & Estimation
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('services');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Enterprise Wi-Fi & Mesh Setup
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('services');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Access Control & Attendance
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('services');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      AMC & Scheduled Maintenance
                    </button>
                  </div>
                )}
              </div>

              {/* Packages */}
              <button
                onClick={() => onNavigate('packages')}
                className={`px-3 py-2 rounded-full transition-colors ${
                  currentRoute === 'packages'
                    ? 'text-[#F15A24] bg-orange-50/60 font-bold'
                    : 'hover:text-[#F15A24] hover:bg-slate-50'
                }`}
              >
                Packages
              </button>

              {/* Brands Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('brands')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => toggleDropdown('brands')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full transition-colors ${
                    activeDropdown === 'brands' || currentRoute === 'brand'
                      ? 'text-[#F15A24] bg-orange-50/60 font-bold'
                      : 'hover:text-[#F15A24] hover:bg-slate-50'
                  }`}
                >
                  <span>Brands</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'brands' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                </button>

                {activeDropdown === 'brands' && (
                  <div className="absolute top-full left-0 w-56 bg-white rounded-[20px] border border-[#EDE8E1] shadow-2xl p-2 z-50 mt-1 animate-fade-in space-y-1">
                    {brands.length > 0 ? (
                      brands.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setActiveDropdown(null);
                            onNavigate('brand', b.slug);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] flex items-center justify-between transition-colors"
                        >
                          <span>{b.name}</span>
                          {b.isAuthorized && (
                            <span className="text-[10px] font-bold text-[#F15A24] bg-orange-50 px-1.5 py-0.5 rounded">
                              Authorized
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <>
                        <button onClick={() => { setActiveDropdown(null); onNavigate('brand', 'hikvision'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24]">Hikvision</button>
                        <button onClick={() => { setActiveDropdown(null); onNavigate('brand', 'zkteco'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24]">ZKTeco</button>
                        <button onClick={() => { setActiveDropdown(null); onNavigate('brand', 'ruijie'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24]">Ruijie Reyee</button>
                        <button onClick={() => { setActiveDropdown(null); onNavigate('brand', 'dahua'); }} className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24]">Dahua</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Support Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('support')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => toggleDropdown('support')}
                  className={`flex items-center gap-1 px-3 py-2 rounded-full transition-colors ${
                    activeDropdown === 'support' || currentRoute === 'tracking' || currentRoute === 'faq' || currentRoute === 'contact'
                      ? 'text-[#F15A24] bg-orange-50/60 font-bold'
                      : 'hover:text-[#F15A24] hover:bg-slate-50'
                  }`}
                >
                  <span>Support</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'support' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                </button>

                {activeDropdown === 'support' && (
                  <div className="absolute top-full right-0 w-56 bg-white rounded-[20px] border border-[#EDE8E1] shadow-2xl p-2 z-50 mt-1 animate-fade-in space-y-1">
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('tracking');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Track Order Status
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('warranty');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Warranty & Return Policy
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('faq');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Frequently Asked Questions
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdown(null);
                        onNavigate('contact');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#111827] hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                    >
                      Contact Engineering Support
                    </button>
                  </div>
                )}
              </div>

            </nav>

            {/* Right: Search, Cart, Account, Phone & Quote CTA */}
            <div className="flex items-center gap-1 sm:gap-2.5">
              
              {/* Expanding Search Trigger / Field */}
              <div className="relative" ref={searchRef}>
                {searchOpen ? (
                  <div className="relative flex items-center">
                    <form onSubmit={handleSearchSubmit} className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search model, brand, SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-48 sm:w-72 bg-slate-50 text-xs text-[#111827] placeholder-slate-400 pl-8 pr-8 py-2 rounded-full border border-[#EDE8E1] focus:outline-none focus:border-[#F15A24] focus:ring-1 focus:ring-[#F15A24] transition-all"
                      />
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                        aria-label="Close search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Instant Suggestions Dropdown */}
                    <div className="absolute top-11 right-0 w-72 sm:w-80 bg-white border border-[#EDE8E1] rounded-2xl shadow-2xl p-2.5 z-50 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5B6472] uppercase tracking-wider mb-2 px-2">
                        <span>Product Suggestions</span>
                        {isSearching && <span className="text-[#F15A24]">Searching...</span>}
                      </div>

                      {searchSuggestions.length > 0 ? (
                        <div className="space-y-1">
                          {searchSuggestions.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setSearchOpen(false);
                                onNavigate('product', prod.id);
                              }}
                              className="p-2 hover:bg-orange-50/60 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={prod.primaryImage}
                                  alt={prod.name}
                                  className="w-8 h-8 object-contain rounded bg-white border border-slate-100 flex-shrink-0"
                                />
                                <div>
                                  <div className="text-xs font-bold text-[#111827] line-clamp-1">{prod.name}</div>
                                  <div className="text-[10px] text-[#5B6472] font-mono">{prod.modelNumber} · {prod.brand}</div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {prod.pricing.regularPrice ? (
                                  <span className="text-xs font-bold text-[#F15A24]">৳{prod.pricing.regularPrice.toLocaleString()}</span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-500">Quote</span>
                                )}
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-[#EDE8E1] text-center">
                            <button
                              onClick={handleSearchSubmit}
                              className="text-xs font-bold text-[#F15A24] hover:underline"
                            >
                              View all results for "{searchQuery}" →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-xs text-[#5B6472]">
                          {searchQuery.trim()
                            ? 'No products found. Try "Hikvision", "NVR", or "ZKTeco".'
                            : 'Start typing to search products.'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-[#111827] transition-colors"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Cart Icon with Count */}
              <button
                onClick={() => onNavigate('cart')}
                className="relative p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-[#111827] transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#F15A24] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Account Icon (hidden on small mobile, accessible via hamburger) */}
              <button
                onClick={() => onNavigate('account')}
                className="hidden sm:flex p-2.5 rounded-full hover:bg-slate-100 text-[#111827] transition-colors"
                aria-label="My Account"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Tap to Call (Wide screens) */}
              <a
                href={`tel:${settings?.phone || '+8801540535150'}`}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-orange-50 text-xs font-bold text-[#111827] hover:text-[#F15A24] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
                <span>{settings?.phone || '+880 1540-535150'}</span>
              </a>

              {/* Orange Pill "Get Quote" */}
              <button
                onClick={() => onNavigate('quote')}
                className="hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5 flex-shrink-0"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Get Quote</span>
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 rounded-full hover:bg-slate-100 text-[#111827] transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

            </div>

          </div>
        </header>
      </div>

      {/* Mobile Slide-Over Sheet (Full Height) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#EDE8E1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F15A24] flex items-center justify-center text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-heading font-black text-lg text-[#111827]">
                  Camne<span className="text-[#F15A24]">X</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-[#5B6472]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Mobile Search */}
              <form onSubmit={(e) => { handleSearchSubmit(e); setMobileMenuOpen(false); }}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search model, brand, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-[#111827] placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-full border border-[#EDE8E1] focus:outline-none focus:border-[#F15A24]"
                  />
                  <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                </div>
              </form>

              {/* Navigation Links & Accordions */}
              <div className="space-y-1 text-sm font-semibold text-[#111827]">
                
                {/* Home */}
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('home'); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                >
                  Home
                </button>

                {/* Categories Accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileAccordion('categories')}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 flex items-center justify-between transition-colors"
                  >
                    <span>Hardware Categories</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileAccordion === 'categories' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                  </button>
                  {mobileAccordion === 'categories' && (
                    <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-xl my-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => { setMobileMenuOpen(false); onNavigate('category', cat.slug); }}
                          className="w-full text-left py-2 px-2 text-xs font-medium text-[#5B6472] hover:text-[#F15A24] flex items-center justify-between"
                        >
                          <span>{cat.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                        </button>
                      ))}
                      <button
                        onClick={() => { setMobileMenuOpen(false); onNavigate('catalog'); }}
                        className="w-full text-left py-2 px-2 text-xs font-bold text-[#F15A24] hover:underline"
                      >
                        Browse All Products →
                      </button>
                    </div>
                  )}
                </div>

                {/* Solutions Accordion */}
                <div>
                  <button
                    onClick={() => toggleMobileAccordion('solutions')}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 flex items-center justify-between transition-colors"
                  >
                    <span>Solutions & SLA</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileAccordion === 'solutions' ? 'rotate-180 text-[#F15A24]' : 'text-slate-400'}`} />
                  </button>
                  {mobileAccordion === 'solutions' && (
                    <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-xl my-1">
                      <button
                        onClick={() => { setMobileMenuOpen(false); onNavigate('solutions'); }}
                        className="w-full text-left py-2 px-2 text-xs font-medium text-[#5B6472] hover:text-[#F15A24]"
                      >
                        Enterprise CCTV & Warehouse
                      </button>
                      <button
                        onClick={() => { setMobileMenuOpen(false); onNavigate('solutions'); }}
                        className="w-full text-left py-2 px-2 text-xs font-medium text-[#5B6472] hover:text-[#F15A24]"
                      >
                        Retail Loss Prevention
                      </button>
                      <button
                        onClick={() => { setMobileMenuOpen(false); onNavigate('solutions'); }}
                        className="w-full text-left py-2 px-2 text-xs font-medium text-[#5B6472] hover:text-[#F15A24]"
                      >
                        Biometrics & Corporate SLA
                      </button>
                    </div>
                  )}
                </div>

                {/* Packages */}
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('packages'); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 text-[#F15A24] font-bold transition-colors flex items-center justify-between"
                >
                  <span>CCTV Packages Builder</span>
                  <span className="text-[10px] bg-orange-100 text-[#F15A24] px-2 py-0.5 rounded-full font-bold">Popular</span>
                </button>

                {/* Services */}
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('services'); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                >
                  Installation & Setup Services
                </button>

                {/* Track Order */}
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('tracking'); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                >
                  Track Order
                </button>

                {/* Account */}
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('account'); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-[#F15A24] transition-colors"
                >
                  My Account
                </button>

              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EDE8E1] space-y-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('quote'); }}
                className="w-full min-h-[44px] py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                <span>Request Free Site Quote</span>
              </button>
              <a
                href={`tel:${settings?.phone || '+8801540535150'}`}
                className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 text-[#111827] font-bold text-xs rounded-full flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#F15A24]" />
                <span>Call {settings?.phone || '+880 1540-535150'}</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Bar (Call & WhatsApp) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE8E1] px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg md:hidden">
        <a
          href={`tel:${settings?.phone || '+8801540535150'}`}
          className="flex-1 min-h-[44px] px-4 py-2 bg-white border border-[#EDE8E1] hover:bg-slate-50 text-[#111827] font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Phone className="w-4 h-4 text-[#F15A24]" />
          <span>Call Now</span>
        </a>
        <a
          href={`https://wa.me/${(settings?.whatsappNumber || '8801540535150').replace(/[^0-9]/g, '')}?text=Hello%20CamneX,%20I%20need%20assistance%20with%20security%20hardware`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[44px] px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
          <span>WhatsApp</span>
        </a>
      </div>
    </>
  );
};
