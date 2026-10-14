import React, { useState, useEffect } from 'react';
import {
  Video,
  Wifi,
  Network,
  Fingerprint,
  Server,
  Wrench,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageSquare,
  Upload,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Home,
  Flame,
  Building,
  FileText,
  Sliders
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Input, Select, Badge, Alert } from '../components/common/UI';
import { quoteService, cmsService } from '../services';
import { ServiceType, QuoteRequest, FaqItem } from '../types';
import { INITIAL_FAQS } from '../services/seedData';

interface ServicesPageProps {
  onNavigate: (route: string, param?: string) => void;
}

interface ServiceCardData {
  id: string;
  title: string;
  serviceType: ServiceType;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  benefits: [string, string, string];
}

const SERVICES_DATA: ServiceCardData[] = [
  {
    id: 'cctv-surveillance',
    title: 'CCTV & Video Surveillance Installation',
    serviceType: 'cctv_installation',
    icon: Video,
    description: 'Turnkey installation of IP, AcuSense AI, and ColorVu surveillance systems for residential, corporate, and commercial premises in Dhaka.',
    benefits: [
      'High-definition 1080p to 4K resolution clarity',
      'Concealed conduit cabling standards (no loose wires)',
      'Authorized partner hardware with official warranty'
    ]
  },
  {
    id: 'ip-wifi-cameras',
    title: 'IP & Wi-Fi Camera Solutions',
    serviceType: 'cctv_installation',
    icon: Wifi,
    description: 'Smart wireless camera deployments with two-way audio, local SD card recording, and direct mobile cloud streaming without NVR hardware.',
    benefits: [
      'Clean wireless installation with minimal disruption',
      'Two-way audio communication and smart siren alerts',
      'Secure smartphone streaming anytime, anywhere'
    ]
  },
  {
    id: 'networking-wifi',
    title: 'Enterprise Networking & Wi-Fi',
    serviceType: 'networking_wifi',
    icon: Network,
    description: 'Structured Cat6 network cabling, server rack management, PoE switch provisioning, and seamless roaming Wi-Fi 6 access points.',
    benefits: [
      'Pure solid copper Cat6 gigabit backhaul cabling',
      'High-density Wi-Fi 6 ceiling APs with seamless handoff',
      'Clean patch panel termination with cable labeling'
    ]
  },
  {
    id: 'access-control-biometrics',
    title: 'Access Control & Biometric Attendance',
    serviceType: 'access_control_biometric',
    icon: Fingerprint,
    description: 'ZKTeco facial recognition and optical fingerprint terminals integrated with heavy-duty electromagnetic door locks and payroll logging.',
    benefits: [
      'Sub-second facial and fingerprint recognition',
      'Heavy-duty electromagnetic locks for glass/metal doors',
      'Automated attendance reports and shift log exports'
    ]
  },
  {
    id: 'it-infrastructure',
    title: 'Complete IT Infrastructure',
    serviceType: 'it_infrastructure',
    icon: Server,
    description: 'End-to-end office IT engineering integrating surveillance, structured LAN distribution, server rack installation, and UPS power protection.',
    benefits: [
      'Unified security, network, and power architecture',
      'Standardized floor plan port labeling and documentation',
      'Single-point engineering accountability across Dhaka'
    ]
  },
  {
    id: 'preventive-maintenance-amc',
    title: 'Preventive Maintenance & AMC',
    serviceType: 'maintenance_amc',
    icon: Wrench,
    description: 'Scheduled preventive servicing, periodic camera lens cleaning, storage health monitoring, firmware patching, and priority emergency response.',
    benefits: [
      'Periodic on-site hardware inspections and cleaning',
      'Storage drive health checks and power stability monitoring',
      'Priority emergency technician dispatch in Dhaka'
    ]
  },
  {
    id: 'site-survey-consultation',
    title: 'Physical Site Survey & Consultation',
    serviceType: 'site_survey',
    icon: ClipboardCheck,
    description: 'On-site engineering inspection across Dhaka to assess blind spots, measure cable pathways, check power stability, and formulate an itemized bill of materials.',
    benefits: [
      'Precise camera vantage point and blind spot mapping',
      'Accurate cable distance calculation with zero hidden costs',
      'Zero-obligation itemized BOQ engineering proposal'
    ]
  },
  {
    id: 'home-automation-smart-living',
    title: 'Home Automation & Smart Living',
    serviceType: 'home_automation',
    icon: Home,
    description: 'Integrated smart IoT lighting, motorized curtain relays, environmental sensors, and centralized mobile app automation for modern Dhaka residences.',
    benefits: [
      'Centralized smartphone & voice app control routines',
      'Automated security & scheduled lighting schedules',
      'Integrated motion & environmental sensor alerts'
    ]
  },
  {
    id: 'fire-safety-detection',
    title: 'Fire Safety & Detection Systems',
    serviceType: 'fire_safety',
    icon: Flame,
    description: 'Conventional and addressable smoke detection, heat sensors, manual call points, and audible alarm integration for commercial and residential buildings in Dhaka.',
    benefits: [
      'Early-stage optical smoke & heat detection sensors',
      'Multi-zone control panel & sounder integration',
      'Concealed fire-rated cabling & battery backup'
    ]
  }
];

