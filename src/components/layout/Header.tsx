import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, ShoppingBag, Phone, Mail, Menu, X, Shield, ChevronDown, User,
  ArrowRight, Wrench, MessageCircle, Layers, CheckCircle2, Building2, HelpCircle,
  Heart, Truck, LogOut, Package as PackageIcon, Headphones
} from 'lucide-react';
import { useCartStore, useSettingsStore, useWishlistStore, useCustomerAuthStore, useAdminAuthStore } from '../../store';
import { categoryService, productService, brandService } from '../../services';
import { Category, Product, Brand } from '../../types';
import { SmartImage } from '../common/ImagePlaceholder';

interface HeaderProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentRoute }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [callPopoverOpen, setCallPopoverOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const callPopoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = useCartStore((s) => s.totalCount());
  const wishlistCount = useWishlistStore((s) => s.count());
  const loadWishlist = useWishlistStore((s) => s.loadWishlist);
  const { currentCustomer, isCustomerAuthenticated, checkCustomerAuth, logout: customerLogout } = useCustomerAuthStore();
  const { currentUser, isAdminAuthenticated, checkAuth: checkAdminAuth, logout: adminLogout } = useAdminAuthStore();
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    checkCustomerAuth();
    checkAdminAuth();
    loadWishlist(isCustomerAuthenticated);
    categoryService.getCategories().then(setCategories);
    brandService.getBrands().then(setBrands);
  }, [loadSettings, isCustomerAuthenticated]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (callPopoverRef.current && !callPopoverRef.current.contains(e.target as Node)) {
        setCallPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCallPopoverOpen(false);
        setActiveDropdown(null);
        setAccountMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
        const queryParams: any = { search: searchQuery.trim(), limit: 6 };
        const res = await productService.getProducts(queryParams);
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
      setMobileSearchOpen(false);
      onNavigate('search', searchQuery.trim());
    }
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const toggleMobileAccordion = (name: string) => {
    setMobileAccordion((prev) => (prev === name ? null : name));
  };

  const phone = settings?.phone || '+880 1540-535150';
  const email = settings?.email || 'contact@camnexbd.com';

  // Admin-driven highlights list (Settings > Top bar highlights)
  const highlights = useMemo(() => {
    const fromSettings = (settings?.topBarHighlights || [])
      .filter((h) => h.enabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (fromSettings.length > 0) return fromSettings.map((h) => h.text);

    const defaults: string[] = [];
    if (settings?.address) defaults.push(settings.address);
    if (settings?.businessHours) defaults.push(settings.businessHours);
    if (defaults.length > 0) return defaults;

    if (settings?.showSampleContent) {
      return [
        'Dhaka, Bangladesh',
        'Open Sat-Thu: 9:00 AM - 8:00 PM',
        'Direct Importer & Certified CCTV Hardware'
      ];
    }
    return [];
  }, [settings?.topBarHighlights, settings?.address, settings?.businessHours, settings?.showSampleContent]);

  const [mobileHighlightIndex, setMobileHighlightIndex] = useState(0);

  useEffect(() => {
    if (highlights.length <= 1) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      setMobileHighlightIndex((prev) => (prev + 1) % highlights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [highlights.length]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white">
      {/* 1. FULL-WIDTH SLIM TOP BAR (36px, surface-dark, 13px text) */}
      <div className="w-full bg-[#0F172A] text-[#A0A8B4] text-[13px] border-b border-white/10 h-9 relative z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Left: Tap-to-call phone, email, thin divider, then TRACK ORDER highlighted */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 flex-shrink-0">
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 text-white/90 hover:text-white font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors pl-4 border-l border-white/15"
            >
              <Mail className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>{email}</span>
            </a>

            {/* Thin vertical divider */}
            <div className="h-3.5 w-px bg-white/20" />

            {/* TRACK ORDER highlighted: 22px orange rounded icon tile + semibold white text, no button shape, no orange fill behind text */}
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="flex items-center gap-2 text-white hover:text-white/90 transition-colors cursor-pointer group"
              aria-label="Track Order"
            >
              <div className="w-[22px] h-[22px] rounded-md bg-[#F15A24] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                <Truck className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs sm:text-[13px] font-semibold text-white tracking-tight">
                Track Order
              </span>
            </button>
          </div>

          {/* Right: HIGHLIGHTS area driven by admin list */}
          {highlights.length > 0 && (
            <div className="hidden md:flex items-center overflow-hidden max-w-[480px] select-none group">
              <div className="flex items-center gap-3 text-xs text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis">
                {highlights.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />}
                    <span className="font-medium text-slate-300">{item}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Rotating Highlights Banner under Top Bar */}
      {highlights.length > 0 && (
        <div className="md:hidden w-full bg-[#162032] text-slate-300 text-[11px] py-1 px-4 border-b border-white/5 overflow-hidden text-center transition-all">
          <div key={mobileHighlightIndex} className="animate-in fade-in duration-500 font-medium truncate">
            {highlights[mobileHighlightIndex]}
          </div>
        </div>
      )}

      {/* 2. FULL-WIDTH WHITE HEADER ROW */}
      <div className="w-full bg-white border-b border-[#EDE8E1] shadow-xs">
        {/* ROW 1: Logo + EXTENDED Search Bar + Get Quote */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer focus:outline-none"
            aria-label="CamneX Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F15A24] to-[#D94D1C] flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div className="text-left">
              <span className="text-lg sm:text-xl font-black text-[#111827] tracking-tight font-heading block leading-none">
                Camne<span className="text-[#F15A24]">X</span>
              </span>
              <span className="text-[9px] font-bold text-[#5B6472] uppercase tracking-wider block mt-0.5">
                Bangladesh
              </span>
            </div>
          </button>

          {/* EXTENDED SEARCH BAR (Desktop: Takes all spare width, min ~480px) */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-[700px] min-w-[440px] lg:min-w-[480px] relative">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full flex items-center bg-[#FAF7F2] border border-[#EDE8E1] rounded-full focus-within:border-[#F15A24] focus-within:ring-2 focus-within:ring-[#F15A24]/15 focus-within:bg-white transition-all px-2 py-1"
            >
              {/* Extended Search Field */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search camera, DVR, brand, model, SKU..."
                className="flex-1 bg-transparent px-4 py-1.5 text-xs sm:text-sm text-[#111827] placeholder:text-[#5B6472] focus:outline-none"
              />

              {/* Search Submit Pill Button */}
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer shadow-xs"
                aria-label="Submit search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Instant Suggestions Dropdown (Desktop) */}
            {searchOpen && (searchQuery.trim() || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#EDE8E1] shadow-2xl overflow-hidden z-50 p-2">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-[#5B6472]">Searching hardware catalog...</div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-[#5B6472] uppercase tracking-wider px-3 py-1">
                      Matching Hardware
                    </div>
                    {searchSuggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          onNavigate('product', p.id);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#EDE8E1] flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                          <SmartImage
                            src={p.primaryImage}
                            alt=""
                            category={p.categoryId || p.category}
                            name={p.name}
                            model={p.modelNumber}
                            className="w-full h-full object-contain"
                            placeholderClassName="w-6 h-6"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5B6472] uppercase">
                            <span className="font-bold text-[#111827]">{p.brand}</span>
                            <span>•</span>
                            <span>{p.modelNumber}</span>
                          </div>
                          <div className="text-xs font-bold text-[#111827] truncate">{p.name}</div>
                        </div>
                        <div className="text-xs font-black text-[#F15A24] flex-shrink-0">
                          {p.pricing?.regularPrice ? `৳${p.pricing.regularPrice.toLocaleString()}` : 'Quote'}
                        </div>
                      </button>
                    ))}
                    <div className="pt-2 border-t border-[#EDE8E1] px-2">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full py-1.5 text-center text-xs font-bold text-[#F15A24] hover:underline"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-[#5B6472]">
                    No hardware found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Row 1 Right: Two Buttons (Primary: Get Quote / Pricing, Secondary: Call for Service) */}
          <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
            {/* Primary Orange Pill: Get Quote / Pricing (shortened to Quote below 1100px) */}
            <button
              type="button"
              onClick={() => onNavigate('quote')}
              className="min-h-[42px] px-4 lg:px-5 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs sm:text-sm rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              aria-label="Get Quote or Pricing"
            >
              <span className="hidden min-[1100px]:inline">Get Quote / Pricing</span>
              <span className="min-[1100px]:hidden">Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Secondary Outlined Pill with Phone Icon: Call for Service with Desktop Popover */}
            <div ref={callPopoverRef} className="relative">
              <button
                type="button"
                onClick={() => setCallPopoverOpen(!callPopoverOpen)}
                aria-expanded={callPopoverOpen}
                aria-haspopup="dialog"
                className="min-h-[42px] px-3.5 lg:px-4 py-2 bg-white hover:bg-[#FAF7F2] border border-[#EDE8E1] hover:border-[#F15A24] text-[#111827] font-bold text-xs sm:text-sm rounded-full transition-all shadow-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0 group"
                aria-label="Call for Service options"
              >
                <Phone className="w-3.5 h-3.5 text-[#F15A24] group-hover:scale-110 transition-transform" />
                <span className="hidden min-[1100px]:inline">Call for Service</span>
                <span className="min-[1100px]:hidden">Call</span>
              </button>

              {/* Call for Service Popover */}
              {callPopoverOpen && (
                <div
                  role="dialog"
                  aria-label="Direct Technical Support & Service Call"
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#EDE8E1] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-start justify-between mb-3 pb-2 border-b border-[#EDE8E1]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F15A24]">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#111827]">Direct Service Desk</div>
                        <div className="text-[10px] text-[#5B6472]">Certified Security Engineers</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCallPopoverOpen(false)}
                      className="p-1 rounded-full text-[#5B6472] hover:text-[#111827] hover:bg-slate-100 cursor-pointer"
                      aria-label="Close call popover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#5B6472] mb-3 leading-relaxed">
                    Need instant technical consultation, warranty service, or an urgent site survey?
                  </p>

                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm mb-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now ({phone})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCallPopoverOpen(false);
                      onNavigate('services');
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-[#5B6472] hover:text-[#F15A24] hover:underline cursor-pointer"
                  >
                    Request a call back / Book Service →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Row 1 Right: search, wishlist, cart, hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="w-10 h-10 rounded-full border border-[#EDE8E1] hover:bg-[#FAF7F2] text-[#111827] flex items-center justify-center cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('wishlist')}
              className="relative w-10 h-10 rounded-full border border-[#EDE8E1] hover:bg-[#FAF7F2] text-[#111827] flex items-center justify-center cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'text-[#F15A24] fill-[#F15A24]' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F15A24] text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className="relative w-10 h-10 rounded-full border border-[#EDE8E1] hover:bg-[#FAF7F2] text-[#111827] flex items-center justify-center cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F15A24] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 rounded-full border border-[#EDE8E1] hover:bg-[#FAF7F2] text-[#111827] flex items-center justify-center cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {mobileSearchOpen && (
          <div className="p-3 bg-[#FAF7F2] border-t border-[#EDE8E1] md:hidden">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cameras, NVRs, SKUs..."
                className="flex-1 px-4 py-2 text-xs bg-white border border-[#EDE8E1] rounded-full focus:outline-none focus:border-[#F15A24]"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#F15A24] text-white text-xs font-bold rounded-full"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* ROW 2: Nav links with dropdowns on thin bordered strip + Right Icon Cluster (Desktop) */}
        <div ref={navRef} className="hidden md:block w-full border-t border-[#EDE8E1]/80 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#111827]">
            <div className="flex items-center gap-1 lg:gap-2">
              {/* All Categories Mega Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('categories')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] font-bold transition-colors cursor-pointer"
                >
                  <Menu className="w-4 h-4 text-[#F15A24]" />
                  <span>All Categories</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5B6472]" />
                </button>

                {activeDropdown === 'categories' && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-[#EDE8E1] shadow-2xl p-3 z-50">
                    <div className="text-[10px] font-bold text-[#5B6472] uppercase tracking-wider px-2 py-1 mb-1">
                      Hardware Catalog
                    </div>
                    <div className="space-y-1">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            onNavigate('category', c.slug);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2] text-xs font-bold text-[#111827] hover:text-[#F15A24] transition-colors text-left"
                        >
                          <span>{c.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#5B6472]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Solutions */}
              <button
                type="button"
                onClick={() => onNavigate('solutions')}
                className="px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
              >
                Solutions
              </button>

              {/* Services */}
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
              >
                Services
              </button>

              {/* Packages */}
              <button
                type="button"
                onClick={() => onNavigate('packages')}
                className="px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
              >
                Packages
              </button>

              {/* Brands Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('brands')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
                >
                  <span>Brands</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5B6472]" />
                </button>

                {activeDropdown === 'brands' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl border border-[#EDE8E1] shadow-2xl p-2 z-50">
                    {brands.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setActiveDropdown(null);
                          onNavigate('brand', b.slug);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF7F2] text-xs font-bold text-[#111827] text-left"
                      >
                        <span>{b.name}</span>
                        {b.showBadge && (
                          <span className="text-[9px] font-bold text-[#F15A24] bg-orange-50 px-1.5 py-0.5 rounded-full">
                            Partner
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Support Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('support')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
                >
                  <span>Support</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5B6472]" />
                </button>

                {activeDropdown === 'support' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl border border-[#EDE8E1] shadow-2xl p-2 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { setActiveDropdown(null); onNavigate('warranty'); }}
                      className="w-full p-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                    >
                      Warranty Policy
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveDropdown(null); onNavigate('faq'); }}
                      className="w-full p-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                    >
                      FAQs & Answers
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveDropdown(null); onNavigate('contact'); }}
                      className="w-full p-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                    >
                      Contact Us
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Thin vertical divider + 40px round outlined icon buttons cluster */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-px bg-[#EDE8E1]" />

              <div className="flex items-center gap-2">
                {/* 1. Wishlist (heart + count badge) */}
                <button
                  type="button"
                  onClick={() => onNavigate('wishlist')}
                  className="relative w-10 h-10 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:bg-orange-50/40 text-[#111827] flex items-center justify-center transition-all cursor-pointer group"
                  aria-label="Wishlist"
                  title="Saved Items"
                >
                  <Heart className={`w-4 h-4 transition-colors ${wishlistCount > 0 ? 'text-[#F15A24] fill-[#F15A24]' : 'group-hover:text-[#F15A24]'}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F15A24] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {/* 2. Account (user icon with dropdown) */}
                <div ref={accountRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="w-10 h-10 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:bg-orange-50/40 text-[#111827] flex items-center justify-center transition-all cursor-pointer group"
                    aria-label="Account Menu"
                    title={isCustomerAuthenticated ? (currentCustomer?.name || 'My Account') : 'Account'}
                  >
                    <User className="w-4 h-4 text-[#111827] group-hover:text-[#F15A24] transition-colors" />
                  </button>

                  {/* Account Dropdown */}
                  {accountMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl border border-[#EDE8E1] shadow-2xl p-2 z-50 text-xs">
                      {isCustomerAuthenticated ? (
                        <>
                          <div className="px-3 py-2 border-b border-[#EDE8E1] mb-1">
                            <div className="font-bold text-[#111827] truncate">{currentCustomer?.name || 'Customer'}</div>
                            <div className="text-[11px] text-[#5B6472] truncate">{currentCustomer?.email || currentCustomer?.phone || ''}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setAccountMenuOpen(false); onNavigate('account'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                          >
                            <User className="w-3.5 h-3.5 text-[#5B6472]" />
                            <span>My Account</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAccountMenuOpen(false); onNavigate('account'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                          >
                            <PackageIcon className="w-3.5 h-3.5 text-[#5B6472]" />
                            <span>Orders</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAccountMenuOpen(false); onNavigate('wishlist'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                          >
                            <Heart className="w-3.5 h-3.5 text-[#5B6472]" />
                            <span>Wishlist ({wishlistCount})</span>
                          </button>
                          {isAdminAuthenticated && (
                            <a
                              href="/admin"
                              className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-orange-50 font-bold text-[#F15A24] border-t border-[#EDE8E1] mt-1"
                            >
                              <Shield className="w-3.5 h-3.5 text-[#F15A24]" />
                              <span>Admin dashboard</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              setAccountMenuOpen(false);
                              await customerLogout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-rose-50 font-semibold text-rose-600 border-t border-[#EDE8E1] mt-1"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-600" />
                            <span>Logout</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => { setAccountMenuOpen(false); onNavigate('account'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-[#FAF7F2] font-bold text-[#111827]"
                          >
                            <User className="w-3.5 h-3.5 text-[#F15A24]" />
                            <span>Login / Register</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAccountMenuOpen(false); onNavigate('wishlist'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-[#FAF7F2] font-semibold text-[#111827]"
                          >
                            <Heart className="w-3.5 h-3.5 text-[#5B6472]" />
                            <span>Wishlist ({wishlistCount})</span>
                          </button>
                          {isAdminAuthenticated && (
                            <a
                              href="/admin"
                              className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-xl hover:bg-orange-50 font-bold text-[#F15A24] border-t border-[#EDE8E1] mt-1"
                            >
                              <Shield className="w-3.5 h-3.5 text-[#F15A24]" />
                              <span>Admin dashboard</span>
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Cart (bag + count badge) */}
                <button
                  type="button"
                  onClick={() => onNavigate('cart')}
                  className="relative w-10 h-10 rounded-full border border-[#EDE8E1] hover:border-[#F15A24] hover:bg-orange-50/40 text-[#111827] flex items-center justify-center transition-all cursor-pointer group"
                  aria-label="Shopping Cart"
                  title="Shopping Bag"
                >
                  <ShoppingBag className="w-4 h-4 text-[#111827] group-hover:text-[#F15A24] transition-colors" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F15A24] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER SHEET */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end md:hidden">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE8E1]">
              <div className="text-base font-black text-[#111827]">
                Camne<span className="text-[#F15A24]">X</span> Navigation
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="py-4 space-y-2 flex-1">
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('home'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                Home
              </button>

              {/* Categories Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleMobileAccordion('categories')}
                  className="w-full flex items-center justify-between py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
                >
                  <span>Categories</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileAccordion === 'categories' ? 'rotate-180' : ''}`} />
                </button>
                {mobileAccordion === 'categories' && (
                  <div className="pl-4 py-1 space-y-1">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setMobileMenuOpen(false); onNavigate('category', c.slug); }}
                        className="w-full text-left py-1.5 px-3 text-xs font-semibold text-[#5B6472] hover:text-[#F15A24]"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('solutions'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                Solutions
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('services'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                Services
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('packages'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                Packages
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('wishlist'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2] flex items-center justify-between"
              >
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F15A24] text-white">
                    {wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('tracking'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#F15A24] bg-orange-50/70 rounded-xl hover:bg-orange-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F15A24]" />
                  <span>Track Order</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F15A24] text-white">
                  Live
                </span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('account'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                {isCustomerAuthenticated ? 'My Account' : 'Login / Register'}
              </button>
              {isAdminAuthenticated && (
                <a
                  href="/admin"
                  className="block w-full text-left py-2 px-3 text-sm font-bold text-[#F15A24] rounded-xl hover:bg-orange-50"
                >
                  Admin Panel
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-[#EDE8E1] space-y-2">
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); onNavigate('quote'); }}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Get Quote / Pricing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-[#EDE8E1] text-[#111827] font-bold text-xs rounded-full flex items-center justify-center gap-2 hover:bg-slate-50 shadow-xs"
              >
                <Phone className="w-4 h-4 text-[#F15A24]" />
                <span>Call for Service</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM BAR (Call for Service & Get Quote / Pricing) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE8E1] px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg md:hidden">
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="flex-1 min-h-[44px] px-4 py-2 bg-white border border-[#EDE8E1] hover:bg-slate-50 text-[#111827] font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Phone className="w-4 h-4 text-[#F15A24]" />
          <span>Call for Service</span>
        </a>
        <button
          type="button"
          onClick={() => onNavigate('quote')}
          className="flex-1 min-h-[44px] px-4 py-2 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <span>Get Quote</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
