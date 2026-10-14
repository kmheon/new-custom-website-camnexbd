import React, { useState, useEffect } from 'react';
import {
  Shield, Building2, Award, Users, CheckCircle, FileText, Phone, Mail,
  MapPin, Globe, Download, Printer, ExternalLink, Calendar, Briefcase, Landmark
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Badge, Button, Card } from '../components/common/UI';

interface CompanyProfilePageProps {
  initialTab?: string;
  onNavigate: (route: string, param?: string) => void;
}

export const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ initialTab, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'identity', 'capabilities', 'partners', 'certifications', 'milestones', 'banking', 'contact'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, [initialTab]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/company-profile')
      .then(res => res.json())
      .then(d => {
        if (isMounted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const profile = data?.profile || {};
  const partners = data?.partners || [];
  const services = data?.services || [];
  const projects = data?.projects || [];
  const jsonLd = data?.jsonLd || null;

  const hasBankingDetails = Boolean(profile.bank_name && profile.bank_account_number);
  const hasPdfDownload = Boolean(profile.pdf_url && String(profile.pdf_url).trim().length > 0);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 md:py-14 text-[#111827]">
      <SEO
        title={`${profile.legal_name || 'CamneX Bangladesh'} | Official Corporate Profile`}
        description={profile.tagline || 'Official corporate profile, engineering credentials, certifications, and compliance details for CamneX Bangladesh.'}
        canonicalPath="/company-profile"
      />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Embedded print stylesheet */}
      <style>{`
        @media print {
          header, footer, nav, #app-header, #app-footer, .no-print, button:not(.print-include) {
            display: none !important;
          }
          body, .bg-\\[\\#FAF7F2\\] {
            background: white !important;
            color: #000 !important;
            font-size: 10pt !important;
          }
          .print-block {
            display: block !important;
            page-break-inside: avoid;
            margin-bottom: 1.5rem;
          }
          .print-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            border-radius: 4px !important;
            padding: 12pt !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="no-print">
          <Breadcrumbs
            items={[
              { label: 'Home', onClick: () => onNavigate('home') },
              { label: 'Company Profile' }
            ]}
          />
        </div>

        {/* Corporate Header Tile */}
        <div className="bg-white p-8 sm:p-12 rounded-[28px] border border-[#EDE8E1] shadow-xs relative overflow-hidden print-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F15A24] text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified Corporate Entity · Dhaka, Bangladesh</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-[#111827] tracking-tight">
                {profile.legal_name || 'CamneX Bangladesh'}
              </h1>
              <p className="text-base sm:text-lg text-[#5B6472] font-medium leading-relaxed">
                {profile.tagline || 'Enterprise Security, Surveillance & Networking Solutions'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6472] pt-1">
                <span>Founded: <strong>{profile.founded_year || 2020}</strong></span>
                <span>·</span>
                <span>HQ: <strong>Dhaka, Bangladesh</strong></span>
                <span>·</span>
                <span>Scope: <strong>Turnkey Nationwide Enterprise Deployment</strong></span>
              </div>
            </div>

            {/* Action Buttons: PDF Download (conditional) & Print */}
            <div className="flex flex-wrap sm:flex-col gap-3 shrink-0 no-print">
              {hasPdfDownload && (
                <a
                  href={profile.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Company Profile (PDF)</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#FAF7F2] hover:bg-[#EDE8E1] border border-[#EDE8E1] text-[#111827] text-xs font-bold transition-all"
              >
                <Printer className="w-4 h-4 text-[#5B6472]" />
                <span>Print Bid Profile Sheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Desktop / Tablet) */}
        <div className="no-print border-b border-[#EDE8E1] overflow-x-auto scrollbar-none flex gap-2">
          {[
            { id: 'overview', label: 'Overview & Story', icon: Building2 },
            { id: 'identity', label: 'Legal & Corporate Identity', icon: FileText },
            { id: 'capabilities', label: 'Capabilities & Scope', icon: Briefcase },
            { id: 'partners', label: 'Technology Partners', icon: Award },
            { id: 'certifications', label: 'Certifications & Compliance', icon: Shield },
            { id: 'milestones', label: 'Milestones & Stats', icon: Calendar },
            ...(hasBankingDetails ? [{ id: 'banking', label: 'Banking Details', icon: Landmark }] : []),
            { id: 'contact', label: 'Contact & Offices', icon: Phone }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  window.history.replaceState(null, '', `#${t.id}`);
                }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'border-[#F15A24] text-[#F15A24]'
                    : 'border-transparent text-[#5B6472] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & STORY */}
        {(activeTab === 'overview' || loading) && (
          <div className="space-y-6 print-block">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-8 rounded-[24px] border border-[#EDE8E1] shadow-xs space-y-4 print-card">
                <h2 className="text-xl font-black font-heading text-[#111827]">Corporate Overview</h2>
                <p className="text-sm text-[#5B6472] leading-relaxed">
                  {profile.experience_summary || 'CamneX Bangladesh is a registered specialized engineering firm delivering commercial surveillance, biometric access control, perimeter security, and enterprise fiber/PoE networking infrastructure across Bangladesh.'}
                </p>
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                    <div className="text-xs font-bold text-[#F15A24] uppercase tracking-wider mb-1">Our Mission</div>
                    <p className="text-xs text-[#5B6472] leading-relaxed">
                      {profile.mission || 'To eliminate hardware gray-market risks in Bangladesh by providing 100% genuine authorized equipment with accountable Dhaka engineering warranties.'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                    <div className="text-xs font-bold text-[#F15A24] uppercase tracking-wider mb-1">Our Vision</div>
                    <p className="text-xs text-[#5B6472] leading-relaxed">
                      {profile.vision || 'To become the benchmark corporate infrastructure partner for institutional facilities, multi-branch banks, and commercial enterprises nationwide.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fast Stats Card */}
              <div className="bg-white p-8 rounded-[24px] border border-[#EDE8E1] shadow-xs space-y-6 print-card">
                <h3 className="text-base font-bold text-[#111827]">At A Glance</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-black text-[#F15A24] font-heading">{profile.completed_project_count || '500+'}</div>
                    <div className="text-xs text-[#5B6472] font-medium">Turnkey Projects Deployed</div>
                  </div>
                  <div className="h-px bg-[#EDE8E1]" />
                  <div>
                    <div className="text-2xl font-black text-[#111827] font-heading">{profile.active_client_count || '350+'}</div>
                    <div className="text-xs text-[#5B6472] font-medium">Active Corporate Clients</div>
                  </div>
                  <div className="h-px bg-[#EDE8E1]" />
                  <div>
                    <div className="text-2xl font-black text-[#111827] font-heading">{profile.team_size_band || '20+'}</div>
                    <div className="text-xs text-[#5B6472] font-medium">Qualified Engineers & Technicians</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEGAL & CORPORATE IDENTITY */}
        {activeTab === 'identity' && (
          <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-block print-card">
            <div>
              <h2 className="text-2xl font-black font-heading text-[#111827]">Legal & Corporate Identity</h2>
              <p className="text-xs text-[#5B6472] mt-1">
                Official regulatory credentials and compliance registrations for tender submissions and corporate PO verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                <div className="text-[11px] font-bold text-[#5B6472] uppercase">Registered Legal Name</div>
                <div className="text-sm font-black text-[#111827] mt-1">{profile.legal_name || 'CamneX Bangladesh'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                <div className="text-[11px] font-bold text-[#5B6472] uppercase">Commercial Trade Name</div>
                <div className="text-sm font-black text-[#111827] mt-1">{profile.trade_name || 'CamneX'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                <div className="text-[11px] font-bold text-[#5B6472] uppercase">Year of Establishment</div>
                <div className="text-sm font-black text-[#111827] mt-1">{profile.founded_year || '2020'}</div>
              </div>

              {profile.trade_license_number && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Trade License No.</div>
                  <div className="text-sm font-mono font-bold text-[#111827] mt-1">{profile.trade_license_number}</div>
                </div>
              )}

              {profile.bin && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Business Identification (BIN)</div>
                  <div className="text-sm font-mono font-bold text-[#111827] mt-1">{profile.bin}</div>
                </div>
              )}

              {profile.tin && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Taxpayer ID (TIN)</div>
                  <div className="text-sm font-mono font-bold text-[#111827] mt-1">{profile.tin}</div>
                </div>
              )}

              {profile.registration_number && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Company Registration No.</div>
                  <div className="text-sm font-mono font-bold text-[#111827] mt-1">{profile.registration_number}</div>
                </div>
              )}

              {profile.tax_circle && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Tax Circle / Zone</div>
                  <div className="text-sm font-mono font-bold text-[#111827] mt-1">{profile.tax_circle}</div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 text-xs text-[#5B6472] space-y-1">
              <strong className="text-[#111827] block font-bold">Official Document Submissions:</strong>
              <span>
                To request official physical copies of trade licenses, TIN, BIN, or bank solvency certificates for corporate RFP bids, please email <a href={`mailto:${profile.sales_email || 'sales@camnexbd.com'}`} className="text-[#F15A24] underline">{profile.sales_email || 'sales@camnexbd.com'}</a>.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: CAPABILITIES & SCOPE */}
        {activeTab === 'capabilities' && (
          <div className="space-y-6 print-block">
            <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-card">
              <div>
                <h2 className="text-2xl font-black font-heading text-[#111827]">Engineering Capabilities & Scope</h2>
                <p className="text-xs text-[#5B6472] mt-1">Our in-house capabilities span end-to-end design, implementation, and long-term service agreements.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'IP CCTV & AI Video Analytics',
                    desc: 'Full-Color night vision, ANPR vehicle plate recognition, perimeter tripwire line crossing, and central control room NVR/VMS clustering.'
                  },
                  {
                    title: 'Biometric Access Control & Time Attendance',
                    desc: 'Multi-door magnetic EM locks, facial recognition turnstiles, RFID card controllers, and multi-branch automated payroll integration.'
                  },
                  {
                    title: 'Enterprise Structured Cabling & Fiber',
                    desc: 'Cat6 UTP/STP structured cabling, PVC conduit trunking, multi-mode/single-mode fiber splicing, and server rack patch management.'
                  },
                  {
                    title: 'Managed PoE Switching & VLAN Routing',
                    desc: 'Gigabit and 10G layer-2/layer-3 managed PoE switches, isolated security camera VLANs, and traffic QoS bandwidth prioritization.'
                  },
                  {
                    title: 'Commercial Wi-Fi 6 Mesh Networks',
                    desc: 'Seamless roaming ceiling access points, captive guest portals, multi-SSID office isolation, and cloud controller monitoring.'
                  },
                  {
                    title: 'Annual Maintenance Contracts (AMC)',
                    desc: 'Quarterly preventative hardware health checkups, firmware security hardening, onsite camera lens realignments, and 24-hr emergency response.'
                  }
                ].map(c => (
                  <div key={c.title} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-[#111827]">{c.title}</h3>
                    <p className="text-xs text-[#5B6472] leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TECHNOLOGY PARTNERS */}
        {activeTab === 'partners' && (
          <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-block print-card">
            <div>
              <h2 className="text-2xl font-black font-heading text-[#111827]">Authorized Technology Partners</h2>
              <p className="text-xs text-[#5B6472] mt-1">We distribute, configure, and service Tier-1 enterprise hardware backed by official warranty protection.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {partners.map((p: any) => (
                <div key={p.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] flex flex-col items-center text-center justify-center space-y-2">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.name} className="h-10 object-contain max-w-[120px]" />
                  ) : (
                    <div className="h-10 flex items-center justify-center font-black text-sm text-[#111827] font-heading">{p.name}</div>
                  )}
                  <span className="text-xs font-bold text-[#111827]">{p.name}</span>
                  {p.isPartner ? (
                    <Badge variant="orange">Authorized Partner</Badge>
                  ) : (
                    <Badge variant="gray">Verified Hardware</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICATIONS & COMPLIANCE */}
        {activeTab === 'certifications' && (
          <div id="certifications" className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-block print-card">
            <div>
              <h2 className="text-2xl font-black font-heading text-[#111827]">Certifications & Compliance Standards</h2>
              <p className="text-xs text-[#5B6472] mt-1">Our engineering personnel hold verified manufacturer credentials and practice standardized deployment protocols.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(profile.certifications || []).map((c: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[#111827]">{c.title}</h3>
                  <div className="text-xs text-[#5B6472]">Issuer: <strong>{c.issuer}</strong></div>
                  {c.year && <div className="text-xs text-[#5B6472]">Year: <strong>{c.year}</strong></div>}
                </div>
              ))}
            </div>

            {profile.industry_memberships && profile.industry_memberships.length > 0 && (
              <div className="pt-4 border-t border-[#EDE8E1]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6472] mb-3">Industry Memberships</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.industry_memberships.map((m: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: KEY MILESTONES & STATS */}
        {activeTab === 'milestones' && (
          <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-block print-card">
            <div>
              <h2 className="text-2xl font-black font-heading text-[#111827]">Milestones & Institutional Track Record</h2>
              <p className="text-xs text-[#5B6472] mt-1">Historical track record and performance metrics.</p>
            </div>

            <div className="space-y-6">
              {[
                { year: '2020', title: 'Firm Established in Dhaka', desc: 'CamneX founded with initial focus on high-fidelity IP video surveillance and structured Cat6 trunking.' },
                { year: '2022', title: 'Hikvision & Dahua Partnership Recognition', desc: 'Achieved authorized partner status; established central diagnostic testing bench for optical sensors.' },
                { year: '2024', title: '350+ Corporate Implementations Reached', desc: 'Expanded into commercial multi-floor Wi-Fi 6 and ZKTeco enterprise biometric attendance gateways.' },
                { year: '2026', title: 'Unified Platform Launch & Nationwide Delivery', desc: 'Integrated digital quotation and live tracking system with same-day metropolitan dispatch.' }
              ].map((m, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-16 h-8 rounded-full bg-orange-100 text-[#F15A24] font-black text-xs flex items-center justify-center shrink-0">
                    {m.year}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">{m.title}</h3>
                    <p className="text-xs text-[#5B6472] mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: BANKING DETAILS (Shown ONLY if present) */}
        {hasBankingDetails && activeTab === 'banking' && (
          <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-block print-card">
            <div>
              <h2 className="text-2xl font-black font-heading text-[#111827]">Corporate Banking Details</h2>
              <p className="text-xs text-[#5B6472] mt-1">Official bank account credentials for corporate accounts payable, purchase orders, and wire transfers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                <div className="text-[11px] font-bold text-[#5B6472] uppercase">Bank Name</div>
                <div className="text-sm font-black text-[#111827] mt-1">{profile.bank_name}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                <div className="text-[11px] font-bold text-[#5B6472] uppercase">Account Name</div>
                <div className="text-sm font-black text-[#111827] mt-1">{profile.bank_account_name || profile.legal_name}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                <div className="text-[11px] font-bold text-[#5B6472] uppercase">Account Number</div>
                <div className="text-sm font-mono font-black text-[#111827] mt-1">{profile.bank_account_number}</div>
              </div>
              {profile.bank_branch && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Branch</div>
                  <div className="text-sm font-medium text-[#111827] mt-1">{profile.bank_branch}</div>
                </div>
              )}
              {profile.routing_number && (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1]">
                  <div className="text-[11px] font-bold text-[#5B6472] uppercase">Routing Number</div>
                  <div className="text-sm font-mono font-medium text-[#111827] mt-1">{profile.routing_number}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: CONTACT & OFFICES */}
        {activeTab === 'contact' && (
          <div className="bg-white p-8 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6 print-block print-card">
            <div>
              <h2 className="text-2xl font-black font-heading text-[#111827]">Contact & Physical Offices</h2>
              <p className="text-xs text-[#5B6472] mt-1">Direct corporate contact points for engineering consultations, RFPs, and field support.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-3">
                <div className="flex items-center gap-2 text-[#F15A24] font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Corporate Office & Engineering Center</span>
                </div>
                <div className="text-sm font-bold text-[#111827]">
                  {profile.corporate_office || profile.registered_address || 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207, Bangladesh'}
                </div>
                <div className="text-xs text-[#5B6472]">
                  Hours: Sat-Thu 9:30 AM – 7:30 PM (Friday emergency dispatch on-call)
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-3">
                <div className="flex items-center gap-2 text-[#F15A24] font-bold text-xs uppercase tracking-wider">
                  <Phone className="w-4 h-4" />
                  <span>Direct Communication Lines</span>
                </div>
                <div className="space-y-1.5 text-xs text-[#5B6472]">
                  <div>Primary Phone: <strong className="text-[#111827] font-mono">{profile.primary_phone || '+880 1540-535150'}</strong></div>
                  <div>Corporate Sales Email: <strong className="text-[#111827] font-mono">{profile.sales_email || 'sales@camnexbd.com'}</strong></div>
                  <div>Engineering Support Email: <strong className="text-[#111827] font-mono">{profile.support_email || 'support@camnexbd.com'}</strong></div>
                  <div>Emergency Hotline: <strong className="text-[#F15A24] font-mono">{profile.hotline || '16000'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