const PROCESS_STEPS = [
  {
    stepNumber: '01',
    title: 'Consultation & Site Survey',
    description: 'Our engineering team assesses your site layout, identifies coverage blind spots, and evaluates cabling pathways across your Dhaka premises.'
  },
  {
    stepNumber: '02',
    title: 'Itemized Project Proposal',
    description: 'You receive a transparent bill of materials detailing exact camera models, recorder storage capacity, cable measurements, and labor fees.'
  },
  {
    stepNumber: '03',
    title: 'Engineering & Installation',
    description: 'Certified technicians execute neat concealed conduit cabling, mount hardware securely, terminate patch panels, and configure network links.'
  },
  {
    stepNumber: '04',
    title: 'Handover, Testing & Support',
    description: 'We test all feeds, configure mobile apps (Hik-Connect / DMSS), conduct user training, and hand over warranty and documentation.'
  }
];

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  // Quote form state
  const [serviceType, setServiceType] = useState<ServiceType>('cctv_installation');
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyType, setPropertyType] = useState<'home' | 'office' | 'shop' | 'warehouse' | 'factory' | 'other'>('office');
  const [siteAddress, setSiteAddress] = useState('');
  const [cameraCount, setCameraCount] = useState<number>(4);
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // FAQ state
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    cmsService.getFaqs()
      .then((items) => {
        if (items && items.length > 0) {
          setFaqs(items);
        } else {
          setFaqs(INITIAL_FAQS);
        }
      })
      .catch(() => setFaqs(INITIAL_FAQS));
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectServiceAndQuote = (service: ServiceType) => {
    setServiceType(service);
    scrollToSection('quote-section');
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !siteAddress.trim()) {
      setErrorMessage('Please fill in your name, mobile phone number, and site address in Dhaka.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await quoteService.createQuote({
        customerName: customerName.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        serviceType,
        propertyType,
        siteAddress: siteAddress.trim(),
        cameraCount: Number(cameraCount) || 1,
        preferredDate: preferredDate.trim() || undefined,
        notes: notes.trim(),
        attachmentName: fileName.trim() || undefined
      });
      setSubmittedQuote(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit quote inquiry. Please contact our engineering desk directly via phone or WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 md:py-12 text-[#111827]">
      <SEO
        title="Professional Security, Surveillance & Network Engineering Services | CamneX Bangladesh"
        description="Turnkey CCTV installation, IP Wi-Fi camera setup, enterprise networking, biometric access control, and maintenance services across Dhaka."
        canonicalPath="/services"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'Services & Engineering' }
          ]}
        />

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 1: Page Introduction (Hero Card matching SolutionsPage) */}
        {/* ------------------------------------------------------------------ */}
        <section id="services-intro" className="bg-white p-7 sm:p-10 lg:p-12 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dhaka Engineering Services</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-[#111827] tracking-tight leading-tight max-w-4xl">
            Professional Security, Surveillance &amp; Network Engineering Services
          </h1>

          <p className="text-sm sm:text-base text-[#5B6472] leading-relaxed max-w-3xl">
            From single-residence setups to multi-story enterprise facilities, CamneX provides turnkey installation, premises inspection, and preventative maintenance across Dhaka with structured cabling standards and verifiable genuine hardware.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToSection('services-overview')}
              className="min-h-[44px] px-6 sm:px-7 py-2.5 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-orange-600/20 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('quote-section')}
              className="min-h-[44px] px-6 py-2.5 bg-white hover:bg-[#FAF7F2] border border-[#EDE8E1] hover:border-[#F15A24] text-[#111827] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              Request a Quote
            </button>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 2: Services Overview (7 Service Cards matching Card System) */}
        {/* ------------------------------------------------------------------ */}
        <section id="services-overview" className="scroll-mt-24 space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Turnkey Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Our Core Engineering Services
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6472] max-w-2xl">
              Select a specialized engineering capability to view benefits and request an itemized proposal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_DATA.map((srv) => {
              const IconComponent = srv.icon;
              return (
                <div
                  key={srv.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${srv.title} and request a quote`}
                  onClick={() => handleSelectServiceAndQuote(srv.serviceType)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectServiceAndQuote(srv.serviceType);
                    }
                  }}
                  className="bg-white rounded-[24px] border border-[#EDE8E1] p-6 sm:p-7 hover:border-[#F15A24]/40 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#F15A24] focus:ring-offset-2"
                >
                  <div>
                    {/* Icon Tile */}
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F15A24] flex items-center justify-center font-bold mb-4 group-hover:scale-105 group-hover:bg-[#F15A24] group-hover:text-white transition-all duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-black text-lg sm:text-xl text-[#111827] group-hover:text-[#F15A24] transition-colors mb-2">
                      {srv.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#5B6472] leading-relaxed line-clamp-3 mb-4">
                      {srv.description}
                    </p>

                    {/* Up to 3 Concise Benefits */}
                    <div className="pt-3 border-t border-[#EDE8E1] space-y-2 mb-5">
                      {srv.benefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-xs text-[#334155]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#F15A24] shrink-0 mt-0.5" />
                          <span className="font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-4 border-t border-[#EDE8E1] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F15A24] group-hover:translate-x-0.5 transition-transform">
                      Request a Quote
                    </span>
                    <div className="w-9 h-9 rounded-full bg-orange-50 text-[#F15A24] flex items-center justify-center group-hover:bg-[#F15A24] group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3: How Our Service Works (4-Step Process) */}
        {/* ------------------------------------------------------------------ */}
        <section id="how-it-works" className="bg-white rounded-[28px] border border-[#EDE8E1] p-7 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standardized Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              How Our Service Works
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6472] max-w-2xl">
              A structured 4-step deployment methodology ensuring transparency, clean engineering, and reliable long-term performance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-2">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.stepNumber}
                className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EDE8E1] space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-black tracking-wider text-[#F15A24] font-mono mb-2">
                    STEP {step.stepNumber}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#111827] font-heading mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#5B6472] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 4: Request a Quote (Reusing Real quoteService Logic) */}
        {/* ------------------------------------------------------------------ */}
        <section id="quote-section" className="scroll-mt-24 bg-white p-7 sm:p-10 lg:p-12 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-8">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Inquiry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Request a Custom Quote or Site Survey
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6472] max-w-2xl">
              Submit your property and hardware requirements. Our Dhaka engineering team will evaluate your layout and provide an itemized proposal with zero hidden cable costs.
            </p>
          </div>

          {submittedQuote ? (
            <div className="bg-[#FAF7F2] p-8 sm:p-10 rounded-[24px] border border-[#EDE8E1] max-w-2xl mx-auto text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <Badge variant="success">Quotation Inquiry Logged</Badge>

              <h3 className="text-2xl sm:text-3xl font-black text-[#111827] font-heading">
                Inquiry Ref: {submittedQuote.quoteNumber}
              </h3>

              <p className="text-sm text-[#5B6472] leading-relaxed">
                Thank you, <strong className="text-[#111827]">{submittedQuote.customerName}</strong>. Our engineering team has received your project details for <strong className="text-[#111827]">{submittedQuote.siteAddress}</strong>.
              </p>

              <div className="p-4 bg-white rounded-xl border border-[#EDE8E1] text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5B6472]">Service Category:</span>
                  <span className="font-bold text-[#111827]">{submittedQuote.serviceType.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6472]">Contact Number:</span>
                  <span className="font-medium text-[#111827]">{submittedQuote.phone}</span>
                </div>
                {submittedQuote.companyName && (
                  <div className="flex justify-between">
                    <span className="text-[#5B6472]">Company:</span>
                    <span className="font-medium text-[#111827]">{submittedQuote.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5B6472]">Estimated Devices:</span>
                  <span className="font-medium text-[#111827]">{submittedQuote.cameraCount}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/8801540535150?text=Hello%20CamneX%20Engineering,%20I%20have%20submitted%20Quote%20Ref:%20${submittedQuote.quoteNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp Now</span>
                </a>

                <Button variant="outline" size="md" onClick={() => setSubmittedQuote(null)}>
                  Submit Another Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Column (8-col) */}
              <div className="lg:col-span-8 space-y-6">
                
                {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

                <form onSubmit={handleSubmitQuote} className="space-y-6">
                  
                  {/* Service Selection */}
                  <div>
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-2.5">
                      1. Select Required Service *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SERVICES_DATA.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => setServiceType(srv.serviceType)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            serviceType === srv.serviceType
                              ? 'border-[#F15A24] bg-orange-50/40 ring-1 ring-[#F15A24]'
                              : 'border-[#EDE8E1] bg-white hover:border-[#F15A24]/40 hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <div className="font-bold text-xs text-[#111827] mb-0.5">{srv.title}</div>
                          <div className="text-[11px] text-[#5B6472] line-clamp-1">{srv.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="pt-4 border-t border-[#EDE8E1]">
                    <span className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-3">
                      2. Contact &amp; Organization Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name *"
                        required
                        placeholder="e.g. Tanvir Ahmed"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <Input
                        label="Mobile Phone *"
                        required
                        placeholder="e.g. 01712-XXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <Input
                        label="Company / Organization (Optional)"
                        placeholder="e.g. Apex Holdings / Residence"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                      <Input
                        label="Email Address (Optional)"
                        type="email"
                        placeholder="e.g. name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Site Address & Property Type */}
                  <div className="pt-4 border-t border-[#EDE8E1]">
                    <span className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-3">
                      3. Site Environment &amp; Requirements
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <Select
                        label="Property Environment *"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value as any)}
                        options={[
                          { value: 'office', label: 'Corporate Office' },
                          { value: 'home', label: 'Residential Home / Villa' },
                          { value: 'shop', label: 'Retail Shop / Showroom' },
                          { value: 'warehouse', label: 'Warehouse / Logistics Hub' },
                          { value: 'factory', label: 'Manufacturing Factory' },
                          { value: 'other', label: 'Other Facility / Institute' }
                        ]}
                      />

                      <Input
                        label="Estimated Device Count (Cameras/Points)"
                        type="number"
                        min={1}
                        max={128}
                        value={cameraCount}
                        onChange={(e) => setCameraCount(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-1">
                        Site Address / Location in Dhaka *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="e.g. House 14, Road 11, Banani, Dhaka"
                        value={siteAddress}
                        onChange={(e) => setSiteAddress(e.target.value)}
                        className="w-full bg-white border border-[#EDE8E1] text-sm text-[#111827] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block mb-1">
                        Project Notes / Special Requirements (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Require high night-vision coverage for entry gate, concealed false ceiling cabling, and cloud access on 3 executive phones..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white border border-[#EDE8E1] text-sm text-[#111827] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                      />
                    </div>
                  </div>

                  {/* Optional Attachment */}
                  <div className="p-4 bg-[#FAF7F2] rounded-xl border border-dashed border-[#EDE8E1] text-center">
                    <Upload className="w-5 h-5 text-[#5B6472] mx-auto mb-1" />
                    <span className="text-xs text-[#5B6472] block">
                      Floor Plan, Layout Sketch or BOQ Document (Optional)
                    </span>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileName(e.target.files[0].name);
                        }
                      }}
                      className="text-xs text-[#5B6472] mt-2"
                    />
                    {fileName && (
                      <span className="text-xs font-bold text-emerald-600 block mt-1">
                        Attached: {fileName}
                      </span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[46px] w-full px-6 py-3 bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-600/20 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry for Site Survey & Quote'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>

                </form>

              </div>

              {/* Sidebar Info Column (4-col) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Urgent Contact Card */}
                <div className="bg-[#0F172A] text-white p-6 sm:p-7 rounded-[24px] border border-slate-800 space-y-4 shadow-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-[#F15A24] text-[11px] font-bold uppercase tracking-wider">
                    <span>Direct Engineering Desk</span>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white">
                    Need Immediate Consultation?
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Speak directly with a certified security and network engineer to verify hardware models or book an on-site survey.
                  </p>

                  <div className="pt-2 space-y-2.5">
                    <a
                      href="tel:+8801540535150"
                      className="flex items-center gap-2.5 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold text-white hover:border-[#F15A24] transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#F15A24]" />
                      <span>+880 1540-535150</span>
                    </a>

                    <a
                      href="https://wa.me/8801540535150?text=Hello%20CamneX%20Engineering%20Desk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 bg-emerald-950/40 rounded-xl border border-emerald-800 text-xs font-bold text-emerald-400 hover:border-emerald-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Engineering Desk</span>
                    </a>
                  </div>
                </div>

                {/* Installation Standards Checklist */}
                <div className="bg-[#FAF7F2] p-6 sm:p-7 rounded-[24px] border border-[#EDE8E1] space-y-3.5 text-xs text-[#5B6472] shadow-xs">
                  <span className="font-bold text-[#111827] uppercase tracking-wider block">
                    Our Installation Guarantees:
                  </span>
                  
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                    <span>Concealed PVC conduit trunking standard (zero hanging or exposed cables).</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                    <span>Verifiable manufacturer serial numbers on all cameras, switches &amp; recorders.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                    <span>Complimentary smartphone cloud streaming setup and operator training.</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                    <span>Transparent itemized billing with zero surprise cable measurement surcharges.</span>
                  </div>
                </div>

                {/* Plan Your Security & IT Project Panel */}
                <div className="bg-[#FAF7F2] p-6 sm:p-7 rounded-[24px] border border-[#EDE8E1] space-y-4 text-xs text-[#5B6472] shadow-xs">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#F15A24] text-[11px] font-bold uppercase tracking-wider">
                      <span>Preparation Guide</span>
                    </div>
                    <h3 className="text-base font-bold font-heading text-[#111827]">
                      Plan Your Security &amp; IT Project
                    </h3>
                    <p className="text-xs text-[#5B6472] leading-relaxed">
                      Providing these key project details helps our Dhaka engineering team produce a tailored, accurate bill of materials:
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0 mt-0.5">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-[#111827] block font-bold mb-0.5">Property Details</strong>
                        <p className="text-[#5B6472] leading-relaxed">
                          Facility type, floor count, square footage, and ceiling structure (false ceiling or open concrete slab) to evaluate conduit routing.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0 mt-0.5">
                        <Sliders className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-[#111827] block font-bold mb-0.5">Equipment Requirements</strong>
                        <p className="text-[#5B6472] leading-relaxed">
                          Target camera and point count, indoor vs. outdoor weather-sealing, night vision range, and video storage retention days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-[#111827] block font-bold mb-0.5">Supporting Documents</strong>
                        <p className="text-[#5B6472] leading-relaxed">
                          Architectural CAD drawings, PDF floor plans, rough layout sketches, or existing bills of quantities (BOQ) for faster evaluation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F15A24] flex items-center justify-center shrink-0 mt-0.5">
                        <Network className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <strong className="text-[#111827] block font-bold mb-0.5">Existing Infrastructure</strong>
                        <p className="text-[#5B6472] leading-relaxed">
                          Current internet uplink speed, server rack availability, and dedicated generator or online UPS power backup circuits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 5: Frequently Asked Questions (Accordion) */}
        {/* ------------------------------------------------------------------ */}
        <section id="services-faq" className="bg-white p-7 sm:p-10 rounded-[28px] border border-[#EDE8E1] shadow-xs space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F15A24] text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Verified Information</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#111827]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6472] max-w-2xl">
              Clear technical answers regarding hardware authenticity, mobile app viewing, and site visits across Dhaka.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.id || idx}
                  className="rounded-2xl border border-[#EDE8E1] bg-[#FAF7F2] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-[#111827] hover:text-[#F15A24] transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-[#F15A24] shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#5B6472] shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#5B6472] shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-[#5B6472] leading-relaxed border-t border-[#EDE8E1]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
