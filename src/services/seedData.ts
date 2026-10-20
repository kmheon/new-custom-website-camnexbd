import {
  SiteSettings,
  HomepageSection,
  Category,
  Brand,
  SpecTemplate,
  Product,
  SecurityPackage,
  BlogPost,
  ProjectCaseStudy,
  Testimonial,
  FaqItem,
  HeroSlide,
  ServiceItem,
  ProcessStep,
  ScenarioItem,
  CtaReassuranceItem,
  ServiceOffering,
  PackageSeries,
  PackageSystemType
} from '../types';

export const DEFAULT_SERVICES_LIST: ServiceItem[] = [
  {
    id: 'srv-cctv',
    title: 'CCTV Installation & Cabling',
    description: 'Professional IP & Turbo HD camera setup, clean concealed PVC conduit trunking, and NVR configuration.',
    icon: 'camera',
    link: '/services',
    enabled: true,
    order: 1
  },
  {
    id: 'srv-survey',
    title: 'Physical Site Survey',
    description: 'On-premise physical engineering inspection in Dhaka with coverage mapping, blind spot analysis, and itemized bill of materials.',
    icon: 'clipboard',
    link: '/quote',
    enabled: true,
    order: 2
  },
  {
    id: 'srv-wifi',
    title: 'Networking & Wi-Fi Setup',
    description: 'Server rack termination, Cat6 patch panels, high-density Wi-Fi 6 access points, and seamless roaming.',
    icon: 'wifi',
    link: '/services',
    enabled: true,
    order: 3
  },
  {
    id: 'srv-access',
    title: 'Access Control & Biometrics',
    description: 'ZKTeco facial recognition terminals, RFID attendance systems, electromagnetic glass door locks, and payroll report export.',
    icon: 'lock',
    link: '/services',
    enabled: true,
    order: 4
  },
  {
    id: 'srv-it',
    title: 'IT Support & Maintenance',
    description: 'Preventative quarterly lens cleaning, storage health checks, firmware security patches, and breakdown troubleshooting.',
    icon: 'wrench',
    link: '/services',
    enabled: true,
    order: 5
  },
  {
    id: 'srv-config',
    title: 'Configuration & setup',
    description: 'Cloud DDNS setup, Hik-Connect multi-device smartphone viewing, motion notification zones, and isolated security VLANs.',
    icon: 'settings',
    link: '/services',
    enabled: true,
    order: 6
  }
];

export const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Request',
    description: 'Submit your requirements online or request a survey.'
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Survey and quote',
    description: 'Site assessment and quotation.'
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Installation and support',
    description: 'System setup, testing, and standard warranty support.'
  }
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  companyName: 'CamneX Bangladesh',
  phone: '+880 1540-535150',
  email: 'contact@camnexbd.com',
  secondaryEmail: 'info@camnexbd.com',
  salesEmail: 'sales@camnexbd.com',
  ordersEmail: 'orders@camnexbd.com',
  supportEmail: 'support@camnexbd.com',
  accountsEmail: 'accounts@camnexbd.com',
  partnersEmail: 'partners@camnexbd.com',
  careersEmail: 'careers@camnexbd.com',
  website: 'https://camnexbd.com',
  facebookUrl: 'https://facebook.com/camnexbd',
  youtubeUrl: 'https://youtube.com/@camnexbd',
  linkedinUrl: 'https://linkedin.com/company/camnexbd',
  whatsappNumber: '8801540535150',
  address: 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207',
  credentials: [
    'Hikvision Authorized Partner',
    'ZKTeco Authorized Installer'
  ],
  services: [
    'CCTV/video surveillance',
    'Wi-Fi cameras',
    'Networking',
    'IT support and maintenance',
    'Access control',
    'Biometrics',
    'Smart security',
    'Installation',
    'Maintenance',
    'Site survey',
    'Configuration',
    'Network setup',
    'IT infrastructure'
  ],
  businessHours: 'Sat-Thu 9:30 AM - 7:30 PM, Friday on-call',
  enableStockBadges: true,
  sampleDataBanner: true,
  showSampleContent: false,
  announcementBar: {
    enabled: false,
    text: '',
    link: '',
    dismissible: true
  },
  topBarHighlights: [
    {
      id: 'tbh-auth',
      text: 'Hikvision & Dahua: Authorized Support Partner',
      icon: 'shield-check',
      link: '/brands',
      highlighted: true,
      enabled: true,
      order: 1
    },
    {
      id: 'tbh-warranty',
      text: 'Official Warranty',
      icon: 'shield',
      link: '/about',
      highlighted: false,
      enabled: false,
      order: 2
    },
    {
      id: 'tbh-nationwide',
      text: 'Nationwide Installation',
      icon: 'truck',
      link: '/services',
      highlighted: false,
      enabled: false,
      order: 3
    },
    {
      id: 'tbh-hours',
      text: 'Sat-Thu 9:30 AM - 7:30 PM, Friday on-call',
      icon: 'clock',
      link: '/contact',
      highlighted: false,
      enabled: false,
      order: 4
    }
  ],
  quickServiceSettings: {
    heading: 'Need a technician?',
    subtext: 'Technical consultations, cabling and installation, and hardware maintenance in Dhaka. Click a service below to schedule an engineer callback:',
    buttonText: 'Request a call back',
    nameLabel: 'Your Name *',
    namePlaceholder: 'e.g. Tanvir Ahmed',
    phoneLabel: 'Phone Number *',
    phonePlaceholder: '017XXXXXXXX',
    areaLabel: 'Dhaka Area / Location',
    areaPlaceholder: 'e.g. Uttara Sector 3, Dhanmondi, Mirpur',
    successMessage: 'Thank you! Our engineer will call you back promptly during business hours.',
    enableOtherOption: true
  },
  specialOfferSlider: {
    enabled: true,
    interval: 5,
    maxOffers: 5
  },
  servicesList: DEFAULT_SERVICES_LIST,
  processSteps: DEFAULT_PROCESS_STEPS,
  footer: {
    description: 'Security, surveillance, enterprise networking and IT infrastructure engineering in Dhaka, Bangladesh.',
    quickLinks: [
      { label: 'Home', route: 'home' },
      { label: 'Shop', route: 'catalog' },
      { label: 'Company Profile', route: 'company_profile' },
      { label: 'Projects & Portfolio', route: 'projects' },
      { label: 'Why Choose Us', route: 'why_choose_us' },
      { label: 'Certifications & Compliance', route: 'certifications' },
      { label: 'Contact', route: 'contact' }
    ],
    products: [
      { label: 'CCTV Cameras', route: 'category', param: 'cctv-cameras' },
      { label: 'IP Cameras', route: 'category', param: 'cctv-cameras' },
      { label: 'Network Equipment', route: 'category', param: 'network-switches' },
      { label: 'Access Control', route: 'category', param: 'biometrics-access-control' },
      { label: 'Time Attendance', route: 'category', param: 'biometrics-access-control' },
      { label: 'Smart Home', route: 'category', param: 'cctv-cameras' },
      { label: 'Accessories', route: 'category', param: 'cctv-accessories' }
    ],
    customerSupport: [
      { label: 'Warranty Policy', route: 'warranty' },
      { label: 'Technical Support', route: 'contact' },
      { label: 'FAQs', route: 'faq' },
      { label: 'Track Order', route: 'tracking' },
      { label: 'Privacy Policy', route: 'privacy' },
      { label: 'Terms & Conditions', route: 'terms' },
      { label: 'Refund Policy', route: 'refund' }
    ],
    newsletterText: 'Subscribe for product updates, new product releases, and security advisories.',
    copyrightText: '© 2026 CamneX Bangladesh. All Rights Reserved.',
    developerCredit: 'Designed & Developed by CamneX'
  },
  // Real Financial & Policy Settings (EMPTY by default until configured by admin)
  bkashMerchantNumber: '',
  nagadMerchantNumber: '',
  bankDetails: null,
  deliveryFeeInsideDhaka: null,
  deliveryFeeOutsideDhaka: null,
  installationBaseFee: null,
  enableCashOnDelivery: false,
  warrantyPolicyText: '',
  returnPolicyText: '',
  termsPolicyText: '',
  privacyPolicyText: '',
  letterheadTemplate: {
    id: 'tmpl-camnex-default',
    name: 'Official CamneX Bangladesh Letterhead',
    isDefault: true,
    companyName: 'CamneX Bangladesh',
    tagline: 'Certified Security Systems Integrator & Authorized Hikvision Partner',
    phone: '+880 1317-251000',
    email: 'info@camnexbd.com',
    website: 'https://camnexbd.com',
    address: 'Block A, Chandrima Model Town, Main Rd, Dhaka 1207',
    primaryColor: '#F15A24',
    secondaryColor: '#111827',
    validityDays: 7,
    disclaimerText: 'All prices are in BDT and valid for 7 calendar days from issue date. Cable allocations are based on 10m/camera engineering standards. Site installation, conduit piping, and commissioning quoted separately.'
  }
};


export const INITIAL_CTA_DATA = {
  eyebrow: 'Ready to get started',
  heading: 'Need Help Choosing the Right Security Solution?',
  subtext: 'Our specialists are ready to help you choose the perfect CCTV, networking, access control or smart security solution for your home or business.',
  cards: [
    {
      id: 'cta-wa',
      type: 'whatsapp' as const,
      title: 'WhatsApp Us',
      description: 'Chat directly with our Dhaka engineering support desk',
      actionUrl: 'https://wa.me/8801540535150?text=Hello%20CamneX%20Bangladesh,%20I%20would%20like%20to%20discuss%20a%20security%20solution'
    },
    {
      id: 'cta-call',
      type: 'call' as const,
      title: 'Call Now',
      phoneDisplay: '+880 1540-535150',
      description: 'Speak directly with a qualified security consultant',
      actionUrl: 'tel:+8801540535150'
    },
    {
      id: 'cta-survey',
      type: 'survey' as const,
      title: 'Book Site Visit',
      description: 'Schedule a physical premise and cable audit',
      actionUrl: '/quote'
    }
  ],
  reassurances: [] as CtaReassuranceItem[]
};

export const INITIAL_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: 'sec-hero', type: 'hero', title: 'Hero Banner', enabled: true, order: 1 },
  { id: 'sec-brands', type: 'brands', title: 'Brands We Work With', enabled: true, order: 2 },
  { id: 'sec-cats', type: 'categories', title: 'Shop by Category', enabled: true, order: 3 },
  { id: 'sec-popular', type: 'popular_products', title: 'Popular Products', enabled: true, order: 4 },
  { id: 'sec-offers', type: 'special_offers', title: 'Special Offers', enabled: true, order: 5 },
  { id: 'sec-wifi', type: 'wifi_series', title: 'Wi-Fi Series', eyebrow: 'Wi-Fi products', subtitle: 'Cameras, doorbells, lights and more you control from a phone app', enabled: true, order: 6, itemLimit: 8, showChipRow: true },
  { id: 'sec-new', type: 'new_arrivals', title: 'New Arrivals', enabled: true, order: 7 },
  { id: 'sec-pkgs', type: 'packages', title: 'CCTV Packages Selector', enabled: true, order: 8 },
  { id: 'sec-solutions', type: 'solutions', title: 'Our Solutions', enabled: true, order: 9 },
  { id: 'sec-services', type: 'services', title: 'Quick Service Request', enabled: true, order: 10 },
  { id: 'sec-accessories', type: 'accessories', title: 'Accessories & Add-ons', subtitle: 'Cables, storage, power and mounting for your setup', enabled: true, order: 11 },
  { id: 'sec-cat-cctv', type: 'category_row', title: 'CCTV Cameras', categorySlug: 'cctv-cameras', enabled: true, order: 12 },
  { id: 'sec-cat-access', type: 'category_row', title: 'Access Control & Biometrics', categorySlug: 'biometrics-access-control', enabled: true, order: 13 },
  { id: 'sec-cat-recorders', type: 'category_row', title: 'DVR & NVR Recorders', categorySlug: 'dvr-nvr-recorders', enabled: true, order: 14 },
  { id: 'sec-cat-net', type: 'category_row', title: 'Network Equipment & Wi-Fi', categorySlug: 'network-switches', enabled: true, order: 15 },
  { id: 'sec-testimonials', type: 'testimonials', title: 'Client Feedback', enabled: true, order: 16 },
  { id: 'sec-projects', type: 'projects', title: 'Recent Installation Projects', enabled: true, order: 17 },
  {
    id: 'sec-cta',
    type: 'quote_cta',
    title: 'Need Help Choosing the Right Security Solution?',
    enabled: true,
    order: 18,
    ctaData: INITIAL_CTA_DATA
  }
];

export const INITIAL_SERVICES: ServiceOffering[] = [
  {
    id: 'srv-cctv',
    title: 'CCTV Camera Installation',
    shortLabel: 'CCTV Setup',
    description: 'Mounting, cable termination, and field-of-view configuration for IP and Turbo HD cameras.',
    icon: 'Video',
    enabled: true,
    order: 1,
    solutionLink: '/solutions'
  },
  {
    id: 'srv-cabling',
    title: 'Cabling & Structured Wiring',
    shortLabel: 'Cabling & Wiring',
    description: 'Cat6 UTP and optical fiber backhaul cabling through neat PVC conduit in commercial premises.',
    icon: 'Cable',
    enabled: true,
    order: 2,
    solutionLink: '/solutions'
  },
  {
    id: 'srv-survey',
    title: 'Physical Site Survey',
    shortLabel: 'Site Survey',
    description: 'Inspection of camera vantage points, lighting levels, and power distribution across your Dhaka site.',
    icon: 'Compass',
    enabled: true,
    order: 3,
    solutionLink: '/solutions'
  },
  {
    id: 'srv-network',
    title: 'Network & Wi-Fi Configuration',
    shortLabel: 'Wi-Fi Networking',
    description: 'VLAN subnetting, PoE switch setup, and enterprise Wi-Fi 6 access point roaming setup.',
    icon: 'Wifi',
    enabled: true,
    order: 4,
    solutionLink: '/solutions'
  },
  {
    id: 'srv-access',
    title: 'Biometric Access Control',
    shortLabel: 'Access Control',
    description: 'Fingerprint and facial recognition terminal installation with magnetic door lock integration.',
    icon: 'Fingerprint',
    enabled: true,
    order: 5,
    solutionLink: '/solutions'
  },
  {
    id: 'srv-repair',
    title: 'Hardware Diagnosis & Repair',
    shortLabel: 'Repair & Service',
    description: 'Troubleshooting offline NVRs, failing hard disk drives, signal interference, and power supply issues.',
    icon: 'Wrench',
    enabled: true,
    order: 6,
    solutionLink: '/solutions'
  }
];

export const INITIAL_PACKAGE_SYSTEM_TYPES: PackageSystemType[] = [
  {
    id: 'systype-ip',
    name: 'IP / Network cameras (NVR, PoE)',
    slug: 'ip',
    shortLabel: 'IP',
    description: 'Network IP cameras with Power over Ethernet (PoE) delivery through NVR or Gigabit switch.',
    icon: 'Network',
    order: 1,
    enabled: true,
    ruleSet: {
      recorderType: 'nvr',
      cableType: 'cat6_utp',
      cableMetersPerCam: 30,
      powerSupplyType: 'poe_switch',
      storageType: 'surveillance_hdd',
      storageMap: { 4: '1TB', 8: '2TB', 16: '6TB', 32: '12TB', 64: '24TB' },
      hasBaluns: false,
      descriptionSummary: 'NVR, PoE through NVR or switch, Cat6 network cable per camera'
    }
  },
  {
    id: 'systype-analogue',
    name: 'Analogue / HD coaxial cameras (DVR)',
    slug: 'analogue',
    shortLabel: 'Analogue',
    description: 'Coaxial video cable with centralized 12V DC power supply and Turbo HD digital video recorder (DVR).',
    icon: 'Radio',
    order: 2,
    enabled: true,
    ruleSet: {
      recorderType: 'dvr',
      cableType: 'coaxial_dc',
      cableMetersPerCam: 20,
      powerSupplyType: 'centralized_12v',
      storageType: 'surveillance_hdd',
      storageMap: { 2: '500GB', 4: '1TB', 8: '2TB', 16: '4TB' },
      hasBaluns: true,
      descriptionSummary: 'DVR, video and power cable per camera, centralized 12V power supply'
    }
  },
  {
    id: 'systype-wireless',
    name: 'Wireless / Wi-Fi cameras',
    slug: 'wireless',
    shortLabel: 'Wi-Fi',
    description: 'Standalone smart Wi-Fi cameras with mobile app monitoring, local storage, or wireless NVR kit.',
    icon: 'Wifi',
    order: 3,
    enabled: true,
    ruleSet: {
      recorderType: 'none',
      cableType: 'none',
      cableMetersPerCam: 0,
      powerSupplyType: 'individual_adapters',
      storageType: 'microsd_or_nvr_hdd',
      storageMap: { 2: '128GB MicroSD', 4: '256GB MicroSD / 1TB HDD' },
      hasBaluns: false,
      descriptionSummary: 'No recorder, no cable; cameras, microSD storage or a wireless NVR kit, power adapters'
    }
  }
];

export const INITIAL_PACKAGE_SERIES: PackageSeries[] = [
  {
    id: 'series-ir',
    name: 'Night Vision (IR)',
    slug: 'night-vision-ir',
    description: 'Infrared surveillance using IRPF series cameras with smart EXIR night vision up to 20m. No artificial white lighting.',
    order: 1,
    enabled: true,
    illustration: 'night-vision',
    ruleSet: {
      hasStorageRule: true,
      storageMap: { 2: '500GB', 4: '1TB', 8: '2TB', 16: '4TB' },
      hasCableRule: true,
      cableMetersPerCam: 20,
      hasRecorderRule: true,
      recorderChannels: 4,
      allowPtz: false,
      allowPoESwitch: false
    }
  },
  {
    id: 'series-hybrid',
    name: 'Hybrid Light',
    slug: 'hybrid-light',
    description: 'Smart dual-light surveillance that operates in discreet IR mode until human or vehicle motion triggers warm supplemental light.',
    order: 2,
    enabled: true,
    illustration: 'hybrid',
    ruleSet: {
      hasStorageRule: true,
      storageMap: { 4: '1TB', 8: '2TB', 16: '4TB' },
      hasCableRule: true,
      cableMetersPerCam: 20,
      hasRecorderRule: true,
      recorderChannels: 4,
      allowPtz: false,
      allowPoESwitch: false
    }
  },
  {
    id: 'series-color',
    name: 'Full-Color',
    slug: 'full-color',
    description: 'Continuous full-color video capture with F1.0 super-aperture lenses and warm illumination in zero ambient light.',
    order: 3,
    enabled: true,
    illustration: 'full-color',
    ruleSet: {
      hasStorageRule: true,
      storageMap: { 4: '1TB', 8: '2TB', 16: '4TB' },
      hasCableRule: true,
      cableMetersPerCam: 20,
      hasRecorderRule: true,
      recorderChannels: 4,
      allowPtz: false,
      allowPoESwitch: false
    }
  },
  {
    id: 'series-enterprise',
    name: 'Enterprise & PTZ',
    slug: 'enterprise-ptz',
    description: 'High-density IP surveillance systems with 360° PTZ tracking cameras, Gigabit PoE switches, and rackmount NVR arrays.',
    order: 4,
    enabled: true,
    illustration: 'ptz-enterprise',
    ruleSet: {
      hasStorageRule: true,
      storageMap: { 16: '6TB', 32: '12TB', 64: '24TB' },
      hasCableRule: true,
      cableMetersPerCam: 30,
      hasRecorderRule: true,
      recorderChannels: 32,
      allowPtz: true,
      allowPoESwitch: true
    }
  }
];

