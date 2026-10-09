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
  CtaReassuranceItem
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
    title: 'Configuration & Deployment',
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
  secondaryEmail: 'camnexbd@gmail.com',
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
    'Network deployment',
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
      { label: 'Solutions', route: 'solutions' },
      { label: 'Services', route: 'services' },
      { label: 'Installations', route: 'projects' },
      { label: 'About Us', route: 'about' },
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
    newsletterText: 'Subscribe for engineering updates, new product releases, and security advisories.',
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
  privacyPolicyText: ''
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
      description: 'Speak directly with a certified security consultant',
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
  { id: 'sec-new', type: 'new_arrivals', title: 'New Arrivals', enabled: true, order: 6 },
  { id: 'sec-pkgs', type: 'packages', title: 'CCTV Packages Selector', enabled: true, order: 7 },
  { id: 'sec-solutions', type: 'solutions', title: 'Our Solutions', enabled: true, order: 8 },
  { id: 'sec-services', type: 'services', title: 'Quick Service Request', enabled: true, order: 9 },
  { id: 'sec-trending', type: 'trending', title: 'Trending Hardware', enabled: true, order: 10 },
  { id: 'sec-cat-cctv', type: 'category_row', title: 'CCTV Cameras', categorySlug: 'cctv-cameras', enabled: true, order: 11 },
  { id: 'sec-cat-access', type: 'category_row', title: 'Access Control & Biometrics', categorySlug: 'biometrics-access-control', enabled: true, order: 12 },
  { id: 'sec-cat-recorders', type: 'category_row', title: 'DVR & NVR Recorders', categorySlug: 'dvr-nvr-recorders', enabled: true, order: 13 },
  { id: 'sec-cat-net', type: 'category_row', title: 'Network Equipment & Wi-Fi', categorySlug: 'network-switches', enabled: true, order: 14 },
  { id: 'sec-testimonials', type: 'testimonials', title: 'Client Feedback', enabled: true, order: 15 },
  { id: 'sec-projects', type: 'projects', title: 'Recent Installation Projects', enabled: true, order: 16 },
  {
    id: 'sec-cta',
    type: 'quote_cta',
    title: 'Need Help Choosing the Right Security Solution?',
    enabled: true,
    order: 17,
    ctaData: INITIAL_CTA_DATA
  }
];

