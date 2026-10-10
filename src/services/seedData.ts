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
      { id: 'f-res', name: 'Resolution', key: 'resolution', type: 'enum', options: ['2MP (1080p)', '4MP (2K)', '5MP Super HD', '8MP (4K)'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Resolution', order: 1 },
      { id: 'f-form', name: 'Form Factor', key: 'form_factor', type: 'enum', options: ['Bullet', 'Dome', 'Turret', 'PTZ'], filterable: true, comparable: true, shortLabel: 'Form Factor', order: 2 },
      { id: 'f-nv', name: 'Night Vision', key: 'night_vision', type: 'enum', options: ['IR Night Vision (up to 20m)', 'IR Night Vision (up to 40m)', 'ColorVu 24/7 Full Color', 'Smart Hybrid Light'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Night Vision', order: 3 },
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
    "isTrending": false,
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
      "/images/products/dome-camera.svg"
    ],
    "primaryImage": "/images/products/dome-camera.svg",
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
    "isTrending": false,
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
    "shortDescription": "24/7 full-color surveillance camera with F1.0 super aperture and warm supplemental lighting.",
    "description": "Vivid color imagery in complete darkness. Features high fidelity audio over coax and rugged weatherproof build.",
    "keyFeatures": [
      "24/7 Full Color imaging with F1.0 aperture",
      "2.8mm wide angle fixed lens",
      "Up to 20m warm light distance",
      "Water and dust resistant (IP67)"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "ColorVu 24/7 Full Color",
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
        "value": "ColorVu 24/7 Full Color",
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
    "isTrending": false,
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
    "isTrending": false,
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
    "isTrending": true,
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
      "/images/products/dome-camera.svg"
    ],
    "primaryImage": "/images/products/dome-camera.svg",
    "shortDescription": "Compact full-color turret eyeball camera with warm white LED up to 20m distance.",
    "description": "Provides 24/7 vivid color images with high aperture lens and starlight sensor.",
    "keyFeatures": [
      "2MP full-color starlight HDCVI",
      "20m LED distance",
      "Built-in mic",
      "IP67 weather resistant"
    ],
    "specifications": {
      "resolution": "2MP (1080p)",
      "night_vision": "ColorVu 24/7 Full Color",
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
        "value": "ColorVu 24/7 Full Color",
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
    "isTrending": false,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": false,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": false,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": false,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": true,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": false,
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
      "salePrice": 7950,
      "currency": "BDT"
    },
    "inventory": {
      "available": 18,
      "status": "in_stock"
    },
    "unit": "Unit",
    "isPopular": false,
    "isTrending": false,
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
    "isTrending": false,
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
    "isTrending": true,
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
    "isTrending": false,
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
    "isTrending": false,
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
      "/images/products/network-switch.svg"
    ],
    "primaryImage": "/images/products/network-switch.svg",
    "shortDescription": "Cloud-managed 5-port gigabit switch with 4 PoE+ ports and 54W power budget.",
    "description": "Compact steel desktop casing engineered for small CCTV setups and office IP phones. Free lifetime Ruijie Cloud management.",
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
    "isTrending": false,
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
      "/images/products/network-switch.svg"
    ],
    "primaryImage": "/images/products/network-switch.svg",
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
    "isTrending": false,
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
      "/images/products/network-switch.svg"
    ],
    "primaryImage": "/images/products/network-switch.svg",
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
    "isTrending": false,
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
      "/images/products/network-switch.svg"
    ],
    "primaryImage": "/images/products/network-switch.svg",
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
    "isTrending": true,
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
      "/images/products/network-switch.svg"
    ],
    "primaryImage": "/images/products/network-switch.svg",
    "shortDescription": "24-port gigabit cloud switch with 24 PoE+ ports and 250W power budget.",
    "description": "Engineered for dense IP camera clusters and office Wi-Fi deployments with cloud dashboard visualization.",
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
    "isTrending": false,
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
    "categoryId": "cat-wifi",
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
    "isTrending": false,
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
    "categoryId": "cat-wifi",
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
    "isTrending": false,
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
    "categoryId": "cat-wifi",
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
    "isTrending": false,
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
    "categoryId": "cat-wifi",
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
    "isTrending": false,
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
      "/images/products/hard-drive.svg"
    ],
    "primaryImage": "/images/products/hard-drive.svg",
    "shortDescription": "Engineered specifically for 24/7 continuous high-definition surveillance recording.",
    "description": "AllFrame technology reduces frame loss and improves video playback quality in security systems.",
    "keyFeatures": [
      "Engineered specifically for surveillance security systems",
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
    "isTrending": false,
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
      "/images/products/hard-drive.svg"
    ],
    "primaryImage": "/images/products/hard-drive.svg",
    "shortDescription": "1TB 24/7 surveillance hard disk with AllFrame caching and 64MB cache buffer.",
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
    "isTrending": false,
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
      "/images/products/hard-drive.svg"
    ],
    "primaryImage": "/images/products/hard-drive.svg",
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
    "isTrending": false,
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
      "/images/products/hard-drive.svg"
    ],
    "primaryImage": "/images/products/hard-drive.svg",
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
    "isTrending": false,
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
      "Certified for 802.3af/at PoE+ transmission"
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
    "isTrending": false,
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
    "isTrending": false,
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
    "isTrending": false,
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
    "isTrending": false,
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
      "/images/products/dome-camera.svg"
    ],
    "primaryImage": "/images/products/dome-camera.svg",
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
    "isTrending": false,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": false,
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
      "/images/products/dvr-unit.svg"
    ],
    "primaryImage": "/images/products/dvr-unit.svg",
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
    "isTrending": false,
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
    "isTrending": false,
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
    "isTrending": false,
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
      "/images/products/network-switch.svg"
    ],
    "primaryImage": "/images/products/network-switch.svg",
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
    "isTrending": false,
    "isDemo": true,
    "sample": true,
    "createdAt": "2026-01-05T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
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


