const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const seedsPath = path.join(__dirname, '../serverSeeds.json');
const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

// 1. TOP BAR HIGHLIGHTS
seeds.INITIAL_SITE_SETTINGS.topBarHighlights = [
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
];

// Clean any banned claims from site settings
seeds.INITIAL_SITE_SETTINGS.quickServiceSettings = {
  heading: 'Need a technician?',
  subtext: 'Technical consultations, cabling and installation, and hardware maintenance in Dhaka. Click a service below to schedule an engineer callback:',
  buttonText: 'Request Engineer Callback',
  nameLabel: 'Your Name *',
  namePlaceholder: 'e.g. Tanvir Ahmed',
  phoneLabel: 'Phone Number *',
  phonePlaceholder: '017XXXXXXXX',
  areaLabel: 'Dhaka Area / Location',
  areaPlaceholder: 'e.g. Uttara Sector 3, Dhanmondi, Mirpur',
  successMessage: 'Thank you! Our engineer will call you back within 15 minutes.',
  enableOtherOption: true
};

// 2. QUICK SERVICES LIST (Admin-driven)
seeds.INITIAL_SERVICES = [
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
    description: 'VLAN subnetting, PoE switch deployment, and enterprise Wi-Fi 6 access point roaming setup.',
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

// 3. PACKAGE SERIES
seeds.INITIAL_PACKAGE_SERIES = [
  {
    id: 'series-ir',
    name: 'Night Vision (IR)',
    slug: 'night-vision-ir',
    description: '24/7 infrared surveillance using IRPF series cameras with smart EXIR night vision up to 20m. No artificial white lighting.',
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
    description: 'Continuous 24/7 full-color video capture with F1.0 super-aperture lenses and warm illumination in zero ambient light.',
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
    id: 'series-wireless',
    name: 'Wireless',
    slug: 'wireless',
    description: 'Standalone smart Wi-Fi cameras connecting via phone app or wireless NVR kit. No video cables, includes power adapters and local storage.',
    order: 4,
    enabled: true,
    illustration: 'wireless',
    ruleSet: {
      hasStorageRule: true,
      storageMap: { 2: '128GB MicroSD', 4: '256GB MicroSD' },
      hasCableRule: false,
      hasRecorderRule: false,
      allowPtz: true,
      allowPoESwitch: false
    }
  },
  {
    id: 'series-enterprise',
    name: 'Enterprise & PTZ',
    slug: 'enterprise-ptz',
    description: 'High-density IP surveillance systems with 360° PTZ tracking cameras, Gigabit PoE switches, and rackmount NVR arrays.',
    order: 5,
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

// 4. WI-FI / WIRELESS CATEGORY & SPEC TEMPLATE
const existingWifiCat = seeds.INITIAL_CATEGORIES.find(c => c.id === 'cat-wifi' || c.slug === 'wifi-cameras');
if (!existingWifiCat) {
  seeds.INITIAL_CATEGORIES.push({
    id: 'cat-wifi',
    name: 'Wi-Fi / Wireless Cameras',
    slug: 'wifi-cameras',
    description: 'Single cameras you control from a phone app, with two-way audio and local microSD storage.',
    image: '',
    specTemplateId: 'tpl-wifi',
    featured: true,
    showOnHomepage: true,
    showAsHomepageRow: true,
    order: 4,
    status: 'active'
  });
} else {
  existingWifiCat.name = 'Wi-Fi / Wireless Cameras';
  existingWifiCat.slug = 'wifi-cameras';
  existingWifiCat.specTemplateId = 'tpl-wifi';
  existingWifiCat.showOnHomepage = true;
  existingWifiCat.showAsHomepageRow = true;
}

const existingWifiTpl = seeds.INITIAL_SPEC_TEMPLATES.find(t => t.id === 'tpl-wifi');
if (!existingWifiTpl) {
  seeds.INITIAL_SPEC_TEMPLATES.push({
    id: 'tpl-wifi',
    name: 'Wi-Fi / Wireless Camera',
    categorySlug: 'wifi-cameras',
    fields: [
      { id: 'f-res', name: 'Resolution', key: 'resolution', type: 'enum', options: ['2MP (1080p)', '3MP (2K)', '4MP (2K QHD)', '5MP (3K)'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Resolution', order: 1 },
      { id: 'f-band', name: 'Wi-Fi Band', key: 'wifi_band', type: 'enum', options: ['2.4 GHz', 'Dual-Band 2.4/5GHz', 'Wi-Fi 6'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Wi-Fi Band', order: 2 },
      { id: 'f-stor', name: 'Storage Support', key: 'storage', type: 'enum', options: ['MicroSD up to 256GB', 'MicroSD up to 512GB', 'MicroSD & Cloud'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Storage', order: 3 },
      { id: 'f-aud', name: 'Two-Way Audio', key: 'two_way_audio', type: 'boolean', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Two-Way Audio', order: 4 },
      { id: 'f-pwr', name: 'Power Source', key: 'power_source', type: 'enum', options: ['12V DC Plug-in', '5V USB-C', 'Battery & Solar'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Power', order: 5 },
      { id: 'f-app', name: 'App Support', key: 'app_support', type: 'enum', options: ['Hik-Connect', 'EZVIZ App', 'DMSS / Imou Life'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'App Support', order: 6 }
    ]
  });
}

// 5. 8 SAMPLE WI-FI CAMERA PRODUCTS
const wifiProducts = [
  {
    id: 'prod-wifi-c6n',
    name: 'EZVIZ C6N 3MP Pan & Tilt Smart Wi-Fi Camera',
    modelNumber: 'CS-C6N-D0-8B3WF',
    sku: 'EZV-C6N-3MP',
    brandId: 'brand-ezviz',
    brand: 'EZVIZ',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: true,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'Motorized 360-degree pan and tilt Wi-Fi camera with smart tracking, two-way audio, and infrared night vision up to 10m.',
    pricing: { regularPrice: 4200, salePrice: 3850, currency: 'BDT' },
    specifications: {
      resolution: '3MP (2K)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 256GB',
      two_way_audio: true,
      power_source: '5V USB-C',
      app_support: 'EZVIZ App'
    },
    inventory: { available: 25, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-h8c',
    name: 'EZVIZ H8c 4MP 360° Outdoor Pan & Tilt Wi-Fi Camera',
    modelNumber: 'CS-H8c-R100-1K4WKFL',
    sku: 'EZV-H8C-4MP',
    brandId: 'brand-ezviz',
    brand: 'EZVIZ',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: true,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'Weatherproof outdoor pan/tilt camera with AI human detection, color night vision, active defense siren, and strobe light.',
    pricing: { regularPrice: 9200, salePrice: 8600, currency: 'BDT' },
    specifications: {
      resolution: '4MP (2K QHD)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 512GB',
      two_way_audio: true,
      power_source: '12V DC Plug-in',
      app_support: 'EZVIZ App'
    },
    inventory: { available: 18, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-h3c',
    name: 'EZVIZ H3c 2K Color Night Vision Outdoor Wi-Fi Camera',
    modelNumber: 'CS-H3c-R100-1K3WKFL',
    sku: 'EZV-H3C-3MP',
    brandId: 'brand-ezviz',
    brand: 'EZVIZ',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: false,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'Reliable IP67 weatherproof outdoor bullet camera featuring color night vision and AI-powered human shape detection.',
    pricing: { regularPrice: 6500, salePrice: 5950, currency: 'BDT' },
    specifications: {
      resolution: '3MP (2K)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 512GB',
      two_way_audio: true,
      power_source: '12V DC Plug-in',
      app_support: 'EZVIZ App'
    },
    inventory: { available: 20, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-hik-pt',
    name: 'Hikvision 2MP Indoor Pan & Tilt Wi-Fi Camera',
    modelNumber: 'DS-2CV2Q21FD-IW',
    sku: 'HIK-2CV2Q21-2MP',
    brandId: 'brand-hikvision',
    brand: 'Hikvision',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: true,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'Dual-antenna indoor pan-tilt Wi-Fi camera with Hik-Connect cloud P2P, built-in microphone and speaker, and 10m IR.',
    pricing: { regularPrice: 5800, salePrice: 5200, currency: 'BDT' },
    specifications: {
      resolution: '2MP (1080p)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 256GB',
      two_way_audio: true,
      power_source: '5V USB-C',
      app_support: 'Hik-Connect'
    },
    inventory: { available: 15, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-hik-bullet',
    name: 'Hikvision 4MP Smart Wi-Fi Outdoor Bullet Camera',
    modelNumber: 'DS-2CV1043G2-LIDW',
    sku: 'HIK-2CV1043-4MP',
    brandId: 'brand-hikvision',
    brand: 'Hikvision',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: false,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'IP66 outdoor wireless bullet with smart dual lighting, onboard Wi-Fi range up to 120m in open field, and digital WDR.',
    pricing: { regularPrice: 8500, salePrice: 7900, currency: 'BDT' },
    specifications: {
      resolution: '4MP (2K QHD)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 256GB',
      two_way_audio: true,
      power_source: '12V DC Plug-in',
      app_support: 'Hik-Connect'
    },
    inventory: { available: 12, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-imou-ranger',
    name: 'Imou Ranger 2 4MP Indoor 360° Wi-Fi Camera',
    modelNumber: 'IPC-A42P-D',
    sku: 'IMOU-RANGER2-4MP',
    brandId: 'brand-dahua',
    brand: 'Dahua',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: true,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'High-resolution 4MP pan and tilt camera with abnormal sound alarm, physical privacy shutter, and human detection.',
    pricing: { regularPrice: 4600, salePrice: 4200, currency: 'BDT' },
    specifications: {
      resolution: '4MP (2K QHD)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 256GB',
      two_way_audio: true,
      power_source: '5V USB-C',
      app_support: 'DMSS / Imou Life'
    },
    inventory: { available: 30, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-imou-bullet',
    name: 'Imou Bullet 2C 4MP Weatherproof Outdoor Wi-Fi Camera',
    modelNumber: 'IPC-F42P',
    sku: 'IMOU-BULLET2C-4MP',
    brandId: 'brand-dahua',
    brand: 'Dahua',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: false,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: 'Weatherproof IP67 bullet camera with dual external antennas, built-in Wi-Fi hotspot mode, and 30m night vision.',
    pricing: { regularPrice: 5900, salePrice: 5400, currency: 'BDT' },
    specifications: {
      resolution: '4MP (2K QHD)',
      wifi_band: '2.4 GHz',
      storage: 'MicroSD up to 256GB',
      two_way_audio: false,
      power_source: '12V DC Plug-in',
      app_support: 'DMSS / Imou Life'
    },
    inventory: { available: 22, status: 'in_stock' }
  },
  {
    id: 'prod-wifi-imou-cruiser',
    name: 'Imou Cruiser 2 5MP 3K Outdoor PTZ Wi-Fi Camera',
    modelNumber: 'IPC-GS7EP-5M0WE',
    sku: 'IMOU-CRUISER2-5MP',
    brandId: 'brand-dahua',
    brand: 'Dahua',
    categoryId: 'cat-wifi',
    category: 'Wi-Fi / Wireless Cameras',
    status: 'active',
    isPopular: true,
    isFeatured: true,
    isDemo: true,
    sample: true,
    description: '5MP 3K outdoor speed dome featuring full panoramic coverage, smart full-color night vision, and Wi-Fi 6 connectivity.',
    pricing: { regularPrice: 11500, salePrice: 10800, currency: 'BDT' },
    specifications: {
      resolution: '5MP (3K)',
      wifi_band: 'Wi-Fi 6',
      storage: 'MicroSD up to 512GB',
      two_way_audio: true,
      power_source: '12V DC Plug-in',
      app_support: 'DMSS / Imou Life'
    },
    inventory: { available: 14, status: 'in_stock' }
  }
];

for (const p of wifiProducts) {
  const existingIdx = seeds.INITIAL_PRODUCTS.findIndex(prod => prod.id === p.id);
  if (existingIdx !== -1) {
    seeds.INITIAL_PRODUCTS[existingIdx] = p;
  } else {
    seeds.INITIAL_PRODUCTS.push(p);
  }
}

// 6. PACKAGES: 13 packages covering 2, 4, 8, 16, 32, 64 across series
seeds.INITIAL_PACKAGES = [
  // Night Vision (IR)
  {
    id: 'pkg-ir-2',
    name: '2-Camera Night Vision Turnkey CCTV Package',
    slug: '2-camera-night-vision-package',
    seriesId: 'series-ir',
    seriesName: 'Night Vision (IR)',
    technologyLabel: 'Hikvision EXIR IR',
    badge: 'Starter Home',
    description: 'Complete 2-camera 1080p surveillance with infrared night vision up to 20m, 4-channel DVR, and pre-terminated video cabling.',
    cameraCount: 2,
    cameraCountsSupported: [2],
    isNightVisionIrOnly: true,
    basePrice: 125000,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '2x Hikvision 2MP IRPF Fixed Bullet Cameras',
      '1x Hikvision 4-Channel Turbo HD DVR',
      '1x Western Digital Purple 500GB HDD',
      '40m High-Shield Coaxial Video Cable',
      '1x 12V 5A Centralized Regulated Power Supply',
      'Complete BNC and DC Video Connectors'
    ]
  },
  {
    id: 'pkg-ir-4',
    name: '4-Camera Night Vision Turnkey CCTV Package',
    slug: '4-camera-night-vision-package',
    seriesId: 'series-ir',
    seriesName: 'Night Vision (IR)',
    technologyLabel: 'Hikvision EXIR IR',
    badge: 'Most Popular',
    description: 'Complete 4-camera 1080p surveillance with smart EXIR infrared, 4-channel DVR, 1TB storage, and power distribution.',
    cameraCount: 4,
    cameraCountsSupported: [4],
    isNightVisionIrOnly: true,
    basePrice: 209400,
    isActive: true,
    isFeatured: true,
    isDemo: true,
    inclusions: [
      '4x Hikvision 2MP IRPF Cameras',
      '1x Hikvision 4-Channel Turbo HD DVR',
      '1x Western Digital Purple 1TB Surveillance HDD',
      '80m High-Shield Coaxial Video Cable',
      '1x 12V 5A Centralized Regulated Power Supply',
      'Complete BNC and DC Connectors'
    ]
  },
  {
    id: 'pkg-ir-8',
    name: '8-Camera Night Vision Turnkey CCTV Package',
    slug: '8-camera-night-vision-package',
    seriesId: 'series-ir',
    seriesName: 'Night Vision (IR)',
    technologyLabel: 'Hikvision EXIR IR',
    badge: 'Best for Offices',
    description: '8-channel infrared security system covering exterior perimeter and interior hallways with 2TB storage.',
    cameraCount: 8,
    cameraCountsSupported: [8],
    isNightVisionIrOnly: true,
    basePrice: 385000,
    isActive: true,
    isFeatured: true,
    isDemo: true,
    inclusions: [
      '8x Hikvision 2MP IRPF Cameras',
      '1x Hikvision 8-Channel Turbo HD DVR',
      '1x Western Digital Purple 2TB Surveillance HDD',
      '160m High-Shield Video Cable',
      '1x 12V 10A Heavy-Duty Power Supply',
      'BNC & DC Power Connectors'
    ]
  },
  {
    id: 'pkg-ir-16',
    name: '16-Camera Night Vision Turnkey CCTV Package',
    slug: '16-camera-night-vision-package',
    seriesId: 'series-ir',
    seriesName: 'Night Vision (IR)',
    technologyLabel: 'Hikvision EXIR IR',
    badge: 'Commercial Grade',
    description: 'Comprehensive 16-channel infrared surveillance system for retail stores and multi-floor commercial facilities.',
    cameraCount: 16,
    cameraCountsSupported: [16],
    isNightVisionIrOnly: true,
    basePrice: 690000,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '16x Hikvision 2MP IRPF Cameras',
      '1x Hikvision 16-Channel DVR Recorder',
      '1x Western Digital Purple 4TB Surveillance HDD',
      '320m High-Shield Video Cable',
      '1x 12V 20A Industrial Power Supply',
      'Connectors & Distribution Box'
    ]
  },

  // Hybrid Light
  {
    id: 'pkg-hybrid-4',
    name: '4-Camera Smart Hybrid Light CCTV Package',
    slug: '4-camera-hybrid-light-package',
    seriesId: 'series-hybrid',
    seriesName: 'Hybrid Light',
    technologyLabel: 'Smart Hybrid Light',
    badge: 'Smart Dual-Light',
    description: 'Intelligent dual-light security cameras that operate in infrared mode and switch to bright illumination upon motion.',
    cameraCount: 4,
    cameraCountsSupported: [4],
    basePrice: 245000,
    isActive: true,
    isFeatured: true,
    isDemo: true,
    inclusions: [
      '4x 2MP Smart Hybrid Light Cameras',
      '1x 4-Channel AcuSense DVR Recorder',
      '1x Western Digital Purple 1TB HDD',
      '80m Video Cable with Connectors',
      '1x 12V 5A Central Power Supply',
      'Mobile App P2P Configuration'
    ]
  },
  {
    id: 'pkg-hybrid-8',
    name: '8-Camera Smart Hybrid Light CCTV Package',
    slug: '8-camera-hybrid-light-package',
    seriesId: 'series-hybrid',
    seriesName: 'Hybrid Light',
    technologyLabel: 'Smart Hybrid Light',
    badge: 'AcuSense AI',
    description: '8-channel smart dual-light surveillance system with AcuSense motion classification and color deterrence.',
    cameraCount: 8,
    cameraCountsSupported: [8],
    basePrice: 440000,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '8x 2MP Smart Hybrid Light Cameras',
      '1x 8-Channel AcuSense DVR Recorder',
      '1x Western Digital Purple 2TB HDD',
      '160m Video Cable with Connectors',
      '1x 12V 10A Central Power Supply',
      'Full Site Configuration Setup'
    ]
  },

  // Full-Color
  {
    id: 'pkg-color-4',
    name: '4-Camera Full-Color Turnkey CCTV Package',
    slug: '4-camera-color-turnkey-package',
    seriesId: 'series-color',
    seriesName: 'Full-Color',
    technologyLabel: 'Hikvision ColorVu',
    badge: '24/7 Color',
    description: 'ColorVu technology delivers round-the-clock vivid color imaging even in pitch darkness with F1.0 super-apertures.',
    cameraCount: 4,
    cameraCountsSupported: [4],
    basePrice: 265000,
    isActive: true,
    isFeatured: true,
    isDemo: true,
    inclusions: [
      '4x Hikvision 2MP ColorVu Cameras',
      '1x 4-Channel AcuSense DVR',
      '1x Western Digital Purple 1TB HDD',
      '80m High-Shield Coaxial Cable',
      '1x 12V 5A Centralized Power Supply',
      'BNC & DC Power Connectors'
    ]
  },
  {
    id: 'pkg-color-8',
    name: '8-Camera Full-Color Turnkey CCTV Package',
    slug: '8-camera-color-turnkey-package',
    seriesId: 'series-color',
    seriesName: 'Full-Color',
    technologyLabel: 'Hikvision ColorVu',
    badge: '24/7 Vivid Color',
    description: 'Comprehensive 8-camera ColorVu deployment providing clear daytime-like color surveillance all night long.',
    cameraCount: 8,
    cameraCountsSupported: [8],
    basePrice: 480000,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '8x Hikvision 2MP ColorVu Cameras',
      '1x 8-Channel AcuSense DVR',
      '1x Western Digital Purple 2TB HDD',
      '160m Video Cable with Connectors',
      '1x 12V 10A Central Power Supply',
      'Mounting Brackets & Setup'
    ]
  },

  // Wireless
  {
    id: 'pkg-wifi-2',
    name: '2-Camera Wireless Smart Security Package',
    slug: '2-camera-wireless-package',
    seriesId: 'series-wireless',
    seriesName: 'Wireless',
    technologyLabel: 'Dual-Band Wi-Fi',
    badge: 'Cable-Free Video',
    description: 'Clean Wi-Fi security system with two-way voice communication, cloud/microSD local storage, and instant mobile alerts.',
    cameraCount: 2,
    cameraCountsSupported: [2],
    basePrice: 110000,
    isActive: true,
    isFeatured: true,
    isDemo: true,
    inclusions: [
      '2x 3MP Wireless Smart Cameras',
      '2x 128GB High-Endurance MicroSD Cards',
      '2x 12V 2A Regulated Power Adapters',
      'Mobile Phone App Sync & Setup'
    ]
  },
  {
    id: 'pkg-wifi-4',
    name: '4-Camera Wireless NVR Security Kit',
    slug: '4-camera-wireless-nvr-kit',
    seriesId: 'series-wireless',
    seriesName: 'Wireless',
    technologyLabel: 'Wi-Fi 6 Wireless Kit',
    badge: 'Complete Wireless Kit',
    description: '4-camera wireless surveillance kit featuring dedicated wireless NVR receiver with pre-installed 1TB hard drive.',
    cameraCount: 4,
    cameraCountsSupported: [4],
    basePrice: 215000,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '4x 3MP Weatherproof Wi-Fi Cameras',
      '1x 4-Channel Wireless NVR Receiver',
      '1x Western Digital Purple 1TB HDD',
      '4x 12V DC Camera Power Adapters',
      '1x NVR Power Adapter & HDMI Cable'
    ]
  },

  // Enterprise & PTZ
  {
    id: 'pkg-ptz-16',
    name: '16-Camera Enterprise PTZ Turnkey Solution',
    slug: '16-camera-enterprise-ptz-package',
    seriesId: 'series-enterprise',
    seriesName: 'Enterprise & PTZ',
    technologyLabel: 'Speed Dome PTZ & PoE',
    badge: 'PTZ Tracking',
    description: 'Integrated 16-camera enterprise IP surveillance featuring a 360° optical zoom PTZ camera and Gigabit PoE switching.',
    cameraCount: 16,
    cameraCountsSupported: [16],
    basePrice: 980000,
    isActive: true,
    isFeatured: true,
    isDemo: true,
    inclusions: [
      '1x 4MP 25x Optical Zoom Speed Dome PTZ',
      '15x 4K IP Fixed Turret Cameras',
      '1x 16-Channel 4K Network Video Recorder (NVR)',
      '1x 24-Port Gigabit PoE Switch',
      '1x 6TB Enterprise Surveillance HDD',
      'Cat6 Structured Network Cabling'
    ]
  },
  {
    id: 'pkg-ent-32',
    name: '32-Camera Enterprise Campus Security Setup',
    slug: '32-camera-enterprise-campus-setup',
    seriesId: 'series-enterprise',
    seriesName: 'Enterprise & PTZ',
    technologyLabel: 'Multi-NVR High Capacity',
    badge: 'Campus Security',
    description: 'High-density 32-camera IP surveillance infrastructure designed for commercial buildings, factories, and campuses.',
    cameraCount: 32,
    cameraCountsSupported: [32],
    isQuoteOnly: true,
    basePrice: undefined,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '32x 4K AI Enterprise IP Cameras',
      '1x 32-Channel Enterprise NVR Array',
      '2x 16-Port Gigabit Managed PoE Switches',
      '2x 6TB Enterprise Surveillance HDDs',
      'Cat6 STP Shielded Cabling Infrastructure',
      'Rackmount Cabinet & PDU System'
    ]
  },
  {
    id: 'pkg-ent-64',
    name: '64-Camera High-Density Facility Surveillance',
    slug: '64-camera-high-density-facility',
    seriesId: 'series-enterprise',
    seriesName: 'Enterprise & PTZ',
    technologyLabel: 'Multi-Server NVR Cluster',
    badge: 'Facility Grade',
    description: 'Enterprise 64-camera security deployment with multi-server NVR redundancy and optical fiber backbone.',
    cameraCount: 64,
    cameraCountsSupported: [64],
    isQuoteOnly: true,
    basePrice: undefined,
    isActive: true,
    isFeatured: false,
    isDemo: true,
    inclusions: [
      '64x 4K AI Enterprise IP Cameras',
      '2x 32-Channel Redundant Enterprise NVRs',
      '4x 24-Port Managed Gigabit PoE Switches',
      '4x 6TB Enterprise Surveillance HDDs',
      'Optical Fiber Backbone Transceivers',
      'Centralized Monitoring Console Rack'
    ]
  }
];

// 7. HOMEPAGE SECTIONS: Add Wi-Fi Cameras right after Special Offers
const existingWifiSec = seeds.INITIAL_HOMEPAGE_SECTIONS.find(s => s.id === 'sec-wifi' || s.type === 'wifi_cameras');
if (!existingWifiSec) {
  // Insert right after sec-offers
  const offersIdx = seeds.INITIAL_HOMEPAGE_SECTIONS.findIndex(s => s.type === 'special_offers');
  const insertPos = offersIdx !== -1 ? offersIdx + 1 : 5;
  seeds.INITIAL_HOMEPAGE_SECTIONS.splice(insertPos, 0, {
    id: 'sec-wifi',
    type: 'wifi_cameras',
    title: 'Wi-Fi Cameras',
    subtitle: 'Single cameras you control from a phone app',
    enabled: true,
    order: 5.5,
    itemLimit: 6
  });
}

// Re-index order cleanly
seeds.INITIAL_HOMEPAGE_SECTIONS.forEach((sec, idx) => {
  sec.order = idx + 1;
});

// Write to serverSeeds.json
fs.writeFileSync(seedsPath, JSON.stringify(seeds, null, 2), 'utf8');
console.log('Successfully updated serverSeeds.json with Pass 4 definitions.');

// Sync into live SQLite database
const dbPath = path.join(__dirname, '../camnex.db');
const db = new Database(dbPath);

try {
  // Ensure tables exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      short_label TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1,
      data_json TEXT NOT NULL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS package_series (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      enabled INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1,
      data_json TEXT NOT NULL
    )
  `).run();

  try {
    db.prepare('ALTER TABLE service_requests ADD COLUMN service_id TEXT').run();
  } catch (_) {}

  // Update site_settings
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('site_settings', ?)").run(
    JSON.stringify(seeds.INITIAL_SITE_SETTINGS)
  );

  // Sync services
  db.prepare('DELETE FROM services').run();
  const insertService = db.prepare(`
    INSERT INTO services (id, title, short_label, enabled, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const s of seeds.INITIAL_SERVICES) {
    insertService.run(s.id, s.title, s.shortLabel, s.enabled ? 1 : 0, s.order, JSON.stringify(s));
  }

  // Sync package series
  db.prepare('DELETE FROM package_series').run();
  const insertSeries = db.prepare(`
    INSERT INTO package_series (id, name, slug, enabled, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const ps of seeds.INITIAL_PACKAGE_SERIES) {
    insertSeries.run(ps.id, ps.name, ps.slug, ps.enabled ? 1 : 0, ps.order, JSON.stringify(ps));
  }

  // Sync categories
  const insertCat = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name, slug, description, image, spec_template_id, display_order, status, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of seeds.INITIAL_CATEGORIES) {
    insertCat.run(c.id, c.name, c.slug, c.description || '', c.image || '', c.specTemplateId || '', c.order || 1, 'active', JSON.stringify(c));
  }

  // Sync spec templates
  const insertTpl = db.prepare(`
    INSERT OR REPLACE INTO spec_templates (id, name, category_slug, data_json)
    VALUES (?, ?, ?, ?)
  `);
  for (const t of seeds.INITIAL_SPEC_TEMPLATES) {
    insertTpl.run(t.id, t.name, t.categorySlug, JSON.stringify(t));
  }

  // Sync products
  const insertProd = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, model_number, sku, brand_id, brand_name, category_id, category_slug,
      status, price, compare_price, stock_quantity, is_featured, is_popular, is_demo, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of seeds.INITIAL_PRODUCTS) {
    insertProd.run(
      p.id, p.name, p.modelNumber || '', p.sku || '', p.brandId || '', p.brand || '', p.categoryId || '',
      p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      p.status || 'active', p.pricing?.regularPrice || 0, p.pricing?.salePrice || 0,
      p.inventory?.available || 10, p.isFeatured ? 1 : 0, p.isPopular ? 1 : 0, p.isDemo ? 1 : 0,
      JSON.stringify(p)
    );
  }

  // Sync packages
  db.prepare('DELETE FROM packages').run();
  const insertPkg = db.prepare(`
    INSERT INTO packages (id, name, slug, description, camera_count, base_price, is_active, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const pkg of seeds.INITIAL_PACKAGES) {
    insertPkg.run(pkg.id, pkg.name, pkg.slug, pkg.description || '', pkg.cameraCount || 4, pkg.basePrice || 0, 1, JSON.stringify(pkg));
  }

  // Sync homepage sections
  db.prepare('DELETE FROM homepage_sections').run();
  const insertSec = db.prepare(`
    INSERT INTO homepage_sections (id, section_type, title, enabled, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const sec of seeds.INITIAL_HOMEPAGE_SECTIONS) {
    insertSec.run(sec.id, sec.type, sec.title, sec.enabled ? 1 : 0, sec.order, JSON.stringify(sec));
  }

  console.log('Database synced successfully with Pass 4 updates.');
} finally {
  db.close();
}

