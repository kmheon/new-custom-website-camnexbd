const fs = require('fs');
const path = require('path');

const seedsPath = path.join(__dirname, '..', 'serverSeeds.json');
const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

// 32 Sample Products
const products = [
  // ==========================================
  // Category 1: CCTV Cameras (cat-cctv) - 6 items
  // ==========================================
  {
    id: 'prod-hik-irpf-2mp',
    name: 'Hikvision 2MP Audio Fixed Mini Bullet Camera',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-2CE16D0T-ITPFS',
    sku: 'HIK-2MP-IRPF',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/hikvision-bullet.png'],
    primaryImage: '/images/hero/hikvision-bullet.png',
    shortDescription: 'High performance 2MP bullet camera with built-in microphone and 20m Smart IR night vision.',
    description: 'Crisp 1080p surveillance video with audio over coaxial cable. IP67 weatherproof housing for indoor and outdoor commercial setups.',
    keyFeatures: ['2.0 Megapixel high-performance CMOS', 'Built-in audio over coaxial cable', '20m Smart IR night vision', 'IP67 weatherproof housing'],
    specifications: { resolution: '2MP (1080p)', night_vision: 'IR Night Vision (up to 20m)', lens: '3.6mm (Standard)', ip_rating: 'IP67 Weatherproof', form_factor: 'Bullet', audio_support: true },
    specs: {
      resolution: { label: 'Resolution', value: '2MP (1080p)', highlightValue: '2 MP', showInHighlights: true },
      night_vision: { label: 'Night Vision', value: 'IR Night Vision (up to 20m)', highlightValue: '20m IR', showInHighlights: true },
      ip_rating: { label: 'IP Rating', value: 'IP67 Weatherproof', highlightValue: 'IP67', showInHighlights: true }
    },
    pricing: { regularPrice: 2400, salePrice: 2150, currency: 'BDT' }, // SPECIAL OFFER 1
    inventory: { available: 50, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-hik-dome-2mp',
    name: 'Hikvision 2MP Indoor Audio Turret Dome Camera',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-2CE76D0T-ITPFS',
    sku: 'HIK-2MP-DOME',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dome.svg'],
    primaryImage: '/images/products/hikvision-dome.svg',
    shortDescription: 'Discreet 2MP ceiling dome camera with integrated microphone and wide-angle 2.8mm lens.',
    description: 'Ideal for indoor offices, retail stores, and banking counters requiring discreet audio and video capture.',
    keyFeatures: ['2 Megapixel resolution (1920 x 1080)', 'Wide angle 2.8mm focal lens', 'Smart IR up to 20m', 'Built-in microphone with coaxial transmission'],
    specifications: { resolution: '2MP (1080p)', night_vision: 'IR Night Vision (up to 20m)', lens: '2.8mm (Wide Angle)', form_factor: 'Dome', audio_support: true },
    specs: {
      resolution: { label: 'Resolution', value: '2MP (1080p)', highlightValue: '2 MP', showInHighlights: true },
      night_vision: { label: 'Night Vision', value: 'IR Night Vision (up to 20m)', highlightValue: '20m IR', showInHighlights: true },
      form_factor: { label: 'Form Factor', value: 'Dome', highlightValue: 'Dome', showInHighlights: true }
    },
    pricing: { regularPrice: 2350, currency: 'BDT' },
    inventory: { available: 45, status: 'in_stock' },
    unit: 'Piece',
    isPopular: true, // POPULAR 1
    isFeatured: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-hik-color-2mp',
    name: 'Hikvision 2MP ColorVu Full-Color Audio Bullet Camera',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-2CE10DF0T-FS',
    sku: 'HIK-2MP-COLORVU',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/hikvision-bullet.png'],
    primaryImage: '/images/hero/hikvision-bullet.png',
    shortDescription: '24/7 full-color surveillance camera with F1.0 super aperture and warm supplemental lighting.',
    description: 'Vivid color imagery in complete darkness. Features high fidelity audio over coax and rugged weatherproof build.',
    keyFeatures: ['24/7 Full Color imaging with F1.0 aperture', '2.8mm wide angle fixed lens', 'Up to 20m warm light distance', 'Water and dust resistant (IP67)'],
    specifications: { resolution: '2MP (1080p)', night_vision: 'ColorVu 24/7 Full Color', lens: '2.8mm (Wide Angle)', ip_rating: 'IP67 Weatherproof', form_factor: 'Bullet', audio_support: true },
    specs: {
      resolution: { label: 'Resolution', value: '2MP (1080p)', highlightValue: '2 MP', showInHighlights: true },
      night_vision: { label: 'Night Vision', value: 'ColorVu 24/7 Full Color', highlightValue: 'ColorVu', showInHighlights: true },
      ip_rating: { label: 'IP Rating', value: 'IP67 Weatherproof', highlightValue: 'IP67', showInHighlights: true }
    },
    pricing: { regularPrice: 3800, salePrice: 3450, currency: 'BDT' }, // SPECIAL OFFER 2
    inventory: { available: 30, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-hik-4k-bullet',
    name: 'Hikvision 8MP 4K Ultra HD Outdoor IR Bullet Camera',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-2CE16U1T-ITF',
    sku: 'HIK-8MP-4K',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/hikvision-bullet.png'],
    primaryImage: '/images/hero/hikvision-bullet.png',
    shortDescription: 'True 4K 8.29 megapixel resolution with EXIR 2.0 smart IR up to 30m distance.',
    description: 'Enterprise grade perimeter security camera capturing license plates and wide outdoor lots in ultra-crisp detail.',
    keyFeatures: ['8.29 MP high performance CMOS', '3840 x 2160 ultra high resolution', 'EXIR 2.0 Smart IR up to 30m', '4 in 1 video output switchable'],
    specifications: { resolution: '8MP (4K)', night_vision: 'IR Night Vision (up to 40m)', lens: '3.6mm (Standard)', ip_rating: 'IP67 Weatherproof', form_factor: 'Bullet', audio_support: false },
    specs: {
      resolution: { label: 'Resolution', value: '8MP (4K)', highlightValue: '4K', showInHighlights: true },
      night_vision: { label: 'Night Vision', value: 'IR Night Vision (up to 40m)', highlightValue: '40m IR', showInHighlights: true },
      ip_rating: { label: 'IP Rating', value: 'IP67 Weatherproof', highlightValue: 'IP67', showInHighlights: true }
    },
    pricing: { regularPrice: 8500, currency: 'BDT' },
    inventory: { available: 20, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isNew: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-03-25T10:00:00.000Z', // NEW ARRIVAL 1
    updatedAt: '2026-03-25T10:00:00.000Z'
  },
  {
    id: 'prod-dahua-2mp-bullet',
    name: 'Dahua 2MP HDCVI Weatherproof IR Bullet Camera',
    brand: 'Dahua',
    brandId: 'b-dahua',
    modelNumber: 'DH-HAC-HFW1200THP-I8',
    sku: 'DH-2MP-BULLET',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/hikvision-bullet.png'],
    primaryImage: '/images/hero/hikvision-bullet.png',
    shortDescription: 'Long-range outdoor security camera with powerful 80m IR illumination and IP67 rating.',
    description: 'Designed for factory perimeters, highways, and large warehouse yards needing dependable night monitoring.',
    keyFeatures: ['2MP resolution with starlight technology', 'Max 30fps at 1080P', '80m long-distance Smart IR', 'IP67 ingress protection rating'],
    specifications: { resolution: '2MP (1080p)', night_vision: 'IR Night Vision (up to 40m)', lens: '3.6mm (Standard)', ip_rating: 'IP67 Weatherproof', form_factor: 'Bullet', audio_support: false },
    specs: {
      resolution: { label: 'Resolution', value: '2MP (1080p)', highlightValue: '2 MP', showInHighlights: true },
      night_vision: { label: 'Night Vision', value: 'IR Night Vision (up to 40m)', highlightValue: '80m IR', showInHighlights: true },
      ip_rating: { label: 'IP Rating', value: 'IP67 Weatherproof', highlightValue: 'IP67', showInHighlights: true }
    },
    pricing: { regularPrice: 3200, currency: 'BDT' },
    inventory: { available: 25, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-dahua-eyeball-2mp',
    name: 'Dahua 2MP Full-color Starlight HDCVI Eyeball Camera',
    brand: 'Dahua',
    brandId: 'b-dahua',
    modelNumber: 'DH-HAC-HDW1239TLQP-LED',
    sku: 'DH-2MP-EYEBALL',
    category: 'CCTV Cameras',
    categoryId: 'cat-cctv',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dome.svg'],
    primaryImage: '/images/products/hikvision-dome.svg',
    shortDescription: 'Compact full-color turret eyeball camera with warm white LED up to 20m distance.',
    description: 'Provides 24/7 vivid color images with high aperture lens and starlight sensor.',
    keyFeatures: ['2MP full-color starlight HDCVI', '20m LED distance', 'Built-in mic', 'IP67 weather resistant'],
    specifications: { resolution: '2MP (1080p)', night_vision: 'ColorVu 24/7 Full Color', lens: '2.8mm (Wide Angle)', ip_rating: 'IP67 Weatherproof', form_factor: 'Turret', audio_support: true },
    specs: {
      resolution: { label: 'Resolution', value: '2MP (1080p)', highlightValue: '2 MP', showInHighlights: true },
      night_vision: { label: 'Night Vision', value: 'ColorVu 24/7 Full Color', highlightValue: 'Full-Color', showInHighlights: true },
      ip_rating: { label: 'IP Rating', value: 'IP67 Weatherproof', highlightValue: 'IP67', showInHighlights: true }
    },
    pricing: { regularPrice: 2950, currency: 'BDT' },
    inventory: { available: 35, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-08T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },

  // ==========================================
  // Category 2: Recorders / DVR (cat-recorders) - 5 items
  // ==========================================
  {
    id: 'prod-hik-dvr-4ch',
    name: 'Hikvision 4-Channel 1080p AcuSense HD DVR',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'iDS-7204HQHI-M1/S',
    sku: 'HIK-DVR-4CH',
    category: 'Recorders',
    categoryId: 'cat-recorders',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dvr.svg'],
    primaryImage: '/images/products/hikvision-dvr.svg',
    shortDescription: '4-channel smart AI DVR with deep learning human and vehicle motion detection.',
    description: 'Reduces false alarms with AcuSense motion classification. Supports up to 6 IP cameras in hybrid mode and 10TB SATA storage.',
    keyFeatures: ['4 channels and 1 HDD 1U AcuSense DVR', 'False alarm reduction through human and vehicle target classification', 'Efficient H.265 pro+ compression technology', 'Encoding capability up to 3K/5MP Lite at 12 fps'],
    specifications: { channels: '4 CH', compression: 'H.265 Pro+', max_resolution: '5MP Lite', hdd_slots: '1 SATA Slot' },
    specs: {
      channels: { label: 'Channels', value: '4 CH', highlightValue: '4 CH', showInHighlights: true },
      compression: { label: 'Compression', value: 'H.265 Pro+', highlightValue: 'H.265+', showInHighlights: true }
    },
    pricing: { regularPrice: 4500, salePrice: 3950, currency: 'BDT' }, // SPECIAL OFFER 3
    inventory: { available: 20, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-hik-dvr-8ch',
    name: 'Hikvision 8-Channel 1080p AcuSense HD DVR',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'iDS-7208HQHI-M1/S',
    sku: 'HIK-DVR-8CH',
    category: 'Recorders',
    categoryId: 'cat-recorders',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dvr.svg'],
    primaryImage: '/images/products/hikvision-dvr.svg',
    shortDescription: '8-channel enterprise AcuSense digital video recorder supporting human/vehicle classification.',
    description: 'High throughput AI DVR supporting 8 analog BNC cameras plus up to 4 network IP cameras. H.265 Pro+ encoding saves bandwidth.',
    keyFeatures: ['8 channels analog + 4 IP channels', 'AcuSense AI motion filtering', 'H.265 Pro+ ultra bandwidth efficiency', 'Audio over coaxial support across all channels'],
    specifications: { channels: '8 CH', compression: 'H.265 Pro+', max_resolution: '5MP Lite', hdd_slots: '1 SATA Slot' },
    specs: {
      channels: { label: 'Channels', value: '8 CH', highlightValue: '8 CH', showInHighlights: true },
      compression: { label: 'Compression', value: 'H.265 Pro+', highlightValue: 'H.265+', showInHighlights: true }
    },
    pricing: { regularPrice: 6800, currency: 'BDT' },
    inventory: { available: 15, status: 'in_stock' },
    unit: 'Unit',
    isPopular: true, // POPULAR 2
    isFeatured: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-hik-dvr-16ch',
    name: 'Hikvision 16-Channel 1080p AcuSense HD DVR',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'iDS-7216HQHI-M2/S',
    sku: 'HIK-DVR-16CH',
    category: 'Recorders',
    categoryId: 'cat-recorders',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dvr.svg'],
    primaryImage: '/images/products/hikvision-dvr.svg',
    shortDescription: '16-channel rackmount AcuSense DVR with dual SATA bays supporting up to 20TB total storage.',
    description: 'Designed for corporate offices, multi-storey commercial buildings, and factories needing high camera counts and AI tracking.',
    keyFeatures: ['16 analog channels + 8 IP channels', 'Dual SATA interfaces up to 10TB per disk', 'Advanced perimeter protection', 'HDMI 4K output port'],
    specifications: { channels: '16 CH', compression: 'H.265 Pro+', max_resolution: '5MP Lite', hdd_slots: '2 SATA Slots' },
    specs: {
      channels: { label: 'Channels', value: '16 CH', highlightValue: '16 CH', showInHighlights: true },
      compression: { label: 'Compression', value: 'H.265 Pro+', highlightValue: 'H.265+', showInHighlights: true }
    },
    pricing: { regularPrice: 12500, currency: 'BDT' },
    inventory: { available: 10, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-dahua-xvr-8ch',
    name: 'Dahua 8-Channel WizSense 5-in-1 Compact 1U XVR',
    brand: 'Dahua',
    brandId: 'b-dahua',
    modelNumber: 'DH-XVR5108HS-I3',
    sku: 'DH-XVR-8CH',
    category: 'Recorders',
    categoryId: 'cat-recorders',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dvr.svg'],
    primaryImage: '/images/products/hikvision-dvr.svg',
    shortDescription: '8-channel AI digital video recorder with smart dual-stream and face recognition search.',
    description: 'Full-channel AI Coding reduces bandwidth by 50%. Compatible with HDCVI, AHD, TVI, CVBS, and IP cameras.',
    keyFeatures: ['8 channels SMD Plus human/vehicle detection', 'H.265+/H.265 dual-stream video compression', 'Supports HDCVI/AHD/TVI/CVBS/IP video inputs', 'Up to 16TB SATA hard disk capacity'],
    specifications: { channels: '8 CH', compression: 'AI Coding (H.265+)', max_resolution: '5MP', hdd_slots: '1 SATA Slot' },
    specs: {
      channels: { label: 'Channels', value: '8 CH', highlightValue: '8 CH', showInHighlights: true },
      compression: { label: 'Compression', value: 'AI Coding (H.265+)', highlightValue: 'AI Coding', showInHighlights: true }
    },
    pricing: { regularPrice: 7200, currency: 'BDT' },
    inventory: { available: 12, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-hik-nvr-8ch-poe',
    name: 'Hikvision 8-Channel 4K Embedded PoE Network Video Recorder',
    brand: 'Hikvision',
    brandId: 'b-hikvision',
    modelNumber: 'DS-7608NI-Q1/8P',
    sku: 'HIK-NVR-8CH-POE',
    category: 'Recorders',
    categoryId: 'cat-recorders',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hikvision-dvr.svg'],
    primaryImage: '/images/products/hikvision-dvr.svg',
    shortDescription: 'Plug-and-play 4K NVR with 8 independent PoE network interfaces up to 80W power.',
    description: 'Connects IP cameras directly over ethernet cable. Decodes up to 8MP resolution with 4K HDMI video output.',
    keyFeatures: ['8 independent PoE network ports', 'Up to 80 Mbps incoming bandwidth', 'Up to 8MP resolution recording and display', 'H.265+/H.265 video format decoding'],
    specifications: { channels: '8 CH', compression: 'H.265+', max_resolution: '8MP (4K)', hdd_slots: '1 SATA Slot' },
    specs: {
      channels: { label: 'Channels', value: '8 CH', highlightValue: '8 CH', showInHighlights: true },
      compression: { label: 'Compression', value: 'H.265+', highlightValue: '4K PoE', showInHighlights: true }
    },
    pricing: { regularPrice: 14800, currency: 'BDT' },
    inventory: { available: 10, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isNew: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-03-25T10:00:00.000Z', // NEW ARRIVAL 2
    updatedAt: '2026-03-25T10:00:00.000Z'
  },

  // ==========================================
  // Category 3: Access Control & Biometrics (cat-access) - 5 items
  // ==========================================
  {
    id: 'prod-zkteco-mb20',
    name: 'ZKTeco MB20 Multi-Biometric Time Attendance & Access Terminal',
    brand: 'ZKTeco',
    brandId: 'b-zkteco',
    modelNumber: 'MB20',
    sku: 'ZK-MB20',
    category: 'Access Control & Biometrics',
    categoryId: 'cat-access',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/zkteco-biometric.png'],
    primaryImage: '/images/hero/zkteco-biometric.png',
    shortDescription: 'Hybrid facial recognition and fingerprint attendance terminal with 2.8-inch TFT screen.',
    description: 'High-speed biometric verification under 0.5 seconds. Built-in relay for electric magnetic door lock integration.',
    keyFeatures: ['Multi-biometric verification: Face, Fingerprint, Password, RFID', 'High speed verification under 0.5 seconds', 'TCP/IP and USB-Host data communication', 'Access control interface for 3rd party electric lock'],
    specifications: { user_capacity: '1000 Users', fingerprint_capacity: '500 Prints', face_capacity: '200 Faces', verification_methods: 'Face / Fingerprint / Card', connectivity: 'TCP/IP & USB' },
    specs: {
      user_capacity: { label: 'Capacity', value: '1000 Users', highlightValue: '1000 Users', showInHighlights: true },
      verification_methods: { label: 'Verification', value: 'Face / Fingerprint / Card', highlightValue: 'Face & Finger', showInHighlights: true },
      connectivity: { label: 'Network', value: 'TCP/IP & USB', highlightValue: 'TCP/IP', showInHighlights: true }
    },
    pricing: { regularPrice: 8500, salePrice: 7950, currency: 'BDT' }, // SPECIAL OFFER 4
    inventory: { available: 18, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-zkteco-k40',
    name: 'ZKTeco K40 Fingerprint Time Attendance & Access Terminal',
    brand: 'ZKTeco',
    brandId: 'b-zkteco',
    modelNumber: 'K40',
    sku: 'ZK-K40',
    category: 'Access Control & Biometrics',
    categoryId: 'cat-access',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/zkteco-biometric.png'],
    primaryImage: '/images/hero/zkteco-biometric.png',
    shortDescription: 'Reliable standalone fingerprint terminal with built-in battery backup and door lock relay.',
    description: 'Standard workhorse attendance terminal widely deployed across retail shops, small offices, and schools.',
    keyFeatures: ['1,000 fingerprint templates capacity', '80,000 transaction record capacity', 'Built-in battery backup for power cuts', 'Door lock relay and exit button interface'],
    specifications: { user_capacity: '1000 Users', fingerprint_capacity: '1000 Prints', battery_backup: true, verification_methods: 'Fingerprint & RFID Card', connectivity: 'TCP/IP & USB' },
    specs: {
      user_capacity: { label: 'Capacity', value: '1000 Users', highlightValue: '1000 Users', showInHighlights: true },
      verification_methods: { label: 'Verification', value: 'Fingerprint & RFID Card', highlightValue: 'Finger & RFID', showInHighlights: true },
      battery_backup: { label: 'Backup Battery', value: true, highlightValue: 'Battery Backup', showInHighlights: true }
    },
    pricing: { regularPrice: 6500, currency: 'BDT' },
    inventory: { available: 25, status: 'in_stock' },
    unit: 'Unit',
    isPopular: true, // POPULAR 3
    isFeatured: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-zkteco-speedface-v5l',
    name: 'ZKTeco SpeedFace-V5L Visible Light Facial Recognition Terminal',
    brand: 'ZKTeco',
    brandId: 'b-zkteco',
    modelNumber: 'SpeedFace-V5L',
    sku: 'ZK-SPEEDFACE-V5L',
    category: 'Access Control & Biometrics',
    categoryId: 'cat-access',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/zkteco-biometric.png'],
    primaryImage: '/images/hero/zkteco-biometric.png',
    shortDescription: 'AI-driven visible light facial recognition with anti-spoofing algorithm and mask detection.',
    description: 'Enterprise touchless access control terminal recognizing moving subjects from 0.3m to 3m away in 0.3s.',
    keyFeatures: ['6,000 facial templates capacity', '0.3 second recognition speed', 'Deep learning anti-spoofing algorithm', '5-inch touch LCD display'],
    specifications: { user_capacity: '10000 Users', face_capacity: '6000 Faces', verification_methods: 'Visible Light Face / Palm / Card', connectivity: 'TCP/IP & Wiegand' },
    specs: {
      user_capacity: { label: 'Capacity', value: '10000 Users', highlightValue: '10K Users', showInHighlights: true },
      face_capacity: { label: 'Face Templates', value: '6000 Faces', highlightValue: '6000 Faces', showInHighlights: true },
      verification_methods: { label: 'Verification', value: 'Visible Light Face / Palm / Card', highlightValue: 'Touchless Face', showInHighlights: true }
    },
    pricing: { regularPrice: 26500, currency: 'BDT' },
    inventory: { available: 8, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-zkteco-em-lock',
    name: 'ZKTeco 280KG (600 lbs) Magnetic Lock with LED Feedback',
    brand: 'ZKTeco',
    brandId: 'b-zkteco',
    modelNumber: 'AL-280LED',
    sku: 'ZK-LOCK-280',
    category: 'Access Control & Biometrics',
    categoryId: 'cat-access',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hardware-accessory.svg'],
    primaryImage: '/images/products/hardware-accessory.svg',
    shortDescription: 'Fail-safe electromagnetic lock with 280kg holding force for wooden, glass, and metal doors.',
    description: 'Equipped with dry contact status signal output and dual-color LED lock indicator. Zero residual magnetism.',
    keyFeatures: ['280kg (600 lbs) static holding force', 'Dual voltage 12V/24V DC selectable', 'Built-in reverse current protection MOV', 'LED lock status indicator'],
    specifications: { holding_force: '280 kg (600 lbs)', voltage: '12V / 24V DC', led_feedback: true },
    specs: {
      holding_force: { label: 'Holding Force', value: '280 kg (600 lbs)', highlightValue: '280 kg', showInHighlights: true },
      led_feedback: { label: 'LED Feedback', value: true, highlightValue: 'LED Feedback', showInHighlights: true }
    },
    pricing: { regularPrice: 3200, currency: 'BDT' },
    inventory: { available: 40, status: 'in_stock' },
    unit: 'Set',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-zkteco-inbio260',
    name: 'ZKTeco InBio260 2-Door IP Biometric Access Control Panel',
    brand: 'ZKTeco',
    brandId: 'b-zkteco',
    modelNumber: 'inBio260',
    sku: 'ZK-INBIO-260',
    category: 'Access Control & Biometrics',
    categoryId: 'cat-access',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hardware-accessory.svg'],
    primaryImage: '/images/products/hardware-accessory.svg',
    shortDescription: 'Multi-door access controller carrying out fingerprint matching on internal hardware.',
    description: 'Supports 2 doors with 4 readers (2 inside and 2 outside). Full anti-passback and interlock features.',
    keyFeatures: ['2 doors access management', '3,000 fingerprint templates stored in controller', '30,000 card capacity', 'TCP/IP communication with SSL encryption'],
    specifications: { doors_supported: '2 Doors', user_capacity: '30000 Users', fingerprint_capacity: '3000 Prints', communication: 'TCP/IP & RS485' },
    specs: {
      doors_supported: { label: 'Doors', value: '2 Doors', highlightValue: '2 Doors', showInHighlights: true },
      communication: { label: 'Interface', value: 'TCP/IP & RS485', highlightValue: 'TCP/IP', showInHighlights: true }
    },
    pricing: { regularPrice: 18500, currency: 'BDT' },
    inventory: { available: 6, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isNew: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-03-25T10:00:00.000Z', // NEW ARRIVAL 3
    updatedAt: '2026-03-25T10:00:00.000Z'
  },

  // ==========================================
  // Category 4: Network Switches (cat-networking) - 5 items
  // ==========================================
  {
    id: 'prod-ruijie-es205gc-p',
    name: 'Ruijie Reyee RG-ES205GC-P 5-Port Gigabit Smart Cloud PoE Switch',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-ES205GC-P',
    sku: 'RG-ES205GC-P',
    category: 'Network Switches',
    categoryId: 'cat-networking',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/ruijie-switch.svg'],
    primaryImage: '/images/products/ruijie-switch.svg',
    shortDescription: 'Cloud-managed 5-port gigabit switch with 4 PoE+ ports and 54W power budget.',
    description: 'Compact steel desktop casing engineered for small CCTV setups and office IP phones. Free lifetime Ruijie Cloud management.',
    keyFeatures: ['5 x 10/100/1000 Mbps RJ45 ports', '4 ports 802.3af/at PoE+ with 54W total budget', 'Ruijie Cloud app remote management and reboot', 'IP camera recognition and CCTV loop prevention'],
    specifications: { ports: '5 Ports', poe_budget: '54 W', poe_support: true, switching_capacity: '10 Gbps', managed: true },
    specs: {
      ports: { label: 'Ports', value: '5 Ports', highlightValue: '5 Ports', showInHighlights: true },
      poe_budget: { label: 'PoE Budget', value: 54, highlightValue: '54 W', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE+', showInHighlights: true }
    },
    pricing: { regularPrice: 4800, currency: 'BDT' },
    inventory: { available: 30, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-ruijie-es209gc-p',
    name: 'Ruijie Reyee RG-ES209GC-P 9-Port Gigabit Smart Cloud PoE Switch',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-ES209GC-P',
    sku: 'RG-ES209GC-P',
    category: 'Network Switches',
    categoryId: 'cat-networking',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/ruijie-switch.svg'],
    primaryImage: '/images/products/ruijie-switch.svg',
    shortDescription: '9-port gigabit switch with 8 PoE+ ports delivering up to 120W power budget.',
    description: 'High power budget accommodates PTZ cameras and Wi-Fi 6 access points with seamless cloud rebooting.',
    keyFeatures: ['9 x Gigabit RJ45 ports', '8 ports 802.3af/at PoE+ with 120W power budget', 'Automatic IPC restart on camera freeze', 'Remote cable diagnostic testing from cloud app'],
    specifications: { ports: '9 Ports', poe_budget: '120 W', poe_support: true, switching_capacity: '18 Gbps', managed: true },
    specs: {
      ports: { label: 'Ports', value: '9 Ports', highlightValue: '9 Ports', showInHighlights: true },
      poe_budget: { label: 'PoE Budget', value: 120, highlightValue: '120 W', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE+', showInHighlights: true }
    },
    pricing: { regularPrice: 7500, currency: 'BDT' },
    inventory: { available: 20, status: 'in_stock' },
    unit: 'Unit',
    isPopular: true, // POPULAR 4
    isFeatured: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-ruijie-es216gc',
    name: 'Ruijie Reyee RG-ES216GC 16-Port Gigabit Unmanaged Switch',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-ES216GC',
    sku: 'RG-ES216GC',
    category: 'Network Switches',
    categoryId: 'cat-networking',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/ruijie-switch.svg'],
    primaryImage: '/images/products/ruijie-switch.svg',
    shortDescription: '16-port gigabit rackmount switch for non-PoE network aggregation and high-speed data transfer.',
    description: 'Sturdy 19-inch metal chassis with 32 Gbps non-blocking backplane switching capacity.',
    keyFeatures: ['16 x 10/100/1000 Mbps Gigabit ports', '19-inch rack-mountable with included brackets', 'Energy-efficient silent fanless operation', 'Built-in 6kV surge protection on all ports'],
    specifications: { ports: '16 Ports', poe_support: false, switching_capacity: '32 Gbps', managed: false },
    specs: {
      ports: { label: 'Ports', value: '16 Ports', highlightValue: '16 Ports', showInHighlights: true },
      switching_capacity: { label: 'Backplane', value: '32 Gbps', highlightValue: '32 Gbps', showInHighlights: true }
    },
    pricing: { regularPrice: 8900, currency: 'BDT' },
    inventory: { available: 15, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-enterprise-switch-req',
    name: 'Ruijie RG-NBS3100-24GT4SFP-P 24-Port Managed Gigabit PoE Switch',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-NBS3100-24GT4SFP-P',
    sku: 'RG-NBS3100-24P',
    category: 'Network Switches',
    categoryId: 'cat-networking',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/ruijie-switch.svg'],
    primaryImage: '/images/products/ruijie-switch.svg',
    shortDescription: '24-port Gigabit Layer 2 managed switch with 4 SFP fiber uplink ports and 370W PoE budget.',
    description: 'Designed for enterprise campus networks and corporate headquarters requiring VLAN segmentation and optical backhaul.',
    keyFeatures: ['24 x 10/100/1000 Mbps PoE+ ports', '4 x 1G SFP fiber optical uplink slots', '370W heavy-duty PoE power delivery', 'Layer 2 managed features: VLAN, QoS, IGMP Snooping, STP'],
    specifications: { ports: '24 Ports', poe_budget: '370 W', poe_support: true, switching_capacity: '56 Gbps', managed: true },
    specs: {
      ports: { label: 'Ports', value: '24 Ports', highlightValue: '24 Ports', showInHighlights: true },
      poe_budget: { label: 'PoE Budget', value: 370, highlightValue: '370 W', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE+', showInHighlights: true }
    },
    pricing: { regularPrice: 32000, currency: 'BDT' },
    inventory: { available: 6, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-ruijie-es224gc-p',
    name: 'Ruijie Reyee RG-ES224GC-P 24-Port Gigabit Smart Cloud PoE Switch',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-ES224GC-P',
    sku: 'RG-ES224GC-P',
    category: 'Network Switches',
    categoryId: 'cat-networking',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/ruijie-switch.svg'],
    primaryImage: '/images/products/ruijie-switch.svg',
    shortDescription: '24-port gigabit cloud switch with 24 PoE+ ports and 250W power budget.',
    description: 'Engineered for dense IP camera clusters and office Wi-Fi deployments with cloud dashboard visualization.',
    keyFeatures: ['24 x 10/100/1000 Mbps RJ45 PoE ports', '250W total power supply budget', 'Full Ruijie Cloud topology visualization', 'Port isolation and loop prevention'],
    specifications: { ports: '24 Ports', poe_budget: '250 W', poe_support: true, switching_capacity: '48 Gbps', managed: true },
    specs: {
      ports: { label: 'Ports', value: '24 Ports', highlightValue: '24 Ports', showInHighlights: true },
      poe_budget: { label: 'PoE Budget', value: 250, highlightValue: '250 W', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE+', showInHighlights: true }
    },
    pricing: { regularPrice: 24500, currency: 'BDT' },
    inventory: { available: 8, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isNew: true,
    isDemo: true,
    sample: true,
    createdAt: '2026-03-25T10:00:00.000Z', // NEW ARRIVAL 4
    updatedAt: '2026-03-25T10:00:00.000Z'
  },

  // ==========================================
  // Category 5: Access Points & Wi-Fi (cat-wifi) - 4 items
  // ==========================================
  {
    id: 'prod-ruijie-rap2200e',
    name: 'Ruijie Reyee RG-RAP2200(E) AC1300 Dual-Band Ceiling Access Point',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-RAP2200(E)',
    sku: 'RG-RAP2200-E',
    category: 'Access Points & Wi-Fi',
    categoryId: 'cat-wifi',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/ruijie-wifi6.png'],
    primaryImage: '/images/hero/ruijie-wifi6.png',
    shortDescription: 'Enterprise high-concurrency ceiling access point delivering 1267 Mbps combined throughput.',
    description: 'Supports up to 110 concurrent clients with seamless 802.11k/v/r roaming. Powered via standard 802.3af PoE.',
    keyFeatures: ['Dual band 2.4GHz (400Mbps) + 5GHz (867Mbps)', 'Dual Gigabit LAN Ethernet ports', 'Supports Reyee Mesh wireless backhaul', 'Free cloud management and guest portal'],
    specifications: { wifi_standard: 'AC1300', max_speed: '1267 Mbps', poe_support: true, form_factor: 'Ceiling' },
    specs: {
      wifi_standard: { label: 'Standard', value: 'AC1300', highlightValue: 'AC1300', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE', showInHighlights: true }
    },
    pricing: { regularPrice: 6200, currency: 'BDT' },
    inventory: { available: 25, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-ruijie-rap2260g',
    name: 'Ruijie Reyee RG-RAP2260(G) Wi-Fi 6 AX1800 Multi-Gigabit AP',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-RAP2260(G)',
    sku: 'RG-RAP2260-G',
    category: 'Access Points & Wi-Fi',
    categoryId: 'cat-wifi',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/ruijie-wifi6.png'],
    primaryImage: '/images/hero/ruijie-wifi6.png',
    shortDescription: 'Next-gen Wi-Fi 6 dual-band ceiling AP with OFDMA, MU-MIMO and 1775 Mbps throughput.',
    description: 'High performance enterprise AP designed for crowded meeting rooms, classrooms, and hotel lobbies.',
    keyFeatures: ['Wi-Fi 6 (802.11ax) up to 1.775 Gbps', 'Up to 512 client capacity (110 recommended)', 'Gigabit PoE port + secondary Gigabit LAN port', 'Layer 3 roaming and WPA3 security'],
    specifications: { wifi_standard: 'Wi-Fi 6 AX1800', max_speed: '1775 Mbps', poe_support: true, form_factor: 'Ceiling' },
    specs: {
      wifi_standard: { label: 'Standard', value: 'Wi-Fi 6 AX1800', highlightValue: 'Wi-Fi 6', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE', showInHighlights: true }
    },
    pricing: { regularPrice: 11500, currency: 'BDT' },
    inventory: { available: 16, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-ruijie-rap1200f',
    name: 'Ruijie Reyee RG-RAP1200(F) Dual-Band AC1200 In-Wall Plate AP',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-RAP1200(F)',
    sku: 'RG-RAP1200-F',
    category: 'Access Points & Wi-Fi',
    categoryId: 'cat-wifi',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/ruijie-wifi6.png'],
    primaryImage: '/images/hero/ruijie-wifi6.png',
    shortDescription: 'Standard 86mm wall-switch box mount AP with front Ethernet port for hotel rooms and dorms.',
    description: 'Flushes cleanly into wall electrical backboxes. Provides in-room Wi-Fi plus wired IPTV or IP phone connectivity.',
    keyFeatures: ['Standard 86-type electrical outlet installation', '1167 Mbps dual band concurrent speed', 'Front-facing 10/100 Mbps RJ45 jack', 'Centralized management via Ruijie Cloud app'],
    specifications: { wifi_standard: 'AC1200', max_speed: '1167 Mbps', poe_support: true, form_factor: 'Wall Plate' },
    specs: {
      wifi_standard: { label: 'Standard', value: 'AC1200', highlightValue: 'AC1200', showInHighlights: true },
      poe_support: { label: 'PoE Support', value: true, highlightValue: 'PoE', showInHighlights: true }
    },
    pricing: { regularPrice: 4900, currency: 'BDT' },
    inventory: { available: 20, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-ruijie-rap6260h',
    name: 'Ruijie Reyee RG-RAP6260(H) High-Power Outdoor Wi-Fi 6 AP',
    brand: 'Ruijie Networks',
    brandId: 'b-ruijie',
    modelNumber: 'RG-RAP6260(H)',
    sku: 'RG-RAP6260-H',
    category: 'Access Points & Wi-Fi',
    categoryId: 'cat-wifi',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/hero/ruijie-wifi6.png'],
    primaryImage: '/images/hero/ruijie-wifi6.png',
    shortDescription: 'IP68 weatherproof outdoor Wi-Fi 6 access point with omnidirectional smart antennas.',
    description: 'Provides long-range outdoor wireless coverage up to 300 meters for swimming pools, campuses, and parks.',
    keyFeatures: ['IP68 rating against torrential rain and dust', 'Wi-Fi 6 speed up to 5952 Mbps', 'Omnidirectional smart antenna array', '6kV lightning surge protection'],
    specifications: { wifi_standard: 'Wi-Fi 6 AX5950', max_speed: '5952 Mbps', poe_support: true, ip_rating: 'IP68' },
    specs: {
      wifi_standard: { label: 'Standard', value: 'Wi-Fi 6 AX5950', highlightValue: 'Wi-Fi 6', showInHighlights: true },
      ip_rating: { label: 'IP Rating', value: 'IP68', highlightValue: 'IP68', showInHighlights: true }
    },
    pricing: { regularPrice: 24000, currency: 'BDT' },
    inventory: { available: 6, status: 'in_stock' },
    unit: 'Unit',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },

  // ==========================================
  // Category 6: Surveillance Storage (cat-storage) - 4 items
  // ==========================================
  {
    id: 'prod-wd-purple-500gb',
    name: 'Western Digital Purple 500GB 3.5" Surveillance Internal HDD',
    brand: 'Western Digital',
    brandId: 'b-wd',
    modelNumber: 'WD5000PURZ',
    sku: 'WD-PURPLE-500GB',
    category: 'Surveillance Storage',
    categoryId: 'cat-storage',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/surveillance-hdd.svg'],
    primaryImage: '/images/products/surveillance-hdd.svg',
    shortDescription: 'Engineered specifically for 24/7 continuous high-definition surveillance recording.',
    description: 'AllFrame technology reduces frame loss and improves video playback quality in security systems.',
    keyFeatures: ['Engineered specifically for surveillance security systems', 'Supports up to 64 HD surveillance cameras', 'Reduced video frame loss with AllFrame technology', '1 million hours MTBF reliability rating'],
    specifications: { capacity: '500 GB', form_factor: '3.5-inch', interface: 'SATA 6 Gb/s' },
    specs: {
      capacity: { label: 'Capacity', value: '500 GB', highlightValue: '500 GB', showInHighlights: true },
      form_factor: { label: 'Form Factor', value: '3.5-inch', highlightValue: '3.5"', showInHighlights: true }
    },
    pricing: { regularPrice: 1800, currency: 'BDT' },
    inventory: { available: 35, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-wd-purple-1tb',
    name: 'Western Digital Purple 1TB 3.5" Surveillance Internal HDD',
    brand: 'Western Digital',
    brandId: 'b-wd',
    modelNumber: 'WD10PURZ',
    sku: 'WD-PURPLE-1TB',
    category: 'Surveillance Storage',
    categoryId: 'cat-storage',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/surveillance-hdd.svg'],
    primaryImage: '/images/products/surveillance-hdd.svg',
    shortDescription: '1TB 24/7 surveillance hard disk with AllFrame caching and 64MB cache buffer.',
    description: 'Handles write-heavy surveillance workloads up to 180 TB/year in home and retail security installations.',
    keyFeatures: ['1TB capacity optimized for surveillance', 'Workload rating up to 180 TB/year', 'AllFrame 4K firmware technology', '3-year manufacturer hardware warranty'],
    specifications: { capacity: '1 TB', form_factor: '3.5-inch', interface: 'SATA 6 Gb/s' },
    specs: {
      capacity: { label: 'Capacity', value: '1 TB', highlightValue: '1 TB', showInHighlights: true },
      form_factor: { label: 'Form Factor', value: '3.5-inch', highlightValue: '3.5"', showInHighlights: true }
    },
    pricing: { regularPrice: 4800, currency: 'BDT' },
    inventory: { available: 40, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-wd-purple-2tb',
    name: 'Western Digital Purple 2TB 3.5" Surveillance Internal HDD',
    brand: 'Western Digital',
    brandId: 'b-wd',
    modelNumber: 'WD20PURZ',
    sku: 'WD-PURPLE-2TB',
    category: 'Surveillance Storage',
    categoryId: 'cat-storage',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/surveillance-hdd.svg'],
    primaryImage: '/images/products/surveillance-hdd.svg',
    shortDescription: '2TB enterprise surveillance drive with 64MB cache and tarnish-resistant components.',
    description: 'Designed for systems with up to 64 HD cameras. Provides 2-3 weeks continuous archival for typical 4-8 camera setups.',
    keyFeatures: ['2TB continuous recording space', 'Tarnish-resistant components for harsh DVR enclosures', 'Supports up to 64 streams per drive', 'Low power consumption design'],
    specifications: { capacity: '2 TB', form_factor: '3.5-inch', interface: 'SATA 6 Gb/s' },
    specs: {
      capacity: { label: 'Capacity', value: '2 TB', highlightValue: '2 TB', showInHighlights: true },
      form_factor: { label: 'Form Factor', value: '3.5-inch', highlightValue: '3.5"', showInHighlights: true }
    },
    pricing: { regularPrice: 6900, currency: 'BDT' },
    inventory: { available: 22, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'prod-st-skyhawk-4tb',
    name: 'Seagate SkyHawk 4TB Surveillance Internal Hard Drive 3.5"',
    brand: 'Seagate',
    brandId: 'b-seagate',
    modelNumber: 'ST4000VX016',
    sku: 'ST-SKYHAWK-4TB',
    category: 'Surveillance Storage',
    categoryId: 'cat-storage',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/surveillance-hdd.svg'],
    primaryImage: '/images/products/surveillance-hdd.svg',
    shortDescription: '4TB surveillance hard drive with ImagePerfect firmware for crystal-clear video streaming.',
    description: 'Custom-built for NVR systems with built-in rotational vibration sensors for reliable multi-bay enclosures.',
    keyFeatures: ['ImagePerfect firmware supports 64 cameras', 'Rotational vibration sensors for multi-bay NVRs', '180TB/year workload rating', '1M hours MTBF rating'],
    specifications: { capacity: '4 TB', form_factor: '3.5-inch', interface: 'SATA 6 Gb/s' },
    specs: {
      capacity: { label: 'Capacity', value: '4 TB', highlightValue: '4 TB', showInHighlights: true },
      form_factor: { label: 'Form Factor', value: '3.5-inch', highlightValue: '3.5"', showInHighlights: true }
    },
    pricing: { regularPrice: 11200, currency: 'BDT' },
    inventory: { available: 15, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },

  // ==========================================
  // Category 7: Cables & Accessories (cat-cables) - 3 items
  // ==========================================
  {
    id: 'cable-cat6',
    name: 'D-Link CAT6 UTP 23AWG Pure Solid Copper Cable (305m Box)',
    brand: 'D-Link',
    brandId: 'b-dlink',
    modelNumber: 'NCB-C6UBLUR-305',
    sku: 'DL-CAT6-305M',
    category: 'Cables & Accessories',
    categoryId: 'cat-cables',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hardware-accessory.svg'],
    primaryImage: '/images/products/hardware-accessory.svg',
    shortDescription: 'Premium 23 AWG 100% solid electrolytic copper conductor cable for Gigabit Ethernet & PoE.',
    description: 'Delivers full Gigabit data rates and heavy PoE power without voltage drops up to 100 meters standard.',
    keyFeatures: ['100% Bare Electrolytic Solid Copper Conductor', 'Tested up to 250 MHz frequency bandwidth', 'Flame-retardant PVC jacket', 'Certified for 802.3af/at PoE+ transmission'],
    specifications: { cable_type: 'CAT6 UTP', length: '305m Box', conductor: '100% Solid Copper 23 AWG' },
    specs: {
      cable_type: { label: 'Standard', value: 'CAT6 UTP', highlightValue: 'CAT6 UTP', showInHighlights: true },
      length: { label: 'Length', value: '305m Box', highlightValue: '305m', showInHighlights: true }
    },
    pricing: { regularPrice: 9800, currency: 'BDT' },
    inventory: { available: 15, status: 'in_stock' },
    unit: 'Box',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'acc-power',
    name: 'CamneX Central 12V 10A 9-Channel Metal Cased Power Supply Box',
    brand: 'CamneX Pro',
    brandId: 'b-hikvision',
    modelNumber: 'PS-12V10A-9CH',
    sku: 'ACC-PWR-9CH',
    category: 'Cables & Accessories',
    categoryId: 'cat-cables',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hardware-accessory.svg'],
    primaryImage: '/images/products/hardware-accessory.svg',
    shortDescription: 'Regulated 12V DC centralized power distribution unit with 9 individual PTC auto-reset fuses.',
    description: 'Key-lockable steel enclosure with LED channel indicators. Prevents whole-system shutdowns during single-camera shorts.',
    keyFeatures: ['9 individually fused DC output channels', 'PTC auto-resettable fuses (no glass replacement required)', 'Heavy gauge ventilated metal box with key lock', 'Built-in EMI filter and surge protection'],
    specifications: { output_voltage: '12V DC', total_current: '10 Amperes', channels: '9 Channels' },
    specs: {
      output_voltage: { label: 'Output', value: '12V DC', highlightValue: '12V 10A', showInHighlights: true },
      channels: { label: 'Outputs', value: '9 Channels', highlightValue: '9 CH', showInHighlights: true }
    },
    pricing: { regularPrice: 1800, currency: 'BDT' },
    inventory: { available: 40, status: 'in_stock' },
    unit: 'Piece',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'acc-balun',
    name: 'Passive HD Video Balun & DC Power Pigtails (Per Camera Kit)',
    brand: 'CamneX Pro',
    brandId: 'b-hikvision',
    modelNumber: 'BALUN-HD-KIT',
    sku: 'ACC-BALUN-KIT',
    category: 'Cables & Accessories',
    categoryId: 'cat-cables',
    productType: 'physical',
    status: 'active',
    websiteVisible: true,
    posAvailable: true,
    images: ['/images/products/hardware-accessory.svg'],
    primaryImage: '/images/products/hardware-accessory.svg',
    shortDescription: 'High-definition passive video transceiver pair supporting TVI, AHD, and CVI signals over UTP cable.',
    description: 'Gold-plated BNC connectors and tool-free push-pin terminal blocks for clear video transmission up to 250m.',
    keyFeatures: ['Compatible with HD-TVI, HD-CVI, AHD, and CVBS', 'Built-in transient suppression protection', 'Tool-free spring terminal connections', 'Up to 250m transmission distance'],
    specifications: { connector_type: 'BNC to Terminal', compatibility: 'TVI/CVI/AHD' },
    specs: {
      compatibility: { label: 'Standard', value: 'TVI/CVI/AHD', highlightValue: 'HD-TVI/AHD', showInHighlights: true }
    },
    pricing: { regularPrice: 250, currency: 'BDT' },
    inventory: { available: 200, status: 'in_stock' },
    unit: 'Set',
    isPopular: false,
    isDemo: true,
    sample: true,
    createdAt: '2026-01-05T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  }
];

// Clean Neutral Testimonials without fake stock faces or gibberish
products.push(...[
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
  }
]);

const sampleTestimonials = [
  {
    id: 't-1',
    author: 'Sample Customer 1',
    role: 'Operations Director',
    content: 'Professional IP camera installation and fiber backhaul across our commercial premises. Reliable system with clean cabling.',
    rating: 5,
    sample: true,
    avatar: ''
  },
  {
    id: 't-2',
    author: 'Sample Customer 2',
    role: 'Facilities Manager',
    content: 'Seamless biometric attendance and door access control integration. Software reports generated accurately every month.',
    rating: 5,
    sample: true,
    avatar: ''
  },
  {
    id: 't-3',
    author: 'Sample Customer 3',
    role: 'Logistics Supervisor',
    content: '16-channel AcuSense surveillance setup covering warehouse loading bays. Night vision quality and playback clarity are excellent.',
    rating: 5,
    sample: true,
    avatar: ''
  }
];

// Clean Neutral Project Case Studies
const sampleProjects = [
  {
    id: 'proj-1',
    title: 'Commercial Corporate Office Security Deployment',
    client: 'Sample Corporate Client',
    category: 'Commercial Surveillance',
    description: 'Complete 32-camera 4K IP surveillance network with biometric turnstile entry integration.',
    thumbnail: '/images/hero/hikvision-bullet.png',
    sample: true,
    scope: ['32 4K IP Dome Cameras', 'Biometric Turnstiles', '10G Fiber Uplink']
  },
  {
    id: 'proj-2',
    title: 'Manufacturing Facility Perimeter Protection',
    client: 'Sample Industrial Client',
    category: 'Industrial Security',
    description: 'Long-range thermal and optical perimeter tracking with centralized monitoring control room.',
    thumbnail: '/images/hero/hikvision-bullet.png',
    sample: true,
    scope: ['Perimeter Starlight Cameras', 'AcuSense AI Analytics', 'Central DVR Wall']
  },
  {
    id: 'proj-3',
    title: 'Multi-Floor Campus Wi-Fi 6 & Access Network',
    client: 'Sample Education Campus',
    category: 'Enterprise Networking',
    description: 'High-density ceiling access point installation covering lecture halls and administrative offices.',
    thumbnail: '/images/hero/ruijie-wifi6.png',
    sample: true,
    scope: ['24 Wi-Fi 6 APs', 'Layer 3 Managed PoE Switches', 'Cloud Controller']
  }
];

seeds.INITIAL_PRODUCTS = products;
seeds.INITIAL_TESTIMONIALS = sampleTestimonials;
seeds.INITIAL_PROJECTS = sampleProjects;

// Update package 2 to use prod-hik-color-2mp
seeds.INITIAL_PACKAGES.forEach(pkg => {
  if (pkg.id === 'pkg-cctv-4cam-color') {
    pkg.rules.forEach(r => {
      if (r.role === 'camera') {
        r.defaultModelId = 'prod-hik-color-2mp';
      }
    });
  }
});

// Spec templates shortLabel update
seeds.INITIAL_SPEC_TEMPLATES = [
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
    id: 'tpl-recorders',
    name: 'Recorders (DVR / NVR)',
    categorySlug: 'recorders',
    fields: [
      { id: 'f-ch', name: 'Channels', key: 'channels', type: 'enum', options: ['4 CH', '8 CH', '16 CH', '32 CH'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Channels', order: 1 },
      { id: 'f-comp', name: 'Compression', key: 'compression', type: 'enum', options: ['H.264', 'H.265', 'H.265+', 'H.265 Pro+', 'AI Coding (H.265+)'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Compression', order: 2 },
      { id: 'f-res-rec', name: 'Max Resolution', key: 'max_resolution', type: 'enum', options: ['1080p Lite', '5MP Lite', '4K (8MP)'], filterable: true, comparable: true, shortLabel: 'Resolution', order: 3 },
      { id: 'f-hdd', name: 'SATA Slots', key: 'hdd_slots', type: 'enum', options: ['1 SATA Slot', '2 SATA Slots', '4 SATA Slots'], filterable: true, comparable: true, shortLabel: 'SATA Bays', order: 4 }
    ]
  },
  {
    id: 'tpl-access',
    name: 'Access Control & Biometrics',
    categorySlug: 'biometrics-access-control',
    fields: [
      { id: 'f-users', name: 'User Capacity', key: 'user_capacity', type: 'enum', options: ['1000 Users', '3000 Users', '5000 Users', '10000 Users', '30000 Users'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Capacity', order: 1 },
      { id: 'f-verif', name: 'Verification Methods', key: 'verification_methods', type: 'string', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Verification', order: 2 },
      { id: 'f-conn', name: 'Connectivity', key: 'connectivity', type: 'enum', options: ['USB Only', 'TCP/IP & USB', 'TCP/IP & Wi-Fi', 'TCP/IP & Wiegand', 'TCP/IP & RS485'], filterable: true, comparable: true, shortLabel: 'Network', order: 3 },
      { id: 'f-bat', name: 'Battery Backup', key: 'battery_backup', type: 'boolean', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Battery', order: 4 }
    ]
  },
  {
    id: 'tpl-networking',
    name: 'Network Switches',
    categorySlug: 'network-switches',
    fields: [
      { id: 'f-ports', name: 'Port Count', key: 'ports', type: 'enum', options: ['5 Ports', '9 Ports', '16 Ports', '24 Ports'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Ports', order: 1 },
      { id: 'f-poe', name: 'PoE Support', key: 'poe_support', type: 'boolean', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'PoE', order: 2 },
      { id: 'f-budget', name: 'PoE Budget', key: 'poe_budget', type: 'number', unit: 'W', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'PoE Budget', order: 3 },
      { id: 'f-cap', name: 'Switching Capacity', key: 'switching_capacity', type: 'string', filterable: true, comparable: true, shortLabel: 'Backplane', order: 4 },
      { id: 'f-mgd', name: 'Cloud Managed', key: 'managed', type: 'boolean', filterable: true, comparable: true, shortLabel: 'Managed', order: 5 }
    ]
  },
  {
    id: 'tpl-wifi',
    name: 'Access Points & Wi-Fi',
    categorySlug: 'access-points-wifi',
    fields: [
      { id: 'f-wifistd', name: 'Wi-Fi Standard', key: 'wifi_standard', type: 'enum', options: ['Wi-Fi 5 (802.11ac)', 'Wi-Fi 6 (802.11ax)', 'AC1200', 'AC1300', 'Wi-Fi 6 AX1800', 'Wi-Fi 6 AX5950'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Wi-Fi Std', order: 1 },
      { id: 'f-speed', name: 'Max Speed', key: 'max_speed', type: 'string', filterable: true, comparable: true, shortLabel: 'Max Speed', order: 2 },
      { id: 'f-poewifi', name: 'PoE Support', key: 'poe_support', type: 'boolean', filterable: true, comparable: true, showInHighlights: true, shortLabel: 'PoE', order: 3 },
      { id: 'f-formwifi', name: 'Form Factor', key: 'form_factor', type: 'enum', options: ['Ceiling', 'Wall Plate', 'Outdoor'], filterable: true, comparable: true, shortLabel: 'Mounting', order: 4 }
    ]
  },
  {
    id: 'tpl-storage',
    name: 'Surveillance Storage',
    categorySlug: 'surveillance-storage',
    fields: [
      { id: 'f-capst', name: 'Capacity', key: 'capacity', type: 'enum', options: ['500 GB', '1 TB', '2 TB', '4 TB', '6 TB', '8 TB'], filterable: true, comparable: true, showInHighlights: true, shortLabel: 'Capacity', order: 1 },
      { id: 'f-ffst', name: 'Form Factor', key: 'form_factor', type: 'enum', options: ['3.5-inch', '2.5-inch'], filterable: true, comparable: true, shortLabel: 'Form Factor', order: 2 },
      { id: 'f-intst', name: 'Interface', key: 'interface', type: 'enum', options: ['SATA 6 Gb/s'], filterable: true, comparable: true, shortLabel: 'Interface', order: 3 }
    ]
  }
];

seeds.INITIAL_HERO_SLIDES.forEach(h => {
  if (h.id === 'slide-2') {
    h.productId = 'prod-ruijie-rap2200e';
    h.image = '/images/hero/ruijie-wifi6.png';
  }
  if (h.id === 'slide-3') {
    h.image = '/images/hero/zkteco-biometric.png';
  }
});

fs.writeFileSync(seedsPath, JSON.stringify(seeds, null, 2));
console.log('Successfully written ' + products.length + ' products, templates, testimonials, and projects to serverSeeds.json');
