import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Shield,
  Layers,
  Wrench,
  Truck,
  CreditCard
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { SiteSettings } from '../types';

interface TermsConditionsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const TermsConditionsPage: React.FC<TermsConditionsPageProps> = ({ onNavigate }) => {
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
        title="Terms & Conditions | CamneX Bangladesh"
        description="Commercial terms, genuine hardware sales standards, turnkey installation arrangements, quotation validity, and client responsibilities in Bangladesh."
        canonicalPath="/terms"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Terms & Conditions' }
          ]}
        />

        {/* Hero Header */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="orange">Commercial Terms of Service</Badge>
            <span className="text-xs text-slate-400 font-medium">Effective Date: October 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading leading-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            These terms govern the purchase of security hardware, surveillance equipment, enterprise networking components, and installation engineering services provided by CamneX Bangladesh.
          </p>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Important Distinction on Estimates & Quotations:</strong>
              <span>
                Package Builder configurations, website cart estimates, and formal quotations submitted through camnexbd.com are preliminary engineering estimates. They do not constitute a confirmed purchase contract until on-site verification, physical component availability check, and mutual client agreement.
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
              { id: 'acceptance', label: '1. Scope & Acceptance' },
              { id: 'products', label: '2. Product Information' },
              { id: 'quotes', label: '3. Quotes & Estimates' },
              { id: 'orders', label: '4. Order Submission' },
              { id: 'payment', label: '5. Supported Payments' },
              { id: 'delivery', label: '6. Delivery & Installation' },
              { id: 'client', label: '7. Client Responsibilities' },
              { id: 'warranty', label: '8. Warranty Alignment' },
              { id: 'cancellation', label: '9. Cancellations & Returns' },
              { id: 'ip', label: '10. Intellectual Property' },
              { id: 'liability', label: '11. Limitation of Liability' },
              { id: 'contact', label: '12. Notices & Inquiries' }
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

        {/* Section 1: Scope & Acceptance */}
        <section id="acceptance" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              1. Scope & Acceptance of Terms
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              By browsing camnexbd.com, placing an order, requesting a quotation, or contracting installation services from CamneX Bangladesh, you agree to be bound by these Terms and Conditions.
            </p>
            <p>
              If you are engaging CamneX on behalf of an enterprise, company, educational institution, or residential committee, you confirm that you possess the necessary authority to bind that entity to these terms.
            </p>
          </div>
        </section>

        {/* Section 2: Product Information */}
        <section id="products" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              2. Genuine Product Information & Availability
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              CamneX supplies genuine security and networking hardware sourced through official distributor channels in Bangladesh (including Hikvision, ZKTeco, Ruijie Reyee, Western Digital, and Seagate).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Product specifications and technical datasheets reflect manufacturer documentation.</li>
              <li>Stock quantities are subject to distributor availability. In the rare event an item is out of stock after order submission, our desk will contact you to propose an equivalent model or cancel the item with zero penalty.</li>
              <li>Product imagery displays standard manufacturer chassis; minor cosmetic variations may exist across regional distributor firmware revisions.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Quotes & Estimates */}
        <section id="quotes" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              3. Technical Quotations, Site Surveys & Estimates
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Quotations generated online via our Package Builder or prepared by our engineering desk are structured technical proposals:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Quotation Validity:</strong> Standard hardware quotations remain valid for 14 calendar days from the date of issue, after which distributor currency and import pricing adjustments may apply.</li>
              <li><strong>On-Site Survey:</strong> Cable lengths and conduit requirements generated online are estimates. Final material counts are confirmed following a physical site survey or physical installation measurements.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Order Submission */}
        <section id="orders" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              4. Order Submission, Verification & Processing
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Submitting an order through our online checkout generates an order reference number (e.g. CNX-ORD-...).
            </p>
            <p>
              An order is verified when our customer service desk confirms the delivery address and hardware compatibility by phone. We reserve the right to cancel orders with unverified contact numbers or invalid address details.
            </p>
          </div>
        </section>

        {/* Section 5: Supported Payments */}
        <section id="payment" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              5. Supported Payment Terms & Methods
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>CamneX supports the following verified payment arrangements:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Cash on Delivery (COD):</strong> Payable upon physical parcel handover in eligible areas in Dhaka.</li>
              <li><strong>Mobile Financial Services (MFS):</strong> Manual verification of bKash and Nagad Send Money payments against matching Transaction IDs (TrxID).</li>
              <li><strong>Corporate Bank Transfer:</strong> For registered companies, direct transfer to our official bank account against an invoice. Work commences upon bank clearance confirmation.</li>
              <li><strong>Installation Service Billing:</strong> For turnkey installations, equipment is billed upon physical delivery to the site, and labor charges are settled upon installation completion and client sign-off.</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Delivery & Installation */}
        <section id="delivery" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              6. Delivery & Turnkey Installation Terms
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Dhaka Deliveries:</strong> Delivered via local courier or engineering van within 1 to 3 working days following verification.</li>
              <li><strong>Nationwide Deliveries:</strong> Dispatched via registered courier services (such as SA Paribahan or Sundarban Courier) subject to courier transport timelines.</li>
              <li><strong>Installation Scheduling:</strong> On-site installations are scheduled during standard working hours (Saturday through Thursday, 9:30 AM to 7:30 PM). Special night-time or holiday installations for corporate offices must be scheduled in advance.</li>
            </ul>
          </div>
        </section>

        {/* Section 7: Client Responsibilities */}
        <section id="client" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              7
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              7. Client Premise Responsibilities
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>For installations, client premises must provide:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Safe and lawful physical access to installation locations, ceilings, and duct risers.</li>
              <li>Continuous 220V AC electrical power points near the NVR/DVR and network switches.</li>
              <li>An active internet broadband connection (minimum recommended 5–10 Mbps upload) if remote smartphone viewing (Hik-Connect / DMSS) is required.</li>
              <li>Authorized client representative present for final handover and camera angle sign-off.</li>
            </ul>
          </div>
        </section>

        {/* Section 8: Warranty Alignment */}
        <section id="warranty" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              8
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              8. Hardware Warranty & Workmanship Alignment
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Hardware warranties are governed by our official <button type="button" onClick={() => onNavigate('warranty')} className="text-[#F15A24] font-bold hover:underline">Warranty Policy</button>. All genuine products carry manufacturer distributor coverage. Turnkey installations executed by CamneX include 1-Year installation workmanship coverage.
            </p>
          </div>
        </section>

        {/* Section 9: Cancellations & Returns */}
        <section id="cancellation" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              9
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              9. Cancellations, Returns & Adjustments
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Cancellations prior to package dispatch are processed with zero cancellation fee. For hardware returns following delivery, conditions outlined in our <button type="button" onClick={() => onNavigate('refund')} className="text-[#F15A24] font-bold hover:underline">Return & Refund Policy</button> apply.
            </p>
          </div>
        </section>

        {/* Section 10: Intellectual Property */}
        <section id="ip" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              10
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              10. Intellectual Property Rights & Trademarks
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              All CamneX branding, graphics, website software, and package builder calculation architectures are the intellectual property of CamneX Bangladesh.
            </p>
            <p>
              Hikvision, Dahua, ZKTeco, Ruijie, Western Digital, Seagate, and other third-party brand names and logos are registered trademarks of their respective owners, used under authorized partner and retailer relationships.
            </p>
          </div>
        </section>

        {/* Section 11: Limitation of Liability */}
        <section id="liability" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              11
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              11. Limitation of Liability
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Security systems are deterrent and monitoring tools. CamneX Bangladesh does not guarantee prevention of theft, trespassing, or accidents. CamneX is not liable for indirect or consequential damages arising from third-party ISP outages, load-shedding power loss, or client failure to maintain backup power.
            </p>
          </div>
        </section>

        {/* Section 12: Notices & Inquiries */}
        <section id="contact" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              12
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              12. Governing Law, Notices & Contact
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              These terms are governed by the commercial laws of the People's Republic of Bangladesh. Official notices and inquiries regarding these terms may be directed to our operations center:
            </p>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <div><strong>CamneX Bangladesh — Legal & Commercial Operations</strong></div>
              <div>Address: {address}</div>
              <div>Hotline: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-[#F15A24] font-bold">{phone}</a></div>
              <div>Email: <a href={`mailto:${email}`} className="text-[#F15A24] font-bold">{email}</a></div>
            </div>
          </div>
        </section>

        {/* Website Manager Custom Overrides if configured */}
        {settings?.termsPolicyText && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <Badge variant="orange">Administrative Notice</Badge>
            <h3 className="font-bold text-sm text-[#111827]">Additional Store Specific Terms</h3>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {settings.termsPolicyText}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