export const INITIAL_SPEC_TEMPLATES: SpecTemplate[] = [
  {
    id: 'tpl-cctv',
    name: 'CCTV Camera',
    categorySlug: 'cctv-cameras',
    fields: [
      { id: 'f-res', name: 'Resolution', key: 'resolution', type: 'enum', options: ['2MP (1080p)', '4MP (2K)', '5MP Super HD', '8MP (4K)'], filterable: true, comparable: true, showInHighlights: true, order: 1 },
      { id: 'f-form', name: 'Form Factor', key: 'form_factor', type: 'enum', options: ['Bullet', 'Dome', 'Turret', 'PTZ'], filterable: true, comparable: true, order: 2 },
      { id: 'f-nv', name: 'Night Vision', key: 'night_vision', type: 'enum', options: ['IR Night Vision (up to 20m)', 'IR Night Vision (up to 40m)', 'ColorVu 24/7 Full Color', 'Smart Hybrid Light'], filterable: true, comparable: true, showInHighlights: true, order: 3 },
      { id: 'f-lens', name: 'Lens', key: 'lens', type: 'enum', options: ['2.8mm (Wide Angle)', '3.6mm (Standard)', '6mm (Long Range)', 'Motorized Varifocal'], filterable: true, comparable: true, showInHighlights: true, order: 4 },
      { id: 'f-ip', name: 'Ingress Protection', key: 'ip_rating', type: 'enum', options: ['IP66 Weatherproof', 'IP67 Weatherproof', 'Indoor Use'], filterable: true, comparable: true, showInHighlights: true, order: 5 },
      { id: 'f-aud', name: 'Audio Support', key: 'audio_support', type: 'boolean', filterable: true, comparable: true, order: 6 }
    ]
  },
  {
    id: 'tpl-dvr',
    name: 'NVR / DVR Recorder',
    categorySlug: 'dvr-nvr-recorders',
    fields: [
      { id: 'f-ch', name: 'Channels', key: 'channels', type: 'enum', options: ['4 Channels', '8 Channels', '16 Channels', '32 Channels'], filterable: true, comparable: true, showInHighlights: true, order: 1 },
      { id: 'f-tech', name: 'Technology', key: 'technology', type: 'enum', options: ['Turbo HD / HD-TVI', 'IP / NVR', 'Hybrid (AcuSense)'], filterable: true, comparable: true, showInHighlights: true, order: 2 },
      { id: 'f-hdd', name: 'Max HDD Capacity', key: 'max_hdd_capacity', type: 'unit', unit: 'TB', filterable: false, comparable: true, showInHighlights: true, order: 3 },
      { id: 'f-comp', name: 'Compression', key: 'compression', type: 'text', filterable: false, comparable: true, showInHighlights: true, order: 4 }
    ]
  },
  {
    id: 'tpl-switch',
    name: 'Network Switch',
    categorySlug: 'network-switches',
    fields: [
      { id: 'f-ports', name: 'Port Count', key: 'port_count', type: 'enum', options: ['5 Ports', '8 Ports', '16 Ports', '24 Ports'], filterable: true, comparable: true, showInHighlights: true, order: 1 },
      { id: 'f-poe', name: 'PoE Support', key: 'poe_support', type: 'boolean', filterable: true, comparable: true, showInHighlights: true, order: 2 },
      { id: 'f-poebudget', name: 'PoE Power Budget', key: 'poe_budget', type: 'unit', unit: 'W', filterable: false, comparable: true, showInHighlights: true, order: 3 },
      { id: 'f-mgmt', name: 'Management', key: 'management_type', type: 'enum', options: ['Unmanaged', 'Smart Cloud Managed', 'L2/L3 Managed'], filterable: true, comparable: true, showInHighlights: true, order: 4 }
    ]
  },
  {
    id: 'tpl-wifi',
    name: 'Access Point & Wi-Fi',
    categorySlug: 'access-points-wifi',
    fields: [
      { id: 'f-wifistd', name: 'Wi-Fi Standard', key: 'wifi_standard', type: 'enum', options: ['Wi-Fi 5 (802.11ac)', 'Wi-Fi 6 (802.11ax)'], filterable: true, comparable: true, showInHighlights: true, order: 1 },
      { id: 'f-speed', name: 'Throughput', key: 'max_speed', type: 'unit', unit: 'Mbps', filterable: false, comparable: true, showInHighlights: true, order: 2 },
      { id: 'f-mount', name: 'Mounting', key: 'mount_type', type: 'enum', options: ['Ceiling / Wall Mount', 'Outdoor Pole Mount', 'Desktop'], filterable: true, comparable: true, showInHighlights: true, order: 3 }
    ]
  },
  {
    id: 'tpl-biometric',
    name: 'Biometric & Access Control',
    categorySlug: 'biometrics-access-control',
    fields: [
      { id: 'f-bio', name: 'Biometric Type', key: 'biometric_type', type: 'enum', options: ['Face Recognition + Fingerprint', 'Fingerprint + RFID Card', 'RFID Only'], filterable: true, comparable: true, showInHighlights: true, order: 1 },
      { id: 'f-usercap', name: 'User Capacity', key: 'user_capacity', type: 'number', filterable: false, comparable: true, showInHighlights: true, order: 2 },
      { id: 'f-conn', name: 'Connectivity', key: 'connectivity', type: 'enum', options: ['TCP/IP + Wi-Fi', 'TCP/IP + USB', 'Standalone'], filterable: true, comparable: true, showInHighlights: true, order: 3 }
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
    name: 'Access Points & Wi-Fi',
    slug: 'access-points-wifi',
    description: 'Ceiling and outdoor enterprise Wi-Fi 6 access points with seamless roaming.',
    image: '/images/products/ruijie-wifi.svg',
    specTemplateId: 'tpl-wifi',
    featured: true,
    showOnHomepage: true,
    displayOrder: 6,
    order: 6
  },
  {
    id: 'cat-storage',
    name: 'Surveillance Storage',
    slug: 'surveillance-storage',
    description: 'Western Digital Purple and Seagate SkyHawk 24/7 surveillance hard drives.',
    image: '/images/products/surveillance-hdd.svg',
    specTemplateId: 'tpl-generic',
    featured: true,
    showOnHomepage: true,
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
    displayOrder: 10,
    order: 10
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-hik-irpf-2mp',
    name: 'Hikvision 2MP Outdoor Bullet Camera',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-2CE1AD0T-IRPF',
    sku: 'HIK-CAM-IRPF-2MP',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: [
      '/images/products/hikvision-bullet.svg'
    ],
    primaryImage: '/images/products/hikvision-bullet.svg',
    shortDescription: 'Reliable 1080p Full HD infrared bullet camera with Smart IR up to 20m and IP67 weather resistance.',
    description: 'The Hikvision DS-2CE1AD0T-IRPF is an industry-standard 2MP analog bullet surveillance camera engineered for residential gates, retail storefronts, and perimeter monitoring. Features Smart IR technology to avoid overexposure in dark conditions and 4-in-1 switchable video output.',
    keyFeatures: [
      '2 MP high performance CMOS sensor (1920 × 1080)',
      'Smart IR: up to 20 m infrared night vision distance',
      '4 in 1 video output (switchable TVI/AHD/CVI/CVBS)',
      'IP67 dust and water resistance'
    ],
    specifications: {
      resolution: '2MP (1080p)',
      form_factor: 'Bullet',
      night_vision: 'IR Night Vision (up to 20m)',
      lens: '3.6mm (Standard)',
      ip_rating: 'IP67 Weatherproof',
      audio_support: false
    },
    pricing: {
      regularPrice: 2450,
      salePrice: 2350,
      currency: 'BDT'
    },
    inventory: {
      available: 48,
      status: 'in_stock'
    },
    unit: 'Piece',
    warrantyMonths: 12,
    warrantyText: '1-Year Official Manufacturer Warranty with verified serial number',
    documents: [
      { id: 'doc-1', title: 'Official Hikvision Datasheet (PDF)', type: 'datasheet', url: 'https://www.hikvision.com/datasheet-sample.pdf', size: '1.2 MB' }
    ],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    isFeatured: true,
    isPopular: true,
    isDemo: true
  },
  {
    id: 'prod-hik-dome-2mp',
    name: 'Hikvision 2MP Indoor Dome Camera',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-2CE7AD0T-MMFP',
    sku: 'HIK-CAM-DOME-2MP',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: [
      '/images/products/hikvision-dome.svg'
    ],
    primaryImage: '/images/products/hikvision-dome.svg',
    shortDescription: 'Compact 2MP dome camera for clean indoor ceiling installations in offices and apartments.',
    description: 'Designed for discreet indoor surveillance, the DS-2CE7AD0T-MMFP dome blends seamlessly into ceiling tiles while providing crisp 1080p video with 20m infrared night vision.',
    keyFeatures: [
      '2 MP indoor turret/dome camera',
      'Smart IR night illumination up to 20 m',
      'Compact aesthetic housing for false ceilings',
      '4-in-1 switchable output'
    ],
    specifications: {
      resolution: '2MP (1080p)',
      form_factor: 'Dome',
      night_vision: 'IR Night Vision (up to 20m)',
      lens: '2.8mm (Wide Angle)',
      ip_rating: 'Indoor Use',
      audio_support: false
    },
    pricing: {
      regularPrice: 2700,
      currency: 'BDT'
    },
    inventory: {
      available: 35,
      status: 'in_stock'
    },
    unit: 'Piece',
    warrantyMonths: 12,
    warrantyText: '1-Year Warranty',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    isFeatured: true,
    isDemo: true
  },
  {
    id: 'prod-hik-dvr-4ch',
    name: 'Hikvision 4-Channel Turbo HD DVR',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-7104HQHI-K1',
    sku: 'HIK-DVR-4CH-HQHI',
    category: 'DVR & NVR Recorders',
    categoryId: 'cat-recorders',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: [
      '/images/products/hikvision-dvr.svg'
    ],
    primaryImage: '/images/products/hikvision-dvr.svg',
    shortDescription: '4-channel 1080p Turbo HD DVR with H.265 Pro+ compression and free Hik-Connect mobile live view.',
    description: 'High-performance 4-channel digital video recorder with advanced video encoding, HDMI/VGA simultaneous outputs, and seamless smartphone remote monitoring without static IP configuration.',
    keyFeatures: [
      '4 channels and 1 HDD mini size DVR',
      'Efficient H.265 pro+ compression technology',
      'Encoding ability up to 1080p @ 15 fps',
      'Hik-Connect cloud mobile viewing'
    ],
    specifications: {
      channels: '4 Channels',
      technology: 'Turbo HD / HD-TVI',
      max_hdd_capacity: 6,
      compression: 'H.265 Pro+ / H.265'
    },
    pricing: {
      regularPrice: 5800,
      currency: 'BDT'
    },
    inventory: {
      available: 20,
      status: 'in_stock'
    },
    unit: 'Piece',
    warrantyMonths: 12,
    warrantyText: '1-Year Warranty',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    isFeatured: true,
    isDemo: true
  },
  {
    id: 'prod-zkteco-mb20',
    name: 'ZKTeco MB20 Face & Fingerprint Time Attendance',
    brand: 'ZKTeco',
    brandId: 'b-zkteco',
    modelNumber: 'MB20',
    sku: 'ZK-MB20-BIO',
    category: 'Access Control & Biometrics',
    categoryId: 'cat-access',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: [
      '/images/products/zkteco-biometric.svg'
    ],
    primaryImage: '/images/products/zkteco-biometric.svg',
    shortDescription: 'Multi-biometric identification terminal with high-speed facial recognition and optical fingerprint sensor.',
    description: 'ZKTeco MB20 integrates face, fingerprint, and RFID card identification for office time-attendance and electromagnetic door lock control. Includes Excel automated shift report generation.',
    keyFeatures: [
      'Multi-biometric verification: Face, Fingerprint, RFID',
      'Fast facial verification in under 1 second',
      'TCP/IP and USB host communication',
      'Access control interface for 3rd party electric locks'
    ],
    specifications: {
      biometric_type: 'Face Recognition + Fingerprint',
      user_capacity: 1000,
      connectivity: 'TCP/IP + USB'
    },
    pricing: {
      regularPrice: 9500,
      currency: 'BDT'
    },
    inventory: {
      available: 15,
      status: 'in_stock'
    },
    unit: 'Piece',
    warrantyMonths: 12,
    warrantyText: '1-Year Warranty & Software Setup',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    isFeatured: true,
    isPopular: true,
    isDemo: true
  },
  {
    id: 'prod-ruijie-rap2200e',
    name: 'Ruijie Reyee RG-RAP2200(E) Wi-Fi 5 Ceiling AP',
    brand: 'Ruijie Reyee',
    brandId: 'b-ruijie',
    modelNumber: 'RG-RAP2200(E)',
    sku: 'RUI-AP-RAP2200E',
    category: 'Access Points & Wi-Fi',
    categoryId: 'cat-wifi',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: [
      '/images/products/ruijie-wifi.svg'
    ],
    primaryImage: '/images/products/ruijie-wifi.svg',
    shortDescription: 'Dual-band Gigabit ceiling-mount access point with enterprise mesh and Ruijie Cloud management.',
    description: 'High-density commercial access point delivering seamless Wi-Fi roaming across multi-story offices and restaurants. Managed via mobile app with zero licensing fees.',
    keyFeatures: [
      'Dual-radio performance up to 1267 Mbps',
      'Reyee Mesh technology for wireless expansion',
      'Free lifetime Ruijie Cloud remote management',
      'Standard 802.3af/at PoE power support'
    ],
    specifications: {
      wifi_standard: 'Wi-Fi 5 (802.11ac)',
      max_speed: 1267,
      mount_type: 'Ceiling / Wall Mount'
    },
    pricing: {
      regularPrice: 8200,
      currency: 'BDT'
    },
    inventory: {
      available: 22,
      status: 'in_stock'
    },
    unit: 'Piece',
    warrantyMonths: 36,
    warrantyText: '3-Year Official Manufacturer Warranty',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    isFeatured: true,
    isDemo: true
  },
  {
    id: 'prod-enterprise-switch-req',
    name: 'Ruijie Reyee 24-Port Gigabit Smart Managed PoE Switch',
    brand: 'Ruijie Reyee',
    brandId: 'b-ruijie',
    modelNumber: 'RG-ES226GS-P',
    sku: 'RUI-SW-24P-POE',
    category: 'Network Switches',
    categoryId: 'cat-networking',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: [
      '/images/products/ruijie-switch.svg'
    ],
    primaryImage: '/images/products/ruijie-switch.svg',
    shortDescription: 'Enterprise 24-port PoE+ smart managed switch with 370W power budget and optical SFP uplinks.',
    description: 'Designed for enterprise IP camera systems and wireless networks with centralized cloud monitoring, automatic CCTV loop prevention, and 250m long-distance PoE transmission.',
    keyFeatures: [
      '24 x 10/100/1000Base-T PoE+ Ports with 370W budget',
      '2 x Gigabit SFP optical uplink slots',
      'IP camera auto-reboot and cable diagnosis',
      'Ruijie Cloud app topology visualization'
    ],
    specifications: {
      port_count: '24 Ports',
      poe_support: true,
      poe_budget: 370,
      management_type: 'Smart Cloud Managed'
    },
    pricing: {
      // Intentionally undefined regularPrice to test "Request quotation" behavior!
      currency: 'BDT'
    },
    inventory: {
      available: 5,
      status: 'request_quote'
    },
    unit: 'Piece',
    warrantyMonths: 36,
    warrantyText: '3-Year Warranty',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    isFeatured: false,
    isDemo: true
  }
];

export const INITIAL_PACKAGES: SecurityPackage[] = [
  {
    id: 'pkg-cctv-night-vision',
    name: '4-Camera Night Vision Turnkey CCTV Package',
    slug: '4-camera-night-vision-cctv-package',
    badge: 'Affordable',
    description: 'Analog HD surveillance engineered with Hikvision 2MP IRPF infrared night vision cameras.',
    cameraCountsSupported: [2, 4, 8, 16],
    defaultCameraCount: 4,
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    isNightVisionIrOnly: true,
    basePrice: 17100,
    rules: [
      {
        role: 'camera',
        defaultModelId: 'prod-hik-irpf-2mp',
        name: 'Hikvision 2MP IRPF IR Camera',
        quantityFormula: 'per_camera',
        qtyPerCamera: 1
      },
      {
        role: 'recorder',
        defaultModelId: 'prod-hik-dvr-4ch',
        name: 'Hikvision Turbo HD DVR',
        quantityFormula: 'fixed',
        fixedQty: 1
      },
      {
        role: 'storage',
        defaultModelId: 'prod-wd-purple',
        name: 'Surveillance HDD',
        quantityFormula: 'lookup_camera_count',
        storageLookup: {
          2: { capacity: '500GB', modelId: 'hdd-500gb' },
          4: { capacity: '500GB', modelId: 'hdd-500gb' },
          8: { capacity: '1TB', modelId: 'hdd-1tb' },
          16: { capacity: '2TB', modelId: 'hdd-2tb' }
        }
      },
      {
        role: 'cable',
        defaultModelId: 'cable-cat6',
        name: 'Cat6 Cable (10m per camera)',
        quantityFormula: 'per_camera',
        qtyPerCamera: 10
      },
      {
        role: 'connectors',
        defaultModelId: 'acc-balun',
        name: 'Video Baluns & DC Power Pins',
        quantityFormula: 'per_camera',
        qtyPerCamera: 1
      },
      {
        role: 'power',
        defaultModelId: 'acc-power',
        name: 'Centralized 12V Regulated Power Supply',
        quantityFormula: 'fixed',
        fixedQty: 1
      }
    ],
    isFeatured: true,
    isDemo: true
  },
  {
    id: 'pkg-cctv-4cam-color',
    name: '4-Camera Color Turnkey CCTV Package',
    slug: '4-camera-color-cctv-package',
    badge: 'Most Popular',
    description: 'Surveillance setup with full 24/7 color low-light video imaging and Turbo HD digital recording.',
    cameraCountsSupported: [2, 4, 8, 16],
    defaultCameraCount: 4,
    supportedFormFactors: ['bullet', 'dome'],
    isNightVisionIrOnly: false,
    basePrice: 19800,
    rules: [
      {
        role: 'camera',
        defaultModelId: 'prod-hik-irpf-2mp',
        name: 'Hikvision Color Imaging Camera',
        quantityFormula: 'per_camera',
        qtyPerCamera: 1
      },
      {
        role: 'recorder',
        defaultModelId: 'prod-hik-dvr-4ch',
        name: 'Hikvision 4-Channel Turbo HD DVR',
        quantityFormula: 'fixed',
        fixedQty: 1
      },
      {
        role: 'storage',
        defaultModelId: 'prod-wd-purple',
        name: 'Surveillance HDD',
        quantityFormula: 'lookup_camera_count',
        storageLookup: {
          2: { capacity: '500GB', modelId: 'hdd-500gb' },
          4: { capacity: '1TB', modelId: 'hdd-1tb' },
          8: { capacity: '2TB', modelId: 'hdd-2tb' },
          16: { capacity: '4TB', modelId: 'hdd-4tb' }
        }
      },
      {
        role: 'cable',
        defaultModelId: 'cable-cat6',
        name: 'Cat6 Cable (10m per camera)',
        quantityFormula: 'per_camera',
        qtyPerCamera: 10
      },
      {
        role: 'power',
        defaultModelId: 'acc-power',
        name: 'Centralized 12V Regulated Power Supply',
        quantityFormula: 'fixed',
        fixedQty: 1
      }
    ],
    isFeatured: true,
    isDemo: true
  },
  {
    id: 'pkg-cctv-8cam',
    name: '8-Camera Complete Business Package',
    slug: '8-camera-business-cctv-package',
    badge: 'Top Tier',
    description: 'Comprehensive 8-camera commercial surveillance setup with 8-channel recorder and 2TB dedicated HDD.',
    cameraCountsSupported: [8, 16],
    defaultCameraCount: 8,
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    basePrice: 34500,
    rules: [
      {
        role: 'camera',
        defaultModelId: 'prod-hik-irpf-2mp',
        name: 'Hikvision 2MP HD Camera',
        quantityFormula: 'per_camera',
        qtyPerCamera: 1
      },
      {
        role: 'recorder',
        defaultModelId: 'prod-hik-dvr-4ch',
        name: 'Hikvision 8-Channel Turbo HD DVR',
        quantityFormula: 'fixed',
        fixedQty: 1
      },
      {
        role: 'storage',
        defaultModelId: 'prod-wd-purple',
        name: 'Surveillance HDD 2TB',
        quantityFormula: 'fixed',
        fixedQty: 1
      },
      {
        role: 'cable',
        defaultModelId: 'cable-cat6',
        name: 'Cat6 Cable (10m per camera)',
        quantityFormula: 'per_camera',
        qtyPerCamera: 10
      },
      {
        role: 'power',
        defaultModelId: 'acc-power',
        name: 'Centralized 12V Regulated Power Supply',
        quantityFormula: 'fixed',
        fixedQty: 1
      }
    ],
    isFeatured: true,
    isDemo: true
  },
  {
    id: 'pkg-cctv-16cam',
    name: '16-Camera Enterprise Turnkey Package',
    slug: '16-camera-enterprise-cctv-package',
    badge: 'Enterprise',
    description: 'Facility surveillance kit covering warehouses, factories, and commercial campuses.',
    cameraCountsSupported: [16],
    defaultCameraCount: 16,
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    basePrice: 68000,
    rules: [
      {
        role: 'camera',
        defaultModelId: 'prod-hik-irpf-2mp',
        name: 'Hikvision HD Camera',
        quantityFormula: 'per_camera',
        qtyPerCamera: 1
      },
      {
        role: 'recorder',
        defaultModelId: 'prod-hik-dvr-4ch',
        name: 'Hikvision 16-Channel HD DVR',
        quantityFormula: 'fixed',
        fixedQty: 1
      },
      {
        role: 'storage',
        defaultModelId: 'prod-wd-purple',
        name: 'Surveillance HDD 4TB',
        quantityFormula: 'fixed',
        fixedQty: 1
      },
      {
        role: 'cable',
        defaultModelId: 'cable-cat6',
        name: 'Cat6 Cable (10m per camera)',
        quantityFormula: 'per_camera',
        qtyPerCamera: 10
      },
      {
        role: 'power',
        defaultModelId: 'acc-power',
        name: 'Centralized 12V Regulated Power Supply',
        quantityFormula: 'fixed',
        fixedQty: 1
      }
    ],
    isFeatured: true,
    isDemo: true
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
    content: '<p>When planning a surveillance deployment in Dhaka, property owners frequently balance budget constraints against technical longevity. Analog HD (Turbo HD / HD-TVI) remains cost-effective for 2 to 8 camera residential layouts, whereas IP PoE solutions provide unmatched scalability and analytics for multi-story corporate facilities...</p>',
    featuredImage: '/images/products/hikvision-bullet.svg',
    tags: ['CCTV', 'Hikvision', 'Installation Guide'],
    readTime: '4 min read',
    isDemo: true
  }
];

export const INITIAL_PROJECTS: ProjectCaseStudy[] = [];

export const INITIAL_TESTIMONIALS: Testimonial[] = [];

export const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Are all Hikvision and ZKTeco products 100% genuine?',
    answer: 'Yes. Every device supplied by CamneX Bangladesh carries an authentic factory serial number verifiable through official manufacturer partner verification channels, accompanied by warranty documentation.',
    category: 'Hardware & Authenticity'
  },
  {
    id: 'faq-2',
    question: 'Can I view surveillance streams on my smartphone outside Bangladesh?',
    answer: 'Yes. We configure encrypted cloud P2P (Hik-Connect / DMSS) on your smartphones and laptops, allowing live streaming and playback review globally without static IP requirements.',
    category: 'App & Remote Access'
  },
  {
    id: 'faq-3',
    question: 'Can an engineer inspect premises in Dhaka before quotation?',
    answer: 'Yes. An engineer can visit premises in Dhaka to evaluate cable routes and formulate a bill of materials.',
    category: 'Installation & Inspection'
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
    recommendedCategories: ['cctv-cameras', 'biometrics-access-control'],
    recommendedPackages: ['night-vision-cctv-package'],
    recommendedProducts: ['prod-hik-irpf-2mp'],
    enabled: true,
    order: 1
  },
  {
    id: 'scen-office',
    slug: 'corporate-office',
    title: 'Corporate Office',
    description: 'Time attendance biometrics, seamless Wi-Fi 6 roaming, and central server rack networking.',
    iconName: 'Building2',
    recommendedCategories: ['biometrics-access-control', 'access-points-wifi', 'network-switches'],
    recommendedPackages: ['night-vision-cctv-package'],
    recommendedProducts: ['prod-zkteco-mb20', 'prod-ruijie-rap2260g'],
    enabled: true,
    order: 2
  },
  {
    id: 'scen-retail',
    slug: 'shop-retail',
    title: 'Shop & Retail Store',
    description: 'Cash counter dome zoom, customer footfall monitoring, and concealed PVC channel wiring.',
    iconName: 'ShoppingBag',
    recommendedCategories: ['cctv-cameras', 'dvr-nvr-recorders'],
    recommendedPackages: ['night-vision-cctv-package'],
    recommendedProducts: ['prod-hik-dome-2mp'],
    enabled: true,
    order: 3
  },
  {
    id: 'scen-factory',
    slug: 'factory-warehouse',
    title: 'Factory & Warehouse',
    description: 'High-mount 4K optical zoom, weatherproof IP67 enclosures, and long-range fiber / PoE switches.',
    iconName: 'Factory',
    recommendedCategories: ['cctv-cameras', 'network-switches', 'cctv-accessories'],
    recommendedPackages: ['night-vision-cctv-package'],
    recommendedProducts: ['prod-ruijie-es205gc-p'],
    enabled: true,
    order: 4
  },
  {
    id: 'scen-school',
    slug: 'school-institute',
    title: 'School & Institute',
    description: 'Corridor surveillance, staff biometric check-in, and campus Wi-Fi infrastructure.',
    iconName: 'GraduationCap',
    recommendedCategories: ['cctv-cameras', 'biometrics-access-control', 'access-points-wifi'],
    recommendedPackages: ['night-vision-cctv-package'],
    recommendedProducts: ['prod-zkteco-mb20'],
    enabled: true,
    order: 5
  },
  {
    id: 'scen-building',
    slug: 'apartment-building',
    title: 'Apartment & Society',
    description: 'Gate access barriers, lift surveillance, and central monitoring station connectivity.',
    iconName: 'Building2',
    recommendedCategories: ['cctv-cameras', 'biometrics-access-control'],
    recommendedPackages: ['night-vision-cctv-package'],
    recommendedProducts: ['prod-hik-irpf-2mp'],
    enabled: true,
    order: 6
  }
];


