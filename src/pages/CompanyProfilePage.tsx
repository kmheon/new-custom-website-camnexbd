import React, { useState, useEffect } from 'react';
import {
  Shield, Building2, Award, Users, CheckCircle, FileText, Phone, Mail,
  MapPin, Globe, Download, Printer, ExternalLink, Briefcase, ArrowRight,
  Wrench, Network, Lock, Cpu, Eye, AlertCircle, Sparkles, HelpCircle
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Badge } from '../components/common/UI';

export interface CompanyPageProps {
  initialTab?: string;
  onNavigate: (route: string, param?: string) => void;
}

const DEFAULT_FOUNDERS = [
  {
    id: 'founder-heon-khondokar',
    roleType: 'founder',
    name: 'Heon Khondokar',
    role: 'Founder & Engineer, CamneX Bangladesh',
    bio: 'Heon Khondokar leads technical delivery at CamneX Bangladesh, bringing practical engineering experience across IT support, networking, CCTV deployment, IT infrastructure, and system troubleshooting. He works directly with residential, commercial, and organizational clients to plan, configure, and support reliable security, networking, and IT solutions.',
    expertise: [
      'IT Support',
      'Networking',
      'CCTV Deployment',
      'IT Infrastructure',
      'Troubleshooting'
    ],
    responsibilities: 'Managing technical delivery and helping customers implement security, networking, and IT solutions.',
    photoUrl: '',
    photoPlaceholderNote: 'Profile photograph to be supplied via Website Manager',
    order: 1,
    socialLinks: {
      linkedin: '',
      facebook: '',
      email: 'contact@camnexbd.com'
    },
    isVerified: true,
    awaitingConfirmation: false,
    missingFields: ['Profile Photograph']
  },
  {
    id: 'cofounder-camnex',
    roleType: 'cofounder',
    name: '',
    role: 'Co-Founder, CamneX Bangladesh',
    bio: '',
    expertise: [],
    responsibilities: '',
    photoUrl: '',
    photoPlaceholderNote: 'Co-Founder portrait to be supplied via Website Manager',
    order: 2,
    socialLinks: {
      linkedin: '',
      facebook: '',
      email: ''
    },
    isVerified: false,
    awaitingConfirmation: true,
    missingFields: ['Full Name', 'Role Title', 'Biography', 'Profile Photograph']
  }
];

const DEFAULT_CERTIFICATIONS = [
  {
    id: 'cred-hikvision',
    title: 'Hikvision Authorized Partner',
    issuer: 'Hikvision',
    status: 'Verified Brand Credential',
    description: 'Authorized partner for Hikvision surveillance cameras, NVR/DVR recording systems, and security hardware.',
    logoUrl: '/images/brands/hikvision.svg',
    documentUrl: null,
    documentStatus: 'Supporting certificate document awaiting upload in Website Manager'
  },
  {
    id: 'cred-zkteco',
    title: 'ZKTeco Authorized Installer',
    issuer: 'ZKTeco',
    status: 'Verified Brand Credential',
    description: 'Authorized installer for ZKTeco biometric time attendance, access control terminals, and entrance control systems.',
    logoUrl: '/images/brands/zkteco.svg',
    documentUrl: null,
    documentStatus: 'Supporting certificate document awaiting upload in Website Manager'
  }
];

