import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ExternalLink,
  Wrench,
  Clock,
  HelpCircle,
  PackageCheck,
  Search
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { cmsService } from '../services';
import { SiteSettings } from '../types';

interface WarrantyPolicyPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export const WarrantyPolicyPage: React.FC<WarrantyPolicyPageProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    cmsService.getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const phone = settings?.phone || '+880 1540-535150';
  const secondaryPhone = '+880 1410-085848';
  const email = settings?.supportEmail || 'support@camnexbd.com';
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
        title="Warranty & Service Policy | CamneX Bangladesh"
        description="Official manufacturer warranty terms, genuine serial verification, CamneX 1-Year installation workmanship guarantee, and step-by-step RMA claim process."
        canonicalPath="/warranty"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Warranty Policy' }
          ]}
        />

        {/* Page Hero Header */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="success">Official Policy Standards</Badge>
            <span className="text-xs text-slate-400 font-medium">Effective Date: October 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] font-heading leading-tight">
            Warranty & Service Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Every security camera, network recorder, biometric terminal, and storage drive supplied by CamneX Bangladesh carries genuine manufacturer warranty backed by official distribution in Bangladesh.
          </p>

          <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#F15A24] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#111827] block font-bold mb-0.5">Dual-Layer Protection Summary</strong>
              <span>
                1. <strong>Manufacturer Hardware Warranty:</strong> Provided directly through authorized brand distributor channels (Hikvision, ZKTeco, Ruijie, WD, Seagate) with genuine factory serial numbers.<br />
                2. <strong>CamneX Workmanship Guarantee:</strong> 1-Year on-site cabling, junction box waterproofing, and installation service support on all complete turnkey package deployments.
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
              { id: 'coverage', label: '1. Hardware Coverage' },
              { id: 'periods', label: '2. Warranty Periods' },
              { id: 'verification', label: '3. Serial Verification' },
              { id: 'workmanship', label: '4. Installation Workmanship' },
              { id: 'exclusions', label: '5. Exclusions & Voids' },
              { id: 'claims', label: '6. Claim & RMA Process' },
              { id: 'contact', label: '7. Official Claim Desk' }
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

        {/* Section 1: Hardware Coverage */}
        <section id="coverage" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              1. Product & Hardware Warranty Coverage
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              CamneX Bangladesh is an authorized partner and professional installer. We source hardware exclusively through verified brand distributor channels in Bangladesh. Hardware covered under this policy includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Hikvision:</strong> IP Cameras, Turbo HD Analogue Cameras, NVRs, DVRs, and PoE network switches.</li>
              <li><strong>ZKTeco:</strong> Biometric fingerprint and facial recognition time attendance terminals, RFID readers, and standalone access controllers.</li>
              <li><strong>Ruijie Reyee:</strong> Enterprise Wi-Fi 6 Access Points, cloud-managed gateway routers, and smart PoE switches.</li>
              <li><strong>Western Digital (WD Purple) & Seagate (SkyHawk):</strong> Official surveillance-grade internal hard disk drives.</li>
            </ul>
            <p>
              Hardware warranties cover internal manufacturing defects, optical sensor failures, motherboard malfunctions, and factory component failures under standard operational conditions.
            </p>
          </div>
        </section>

        {/* Section 2: Warranty Periods */}
        <section id="periods" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              2. Warranty Periods & Determination
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Warranty periods are established per equipment model according to manufacturer and authorized Bangladesh distributor policies, starting from the original invoice date:
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 font-bold text-[#111827]">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Hardware Category / Brand</th>
                    <th className="p-3 border-b border-slate-200">Standard Warranty Period</th>
                    <th className="p-3 border-b border-slate-200">Determination Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-semibold">Hikvision CCTV Cameras & Recorders</td>
                    <td className="p-3 text-slate-700">1 Year to 2 Years (model specific)</td>
                    <td className="p-3 text-slate-500">Official distributor warranty card & invoice</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">ZKTeco Biometric & Access Hardware</td>
                    <td className="p-3 text-slate-700">1 Year manufacturer warranty</td>
                    <td className="p-3 text-slate-500">Distributor sticker and serial log</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Ruijie Reyee Cloud APs & Gateways</td>
                    <td className="p-3 text-slate-700">3 Years official hardware warranty</td>
                    <td className="p-3 text-slate-500">Ruijie Cloud serial binding & invoice</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Western Digital (WD Purple) Hard Drives</td>
                    <td className="p-3 text-slate-700">3 Years distributor replacement warranty</td>
                    <td className="p-3 text-slate-500">WD official barcode verification</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Seagate SkyHawk Surveillance Hard Drives</td>
                    <td className="p-3 text-slate-700">3 Years distributor replacement warranty</td>
                    <td className="p-3 text-slate-500">Seagate regional distributor barcode</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Passive Accessories (Connectors, baluns, casing)</td>
                    <td className="p-3 text-slate-700">Checked upon installation handover</td>
                    <td className="p-3 text-slate-500">Handover testing checklist</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Important: Warranty duration must always be confirmed against your specific product invoice and serial number records. CamneX does not declare a single universal warranty duration for unlike product categories.
            </p>
          </div>
        </section>

        {/* Section 3: Serial Verification */}
        <section id="verification" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              3. Proof of Purchase & Serial Verification
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              To process any manufacturer warranty inspection or replacement, customers must maintain:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="font-bold text-[#111827] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authentic Serial Barcode</span>
                </div>
                <p className="text-xs text-slate-500">
                  The silver manufacturer label and barcode sticker on the physical camera body, recorder bottom, or terminal must remain legible and untampered.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="font-bold text-[#111827] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Invoice or Order Number</span>
                </div>
                <p className="text-xs text-slate-500">
                  CamneX physical sales invoice, digital order reference (CNX-ORD-...), or official quotation document issued during purchase.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Installation Workmanship */}
        <section id="workmanship" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              4. CamneX 1-Year Installation Workmanship Guarantee
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              In addition to product hardware coverage, client installations performed directly by CamneX Bangladesh technicians under our Turnkey Packages include our <strong>1-Year Workmanship Service Guarantee</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Cabling Integrity:</strong> Free on-site re-crimping and connection repair if video signals drop due to cabling connector faults.</li>
              <li><strong>Junction Box Protection:</strong> Free re-sealing of camera junction boxes if weather exposure causes outdoor moisture intrusion.</li>
              <li><strong>Network Re-linking:</strong> Support for re-establishing mobile cloud viewing (Hik-Connect / DMSS) if router or network configuration changes disrupt remote streams within the first year.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Note: Workmanship coverage applies only to cabling, conduit paths, and hardware mounted directly by CamneX staff. Modifications made by third-party electricians void workmanship support.
            </p>
          </div>
        </section>

        {/* Section 5: Exclusions & Voids */}
        <section id="exclusions" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              5. Potential Exclusions & Damage Not Covered
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Under official manufacturer guidelines, warranties do not cover damage resulting from external environmental, electrical, or physical causes beyond manufacturer control:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-1">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Electrical Surges & Lightning</span>
                </div>
                <p className="text-xs text-red-800/80">
                  Burnt circuit boards, scorched processor chips, or blown power ports caused by lightning strikes, erratic phase voltages, or ungrounded AC outlets.
                </p>
              </div>

              <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-1">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Physical & Impact Damage</span>
                </div>
                <p className="text-xs text-red-800/80">
                  Cracked camera lenses, dented domes, broken mounting arms, or severed cables caused by physical impact, construction accidents, or vandalism.
                </p>
              </div>

              <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-1">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Water Ingress on Indoor Models</span>
                </div>
                <p className="text-xs text-red-800/80">
                  Liquid damage on indoor plastic dome cameras or non-weatherproof switches placed in exposed open-air rain pathways.
                </p>
              </div>

              <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-xl space-y-1">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Unauthorized Disassembly</span>
                </div>
                <p className="text-xs text-red-800/80">
                  Torn warranty stickers, third-party soldering, unauthorized firmware flashing, or housing opened by unauthorized technicians.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Claim Process */}
        <section id="claims" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              6. Step-by-Step Warranty Claim & RMA Process
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="space-y-3">
              {[
                {
                  step: 'Step 1: Preliminary Diagnostic',
                  desc: 'Contact our technical desk via phone (+880 1540-535150) or WhatsApp with your device model, serial number, and a photo/video of the issue. Many issues (such as IP conflicts or app offline) can be resolved remotely without physical unmounting.'
                },
                {
                  step: 'Step 2: Physical Device Submission',
                  desc: 'If hardware fault is confirmed, bring or courier the unit to our Dhaka engineering center (Chandrima Model Town). Include power adapter and hard drive if related to recording faults.'
                },
                {
                  step: 'Step 3: Distributor Inspection & Testing',
                  desc: 'The device is logged and submitted to the official brand distributor service lab (Hikvision / ZKTeco / Ruijie) for hardware bench testing and validation.'
                },
                {
                  step: 'Step 4: Repair or Replacement Return',
                  desc: 'Depending on brand distributor policy, the unit will be repaired, chip-serviced, or replaced with an authorized replacement unit, then handed back or dispatched to the client.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                  <span className="font-bold text-[#F15A24] text-xs shrink-0 mt-0.5">0{idx + 1}.</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#111827]">{item.step}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              * Turnaround time is governed by authorized distributor service center queues (typically 7 to 15 working days for standard repairs). CamneX does not declare fictitious 24-hour manufacturer turnaround times without distributor policy confirmation.
            </p>
          </div>
        </section>

        {/* Section 7: Official Support Contacts */}
        <section id="contact" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
              7
            </div>
            <h2 className="text-xl font-bold text-[#111827] font-heading">
              7. Official Warranty Claim Desk
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="font-bold text-sm text-[#111827] flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F15A24]" />
                <span>Engineering & RMA Desk</span>
              </div>
              <p className="text-slate-600">
                Primary Hotline: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-bold text-[#F15A24]">{phone}</a><br />
                Secondary Support: <a href={`tel:${secondaryPhone.replace(/\s+/g, '')}`} className="font-bold text-slate-800">{secondaryPhone}</a><br />
                WhatsApp: <a href="https://wa.me/8801540535150" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold">8801540535150</a>
              </p>
              <div className="text-[11px] text-slate-400">
                Operating Hours: Sat–Thu, 9:30 AM – 7:30 PM (Friday emergency on-call)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="font-bold text-sm text-[#111827] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F15A24]" />
                <span>Physical Service Center</span>
              </div>
              <p className="text-slate-600 leading-snug">
                {address}
              </p>
              <p className="text-slate-600">
                Email: <a href={`mailto:${email}`} className="text-[#F15A24] font-bold">{email}</a>
              </p>
              <a
                href="https://maps.app.goo.gl/DkugCNAAmQZ6ZfrdA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F15A24] hover:underline pt-1"
              >
                <span>View Google Maps Location</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
            <Button
              size="md"
              onClick={() => onNavigate('support')}
              className="bg-[#F15A24] text-white"
            >
              Submit Online Warranty Inquiry
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => onNavigate('catalog')}
            >
              Browse Hardware Catalog
            </Button>
          </div>
        </section>

        {/* Website Manager Custom Overrides if configured */}
        {settings?.warrantyPolicyText && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <Badge variant="orange">Administrative Notice</Badge>
            <h3 className="font-bold text-sm text-[#111827]">Additional Store Specific Terms</h3>
            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {settings.warrantyPolicyText}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

