import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Phone, Menu, X, Shield, ChevronDown, User, Layers, ArrowRight, Wrench } from 'lucide-react';
import { useCartStore, useSettingsStore } from '../../store';
import { categoryService, productService } from '../../services';
import { Category, Product } from '../../types';

interface HeaderProps {
  onNavigate: (route: string, param?: string) => void;
  currentRoute: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentRoute }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const totalCartCount = useCartStore((s) => s.totalCount());
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    categoryService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setSearchOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      onNavigate('search', searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111827] text-white border-b border-slate-800 shadow-lg">
      
      {/* Sample Data Notice Banner (if enabled) */}
      {settings?.sampleDataBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
          <span>⚠️ <strong>Demo Mode:</strong> Products, packages and case studies are populated with clearly labeled sample data.</span>
          <button
            onClick={() => onNavigate('admin', 'settings')}
            className="underline hover:text-white font-bold ml-1"
          >
            Manage in Admin
          </button>
        </div>
      )}

      {/* Storefront Promo / Announcement Banner (if enabled) */}
      {settings?.promoBanner?.enabled && settings?.promoBanner?.text && (
        <div className="bg-[#F15A24] text-white text-xs py-1.5 px-4 text-center font-medium shadow-sm">
          {settings.promoBanner.link ? (
            <a href={settings.promoBanner.link} className="hover:underline flex items-center justify-center gap-1">
              <span>{settings.promoBanner.text}</span>
            </a>
          ) : (
            <span>{settings.promoBanner.text}</span>
          )}
        </div>
      )}

      {/* Top Utility Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 text-xs text-slate-400 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F15A24]"></span>
              <strong className="text-slate-300 font-semibold">Authorized Partner:</strong> Hikvision & ZKTeco
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline">Dhaka Engineering & Installation Center</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${settings?.phone || '+8801540535150'}`}
              className="flex items-center gap-1.5 text-slate-300 hover:text-[#F15A24] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
              <span className="font-bold">{settings?.phone || '+880 1540-535150'}</span>
            </a>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-slate-400 hover:text-white font-medium flex items-center gap-1"
            >
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus:outline-none group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F15A24] to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight font-heading text-white">
                  Camne<span className="text-[#F15A24]">X</span>
                </span>
                <span className="bg-[#F15A24]/20 text-[#F15A24] text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-[#F15A24]/30">
                  BANGLADESH
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Security · Surveillance · Networking
              </span>
            </div>
          </button>

          {/* Search Bar with Instant Autocomplete */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-2" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search camera model, SKU, switch, ZKTeco..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery) setSearchOpen(true); }}
                className="w-full bg-slate-900 text-sm text-white placeholder-slate-400 pl-10 pr-20 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-[#F15A24] focus:ring-1 focus:ring-[#F15A24] transition-all"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold rounded-lg transition-colors"
              >
                Search
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {searchOpen && (
              <div className="absolute top-12 left-0 right-0 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
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
                        className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod.primaryImage}
                            alt={prod.name}
                            className="w-9 h-9 object-cover rounded bg-slate-800 flex-shrink-0"
                          />
                          <div>
                            <div className="text-xs font-bold text-white line-clamp-1">{prod.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{prod.modelNumber} · {prod.brand}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {prod.pricing.regularPrice ? (
                            <span className="text-xs font-extrabold text-[#F15A24]">৳{prod.pricing.regularPrice.toLocaleString()}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Quote</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-800 text-center">
                      <button
                        onClick={handleSearchSubmit}
                        className="text-xs font-bold text-[#F15A24] hover:underline"
                      >
                        View all results for "{searchQuery}" →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching products found. Try model numbers like "DS-2CE" or "MB20".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            
            {/* Package Builder Link */}
            <button
              onClick={() => onNavigate('packages')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <Layers className="w-4 h-4 text-[#F15A24]" />
              <span>Package Builder</span>
            </button>

            {/* Request Quote Button */}
            <button
              onClick={() => onNavigate('quote')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Get Quote</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-slate-200" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F15A24] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-[#111827]">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Account Button */}
            <button
              onClick={() => onNavigate('account')}
              className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition-colors"
              aria-label="My Account"
            >
              <User className="w-5 h-5 text-slate-200" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Desktop Secondary Menu / Category Mega Menu Bar */}
        <div className="hidden lg:flex items-center justify-between border-t border-slate-800 py-2.5 text-xs font-semibold text-slate-300">
          <div className="flex items-center space-x-6">
            
            {/* Category Dropdown Toggle */}
            <div className="relative" onMouseLeave={() => setMegaMenuOpen(false)}>
              <button
                onMouseEnter={() => setMegaMenuOpen(true)}
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="flex items-center gap-1.5 text-white font-bold hover:text-[#F15A24] transition-colors py-1"
              >
                <span>All Categories</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {megaMenuOpen && (
                <div className="absolute top-full left-0 w-72 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setMegaMenuOpen(false);
                        onNavigate('category', cat.slug);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-[#F15A24] flex items-center justify-between transition-colors"
                    >
                      <span>{cat.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  ))}
                  <div className="pt-2 border-t border-slate-800 mt-1">
                    <button
                      onClick={() => {
                        setMegaMenuOpen(false);
                        onNavigate('catalog');
                      }}
                      className="w-full text-center text-[11px] font-bold text-[#F15A24] py-1.5 hover:underline"
                    >
                      Browse Complete Catalog →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => onNavigate('category', 'cctv-cameras')} className="hover:text-white transition-colors">
              CCTV Cameras
            </button>
            <button onClick={() => onNavigate('category', 'dvr-nvr-recorders')} className="hover:text-white transition-colors">
              DVR & NVR
            </button>
            <button onClick={() => onNavigate('category', 'biometrics-access-control')} className="hover:text-white transition-colors">
              Biometrics & Access
            </button>
            <button onClick={() => onNavigate('category', 'network-switches')} className="hover:text-white transition-colors">
              Network Switches
            </button>
            <button onClick={() => onNavigate('category', 'access-points-wifi')} className="hover:text-white transition-colors">
              Wi-Fi & Mesh
            </button>
            <button onClick={() => onNavigate('packages')} className="text-orange-400 font-bold hover:text-orange-300 transition-colors">
              CCTV Packages
            </button>
          </div>

          <div className="flex items-center space-x-5 text-slate-400">
            <button onClick={() => onNavigate('solutions')} className="hover:text-white transition-colors">
              Solutions & SLA
            </button>
            <button onClick={() => onNavigate('tracking')} className="hover:text-white transition-colors">
              Track Order
            </button>
            <button onClick={() => onNavigate('account')} className="hover:text-white transition-colors flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111827] border-t border-slate-800 px-5 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-sm text-white placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-700"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </form>

          <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-200">
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('home'); }} className="text-left py-2 hover:text-[#F15A24]">
              Home
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('catalog'); }} className="text-left py-2 hover:text-[#F15A24]">
              All Hardware Catalog
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('cart'); }} className="text-left py-2 hover:text-[#F15A24] flex items-center justify-between">
              <span>Shopping Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-[#F15A24] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              )}
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('packages'); }} className="text-left py-2 text-orange-400 font-bold">
              CCTV Packages & Estimator
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('quote'); }} className="text-left py-2 hover:text-[#F15A24]">
              Request Site Survey / Quote
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('solutions'); }} className="text-left py-2 hover:text-[#F15A24]">
              Engineering Solutions
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('tracking'); }} className="text-left py-2 hover:text-[#F15A24]">
              Track Order
            </button>
            <button onClick={() => { setMobileMenuOpen(false); onNavigate('admin'); }} className="text-left py-2 text-slate-400">
              Admin Dashboard
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <a
              href={`tel:${settings?.phone || '+8801540535150'}`}
              className="w-full py-3 bg-[#F15A24] font-bold text-white text-sm rounded-xl flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call {settings?.phone || '+880 1540-535150'}
            </a>
          </div>
        </div>
      )}

    </header>
  );
};