export const CompanySubNav: React.FC<{
  activePage: 'company_profile' | 'projects' | 'why_choose_us' | 'certifications' | 'contact';
  onNavigate: (route: string, param?: string) => void;
}> = ({ activePage, onNavigate }) => {
  const items = [
    { id: 'company_profile', label: 'Company Profile', route: 'company_profile' },
    { id: 'projects', label: 'Projects & Portfolio', route: 'projects' },
    { id: 'why_choose_us', label: 'Why Choose Us', route: 'why_choose_us' },
    { id: 'certifications', label: 'Certifications & Compliance', route: 'certifications' },
    { id: 'contact', label: 'Contact', route: 'contact' }
  ];

  return (
    <nav
      aria-label="Company section navigation"
      data-testid="company-subnav"
      className="no-print bg-white rounded-2xl border border-[#EDE8E1] p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none"
    >
      {items.map((item) => {
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`company-subnav-${item.id}`}
            onClick={() => onNavigate(item.route)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              isActive
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-[#5B6472] hover:text-[#111827] hover:bg-[#FAF7F2]'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

function useCompanyProfileData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/company-profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (isMounted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading };
}

// ============================================================================
// PAGE 1: COMPANY PROFILE (/company-profile, /about)
// ============================================================================
export const CompanyProfilePage: React.FC<CompanyPageProps> = ({ initialTab, onNavigate }) => {
  const { data } = useCompanyProfileData();

  // If navigated with initialTab="certifications" or hash="#certifications", render CertificationsCompliancePage directly
  if (initialTab === 'certifications') {
    return <CertificationsCompliancePage onNavigate={onNavigate} />;
  }

  const profile = data?.profile || {};
  const jsonLd = data?.jsonLd || null;
  const hasPdfDownload = Boolean(profile.pdf_url && String(profile.pdf_url).trim().length > 0);

  const foundersList: any[] =
    Array.isArray(profile.founders) && profile.founders.length > 0
      ? [...profile.founders].sort((a, b) => (a.order || 1) - (b.order || 2))
      : DEFAULT_FOUNDERS;

  const certsList: any[] =
    Array.isArray(profile.certifications) && profile.certifications.length > 0
      ? profile.certifications
      : DEFAULT_CERTIFICATIONS;

  const coreAreas = [
    {
      title: 'CCTV & Video Surveillance Installation',
      description: 'Planning, camera placement, DVR/NVR configuration, storage sizing, and structured cabling for homes, offices, shops, and commercial sites.',
      icon: Eye,
      actionLabel: 'Explore CCTV Packages',
      actionRoute: 'packages'
    },
    {
      title: 'Wi-Fi Camera Solutions',
      description: 'Indoor and outdoor smart wireless cameras with two-way audio, microSD or NVR recording, and mobile app configuration.',
      icon: Shield,
      actionLabel: 'Browse Catalog',
      actionRoute: 'catalog'
    },
    {
      title: 'Networking & Connectivity Solutions',
      description: 'PoE switching, structured Cat6 cabling, router configuration, and wireless access point deployment for stable connectivity.',
      icon: Network,
      actionLabel: 'View Networking Solutions',
      actionRoute: 'solutions'
    },
    {
      title: 'Access Control & Attendance Systems',
      description: 'Biometric fingerprint and facial recognition terminals, door access hardware, and attendance setup.',
      icon: Lock,
      actionLabel: 'Explore Brands',
      actionRoute: 'brands'
    },
    {
      title: 'IT Support & Maintenance',
      description: 'System troubleshooting, camera and network diagnostics, health checks, and ongoing technical support where applicable.',
      icon: Wrench,
      actionLabel: 'View Services',
      actionRoute: 'services'
    },
    {
      title: 'Security & Technology Hardware Supply',
      description: 'Supply of genuine surveillance cameras, recorders, switches, storage drives, and accessories from verified brands.',
      icon: Cpu,
      actionLabel: 'Explore Our Brands',
      actionRoute: 'brands'
    }
  ];

  const approachSteps = [
    {
      step: '01',
      title: 'Understand Customer Requirements',
      description: 'We review your site layout, coverage goals, connectivity conditions, and practical budget before recommending hardware.'
    },
    {
      step: '02',
      title: 'Recommend Suitable Products & Configurations',
      description: 'We match compatible cameras, recorders, storage drives, power supplies, and networking equipment to your needs.'
    },
    {
      step: '03',
      title: 'Plan Installation or Deployment',
      description: 'We coordinate cable routing, mounting positions, power provisioning, and network topology for a clean deployment.'
    },
    {
      step: '04',
      title: 'Configure, Test & Hand Over the System',
      description: 'We configure recording schedules, network settings, and customer-owned mobile viewing access, then test every channel.'
    },
    {
      step: '05',
      title: 'Provide Applicable Support & Maintenance',
      description: 'We assist with post-installation questions, warranty guidance under applicable product terms, and ongoing maintenance services.'
    }
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
      <SEO
        title="About CamneX Bangladesh — Company Profile | CamneX Bangladesh"
        description="CamneX Bangladesh provides security, networking, and IT solutions to help homes, businesses, and organizations build safer, more connected environments."
        canonicalPath="/company-profile"
      />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
        {/* Breadcrumb + Company Sub-Navigation */}
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Home', onClick: () => onNavigate('home') },
              { label: 'Company', onClick: () => onNavigate('company_profile') },
              { label: 'Company Profile' }
            ]}
          />
          <CompanySubNav activePage="company_profile" onNavigate={onNavigate} />
        </div>

        {/* HERO SECTION */}
        <section
          data-testid="company-profile-hero"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#F15A24] text-xs font-extrabold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>Company Profile · Dhaka, Bangladesh</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black font-heading text-[#111827] tracking-tight leading-[1.15]">
                About CamneX Bangladesh
              </h1>

              <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
                {profile.tagline ||
                  'CamneX Bangladesh provides security, networking, and IT solutions to help homes, businesses, and organizations build safer, more connected environments.'}
              </p>

              {/* Verified Brand Credentials Pills */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {certsList.map((cert: any, i: number) => (
                  <button
                    key={cert.id || i}
                    type="button"
                    onClick={() => onNavigate('certifications')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-orange-50/70 border border-[#EDE8E1] hover:border-[#F15A24]/40 text-xs font-bold text-[#111827] transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-[#F15A24] shrink-0" />
                    <span>{cert.title}</span>
                  </button>
                ))}
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  data-testid="company-hero-services-btn"
                  onClick={() => onNavigate('services')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <span>Explore Services</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-testid="company-hero-solutions-btn"
                  onClick={() => onNavigate('solutions')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  <span>View Solutions</span>
                </button>
                <button
                  type="button"
                  data-testid="company-hero-contact-btn"
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE8E1]/70 border border-[#EDE8E1] text-[#111827] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#F15A24]" />
                  <span>Contact Us</span>
                </button>
                {hasPdfDownload && (
                  <a
                    href={profile.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#EDE8E1] text-[#111827] text-xs font-bold transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#F15A24]" />
                    <span>Company Profile (PDF)</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Visual Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] p-5 sm:p-6 space-y-4">
                <div className="rounded-xl overflow-hidden border border-[#EDE8E1] bg-white">
                  <img
                    src="/images/projects/project-neutral.svg"
                    alt="CamneX Bangladesh Security, Surveillance & Networking Architecture"
                    className="w-full h-48 sm:h-56 object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-[#EDE8E1]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6472]">Headquarters</div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#111827] mt-1">Chandrima Model Town, Dhaka 1207</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#EDE8E1]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6472]">Direct Line</div>
                    <a
                      href={`tel:${(profile.primary_phone || '+8801540535150').replace(/\s+/g, '')}`}
                      className="text-xs sm:text-sm font-extrabold text-[#F15A24] hover:underline mt-1 block"
                    >
                      {profile.primary_phone || '+880 1540-535150'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPANY OVERVIEW & WHAT WE DO */}
        <section
          data-testid="company-overview-section"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">What We Do</span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Company Overview
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              {profile.experience_summary ||
                'CamneX Bangladesh provides CCTV and video surveillance installation, Wi-Fi camera solutions, networking and connectivity infrastructure, access control systems, and IT support and maintenance for residential, commercial, and organizational environments.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {coreAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.title}
                  className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] flex flex-col justify-between space-y-4 hover:border-[#F15A24]/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 text-[#F15A24] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-extrabold font-heading text-[#111827]">
                      {area.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                      {area.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(area.actionRoute)}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F15A24] hover:text-[#D94D1C] transition-colors cursor-pointer w-fit"
                  >
                    <span>{area.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* MISSION AND VISION */}
        <section
          data-testid="company-mission-vision-section"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-[24px] border border-[#EDE8E1] p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">Our Mission</span>
              {profile.mission_is_proposed !== false && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EDE8E1] text-[#5B6472]">
                  Proposed Statement · Editable in Website Manager
                </span>
              )}
            </div>
            <h3 className="text-xl font-black font-heading text-[#111827]">
              Practical, Dependable Solutions
            </h3>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              {profile.mission ||
                "To provide dependable security, surveillance, networking, and IT solutions tailored to each customer's practical requirements."}
            </p>
          </div>

          <div className="bg-white rounded-[24px] border border-[#EDE8E1] p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">Our Vision</span>
              {profile.vision_is_proposed !== false && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EDE8E1] text-[#5B6472]">
                  Proposed Statement · Editable in Website Manager
                </span>
              )}
            </div>
            <h3 className="text-xl font-black font-heading text-[#111827]">
              Trusted Technology Partner
            </h3>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              {profile.vision ||
                'To be a trusted partner in Bangladesh for practical, well-supported security, connectivity, and technology infrastructure.'}
            </p>
          </div>
        </section>

        {/* OUR APPROACH */}
        <section
          data-testid="company-approach-section"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">How We Work</span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Our Approach
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Every security or networking deployment follows a clear, structured customer journey from requirement review to system handover and support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {approachSteps.map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#111827] text-white text-xs font-black font-heading">
                    {item.step}
                  </div>
                  <h3 className="text-sm font-extrabold font-heading text-[#111827] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MEET OUR FOUNDERS — FOUNDER & CO-FOUNDER SECTION */}
        <section
          id="founders"
          data-testid="founders-section"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#F15A24] text-xs font-extrabold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Leadership</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Meet Our Founders
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              Leadership focused on practical engineering, reliable systems, and responsive customer support.
            </p>
          </div>

          {/* Two-card desktop layout, stacked mobile layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {foundersList.map((founder: any, index: number) => {
              const isCoFounder = founder.roleType === 'cofounder' || index === 1;
              const hasName = Boolean(founder.name && String(founder.name).trim().length > 0);
              const hasBio = Boolean(founder.bio && String(founder.bio).trim().length > 0);
              const hasPhoto = Boolean(founder.photoUrl && String(founder.photoUrl).trim().length > 0);
              const expertiseTags: string[] = Array.isArray(founder.expertise) ? founder.expertise : [];

              return (
                <article
                  key={founder.id || index}
                  data-testid={isCoFounder ? 'cofounder-profile-card' : 'founder-profile-card'}
                  className="rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] p-6 sm:p-8 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-6">
                    {/* Top Row: Portrait Frame + Identity */}
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                      {/* Dedicated Portrait Frame */}
                      <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl bg-white border-2 border-[#EDE8E1] overflow-hidden shrink-0 flex flex-col items-center justify-center text-center p-2 relative shadow-2xs">
                        {hasPhoto ? (
                          <img
                            src={founder.photoUrl}
                            alt={hasName ? founder.name : isCoFounder ? 'Co-Founder portrait' : 'Founder portrait'}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div
                            data-testid={isCoFounder ? 'cofounder-photo-placeholder' : 'founder-photo-placeholder'}
                            className="flex flex-col items-center justify-center h-full px-1.5 space-y-1.5"
                          >
                            <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-200/70 text-[#F15A24] flex items-center justify-center font-black text-sm font-heading">
                              {hasName
                                ? String(founder.name)
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                : 'CF'}
                            </div>
                            <span className="text-[10px] font-semibold text-[#5B6472] leading-tight">
                              Portrait awaiting upload in Website Manager
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name & Role Header */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-orange-50 text-[#F15A24] border border-orange-200/80">
                            {isCoFounder ? 'Co-Founder' : 'Founder'}
                          </span>
                          {!hasName || !hasBio ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Profile Awaiting Confirmation</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Verified Leadership Profile</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black font-heading text-[#111827] leading-tight">
                          {hasName ? founder.name : 'Co-Founder Profile (Awaiting Confirmation)'}
                        </h3>

                        <p className="text-xs sm:text-sm font-bold text-[#F15A24]">
                          {founder.role || (isCoFounder ? 'Co-Founder, CamneX Bangladesh' : 'Founder & Engineer, CamneX Bangladesh')}
                        </p>
                      </div>
                    </div>

                    {/* Biography & Responsibilities */}
                    {hasBio ? (
                      <div className="space-y-4">
                        <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                          {founder.bio}
                        </p>

                        {founder.responsibilities && (
                          <div className="p-4 rounded-xl bg-white border border-[#EDE8E1] space-y-1">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#111827]">
                              Key Responsibilities
                            </div>
                            <p className="text-xs text-[#4B5563] leading-relaxed">
                              {founder.responsibilities}
                            </p>
                          </div>
                        )}

                        {expertiseTags.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B6472]">
                              Areas of Focus
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {expertiseTags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#EDE8E1] text-xs font-bold text-[#111827]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl bg-white border border-[#EDE8E1] space-y-3">
                        <div className="text-xs font-extrabold text-[#111827]">
                          Co-Founder Details Ready for Website Manager Configuration
                        </div>
                        <p className="text-xs text-[#4B5563] leading-relaxed">
                          This leadership profile card is reserved for the Co-Founder of CamneX Bangladesh. To maintain strict corporate accuracy, no unverified name, biography, or portrait is displayed until confirmed.
                        </p>
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6472]">
                            Fields Awaiting Confirmation in Website Manager:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(founder.missingFields || ['Full Name', 'Role Title', 'Biography', 'Profile Photograph']).map(
                              (field: string) => (
                                <span
                                  key={field}
                                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#EDE8E1] text-[11px] font-bold text-[#5B6472]"
                                >
                                  • {field}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Contact / Social links if present */}
                  <div className="pt-4 border-t border-[#EDE8E1] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B6472]">
                    {founder.socialLinks?.email ? (
                      <a
                        href={`mailto:${founder.socialLinks.email}`}
                        className="inline-flex items-center gap-1.5 font-bold text-[#111827] hover:text-[#F15A24] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#F15A24]" />
                        <span>{founder.socialLinks.email}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#5B6472]">
                        Managed via Website Manager → Company Profile
                      </span>
                    )}

                    {founder.socialLinks?.linkedin && (
                      <a
                        href={founder.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#F15A24] hover:underline"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* EXPLORE MORE IN COMPANY SECTION (Cross-links to all Company pages) */}
        <section
          data-testid="company-cross-links"
          className="bg-[#111827] text-white rounded-[28px] p-6 sm:p-10 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                Explore CamneX Bangladesh
              </span>
              <h2 className="text-2xl font-black font-heading text-white">
                Continue Exploring Our Company Section
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
            >
              <span>Speak With Our Team</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Projects & Portfolio',
                desc: 'Learn about the types of surveillance, networking, and IT work we deliver.',
                route: 'projects'
              },
              {
                title: 'Why Choose Us',
                desc: 'See how we match products, compatibility, and installation to your needs.',
                route: 'why_choose_us'
              },
              {
                title: 'Certifications & Compliance',
                desc: 'Review our Hikvision and ZKTeco authorizations and warranty alignment.',
                route: 'certifications'
              },
              {
                title: 'Contact Us',
                desc: 'Reach our Chandrima Model Town, Dhaka office or send an inquiry online.',
                route: 'contact'
              }
            ].map((card) => (
              <button
                key={card.route}
                type="button"
                onClick={() => onNavigate(card.route)}
                className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left space-y-2 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <h3 className="text-sm font-extrabold text-white flex items-center justify-between">
                    <span>{card.title}</span>
                    <ArrowRight className="w-4 h-4 text-[#F15A24]" />
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{card.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 3: WHY CHOOSE US (/why-choose-us)
// ============================================================================
export const WhyChooseUsPage: React.FC<CompanyPageProps> = ({ onNavigate }) => {
  const { data } = useCompanyProfileData();
  const profile = data?.profile || {};
  const certsList: any[] =
    Array.isArray(profile.certifications) && profile.certifications.length > 0
      ? profile.certifications
      : DEFAULT_CERTIFICATIONS;

  const pillars = [
    {
      title: 'Solutions Matched to Customer Requirements',
      description:
        'We evaluate your site layout, indoor/outdoor lighting conditions, coverage zones, and retention goals so you get equipment suited to your actual property rather than generic bundles.',
      icon: CheckCircle
    },
    {
      title: 'Product & System Compatibility Considerations',
      description:
        'We check camera signal types (IP PoE, Analogue/HD, Wi-Fi), recorder channel capacities, PoE power budgets, and surveillance-grade storage compatibility before deployment.',
      icon: Cpu
    },
    {
      title: 'Professional Installation & Configuration',
      description:
        'Where installation services are included, our team handles cable routing, camera mounting, recorder initialization, storage formatting, and mobile viewing setup.',
      icon: Wrench
    },
    {
      title: 'Security, Networking & IT Expertise',
      description:
        'Because modern security systems rely on stable local networks, we combine CCTV deployment experience with practical LAN switching, Wi-Fi coverage, and IT troubleshooting skills.',
      icon: Network
    },
    {
      title: 'Clear Product Recommendations & Quotations',
      description:
        'Our quotations and Package Builder provide itemized Bills of Materials (BOM) that clearly distinguish hardware prices, accessories, and optional installation scope.',
      icon: FileText
    },
    {
      title: 'Genuine Products & Verified Warranty Information',
      description:
        'We supply authentic hardware from recognized brands with transparent warranty terms aligned with official manufacturer or distributor policies.',
      icon: Shield
    }
  ];

  const customerProcess = [
    {
      step: 'Step 1',
      title: 'Requirement Discussion or Site Review',
      detail: 'Share your property type, camera count, or networking issue by phone, WhatsApp, or online inquiry.'
    },
    {
      step: 'Step 2',
      title: 'Compatible System Recommendation',
      detail: 'Receive a clear hardware recommendation or itemized quotation matched to your technical and budget requirements.'
    },
    {
      step: 'Step 3',
      title: 'Installation, Configuration & Testing',
      detail: 'When installation is requested, we deploy cabling, mount devices, configure recording, and verify camera angles.'
    },
    {
      step: 'Step 4',
      title: 'Handover & Ongoing Support',
      detail: 'We hand over system credentials to you and remain available for applicable warranty assistance and maintenance.'
    }
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
      <SEO
        title="Why Choose CamneX Bangladesh | CamneX Bangladesh"
        description="Discover why residential, commercial, and organizational customers choose CamneX Bangladesh for security, surveillance, networking, and IT solutions."
        canonicalPath="/why-choose-us"
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Home', onClick: () => onNavigate('home') },
              { label: 'Company', onClick: () => onNavigate('company_profile') },
              { label: 'Why Choose Us' }
            ]}
          />
          <CompanySubNav activePage="why_choose_us" onNavigate={onNavigate} />
        </div>

        {/* HERO */}
        <section
          data-testid="why-choose-us-hero"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 lg:p-12 shadow-xs space-y-5"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#F15A24] text-xs font-extrabold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Practical Value & Engineering Care</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black font-heading text-[#111827] tracking-tight leading-[1.15]">
            Why Choose CamneX Bangladesh
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-3xl leading-relaxed">
            Choosing a security or networking provider is about more than buying boxes of hardware. At CamneX Bangladesh, we focus on compatible system design, genuine equipment, and practical engineering support tailored to your environment.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('packages')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <span>Build a Custom Package</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <span>View Our Services</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('brands')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE8E1]/70 border border-[#EDE8E1] text-[#111827] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <span>Explore Brands</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE8E1]/70 border border-[#EDE8E1] text-[#111827] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <span>Contact Us</span>
            </button>
          </div>
        </section>

        {/* 6 VALUE PILLARS */}
        <section
          data-testid="why-choose-us-pillars"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
              What Sets Our Approach Apart
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Practical Engineering & Transparent Guidance
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed">
              We focus on clear technical recommendations, verified hardware compatibility, and dependable setup for homes, offices, retail spaces, and organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 text-[#F15A24] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold font-heading text-[#111827]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CUSTOMER PROCESS: CONSULTATION TO DEPLOYMENT */}
        <section
          data-testid="why-choose-us-process"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
              Customer Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              From Initial Consultation to System Handover
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {customerProcess.map((proc) => (
              <div
                key={proc.step}
                className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-2.5"
              >
                <span className="inline-block px-2.5 py-1 rounded-lg bg-[#111827] text-white text-[11px] font-black uppercase tracking-wider">
                  {proc.step}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold font-heading text-[#111827]">
                  {proc.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  {proc.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* VERIFIED BRAND CREDENTIALS */}
        <section
          data-testid="why-choose-us-credentials"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
                Verified Brand Authorizations
              </span>
              <h2 className="text-2xl font-black font-heading text-[#111827]">
                Recognized Brand Credentials
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563]">
                Brand authorizations and warranties apply to eligible products in accordance with official manufacturer and supplier terms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('certifications')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE8E1]/70 border border-[#EDE8E1] text-xs font-bold text-[#111827] transition-colors cursor-pointer shrink-0"
            >
              <span>View Certifications & Compliance</span>
              <ArrowRight className="w-4 h-4 text-[#F15A24]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {certsList.map((cert: any, idx: number) => (
              <div
                key={cert.id || idx}
                className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] flex flex-col sm:flex-row items-start sm:items-center gap-5"
              >
                <div className="w-20 h-16 rounded-xl bg-white border border-[#EDE8E1] p-3 flex items-center justify-center shrink-0">
                  {cert.logoUrl ? (
                    <img src={cert.logoUrl} alt={cert.issuer || cert.title} className="max-h-10 max-w-full object-contain" />
                  ) : (
                    <Award className="w-7 h-7 text-[#F15A24]" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#F15A24]">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{cert.status || 'Verified Brand Credential'}</span>
                  </div>
                  <h3 className="text-base font-black font-heading text-[#111827]">{cert.title}</h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {cert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================================
// PAGE 4: CERTIFICATIONS & COMPLIANCE (/certifications)
// ============================================================================
export const CertificationsCompliancePage: React.FC<CompanyPageProps> = ({ onNavigate }) => {
  const { data } = useCompanyProfileData();
  const profile = data?.profile || {};
  const certsList: any[] =
    Array.isArray(profile.certifications) && profile.certifications.length > 0
      ? profile.certifications
      : DEFAULT_CERTIFICATIONS;

  const compliancePillars = [
    {
      title: 'Manufacturer & Distributor Warranties',
      description:
        'Eligible hardware products supplied by CamneX Bangladesh carry official manufacturer or authorized distributor warranties according to the specific product SKU and supplier policy. Warranty duration and claim procedures are stated on quotations and invoices where applicable.'
    },
    {
      title: 'Product Authenticity & Sourcing',
      description:
        'We source surveillance cameras, NVR/DVR recorders, biometric terminals, and networking equipment through authorized distribution channels so customers receive genuine hardware with verifiable model numbers.'
    },
    {
      title: 'Installation & Workmanship Terms',
      description:
        'Where physical installation, cabling, or configuration services are included in a customer order or project scope, service deliverables and support terms are documented clearly prior to deployment.'
    },
    {
      title: 'Privacy, Security & Data-Handling Practices',
      description:
        'During camera and recorder setup, mobile viewing accounts (such as Hik-Connect or ZKTeco apps) are registered directly to the customer. Customers retain full administrative control of their device passwords and video recordings.'
    }
  ];

  return (
    <div id="certifications" className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
      <SEO
        title="Certifications & Compliance | CamneX Bangladesh"
        description="Verified brand credentials including Hikvision Authorized Partner and ZKTeco Authorized Installer, warranty alignment, and operational compliance."
        canonicalPath="/certifications"
      />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-10">
        <div className="space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Home', onClick: () => onNavigate('home') },
              { label: 'Company', onClick: () => onNavigate('company_profile') },
              { label: 'Certifications & Compliance' }
            ]}
          />
          <CompanySubNav activePage="certifications" onNavigate={onNavigate} />
        </div>

        {/* HERO */}
        <section
          data-testid="certifications-hero"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 lg:p-12 shadow-xs space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#F15A24] text-xs font-extrabold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Credentials & Operational Compliance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black font-heading text-[#111827] tracking-tight leading-[1.15]">
            Certifications & Compliance
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-3xl leading-relaxed">
            CamneX Bangladesh maintains verified brand authorizations and follows transparent product authenticity, warranty, and customer privacy practices across our hardware supply and installation services.
          </p>
        </section>

        {/* VERIFIED CREDENTIALS CARDS */}
        <section
          data-testid="verified-credentials-section"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-6"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
              Verified Authorizations
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Brand Partnerships & Installer Credentials
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              Only verified brand credentials are listed below. Supporting certificate files can be attached or updated by administrators in Website Manager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certsList.map((cert: any, idx: number) => {
              const hasDoc = Boolean(cert.documentUrl && String(cert.documentUrl).trim().length > 0);
              return (
                <article
                  key={cert.id || idx}
                  data-testid={`credential-card-${idx}`}
                  className="p-6 sm:p-8 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-28 h-16 rounded-xl bg-white border border-[#EDE8E1] p-3 flex items-center justify-center">
                        {cert.logoUrl ? (
                          <img
                            src={cert.logoUrl}
                            alt={cert.issuer || cert.title}
                            className="max-h-10 max-w-full object-contain"
                          />
                        ) : (
                          <Award className="w-7 h-7 text-[#F15A24]" />
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Credential</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#F15A24]">
                        Issuing Brand: {cert.issuer || 'Official Brand Partner'}
                      </div>
                      <h3 className="text-xl font-black font-heading text-[#111827]">
                        {cert.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                        {cert.description}
                      </p>
                    </div>
                  </div>

                  {/* Certificate Document Area (Never fabricates document numbers/dates) */}
                  <div className="pt-4 border-t border-[#EDE8E1]">
                    {hasDoc ? (
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-[#F15A24] text-white text-xs font-bold transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Supporting Certificate Document</span>
                      </a>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-white border border-[#EDE8E1] flex items-start gap-2.5 text-xs text-[#5B6472]">
                        <FileText className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#111827] block font-bold">
                            Certificate Document Slot Ready
                          </strong>
                          <span>
                            {cert.documentStatus ||
                              'Supporting certificate document copy awaiting upload in Website Manager. No unverified certificate numbers or dates are displayed.'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* COMPLIANCE & WARRANTY ALIGNMENT */}
        <section
          data-testid="compliance-standards-section"
          className="bg-white rounded-[28px] border border-[#EDE8E1] p-6 sm:p-10 shadow-xs space-y-6"
        >
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F15A24]">
              Customer Protection & Policies
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Warranty, Authenticity & Data Compliance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {compliancePillars.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-2.5"
              >
                <h3 className="text-base font-extrabold font-heading text-[#111827] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#F15A24] shrink-0" />
                  <span>{item.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#EDE8E1]">
            <p className="text-xs text-[#5B6472]">
              Need verification details or have a compliance question for a quotation? Contact our office directly.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('warranty')}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE8E1]/70 border border-[#EDE8E1] text-xs font-bold text-[#111827] transition-colors cursor-pointer"
              >
                Read Warranty Policy
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 rounded-xl bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Contact CamneX Bangladesh
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
