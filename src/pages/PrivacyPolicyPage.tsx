import React, { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  EyeOff,
  Database,
  Cookie,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { SiteSettings } from '../types';

interface PrivacyPolicyPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    cmsService.getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const phone = settings?.phone || '+880 1540-535150';
  const email = settings?.email || 'contact@camnexbd.com';
  const address = settings?.address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207';

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12 text-[#111827]">
      <SEO
        title="Privacy Policy | CamneX Bangladesh"
        description="Transparent data protection standards: account handling, zero third-party advertising trackers, secure local credentials post-handover, and customer privacy rights."
        canonicalPath="/privacy"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Privacy Policy' }
          ]}
        />

        {/* Hero Header */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="orange">Data Protection Standard</Badge>
            <span className="text-xs text-slate-400 font-medium">Effective Date: October 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            At CamneX Bangladesh, we respect the confidentiality of your personal identity, contact details, premises layouts, and installed security systems.
          </p>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Core Privacy Commitments:</strong>
              <span>
                • We do NOT sell, lease, or monetize customer contact lists or site surveys.<br />
                • We do NOT embed covert cross-site marketing trackers or advertising tracking pixels.<br />
                • Video surveillance stream passwords are configured on the client's own device; CamneX retains zero backdoors or remote viewing streams post-handover.
              </span>
            </div>
          </div>
        </div>

        {/* Table of Contents Navigation Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Table of Contents
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'collection', label: '1. Information We Collect' },
              { id: 'usage', label: '2. How Information is Used' },
              { id: 'payment', label: '3. Payment & Financial Data' },
              { id: 'cookies', label: '4. Cookies & Local Storage' },
              { id: 'thirdparty', label: '5. Third-Party Services' },
              { id: 'surveillance', label: '6. Video Stream Privacy' },
              { id: 'security', label: '7. Data Security Practices' },
              { id: 'rights', label: '8. Customer Privacy Rights' },
              { id: 'contact', label: '9. Privacy Inquiries' }
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-[#F15A24] font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section id="collection" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              1. Information We Collect
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              We only collect information directly provided by customers when interacting with our website and engineering desk:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Customer Account & Profile:</strong> Full name, verified mobile phone number, email address, password (securely hashed via bcrypt with salt factor 10), and saved delivery addresses.</li>
              <li><strong>Orders & Checkout:</strong> Recipient contact name, primary delivery phone number, district, street delivery address, item selections, and optional delivery notes.</li>
              <li><strong>Technical Inquiries & Quotations:</strong> Contact name, phone, email, premise type (residential, commercial, factory), estimated camera count, and cable route requirements.</li>
              <li><strong>Order Tracking Queries:</strong> Order reference code (e.g. CNX-ORD-...) and matching verification phone number entered during status lookups.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: How Information is Used */}
        <section id="usage" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              2. How We Use Collected Information
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>Information collected is used strictly for legitimate operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Processing hardware purchases, invoice generation, and product delivery in Dhaka and nationwide.</li>
              <li>Scheduling physical site surveys, technician installation appointments, and warranty service visits.</li>
              <li>Providing order status tracking and dispatch notifications via SMS or direct phone confirmation.</li>
              <li>Verifying warranty claims against official distributor product serial registries.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Payment & Financial Data */}
        <section id="payment" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              3. Payment & Financial Data Handling
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              CamneX maintains strict financial data isolation to prevent payment risks:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <strong className="text-xs font-bold text-[#111827] block">No Credit Card Storage</strong>
                <p className="text-xs text-slate-500">
                  Our servers do not store, process, or transmit credit or debit card numbers, CVVs, or bank PINs.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <strong className="text-xs font-bold text-[#111827] block">Mobile & Bank Verification</strong>
                <p className="text-xs text-slate-500">
                  For bKash or Nagad manual payments, we record only the customer's sender mobile number and Transaction ID (TrxID) to reconcile distributor accounts. For bank transfers, deposit reference slips are reviewed manually.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Cookies & Local Storage */}
        <section id="cookies" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              4. Cookies & Local Storage Practices
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Our website uses strictly functional browser storage mechanisms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Session Cookies (HTTP-only):</strong> Used to maintain authenticated customer, staff, and administrator sessions with secure token verification.</li>
              <li><strong>CSRF Security Tokens:</strong> Issued to prevent unauthorized Cross-Site Request Forgery during form submissions and checkout.</li>
              <li><strong>Browser Local Storage:</strong> Used locally on your device to persist your shopping cart items, wishlist selections, and package builder configuration between page visits.</li>
              <li><strong>Zero Ad Trackers:</strong> We do not load third-party ad networks, tracking beacons, or cross-site tracking scripts.</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Third-Party Services */}
        <section id="thirdparty" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              5. Third-Party Service Providers
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              We share only the minimum required information with trusted operational partners:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Courier & Delivery Services:</strong> Recipient name, delivery address, and contact phone number are shared with third-party courier services (e.g., SA Paribahan, Sundarban Courier, Steadfast) solely for physical package transit.</li>
              <li><strong>External Mapping:</strong> Links to Google Maps or OpenStreetMap are provided for physical office navigation. Clicking these links connects directly to those providers subject to their respective policies.</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Video Feeds & Handover Security Principle */}
        <section id="surveillance" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              6. Client Video Feeds & Handover Security Principle
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              For all installed CCTV and IP surveillance systems, CamneX adheres to our strict <strong>Handover Security Principle</strong>:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#111827]">
                <EyeOff className="w-4 h-4 text-[#F15A24]" />
                <span>Zero Remote Access Post-Handover</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                During deployment, our technicians initialize the recorder and guide you to set your own permanent admin password directly on the NVR/DVR and your personal mobile app (Hik-Connect / DMSS). CamneX staff do not record, store, or retain client video stream passwords, cloud credentials, or live video feeds after physical handover is complete.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Data Security Practices */}
        <section id="security" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              7
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              7. Data Security Practices
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              We implement technical and organizational controls to protect data stored within our systems:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Passwords encrypted with salted bcrypt hashing.</li>
              <li>Role-based access control (RBAC) restricting customer order records only to authorized administrative personnel.</li>
              <li>API rate limiting and honeypot validation on all contact and inquiry forms to block automated spam and credential stuffing.</li>
              <li>Order tracking isolation: public lookups require matching phone verification to prevent enumeration.</li>
            </ul>
          </div>
        </section>

        {/* Section 8: Customer Privacy Rights */}
        <section id="rights" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              8
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              8. Customer Privacy Rights
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>Customers have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Request a copy of the personal information associated with their account or past orders.</li>
              <li>Request correction or updating of outdated contact details or delivery addresses.</li>
              <li>Request deletion or deactivation of their customer account (subject to statutory accounting and tax retention obligations under Bangladesh commercial regulations).</li>
            </ul>
          </div>
        </section>

        {/* Section 9: Privacy Inquiries */}
        <section id="contact" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              9
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              9. Privacy Officer Contact & Policy Updates
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              For privacy-related questions, account deletion requests, or data corrections, contact our privacy desk:
            </p>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <div><strong>CamneX Bangladesh — Privacy & Data Protection Desk</strong></div>
              <div>Address: {address}</div>
              <div>Phone: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-[#F15A24] font-bold">{phone}</a></div>
              <div>Email: <a href={`mailto:${email}`} className="text-[#F15A24] font-bold">{email}</a></div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Policy changes will be published directly on this page with an updated effective date. Continued use of our website or services constitutes acknowledgment of the revised terms.
            </p>
          </div>
        </section>

        {/* Website Manager Custom Overrides if configured */}
        {settings?.privacyPolicyText && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <Badge variant="orange">Administrative Notice</Badge>
            <h3 className="font-bold text-sm text-[#111827]">Additional Store Specific Privacy Notes</h3>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {settings.privacyPolicyText}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

