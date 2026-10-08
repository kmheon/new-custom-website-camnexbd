import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ExternalLink
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

  // Mobile accordion open states (default closed or open)
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
  const facebookUrl = settings?.facebookUrl || 'https://facebook.com/camnexbd';
  const youtubeUrl = settings?.youtubeUrl || 'https://youtube.com/@camnexbd';
  const linkedinUrl = settings?.linkedinUrl || 'https://linkedin.com/company/camnexbd';
  const whatsappNumber = settings?.whatsappNumber || '8801540535150';

  const footerConfig = settings?.footer;

  const quickLinks: FooterLinkItem[] = footerConfig?.quickLinks || [
    { label: 'Home', route: 'home' },
    { label: 'Shop', route: 'catalog' },
    { label: 'Solutions', route: 'solutions' },
    { label: 'Services', route: 'services' },
    { label: 'Installations', route: 'projects' },
    { label: 'About Us', route: 'about' },
    { label: 'Contact', route: 'contact' }
  ];

  const productsLinks: FooterLinkItem[] = footerConfig?.products || [
    { label: 'CCTV Cameras', route: 'category', param: 'cctv-cameras' },
    { label: 'IP Cameras', route: 'category', param: 'cctv-cameras' },
    { label: 'Network Equipment', route: 'category', param: 'network-switches' },
    { label: 'Access Control', route: 'category', param: 'biometrics-access-control' },
    { label: 'Time Attendance', route: 'category', param: 'biometrics-access-control' },
    { label: 'Smart Home', route: 'category', param: 'cctv-cameras' },
    { label: 'Accessories', route: 'category', param: 'cctv-accessories' }
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
      setEmailError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    setEmailError('');
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

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const waUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20CamneX%20Bangladesh%2C%20I%20would%20like%20to%20inquire%20about%20a%20security%20solution`;

  return (
    <>
      {/* REDESIGNED FOOTER (clean, calm, no glow effects) */}
      <footer className="bg-[#111827] text-[#CBD5E1] pt-[64px] pb-24 md:pb-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Desktop: 12-column grid. Brand: 4, Quick Links: 2, Products: 2, Support: 2, Stay Updated: 2 */}
          {/* Tablet: 2 columns. Mobile: single column with accordions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-12">
            
            {/* 1. Brand Column (spans 4 on desktop) */}
            <div className="space-y-4 lg:col-span-4">
              {/* 1. CamneX logo */}
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white font-['Plus_Jakarta_Sans'] tracking-tight">
                  CamneX
                </span>
              </div>

              {/* 2. Two-line company description from Site Settings */}
              <p className="text-[15px] text-[#CBD5E1] leading-relaxed line-clamp-2 max-w-sm">
                {footerConfig?.description || 'Security, surveillance, enterprise networking and IT infrastructure engineering in Dhaka, Bangladesh.'}
              </p>

              {/* 3. Contact list with small orange line icons */}
              <div className="space-y-[14px] text-[15px] pt-1">
                {/* Phone (tap to call) */}
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#F15A24] shrink-0" />
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors"
                  >
                    {phone}
                  </a>
                </div>

                {/* Email (tap to mail) */}
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#F15A24] shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors break-all"
                  >
                    {email}
                  </a>
                </div>

                {/* Hours "Sat-Thu 9:30 AM - 7:30 PM, Friday on-call" (hide if empty) */}
                {businessHours && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#F15A24] shrink-0" />
                    <span className="text-[#CBD5E1]">
                      {businessHours}
                    </span>
                  </div>
                )}

                {/* 4. Address as plain text with a pin icon, written once: NO boxed or glowing card, NO "OFFICE LOCATION" badge */}
                <div className="flex items-start gap-2.5 pt-0.5">
                  <MapPin className="w-4 h-4 text-[#F15A24] shrink-0 mt-1" />
                  <div className="text-[15px] text-[#CBD5E1] leading-relaxed">
                    <span>{address}</span>
                    <div className="pt-1">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#F15A24] hover:text-[#ff7442] hover:underline text-sm font-medium transition-colors"
                      >
                        <span>Get directions</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Social icons (40px circles, aria-labelled): Facebook, YouTube, LinkedIn, WhatsApp. Show only ones with URL */}
              <div className="pt-2 flex items-center gap-3">
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-[#F15A24] hover:border-[#F15A24] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}

                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-[#F15A24] hover:border-[#F15A24] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm"
                    aria-label="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-[#F15A24] hover:border-[#F15A24] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}

                {whatsappNumber && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:bg-[#25D366] hover:border-[#25D366] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* 2. Quick Links (spans 2 on desktop; accordion on mobile) */}
            <div className="lg:col-span-2 border-b border-slate-800 md:border-b-0 pb-4 md:pb-0">
              {/* Mobile accordion trigger */}
              <button
                type="button"
                onClick={() => toggleAccordion('quick')}
                className="w-full flex md:hidden items-center justify-between text-white text-[18px] font-semibold py-2 text-left"
              >
                <span>Quick Links</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openAccordions.quick ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop heading */}
              <h3 className="hidden md:block text-white text-[18px] font-semibold font-['Plus_Jakarta_Sans'] mb-4">
                Quick Links
              </h3>

              {/* Link items */}
              <div className={`${openAccordions.quick ? 'block pt-2' : 'hidden'} md:block`}>
                <ul className="space-y-[14px]">
                  {quickLinks.map((link, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => handleLinkClick(link)}
                        className="text-[15px] text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. Products (spans 2 on desktop; accordion on mobile) */}
            <div className="lg:col-span-2 border-b border-slate-800 md:border-b-0 pb-4 md:pb-0">
              {/* Mobile accordion trigger */}
              <button
                type="button"
                onClick={() => toggleAccordion('products')}
                className="w-full flex md:hidden items-center justify-between text-white text-[18px] font-semibold py-2 text-left"
              >
                <span>Products</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openAccordions.products ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop heading */}
              <h3 className="hidden md:block text-white text-[18px] font-semibold font-['Plus_Jakarta_Sans'] mb-4">
                Products
              </h3>

              {/* Link items */}
              <div className={`${openAccordions.products ? 'block pt-2' : 'hidden'} md:block`}>
                <ul className="space-y-[14px]">
                  {productsLinks.map((link, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => handleLinkClick(link)}
                        className="text-[15px] text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Support (spans 2 on desktop; accordion on mobile) */}
            <div className="lg:col-span-2 border-b border-slate-800 md:border-b-0 pb-4 md:pb-0">
              {/* Mobile accordion trigger */}
              <button
                type="button"
                onClick={() => toggleAccordion('support')}
                className="w-full flex md:hidden items-center justify-between text-white text-[18px] font-semibold py-2 text-left"
              >
                <span>Support</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openAccordions.support ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop heading */}
              <h3 className="hidden md:block text-white text-[18px] font-semibold font-['Plus_Jakarta_Sans'] mb-4">
                Support
              </h3>

              {/* Link items */}
              <div className={`${openAccordions.support ? 'block pt-2' : 'hidden'} md:block`}>
                <ul className="space-y-[14px]">
                  {supportLinks.map((link, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => handleLinkClick(link)}
                        className="text-[15px] text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5. Stay Updated Column (spans 2 on desktop) */}
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-white text-[18px] font-semibold font-['Plus_Jakarta_Sans']">
                Stay Updated
              </h3>

              <p className="text-[15px] text-[#CBD5E1] leading-relaxed">
                {footerConfig?.newsletterText || 'Subscribe for security updates, product alerts, and technical tips.'}
              </p>

              {/* Email form: ONE email input (no icons inside the field) with an attached orange "Subscribe" button */}
              <form onSubmit={handleNewsletterSubmit} className="space-y-2.5 pt-1">
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter your email"
                    aria-label="Your email address"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3.5 py-2.5 text-[15px] text-white placeholder-slate-400 focus:outline-none focus:border-[#F15A24] transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#F15A24] hover:bg-[#D94D1C] text-white text-[15px] font-semibold rounded-lg transition-colors cursor-pointer text-center shadow-sm"
                  >
                    Subscribe
                  </button>
                </div>

                {emailError && (
                  <p className="text-xs text-rose-400 font-medium pt-0.5">{emailError}</p>
                )}

                {newsletterSubscribed && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Subscribed successfully! Thank you.</span>
                  </div>
                )}

                {/* Small note at least 13px */}
                <p className="text-[13px] text-slate-400 pt-0.5">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>

          </div>

          {/* Thin Divider */}
          <div className="border-t border-slate-800"></div>

          {/* Bottom Bar: Copyright on left, and Privacy, Terms, Refund links on right */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[15px] text-[#CBD5E1]">
            <div className="text-slate-400">
              {footerConfig?.copyrightText || '© 2026 CamneX Bangladesh. All rights reserved.'}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => onNavigate('terms')}
                className="text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors"
              >
                Terms & Conditions
              </button>
              <button
                type="button"
                onClick={() => onNavigate('refund')}
                className="text-[#CBD5E1] hover:text-white hover:underline hover:decoration-[#F15A24] hover:underline-offset-4 decoration-2 transition-colors"
              >
                Refund Policy
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Back to top: small round icon button fixed to bottom-left so nothing overlaps it */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className="fixed bottom-6 left-6 z-40 w-10 h-10 rounded-full bg-slate-800 hover:bg-[#F15A24] border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer focus:outline-none"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {/* FLOATING WHATSAPP BUTTON:
          Fixed bottom-right, 56px green circle with WhatsApp icon (text label appears on hover on desktop).
          Keep at least 24px clear of footer content and never overlap Back to top.
          On mobile, sits above sticky bar (bottom-20). */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 h-14 w-14 hover:w-auto md:group rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-2xl flex items-center justify-center transition-all duration-300 overflow-hidden px-4 hover:shadow-[0_8px_30px_rgb(37,211,102,0.4)]"
      >
        <svg className="w-7 h-7 fill-white shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="hidden md:group-hover:inline-block max-w-0 md:group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-sm font-bold ml-2">
          WhatsApp Us
        </span>
      </a>

      {/* Sticky Mobile Bottom Bar (< md screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur-lg border-t border-slate-800 p-2.5 px-4 shadow-2xl">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>WhatsApp</span>
          </a>

          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            <Phone className="w-4 h-4 text-[#F15A24]" />
            <span>Call Now</span>
          </a>
        </div>
      </div>
    </>
  );
};
