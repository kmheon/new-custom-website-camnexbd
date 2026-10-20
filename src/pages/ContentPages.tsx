import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, MapPin, Globe, CheckCircle2, MessageSquare, ChevronDown,
  ChevronUp, Star, Shield, ArrowRight, ExternalLink, Send, AlertCircle,
  Briefcase, Eye, Network, Lock, Wrench, FolderKanban
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { BlogPost, ProjectCaseStudy, Testimonial, FaqItem, SiteSettings } from '../types';
import { DEFAULT_SCENARIOS } from '../services/seedData';
import { SolutionsPage } from './SolutionsPage';
import { CompanySubNav } from './CompanyProfilePage';
import { apiClient } from '../shared/apiClient';
import { FaqPage } from './FaqPage';
import { WarrantyPolicyPage } from './WarrantyPolicyPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsConditionsPage } from './TermsConditionsPage';
import { RefundPolicyPage } from './RefundPolicyPage';
import { TechnicalSupportPage } from './TechnicalSupportPage';

interface ContentPageProps {
  type: 'solutions' | 'projects' | 'testimonials' | 'faq' | 'contact' | 'blog' | 'blog_post' | 'about' | 'warranty' | 'terms' | 'privacy' | 'refund' | 'support';
  param?: string;
  onNavigate: (route: string, param?: string) => void;
}