export const INITIAL_SPEC_TEMPLATES: SpecTemplate[] = [
  {
    id: 'tpl-cctv',
    name: 'CCTV Camera',
    categorySlug: 'cctv-cameras',
    fields: [
      { id: 'f-res', name: 'Resolution', key: 'resolution', type: 'enum', options: ['2MP (1080p)', '4MP (2K)', '5MP Super HD', '8MP (4K)'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Resolution', order: 1 },
      { id: 'f-form', name: 'Form Factor', key: 'form_factor', type: 'enum', options: ['Bullet', 'Dome', 'Turret', 'PTZ'], filterable: true, comparable: true, shortLabel: 'Form Factor', order: 2 },
      { id: 'f-nv', name: 'Night Vision', key: 'night_vision', type: 'enum', options: ['IR Night Vision (up to 20m)', 'IR Night Vision (up to 40m)', 'ColorVu Full Color', 'Smart Hybrid Light'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Night Vision', order: 3 },
      { id: 'f-lens', name: 'Lens', key: 'lens', type: 'enum', options: ['2.8mm (Wide Angle)', '3.6mm (Standard)', '6mm (Long Range)', 'Motorized Varifocal'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Lens', order: 4 },
      { id: 'f-ip', name: 'Ingress Protection', key: 'ip_rating', type: 'enum', options: ['IP66 Weatherproof', 'IP67 Weatherproof', 'Indoor Use'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'IP Rating', order: 5 },
      { id: 'f-aud', name: 'Audio Support', key: 'audio_support', type: 'boolean', filterable: true, comparable: true, shortLabel: 'Audio Support', order: 6 }
    ]
  },
  {
    id: 'tpl-dvr',
    name: 'NVR / DVR Recorder',
    categorySlug: 'dvr-nvr-recorders',
    fields: [
      { id: 'f-ch', name: 'Channels', key: 'channels', type: 'enum', options: ['4 Channels', '8 Channels', '16 Channels', '32 Channels'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Channels', order: 1 },
      { id: 'f-tech', name: 'Technology', key: 'technology', type: 'enum', options: ['Turbo HD / HD-TVI', 'IP / NVR', 'Hybrid (AcuSense)'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Tech', order: 2 },
      { id: 'f-hdd', name: 'Max HDD Capacity', key: 'max_hdd_capacity', type: 'unit', unit: 'TB', filterable: false, comparable: true, showInHighlights: true, shortLabel: 'Max HDD', order: 3 },
      { id: 'f-comp', name: 'Compression', key: 'compression', type: 'text', filterable: false, comparable: true, showInHighlights: true, shortLabel: 'Codec', order: 4 }
    ]
  },
  {
    id: 'tpl-switch',
    name: 'Network Switch',
    categorySlug: 'network-switches',
    fields: [
      { id: 'f-ports', name: 'Port Count', key: 'port_count', type: 'enum', options: ['5 Ports', '8 Ports', '16 Ports', '24 Ports'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Ports', order: 1 },
      { id: 'f-poe', name: 'PoE Support', key: 'poe_support', type: 'boolean', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'PoE Support', order: 2 },
      { id: 'f-poebudget', name: 'PoE Power Budget', key: 'poe_budget', type: 'unit', unit: 'W', filterable: false, comparable: true, showInHighlights: true, shortLabel: 'PoE Budget', order: 3 },
      { id: 'f-mgmt', name: 'Management', key: 'management_type', type: 'enum', options: ['Unmanaged', 'Smart Cloud Managed', 'L2/L3 Managed'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Management', order: 4 }
    ]
  },
  {
    id: 'tpl-wifi',
    name: 'Access Point & Wi-Fi',
    categorySlug: 'access-points-wifi',
    fields: [
      { id: 'f-wifistd', name: 'Wi-Fi Standard', key: 'wifi_standard', type: 'enum', options: ['Wi-Fi 5 (802.11ac)', 'Wi-Fi 6 (802.11ax)'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Wi-Fi Std', order: 1 },
      { id: 'f-speed', name: 'Throughput', key: 'max_speed', type: 'unit', unit: 'Mbps', filterable: false, comparable: true, showInHighlights: true, shortLabel: 'Throughput', order: 2 },
      { id: 'f-mount', name: 'Mounting', key: 'mount_type', type: 'enum', options: ['Ceiling / Wall Mount', 'Outdoor Pole Mount', 'Desktop'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Mount', order: 3 }
    ]
  },
  {
    id: 'tpl-biometric',
    name: 'Biometric & Access Control',
    categorySlug: 'biometrics-access-control',
    fields: [
      { id: 'f-bio', name: 'Biometric Type', key: 'biometric_type', type: 'enum', options: ['Face Recognition + Fingerprint', 'Fingerprint + RFID Card', 'RFID Only'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Biometric', order: 1 },
      { id: 'f-usercap', name: 'User Capacity', key: 'user_capacity', type: 'number', filterable: false, comparable: true, showInHighlights: true, shortLabel: 'User Cap', order: 2 },
      { id: 'f-conn', name: 'Connectivity', key: 'connectivity', type: 'enum', options: ['TCP/IP + Wi-Fi', 'TCP/IP + USB', 'Standalone'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Connectivity', order: 3 }
    ]
  }
];

export const INITIAL_BRANDS: Brand[] = [
  {
    id: 'b-hikvision',
    name: 'Hikvision',
    slug: 'hikvision',
    logo: '/images/brands/hikvision.svg',
    description: 'World-leading provider of security products and solutions.',
    website: 'https://www.hikvision.com',
    featured: true,
    showBadge: true,
    badgeText: 'Authorized Support Partner',
    showInBrandStrip: true,
    order: 1
  },
  {
    id: 'b-dahua',
    name: 'Dahua Technology',
    slug: 'dahua',
    logo: '/images/brands/dahua.svg',
    description: 'Video-centric smart IoT solution and service provider.',
    website: 'https://www.dahuasecurity.com',
    featured: true,
    showBadge: true,
    badgeText: 'Authorized Support Partner',
    showInBrandStrip: true,
    order: 2
  },
  {
    id: 'b-zkteco',
    name: 'ZKTeco',
    slug: 'zkteco',
    logo: '/images/brands/zkteco.svg',
    description: 'Biometric verification and smart access control solutions.',
    website: 'https://www.zkteco.com',
    featured: true,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 3
  },
  {
    id: 'b-ruijie',
    name: 'Ruijie Reyee',
    slug: 'ruijie-reyee',
    logo: '/images/brands/ruijie.svg',
    description: 'Enterprise networking, cloud-managed switches and commercial Wi-Fi 6 solutions.',
    website: 'https://www.ruijienetworks.com',
    featured: true,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 4
  },
  {
    id: 'b-wd',
    name: 'Western Digital',
    slug: 'western-digital',
    logo: '/images/brands/western-digital.svg',
    description: 'Surveillance-grade continuous write hard disk drives.',
    website: 'https://www.westerndigital.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 5
  },
  {
    id: 'b-seagate',
    name: 'Seagate',
    slug: 'seagate',
    logo: '',
    description: 'SkyHawk surveillance storage solutions.',
    website: 'https://www.seagate.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 6
  },
  {
    id: 'b-tplink',
    name: 'TP-Link',
    slug: 'tp-link',
    logo: '',
    description: 'VIGI security and Omada enterprise networking solutions.',
    website: 'https://www.tp-link.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 7
  },
  {
    id: 'b-uniview',
    name: 'Uniview',
    slug: 'uniview',
    logo: '',
    description: 'Pioneer and leader of IP video surveillance technology.',
    website: 'https://www.uniview.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 8
  },
  {
    id: 'b-cisco',
    name: 'Cisco',
    slug: 'cisco',
    logo: '',
    description: 'Commercial networking and enterprise IT infrastructure.',
    website: 'https://www.cisco.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 9
  },
  {
    id: 'b-honeywell',
    name: 'Honeywell',
    slug: 'honeywell',
    logo: '',
    description: 'Commercial security, sensors and building automation.',
    website: 'https://www.honeywell.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: true,
    order: 10
  },
  {
    id: 'brand-ezviz',
    name: 'EZVIZ',
    slug: 'ezviz',
    logo: '',
    description: 'Smart home Wi-Fi security cameras, 360° pan-tilt outdoor cameras, and video doorbells.',
    website: 'https://www.ezviz.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: false,
    order: 11
  },
  {
    id: 'b-dlink',
    name: 'D-Link',
    slug: 'd-link',
    logo: '',
    description: 'Structured network cabling, Cat6 UTP copper cable boxes, patch cords, and networking hardware.',
    website: 'https://www.dlink.com',
    featured: false,
    showBadge: false,
    badgeText: '',
    showInBrandStrip: false,
    order: 12
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-cctv',
    name: 'CCTV Cameras',
    slug: 'cctv-cameras',
    description: 'High-definition bullet, dome and turret cameras for residential and commercial security.',
    image: '/images/products/hikvision-bullet.svg',
    specTemplateId: 'tpl-cctv',
    featured: true,
    showOnHomepage: true,
    displayOrder: 1,
    order: 1
  },
  {
    id: 'cat-dvr',
    name: 'DVR',
    slug: 'dvr',
    description: 'Turbo HD digital video recorders with H.265+ smart stream compression.',
    image: '/images/products/hikvision-dvr.svg',
    specTemplateId: 'tpl-dvr',
    featured: true,
    showOnHomepage: true,
    displayOrder: 2,
    order: 2
  },
  {
    id: 'cat-recorders',
    name: 'Recorders',
    slug: 'recorders',
    description: 'Digital Video Recorders and Network Video Recorders with cloud app support.',
    image: '/images/products/hikvision-dvr.svg',
    specTemplateId: 'tpl-dvr',
    featured: true,
    showOnHomepage: true,
    displayOrder: 3,
    order: 3
  },
  {
    id: 'cat-access',
    name: 'Access Control & Biometrics',
    slug: 'biometrics-access-control',
    description: 'ZKTeco facial recognition terminals, fingerprint time-attendance, and door locks.',
    image: '/images/products/zkteco-biometric.svg',
    specTemplateId: 'tpl-biometric',
    featured: true,
    showOnHomepage: true,
    displayOrder: 4,
    order: 4
  },
  {
    id: 'cat-networking',
    name: 'Network Switches',
    slug: 'network-switches',
    description: 'PoE surveillance switches and gigabit enterprise managed distribution switches.',
    image: '/images/products/ruijie-switch.svg',
    specTemplateId: 'tpl-switch',
    featured: true,
    showOnHomepage: true,
    displayOrder: 5,
    order: 5
  },
  {
    id: 'cat-wifi',
    name: 'Wi-Fi / Smart Devices',
    slug: 'wifi-smart-devices',
    description: 'Cameras, doorbells, lights and more you control from a phone app',
    image: '/images/hero/hikvision-bullet.png',
    promoTile: {
      enabled: true,
      headline: 'Smart Wi-Fi Series',
      subtext: 'Control cameras, lights & locks from your phone',
      buttonText: 'Explore Wi-Fi Series',
      link: '/category/wifi-smart-devices',
      bgStyle: 'orange',
      image: '/images/hero/hikvision-bullet.png'
    },
    specTemplateId: 'tpl-cctv',
    featured: true,
    showOnHomepage: false,
    displayOrder: 6,
    order: 6,
    showAsHomepageRow: true,
    subcategories: [
      { id: 'subcat-wifi-cameras', name: 'Wi-Fi Cameras', slug: 'wifi-cameras', order: 1, enabled: true },
      { id: 'subcat-video-doorbells', name: 'Video Doorbells', slug: 'video-doorbells', order: 2, enabled: true },
      { id: 'subcat-smart-lights', name: 'Smart Lights', slug: 'smart-lights', order: 3, enabled: true },
      { id: 'subcat-smart-plugs', name: 'Smart Plugs & Switches', slug: 'smart-plugs-switches', order: 4, enabled: true },
      { id: 'subcat-smart-locks', name: 'Smart Locks', slug: 'smart-locks', order: 5, enabled: true },
      { id: 'subcat-sensors-alarms', name: 'Sensors & Alarms', slug: 'sensors-alarms', order: 6, enabled: true }
    ]
  },
  {
    id: 'cat-access-points',
    name: 'Access Points & Wi-Fi',
    slug: 'access-points-wifi',
    description: 'Ceiling and outdoor enterprise Wi-Fi 6 access points with seamless roaming.',
    image: '/images/products/ruijie-wifi.svg',
    promoTile: {
      enabled: true,
      headline: 'Enterprise Cloud Wi-Fi',
      subtext: 'Seamless roaming & Gigabit speeds',
      buttonText: 'View Access Points',
      link: '/category/access-points-wifi',
      bgStyle: 'dark',
      image: '/images/products/ruijie-wifi.svg'
    },
    specTemplateId: 'tpl-wifi',
    featured: true,
    showOnHomepage: false,
    displayOrder: 11,
    order: 11,
    showAsHomepageRow: true
  },
  {
    id: 'cat-storage',
    name: 'Surveillance Storage',
    slug: 'surveillance-storage',
    description: 'Western Digital Purple and Seagate SkyHawk continuous recording surveillance hard drives.',
    image: '/images/products/surveillance-hdd.svg',
    specTemplateId: 'tpl-generic',
    featured: true,
    showOnHomepage: true,
    isAccessoryCategory: true,
    displayOrder: 7,
    order: 7
  },
  {
    id: 'cat-cables',
    name: 'Cables & Accessories',
    slug: 'cables-accessories',
    description: 'Cat6 pure copper cables, waterproof junction boxes, and video baluns.',
    image: '/images/products/hardware-accessory.svg',
    specTemplateId: 'tpl-generic',
    featured: true,
    showOnHomepage: true,
    isAccessoryCategory: true,
    displayOrder: 8,
    order: 8
  },
  {
    id: 'cat-intercom',
    name: 'IP Video Intercoms',
    slug: 'ip-video-intercoms',
    description: 'Touchscreen multi-apartment indoor stations and door entry intercoms.',
    image: '/images/products/hikvision-dome.svg',
    specTemplateId: 'tpl-generic',
    featured: true,
    showOnHomepage: true,
    displayOrder: 9,
    order: 9
  },
  {
    id: 'cat-power',
    name: 'Power & Backup Units',
    slug: 'power-backup-units',
    description: 'Centralized 12V DC CCTV power supplies, online UPS, and surge protectors.',
    image: '/images/products/hardware-accessory.svg',
    specTemplateId: 'tpl-generic',
    featured: true,
    showOnHomepage: true,
    isAccessoryCategory: true,
    displayOrder: 10,
    order: 10
  }
];

export const INITIAL_PRODUCTS: Array<Product | any> = [
  {
    "id": "prod-hik-irpf-2mp",
    "name": "Hikvision 2MP Audio Fixed Mini Bullet Camera",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-2CE16D0T-ITPFS",
    "sku": "HIK-2MP-IRPF",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/hikvision-bullet.png"
    ],
    "primaryImage": "/images/hero/hikvision-bullet.png",
    "shortDescription": "High performance 2MP bullet camera with built-in microphone and 20m Smart IR night vision.",
    "description": "Crisp 1080p surveillance video with audio over coaxial cable. IP67 weatherproof housing for indoor and outdoor commercial setups.",
    "keyFeatures": [
      "2.0 Megapixel high-performance CMOS",
      "Built-in audio over coaxial cable",
      "20m Smart IR night vision",
      "IP67 weatherproof housing"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "IR Night Vision (up to 20m)",
      "lens": "3.6mm (Standard)",
      "ip_rating": "IP67 Weatherproof",
      "form_factor": "Bullet",
      "audio_support": true
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "IR Night Vision (up to 20m)",
        "highlightValue": "20m IR",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP67 Weatherproof",
        "highlightValue": "IP67",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 2400,
      "salePrice": 2150,
      "currency": "BDT"
    },
    "inventory": {
      "available": 50,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-dome-2mp",
    "name": "Hikvision 2MP Indoor Audio Turret Dome Camera",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-2CE76D0T-ITPFS",
    "sku": "HIK-2MP-DOME",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dome.svg"
    ],
    "primaryImage": "/images/products/hikvision-dome.svg",
    "shortDescription": "Discreet 2MP ceiling dome camera with integrated microphone and wide-angle 2.8mm lens.",
    "description": "Ideal for indoor offices, retail stores, and banking counters requiring discreet audio and video capture.",
    "keyFeatures": [
      "2 Megapixel resolution (1920 x 1080)",
      "Wide angle 2.8mm focal lens",
      "Smart IR up to 20m",
      "Built-in microphone with coaxial transmission"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "IR Night Vision (up to 20m)",
      "lens": "2.8mm (Wide Angle)",
      "form_factor": "Dome",
      "audio_support": true
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "IR Night Vision (up to 20m)",
        "highlightValue": "20m IR",
        "showInHighlights": true
      },
      "form_factor": {
        "label": "Form Factor",
        "value": "Dome",
        "highlightValue": "Dome",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 2350,
      "currency": "BDT"
    },
    "inventory": {
      "available": 45,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-12T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-color-2mp",
    "name": "Hikvision 2MP ColorVu Full-Color Audio Bullet Camera",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-2CE10DF0T-FS",
    "sku": "HIK-2MP-COLORVU",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/hikvision-bullet.png"
    ],
    "primaryImage": "/images/hero/hikvision-bullet.png",
    "shortDescription": "Full-color surveillance camera with F1.0 super aperture and warm supplemental lighting.",
    "description": "Vivid color imagery in complete darkness. Features high fidelity audio over coax and rugged weatherproof build.",
    "keyFeatures": [
      "Full-Color imaging with F1.0 aperture",
      "2.8mm wide angle fixed lens",
      "Up to 20m warm light distance",
      "Water and dust resistant (IP67)"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "ColorVu Full Color",
      "lens": "2.8mm (Wide Angle)",
      "ip_rating": "IP67 Weatherproof",
      "form_factor": "Bullet",
      "audio_support": true
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "ColorVu Full Color",
        "highlightValue": "ColorVu",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP67 Weatherproof",
        "highlightValue": "IP67",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 3800,
      "salePrice": 3450,
      "currency": "BDT"
    },
    "inventory": {
      "available": 30,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-4k-bullet",
    "name": "Hikvision 8MP 4K Ultra HD Outdoor IR Bullet Camera",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-2CE16U1T-ITF",
    "sku": "HIK-8MP-4K",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/hikvision-bullet.png"
    ],
    "primaryImage": "/images/hero/hikvision-bullet.png",
    "shortDescription": "True 4K 8.29 megapixel resolution with EXIR 2.0 smart IR up to 30m distance.",
    "description": "Enterprise grade perimeter security camera capturing license plates and wide outdoor lots in ultra-crisp detail.",
    "keyFeatures": [
      "8.29 MP high performance CMOS",
      "3840 x 2160 ultra high resolution",
      "EXIR 2.0 Smart IR up to 30m",
      "4 in 1 video output switchable"
    ],
    "specifications": {
      "resolution": "8MP (4K)",
      "night_vision": "IR Night Vision (up to 40m)",
      "lens": "3.6mm (Standard)",
      "ip_rating": "IP67 Weatherproof",
      "form_factor": "Bullet",
      "audio_support": false
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "8MP (4K)",
        "highlightValue": "4K",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "IR Night Vision (up to 40m)",
        "highlightValue": "40m IR",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP67 Weatherproof",
        "highlightValue": "IP67",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 8500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 20,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isNew": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-dahua-2mp-bullet",
    "name": "Dahua 2MP HDCVI Weatherproof IR Bullet Camera",
    "brand": "Dahua",
    "brandId": "b-dahua",
    "modelNumber": "DH-HAC-HFW1200THP-I8",
    "sku": "DH-2MP-BULLET",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/hikvision-bullet.png"
    ],
    "primaryImage": "/images/hero/hikvision-bullet.png",
    "shortDescription": "Long-range outdoor security camera with powerful 80m IR illumination and IP67 rating.",
    "description": "Designed for factory perimeters, highways, and large warehouse yards needing dependable night monitoring.",
    "keyFeatures": [
      "2MP resolution with starlight technology",
      "Max 30fps at 1080P",
      "80m long-distance Smart IR",
      "IP67 ingress protection rating"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "IR Night Vision (up to 40m)",
      "lens": "3.6mm (Standard)",
      "ip_rating": "IP67 Weatherproof",
      "form_factor": "Bullet",
      "audio_support": false
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "IR Night Vision (up to 40m)",
        "highlightValue": "80m IR",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP67 Weatherproof",
        "highlightValue": "IP67",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 3200,
      "currency": "BDT"
    },
    "inventory": {
      "available": 25,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-dahua-eyeball-2mp",
    "name": "Dahua 2MP Full-color Starlight HDCVI Eyeball Camera",
    "brand": "Dahua",
    "brandId": "b-dahua",
    "modelNumber": "DH-HAC-HDW1239TLQP-LED",
    "sku": "DH-2MP-EYEBALL",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dome.svg"
    ],
    "primaryImage": "/images/products/hikvision-dome.svg",
    "shortDescription": "Compact full-color turret eyeball camera with warm white LED up to 20m distance.",
    "description": "Provides vivid full-color images with high aperture lens and starlight sensor.",
    "keyFeatures": [
      "2MP full-color starlight HDCVI",
      "20m LED distance",
      "Built-in mic",
      "IP67 weather resistant"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "ColorVu Full Color",
      "lens": "2.8mm (Wide Angle)",
      "ip_rating": "IP67 Weatherproof",
      "form_factor": "Turret",
      "audio_support": true
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "ColorVu Full Color",
        "highlightValue": "Full-Color",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP67 Weatherproof",
        "highlightValue": "IP67",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 2950,
      "currency": "BDT"
    },
    "inventory": {
      "available": 35,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-08T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-dvr-4ch",
    "name": "Hikvision 4-Channel 1080p AcuSense HD DVR",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "iDS-7204HQHI-M1/S",
    "sku": "HIK-DVR-4CH",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "4-channel smart AI DVR with deep learning human and vehicle motion detection.",
    "description": "Reduces false alarms with AcuSense motion classification. Supports up to 6 IP cameras in hybrid mode and 10TB SATA storage.",
    "keyFeatures": [
      "4 channels and 1 HDD 1U AcuSense DVR",
      "False alarm reduction through human and vehicle target classification",
      "Efficient H.265 pro+ compression technology",
      "Encoding capability up to 3K/5MP Lite at 12 fps"
    ],
    "specifications": {
      "channels": "4 CH",
      "compression": "H.265 Pro+",
      "max_resolution": "5MP Lite",
      "hdd_slots": "1 SATA Slot"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "4 CH",
        "highlightValue": "4 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "H.265 Pro+",
        "highlightValue": "H.265+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 4500,
      "salePrice": 3950,
      "currency": "BDT"
    },
    "inventory": {
      "available": 20,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-dvr-8ch",
    "name": "Hikvision 8-Channel 1080p AcuSense HD DVR",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "iDS-7208HQHI-M1/S",
    "sku": "HIK-DVR-8CH",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "8-channel enterprise AcuSense digital video recorder supporting human/vehicle classification.",
    "description": "High throughput AI DVR supporting 8 analog BNC cameras plus up to 4 network IP cameras. H.265 Pro+ encoding saves bandwidth.",
    "keyFeatures": [
      "8 channels analog + 4 IP channels",
      "AcuSense AI motion filtering",
      "H.265 Pro+ ultra bandwidth efficiency",
      "Audio over coaxial support across all channels"
    ],
    "specifications": {
      "channels": "8 CH",
      "compression": "H.265 Pro+",
      "max_resolution": "5MP Lite",
      "hdd_slots": "1 SATA Slot"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "8 CH",
        "highlightValue": "8 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "H.265 Pro+",
        "highlightValue": "H.265+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 6800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 15,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-12T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-dvr-16ch",
    "name": "Hikvision 16-Channel 1080p AcuSense HD DVR",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "iDS-7216HQHI-M2/S",
    "sku": "HIK-DVR-16CH",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "16-channel rackmount AcuSense DVR with dual SATA bays supporting up to 20TB total storage.",
    "description": "Designed for corporate offices, multi-storey commercial buildings, and factories needing high camera counts and AI tracking.",
    "keyFeatures": [
      "16 analog channels + 8 IP channels",
      "Dual SATA interfaces up to 10TB per disk",
      "Advanced perimeter protection",
      "HDMI 4K output port"
    ],
    "specifications": {
      "channels": "16 CH",
      "compression": "H.265 Pro+",
      "max_resolution": "5MP Lite",
      "hdd_slots": "2 SATA Slots"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "16 CH",
        "highlightValue": "16 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "H.265 Pro+",
        "highlightValue": "H.265+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 12500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 10,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-dahua-xvr-8ch",
    "name": "Dahua 8-Channel WizSense 5-in-1 Compact 1U XVR",
    "brand": "Dahua",
    "brandId": "b-dahua",
    "modelNumber": "DH-XVR5108HS-I3",
    "sku": "DH-XVR-8CH",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "8-channel AI digital video recorder with smart dual-stream and face recognition search.",
    "description": "Full-channel AI Coding reduces bandwidth by 50%. Compatible with HDCVI, AHD, TVI, CVBS, and IP cameras.",
    "keyFeatures": [
      "8 channels SMD Plus human/vehicle detection",
      "H.265+/H.265 dual-stream video compression",
      "Supports HDCVI/AHD/TVI/CVBS/IP video inputs",
      "Up to 16TB SATA hard disk capacity"
    ],
    "specifications": {
      "channels": "8 CH",
      "compression": "AI Coding (H.265+)",
      "max_resolution": "5MP",
      "hdd_slots": "1 SATA Slot"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "8 CH",
        "highlightValue": "8 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "AI Coding (H.265+)",
        "highlightValue": "AI Coding",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 7200,
      "currency": "BDT"
    },
    "inventory": {
      "available": 12,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-nvr-8ch-poe",
    "name": "Hikvision 8-Channel 4K Embedded PoE Network Video Recorder",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-7608NI-Q1/8P",
    "sku": "HIK-NVR-8CH-POE",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "Plug-and-play 4K NVR with 8 independent PoE network interfaces up to 80W power.",
    "description": "Connects IP cameras directly over ethernet cable. Decodes up to 8MP resolution with 4K HDMI video output.",
    "keyFeatures": [
      "8 independent PoE network ports",
      "Up to 80 Mbps incoming bandwidth",
      "Up to 8MP resolution recording and display",
      "H.265+/H.265 video format decoding"
    ],
    "specifications": {
      "channels": "8 CH",
      "compression": "H.265+",
      "max_resolution": "8MP (4K)",
      "hdd_slots": "1 SATA Slot"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "8 CH",
        "highlightValue": "8 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "H.265+",
        "highlightValue": "4K PoE",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 14800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 10,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isNew": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-mb20",
    "name": "ZKTeco MB20 Multi-Biometric Time Attendance & Access Terminal",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "MB20",
    "sku": "ZK-MB20",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/zkteco-biometric.png"
    ],
    "primaryImage": "/images/hero/zkteco-biometric.png",
    "shortDescription": "Hybrid facial recognition and fingerprint attendance terminal with 2.8-inch TFT screen.",
    "description": "High-speed biometric verification under 0.5 seconds. Built-in relay for electric magnetic door lock integration.",
    "keyFeatures": [
      "Multi-biometric verification: Face, Fingerprint, Password, RFID",
      "High speed verification under 0.5 seconds",
      "TCP/IP and USB-Host data communication",
      "Access control interface for 3rd party electric lock"
    ],
    "specifications": {
      "user_capacity": "1000 Users",
      "fingerprint_capacity": "500 Prints",
      "face_capacity": "200 Faces",
      "verification_methods": "Face / Fingerprint / Card",
      "connectivity": "TCP/IP & USB"
    },
    "specs": {
      "user_capacity": {
        "label": "Capacity",
        "value": "1000 Users",
        "highlightValue": "1000 Users",
        "showInHighlights": true
      },
      "verification_methods": {
        "label": "Verification",
        "value": "Face / Fingerprint / Card",
        "highlightValue": "Face & Finger",
        "showInHighlights": true
      },
      "connectivity": {
        "label": "Network",
        "value": "TCP/IP & USB",
        "highlightValue": "TCP/IP",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 8500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 18,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-k40",
    "name": "ZKTeco K40 Fingerprint Time Attendance & Access Terminal",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "K40",
    "sku": "ZK-K40",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/zkteco-biometric.png"
    ],
    "primaryImage": "/images/hero/zkteco-biometric.png",
    "shortDescription": "Reliable standalone fingerprint terminal with built-in battery backup and door lock relay.",
    "description": "Standard workhorse attendance terminal widely deployed across retail shops, small offices, and schools.",
    "keyFeatures": [
      "1,000 fingerprint templates capacity",
      "80,000 transaction record capacity",
      "Built-in battery backup for power cuts",
      "Door lock relay and exit button interface"
    ],
    "specifications": {
      "user_capacity": "1000 Users",
      "fingerprint_capacity": "1000 Prints",
      "battery_backup": true,
      "verification_methods": "Fingerprint & RFID Card",
      "connectivity": "TCP/IP & USB"
    },
    "specs": {
      "user_capacity": {
        "label": "Capacity",
        "value": "1000 Users",
        "highlightValue": "1000 Users",
        "showInHighlights": true
      },
      "verification_methods": {
        "label": "Verification",
        "value": "Fingerprint & RFID Card",
        "highlightValue": "Finger & RFID",
        "showInHighlights": true
      },
      "battery_backup": {
        "label": "Backup Battery",
        "value": true,
        "highlightValue": "Battery Backup",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 6500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 25,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-12T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-speedface-v5l",
    "name": "ZKTeco SpeedFace-V5L Visible Light Facial Recognition Terminal",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "SpeedFace-V5L",
    "sku": "ZK-SPEEDFACE-V5L",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/zkteco-biometric.png"
    ],
    "primaryImage": "/images/hero/zkteco-biometric.png",
    "shortDescription": "AI-driven visible light facial recognition with anti-spoofing algorithm and mask detection.",
    "description": "Enterprise touchless access control terminal recognizing moving subjects from 0.3m to 3m away in 0.3s.",
    "keyFeatures": [
      "6,000 facial templates capacity",
      "0.3 second recognition speed",
      "Deep learning anti-spoofing algorithm",
      "5-inch touch LCD display"
    ],
    "specifications": {
      "user_capacity": "10000 Users",
      "face_capacity": "6000 Faces",
      "verification_methods": "Visible Light Face / Palm / Card",
      "connectivity": "TCP/IP & Wiegand"
    },
    "specs": {
      "user_capacity": {
        "label": "Capacity",
        "value": "10000 Users",
        "highlightValue": "10K Users",
        "showInHighlights": true
      },
      "face_capacity": {
        "label": "Face Templates",
        "value": "6000 Faces",
        "highlightValue": "6000 Faces",
        "showInHighlights": true
      },
      "verification_methods": {
        "label": "Verification",
        "value": "Visible Light Face / Palm / Card",
        "highlightValue": "Touchless Face",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 26500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 8,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-em-lock",
    "name": "ZKTeco 280KG (600 lbs) Magnetic Lock with LED Feedback",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "AL-280LED",
    "sku": "ZK-LOCK-280",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Fail-safe electromagnetic lock with 280kg holding force for wooden, glass, and metal doors.",
    "description": "Equipped with dry contact status signal output and dual-color LED lock indicator. Zero residual magnetism.",
    "keyFeatures": [
      "280kg (600 lbs) static holding force",
      "Dual voltage 12V/24V DC selectable",
      "Built-in reverse current protection MOV",
      "LED lock status indicator"
    ],
    "specifications": {
      "holding_force": "280 kg (600 lbs)",
      "voltage": "12V / 24V DC",
      "led_feedback": true
    },
    "specs": {
      "holding_force": {
        "label": "Holding Force",
        "value": "280 kg (600 lbs)",
        "highlightValue": "280 kg",
        "showInHighlights": true
      },
      "led_feedback": {
        "label": "LED Feedback",
        "value": true,
        "highlightValue": "LED Feedback",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 3200,
      "currency": "BDT"
    },
    "inventory": {
      "available": 40,
      "status": "in_stock"
    },
    "unit": "Set",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-inbio260",
    "name": "ZKTeco InBio260 2-Door IP Biometric Access Control Panel",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "inBio260",
    "sku": "ZK-INBIO-260",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Multi-door access controller carrying out fingerprint matching on internal hardware.",
    "description": "Supports 2 doors with 4 readers (2 inside and 2 outside). Full anti-passback and interlock features.",
    "keyFeatures": [
      "2 doors access management",
      "3,000 fingerprint templates stored in controller",
      "30,000 card capacity",
      "TCP/IP communication with SSL encryption"
    ],
    "specifications": {
      "doors_supported": "2 Doors",
      "user_capacity": "30000 Users",
      "fingerprint_capacity": "3000 Prints",
      "communication": "TCP/IP & RS485"
    },
    "specs": {
      "doors_supported": {
        "label": "Doors",
        "value": "2 Doors",
        "highlightValue": "2 Doors",
        "showInHighlights": true
      },
      "communication": {
        "label": "Interface",
        "value": "TCP/IP & RS485",
        "highlightValue": "TCP/IP",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 18500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 6,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isNew": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-es205gc-p",
    "name": "Ruijie Reyee RG-ES205GC-P 5-Port Gigabit Smart Cloud PoE Switch",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-ES205GC-P",
    "sku": "RG-ES205GC-P",
    "category": "Network Switches",
    "categoryId": "cat-networking",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/ruijie-switch.svg"
    ],
    "primaryImage": "/images/products/ruijie-switch.svg",
    "shortDescription": "Cloud-managed 5-port gigabit switch with 4 PoE+ ports and 54W power budget.",
    "description": "Compact steel desktop casing Designed for small CCTV setups and office IP phones. Ruijie Cloud platform management included.",
    "keyFeatures": [
      "5 x 10/100/1000 Mbps RJ45 ports",
      "4 ports 802.3af/at PoE+ with 54W total budget",
      "Ruijie Cloud app remote management and reboot",
      "IP camera recognition and CCTV loop prevention"
    ],
    "specifications": {
      "ports": "5 Ports",
      "poe_budget": "54 W",
      "poe_support": true,
      "switching_capacity": "10 Gbps",
      "managed": true
    },
    "specs": {
      "ports": {
        "label": "Ports",
        "value": "5 Ports",
        "highlightValue": "5 Ports",
        "showInHighlights": true
      },
      "poe_budget": {
        "label": "PoE Budget",
        "value": 54,
        "highlightValue": "54 W",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 4800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 30,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-es209gc-p",
    "name": "Ruijie Reyee RG-ES209GC-P 9-Port Gigabit Smart Cloud PoE Switch",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-ES209GC-P",
    "sku": "RG-ES209GC-P",
    "category": "Network Switches",
    "categoryId": "cat-networking",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/ruijie-switch.svg"
    ],
    "primaryImage": "/images/products/ruijie-switch.svg",
    "shortDescription": "9-port gigabit switch with 8 PoE+ ports delivering up to 120W power budget.",
    "description": "High power budget accommodates PTZ cameras and Wi-Fi 6 access points with seamless cloud rebooting.",
    "keyFeatures": [
      "9 x Gigabit RJ45 ports",
      "8 ports 802.3af/at PoE+ with 120W power budget",
      "Automatic IPC restart on camera freeze",
      "Remote cable diagnostic testing from cloud app"
    ],
    "specifications": {
      "ports": "9 Ports",
      "poe_budget": "120 W",
      "poe_support": true,
      "switching_capacity": "18 Gbps",
      "managed": true
    },
    "specs": {
      "ports": {
        "label": "Ports",
        "value": "9 Ports",
        "highlightValue": "9 Ports",
        "showInHighlights": true
      },
      "poe_budget": {
        "label": "PoE Budget",
        "value": 120,
        "highlightValue": "120 W",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 7500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 20,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-12T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-es216gc",
    "name": "Ruijie Reyee RG-ES216GC 16-Port Gigabit Unmanaged Switch",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-ES216GC",
    "sku": "RG-ES216GC",
    "category": "Network Switches",
    "categoryId": "cat-networking",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/ruijie-switch.svg"
    ],
    "primaryImage": "/images/products/ruijie-switch.svg",
    "shortDescription": "16-port gigabit rackmount switch for non-PoE network aggregation and high-speed data transfer.",
    "description": "Sturdy 19-inch metal chassis with 32 Gbps non-blocking backplane switching capacity.",
    "keyFeatures": [
      "16 x 10/100/1000 Mbps Gigabit ports",
      "19-inch rack-mountable with included brackets",
      "Energy-efficient silent fanless operation",
      "Built-in 6kV surge protection on all ports"
    ],
    "specifications": {
      "ports": "16 Ports",
      "poe_support": false,
      "switching_capacity": "32 Gbps",
      "managed": false
    },
    "specs": {
      "ports": {
        "label": "Ports",
        "value": "16 Ports",
        "highlightValue": "16 Ports",
        "showInHighlights": true
      },
      "switching_capacity": {
        "label": "Backplane",
        "value": "32 Gbps",
        "highlightValue": "32 Gbps",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 8900,
      "currency": "BDT"
    },
    "inventory": {
      "available": 15,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-enterprise-switch-req",
    "name": "Ruijie RG-NBS3100-24GT4SFP-P 24-Port Managed Gigabit PoE Switch",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-NBS3100-24GT4SFP-P",
    "sku": "RG-NBS3100-24P",
    "category": "Network Switches",
    "categoryId": "cat-networking",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/ruijie-switch.svg"
    ],
    "primaryImage": "/images/products/ruijie-switch.svg",
    "shortDescription": "24-port Gigabit Layer 2 managed switch with 4 SFP fiber uplink ports and 370W PoE budget.",
    "description": "Designed for enterprise campus networks and corporate headquarters requiring VLAN segmentation and optical backhaul.",
    "keyFeatures": [
      "24 x 10/100/1000 Mbps PoE+ ports",
      "4 x 1G SFP fiber optical uplink slots",
      "370W heavy-duty PoE power delivery",
      "Layer 2 managed features: VLAN, QoS, IGMP Snooping, STP"
    ],
    "specifications": {
      "ports": "24 Ports",
      "poe_budget": "370 W",
      "poe_support": true,
      "switching_capacity": "56 Gbps",
      "managed": true
    },
    "specs": {
      "ports": {
        "label": "Ports",
        "value": "24 Ports",
        "highlightValue": "24 Ports",
        "showInHighlights": true
      },
      "poe_budget": {
        "label": "PoE Budget",
        "value": 370,
        "highlightValue": "370 W",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 32000,
      "currency": "BDT"
    },
    "inventory": {
      "available": 6,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-es224gc-p",
    "name": "Ruijie Reyee RG-ES224GC-P 24-Port Gigabit Smart Cloud PoE Switch",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-ES224GC-P",
    "sku": "RG-ES224GC-P",
    "category": "Network Switches",
    "categoryId": "cat-networking",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/ruijie-switch.svg"
    ],
    "primaryImage": "/images/products/ruijie-switch.svg",
    "shortDescription": "24-port gigabit cloud switch with 24 PoE+ ports and 250W power budget.",
    "description": "Designed for dense IP camera clusters and office Wi-Fi setups with cloud dashboard visualization.",
    "keyFeatures": [
      "24 x 10/100/1000 Mbps RJ45 PoE ports",
      "250W total power supply budget",
      "Full Ruijie Cloud topology visualization",
      "Port isolation and loop prevention"
    ],
    "specifications": {
      "ports": "24 Ports",
      "poe_budget": "250 W",
      "poe_support": true,
      "switching_capacity": "48 Gbps",
      "managed": true
    },
    "specs": {
      "ports": {
        "label": "Ports",
        "value": "24 Ports",
        "highlightValue": "24 Ports",
        "showInHighlights": true
      },
      "poe_budget": {
        "label": "PoE Budget",
        "value": 250,
        "highlightValue": "250 W",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 24500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 8,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isNew": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-rap2200e",
    "name": "Ruijie Reyee RG-RAP2200(E) AC1300 Dual-Band Ceiling Access Point",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-RAP2200(E)",
    "sku": "RG-RAP2200-E",
    "category": "Access Points & Wi-Fi",
    "categoryId": "cat-access-points",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/ruijie-wifi6.png"
    ],
    "primaryImage": "/images/hero/ruijie-wifi6.png",
    "shortDescription": "Enterprise high-concurrency ceiling access point delivering 1267 Mbps combined throughput.",
    "description": "Supports up to 110 concurrent clients with seamless 802.11k/v/r roaming. Powered via standard 802.3af PoE.",
    "keyFeatures": [
      "Dual band 2.4GHz (400Mbps) + 5GHz (867Mbps)",
      "Dual Gigabit LAN Ethernet ports",
      "Supports Reyee Mesh wireless backhaul",
      "Free cloud management and guest portal"
    ],
    "specifications": {
      "wifi_standard": "AC1300",
      "max_speed": "1267 Mbps",
      "poe_support": true,
      "form_factor": "Ceiling"
    },
    "specs": {
      "wifi_standard": {
        "label": "Standard",
        "value": "AC1300",
        "highlightValue": "AC1300",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 6200,
      "currency": "BDT"
    },
    "inventory": {
      "available": 25,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-rap2260g",
    "name": "Ruijie Reyee RG-RAP2260(G) Wi-Fi 6 AX1800 Multi-Gigabit AP",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-RAP2260(G)",
    "sku": "RG-RAP2260-G",
    "category": "Access Points & Wi-Fi",
    "categoryId": "cat-access-points",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/ruijie-wifi6.png"
    ],
    "primaryImage": "/images/hero/ruijie-wifi6.png",
    "shortDescription": "Next-gen Wi-Fi 6 dual-band ceiling AP with OFDMA, MU-MIMO and 1775 Mbps throughput.",
    "description": "High performance enterprise AP designed for crowded meeting rooms, classrooms, and hotel lobbies.",
    "keyFeatures": [
      "Wi-Fi 6 (802.11ax) up to 1.775 Gbps",
      "Up to 512 client capacity (110 recommended)",
      "Gigabit PoE port + secondary Gigabit LAN port",
      "Layer 3 roaming and WPA3 security"
    ],
    "specifications": {
      "wifi_standard": "Wi-Fi 6 AX1800",
      "max_speed": "1775 Mbps",
      "poe_support": true,
      "form_factor": "Ceiling"
    },
    "specs": {
      "wifi_standard": {
        "label": "Standard",
        "value": "Wi-Fi 6 AX1800",
        "highlightValue": "Wi-Fi 6",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 11500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 16,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-rap1200f",
    "name": "Ruijie Reyee RG-RAP1200(F) Dual-Band AC1200 In-Wall Plate AP",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-RAP1200(F)",
    "sku": "RG-RAP1200-F",
    "category": "Access Points & Wi-Fi",
    "categoryId": "cat-access-points",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/ruijie-wifi6.png"
    ],
    "primaryImage": "/images/hero/ruijie-wifi6.png",
    "shortDescription": "Standard 86mm wall-switch box mount AP with front Ethernet port for hotel rooms and dorms.",
    "description": "Flushes cleanly into wall electrical backboxes. Provides in-room Wi-Fi plus wired IPTV or IP phone connectivity.",
    "keyFeatures": [
      "Standard 86-type electrical outlet installation",
      "1167 Mbps dual band concurrent speed",
      "Front-facing 10/100 Mbps RJ45 jack",
      "Centralized management via Ruijie Cloud app"
    ],
    "specifications": {
      "wifi_standard": "AC1200",
      "max_speed": "1167 Mbps",
      "poe_support": true,
      "form_factor": "Wall Plate"
    },
    "specs": {
      "wifi_standard": {
        "label": "Standard",
        "value": "AC1200",
        "highlightValue": "AC1200",
        "showInHighlights": true
      },
      "poe_support": {
        "label": "PoE Support",
        "value": true,
        "highlightValue": "PoE",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 4900,
      "currency": "BDT"
    },
    "inventory": {
      "available": 20,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-rap6260h",
    "name": "Ruijie Reyee RG-RAP6260(H) High-Power Outdoor Wi-Fi 6 AP",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-RAP6260(H)",
    "sku": "RG-RAP6260-H",
    "category": "Access Points & Wi-Fi",
    "categoryId": "cat-access-points",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/ruijie-wifi6.png"
    ],
    "primaryImage": "/images/hero/ruijie-wifi6.png",
    "shortDescription": "IP68 weatherproof outdoor Wi-Fi 6 access point with omnidirectional smart antennas.",
    "description": "Provides long-range outdoor wireless coverage up to 300 meters for swimming pools, campuses, and parks.",
    "keyFeatures": [
      "IP68 rating against torrential rain and dust",
      "Wi-Fi 6 speed up to 5952 Mbps",
      "Omnidirectional smart antenna array",
      "6kV lightning surge protection"
    ],
    "specifications": {
      "wifi_standard": "Wi-Fi 6 AX5950",
      "max_speed": "5952 Mbps",
      "poe_support": true,
      "ip_rating": "IP68"
    },
    "specs": {
      "wifi_standard": {
        "label": "Standard",
        "value": "Wi-Fi 6 AX5950",
        "highlightValue": "Wi-Fi 6",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP68",
        "highlightValue": "IP68",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 24000,
      "currency": "BDT"
    },
    "inventory": {
      "available": 6,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-wd-purple-500gb",
    "name": "Western Digital Purple 500GB 3.5\" Surveillance Internal HDD",
    "brand": "Western Digital",
    "brandId": "b-wd",
    "modelNumber": "WD5000PURZ",
    "sku": "WD-PURPLE-500GB",
    "category": "Surveillance Storage",
    "categoryId": "cat-storage",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/surveillance-hdd.svg"
    ],
    "primaryImage": "/images/products/surveillance-hdd.svg",
    "shortDescription": "Built specifically for continuous high-definition surveillance recording.",
    "description": "AllFrame technology reduces frame loss and improves video playback quality in security systems.",
    "keyFeatures": [
      "Built specifically for surveillance security systems",
      "Supports up to 64 HD surveillance cameras",
      "Reduced video frame loss with AllFrame technology",
      "1 million hours MTBF reliability rating"
    ],
    "specifications": {
      "capacity": "500 GB",
      "form_factor": "3.5-inch",
      "interface": "SATA 6 Gb/s"
    },
    "specs": {
      "capacity": {
        "label": "Capacity",
        "value": "500 GB",
        "highlightValue": "500 GB",
        "showInHighlights": true
      },
      "form_factor": {
        "label": "Form Factor",
        "value": "3.5-inch",
        "highlightValue": "3.5\"",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 1800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 35,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-wd-purple-1tb",
    "name": "Western Digital Purple 1TB 3.5\" Surveillance Internal HDD",
    "brand": "Western Digital",
    "brandId": "b-wd",
    "modelNumber": "WD10PURZ",
    "sku": "WD-PURPLE-1TB",
    "category": "Surveillance Storage",
    "categoryId": "cat-storage",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/surveillance-hdd.svg"
    ],
    "primaryImage": "/images/products/surveillance-hdd.svg",
    "shortDescription": "1TB surveillance hard disk with AllFrame caching and 64MB cache buffer.",
    "description": "Handles write-heavy surveillance workloads up to 180 TB/year in home and retail security installations.",
    "keyFeatures": [
      "1TB capacity optimized for surveillance",
      "Workload rating up to 180 TB/year",
      "AllFrame 4K firmware technology",
      "3-year manufacturer hardware warranty"
    ],
    "specifications": {
      "capacity": "1 TB",
      "form_factor": "3.5-inch",
      "interface": "SATA 6 Gb/s"
    },
    "specs": {
      "capacity": {
        "label": "Capacity",
        "value": "1 TB",
        "highlightValue": "1 TB",
        "showInHighlights": true
      },
      "form_factor": {
        "label": "Form Factor",
        "value": "3.5-inch",
        "highlightValue": "3.5\"",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 4800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 40,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-wd-purple-2tb",
    "name": "Western Digital Purple 2TB 3.5\" Surveillance Internal HDD",
    "brand": "Western Digital",
    "brandId": "b-wd",
    "modelNumber": "WD20PURZ",
    "sku": "WD-PURPLE-2TB",
    "category": "Surveillance Storage",
    "categoryId": "cat-storage",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/surveillance-hdd.svg"
    ],
    "primaryImage": "/images/products/surveillance-hdd.svg",
    "shortDescription": "2TB enterprise surveillance drive with 64MB cache and tarnish-resistant components.",
    "description": "Designed for systems with up to 64 HD cameras. Provides 2-3 weeks continuous archival for typical 4-8 camera setups.",
    "keyFeatures": [
      "2TB continuous recording space",
      "Tarnish-resistant components for harsh DVR enclosures",
      "Supports up to 64 streams per drive",
      "Low power consumption design"
    ],
    "specifications": {
      "capacity": "2 TB",
      "form_factor": "3.5-inch",
      "interface": "SATA 6 Gb/s"
    },
    "specs": {
      "capacity": {
        "label": "Capacity",
        "value": "2 TB",
        "highlightValue": "2 TB",
        "showInHighlights": true
      },
      "form_factor": {
        "label": "Form Factor",
        "value": "3.5-inch",
        "highlightValue": "3.5\"",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 6900,
      "currency": "BDT"
    },
    "inventory": {
      "available": 22,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-st-skyhawk-4tb",
    "name": "Seagate SkyHawk 4TB Surveillance Internal Hard Drive 3.5\"",
    "brand": "Seagate",
    "brandId": "b-seagate",
    "modelNumber": "ST4000VX016",
    "sku": "ST-SKYHAWK-4TB",
    "category": "Surveillance Storage",
    "categoryId": "cat-storage",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/surveillance-hdd.svg"
    ],
    "primaryImage": "/images/products/surveillance-hdd.svg",
    "shortDescription": "4TB surveillance hard drive with ImagePerfect firmware for crystal-clear video streaming.",
    "description": "Custom-built for NVR systems with built-in rotational vibration sensors for reliable multi-bay enclosures.",
    "keyFeatures": [
      "ImagePerfect firmware supports 64 cameras",
      "Rotational vibration sensors for multi-bay NVRs",
      "180TB/year workload rating",
      "1M hours MTBF rating"
    ],
    "specifications": {
      "capacity": "4 TB",
      "form_factor": "3.5-inch",
      "interface": "SATA 6 Gb/s"
    },
    "specs": {
      "capacity": {
        "label": "Capacity",
        "value": "4 TB",
        "highlightValue": "4 TB",
        "showInHighlights": true
      },
      "form_factor": {
        "label": "Form Factor",
        "value": "3.5-inch",
        "highlightValue": "3.5\"",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 11200,
      "currency": "BDT"
    },
    "inventory": {
      "available": 15,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "cable-cat6",
    "name": "D-Link CAT6 UTP 23AWG Pure Solid Copper Cable (305m Box)",
    "brand": "D-Link",
    "brandId": "b-dlink",
    "modelNumber": "NCB-C6UBLUR-305",
    "sku": "DL-CAT6-305M",
    "category": "Cables & Accessories",
    "categoryId": "cat-cables",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Premium 23 AWG 100% solid electrolytic copper conductor cable for Gigabit Ethernet & PoE.",
    "description": "Delivers full Gigabit data rates and heavy PoE power without voltage drops up to 100 meters standard.",
    "keyFeatures": [
      "100% Bare Electrolytic Solid Copper Conductor",
      "Tested up to 250 MHz frequency bandwidth",
      "Flame-retardant PVC jacket",
      "Compliant with 802.3af/at PoE+ transmission"
    ],
    "specifications": {
      "cable_type": "CAT6 UTP",
      "length": "305m Box",
      "conductor": "100% Solid Copper 23 AWG"
    },
    "specs": {
      "cable_type": {
        "label": "Standard",
        "value": "CAT6 UTP",
        "highlightValue": "CAT6 UTP",
        "showInHighlights": true
      },
      "length": {
        "label": "Length",
        "value": "305m Box",
        "highlightValue": "305m",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 9800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 15,
      "status": "in_stock"
    },
    "unit": "Box",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "acc-power",
    "name": "CamneX Central 12V 10A 9-Channel Metal Cased Power Supply Box",
    "brand": "CamneX Pro",
    "brandId": "b-hikvision",
    "modelNumber": "PS-12V10A-9CH",
    "sku": "ACC-PWR-9CH",
    "category": "Cables & Accessories",
    "categoryId": "cat-cables",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Regulated 12V DC centralized power distribution unit with 9 individual PTC auto-reset fuses.",
    "description": "Key-lockable steel enclosure with LED channel indicators. Prevents whole-system shutdowns during single-camera shorts.",
    "keyFeatures": [
      "9 individually fused DC output channels",
      "PTC auto-resettable fuses (no glass replacement required)",
      "Heavy gauge ventilated metal box with key lock",
      "Built-in EMI filter and surge protection"
    ],
    "specifications": {
      "output_voltage": "12V DC",
      "total_current": "10 Amperes",
      "channels": "9 Channels"
    },
    "specs": {
      "output_voltage": {
        "label": "Output",
        "value": "12V DC",
        "highlightValue": "12V 10A",
        "showInHighlights": true
      },
      "channels": {
        "label": "Outputs",
        "value": "9 Channels",
        "highlightValue": "9 CH",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 1800,
      "currency": "BDT"
    },
    "inventory": {
      "available": 40,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "acc-balun",
    "name": "Passive HD Video Balun & DC Power Pigtails (Per Camera Kit)",
    "brand": "CamneX Pro",
    "brandId": "b-hikvision",
    "modelNumber": "BALUN-HD-KIT",
    "sku": "ACC-BALUN-KIT",
    "category": "Cables & Accessories",
    "categoryId": "cat-cables",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "High-definition passive video transceiver pair supporting TVI, AHD, and CVI signals over UTP cable.",
    "description": "Gold-plated BNC connectors and tool-free push-pin terminal blocks for clear video transmission up to 250m.",
    "keyFeatures": [
      "Compatible with HD-TVI, HD-CVI, AHD, and CVBS",
      "Built-in transient suppression protection",
      "Tool-free spring terminal connections",
      "Up to 250m transmission distance"
    ],
    "specifications": {
      "connector_type": "BNC to Terminal",
      "compatibility": "TVI/CVI/AHD"
    },
    "specs": {
      "compatibility": {
        "label": "Standard",
        "value": "TVI/CVI/AHD",
        "highlightValue": "HD-TVI/AHD",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 250,
      "currency": "BDT"
    },
    "inventory": {
      "available": 200,
      "status": "in_stock"
    },
    "unit": "Set",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "acc-bracket",
    "name": "Hikvision Deep Base Waterproof Junction Box & Camera Mount Bracket",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-1280ZJ-DM18",
    "sku": "HIK-BRKT-DM18",
    "category": "Cables & Accessories",
    "categoryId": "cat-cables",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Weatherproof aluminum alloy junction box for concealing cable pigtails and securing bullet and dome cameras.",
    "description": "Solid aluminum alloy build with waterproof rubber grommet for outdoor wall and ceiling installations.",
    "keyFeatures": [
      "Aluminum alloy with surface spray treatment",
      "Waterproof design with cable inlet hole",
      "Compatible with Hikvision dome and turret series",
      "Up to 4.5 kg load-bearing capacity"
    ],
    "specifications": {
      "material": "Aluminum Alloy",
      "protection": "IP66 Weatherproof",
      "mount_type": "Wall & Ceiling"
    },
    "specs": {
      "protection": {
        "label": "Protection",
        "value": "IP66 Weatherproof",
        "highlightValue": "IP66",
        "showInHighlights": true
      },
      "material": {
        "label": "Material",
        "value": "Aluminum Alloy",
        "highlightValue": "Aluminum",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 850,
      "currency": "BDT"
    },
    "inventory": {
      "available": 50,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "acc-patch-cable",
    "name": "D-Link CAT6 RJ45 Molded High-Speed Patch Cord (3-Meter)",
    "brand": "D-Link",
    "brandId": "b-dlink",
    "modelNumber": "NCB-C6UBLUR1-3",
    "sku": "DL-PATCH-3M",
    "category": "Cables & Accessories",
    "categoryId": "cat-cables",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Factory molded pure copper CAT6 patch cable for NVR switches and router connections.",
    "description": "Gold-plated RJ45 connector pins ensuring zero signal latency and optimal Gigabit Ethernet throughput.",
    "keyFeatures": [
      "50-micron gold plated RJ45 pins",
      "Snagless strain relief boots",
      "Bare copper stranded conductors",
      "Supports 10/100/1000Base-T networks"
    ],
    "specifications": {
      "length": "3 Meters",
      "standard": "CAT6 UTP"
    },
    "specs": {
      "length": {
        "label": "Length",
        "value": "3 Meters",
        "highlightValue": "3m",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 280,
      "currency": "BDT"
    },
    "inventory": {
      "available": 80,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "acc-power-adapter",
    "name": "CamneX Pro 12V 2A Regulated DC Switching Power Adapter",
    "brand": "CamneX Pro",
    "brandId": "b-hikvision",
    "modelNumber": "AD-12V2A-DC",
    "sku": "ACC-ADAPT-12V2A",
    "category": "Power & Backup Units",
    "categoryId": "cat-power",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "High-efficiency 12V 2000mA switching power adapter with 2.1mm DC plug and surge suppression.",
    "description": "Standard CCTV camera and DVR power unit with overvoltage, overcurrent, and short circuit protection.",
    "keyFeatures": [
      "Input: AC 100-240V 50/60Hz universal",
      "Output: 12V DC 2.0A stabilized",
      "Overvoltage and short-circuit auto cutoff",
      "Standard 5.5mm x 2.1mm center-positive connector"
    ],
    "specifications": {
      "output": "12V 2A (24W)",
      "connector": "5.5 x 2.1mm DC"
    },
    "specs": {
      "output": {
        "label": "Output",
        "value": "12V 2A",
        "highlightValue": "12V 2A",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 350,
      "currency": "BDT"
    },
    "inventory": {
      "available": 60,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-ptz-2mp",
    "name": "Hikvision 2MP 4-Inch Speed Dome Mini PTZ Camera",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "DS-2DE4225IW-DE",
    "sku": "HIK-PTZ-2MP",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/hikvision-bullet.png"
    ],
    "primaryImage": "/images/hero/hikvision-bullet.png",
    "shortDescription": "25x optical zoom mini PTZ dome with 100m Smart IR and auto-tracking capabilities.",
    "description": "Ideal for expansive campus parking lots, commercial courtyards, and junction traffic monitoring.",
    "keyFeatures": [
      "1/2.8 progressive scan CMOS",
      "25x optical zoom and 16x digital zoom",
      "Up to 100m IR night distance",
      "IP66 weatherproof and IK10 vandal proof"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "IR Night Vision (up to 40m)",
      "lens": "Motorized Varifocal",
      "ip_rating": "IP66 Weatherproof",
      "form_factor": "PTZ",
      "audio_support": true
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "form_factor": {
        "label": "Form Factor",
        "value": "PTZ",
        "highlightValue": "25x PTZ",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP66 Weatherproof",
        "highlightValue": "IP66",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 28500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 5,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-dahua-dome-2mp",
    "name": "Dahua 2MP HDCVI Eyeball Dome Audio Camera",
    "brand": "Dahua",
    "brandId": "b-dahua",
    "modelNumber": "DH-HAC-HDW1200EMP-A",
    "sku": "DH-2MP-DOME",
    "category": "CCTV Cameras",
    "categoryId": "cat-cctv",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dome.svg"
    ],
    "primaryImage": "/images/products/hikvision-dome.svg",
    "shortDescription": "All-metal eyeball camera with built-in microphone and 50m Smart IR illumination.",
    "description": "Rugged aluminum casing suited for harsh outdoor wall mounts or high-ceiling industrial rooms.",
    "keyFeatures": [
      "2MP high definition HDCVI video",
      "Built-in high sensitivity microphone",
      "50m Smart IR distance",
      "IP67 waterproof aluminum chassis"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "IR Night Vision (up to 40m)",
      "lens": "3.6mm (Standard)",
      "ip_rating": "IP67 Weatherproof",
      "form_factor": "Dome",
      "audio_support": true
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "2MP (1080p)",
        "highlightValue": "2 MP",
        "showInHighlights": true
      },
      "night_vision": {
        "label": "Night Vision",
        "value": "IR Night Vision (up to 40m)",
        "highlightValue": "50m IR",
        "showInHighlights": true
      },
      "ip_rating": {
        "label": "IP Rating",
        "value": "IP67 Weatherproof",
        "highlightValue": "IP67",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 2850,
      "currency": "BDT"
    },
    "inventory": {
      "available": 30,
      "status": "in_stock"
    },
    "unit": "Piece",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-hik-dvr-32ch",
    "name": "Hikvision 32-Channel Enterprise AcuSense HD DVR",
    "brand": "Hikvision",
    "brandId": "b-hikvision",
    "modelNumber": "iDS-7232HQHI-M2/S",
    "sku": "HIK-DVR-32CH",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "32-channel high-density AI DVR supporting 4 SATA hard drives up to 40TB total.",
    "description": "Centralized recorder for hospitals, department stores, and large corporate campuses.",
    "keyFeatures": [
      "32 analog channels + 16 IP channels",
      "AcuSense AI filtering on up to 16 channels",
      "4 SATA interfaces supporting up to 10TB each",
      "Dual Gigabit LAN interfaces"
    ],
    "specifications": {
      "channels": "32 CH",
      "compression": "H.265 Pro+",
      "max_resolution": "5MP Lite",
      "hdd_slots": "4 SATA Slots"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "32 CH",
        "highlightValue": "32 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "H.265 Pro+",
        "highlightValue": "H.265+",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 28000,
      "currency": "BDT"
    },
    "inventory": {
      "available": 5,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-dahua-xvr-16ch",
    "name": "Dahua 16-Channel WizSense 1U XVR System",
    "brand": "Dahua",
    "brandId": "b-dahua",
    "modelNumber": "DH-XVR5216AN-I3",
    "sku": "DH-XVR-16CH",
    "category": "Recorders",
    "categoryId": "cat-recorders",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hikvision-dvr.svg"
    ],
    "primaryImage": "/images/products/hikvision-dvr.svg",
    "shortDescription": "16-channel 5-in-1 digital video recorder with dual SATA bays and AI perimeter protection.",
    "description": "Offers 16 SMD Plus channels to detect people and vehicles accurately, preventing false motion triggers.",
    "keyFeatures": [
      "16 channels SMD Plus protection",
      "H.265+/H.265 dual-stream video compression",
      "Supports up to 2 SATA drives up to 16TB each",
      "Full HD 1080P real-time recording"
    ],
    "specifications": {
      "channels": "16 CH",
      "compression": "AI Coding (H.265+)",
      "max_resolution": "5MP",
      "hdd_slots": "2 SATA Slots"
    },
    "specs": {
      "channels": {
        "label": "Channels",
        "value": "16 CH",
        "highlightValue": "16 CH",
        "showInHighlights": true
      },
      "compression": {
        "label": "Compression",
        "value": "AI Coding (H.265+)",
        "highlightValue": "AI Coding",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 15500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 8,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-f22",
    "name": "ZKTeco F22 Ultra-Thin Fingerprint Time Attendance & Access Control",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "F22",
    "sku": "ZK-F22",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/hero/zkteco-biometric.png"
    ],
    "primaryImage": "/images/hero/zkteco-biometric.png",
    "shortDescription": "Ultra-thin sleek biometric terminal with Wi-Fi connectivity and BioID fingerprint sensor.",
    "description": "Modern slimline design for executive boardrooms and glass door entrances with built-in Wi-Fi.",
    "keyFeatures": [
      "BioID sensor with exceptional recognition rate",
      "Built-in Wi-Fi and TCP/IP",
      "Touch keypad with 2.4-inch TFT color display",
      "Auxiliary input interface for linkage"
    ],
    "specifications": {
      "user_capacity": "5000 Users",
      "fingerprint_capacity": "3000 Prints",
      "verification_methods": "Fingerprint / Card / Password",
      "connectivity": "TCP/IP & Wi-Fi"
    },
    "specs": {
      "user_capacity": {
        "label": "Capacity",
        "value": "5000 Users",
        "highlightValue": "5000 Users",
        "showInHighlights": true
      },
      "verification_methods": {
        "label": "Verification",
        "value": "Fingerprint / Card / Password",
        "highlightValue": "Finger & Wi-Fi",
        "showInHighlights": true
      },
      "connectivity": {
        "label": "Network",
        "value": "TCP/IP & Wi-Fi",
        "highlightValue": "Wi-Fi",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 13500,
      "currency": "BDT"
    },
    "inventory": {
      "available": 12,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-zkteco-bracket-zl",
    "name": "ZKTeco Z&L Bracket for 280KG Magnetic Lock Installation",
    "brand": "ZKTeco",
    "brandId": "b-zkteco",
    "modelNumber": "ZL-280",
    "sku": "ZK-BRACKET-ZL",
    "category": "Access Control & Biometrics",
    "categoryId": "cat-access",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/hardware-accessory.svg"
    ],
    "primaryImage": "/images/products/hardware-accessory.svg",
    "shortDescription": "Heavy-duty anodized sandblasted aluminum bracket set for in-swing door magnetic locks.",
    "description": "Ensures rigid and secure installation on inward opening wooden or metal security doors.",
    "keyFeatures": [
      "High strength anodized aluminum alloy",
      "Sandblasting surface finish",
      "Fits 280kg (600 lbs) electromagnetic locks",
      "Easy to install with pre-drilled holes"
    ],
    "specifications": {
      "material": "Anodized Aluminum",
      "compatibility": "280KG Magnetic Locks"
    },
    "specs": {
      "compatibility": {
        "label": "Compatibility",
        "value": "280KG Magnetic Locks",
        "highlightValue": "280kg Lock",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 1400,
      "currency": "BDT"
    },
    "inventory": {
      "available": 50,
      "status": "in_stock"
    },
    "unit": "Set",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-ruijie-es105d",
    "name": "Ruijie Reyee RG-ES105D 5-Port Gigabit Desktop Plastic Switch",
    "brand": "Ruijie Networks",
    "brandId": "b-ruijie",
    "modelNumber": "RG-ES105D",
    "sku": "RG-ES105D",
    "category": "Network Switches",
    "categoryId": "cat-networking",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/ruijie-switch.svg"
    ],
    "primaryImage": "/images/products/ruijie-switch.svg",
    "shortDescription": "Plug-and-play 5-port 10/100/1000 Mbps gigabit unmanaged compact desktop switch.",
    "description": "Cost-effective high-speed switch for home offices, cash registers, and small network clusters.",
    "keyFeatures": [
      "5 x 10/100/1000 Mbps auto-negotiation RJ45 ports",
      "Plug and play without any configuration",
      "Compact matte plastic casing",
      "Quiet fanless operation"
    ],
    "specifications": {
      "ports": "5 Ports",
      "poe_support": false,
      "switching_capacity": "10 Gbps",
      "managed": false
    },
    "specs": {
      "ports": {
        "label": "Ports",
        "value": "5 Ports",
        "highlightValue": "5 Ports",
        "showInHighlights": true
      },
      "switching_capacity": {
        "label": "Backplane",
        "value": "10 Gbps",
        "highlightValue": "10 Gbps",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 1350,
      "currency": "BDT"
    },
    "inventory": {
      "available": 50,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  {
    "id": "prod-wifi-c6n",
    "name": "EZVIZ C6N 3MP Pan & Tilt Smart Wi-Fi Camera",
    "modelNumber": "CS-C6N-D0-8B3WF",
    "sku": "EZV-C6N-3MP",
    "brandId": "brand-ezviz",
    "brand": "EZVIZ",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "Motorized 360-degree pan and tilt Wi-Fi camera with smart tracking, two-way audio, and infrared night vision up to 10m.",
    "pricing": {
      "regularPrice": 4200,
      "salePrice": 3850,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "3MP (2K)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 256GB",
      "two_way_audio": true,
      "power_source": "5V USB-C",
      "app_support": "EZVIZ App"
    },
    "inventory": {
      "available": 25,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-h8c",
    "name": "EZVIZ H8c 4MP 360° Outdoor Pan & Tilt Wi-Fi Camera",
    "modelNumber": "CS-H8c-R100-1K4WKFL",
    "sku": "EZV-H8C-4MP",
    "brandId": "brand-ezviz",
    "brand": "EZVIZ",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "Weatherproof outdoor pan/tilt camera with AI human detection, color night vision, active defense siren, and strobe light.",
    "pricing": {
      "regularPrice": 9200,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "4MP (2K QHD)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 512GB",
      "two_way_audio": true,
      "power_source": "12V DC Plug-in",
      "app_support": "EZVIZ App"
    },
    "inventory": {
      "available": 18,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-h3c",
    "name": "EZVIZ H3c 2K Color Night Vision Outdoor Wi-Fi Camera",
    "modelNumber": "CS-H3c-R100-1K3WKFL",
    "sku": "EZV-H3C-3MP",
    "brandId": "brand-ezviz",
    "brand": "EZVIZ",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": false,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "Reliable IP67 weatherproof outdoor bullet camera featuring color night vision and AI-powered human shape detection.",
    "pricing": {
      "regularPrice": 6500,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "3MP (2K)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 512GB",
      "two_way_audio": true,
      "power_source": "12V DC Plug-in",
      "app_support": "EZVIZ App"
    },
    "inventory": {
      "available": 20,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-hik-pt",
    "name": "Hikvision 2MP Indoor Pan & Tilt Wi-Fi Camera",
    "modelNumber": "DS-2CV2Q21FD-IW",
    "sku": "HIK-2CV2Q21-2MP",
    "brandId": "brand-hikvision",
    "brand": "Hikvision",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "Dual-antenna indoor pan-tilt Wi-Fi camera with Hik-Connect cloud P2P, built-in microphone and speaker, and 10m IR.",
    "pricing": {
      "regularPrice": 5800,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "2MP (1080p)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 256GB",
      "two_way_audio": true,
      "power_source": "5V USB-C",
      "app_support": "Hik-Connect"
    },
    "inventory": {
      "available": 15,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-hik-bullet",
    "name": "Hikvision 4MP Smart Wi-Fi Outdoor Bullet Camera",
    "modelNumber": "DS-2CV1043G2-LIDW",
    "sku": "HIK-2CV1043-4MP",
    "brandId": "brand-hikvision",
    "brand": "Hikvision",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": false,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "IP66 outdoor wireless bullet with smart dual lighting, onboard Wi-Fi range up to 120m in open field, and digital WDR.",
    "pricing": {
      "regularPrice": 8500,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "4MP (2K QHD)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 256GB",
      "two_way_audio": true,
      "power_source": "12V DC Plug-in",
      "app_support": "Hik-Connect"
    },
    "inventory": {
      "available": 12,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-imou-ranger",
    "name": "Imou Ranger 2 4MP Indoor 360° Wi-Fi Camera",
    "modelNumber": "IPC-A42P-D",
    "sku": "IMOU-RANGER2-4MP",
    "brandId": "brand-dahua",
    "brand": "Dahua",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "High-resolution 4MP pan and tilt camera with abnormal sound alarm, physical privacy shutter, and human detection.",
    "pricing": {
      "regularPrice": 4600,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "4MP (2K QHD)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 256GB",
      "two_way_audio": true,
      "power_source": "5V USB-C",
      "app_support": "DMSS / Imou Life"
    },
    "inventory": {
      "available": 30,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-imou-ranger2pro-3mp",
    "name": "Imou Ranger 2 Pro 3MP Indoor Pan & Tilt Wi-Fi Camera",
    "shortName": "Imou Ranger 2 Pro 3MP",
    "modelNumber": "IPC-A32P-L",
    "sku": "IMOU-RANGER2PRO-3MP",
    "brandId": "brand-imou",
    "brand": "Imou",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Indoor Pan & Tilt Cameras",
    "subcategorySlug": "wifi-cameras",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "isPopular": true,
    "isFeatured": true,
    "primaryImage": "/images/products/hikvision-dome.svg",
    "images": [
      "/images/products/hikvision-dome.svg"
    ],
    "shortDescription": "3MP (2304 × 1296) 2K indoor smart pan & tilt Wi-Fi 6 camera featuring 355° pan, -5° to 80° tilt, two-way audio, and H.265 video compression.",
    "description": "The Imou Ranger 2 Pro 3MP (IPC-A32P-L) delivers crystal-clear 2K indoor surveillance with 355° horizontal rotation and -5° to 80° vertical tilt. Powered by next-gen Dual-Band Wi-Fi 6 connectivity, it provides ultra-smooth video streaming, AI human detection, smart tracking, two-way audio, abnormal sound detection, and physical privacy shutter mode.",
    "keyFeatures": [
      "3MP 2K Resolution (2304 × 1296) with clear detail",
      "355° Pan & -5° to 80° Tilt for complete 360° indoor coverage",
      "Dual-Band Wi-Fi 6 (2.4GHz & 5GHz) for ultra-fast, stable streaming",
      "Two-Way Audio with built-in microphone and high-fidelity speaker",
      "Advanced AI Human Detection & Smart Motion Tracking",
      "Physical Privacy Shield Mode to hide lens when at home",
      "Abnormal Sound Alarm (baby crying, glass breaking alerts)",
      "H.265 / H.264 Video Compression for optimized bandwidth and storage"
    ],
    "specifications": {
      "resolution": "3MP (2304 × 1296)",
      "pan_range": "0° to 355° Pan",
      "tilt_range": "-5° to 80° Tilt",
      "two_way_audio": "Built-in Mic & Speaker (Two-Way Audio)",
      "wifi_connectivity": "Dual-Band Wi-Fi 6 (2.4GHz / 5GHz)",
      "video_compression": "H.265 / H.264",
      "night_vision": "Infrared Night Vision up to 10m (33ft)",
      "lens": "3.6mm Fixed Lens",
      "storage": "MicroSD Slot (up to 256GB), Imou Cloud, NVR",
      "smart_detection": "AI Human Detection, Pet Detection, Motion Tracking",
      "power_source": "DC 5V 1.5A USB Type-C",
      "app_support": "Imou Life App (iOS / Android)"
    },
    "pricing": {
      "regularPrice": null,
      "salePrice": null,
      "currency": "BDT"
    },
    "inventory": {
      "available": 0,
      "status": "request_quote"
    },
    "unit": "Piece",
    "warrantyMonths": 12,
    "warrantyType": "official",
    "warrantyText": "1-Year Official Manufacturer Warranty"
  },
  {
    "id": "prod-wifi-imou-ranger2pro-5mp",
    "name": "Imou Ranger 2 Pro 5MP Indoor Pan & Tilt Wi-Fi Camera",
    "shortName": "Imou Ranger 2 Pro 5MP",
    "modelNumber": "IPC-A52P-L",
    "sku": "IMOU-RANGER2PRO-5MP",
    "brandId": "brand-imou",
    "brand": "Imou",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Indoor Pan & Tilt Cameras",
    "subcategorySlug": "wifi-cameras",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "isPopular": true,
    "isFeatured": true,
    "primaryImage": "/images/products/hikvision-dome.svg",
    "images": [
      "/images/products/hikvision-dome.svg"
    ],
    "shortDescription": "5MP (2880 × 1620) 3K indoor smart pan & tilt Wi-Fi 6 camera featuring 355° pan, -5° to 80° tilt, two-way audio, and H.265 video compression.",
    "description": "The Imou Ranger 2 Pro 5MP (IPC-A52P-L) provides ultra-high 3K resolution surveillance with complete 360° coverage via 355° pan and -5° to 80° tilt. Equipped with Dual-Band Wi-Fi 6 technology, AI-driven human and pet detection, auto-motion tracking, two-way audio communication, abnormal sound alarm, and physical privacy shutter.",
    "keyFeatures": [
      "5MP 3K Resolution (2880 × 1620) with ultra-fine clarity",
      "355° Pan & -5° to 80° Tilt for complete 360° indoor coverage",
      "Dual-Band Wi-Fi 6 (2.4GHz & 5GHz) for lag-free high-bitrate streaming",
      "Two-Way Audio with built-in microphone and high-fidelity speaker",
      "Advanced AI Human Detection & Smart Motion Tracking",
      "Physical Privacy Shield Mode to hide lens when at home",
      "Abnormal Sound Alarm (baby crying, glass breaking alerts)",
      "H.265 / H.264 Video Compression for optimized bandwidth and storage"
    ],
    "specifications": {
      "resolution": "5MP (2880 × 1620)",
      "pan_range": "0° to 355° Pan",
      "tilt_range": "-5° to 80° Tilt",
      "two_way_audio": "Built-in Mic & Speaker (Two-Way Audio)",
      "wifi_connectivity": "Dual-Band Wi-Fi 6 (2.4GHz / 5GHz)",
      "video_compression": "H.265 / H.264",
      "night_vision": "Infrared Night Vision up to 10m (33ft)",
      "lens": "3.6mm Fixed Lens",
      "storage": "MicroSD Slot (up to 256GB), Imou Cloud, NVR",
      "smart_detection": "AI Human Detection, Pet Detection, Motion Tracking",
      "power_source": "DC 5V 1.5A USB Type-C",
      "app_support": "Imou Life App (iOS / Android)"
    },
    "pricing": {
      "regularPrice": null,
      "salePrice": null,
      "currency": "BDT"
    },
    "inventory": {
      "available": 0,
      "status": "request_quote"
    },
    "unit": "Piece",
    "warrantyMonths": 12,
    "warrantyType": "official",
    "warrantyText": "1-Year Official Manufacturer Warranty"
  },
  {
    "id": "prod-wifi-imou-bullet",
    "name": "Imou Bullet 2C 4MP Weatherproof Outdoor Wi-Fi Camera",
    "modelNumber": "IPC-F42P",
    "sku": "IMOU-BULLET2C-4MP",
    "brandId": "brand-dahua",
    "brand": "Dahua",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": false,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "Weatherproof IP67 bullet camera with dual external antennas, built-in Wi-Fi hotspot mode, and 30m night vision.",
    "pricing": {
      "regularPrice": 5900,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "4MP (2K QHD)",
      "wifi_band": "2.4 GHz",
      "storage": "MicroSD up to 256GB",
      "two_way_audio": false,
      "power_source": "12V DC Plug-in",
      "app_support": "DMSS / Imou Life"
    },
    "inventory": {
      "available": 22,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-imou-cruiser",
    "name": "Imou Cruiser 2 5MP 3K Outdoor PTZ Wi-Fi Camera",
    "modelNumber": "IPC-GS7EP-5M0WE",
    "sku": "IMOU-CRUISER2-5MP",
    "brandId": "brand-dahua",
    "brand": "Dahua",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "status": "active",
    "isPopular": true,
    "isFeatured": true,
    "isDemo": true,
    "sample": true,
    "description": "5MP 3K outdoor speed dome featuring full panoramic coverage, smart full-color night vision, and Wi-Fi 6 connectivity.",
    "pricing": {
      "regularPrice": 11500,
      "currency": "BDT"
    },
    "specifications": {
      "resolution": "5MP (3K)",
      "wifi_band": "Wi-Fi 6",
      "storage": "MicroSD up to 512GB",
      "two_way_audio": true,
      "power_source": "12V DC Plug-in",
      "app_support": "DMSS / Imou Life"
    },
    "inventory": {
      "available": 14,
      "status": "in_stock"
    },
    "subcategoryId": "subcat-wifi-cameras",
    "subcategory": "Wi-Fi Cameras",
    "subcategorySlug": "wifi-cameras"
  },
  {
    "id": "prod-wifi-db2",
    "name": "EZVIZ DB2 2K Battery Video Doorbell with Chime",
    "slug": "ezviz-db2-2k-battery-video-doorbell",
    "modelNumber": "CS-DB2-A0-2C5WF",
    "sku": "EZV-DB2-2K",
    "brandId": "brand-ezviz",
    "brand": "EZVIZ",
    "categoryId": "cat-wifi",
    "category": "Wi-Fi / Smart Devices",
    "shortDescription": "Wireless 2K smart video doorbell with wire-free battery installation and indoor chime.",
    "description": "Crisp 2K resolution video doorbell featuring PIR human detection, ultra-wide 176° field of view, and included indoor wireless chime.",
    "pricing": {
      "regularPrice": 11500
    },
    "inventory": {
      "available": 12,
      "reserved": 0,
      "lowStockThreshold": 3
    },
    "specifications": [
      {
        "key": "Resolution",
        "value": "2K (2000 x 1504)"
      },
      {
        "key": "Field of View",
        "value": "176° Ultra-Wide Angle"
      },
      {
        "key": "Night Vision",
        "value": "Up to 5m Infrared"
      },
      {
        "key": "Battery",
        "value": "5200mAh Rechargeable"
      },
      {
        "key": "Connectivity",
        "value": "Wi-Fi 2.4GHz"
      }
    ],
    "status": "active",
    "websiteVisible": true,
    "isPopular": true,
    "subcategoryId": "subcat-video-doorbells",
    "subcategory": "Video Doorbells",
    "subcategorySlug": "video-doorbells"
  },
  {
    "id": "prod-wifi-db1c",
    "name": "EZVIZ DB1C 1080p Smart Wi-Fi Video Doorbell",
    "shortName": "EZVIZ DB1C Video Doorbell",
    "brand": "EZVIZ",
    "brandId": "b-hikvision",
    "modelNumber": "CS-DB1C-A0-1E2W2FR",
    "sku": "EZVIZ-DB1C-1080P",
    "category": "Wi-Fi / Smart Devices",
    "categoryId": "cat-wifi",
    "subcategory": "Video Doorbells",
    "subcategoryId": "subcat-video-doorbells",
    "subcategorySlug": "video-doorbells",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/smart-doorbell.svg"
    ],
    "primaryImage": "/images/products/smart-doorbell.svg",
    "shortDescription": "1080p Full HD video doorbell with AI human detection, 170° vertical field of view, and two-way audio talk.",
    "description": "Compact weatherproof smart doorbell featuring dual-band 2.4/5GHz Wi-Fi connectivity and night vision up to 5 meters. Free EZVIZ app push notifications on doorstep rings.",
    "keyFeatures": [
      "1080p Full HD Video",
      "170° Vertical Viewing Angle",
      "AI-Powered Human Detection",
      "Dual-Band 2.4 & 5 GHz Wi-Fi",
      "IP65 Weather Resistance"
    ],
    "specifications": {
      "resolution": "1080p",
      "field_of_view": "170° Vertical",
      "audio": "Two-Way Talk",
      "wifi": "Dual-Band 2.4/5GHz"
    },
    "specs": {
      "resolution": {
        "label": "Resolution",
        "value": "1080p",
        "highlightValue": "1080p FHD",
        "showInHighlights": true
      },
      "viewingAngle": {
        "label": "FOV",
        "value": "170°",
        "highlightValue": "170° Vertical",
        "showInHighlights": true
      },
      "audio": {
        "label": "Audio",
        "value": "Two-Way",
        "highlightValue": "Two-Way Talk",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 8500,
      "currency": "BDT"
    },
    "inventory": {
      "trackQuantity": true,
      "available": 12
    },
    "unit": "Piece",
    "warrantyMonths": 12,
    "isFeatured": false,
    "isPopular": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-wifi-light-lb1",
    "name": "EZVIZ LB1 Smart Color LED Wi-Fi Bulb (E27)",
    "shortName": "EZVIZ LB1 Color Smart Bulb",
    "brand": "EZVIZ",
    "brandId": "b-hikvision",
    "modelNumber": "CS-HAL-LB1-LHAW",
    "sku": "EZVIZ-LB1-RGB",
    "category": "Wi-Fi / Smart Devices",
    "categoryId": "cat-wifi",
    "subcategory": "Smart Lights",
    "subcategoryId": "subcat-smart-lights",
    "subcategorySlug": "smart-lights",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/smart-light.svg"
    ],
    "primaryImage": "/images/products/smart-light.svg",
    "shortDescription": "Dimmable multicolor smart LED bulb with 16 million colors, 806 lumens brightness, and direct smartphone scheduling.",
    "description": "Energy-saving 8W smart bulb fitting standard E27 sockets. Connects directly to 2.4GHz Wi-Fi with no hub required. Supports Alexa and Google Assistant voice automation.",
    "keyFeatures": [
      "16 Million Colors + Tunable White",
      "806 Lumens Dimmable Brightness",
      "No Hub Required (2.4GHz Wi-Fi)",
      "Timer & Automation Schedules",
      "Voice Control Compatible"
    ],
    "specifications": {
      "brightness": "806 Lumens",
      "fitting": "E27",
      "power": "8W LED",
      "connectivity": "2.4GHz Wi-Fi"
    },
    "specs": {
      "brightness": {
        "label": "Brightness",
        "value": "806 Lumens",
        "highlightValue": "806 Lumens",
        "showInHighlights": true
      },
      "colors": {
        "label": "Colors",
        "value": "16 Million RGB",
        "highlightValue": "16M Colors",
        "showInHighlights": true
      },
      "fitting": {
        "label": "Socket",
        "value": "E27 Base",
        "highlightValue": "E27 Fitting",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 1650,
      "currency": "BDT"
    },
    "inventory": {
      "trackQuantity": true,
      "available": 25
    },
    "unit": "Piece",
    "warrantyMonths": 12,
    "isFeatured": false,
    "isPopular": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-wifi-light-strip",
    "name": "EZVIZ T30-A Smart Wi-Fi RGB Light Strip (5 Meters)",
    "shortName": "EZVIZ 5m RGB Smart Strip",
    "brand": "EZVIZ",
    "brandId": "b-hikvision",
    "modelNumber": "CS-HAL-LS1-5M",
    "sku": "EZVIZ-LS1-STRIP-5M",
    "category": "Wi-Fi / Smart Devices",
    "categoryId": "cat-wifi",
    "subcategory": "Smart Lights",
    "subcategoryId": "subcat-smart-lights",
    "subcategorySlug": "smart-lights",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/smart-light.svg"
    ],
    "primaryImage": "/images/products/smart-light.svg",
    "shortDescription": "Flexible 5-meter adhesive RGB light strip with music sync, custom scene illumination, and app control.",
    "description": "Customizable accent strip for TV backlighting, false ceilings, and ambient displays. Cuttable every 10cm with included high-tack mounting tape.",
    "keyFeatures": [
      "5 Meters Flexible Length",
      "Music Rhythm Sync Mode",
      "Cuttable and Expandable",
      "App Remote Dimming & Scenes"
    ],
    "specifications": {
      "length": "5 Meters",
      "colors": "RGBIC",
      "connectivity": "Wi-Fi 2.4GHz"
    },
    "specs": {
      "length": {
        "label": "Length",
        "value": "5 Meters",
        "highlightValue": "5m Strip",
        "showInHighlights": true
      },
      "sync": {
        "label": "Feature",
        "value": "Music Sync",
        "highlightValue": "Music Sync",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 2950,
      "currency": "BDT"
    },
    "inventory": {
      "trackQuantity": true,
      "available": 15
    },
    "unit": "Set",
    "warrantyMonths": 12,
    "isFeatured": false,
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-wifi-plug-t30",
    "name": "EZVIZ T30-10B Smart Wi-Fi Plug with Power Metering",
    "shortName": "EZVIZ T30 Smart Wi-Fi Plug",
    "brand": "EZVIZ",
    "brandId": "b-hikvision",
    "modelNumber": "CS-T30-10B-EU",
    "sku": "EZVIZ-T30-PLUG-10A",
    "category": "Wi-Fi / Smart Devices",
    "categoryId": "cat-wifi",
    "subcategory": "Smart Plugs & Switches",
    "subcategoryId": "subcat-smart-plugs",
    "subcategorySlug": "smart-plugs-switches",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/smart-plug.svg"
    ],
    "primaryImage": "/images/products/smart-plug.svg",
    "shortDescription": "Compact 10A smart wall plug with energy consumption monitoring, countdown timers, and flame-retardant housing.",
    "description": "Control AC appliances, water heaters, and chargers remotely from anywhere. Displays real-time wattage and kilowatt-hour tracking in the EZVIZ mobile app.",
    "keyFeatures": [
      "Real-Time Energy Metering",
      "2300W Maximum Power Capacity",
      "App Remote On/Off & Timers",
      "Flame-Retardant 750°C Material"
    ],
    "specifications": {
      "max_load": "10A / 2300W",
      "voltage": "220-240V AC",
      "connectivity": "2.4GHz Wi-Fi"
    },
    "specs": {
      "maxLoad": {
        "label": "Max Load",
        "value": "10A / 2300W",
        "highlightValue": "10A 2300W",
        "showInHighlights": true
      },
      "metering": {
        "label": "Energy",
        "value": "Live Metering",
        "highlightValue": "Power Meter",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 1450,
      "currency": "BDT"
    },
    "inventory": {
      "trackQuantity": true,
      "available": 30
    },
    "unit": "Piece",
    "warrantyMonths": 12,
    "isFeatured": true,
    "isPopular": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-wifi-lock-dl01",
    "name": "EZVIZ DL01S Smart Keyless Entry Deadbolt Lock",
    "shortName": "EZVIZ DL01S Smart Deadbolt",
    "brand": "EZVIZ",
    "brandId": "b-hikvision",
    "modelNumber": "CS-DL01S",
    "sku": "EZVIZ-DL01S-LOCK",
    "category": "Wi-Fi / Smart Devices",
    "categoryId": "cat-wifi",
    "subcategory": "Smart Locks",
    "subcategoryId": "subcat-smart-locks",
    "subcategorySlug": "smart-locks",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/smart-lock.svg"
    ],
    "primaryImage": "/images/products/smart-lock.svg",
    "shortDescription": "Keyless retrofit smart lock with digital keypad, temporary visitor passcodes, and auto-lock sensor.",
    "description": "Fits over existing door deadbolts for fast 15-minute installation. Control access via Bluetooth or paired Wi-Fi gateway with real-time unlock logs.",
    "keyFeatures": [
      "Keypad Passcode & App Unlock",
      "Temporary Visitor Access Codes",
      "Door Status Auto-Lock Sensor",
      "Emergency Power Interface"
    ],
    "specifications": {
      "lock_type": "Deadbolt Retrofit",
      "battery": "4 x AA Alkaline",
      "connectivity": "Bluetooth & Wi-Fi"
    },
    "specs": {
      "unlockMethod": {
        "label": "Access",
        "value": "Passcode & App",
        "highlightValue": "Keypad + App",
        "showInHighlights": true
      },
      "battery": {
        "label": "Battery",
        "value": "4x AA Batteries",
        "highlightValue": "1-Year Life",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": 16800,
      "currency": "BDT"
    },
    "inventory": {
      "trackQuantity": true,
      "available": 6
    },
    "unit": "Set",
    "warrantyMonths": 18,
    "isFeatured": true,
    "isPopular": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "id": "prod-wifi-lock-dl05",
    "name": "EZVIZ DL05 Biometric Smart Door Lock with Fingerprint Scanner",
    "shortName": "EZVIZ DL05 Biometric Lock",
    "brand": "EZVIZ",
    "brandId": "b-hikvision",
    "modelNumber": "CS-DL05-PRO",
    "sku": "EZVIZ-DL05-FINGERPRINT",
    "category": "Wi-Fi / Smart Devices",
    "categoryId": "cat-wifi",
    "subcategory": "Smart Locks",
    "subcategoryId": "subcat-smart-locks",
    "subcategorySlug": "smart-locks",
    "productType": "physical",
    "status": "active",
    "websiteVisible": true,
    "posAvailable": true,
    "images": [
      "/images/products/smart-lock.svg"
    ],
    "primaryImage": "/images/products/smart-lock.svg",
    "shortDescription": "Commercial biometric smart lock with semiconductor fingerprint sensor, anti-peep keypad, and IC card keys.",
    "description": "Heavy-duty zinc alloy exterior door lock with integrated doorbell chime, emergency mechanical key cylinder, and remote unlocking.",
    "keyFeatures": [
      "0.3s Rapid Fingerprint Recognition",
      "Anti-Peep Virtual Password Entry",
      "RFID Card & Smartphone App Unlock",
      "Built-in Doorbell & Tamper Alarm"
    ],
    "specifications": {
      "fingerprint_capacity": "50 Users",
      "material": "Zinc Alloy",
      "connectivity": "Wi-Fi 2.4GHz"
    },
    "specs": {
      "biometrics": {
        "label": "Fingerprint",
        "value": "0.3s Sensor",
        "highlightValue": "Biometric 0.3s",
        "showInHighlights": true
      },
      "material": {
        "label": "Chassis",
        "value": "Zinc Alloy",
        "highlightValue": "Zinc Alloy",
        "showInHighlights": true
      }
    },
    "pricing": {
      "regularPrice": null,
      "currency": "BDT"
    },
    "inventory": {
      "trackQuantity": true,
      "available": 4
    },
    "unit": "Set",
    "warrantyMonths": 24,
    "isFeatured": true,
    "isPopular": true,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  }
];

export const INITIAL_PACKAGES: SecurityPackage[] = [
  {
    "id": "pkg-ir-2",
    "name": "2-Camera Night Vision CCTV Package",
    "slug": "2-camera-night-vision-package",
    "seriesId": "series-ir",
    "seriesName": "Night Vision (IR)",
    "technologyLabel": "Hikvision EXIR IR",
    "badge": "Affordable",
    "description": "Complete 2-camera 1080p surveillance with infrared night vision up to 20m, 4-channel DVR, and pre-terminated video cabling.",
    "cameraCount": 2,
    "cameraCountsSupported": [
      2
    ],
    "isNightVisionIrOnly": true,
    "basePrice": 14600,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "2x Hikvision 2MP IRPF Fixed Bullet Cameras",
      "1x Hikvision 4-Channel Turbo HD DVR",
      "1x Western Digital Purple 500GB HDD",
      "40m High-Shield Coaxial Video Cable",
      "1x 12V 5A Centralized Regulated Power Supply",
      "Complete BNC and DC Video Connectors"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-ir",
    "nightViewName": "Night Vision (IR)",
    "components": [
      {
        "name": "Hikvision 2MP IRPF Fixed Bullet Camera",
        "sku": "prod-hik-irpf-2mp",
        "qty": 2,
        "unitPrice": 2400,
        "lineTotal": 4800
      },
      {
        "name": "Hikvision 4-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-4ch",
        "qty": 1,
        "unitPrice": 4500,
        "lineTotal": 4500
      },
      {
        "name": "Western Digital Purple 500GB Surveillance HDD",
        "sku": "prod-wd-purple-500gb",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 40,
        "unitPrice": 30,
        "lineTotal": 1200
      },
      {
        "name": "12V 5A Centralized Regulated Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 2,
        "unitPrice": 250,
        "lineTotal": 500
      }
    ]
  },
  {
    "id": "pkg-ir-4",
    "name": "4-Camera Night Vision CCTV Package",
    "slug": "4-camera-night-vision-package",
    "seriesId": "series-ir",
    "seriesName": "Night Vision (IR)",
    "technologyLabel": "Hikvision EXIR IR",
    "badge": "Most Popular",
    "description": "Complete 4-camera 1080p surveillance with smart EXIR infrared, 4-channel DVR, 1TB storage, and power distribution.",
    "cameraCount": 4,
    "cameraCountsSupported": [
      4
    ],
    "isNightVisionIrOnly": true,
    "basePrice": 24100,
    "isActive": true,
    "isFeatured": true,
    "featuredOnHomepage": true,
    "isDemo": true,
    "inclusions": [
      "4x Hikvision 2MP IRPF Cameras",
      "1x Hikvision 4-Channel Turbo HD DVR",
      "1x Western Digital Purple 1TB Surveillance HDD",
      "80m High-Shield Coaxial Video Cable",
      "1x 12V 5A Centralized Regulated Power Supply",
      "Complete BNC and DC Connectors"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-ir",
    "nightViewName": "Night Vision (IR)",
    "components": [
      {
        "name": "Hikvision 2MP IRPF Fixed Bullet Camera",
        "sku": "prod-hik-irpf-2mp",
        "qty": 4,
        "unitPrice": 2400,
        "lineTotal": 9600
      },
      {
        "name": "Hikvision 4-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-4ch",
        "qty": 1,
        "unitPrice": 4500,
        "lineTotal": 4500
      },
      {
        "name": "Western Digital Purple 1TB Surveillance HDD",
        "sku": "prod-wd-purple-1tb",
        "qty": 1,
        "unitPrice": 4800,
        "lineTotal": 4800
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 80,
        "unitPrice": 30,
        "lineTotal": 2400
      },
      {
        "name": "12V 5A Centralized Regulated Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 4,
        "unitPrice": 250,
        "lineTotal": 1000
      }
    ]
  },
  {
    "id": "pkg-ir-8",
    "name": "8-Camera Night Vision CCTV Package",
    "slug": "8-camera-night-vision-package",
    "seriesId": "series-ir",
    "seriesName": "Night Vision (IR)",
    "technologyLabel": "Hikvision EXIR IR",
    "description": "8-channel infrared security system covering exterior perimeter and interior hallways with 2TB storage.",
    "cameraCount": 8,
    "cameraCountsSupported": [
      8
    ],
    "isNightVisionIrOnly": true,
    "basePrice": 41500,
    "isActive": true,
    "isFeatured": true,
    "isDemo": true,
    "inclusions": [
      "8x Hikvision 2MP IRPF Cameras",
      "1x Hikvision 8-Channel Turbo HD DVR",
      "1x Western Digital Purple 2TB Surveillance HDD",
      "160m High-Shield Video Cable",
      "1x 12V 10A Heavy-Duty Power Supply",
      "BNC & DC Power Connectors"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-ir",
    "nightViewName": "Night Vision (IR)",
    "components": [
      {
        "name": "Hikvision 2MP IRPF Fixed Bullet Camera",
        "sku": "prod-hik-irpf-2mp",
        "qty": 8,
        "unitPrice": 2400,
        "lineTotal": 19200
      },
      {
        "name": "Hikvision 8-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-8ch",
        "qty": 1,
        "unitPrice": 6800,
        "lineTotal": 6800
      },
      {
        "name": "Western Digital Purple 2TB Surveillance HDD",
        "sku": "prod-wd-purple-2tb",
        "qty": 1,
        "unitPrice": 6900,
        "lineTotal": 6900
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 160,
        "unitPrice": 30,
        "lineTotal": 4800
      },
      {
        "name": "12V 10A Heavy-Duty Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 8,
        "unitPrice": 250,
        "lineTotal": 2000
      }
    ]
  },
  {
    "id": "pkg-ir-16",
    "name": "16-Camera Night Vision CCTV Package",
    "slug": "16-camera-night-vision-package",
    "seriesId": "series-ir",
    "seriesName": "Night Vision (IR)",
    "technologyLabel": "Hikvision EXIR IR",
    "description": "Comprehensive 16-channel infrared surveillance system for retail stores and multi-floor commercial facilities.",
    "cameraCount": 16,
    "cameraCountsSupported": [
      16
    ],
    "isNightVisionIrOnly": true,
    "basePrice": 78900,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "16x Hikvision 2MP IRPF Cameras",
      "1x Hikvision 16-Channel DVR Recorder",
      "1x Western Digital Purple 4TB Surveillance HDD",
      "320m High-Shield Video Cable",
      "1x 12V 20A Industrial Power Supply",
      "Connectors & Distribution Box"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-ir",
    "nightViewName": "Night Vision (IR)",
    "components": [
      {
        "name": "Hikvision 2MP IRPF Fixed Bullet Camera",
        "sku": "prod-hik-irpf-2mp",
        "qty": 16,
        "unitPrice": 2400,
        "lineTotal": 38400
      },
      {
        "name": "Hikvision 16-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-16ch",
        "qty": 1,
        "unitPrice": 12500,
        "lineTotal": 12500
      },
      {
        "name": "Seagate SkyHawk 4TB Surveillance HDD",
        "sku": "prod-st-skyhawk-4tb",
        "qty": 1,
        "unitPrice": 11200,
        "lineTotal": 11200
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 320,
        "unitPrice": 30,
        "lineTotal": 9600
      },
      {
        "name": "12V 20A Industrial Power Supply",
        "sku": "acc-power-20a",
        "qty": 1,
        "unitPrice": 3200,
        "lineTotal": 3200
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 16,
        "unitPrice": 250,
        "lineTotal": 4000
      }
    ]
  },
  {
    "id": "pkg-hybrid-4",
    "name": "4-Camera Smart Hybrid Light CCTV Package",
    "slug": "4-camera-hybrid-light-package",
    "seriesId": "series-hybrid",
    "seriesName": "Hybrid Light",
    "technologyLabel": "Smart Hybrid Light",
    "description": "Intelligent dual-light security cameras that operate in infrared mode and switch to bright illumination upon motion.",
    "cameraCount": 4,
    "cameraCountsSupported": [
      4
    ],
    "basePrice": 27300,
    "isActive": true,
    "isFeatured": true,
    "isDemo": true,
    "inclusions": [
      "4x 2MP Smart Hybrid Light Cameras",
      "1x 4-Channel AcuSense DVR Recorder",
      "1x Western Digital Purple 1TB HDD",
      "80m Video Cable with Connectors",
      "1x 12V 5A Central Power Supply",
      "Mobile App P2P Configuration"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-hybrid",
    "nightViewName": "Hybrid Light",
    "components": [
      {
        "name": "Dahua 2MP HDCVI Smart Hybrid Light Camera",
        "sku": "prod-dahua-2mp-bullet",
        "qty": 4,
        "unitPrice": 3200,
        "lineTotal": 12800
      },
      {
        "name": "Hikvision 4-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-4ch",
        "qty": 1,
        "unitPrice": 4500,
        "lineTotal": 4500
      },
      {
        "name": "Western Digital Purple 1TB Surveillance HDD",
        "sku": "prod-wd-purple-1tb",
        "qty": 1,
        "unitPrice": 4800,
        "lineTotal": 4800
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 80,
        "unitPrice": 30,
        "lineTotal": 2400
      },
      {
        "name": "12V 5A Centralized Regulated Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 4,
        "unitPrice": 250,
        "lineTotal": 1000
      }
    ]
  },
  {
    "id": "pkg-hybrid-8",
    "name": "8-Camera Smart Hybrid Light CCTV Package",
    "slug": "8-camera-hybrid-light-package",
    "seriesId": "series-hybrid",
    "seriesName": "Hybrid Light",
    "technologyLabel": "Smart Hybrid Light",
    "description": "8-channel smart dual-light surveillance system with AcuSense motion classification and color deterrence.",
    "cameraCount": 8,
    "cameraCountsSupported": [
      8
    ],
    "basePrice": 47900,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "8x 2MP Smart Hybrid Light Cameras",
      "1x 8-Channel AcuSense DVR Recorder",
      "1x Western Digital Purple 2TB HDD",
      "160m Video Cable with Connectors",
      "1x 12V 10A Central Power Supply",
      "Full Site Configuration Setup"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-hybrid",
    "nightViewName": "Hybrid Light",
    "components": [
      {
        "name": "Dahua 2MP HDCVI Smart Hybrid Light Camera",
        "sku": "prod-dahua-2mp-bullet",
        "qty": 8,
        "unitPrice": 3200,
        "lineTotal": 25600
      },
      {
        "name": "Hikvision 8-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-8ch",
        "qty": 1,
        "unitPrice": 6800,
        "lineTotal": 6800
      },
      {
        "name": "Western Digital Purple 2TB Surveillance HDD",
        "sku": "prod-wd-purple-2tb",
        "qty": 1,
        "unitPrice": 6900,
        "lineTotal": 6900
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 160,
        "unitPrice": 30,
        "lineTotal": 4800
      },
      {
        "name": "12V 10A Central Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 8,
        "unitPrice": 250,
        "lineTotal": 2000
      }
    ]
  },
  {
    "id": "pkg-color-4",
    "name": "4-Camera Full-Color CCTV Package",
    "slug": "4-camera-color-ready-made-package",
    "seriesId": "series-color",
    "seriesName": "Full-Color",
    "technologyLabel": "Hikvision ColorVu",
    "description": "ColorVu technology delivers round-the-clock vivid color imaging even in pitch darkness with F1.0 super-apertures.",
    "cameraCount": 4,
    "cameraCountsSupported": [
      4
    ],
    "basePrice": 29700,
    "isActive": true,
    "isFeatured": true,
    "isDemo": true,
    "inclusions": [
      "4x Hikvision 2MP ColorVu Cameras",
      "1x 4-Channel AcuSense DVR",
      "1x Western Digital Purple 1TB HDD",
      "80m High-Shield Coaxial Cable",
      "1x 12V 5A Centralized Power Supply",
      "BNC & DC Power Connectors"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-color",
    "nightViewName": "Full-Color",
    "components": [
      {
        "name": "Hikvision 2MP ColorVu Audio Bullet Camera",
        "sku": "prod-hik-color-2mp",
        "qty": 4,
        "unitPrice": 3800,
        "lineTotal": 15200
      },
      {
        "name": "Hikvision 4-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-4ch",
        "qty": 1,
        "unitPrice": 4500,
        "lineTotal": 4500
      },
      {
        "name": "Western Digital Purple 1TB Surveillance HDD",
        "sku": "prod-wd-purple-1tb",
        "qty": 1,
        "unitPrice": 4800,
        "lineTotal": 4800
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 80,
        "unitPrice": 30,
        "lineTotal": 2400
      },
      {
        "name": "12V 5A Centralized Regulated Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 4,
        "unitPrice": 250,
        "lineTotal": 1000
      }
    ]
  },
  {
    "id": "pkg-color-8",
    "name": "8-Camera Full-Color CCTV Package",
    "slug": "8-camera-color-ready-made-package",
    "seriesId": "series-color",
    "seriesName": "Full-Color",
    "technologyLabel": "Hikvision ColorVu",
    "badge": "Best Value",
    "description": "Comprehensive 8-camera ColorVu setup providing clear daytime-like color surveillance all night long.",
    "cameraCount": 8,
    "cameraCountsSupported": [
      8
    ],
    "basePrice": 52700,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "8x Hikvision 2MP ColorVu Cameras",
      "1x 8-Channel AcuSense DVR",
      "1x Western Digital Purple 2TB HDD",
      "160m Video Cable with Connectors",
      "1x 12V 10A Central Power Supply",
      "Mounting Brackets & Setup"
    ],
    "systemTypeId": "systype-analogue",
    "systemTypeSlug": "analogue",
    "systemTypeName": "Analogue / HD coaxial cameras (DVR)",
    "nightViewId": "series-color",
    "nightViewName": "Full-Color",
    "components": [
      {
        "name": "Hikvision 2MP ColorVu Audio Bullet Camera",
        "sku": "prod-hik-color-2mp",
        "qty": 8,
        "unitPrice": 3800,
        "lineTotal": 30400
      },
      {
        "name": "Hikvision 8-Channel Turbo HD DVR",
        "sku": "prod-hik-dvr-8ch",
        "qty": 1,
        "unitPrice": 6800,
        "lineTotal": 6800
      },
      {
        "name": "Western Digital Purple 2TB Surveillance HDD",
        "sku": "prod-wd-purple-2tb",
        "qty": 1,
        "unitPrice": 6900,
        "lineTotal": 6900
      },
      {
        "name": "High-Shield Coaxial Video Cable (meters)",
        "sku": "cable-coaxial",
        "qty": 160,
        "unitPrice": 30,
        "lineTotal": 4800
      },
      {
        "name": "12V 10A Central Power Supply",
        "sku": "acc-power",
        "qty": 1,
        "unitPrice": 1800,
        "lineTotal": 1800
      },
      {
        "name": "HD Video Baluns & DC Connectors",
        "sku": "acc-balun",
        "qty": 8,
        "unitPrice": 250,
        "lineTotal": 2000
      }
    ]
  },
  {
    "id": "pkg-wifi-2",
    "name": "2-Camera Wireless Smart Security Package",
    "slug": "2-camera-wireless-package",
    "seriesId": "series-ir",
    "seriesName": "Night Vision (IR)",
    "technologyLabel": "Dual-Band Wi-Fi",
    "description": "Clean Wi-Fi security system with two-way voice communication, cloud/microSD local storage, and instant mobile alerts.",
    "cameraCount": 2,
    "cameraCountsSupported": [
      2
    ],
    "basePrice": 11500,
    "isActive": true,
    "isFeatured": true,
    "featuredOnHomepage": true,
    "isDemo": true,
    "inclusions": [
      "2x 3MP Wireless Smart Cameras",
      "2x 128GB High-Endurance MicroSD Cards",
      "2x 12V 2A Regulated Power Adapters",
      "Mobile Phone App Sync & Setup"
    ],
    "systemTypeId": "systype-wireless",
    "systemTypeSlug": "wireless",
    "systemTypeName": "Wireless / Wi-Fi cameras",
    "nightViewId": "series-ir",
    "nightViewName": "Night Vision (IR)",
    "components": [
      {
        "name": "EZVIZ C6N 3MP Pan & Tilt Smart Wi-Fi Camera",
        "sku": "prod-wifi-c6n",
        "qty": 2,
        "unitPrice": 4200,
        "lineTotal": 8400
      },
      {
        "name": "High-Endurance 128GB MicroSD Card",
        "sku": "acc-microsd-128gb",
        "qty": 2,
        "unitPrice": 1200,
        "lineTotal": 2400
      },
      {
        "name": "12V 2A Regulated DC Power Adapter",
        "sku": "acc-power-adapter",
        "qty": 2,
        "unitPrice": 350,
        "lineTotal": 700
      }
    ]
  },
  {
    "id": "pkg-wifi-4",
    "name": "4-Camera Wireless Smart Security Kit",
    "slug": "4-camera-wireless-smart-kit",
    "seriesId": "series-ir",
    "seriesName": "Night Vision (IR)",
    "technologyLabel": "Wi-Fi 6 Wireless Kit",
    "description": "4-camera wireless surveillance kit featuring dedicated wireless receiver with pre-installed 1TB storage.",
    "cameraCount": 4,
    "cameraCountsSupported": [
      4
    ],
    "basePrice": 39050,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "4x 3MP Weatherproof Wi-Fi Cameras",
      "1x 4-Channel Wireless Smart Base Station",
      "1x Western Digital Purple 1TB Surveillance Storage",
      "4x 12V DC Camera Power Adapters",
      "1x Base Station Power Adapter & HDMI Display Link"
    ],
    "systemTypeId": "systype-wireless",
    "systemTypeSlug": "wireless",
    "systemTypeName": "Wireless / Wi-Fi cameras",
    "nightViewId": "series-ir",
    "nightViewName": "Night Vision (IR)",
    "components": [
      {
        "name": "EZVIZ H3c 2K Color Night Vision Outdoor Wi-Fi Camera",
        "sku": "prod-wifi-h3c",
        "qty": 4,
        "unitPrice": 6500,
        "lineTotal": 26000
      },
      {
        "name": "4-Channel Wireless Smart Base Station",
        "sku": "prod-wifi-base",
        "qty": 1,
        "unitPrice": 6500,
        "lineTotal": 6500
      },
      {
        "name": "Western Digital Purple 1TB Surveillance Storage",
        "sku": "prod-wd-purple-1tb",
        "qty": 1,
        "unitPrice": 4800,
        "lineTotal": 4800
      },
      {
        "name": "12V DC Camera Power Adapter",
        "sku": "acc-power-adapter",
        "qty": 4,
        "unitPrice": 350,
        "lineTotal": 1400
      },
      {
        "name": "Base Station Power Adapter & HDMI Display Link",
        "sku": "acc-power-adapter",
        "qty": 1,
        "unitPrice": 350,
        "lineTotal": 350
      }
    ]
  },
  {
    "id": "pkg-ptz-16",
    "name": "16-Camera Enterprise PTZ Complete Solution",
    "slug": "16-camera-enterprise-ptz-package",
    "seriesId": "series-enterprise",
    "seriesName": "Enterprise & PTZ",
    "technologyLabel": "Speed Dome PTZ & PoE",
    "badge": "Top Tier",
    "description": "Integrated 16-camera enterprise IP surveillance featuring a 360° optical zoom PTZ camera and Gigabit PoE switching.",
    "cameraCount": 16,
    "cameraCountsSupported": [
      16
    ],
    "basePrice": null,
    "isActive": true,
    "isFeatured": true,
    "featuredOnHomepage": true,
    "isDemo": true,
    "inclusions": [
      "1x 4MP 25x Optical Zoom Speed Dome PTZ",
      "15x 4K IP Fixed Turret Cameras",
      "1x 16-Channel 4K Network Video Recorder (NVR)",
      "1x 24-Port Gigabit PoE Switch",
      "1x 6TB Enterprise Surveillance HDD",
      "Cat6 Structured Network Cabling"
    ],
    "systemTypeId": "systype-ip",
    "systemTypeSlug": "ip",
    "systemTypeName": "IP / Network cameras (NVR, PoE)",
    "nightViewId": "series-enterprise",
    "nightViewName": "Enterprise & PTZ",
    "components": [
      {
        "name": "Hikvision 2MP 4-Inch Speed Dome Mini PTZ Camera",
        "sku": "prod-hik-ptz-2mp",
        "qty": 1,
        "unitPrice": 28500,
        "lineTotal": 28500
      },
      {
        "name": "Hikvision 8MP 4K Ultra HD Outdoor IR Bullet Camera",
        "sku": "prod-hik-4k-bullet",
        "qty": 15,
        "unitPrice": 8500,
        "lineTotal": 127500
      },
      {
        "name": "Hikvision 16-Channel 4K NVR",
        "sku": "prod-hik-nvr-16ch",
        "qty": 1,
        "unitPrice": 18500,
        "lineTotal": 18500
      },
      {
        "name": "Ruijie Reyee 24-Port Gigabit Smart Cloud PoE Switch",
        "sku": "prod-ruijie-es224gc-p",
        "qty": 1,
        "unitPrice": 24500,
        "lineTotal": 24500
      },
      {
        "name": "6TB Enterprise Surveillance HDD",
        "sku": "prod-hdd-6tb",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "Cat6 Structured Network Cabling",
        "sku": "cable-cat6-struct",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      }
    ],
    "isQuoteOnly": true
  },
  {
    "id": "pkg-ent-32",
    "name": "32-Camera Enterprise Campus Security Setup",
    "slug": "32-camera-enterprise-campus-setup",
    "seriesId": "series-enterprise",
    "seriesName": "Enterprise & PTZ",
    "technologyLabel": "Multi-NVR High Capacity",
    "description": "High-density 32-camera IP surveillance infrastructure designed for commercial buildings, factories, and campuses.",
    "cameraCount": 32,
    "cameraCountsSupported": [
      32
    ],
    "isQuoteOnly": true,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "32x 4K AI Enterprise IP Cameras",
      "1x 32-Channel Enterprise NVR Array",
      "2x 16-Port Gigabit Managed PoE Switches",
      "2x 6TB Enterprise Surveillance HDDs",
      "Cat6 STP Shielded Cabling Infrastructure",
      "Rackmount Cabinet & PDU System"
    ],
    "systemTypeId": "systype-ip",
    "systemTypeSlug": "ip",
    "systemTypeName": "IP / Network cameras (NVR, PoE)",
    "nightViewId": "series-enterprise",
    "nightViewName": "Enterprise & PTZ",
    "basePrice": null,
    "components": [
      {
        "name": "4K AI Enterprise IP Camera",
        "sku": "prod-ip-4k-ai",
        "qty": 32,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "32-Channel Enterprise NVR Array",
        "sku": "prod-nvr-32ch-arr",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "16-Port Gigabit Managed PoE Switch",
        "sku": "prod-sw-16p-poe",
        "qty": 2,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "6TB Enterprise Surveillance HDD",
        "sku": "prod-hdd-6tb",
        "qty": 2,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "Cat6 STP Shielded Cabling Infrastructure",
        "sku": "cable-cat6-stp",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "Rackmount Cabinet & PDU System",
        "sku": "acc-rack-pdu",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      }
    ]
  },
  {
    "id": "pkg-ent-64",
    "name": "64-Camera High-Density Facility Surveillance",
    "slug": "64-camera-high-density-facility",
    "seriesId": "series-enterprise",
    "seriesName": "Enterprise & PTZ",
    "technologyLabel": "Multi-Server NVR Cluster",
    "description": "Enterprise 64-camera security setup with multi-server NVR redundancy and optical fiber backbone.",
    "cameraCount": 64,
    "cameraCountsSupported": [
      64
    ],
    "isQuoteOnly": true,
    "isActive": true,
    "isFeatured": false,
    "isDemo": true,
    "inclusions": [
      "64x 4K AI Enterprise IP Cameras",
      "2x 32-Channel Redundant Enterprise NVRs",
      "4x 24-Port Managed Gigabit PoE Switches",
      "4x 6TB Enterprise Surveillance HDDs",
      "Optical Fiber Backbone Transceivers",
      "Centralized Monitoring Console Rack"
    ],
    "systemTypeId": "systype-ip",
    "systemTypeSlug": "ip",
    "systemTypeName": "IP / Network cameras (NVR, PoE)",
    "nightViewId": "series-enterprise",
    "nightViewName": "Enterprise & PTZ",
    "basePrice": null,
    "components": [
      {
        "name": "4K AI Enterprise IP Camera",
        "sku": "prod-ip-4k-ai",
        "qty": 64,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "32-Channel Redundant Enterprise NVR",
        "sku": "prod-nvr-32ch-arr",
        "qty": 2,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "24-Port Managed Gigabit PoE Switch",
        "sku": "prod-sw-24p-poe",
        "qty": 4,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "6TB Enterprise Surveillance HDD",
        "sku": "prod-hdd-6tb",
        "qty": 4,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "Optical Fiber Backbone Transceiver",
        "sku": "acc-fiber-tx",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      },
      {
        "name": "Centralized Monitoring Console Rack",
        "sku": "acc-console-rack",
        "qty": 1,
        "unitPrice": null,
        "lineTotal": null
      }
    ]
  }
];

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'How to Choose Between Analog HD and IP Surveillance in Bangladesh',
    slug: 'analog-hd-vs-ip-surveillance-bangladesh',
    author: 'CamneX Technical Team',
    publishedAt: '2026-02-10',
    excerpt: 'An objective engineering breakdown comparing cost, cable distance, image clarity, and long-term expandability.',
    content: '<p>When planning a surveillance setup in Dhaka, property owners frequently balance budget constraints against technical longevity. Analog HD (Turbo HD / HD-TVI) remains cost-effective for 2 to 8 camera residential layouts, whereas IP PoE solutions provide unmatched scalability and analytics for multi-story corporate facilities...</p>',
    featuredImage: '/images/products/hikvision-bullet.svg',
    tags: ['CCTV', 'Hikvision', 'Installation Guide'],
    readTime: '4 min read',
    isDemo: true
  }
];

export const INITIAL_PROJECTS: ProjectCaseStudy[] = [];

export const INITIAL_TESTIMONIALS: Testimonial[] = [];

export const INITIAL_FAQS: FaqItem[] = [
  // 1. Products & Compatibility
  {
    id: 'faq-pc-1',
    category: 'Products & Compatibility',
    question: 'How do I choose a suitable CCTV system for my home or business?',
    answer: 'Choosing a surveillance system depends on your coverage area, lighting conditions, and resolution needs. For homes and small retail shops in Dhaka, 2MP to 5MP smart-hybrid light cameras provide crisp day and night color imaging. For corporate offices, multi-story buildings, and large facilities, IP systems with Power over Ethernet (PoE) and high-capacity NVRs deliver superior scalability and structured cabling simplicity. You can also use our interactive Custom CCTV Package Builder on camnexbd.com to calculate camera counts and storage automatically.',
    order: 1
  },
  {
    id: 'faq-pc-2',
    category: 'Products & Compatibility',
    question: 'What is the difference between analogue HD and IP cameras?',
    answer: 'Analogue HD cameras (Turbo HD / HD-TVI) transmit analog signals through coaxial cables to a central DVR. They are budget-friendly and well-suited for upgrades in buildings with existing coaxial wiring. IP cameras process and digitize footage directly on the camera, transmitting high-definition digital streams over standard Cat6 network cables to an NVR or PoE switch. IP cameras support advanced edge intelligence (such as human and vehicle motion detection) and flexible network topologies.',
    order: 2
  },
  {
    id: 'faq-pc-3',
    category: 'Products & Compatibility',
    question: 'Can I mix cameras from different brands on the same NVR or DVR?',
    answer: 'Yes, provided the devices support the ONVIF open standard protocol. However, manufacturer-specific features like proprietary smart motion filtering (AcuSense), two-way audio talk, and direct firmware updates work most reliably when using matching brand hardware (such as Hikvision cameras with Hikvision NVRs, or Dahua cameras with Dahua recorders).',
    order: 3
  },

  // 2. CCTV & Surveillance Systems
  {
    id: 'faq-cctv-1',
    category: 'CCTV & Surveillance Systems',
    question: 'Can I view surveillance streams on my smartphone outside Bangladesh?',
    answer: 'Yes. Every Hikvision and Dahua recorder supplied by CamneX supports encrypted cloud P2P (Hik-Connect or DMSS). Our engineering team sets up the mobile viewing application directly on your smartphone and computer during installation, enabling secure live monitoring and playback review globally without requiring an expensive static IP.',
    order: 4
  },
  {
    id: 'faq-cctv-2',
    category: 'CCTV & Surveillance Systems',
    question: 'How much hard drive storage do I need for 4, 8, or 16 cameras?',
    answer: 'Storage requirements depend on recording mode (continuous 24/7 vs. smart motion-triggered), camera resolution, and video compression (H.265+). Typically, a 4-camera 2MP system with H.265+ uses approximately 1TB to 2TB for 15 to 30 days of storage. An 8-camera setup generally requires 2TB to 4TB, and 16 cameras require 4TB to 8TB enterprise-grade surveillance hard drives (Western Digital Purple or Seagate SkyHawk).',
    order: 5
  },
  {
    id: 'faq-cctv-3',
    category: 'CCTV & Surveillance Systems',
    question: 'What happens to the surveillance system during power outages or load shedding?',
    answer: 'Standard CCTV systems require continuous electricity. To maintain uninterrupted surveillance during load shedding in Dhaka, we recommend connecting the NVR/DVR and camera power supplies to an online UPS or dedicated inverter power backup with surge suppression.',
    order: 6
  },

  // 3. Networking & Wi-Fi
  {
    id: 'faq-net-1',
    category: 'Networking & Wi-Fi',
    question: 'What is the difference between a PoE Switch and a regular network switch?',
    answer: 'A Power over Ethernet (PoE) switch delivers both high-speed data connectivity and electrical power over a single Cat6 ethernet cable. This eliminates the need to run separate 220V electrical wiring or power adapters to each camera or Wi-Fi access point, significantly simplifying installation and enhancing reliability.',
    order: 7
  },
  {
    id: 'faq-net-2',
    category: 'Networking & Wi-Fi',
    question: 'Do you configure enterprise Wi-Fi 6 access points with seamless roaming?',
    answer: 'Yes. CamneX installs and provisions enterprise ceiling and wall-mount Wi-Fi 6 access points (such as Ruijie Reyee) with hardware or cloud controller management. This enables 802.11k/v/r fast roaming across multi-story residences and corporate offices under a unified SSID.',
    order: 8
  },

  // 4. Installation & Site Surveys
  {
    id: 'faq-inst-1',
    category: 'Installation & Site Surveys',
    question: 'Can I request a site survey before installation?',
    answer: 'Yes. CamneX provides on-site engineering surveys across Dhaka. A qualified technician will inspect your physical layout, measure cable distances, assess indoor/outdoor camera mounting angles, and formulate an accurate Bill of Materials (BOM) before you commit to an order.',
    order: 9
  },
  {
    id: 'faq-inst-2',
    category: 'Installation & Site Surveys',
    question: 'What cabling and conduits are used during physical installation?',
    answer: 'We strictly adhere to engineering standards. We use genuine copper Cat6 network cables or solid-core coaxial cables, protected by heavy-duty PVC conduits or interior casing/trunking. All outdoor junctions use waterproof boxes with secure connectors to prevent weather damage and humidity degradation.',
    order: 10
  },
  {
    id: 'faq-inst-3',
    category: 'Installation & Site Surveys',
    question: 'How long does a typical 4 to 8 camera installation take in Dhaka?',
    answer: 'For a standard 4-camera residential or retail installation, deployment typically completes within 4 to 6 hours. An 8-camera setup usually requires 1 full working day, depending on cable pathway complexity, wall drilling requirements, and ceiling accessibility.',
    order: 11
  },

  // 5. Orders & Payments
  {
    id: 'faq-ord-1',
    category: 'Orders & Payments',
    question: 'What payment methods are supported for orders?',
    answer: 'CamneX Bangladesh supports Cash on Delivery (COD) for hardware orders in eligible Dhaka areas, manual mobile financial services (bKash and Nagad Send Money verification), and Corporate Bank Transfer for commercial projects. In-person payment is also welcome at our Chandrima Model Town engineering center.',
    order: 12
  },
  {
    id: 'faq-ord-2',
    category: 'Orders & Payments',
    question: 'Is Cash on Delivery (COD) available outside Dhaka?',
    answer: 'For orders outside Dhaka, we deliver via standard courier services (such as SA Paribahan or Sundarban Courier). Courier policy generally requires courier condition payment upon parcel collection or advance booking verification.',
    order: 13
  },
  {
    id: 'faq-ord-3',
    category: 'Orders & Payments',
    question: 'How do I track an order?',
    answer: 'You can track the fulfillment and dispatch status of your order anytime via our Track Order page (/tracking). Simply input your order reference number (e.g. CNX-ORD-...) along with the phone number provided during checkout.',
    order: 14
  },

  // 6. Warranty & After-Sales Support
  {
    id: 'faq-war-1',
    category: 'Warranty & After-Sales Support',
    question: 'How do I check product warranty coverage?',
    answer: 'Every genuine product supplied by CamneX features official manufacturer serial numbers verifiable with authorized distributor channels. Your warranty duration is specified on your official sales invoice and quotation documentation. For full details on coverage and claims, visit our Warranty Policy page (/warranty).',
    order: 15
  },
  {
    id: 'faq-war-2',
    category: 'Warranty & After-Sales Support',
    question: 'How can I contact technical support?',
    answer: 'Our dedicated engineering support desk can be reached via phone at +880 1540-535150, secondary support line +880 1410-085848, WhatsApp at 8801540535150, or email at support@camnexbd.com. Support hours are Saturday through Thursday from 9:30 AM to 7:30 PM, with Friday on-call support for corporate enterprise clients.',
    order: 16
  },
  {
    id: 'faq-war-3',
    category: 'Warranty & After-Sales Support',
    question: 'Are all Hikvision and ZKTeco products 100% genuine?',
    answer: 'Yes. CamneX Bangladesh is an authorized partner and installer. We source exclusively from official brand distribution channels with intact manufacturer packaging, original serial numbers, and genuine warranty registration.',
    order: 17
  },

  // 7. Quotations & Packages
  {
    id: 'faq-qp-1',
    category: 'Quotations & Packages',
    question: 'How can I request a quotation?',
    answer: 'You can submit a formal quotation request online via our Request Quotation page (/quote) or by emailing sales@camnexbd.com with your site requirements. Our engineering team will review your specifications and provide a structured Bill of Materials with transparent line-item pricing.',
    order: 18
  },
  {
    id: 'faq-qp-2',
    category: 'Quotations & Packages',
    question: 'Can I customize the camera count and accessories in pre-configured packages?',
    answer: 'Yes. Our online Package Builder (/package-builder) allows you to select custom combinations of indoor dome cameras, outdoor bullet cameras, storage hard drives, PoE switches, and cabling lengths tailored precisely to your premises.',
    order: 19
  }
];

// ----------------------------------------------------------------------------
// Initial Hero Slides (Phase 1 Master Slider Seeds)
// ----------------------------------------------------------------------------
export const INITIAL_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'Hikvision 4K Smart Hybrid Bullet (Mode 1 - Manual Demo)',
    enabled: true,
    order: 1,
    sourceMode: 'manual',
    badge: 'New',
    headline: 'Hikvision Smart Hybrid Light 4K Bullet',
    description: 'Enterprise 4K Ultra HD surveillance featuring dual smart lighting, AcuSense AI vehicle classification, and IP67 weather-sealed all-metal housing.',
    image: '/images/hero/hikvision-bullet.png',
    priceText: '৳4,850',
    buttonText: 'View Product',
    buttonLink: '/product/prod-hik-irpf-2mp',
    secondaryText: 'Request quotation',
    secondaryLink: '/quote',
    highlights: [
      { icon: 'camera', value: '4K Ultra HD', label: 'Resolution' },
      { icon: 'eye', value: '40m Dual-Light', label: 'Smart Hybrid IR' },
      { icon: 'shield', value: 'IP67 Rating', label: 'Weatherproof' },
      { icon: 'cpu', value: 'AcuSense AI', label: 'Human & Vehicle' }
    ]
  },
  {
    id: 'slide-2',
    title: 'Ruijie Wi-Fi 6 AP (Mode 2 - Live Product Demo)',
    enabled: true,
    order: 2,
    sourceMode: 'product',
    productId: 'prod-rui-rap2200e',
    badge: 'Featured',
    image: '/images/hero/ruijie-wifi6.png',
    buttonText: 'View Product',
    buttonLink: '/product/prod-rui-rap2200e',
    secondaryText: 'Add to cart',
    secondaryLink: '/cart'
  },
  {
    id: 'slide-3',
    title: 'Enterprise Hardware Collection (Mode 3 - Auto Collection Demo)',
    enabled: true,
    order: 3,
    sourceMode: 'collection',
    collectionRule: 'featured',
    collectionCount: 3
  }
];

export const DEFAULT_SCENARIOS: ScenarioItem[] = [
  {
    id: 'scen-home',
    slug: 'home-residence',
    title: 'Home & Residential',
    description: 'Discreet indoor and outdoor surveillance with smartphone live view and perimeter tripwire alerts.',
    iconName: 'Home',
    scale: '1–4 Rooms / Duplex Residences',
    cablingStandard: 'Concealed Rigid PVC Conduit with Weatherproof Boxes',
    networkType: 'Hik-Connect Cloud P2P Streaming with Multi-Device Access',
    highlights: ['2–4 Cameras', 'Night Vision & Audio', 'Mobile Live View', 'Concealed PVC Wiring'],
    requirements: [
      'Perimeter Entryway Coverage: High-definition weather-sealed cameras monitoring the main entrance door, driveway gate, and boundary walls.',
      'Night Vision & Low-Light Clarity: 24/7 night vision (Smart Hybrid or ColorVu) ensuring clear facial identification in low residential illumination.',
      'Smartphone Remote Streaming: Encrypted mobile viewing on iOS and Android via Hik-Connect with push alerts upon boundary tripwire detection.',
      'Privacy Masking & Family Sharing: Digital privacy masking over neighbor balconies and interior bedrooms with individual login permissions for household members.'
    ],
    engineeringStandards: [
      'Wiring Concealment: Cables routed inside heavy-gauge surface PVC casing channels matching wall finishes to maintain interior decor aesthetics.',
      'Weatherproof Enclosures: All exterior camera cable joints housed in IP66 sealed terminal base boxes to prevent moisture seepage during monsoon rain.',
      'Power Regulation: Central switching power adapter equipped with transient surge protection against Dhaka electrical grid fluctuations.',
      'End-User Onboarding: Full on-site assistance configuring the mobile app on all family smartphones and setting up video playback retrieval.'
    ],
    recommendedCategories: ['cctv-cameras', 'wifi-smart-devices', 'recorders'],
    recommendedPackages: ['2-camera-night-vision-package', '4-camera-night-vision-package', '2-camera-wireless-package'],
    recommendedProducts: ['prod-hik-irpf-2mp', 'prod-hik-dome-2mp', 'prod-wifi-db2', 'prod-wd-purple-1tb'],
    enabled: true,
    order: 1
  },
  {
    id: 'scen-office',
    slug: 'corporate-office',
    title: 'Corporate Office',
    description: 'Time attendance biometrics, seamless Wi-Fi 6 roaming, and central server rack networking.',
    iconName: 'Building2',
    scale: '20–150 Workstations / Multi-Room Floor',
    cablingStandard: 'Cat6 100% Solid Copper Structured Trunking in False Ceiling',
    networkType: 'VLAN Segregated Corporate & Guest Wi-Fi 6 with Cloud Management',
    highlights: ['Biometric Attendance', 'Wi-Fi 6 Roaming', 'Smart Cloud PoE', 'VLAN Isolation'],
    requirements: [
      'Biometric Time Attendance: Fingerprint and visible-light facial recognition terminals with automated monthly attendance logs exportable to payroll systems.',
      'Enterprise Wi-Fi 6 Roaming: Ceiling-mount dual-band access points supporting 802.11k/v/r fast roaming to eliminate dropped Zoom and VoIP calls across cubicles.',
      'Reception Access Control: Fail-safe 280kg magnetic locks, push-to-exit buttons, and emergency break-glass integration for main glass doors.',
      'Discreet Conference Coverage: High-definition indoor audio turret dome cameras positioned in reception and common conference zones.'
    ],
    engineeringStandards: [
      'Structured Cabling: 100% solid copper 23AWG Cat6 cables neatly dressed inside flexible conduit above acoustic ceiling tiles.',
      'Network Rack Integration: 19" wall-mount or floor server rack termination with numbered patch panels and standardized cable management fingers.',
      'Network Segmentation: Managed switches configured with dedicated VLANs isolating employee workstations, surveillance cameras, and guest Wi-Fi.',
      'Power Redundancy: Online UPS sizing calculation ensuring access control and networking equipment remain energized during local outages.'
    ],
    recommendedCategories: ['biometrics-access-control', 'access-points-wifi', 'network-switches'],
    recommendedPackages: ['4-camera-night-vision-package', '8-camera-night-vision-package'],
    recommendedProducts: ['prod-zkteco-mb20', 'prod-zkteco-em-lock', 'prod-ruijie-rap2260g', 'prod-ruijie-es209gc-p'],
    enabled: true,
    order: 2
  },
  {
    id: 'scen-retail',
    slug: 'shop-retail',
    title: 'Shop & Retail Store',
    description: 'Cash counter dome zoom, customer footfall monitoring, and concealed PVC channel wiring.',
    iconName: 'ShoppingBag',
    scale: 'Single Store / Boutique / Supermarket Aisle',
    cablingStandard: 'Surface Channel PVC Casing with Lockable Equipment Enclosure',
    networkType: 'Local HD DVR Output to Cashier Monitor + Smartphone Remote Sync',
    highlights: ['Cash Counter Zoom', 'Audio Recording', 'Loss Prevention', 'Local Deterrence Monitor'],
    requirements: [
      'Point-of-Sale Register Zoom: Turret cameras mounted directly over cash registers and POS counters with built-in microphone for customer interaction clarity.',
      'Aisle Loss Prevention: 2.8mm wide-angle lenses covering retail aisles to prevent stock shrinkage, blind spots, and customer disputes.',
      'Entrance Footfall Monitoring: ColorVu full-color bullet camera capturing crisp entrance facial features under changing outdoor lighting.',
      'In-Store Deterrence Display: Direct HDMI connection to a public-view monitor mounted near checkout to visibly deter theft.'
    ],
    engineeringStandards: [
      'Glare Avoidance: Camera positioning calibrated to avoid harsh reflections from overhead store spotlights, display glass, and POS terminal screens.',
      'Physical Security: DVR and power supplies mounted inside a locked, ventilated security box to prevent physical tampering or theft of recordings.',
      'Audio Calibration: Microphone sensitivity adjusted to capture transaction dialogue while filtering ambient shopping mall or street noise.',
      'Business Owner Remote Sync: Remote viewing app configured with low-bandwidth sub-stream mode for smooth live inspection on 4G mobile networks.'
    ],
    recommendedCategories: ['cctv-cameras', 'recorders', 'cables-accessories'],
    recommendedPackages: ['4-camera-color-ready-made-package', '4-camera-night-vision-package'],
    recommendedProducts: ['prod-hik-dome-2mp', 'prod-hik-color-2mp', 'prod-hik-dvr-4ch', 'prod-wd-purple-2tb'],
    enabled: true,
    order: 3
  },
  {
    id: 'scen-factory',
    slug: 'factory-warehouse',
    title: 'Factory & Warehouse',
    description: 'High-mount 4K optical zoom, weatherproof IP67 enclosures, and long-range fiber / PoE switches.',
    iconName: 'Factory',
    scale: '10,000+ sq ft Production Floor & Perimeter',
    cablingStandard: 'Galvanized Iron (GI) Conduit & Heavy-Gauge Industrial Ducting',
    networkType: 'Gigabit PoE Network with Extended 250m Transmission & Surge Suppression',
    highlights: ['4K Ultra HD', '250m Long-Range PoE', 'IP67 Weatherproof', 'Multi-TB Storage'],
    requirements: [
      'High-Elevation 4K Surveillance: 8MP Ultra HD cameras with 80m infrared illumination and optical zoom mounted on warehouse ceiling trusses.',
      'Loading Bay & Perimeter Security: Heavy-duty IP67 bullet cameras guarding truck loading docks, container yards, and facility perimeter fences.',
      'Long-Distance Network Uplinks: Cloud-managed PoE switches operating in extended transmission mode up to 250m or fiber-optic backbone runs.',
      'High-Throughput Recording: 16-channel or 32-channel network video recorders with Western Digital Purple / Seagate SkyHawk multi-drive RAID storage.'
    ],
    engineeringStandards: [
      'Industrial Physical Protection: Cables enclosed in heavy-duty galvanized iron (GI) piping to withstand forklift impact, mechanical vibration, and rodents.',
      'Electrical Noise Immunity: Data lines routed with minimum 300mm clearance from high-voltage manufacturing power cables to eliminate electromagnetic interference.',
      'Surge & Lightning Protection: Dedicated DIN-rail grounding and surge arrestors installed at main electrical distribution boards.',
      'Scissor-Lift Elevated Mounting: Rigid steel beam mounting clamps and IP66 heavy-duty junction boxes sealed against manufacturing dust and moisture.'
    ],
    recommendedCategories: ['cctv-cameras', 'network-switches', 'surveillance-storage'],
    recommendedPackages: ['8-camera-night-vision-package', '16-camera-night-vision-package'],
    recommendedProducts: ['prod-hik-4k-bullet', 'prod-hik-ptz-2mp', 'prod-ruijie-es224gc-p', 'prod-st-skyhawk-4tb'],
    enabled: true,
    order: 4
  },
  {
    id: 'scen-school',
    slug: 'school-institute',
    title: 'School & Institute',
    description: 'Corridor surveillance, staff biometric check-in, and campus Wi-Fi infrastructure.',
    iconName: 'GraduationCap',
    scale: 'Multi-Floor Campus / Academic Building',
    cablingStandard: 'Tamper-Proof Heavy Conduit across Hallways & Courtyard Bridges',
    networkType: 'Central Security Console with NVR Multi-Screen Split & Staff Wi-Fi',
    highlights: ['Corridor & Gate Safety', 'Fast Face Attendance', 'Campus Wi-Fi', 'Central Guard Console'],
    requirements: [
      'Campus Gate & Perimeter Safety: High-visibility deterrent cameras with active siren / strobe light warning capabilities along exterior boundary walls.',
      'Vandal-Resistant Corridor Coverage: IK10 impact-rated dome cameras positioned in hallways, stairwells, cafeteria, and sports grounds.',
      'Contactless Faculty Attendance: ZKTeco visible-light facial recognition terminals enabling fast, hygienic morning check-in for teachers and administrative staff.',
      'Central Security Station: Multi-screen NVR command console situated in the guard room for real-time monitoring and rapid incident timestamping.'
    ],
    engineeringStandards: [
      'Tamper-Proof Hardware: High-tensile security screws and flush-mount vandal dome housings positioned above student reach.',
      'Student Privacy Masking: Digital camera blackout zones configured to strictly prohibit lens visibility into restrooms, locker rooms, or counseling offices.',
      'Inter-Building Network Links: UV-stabilized outdoor Cat6 cable or armored fiber cabling bridging academic wings, administration buildings, and main gates.',
      'Administrative Staff Training: Hands-on guidance for administrative personnel on clip bookmarking, password rotation, and evidence export.'
    ],
    recommendedCategories: ['cctv-cameras', 'biometrics-access-control', 'access-points-wifi'],
    recommendedPackages: ['8-camera-night-vision-package', '16-camera-night-vision-package'],
    recommendedProducts: ['prod-zkteco-speedface-v5l', 'prod-hik-dome-2mp', 'prod-hik-nvr-8ch-poe', 'prod-ruijie-rap2200e'],
    enabled: true,
    order: 5
  }
];


