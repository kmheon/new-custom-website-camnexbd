import React, { useState, useEffect, useRef } from 'react';
import { Phone, Search, Menu, X, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { SearchResult } from '../types';
import { apiFetch } from '../services/apiClient';

interface HeaderProps {
  onOpenQuote: (pkg?: string) => void;
  lang: 'en' | 'bn';
  setLang: (l: 'en' | 'bn') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuote, lang, setLang }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await apiFetch<SearchResult>(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
        setSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F25C2A] to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] text-white">
                    Camne<span className="text-[#F25C2A]">X</span>
                  </span>
                  <span className="bg-[#F25C2A]/20 text-[#F25C2A] border border-[#F25C2A]/30 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                    BANGLADESH
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide">
                  Security · Networking · IT
                </span>
              </div>
            </a>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold text-slate-200">
            <a href="#solutions" className="hover:text-[#F25C2A] transition-colors">Solutions</a>
            <a href="#packages" className="hover:text-[#F25C2A] transition-colors">Packages</a>
            <a href="#projects" className="hover:text-[#F25C2A] transition-colors">Projects</a>
            <a href="#why-us" className="hover:text-[#F25C2A] transition-colors">Why Us</a>
            <a href="#faq" className="hover:text-[#F25C2A] transition-colors">FAQ</a>
            <a href="#quote-calculator" className="hover:text-[#F25C2A] transition-colors">Contact</a>
          </nav>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex relative flex-1 max-w-xs mx-4" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search CCTV, Wi-Fi, ZKTeco..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery) setSearchOpen(true); }}
                className="w-full bg-slate-900/90 text-sm text-white placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-[#F25C2A] focus:ring-1 focus:ring-[#F25C2A] transition-all"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-orange-400 animate-spin" />
              )}
            </div>

            {/* Live Search Dropdown */}
            {searchOpen && searchResults && (
              <div className="absolute top-12 left-0 right-0 bg-[#0B1220] border border-slate-700 rounded-xl shadow-2xl p-3 z-50 max-h-96 overflow-y-auto">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Search Results
                </div>

                {/* Packages */}
                {searchResults.packages?.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-orange-400 px-2 block mb-1">CCTV Packages</span>
                    {searchResults.packages.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onOpenQuote(p.name);
                          setSearchOpen(false);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <span className="text-xs text-white font-medium">{p.name}</span>
                        <span className="text-xs text-[#F25C2A] font-bold">৳{p.base_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Services */}
                {searchResults.services?.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-blue-400 px-2 block mb-1">Services</span>
                    {searchResults.services.map((s, idx) => (
                      <a
                        key={idx}
                        href="#solutions"
                        onClick={() => setSearchOpen(false)}
                        className="p-2 hover:bg-slate-800 rounded-lg block transition-colors"
                      >
                        <div className="text-xs text-white font-medium">{s.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{s.description}</div>
                      </a>
                    ))}
                  </div>
                )}

                {/* Products */}
                {searchResults.products?.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 px-2 block mb-1">Hardware</span>
                    {searchResults.products.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onOpenQuote(p.name);
                          setSearchOpen(false);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="text-xs text-white font-medium">{p.name} ({p.model})</div>
                        <div className="text-xs text-slate-300 font-semibold">৳{p.price.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}

                {(!searchResults.packages?.length && !searchResults.services?.length && !searchResults.products?.length) && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No results found. Contact us directly for a custom solution.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Area */}
          <div className="hidden lg:flex items-center gap-4">
            
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-[#F25C2A] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('bn')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'bn' ? 'bg-[#F25C2A] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                বাংলা
              </button>
            </div>

            {/* Direct Phone Call */}
            <a
              href="tel:+8801540535150"
              className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[#F25C2A]">
                <Phone className="w-4 h-4" />
              </div>
              <span>+880 1540-535150</span>
            </a>

            {/* Primary Quote CTA Button */}
            <button
              onClick={() => onOpenQuote()}
              className="bg-[#F25C2A] hover:bg-[#D84818] text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-[#F25C2A]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Quote
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-2 py-1 bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 rounded"
            >
              {lang === 'en' ? 'বাংলা' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1220] border-b border-slate-800 px-4 pt-3 pb-6 space-y-4">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-sm text-white placeholder-slate-400 pl-9 pr-4 py-2.5 rounded-xl border border-slate-700"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-col space-y-3 font-semibold text-base">
            <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-[#F25C2A] py-1">Solutions</a>
            <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-[#F25C2A] py-1">Packages</a>
            <a href="#projects" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-[#F25C2A] py-1">Projects</a>
            <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-[#F25C2A] py-1">Why Us</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-[#F25C2A] py-1">FAQ</a>
            <a href="#quote-calculator" onClick={() => setMobileMenuOpen(false)} className="text-slate-200 hover:text-[#F25C2A] py-1">Contact</a>
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
            <a
              href="tel:+8801540535150"
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-sm"
            >
              <Phone className="w-4 h-4 text-[#F25C2A]" />
              Call +880 1540-535150
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuote();
              }}
              className="w-full py-3 bg-[#F25C2A] font-bold text-white text-sm rounded-xl text-center shadow-lg shadow-orange-500/20"
            >
              Get Quote
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
