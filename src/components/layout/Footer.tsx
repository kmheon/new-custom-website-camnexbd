import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUp,
  ChevronDown,
  Shield,
  MessageCircle,
  Lock,
  X
} from 'lucide-react';
import { useSettingsStore } from '../../store';
import { FooterLinkItem } from '../../types';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSettingsStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stickyBarHeight, setStickyBarHeight] = useState<number>(0);
  const [waExpanded, setWaExpanded] = useState<boolean>(false);
  const waContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamically observe the mobile sticky purchase bar height
  useEffect(() => {
    const updateBarHeight = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setStickyBarHeight(0);
        return;
      }
      const productBar = document.querySelector('[data-testid="product-sticky-bar"], #product-sticky-bar');
      if (productBar) {
        const rect = productBar.getBoundingClientRect();
        setStickyBarHeight(Math.round(rect.height));
        return;
      }
      const headerBar = document.querySelector('#mobile-service-bar, [data-testid="mobile-service-bar"], header div[class*="bottom-0"]');
      if (headerBar) {
        const rect = headerBar.getBoundingClientRect();
        setStickyBarHeight(Math.round(rect.height));
        return;
      }
      setStickyBarHeight(0);
    };

    updateBarHeight();
    window.addEventListener('resize', updateBarHeight);
    const observer = new MutationObserver(updateBarHeight);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateBarHeight);
      observer.disconnect();
    };
  }, []);

  // Close WhatsApp popover on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (waContainerRef.current && !waContainerRef.current.contains(e.target as Node)) {
        setWaExpanded(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWaExpanded(false);
    };
    if (waExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [waExpanded]);

  // Mobile accordion state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    quick: false,
    products: false,
    support: false
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const phone = settings?.phone || '+880 1540-535150';
  const email = settings?.email || 'contact@camnexbd.com';
  const address = settings?.address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207';
  const businessHours = settings?.businessHours || 'Sat-Thu 9:30 AM - 7:30 PM, Friday on-call';
  const whatsappNumber = settings?.whatsappNumber || '8801540535150';

  const footerConfig = settings?.footer;

  const quickLinks: FooterLinkItem[] = footerConfig?.quickLinks || [
    { label: 'Home', route: 'home' },
    { label: 'Products', route: 'catalog' },
    { label: 'Brands', route: 'brands' },
    { label: 'Solutions', route: 'solutions' },
    { label: 'Installation Services', route: 'services' },
    { label: 'Packages', route: 'packages' },
    { label: 'Company Profile', route: 'company_profile' },
    { label: 'Projects & Portfolio', route: 'projects' },
    { label: 'Why Choose Us', route: 'why_choose_us' },
    { label: 'Certifications & Compliance', route: 'certifications' }
  ];

  const productsLinks: FooterLinkItem[] = footerConfig?.products || [
    { label: 'CCTV & IP Cameras', route: 'category', param: 'cctv-cameras' },
    { label: 'DVR & NVR Recorders', route: 'category', param: 'dvr-nvr-recorders' },
    { label: 'Biometrics & Access', route: 'category', param: 'biometrics-access-control' },
    { label: 'Network Switches', route: 'category', param: 'network-switches' },
    { label: 'Wi-Fi Cameras & APs', route: 'category', param: 'wifi-cameras' },
    { label: 'Storage & Hard Drives', route: 'category', param: 'cctv-accessories' }
  ];

  const supportLinks: FooterLinkItem[] = footerConfig?.customerSupport || [
    { label: 'Warranty Policy', route: 'warranty' },
    { label: 'Technical Support', route: 'contact' },
    { label: 'FAQs', route: 'faq' },
    { label: 'Track Order', route: 'tracking' },
    { label: 'Privacy Policy', route: 'privacy' },
    { label: 'Terms & Conditions', route: 'terms' },
    { label: 'Refund Policy', route: 'refund' }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newsletterEmail.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('');
    try {
      fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'footer_form' })
      }).catch(() => {});
    } catch (_) {}
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterSubscribed(false);
    }, 6000);
  };

  const handleLinkClick = (link: FooterLinkItem) => {
    if (link.external) {
      window.open(link.external, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate(link.route, link.param);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20CamneX%20Bangladesh%2C%20I%20would%20like%20to%20inquire%20about%20a%20security%20solution`;

  return (
    <>
      {/* FULL-WIDTH FOOTER (#0F172A dark navy blue) FLUSH TO BOTTOM */}
      <footer id="site-footer" className="w-full bg-[#0F172A] text-white m-0 p-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          
          {/* Top Row: "Stay updated" Newsletter Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 sm:pb-10 border-b border-white/10">
            <div className="max-w-md">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F15A24] block mb-1">
                Product Updates
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-white">
                Get product news and offers
              </h3>
              <p className="text-xs sm:text-sm text-[#A0A8B4] mt-1">
                Receive new product releases and genuine hardware announcements. No spam.
              </p>
            </div>

            {/* Newsletter Input + Attached Orange Subscribe Button */}
            <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto flex-1 max-w-md">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter your email address"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#F15A24] focus:ring-1 focus:ring-[#F15A24] transition-all"
                  />
                  {emailError && (
                    <span className="absolute -bottom-5 left-2 text-[11px] text-red-400">
                      {emailError}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center flex-shrink-0"
                >
                  {newsletterSubscribed ? 'Subscribed!' : 'Subscribe'}
                </button>
              </div>
            </form>
          </div>

          {/* Main Content Grid: Brand Block (Left) + 3 Link Columns (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 py-8 sm:py-10 border-b border-white/10">
            
            {/* Brand Block (Left, spans 5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F15A24] to-[#D94D1C] flex items-center justify-center text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-white font-heading">
                    Camne<span className="text-[#F15A24]">X</span>
                  </span>
                  <span className="text-[10px] text-[#A0A8B4] block font-medium">
                    BANGLADESH
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#A0A8B4] leading-relaxed max-w-sm">
                {footerConfig?.description || 'Authorized partner and professional installer for Hikvision and ZKTeco in Bangladesh. Enterprise CCTV surveillance, structured networking, and biometric access control.'}
              </p>

              {/* Contact list with small line icons */}
              <div className="space-y-2 text-xs text-[#CBD5E1] pt-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                  <a
                    href="https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="leading-snug hover:text-white transition-colors"
                  >
                    {address}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#F15A24] shrink-0" />
                  <div className="flex flex-wrap items-center gap-x-2">
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors font-bold">
                      {phone}
                    </a>
                    <span className="text-slate-500">·</span>
                    <a href="tel:+8801410085848" className="hover:text-white transition-colors">
                      +880 1410-085848
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#F15A24] shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-[#A0A8B4]">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{businessHours}</span>
                </div>
              </div>
            </div>

            {/* 3 Link Columns (Right, spans 7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Column 1: Quick Links */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('quick')}
                  className="w-full flex items-center justify-between text-left md:pointer-events-none pb-2 border-b border-white/10 md:border-none"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Quick Links
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${openAccordions.quick ? 'rotate-180 text-[#F15A24]' : ''}`} />
                </button>
                <div className={`space-y-2 pt-2 text-xs text-[#A0A8B4] ${openAccordions.quick ? 'block' : 'hidden md:block'}`}>
                  {quickLinks.map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLinkClick(link)}
                      className="block text-left w-full hover:text-white hover:translate-x-0.5 transition-all py-0.5"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Products */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('products')}
                  className="w-full flex items-center justify-between text-left md:pointer-events-none pb-2 border-b border-white/10 md:border-none"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Products
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${openAccordions.products ? 'rotate-180 text-[#F15A24]' : ''}`} />
                </button>
                <div className={`space-y-2 pt-2 text-xs text-[#A0A8B4] ${openAccordions.products ? 'block' : 'hidden md:block'}`}>
                  {productsLinks.map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLinkClick(link)}
                      className="block text-left w-full hover:text-white hover:translate-x-0.5 transition-all py-0.5"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: Customer Support */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleAccordion('support')}
                  className="w-full flex items-center justify-between text-left md:pointer-events-none pb-2 border-b border-white/10 md:border-none"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Support
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${openAccordions.support ? 'rotate-180 text-[#F15A24]' : ''}`} />
                </button>
                <div className={`space-y-2 pt-2 text-xs text-[#A0A8B4] ${openAccordions.support ? 'block' : 'hidden md:block'}`}>
                  {supportLinks.map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`footer-support-${link.route}`}
                      onClick={() => handleLinkClick(link)}
                      className="block text-left w-full hover:text-white hover:translate-x-0.5 transition-all py-0.5 cursor-pointer"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Bar: Copyright on Left, Legal Links on Right - padded on right so text never collides with floating buttons */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A0A8B4] pr-28 sm:pr-36">
            <div className="flex flex-wrap items-center gap-3">
              <span>{footerConfig?.copyrightText || '© 2026 CamneX Bangladesh. All rights reserved.'}</span>
              <span className="text-white/20">|</span>
              <a
                href={(settings as any)?.staffAppUrl || '/staff'}
                rel="nofollow"
                aria-label="Staff login"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[#A0A8B4] hover:text-white hover:border-slate-500 text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Staff login</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              <button
                type="button"
                data-testid="footer-legal-privacy"
                onClick={() => onNavigate('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                data-testid="footer-legal-terms"
                onClick={() => onNavigate('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                data-testid="footer-legal-refund"
                onClick={() => onNavigate('refund')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Refund Policy
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* FLOATING ACTION BUTTONS */}
      {/* 1. WHATSAPP (Compact floating control on mobile positioned above sticky purchase bar; full circle on desktop) */}
      {(() => {
        const mobileBottomOffset = stickyBarHeight > 0 ? stickyBarHeight + 12 : 76;
        const mobileStyle = { bottom: `calc(${mobileBottomOffset}px + env(safe-area-inset-bottom, 0px))` };

        return (
          <>
            <div
              ref={waContainerRef}
              data-testid="floating-whatsapp-container"
              className="fixed z-40 right-3.5 md:right-8 transition-all duration-200 md:bottom-8"
              style={typeof window !== 'undefined' && window.innerWidth < 768 ? mobileStyle : undefined}
            >
              {/* Expanded Popover Card on Mobile */}
              {waExpanded && (
                <div
                  id="wa-expanded-popover"
                  data-testid="wa-expanded-popover"
                  className="md:hidden absolute bottom-full right-0 mb-2.5 w-64 max-w-[calc(100vw-28px)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 text-slate-800"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800 font-heading">CamneX Support</span>
                    </div>
                    <button
                      type="button"
                      data-testid="wa-close-popover-btn"
                      onClick={() => setWaExpanded(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                      aria-label="Close WhatsApp popover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 my-2 leading-relaxed">
                    Connect directly with our engineering desk in Dhaka for hardware inquiries and project pricing.
                  </p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="wa-direct-chat-btn"
                    onClick={() => setWaExpanded(false)}
                    className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                    <span>Open WhatsApp Chat</span>
                  </a>
                </div>
              )}

              <a
                id="floating-whatsapp"
                data-testid="floating-whatsapp"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (window.innerWidth < 768) {
                    e.preventDefault();
                    setWaExpanded((prev) => !prev);
                  }
                }}
                aria-expanded={waExpanded ? 'true' : 'false'}
                aria-label="Chat on WhatsApp"
                className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-white shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 fill-white text-[#25D366]" />
              </a>
            </div>

            {/* 2. BACK TO TOP (Positioned on the left side on mobile, stacked above WhatsApp on desktop) */}
            {showScrollTop && (
              <button
                id="floating-back-to-top"
                data-testid="floating-back-to-top"
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                style={typeof window !== 'undefined' && window.innerWidth < 768 ? mobileStyle : undefined}
                className="fixed z-40 left-3.5 md:left-auto md:right-[38px] w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#0F172A] hover:bg-[#F15A24] border border-white/20 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 focus:outline-none md:bottom-[100px]"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </>
        );
      })()}
    </>
  );
};
