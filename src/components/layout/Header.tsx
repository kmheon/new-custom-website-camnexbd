import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingBag, Phone, Mail, Menu, X, Shield, ChevronDown, User,
  ArrowRight, Wrench, MessageCircle, Layers, CheckCircle2, Building2, HelpCircle
} from 'lucide-react';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryScope, setSelectedCategoryScope] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalCartCount = useCartStore((s) => s.totalCount());
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    categoryService.getCategories().then(setCategories);
    brandService.getBrands().then(setBrands);
  }, [loadSettings]);

  // Click outside to close search suggestions and nav dropdowns
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
        const queryParams: any = { search: searchQuery.trim(), limit: 6 };
        if (selectedCategoryScope) {
          queryParams.category = selectedCategoryScope;
        }
        const res = await productService.getProducts(queryParams);
        setSearchSuggestions(res.items);
      } finally {
        setIsSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategoryScope]);

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

  return (
    <header className="sticky top-0 z-40 w-full bg-white">
      {/* 1. FULL-WIDTH SLIM TOP BAR (36px, surface-dark, 13px text) */}
      <div className="w-full bg-[#141210] text-[#A0A8B4] text-[13px] border-b border-white/10 h-9 relative z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Left: Tap-to-call phone and email */}
          <div className="flex items-center gap-3 sm:gap-6">
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
          </div>

          {/* Right: Track Order, Account/Login, Admin Panel */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate('tracking')}
              className="hidden md:flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <span>Track Order</span>
            </button>

            <button
              onClick={() => onNavigate('account')}
              className="flex items-center gap-1.5 text-white/90 hover:text-white font-medium transition-colors cursor-pointer md:pl-3 md:border-l md:border-white/15"
            >
              <User className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>Account</span>
            </button>

            <a
              href="/admin"
              className="hidden md:flex items-center gap-1.5 text-white/80 hover:text-[#F15A24] font-medium transition-colors pl-3 border-l border-white/15"
            >
              <Shield className="w-3.5 h-3.5 text-[#F15A24]" />
              <span>Admin Panel</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. FULL-WIDTH WHITE HEADER ROW */}
      <div className="w-full bg-white border-b border-[#EDE8E1] shadow-xs">
        {/* ROW 1: Logo + EXTENDED Search Bar + Cart + Get Quote */}
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
              {/* Category Scope Dropdown */}
              <select
                value={selectedCategoryScope}
                onChange={(e) => setSelectedCategoryScope(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#111827] pl-2 pr-1 py-1.5 focus:outline-none cursor-pointer border-r border-[#EDE8E1] max-w-[130px] truncate"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>

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
                className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[#111827] placeholder:text-[#5B6472] focus:outline-none"
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
                        <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#EDE8E1] flex items-center justify-center p-1 flex-shrink-0">
                          {p.primaryImage ? (
                            <img src={p.primaryImage} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Search className="w-4 h-4 text-[#5B6472]" />
                          )}
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

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-full hover:bg-[#FAF7F2] text-[#111827] md:hidden cursor-pointer"
              aria-label="Toggle Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2.5 rounded-full hover:bg-[#FAF7F2] text-[#111827] transition-colors cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#F15A24] text-white text-[10px] font-black flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Desktop Orange Get Quote Pill */}
            <button
              onClick={() => onNavigate('quote')}
              className="hidden sm:flex min-h-[44px] px-5 py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs sm:text-sm rounded-full transition-all shadow-sm items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <span>Get Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-[#FAF7F2] text-[#111827] md:hidden cursor-pointer"
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

        {/* ROW 2: Nav links with dropdowns on thin bordered strip (Desktop) */}
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

            {/* Quick Consultation Tag */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#5B6472]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dhaka On-Site Surveys & Concealed Wiring</span>
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
                onClick={() => { setMobileMenuOpen(false); onNavigate('tracking'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                Track Order
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('account'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-[#111827] rounded-xl hover:bg-[#FAF7F2]"
              >
                Account
              </button>
              <a
                href="/admin"
                className="block w-full text-left py-2 px-3 text-sm font-bold text-[#F15A24] rounded-xl hover:bg-orange-50"
              >
                Admin Panel
              </a>
            </div>

            <div className="pt-4 border-t border-[#EDE8E1]">
              <a
                href={`tel:${phone}`}
                className="w-full min-h-[44px] px-4 py-2.5 bg-[#F15A24] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call {phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM BAR (Call & WhatsApp) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE8E1] px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg md:hidden">
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="flex-1 min-h-[44px] px-4 py-2 bg-white border border-[#EDE8E1] hover:bg-slate-50 text-[#111827] font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Phone className="w-4 h-4 text-[#F15A24]" />
          <span>Call Now</span>
        </a>
        <a
          href={`https://wa.me/${(settings?.whatsappNumber || '8801540535150').replace(/[^0-9]/g, '')}?text=Hello%20CamneX,%20I%20need%20assistance%20with%20security%20hardware`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[44px] px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
          <span>WhatsApp</span>
        </a>
      </div>
    </header>
  );
};