export const ContentPages: React.FC<ContentPageProps> = ({ type, param, onNavigate }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [projects, setProjects] = useState<ProjectCaseStudy[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(type === 'projects');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string>('ALL');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'CCTV & Surveillance Inquiry',
    message: '',
    website_url: '' // Honeypot
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitError, setContactSubmitError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<{ referenceNumber: string; createdAt: string } | null>(null);

  useEffect(() => {
    cmsService.getSiteSettings().then(setSettings);

    if (type === 'blog' || type === 'blog_post') {
      cmsService.getBlogPosts().then(posts => {
        setBlogPosts(posts);
        if (param) {
          const found = posts.find(p => p.slug === param || p.id === param);
          setActivePost(found || posts[0]);
        }
      });
    }

    if (type === 'projects') {
      setProjectsLoading(true);
      cmsService.getProjects()
        .then(list => {
          setProjects(Array.isArray(list) ? list : []);
          setProjectsLoading(false);
        })
        .catch(() => setProjectsLoading(false));
    }

    if (type === 'testimonials') {
      cmsService.getTestimonials().then(setTestimonials);
    }

    if (type === 'faq') {
      cmsService.getFaqs().then(setFaqs);
    }
  }, [type, param]);

  // --------------------------------------------------------------------------
  // SOLUTIONS PAGE & SCENARIO DETAIL
  // --------------------------------------------------------------------------
  if (type === 'solutions') {
    return <SolutionsPage param={param} onNavigate={onNavigate} />;
  }

  // --------------------------------------------------------------------------
  // FAQ PAGE
  // --------------------------------------------------------------------------
  if (type === 'faq') {
    return <FaqPage onNavigate={onNavigate} />;
  }

  // --------------------------------------------------------------------------
  // TECHNICAL SUPPORT PAGE (/support)
  // --------------------------------------------------------------------------
  if (type === 'support') {
    return <TechnicalSupportPage onNavigate={onNavigate} />;
  }

  // --------------------------------------------------------------------------
  // PAGE 5: CONTACT PAGE (/contact)
  // --------------------------------------------------------------------------
  if (type === 'contact') {
    const validateContactForm = () => {
      const errs: Record<string, string> = {};
      const cleanName = contactForm.name.trim();
      const cleanPhone = contactForm.phone.replace(/[\s-]/g, '');
      const cleanEmail = contactForm.email.trim();
      const cleanSubject = contactForm.subject.trim();
      const cleanMessage = contactForm.message.trim();

      if (!cleanName || cleanName.length < 2) {
        errs.name = 'Please enter your full name.';
      }
      if (!cleanPhone || !/^(\+?880|0)?1[3-9]\d{8}$/.test(cleanPhone)) {
        errs.phone = 'Please enter a valid 11-digit Bangladesh mobile number (e.g., 017XXXXXXXX).';
      }
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errs.email = 'Please enter a valid email address.';
      }
      if (!cleanSubject) {
        errs.subject = 'Please select an inquiry type.';
      }
      if (!cleanMessage || cleanMessage.length < 5) {
        errs.message = 'Please enter a brief message describing your inquiry or requirements.';
      }
      setContactErrors(errs);
      return Object.keys(errs).length === 0;
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (contactSubmitting) return;
      setContactSubmitError(null);

      if (!validateContactForm()) {
        return;
      }

      setContactSubmitting(true);
      try {
        const res = await apiClient.post<{
          success: boolean;
          referenceNumber: string;
          createdAt: string;
        }>('/contact', {
          name: contactForm.name.trim(),
          phone: contactForm.phone.trim(),
          email: contactForm.email.trim() || undefined,
          subject: contactForm.subject.trim(),
          message: contactForm.message.trim(),
          website_url: contactForm.website_url
        });

        if (res && res.referenceNumber) {
          setContactSuccess({
            referenceNumber: res.referenceNumber,
            createdAt: res.createdAt || new Date().toISOString()
          });
          setContactErrors({});
        } else {
          throw new Error('Unexpected response from server. Please try again.');
        }
      } catch (err: any) {
        setContactSubmitError(
          err?.message || 'Unable to submit your inquiry right now. Your entered information has been preserved.'
        );
      } finally {
        setContactSubmitting(false);
      }
    };

    const verifiedAddress =
      'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Road, Dhaka 1207, Bangladesh';
    const verifiedPhone = '+880 1540-535150';
    const secondaryPhone = '+880 1410-085848';
    const verifiedEmail = 'contact@camnexbd.com';
    const verifiedFacebook = 'https://facebook.com/camnexbd';
    const verifiedWebsite = 'https://camnexbd.com';
    const googleMapsUrl = 'https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA';

    return (
      <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
        <SEO
          title="Contact Us | CamneX Bangladesh"
          description="Contact CamneX Bangladesh at Chandrima Model Town, Dhaka 1207. Phone: +880 1540-535150 / +880 1410-085848, Email: contact@camnexbd.com."
          canonicalPath="/contact"
        />
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
          <div className="space-y-4">
            <Breadcrumbs
              items={[
                { label: 'Home', onClick: () => onNavigate('home') },
                { label: 'Company', onClick: () => onNavigate('company_profile') },
                { label: 'Contact' }
              ]}
            />
            <CompanySubNav activePage="contact" onNavigate={onNavigate} />
          </div>

          {/* HERO HEADER */}
          <section
            data-testid="contact-page-hero"
            className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#F15A24] text-xs font-extrabold uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5" />
              <span>Get In Touch</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black font-heading text-[#111827] tracking-tight leading-[1.15]">
              Contact Us
            </h1>
            <p className="text-base sm:text-lg text-[#4B5563] max-w-3xl leading-relaxed">
              Have a question about CCTV cameras, Wi-Fi surveillance, networking equipment, biometric access control, or IT support? Reach out to CamneX Bangladesh using our verified contact details or send us a message below.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Verified Contact Information & Directions */}
            <div className="lg:col-span-5 space-y-6">
              <div
                data-testid="verified-contact-info-card"
                className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                    Verified Details
                  </span>
                  <h2 className="text-xl font-black font-heading text-[#111827] mt-1">
                    CamneX Bangladesh
                  </h2>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                    <MapPin className="w-5 h-5 text-[#F15A24] shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                        Office & Shop Address
                      </div>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#111827] hover:text-[#F15A24] leading-relaxed block transition-colors"
                      >
                        {verifiedAddress}
                      </a>
                      <div className="pt-1">
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="contact-directions-link"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          <span>Get Directions in Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Phone & Secondary Phone */}
                  <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                    <Phone className="w-5 h-5 text-[#F15A24] shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                        Official Contact Numbers
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] text-[#5B6472] font-semibold">Primary (Sales & Support):</span>
                          <a
                            href="tel:+8801540535150"
                            data-testid="contact-phone-link"
                            className="text-sm font-black text-[#111827] hover:text-[#F15A24] transition-colors"
                          >
                            {verifiedPhone}
                          </a>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] text-[#5B6472] font-semibold">Secondary (Desk / Admin):</span>
                          <a
                            href="tel:+8801410085848"
                            data-testid="contact-secondary-phone-link"
                            className="text-sm font-bold text-[#111827] hover:text-[#F15A24] transition-colors"
                          >
                            {secondaryPhone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                    <Mail className="w-5 h-5 text-[#F15A24] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                        Official Email
                      </div>
                      <a
                        href={`mailto:${verifiedEmail}`}
                        data-testid="contact-email-link"
                        className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors block break-all"
                      >
                        {verifiedEmail}
                      </a>
                    </div>
                  </div>

                  {/* Departmental Directory */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-2.5">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                      Departmental Mailboxes
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">General Inquiries:</span>
                        <a href="mailto:contact@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">contact@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Sales & Quotations:</span>
                        <a href="mailto:sales@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">sales@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Orders & Tracking:</span>
                        <a href="mailto:orders@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">orders@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Technical & Warranty:</span>
                        <a href="mailto:support@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">support@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Accounts & Billing:</span>
                        <a href="mailto:accounts@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">accounts@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Corporate & Info:</span>
                        <a href="mailto:info@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">info@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Partners & Vendors:</span>
                        <a href="mailto:partners@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">partners@camnexbd.com</a>
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[#5B6472] font-semibold">Careers & Hiring:</span>
                        <a href="mailto:careers@camnexbd.com" className="font-bold text-[#111827] hover:text-[#F15A24] transition-colors">careers@camnexbd.com</a>
                      </div>
                    </div>
                  </div>

                  {/* Website & Facebook */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-1">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                        Website
                      </div>
                      <a
                        href={verifiedWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-xs text-[#111827] hover:text-[#F15A24] inline-flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#F15A24]" />
                        <span>camnexbd.com</span>
                      </a>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-1">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                        Facebook Page
                      </div>
                      <a
                        href={verifiedFacebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="contact-facebook-link"
                        className="font-bold text-xs text-[#111827] hover:text-[#F15A24] inline-flex items-center gap-1"
                      >
                        <span>facebook.com/camnexbd</span>
                        <ExternalLink className="w-3 h-3 text-[#F15A24]" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Button */}
                <div className="pt-2">
                  <a
                    href="https://wa.me/8801540535150?text=Hello%20CamneX%20Bangladesh%2C%20I%20would%20like%20to%20discuss%20my%20requirements."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat With Us on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Quotation & Package Builder CTA Card */}
              <div className="bg-[#111827] text-white rounded-[28px] p-6 sm:p-8 space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                  Need a System Estimate?
                </span>
                <h3 className="text-xl font-black font-heading text-white">
                  Request a Quotation or Configure a CCTV Package
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Use our interactive CCTV Package Builder to generate a compatible Bill of Materials, or request a tailored site survey and quotation.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    data-testid="contact-quote-cta-btn"
                    onClick={() => onNavigate('quote')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('packages')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Open Package Builder</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Accessible Contact Form */}
            <div className="lg:col-span-7">
              <div
                data-testid="contact-form-card"
                className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-6"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                    Online Inquiry
                  </span>
                  <h2 className="text-2xl font-black font-heading text-[#111827]">
                    Send Us a Message
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4B5563]">
                    Fill out the form below and our team will review your requirements and respond via phone or email.
                  </p>
                </div>

                {contactSuccess ? (
                  <div
                    data-testid="contact-form-success"
                    role="status"
                    className="p-6 sm:p-8 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-emerald-950 font-heading">
                          Inquiry Received
                        </h3>
                        <p className="text-xs text-emerald-800">
                          Reference Number: <strong className="font-mono">{contactSuccess.referenceNumber}</strong>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                      Thank you for contacting CamneX Bangladesh. Your inquiry has been logged in our system under reference <strong>{contactSuccess.referenceNumber}</strong>. Our team will reach out to you at <strong>{contactForm.phone}</strong>.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setContactSuccess(null);
                          setContactForm({
                            name: '',
                            phone: '',
                            email: '',
                            subject: 'CCTV & Surveillance Inquiry',
                            message: '',
                            website_url: ''
                          });
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
                    {contactSubmitError && (
                      <div
                        data-testid="contact-form-server-error"
                        role="alert"
                        className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>{contactSubmitError}</span>
                      </div>
                    )}

                    {/* Honeypot field */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="contact-website-url">Website</label>
                      <input
                        id="contact-website-url"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={contactForm.website_url}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, website_url: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-extrabold text-[#111827] mb-1.5"
                        >
                          Full Name <span className="text-[#F15A24]">*</span>
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          required
                          data-testid="contact-input-name"
                          value={contactForm.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContactForm((prev) => ({ ...prev, name: val }));
                            if (contactErrors.name) setContactErrors((prev) => ({ ...prev, name: '' }));
                          }}
                          placeholder="e.g., Tanvir Rahman"
                          className={`w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border text-sm text-[#111827] focus:outline-none focus:bg-white transition-colors ${
                            contactErrors.name ? 'border-red-500' : 'border-[#EDE8E1] focus:border-[#F15A24]'
                          }`}
                        />
                        {contactErrors.name && (
                          <p data-testid="contact-error-name" className="text-xs text-red-600 font-semibold mt-1">
                            {contactErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-xs font-extrabold text-[#111827] mb-1.5"
                        >
                          Mobile Number <span className="text-[#F15A24]">*</span>
                        </label>
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          required
                          data-testid="contact-input-phone"
                          value={contactForm.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContactForm((prev) => ({ ...prev, phone: val }));
                            if (contactErrors.phone) setContactErrors((prev) => ({ ...prev, phone: '' }));
                          }}
                          placeholder="017XXXXXXXX"
                          className={`w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border text-sm text-[#111827] focus:outline-none focus:bg-white transition-colors ${
                            contactErrors.phone ? 'border-red-500' : 'border-[#EDE8E1] focus:border-[#F15A24]'
                          }`}
                        />
                        {contactErrors.phone && (
                          <p data-testid="contact-error-phone" className="text-xs text-red-600 font-semibold mt-1">
                            {contactErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Email (Optional) */}
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-extrabold text-[#111827] mb-1.5"
                        >
                          Email Address <span className="text-[#5B6472] font-normal">(Optional)</span>
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          data-testid="contact-input-email"
                          value={contactForm.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContactForm((prev) => ({ ...prev, email: val }));
                            if (contactErrors.email) setContactErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          placeholder="you@example.com"
                          className={`w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border text-sm text-[#111827] focus:outline-none focus:bg-white transition-colors ${
                            contactErrors.email ? 'border-red-500' : 'border-[#EDE8E1] focus:border-[#F15A24]'
                          }`}
                        />
                        {contactErrors.email && (
                          <p data-testid="contact-error-email" className="text-xs text-red-600 font-semibold mt-1">
                            {contactErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Subject / Inquiry Type */}
                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="block text-xs font-extrabold text-[#111827] mb-1.5"
                        >
                          Subject / Inquiry Type <span className="text-[#F15A24]">*</span>
                        </label>
                        <select
                          id="contact-subject"
                          name="subject"
                          data-testid="contact-input-subject"
                          value={contactForm.subject}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContactForm((prev) => ({ ...prev, subject: val }));
                            if (contactErrors.subject) setContactErrors((prev) => ({ ...prev, subject: '' }));
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#EDE8E1] text-sm text-[#111827] focus:outline-none focus:bg-white focus:border-[#F15A24] transition-colors"
                        >
                          <option value="CCTV & Surveillance Inquiry">CCTV & Surveillance Inquiry</option>
                          <option value="Wi-Fi Camera Solutions">Wi-Fi Camera Solutions</option>
                          <option value="Networking & Connectivity">Networking & Connectivity</option>
                          <option value="Access Control & Time Attendance">Access Control & Time Attendance</option>
                          <option value="IT Support & Maintenance">IT Support & Maintenance</option>
                          <option value="Product Availability & Pricing">Product Availability & Pricing</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                        {contactErrors.subject && (
                          <p data-testid="contact-error-subject" className="text-xs text-red-600 font-semibold mt-1">
                            {contactErrors.subject}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-extrabold text-[#111827] mb-1.5"
                      >
                        Message / Requirements <span className="text-[#F15A24]">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={4}
                        required
                        data-testid="contact-input-message"
                        value={contactForm.message}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContactForm((prev) => ({ ...prev, message: val }));
                          if (contactErrors.message) setContactErrors((prev) => ({ ...prev, message: '' }));
                        }}
                        placeholder="Tell us about your property, the number of cameras or devices needed, or how we can help..."
                        className={`w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border text-sm text-[#111827] focus:outline-none focus:bg-white transition-colors ${
                          contactErrors.message ? 'border-red-500' : 'border-[#EDE8E1] focus:border-[#F15A24]'
                        }`}
                      />
                      {contactErrors.message && (
                        <p data-testid="contact-error-message" className="text-xs text-red-600 font-semibold mt-1">
                          {contactErrors.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-[11px] text-[#5B6472]">
                        Your contact information is used solely to respond to your inquiry.
                      </p>
                      <button
                        type="submit"
                        disabled={contactSubmitting}
                        data-testid="contact-submit-btn"
                        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span>{contactSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PAGE 2: PROJECTS & PORTFOLIO PAGE (/projects)
  // --------------------------------------------------------------------------
  if (type === 'projects') {
    const workCategories = [
      {
        title: 'CCTV & IP Video Surveillance',
        description: 'Indoor and outdoor camera deployment, DVR/NVR recording setup, and continuous storage configuration.',
        icon: Eye
      },
      {
        title: 'Wi-Fi Camera Solutions',
        description: 'Smart wireless security cameras for residences, small offices, and retail counters with mobile app viewing.',
        icon: Shield
      },
      {
        title: 'Networking & Structured Cabling',
        description: 'Cat6 cabling, PoE switch deployment, router setup, and wireless access point installation.',
        icon: Network
      },
      {
        title: 'Access Control & Attendance',
        description: 'Biometric fingerprint and facial recognition terminals and door lock integration.',
        icon: Lock
      },
      {
        title: 'IT Support & System Maintenance',
        description: 'Troubleshooting, network diagnostics, camera health checks, and ongoing maintenance support.',
        icon: Wrench
      }
    ];

    const availableCategories = Array.from(
      new Set(
        projects
          .map((p: any) => p.category || p.industry || '')
          .filter((c: string) => Boolean(c && c.trim()))
      )
    );

    const filteredProjects =
      projectCategoryFilter === 'ALL'
        ? projects
        : projects.filter((p: any) => (p.category || p.industry) === projectCategoryFilter);

    return (
      <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
        <SEO
          title="Projects & Portfolio | CamneX Bangladesh"
          description="Explore examples of security, surveillance, networking, and IT work by CamneX Bangladesh."
          canonicalPath="/projects"
        />
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
          <div className="space-y-4">
            <Breadcrumbs
              items={[
                { label: 'Home', onClick: () => onNavigate('home') },
                { label: 'Company', onClick: () => onNavigate('company_profile') },
                { label: 'Projects & Portfolio' }
              ]}
            />
            <CompanySubNav activePage="projects" onNavigate={onNavigate} />
          </div>

          {/* PORTFOLIO HERO */}
          <section
            data-testid="projects-hero"
            className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 lg:p-12 shadow-xs space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#F15A24] text-xs font-extrabold uppercase tracking-wider">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Portfolio & Deployment Scope</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black font-heading text-[#111827] tracking-tight leading-[1.15]">
              Projects & Portfolio
            </h1>

            <p className="text-base sm:text-lg text-[#4B5563] max-w-3xl leading-relaxed">
              Explore examples of security, surveillance, networking, and IT work by CamneX Bangladesh.
            </p>
          </section>

          {/* TYPES OF WORK CAMNEX UNDERTAKES */}
          <section
            data-testid="projects-work-types"
            className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <div className="max-w-3xl space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                What We Deliver
              </span>
              <h2 className="text-2xl font-black font-heading text-[#111827]">
                Types of Work We Undertake
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                CamneX Bangladesh works with homeowners, shops, offices, and organizations to plan, install, and support practical security and connectivity infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {workCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 text-[#F15A24] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-extrabold font-heading text-[#111827] leading-snug">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* PROJECT GALLERY OR HONEST EMPTY STATE */}
          <section
            data-testid="projects-gallery-section"
            className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                  Documented Deployments
                </span>
                <h2 className="text-2xl font-black font-heading text-[#111827]">
                  Published Project Examples
                </h2>
              </div>

              {availableCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectCategoryFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      projectCategoryFilter === 'ALL'
                        ? 'bg-[#111827] text-white'
                        : 'bg-[#FAF7F2] text-[#5B6472] hover:text-[#111827]'
                    }`}
                  >
                    All Projects
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProjectCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        projectCategoryFilter === cat
                          ? 'bg-[#111827] text-white'
                          : 'bg-[#FAF7F2] text-[#5B6472] hover:text-[#111827]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {projectsLoading ? (
              <div className="py-12 text-center text-xs text-[#5B6472]">
                Loading project portfolio...
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((proj: any) => (
                  <article
                    key={proj.id}
                    data-testid="project-card"
                    className="bg-[#FAF7F2] rounded-2xl border border-[#EDE8E1] overflow-hidden flex flex-col justify-between min-w-0"
                  >
                    <div>
                      <img
                        src={proj.image || '/images/projects/project-neutral.svg'}
                        alt={proj.title}
                        className="w-full h-56 object-cover bg-white border-b border-[#EDE8E1]"
                      />
                      <div className="p-6 space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#F15A24]">
                          {proj.location && <span>{proj.location}</span>}
                          {proj.location && proj.cameraCount && <span>·</span>}
                          {proj.cameraCount && <span>{proj.cameraCount}</span>}
                        </div>
                        <h3 className="font-black text-lg text-[#111827] font-heading [overflow-wrap:anywhere] break-words">
                          {proj.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed [overflow-wrap:anywhere] break-words">
                          {proj.systemSummary || proj.description}
                        </p>
                        {proj.clientQuote && (
                          <div className="p-3.5 bg-white border border-[#EDE8E1] rounded-xl text-xs italic text-[#4B5563] mt-2 [overflow-wrap:anywhere] break-words">
                            “{proj.clientQuote}” {proj.clientAuthor ? `— ${proj.clientAuthor}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                data-testid="projects-empty-state"
                className="p-8 sm:p-10 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] text-center max-w-2xl mx-auto space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#F15A24] flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black font-heading text-[#111827]">
                  Verified Project Case Studies Will Be Published Here
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  We only publish documented project examples with verified details and photographs. New project entries can be added and managed at any time through <strong>Website Manager → Projects</strong> as case studies are prepared for publication.
                </p>
              </div>
            )}
          </section>

          {/* FINAL CALL TO ACTION */}
          <section
            data-testid="projects-cta-section"
            className="bg-[#111827] text-white rounded-[28px] p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                Plan Your Deployment
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
                Planning a Security, Surveillance, or Networking Project?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Share your requirements with our team for a tailored hardware recommendation, Bill of Materials, or site survey in Dhaka.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                data-testid="projects-cta-quote-btn"
                onClick={() => onNavigate('quote')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <span>Request Quotation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-testid="projects-cta-contact-btn"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#F15A24]" />
                <span>Contact Us</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TESTIMONIALS PAGE (Only renders if entered data exists)
  // --------------------------------------------------------------------------
  if (type === 'testimonials') {
    if (testimonials.length === 0) {
      return (
        <div className="bg-[#F8FAFC] min-h-screen py-16 text-center text-slate-500">
          <p>No client testimonials currently published.</p>
        </div>
      );
    }
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Verified Client Testimonials | CamneX Bangladesh" description="Authentic feedback from verified corporate and residential clients." />
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Testimonials' }]} />
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h1 className="text-3xl font-black text-[#111827] font-heading mb-2">Client Feedback</h1>
            <p className="text-xs sm:text-sm text-slate-600">Authentic statements from real property owners and corporate clients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-sm min-w-0">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed [overflow-wrap:anywhere] break-words">“{t.content}”</p>
                <div className="pt-2 border-t border-slate-100 min-w-0">
                  <div className="font-bold text-xs text-[#111827] [overflow-wrap:anywhere] break-words">{t.client_name}</div>
                  {t.company && <div className="text-[11px] text-slate-500 [overflow-wrap:anywhere] break-words">{t.role ? `${t.role}, ` : ''}{t.company}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // BLOG PAGES
  // --------------------------------------------------------------------------
  if (type === 'blog') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="Technical Security & Networking Blog | CamneX Bangladesh" description="Guides on CCTV installation, Wi-Fi mesh, and access control." />
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Blog' }]} />
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h1 className="text-3xl font-black text-[#111827] font-heading mb-2">Technical Surveillance & IT Blog</h1>
            <p className="text-xs sm:text-sm text-slate-600">Objective engineering guides for property owners and IT administrators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogPosts.map(post => (
              <div
                key={post.id}
                onClick={() => onNavigate('blog_post', post.slug)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all"
              >
                <img src={post.featuredImage} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-6 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400">{post.publishedAt} · {post.readTime}</div>
                  <h3 className="font-bold text-base text-[#111827] font-heading hover:text-[#F15A24]">{post.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{post.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'blog_post' && activePost) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title={`${activePost.title} | CamneX Blog`} description={activePost.excerpt} ogType="article" />
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Blog', onClick: () => onNavigate('blog') }, { label: activePost.title }]} />
          
          <article className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-xs text-slate-400 font-bold">{activePost.publishedAt} · By {activePost.author}</div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading leading-tight">{activePost.title}</h1>
            <img src={activePost.featuredImage} alt="" className="w-full h-72 object-cover rounded-xl" />
            <div className="prose text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: activePost.content }} />
          </article>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ABOUT US PAGE
  // --------------------------------------------------------------------------
  if (type === 'about') {
    return (
      <div className="bg-[#F8FAFC] min-h-screen py-10">
        <SEO title="About Us | CamneX Bangladesh" description="Security, Surveillance, Networking and IT Solutions company in Dhaka, Bangladesh." />
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'About Us' }]} />

          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Badge variant="orange">Company Profile</Badge>
            <h1 className="text-3xl font-black text-[#111827] font-heading">
              About CamneX Bangladesh
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              CamneX Bangladesh is a professional Security, Surveillance, Enterprise Networking, and IT Solutions engineering firm based in Dhaka, Bangladesh. We specialize in designing, deploying, and maintaining high-reliability technology infrastructure for residential properties, corporate headquarters, and commercial facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#111827]">Authorized Partnerships</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We are a recognized <strong>Hikvision Authorized Partner</strong> and <strong>ZKTeco Authorized Installer</strong> in Bangladesh. All hardware supplied through our store and turnkey packages carries genuine manufacturer serial numbers with warranty registration.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#111827]">Dhaka Engineering Standards</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlike informal traders, CamneX adheres to strict cabling standards. We use Cat6 cabling run through heavy-duty PVC conduits or interior trunking with waterproof junction boxes, backed by 1-Year warranty service.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-2xl space-y-3">
            <h3 className="font-bold text-lg font-heading">Dhaka Engineering & Installation Center</h3>
            <p className="text-xs text-slate-400">
              {settings?.address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207, Bangladesh'}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <span>Phone: <strong className="text-[#F15A24]">{settings?.phone || '+880 1540-535150'}</strong></span>
              <span>Email: <strong className="text-slate-200">{settings?.email || 'contact@camnexbd.com'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // WARRANTY POLICY PAGE
  // --------------------------------------------------------------------------
  if (type === 'warranty') {
    return <WarrantyPolicyPage onNavigate={onNavigate} />;
  }

  // --------------------------------------------------------------------------
  // TERMS & CONDITIONS PAGE
  // --------------------------------------------------------------------------
  if (type === 'terms') {
    return <TermsConditionsPage onNavigate={onNavigate} />;
  }

  // --------------------------------------------------------------------------
  // PRIVACY POLICY PAGE
  // --------------------------------------------------------------------------
  if (type === 'privacy') {
    return <PrivacyPolicyPage onNavigate={onNavigate} />;
  }

  // --------------------------------------------------------------------------
  // RETURN & REFUND POLICY PAGE
  // --------------------------------------------------------------------------
  if (type === 'refund') {
    return <RefundPolicyPage onNavigate={onNavigate} />;
  }

  return null;
};
