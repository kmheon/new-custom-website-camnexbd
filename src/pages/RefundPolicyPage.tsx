import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Package,
  Wrench,
  Clock
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { SiteSettings } from '../types';

interface RefundPolicyPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({ onNavigate }) => {
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
        title="Return & Refund Policy | CamneX Bangladesh"
        description="Clear, honest return and refund policies for hardware purchases, cancellation prior to dispatch, Dead on Arrival (DOA) replacements, and labor service distinctions."
        canonicalPath="/refund"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Refund Policy' }
          ]}
        />

        {/* Hero Header */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="orange">Customer Assurance Standards</Badge>
            <span className="text-xs text-slate-400 font-medium">Effective Date: October 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading leading-tight">
            Return & Refund Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            We stand behind the authenticity and reliability of every security and networking product we supply. Our return and refund policy is designed to be fair, transparent, and aligned with official Bangladesh distributor channels.
          </p>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-slate-800 leading-relaxed flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-[#F15A24] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-[#111827] block mb-0.5">Key Distinction: Hardware vs. Installation Labor</strong>
              <span>
                Physical hardware items in original, unmounted, unsealed condition are eligible for return under the conditions below. Custom installed cabling, cut PVC trunking, and completed technician on-site labor are non-refundable once installed on client premises.
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
              { id: 'scope', label: '1. Policy Scope' },
              { id: 'cancellation', label: '2. Order Cancellation' },
              { id: 'hardware', label: '3. Hardware Return Eligibility' },
              { id: 'doa', label: '4. Dead on Arrival (DOA)' },
              { id: 'nonrefundable', label: '5. Non-Refundable Items' },
              { id: 'processing', label: '6. Refund Processing' },
              { id: 'submission', label: '7. How to Submit Request' },
              { id: 'contact', label: '8. Support & Assistance' }
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

        {/* Section 1: Policy Scope */}
        <section id="scope" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              1. Policy Scope & Transparency Standards
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              This policy applies to hardware components and packaged surveillance bundles purchased through camnexbd.com or directly through our Dhaka sales desk.
            </p>
            <p>
              CamneX maintains strict honesty: we do not offer deceptive blanket "no-questions-asked" return promises for sensitive electronics, as manufacturer distributor serials must be tracked and protected against counterfeit returns.
            </p>
          </div>
        </section>

        {/* Section 2: Order Cancellation */}
        <section id="cancellation" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              2. Order Cancellation Prior to Dispatch
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Customers may cancel an unfulfilled hardware order at any time <strong>prior to physical courier dispatch or technician deployment</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Zero Cancellation Fee:</strong> Cancellations made before package hand-off to the courier carry zero penalty.</li>
              <li><strong>Advance Payments:</strong> If advance payment was made via bKash, Nagad, or Bank Transfer, the full payment will be refunded to the originating account.</li>
              <li><strong>Notice Method:</strong> Contact our dispatch team immediately by phone at <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-[#F15A24] font-bold">{phone}</a> or WhatsApp quoting your order reference number (CNX-ORD-...).</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Hardware Return Eligibility */}
        <section id="hardware" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              3. Physical Hardware Return Eligibility
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Delivered hardware items may be returned for exchange or refund within <strong>3 calendar days of delivery</strong> under the following mandatory criteria:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unopened & Unmounted</span>
                </div>
                <p className="text-xs text-slate-500">
                  Item must be unopened with factory seal, original box, foam inserts, and all accessories intact. Hardware that has been screwed onto walls or powered on is subject to warranty service, not return.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Matching Serial Barcode</span>
                </div>
                <p className="text-xs text-slate-500">
                  The serial barcode on the product body and box must match our invoice records and distributor database exactly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: DOA Replacement */}
        <section id="doa" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              4. Dead on Arrival (DOA) Hardware Replacement
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              If a camera, NVR, access control unit, or hard drive fails to power on or display video upon initial unboxing (Dead on Arrival):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Notify our engineering team within <strong>48 hours of delivery</strong>.</li>
              <li>Upon verification at our Chandrima Model Town service center, we provide an immediate direct replacement with a brand new unit of the same model (subject to stock availability).</li>
              <li>Return courier costs for verified DOA units will be covered by CamneX.</li>
            </ul>
          </div>
        </section>

        {/* Section 5: Non-Refundable Items */}
        <section id="nonrefundable" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              5. Non-Refundable Products & Completed Labor
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>The following items and services are strictly non-refundable:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Cabling & Conduits:</strong> Network Cat6 cables, coaxial cables, PVC conduits, and casing trunking cut, measured, or laid inside walls/ceilings during site installation.</li>
              <li><strong>Completed Installation Labor:</strong> Technician labor fees for completed drilling, cabling, camera mounting, and network configuration after client sign-off.</li>
              <li><strong>Site Survey Fees:</strong> Physical premises survey fees where survey was conducted and Bill of Materials delivered.</li>
              <li><strong>Physical/Electrical Damage:</strong> Equipment showing burned chips, water damage on indoor units, or cracked lenses (covered under paid repair, not refund).</li>
            </ul>
          </div>
        </section>

        {/* Section 6: Refund Processing */}
        <section id="processing" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              6. Refund Processing & Payment Methods
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>Once returned hardware is received and verified at our operations center:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>bKash / Nagad Payments:</strong> Refunded to the customer's original sending mobile wallet number within 2 to 4 working days following inspection.</li>
              <li><strong>Bank Transfers:</strong> Refunded via BEFTN/NPSB bank transfer to the client's corporate or individual bank account within 3 to 7 working days.</li>
              <li><strong>Cash on Delivery (COD) Returns:</strong> If an item is returned after payment upon delivery, the customer must provide a valid bKash, Nagad, or bank account for electronic disbursement following warehouse receipt.</li>
            </ul>
            <p className="text-[11px] text-slate-500 italic">
              Note: Banking holidays, electronic transfer clearing schedules, or mobile financial service maintenance windows may occasionally affect transfer receipt times.
            </p>
          </div>
        </section>

        {/* Section 7: How to Submit Request */}
        <section id="submission" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              7
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              7. How to Submit a Refund or Return Request
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>To initiate a return or refund request, follow these steps:</p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div><strong>1. Prepare Your Details:</strong> Have your Order Reference Number (CNX-ORD-...), purchase date, and device serial numbers ready.</div>
              <div><strong>2. Contact Support Desk:</strong> Call <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-[#F15A24] font-bold">{phone}</a> or submit a message through our Contact page.</div>
              <div><strong>3. Physical Inspection:</strong> Deliver or courier the item to our Chandrima Model Town center for serial and physical integrity verification.</div>
              <div><strong>4. Refund Disbursement:</strong> Upon verification, your refund is processed via MFS or Bank Transfer.</div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                size="md"
                onClick={() => onNavigate('contact')}
                className="bg-[#F15A24] text-white"
              >
                Submit Return Inquiry
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={() => onNavigate('tracking')}
              >
                Track Your Order
              </Button>
            </div>
          </div>
        </section>

        {/* Section 8: Support & Assistance */}
        <section id="contact" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              8
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              8. Return & Refund Support Desk
            </h2>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <div><strong>CamneX Bangladesh — Returns & Service Coordination</strong></div>
            <div>Center: {address}</div>
            <div>Phone: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-[#F15A24] font-bold">{phone}</a></div>
            <div>Email: <a href={`mailto:${email}`} className="text-[#F15A24] font-bold">{email}</a></div>
            <div>Working Hours: Saturday to Thursday, 9:30 AM to 7:30 PM</div>
          </div>
        </section>

        {/* Website Manager Custom Overrides if configured */}
        {settings?.returnPolicyText && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <Badge variant="orange">Administrative Notice</Badge>
            <h3 className="font-bold text-sm text-[#111827]">Additional Store Specific Return Terms</h3>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {settings.returnPolicyText}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

