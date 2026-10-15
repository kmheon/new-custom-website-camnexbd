import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  ShoppingBag,
  ShieldCheck,
  HardDrive,
  Cpu,
  Cable,
  Zap,
  ArrowRight,
  ArrowLeft,
  Tv,
  Check,
  Copy,
  Download,
  FileText,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
  Eye,
  Wifi,
  Video,
  Radio,
  Server,
  Settings2,
  Wrench,
  X,
  Plus,
  Minus,
  AlertTriangle,
  Phone,
  Mail,
  User,
  Building,
  MapPin,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { packageService, productService, quoteService } from '../services';
import {
  SecurityPackage,
  CameraFormFactor,
  CameraSeriesId,
  CameraCategoryId,
  SpecialistSubcategory,
  Product
} from '../types';
import { useCartStore } from '../store';

const getProductPrice = (prod: Product | undefined | null): number | null => {
  if (!prod) return null;
  return prod.pricing?.regularPrice ?? (prod as any).price ?? null;
};

const getProductBrand = (prod: Product | undefined | null, fallback = 'Hikvision'): string => {
  if (!prod) return fallback;
  return prod.brand || (prod as any).brand_name || fallback;
};

export type SystemArch = 'analogue' | 'ip' | 'wireless';
export type NightVisionMode = 'ir' | 'hybrid' | 'colorvu';
export type StorageOption = '500gb' | '1tb' | '2tb' | '4tb' | 'none';
export type MonitorOption = 'none' | '17inch' | '19inch' | 'large';

export interface PackageBuilderPageProps {
  onNavigate: (route: string, param?: string) => void;
  packageSlug?: string;
}

export interface BomItem {
  role: string;
  name: string;
  model: string;
  sku: string;
  qty: number;
  unitPrice: number | null;
  lineTotal: number | null;
  specs?: string;
}

export interface CameraSeriesConfig {
  id: CameraSeriesId;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  recommendedFor: string;
  cablingNote: string;
  categories: CameraCategoryId[];
}

export interface CameraCategoryConfig {
  id: CameraCategoryId;
  seriesId: CameraSeriesId;
  name: string;
  badge: string;
  description: string;
  defaultFormFactor: CameraFormFactor;
  supportedFormFactors?: CameraFormFactor[];
  isStocked: boolean;
  specsSummary: string;
}

export const CAMERA_SERIES_CONFIG: CameraSeriesConfig[] = [
  {
    id: 'analogue',
    name: '1. Analogue / HD Series',
    badge: 'Coaxial Infrastructure · Best Value',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'Direct point-to-point solid copper coaxial transmission with zero network latency and Audio Over Coax (AoC).',
    recommendedFor: 'Homes, standalone retail shops, warehouses & budget-conscious installations.',
    cablingNote: 'Solid RG59/RG6 Copper Coaxial · 10m/camera included · Zero network bandwidth overhead',
    categories: ['analogue_bullet', 'analogue_dome', 'analogue_turret', 'analogue_box', 'analogue_ptz']
  },
  {
    id: 'ip',
    name: '2. IP Series',
    badge: 'Cat6 PoE · Enterprise Edge AI',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'High-definition digital surveillance streaming over Cat6 Ethernet with 48V Power-over-Ethernet (PoE) and edge AI analytics.',
    recommendedFor: 'Corporate offices, educational institutions, factories, multi-branch banks & campuses.',
    cablingNote: 'Digital Cat6 UTP Cabling · 48V PoE (802.3af/at) · Surveillance VLAN isolated · Up to 100m runs',
    categories: ['ip_poe', 'ip_smart_ai', 'ip_multi_sensor', 'ip_fisheye', 'ip_specialized']
  },
  {
    id: 'wireless',
    name: '3. Wireless Series',
    badge: 'Wi-Fi & Cellular · Fast Deployment',
    badgeColor: 'bg-purple-100 text-purple-800',
    description: 'Direct-to-app wireless surveillance streaming over 2.4GHz Wi-Fi or 4G LTE cellular with zero video cabling.',
    recommendedFor: 'Rental apartments, boutique stores, construction yards & off-grid agricultural sites.',
    cablingNote: 'No video cable required · Requires local 220V AC or solar/battery power · Wi-Fi / 4G LTE',
    categories: ['wifi_smart', 'wifi_cellular', 'wifi_solar', 'wifi_battery', 'wifi_pinhole', 'wifi_two_way_audio']
  }
];

export const CAMERA_CATEGORIES_CONFIG: Record<CameraCategoryId, CameraCategoryConfig> = {
  // Analogue / HD Series
  analogue_bullet: {
    id: 'analogue_bullet',
    seriesId: 'analogue',
    name: '1. Bullet Cameras',
    badge: 'Outdoor Standard',
    description: 'Weatherproof cylindrical housing with protective sunshield. Ideal for perimeters, boundary walls, and gate entrances.',
    defaultFormFactor: 'bullet',
    isStocked: true,
    specsSummary: '1080p to 3K, IP67 weatherproof housing, solid copper coax transmission.'
  },
  analogue_dome: {
    id: 'analogue_dome',
    seriesId: 'analogue',
    name: '2. Dome Cameras',
    badge: 'Indoor Vandal-Resistant',
    description: 'Impact-resistant ceiling-mount dome. Ideal for retail stores, reception desks, and indoor commercial ceilings.',
    defaultFormFactor: 'dome',
    isStocked: true,
    specsSummary: 'IK10 vandal rating, discreet profile, low-profile indoor aesthetic.'
  },
  analogue_turret: {
    id: 'analogue_turret',
    seriesId: 'analogue',
    name: '3. Turret / Eyeball Cameras',
    badge: 'Zero IR Glare',
    description: 'Flexible 3-axis ball-and-socket design separating IR LED from lens, preventing spider webs and IR light bounce.',
    defaultFormFactor: 'turret',
    isStocked: true,
    specsSummary: 'Zero IR reflection, easy multi-axis aiming, indoor & outdoor versatile.'
  },
  analogue_box: {
    id: 'analogue_box',
    seriesId: 'analogue',
    name: '4. Box / C-Mount Cameras',
    badge: 'Custom Optical Lenses',
    description: 'Interchangeable varifocal C/CS mount lenses for extreme focal distances, toll booths, and specialized lighting.',
    defaultFormFactor: 'other',
    isStocked: false,
    specsSummary: 'Interchangeable C/CS lens mount, auto-iris control, outdoor housing required.'
  },
  analogue_ptz: {
    id: 'analogue_ptz',
    seriesId: 'analogue',
    name: '5. PTZ Speed Dome Cameras',
    badge: 'Motorized 25x Zoom',
    description: 'High-speed pan-tilt-zoom with preset patrol routes for large open yards, storage depots, and active perimeter monitoring.',
    defaultFormFactor: 'ptz',
    isStocked: true,
    specsSummary: '360° endless pan, 25x optical zoom, RS-485 / UTC telemetry control.'
  },

  // IP Series
  ip_poe: {
    id: 'ip_poe',
    seriesId: 'ip',
    name: '1. PoE Network Cameras',
    badge: 'IEEE 802.3af Standard',
    description: 'Standard Power-over-Ethernet network cameras carrying 4K video, audio, and power over single Cat6 cable up to 100m.',
    defaultFormFactor: 'bullet',
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    isStocked: true,
    specsSummary: '48V PoE direct plug-and-play, H.265+ compression, surveillance VLAN isolated.'
  },
  ip_smart_ai: {
    id: 'ip_smart_ai',
    seriesId: 'ip',
    name: '2. Smart AI Edge Cameras',
    badge: 'AcuSense Analytics',
    description: 'Deep-learning hardware analytics filtering humans and vehicles with >98% false-alarm reduction and tripwire perimeter alarms.',
    defaultFormFactor: 'bullet',
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    isStocked: true,
    specsSummary: 'AcuSense deep learning edge classification, perimeter line-crossing, strobe & siren.'
  },
  ip_multi_sensor: {
    id: 'ip_multi_sensor',
    seriesId: 'ip',
    name: '3. Multi-Sensor Cameras',
    badge: '180° Seamless Stitching',
    description: 'Multiple synchronized image sensors in a single housing providing ultra-wide panoramic coverage without blind spots.',
    defaultFormFactor: 'other',
    isStocked: false,
    specsSummary: 'Multi-channel 180° / 360° seamless optical stitch, high-density client monitoring.'
  },
  ip_fisheye: {
    id: 'ip_fisheye',
    seriesId: 'ip',
    name: '4. Fisheye Panoramic Cameras',
    badge: '360° Hemispheric View',
    description: 'Single ultra-wide 360-degree lens with real-time software dewarping for retail floors, warehouses, and open halls.',
    defaultFormFactor: 'dome',
    isStocked: false,
    specsSummary: '12MP ultra-high resolution, ePTZ multi-quad dewarping, ceiling flush mount.'
  },
  ip_specialized: {
    id: 'ip_specialized',
    seriesId: 'ip',
    name: '5. Specialized Cameras',
    badge: 'Mission-Critical',
    description: 'Enterprise mission-critical imaging including ANPR plate recognition, thermographic heat detection, and industrial enclosures.',
    defaultFormFactor: 'bullet',
    isStocked: false,
    specsSummary: 'DeepinView LPR / Bispectral thermography / Stainless steel 316L explosion-proof.'
  },

  // Wireless Series
  wifi_smart: {
    id: 'wifi_smart',
    seriesId: 'wireless',
    name: '1. Smart Wi-Fi Cameras',
    badge: 'App Controlled',
    description: 'Plug-and-play 2.4GHz Wi-Fi with smartphone remote viewing, AI human tracking, and cloud/local microSD recording.',
    defaultFormFactor: 'bullet',
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    isStocked: true,
    specsSummary: 'Direct Wi-Fi streaming, EZVIZ/Imou mobile app, micro-SD slot, dual-antenna.'
  },
  wifi_cellular: {
    id: 'wifi_cellular',
    seriesId: 'wireless',
    name: '2. 4G / 5G Cellular Cameras',
    badge: 'SIM Card Standalone',
    description: 'Standalone 4G LTE cellular connectivity for remote construction sites, agricultural farms, and off-grid facilities.',
    defaultFormFactor: 'bullet',
    isStocked: false,
    specsSummary: 'Micro-SIM 4G LTE uplink, low-bandwidth data optimization, IP66 enclosure.'
  },
  wifi_solar: {
    id: 'wifi_solar',
    seriesId: 'wireless',
    name: '3. Solar-Powered Cameras',
    badge: '100% Wire-Free',
    description: 'Integrated solar panel with rechargeable lithium battery pack for zero-wiring continuous monitoring.',
    defaultFormFactor: 'bullet',
    isStocked: false,
    specsSummary: 'Monocrystalline solar module, MPPT solar controller, high-capacity lithium battery.'
  },
  wifi_battery: {
    id: 'wifi_battery',
    seriesId: 'wireless',
    name: '4. Battery-Powered Cameras',
    badge: 'PIR Low-Power Standby',
    description: 'Ultra-low power PIR wake-up cameras running up to 180 days on internal rechargeable battery.',
    defaultFormFactor: 'bullet',
    isStocked: false,
    specsSummary: 'PIR motion detection wake-up, ultra-fast 0.6s recording trigger, rechargeable cell.'
  },
  wifi_pinhole: {
    id: 'wifi_pinhole',
    seriesId: 'wireless',
    name: '5. Pinhole / Covert Cameras',
    badge: 'Hidden Surveillance',
    description: 'Miniature covert lens for ATM machines, bank counters, VIP executive rooms, and hidden surveillance.',
    defaultFormFactor: 'other',
    isStocked: false,
    specsSummary: '2mm conical pinhole lens, separated processing unit, discrete installation.'
  },
  wifi_two_way_audio: {
    id: 'wifi_two_way_audio',
    seriesId: 'wireless',
    name: '6. Two-Way Audio Cameras',
    badge: 'Live Siren & Talk',
    description: 'Built-in high-sensitivity microphone, high-decibel loudspeaker, and strobe siren for live real-time two-way deterrence.',
    defaultFormFactor: 'bullet',
    supportedFormFactors: ['bullet', 'dome', 'turret'],
    isStocked: true,
    specsSummary: 'High-gain microphone, 90dB active siren, two-way full-duplex intercom.'
  }
};

export const SPECIALIST_SUBCATEGORIES_CONFIG = [
  {
    id: 'anpr' as const,
    name: '1. License Plate Recognition (ANPR / LPR)',
    shortName: 'ANPR Plate Reader',
    badge: 'DeepinView LPR',
    badgeColor: 'bg-amber-100 text-amber-900',
    description: 'Hikvision DeepinView vehicle plate recognition, high-speed capture, and automatic barrier relay triggering.',
    model: 'iDS-2CD7A46G0/P-IZHS',
    note: 'Requires vehicle lane speed assessment, focal depth mapping, and gate relay integration.'
  },
  {
    id: 'thermal' as const,
    name: '2. Thermographic Heat Detection',
    shortName: 'Thermal Specialist',
    badge: 'Bispectral Thermal',
    badgeColor: 'bg-amber-100 text-amber-900',
    description: 'Bispectral thermal heat monitoring for electrical substations, critical server rooms, and early fire prevention.',
    model: 'DS-2TD2617B-3/PA (Thermal)',
    note: 'Requires certified thermal calibration, fire prevention survey, and high-temp perimeter mapping.'
  },
  {
    id: 'industrial' as const,
    name: '3. Industrial & Explosion-Proof',
    shortName: 'Industrial & Explosion-Proof',
    badge: 'ATEX / IECEx Rated',
    badgeColor: 'bg-amber-100 text-amber-900',
    description: 'Stainless steel 316L explosion-proof housing for oil refineries, chemical plants, and extreme marine environments.',
    model: 'DS-2XE6222F-IS/316L',
    note: 'ATEX/IECEx hazardous environment certification and customized stainless conduit design required.'
  }
];

export const PackageBuilderPage: React.FC<PackageBuilderPageProps> = ({
  onNavigate,
  packageSlug
}) => {
  const [packages, setPackages] = useState<SecurityPackage[]>([]);
  const [selectedBasePkg, setSelectedBasePkg] = useState<SecurityPackage | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Guided Steps: 1 = System, 2 = Cameras, 3 = Recorder & Storage, 4 = Accessories, 5 = BOM Review, 6 = Finalize
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Configuration State
  const [systemArch, setSystemArch] = useState<SystemArch>('analogue');
  const [cameraCount, setCameraCount] = useState<number>(4);
  const [cameraCategory, setCameraCategory] = useState<CameraCategoryId>('analogue_bullet');
  const [specialistSubcategory, setSpecialistSubcategory] = useState<SpecialistSubcategory>(null);
  const [formFactor, setFormFactor] = useState<CameraFormFactor>('bullet');
  const [specialistCapability, setSpecialistCapability] = useState<'none' | 'anpr' | 'thermal'>('none');
  const [nightVision, setNightVision] = useState<NightVisionMode>('ir');
  const [hasAudio, setHasAudio] = useState<boolean>(true);
  const [storageOption, setStorageOption] = useState<StorageOption>('1tb');
  const [monitorOption, setMonitorOption] = useState<MonitorOption>('none');
  const [customCableLength, setCustomCableLength] = useState<number | null>(null);
  const [analogueTransmission, setAnalogueTransmission] = useState<'coaxial' | 'utp_baluns'>('coaxial');
  const [copiedBOM, setCopiedBOM] = useState(false);
  const [downloadedBOM, setDownloadedBOM] = useState(false);
  const [incompatibilityAlert, setIncompatibilityAlert] = useState<string | null>(null);

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [selectedCameraProduct, setSelectedCameraProduct] = useState<Product | null>(null);
  const [selectedRecorderProduct, setSelectedRecorderProduct] = useState<Product | null>(null);
  const [showCameraPicker, setShowCameraPicker] = useState<boolean>(false);
  const [showRecorderPicker, setShowRecorderPicker] = useState<boolean>(false);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [customCountInput, setCustomCountInput] = useState<string>('4');

  // In-Page Quotation Modal State
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [quoteFormData, setQuoteFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    whatsapp: '',
    whatsappSameAsPhone: false,
    companyName: '',
    siteAddress: '',
    includeInstallation: true,
    notes: ''
  });
  const [quoteSubmitting, setQuoteSubmitting] = useState<boolean>(false);
  const [quoteSuccessResult, setQuoteSuccessResult] = useState<{ quoteNumber: string } | null>(null);
  const [quoteErrorMessage, setQuoteErrorMessage] = useState<string | null>(null);

  // BOM validity: 7 calendar days from issue date, stable across page reloads
  const [bomDates] = useState<{ issueDate: string; validUntilDate: string }>(() => {
    const key = 'camnex_bom_dates_v1';
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.issueDate && parsed.validUntilDate) {
          const expiryTime = new Date(parsed.validUntilDate).getTime();
          if (!isNaN(expiryTime) && expiryTime > Date.now() - 7 * 86400000) {
            return parsed;
          }
        }
      }
    } catch (_) {}
    const now = new Date();
    const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dates = {
      issueDate: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntilDate: expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    try {
      localStorage.setItem(key, JSON.stringify(dates));
    } catch (_) {}
    return dates;
  });

  const addItemToCart = useCartStore((s) => s.addItem);

  // Load catalog products from SQLite via productService
  useEffect(() => {
    productService.getProducts({ page: 1, limit: 100 } as any).then((res) => {
      const items = res?.items || (Array.isArray(res) ? res : []);
      setCatalogProducts(items);
      setLoadingCatalog(false);
    }).catch(() => {
      setLoadingCatalog(false);
    });
  }, []);

  // Architecture change handler with clean compatibility-aware revalidation
  const handleSelectArchitecture = (arch: SystemArch) => {
    setSystemArch(arch);
    let msg = '';

    // Synchronize category with architecture
    if (arch === 'analogue') {
      setCameraCategory('analogue_bullet');
      setFormFactor('bullet');
      setSpecialistCapability('none');
      setSpecialistSubcategory(null);
    } else if (arch === 'ip') {
      setCameraCategory('ip_poe');
      setFormFactor('bullet');
      setSpecialistCapability('none');
      setSpecialistSubcategory(null);
    } else if (arch === 'wireless') {
      setCameraCategory('wifi_smart');
      setFormFactor('bullet');
      setSpecialistCapability('none');
      setSpecialistSubcategory(null);
    }

    // Validate manual camera selection
    if (selectedCameraProduct) {
      const cat = selectedCameraProduct.categorySlug || selectedCameraProduct.categoryId || '';
      const name = (selectedCameraProduct.name || '').toLowerCase();
      const isIp = (cat === 'cctv-cameras' || cat === 'ip-cameras') && (name.includes('ip') || name.includes('poe'));
      const isWifi = cat.includes('wi-fi') || cat.includes('wifi');
      const isAnalogue = cat === 'cctv-cameras' && !isIp && !isWifi;

      if ((arch === 'ip' && !isIp) || (arch === 'wireless' && !isWifi) || (arch === 'analogue' && !isAnalogue)) {
        setSelectedCameraProduct(null);
        msg += `Previously selected camera model was reset to match ${arch.toUpperCase()} architecture. `;
      }
    }

    // Validate manual recorder selection
    if (selectedRecorderProduct) {
      const name = (selectedRecorderProduct.name || '').toLowerCase();
      const isNvr = name.includes('nvr');
      const isDvr = name.includes('dvr') || name.includes('xvr');
      if ((arch === 'ip' && !isNvr) || (arch === 'analogue' && !isDvr)) {
        setSelectedRecorderProduct(null);
        msg += `Previously selected recorder was reset to match ${arch.toUpperCase()} architecture. `;
      }
    }

    // If switching to wireless, validate limits: wireless max camera count in catalog is 8
    if (arch === 'wireless') {
      if (cameraCount > 8) {
        setCameraCount(8);
        setCustomCountInput('8');
        msg += 'Wi-Fi deployments are recommended up to 8 cameras per standard access point. Count adjusted to 8.';
      }
      if (formFactor === 'ptz') {
        setFormFactor('bullet');
      }
      setSpecialistCapability('none');
      setSpecialistSubcategory(null);
    }

    setIncompatibilityAlert(msg || null);
  };

  const handleSelectSeries = (series: CameraSeriesId) => {
    handleSelectArchitecture(series);
  };

  const handleSelectCameraCategory = (cat: CameraCategoryId) => {
    setCameraCategory(cat);
    setSelectedCameraProduct(null);

    // Mandatory Specialist Safeguard:
    // Specialist capability MUST be reset to 'none' when switching away from Specialized Cameras
    if (cat !== 'ip_specialized') {
      setSpecialistCapability('none');
      setSpecialistSubcategory(null);
    } else {
      setSpecialistCapability('anpr');
      setSpecialistSubcategory('anpr');
      setFormFactor('bullet');
    }

    // Set appropriate physical form factor based on category
    switch (cat) {
      case 'analogue_bullet':
        setFormFactor('bullet');
        break;
      case 'analogue_dome':
        setFormFactor('dome');
        break;
      case 'analogue_turret':
        setFormFactor('turret');
        break;
      case 'analogue_box':
        setFormFactor('other');
        break;
      case 'analogue_ptz':
        setFormFactor('ptz');
        break;
      case 'ip_poe':
      case 'ip_smart_ai':
        if (formFactor === 'ptz' || formFactor === 'other') setFormFactor('bullet');
        break;
      case 'ip_multi_sensor':
        setFormFactor('other');
        break;
      case 'ip_fisheye':
        setFormFactor('dome');
        break;
      case 'ip_specialized':
        setFormFactor('bullet');
        break;
      case 'wifi_smart':
      case 'wifi_two_way_audio':
        if (formFactor === 'other' || formFactor === 'ptz') setFormFactor('bullet');
        break;
      case 'wifi_cellular':
      case 'wifi_solar':
      case 'wifi_battery':
        setFormFactor('bullet');
        break;
      case 'wifi_pinhole':
        setFormFactor('other');
        break;
    }
  };

  const handleSelectSpecialistSubcategory = (sub: 'anpr' | 'thermal' | 'industrial') => {
    setSpecialistSubcategory(sub);
    if (sub === 'anpr') {
      setSpecialistCapability('anpr');
      setFormFactor('bullet');
    } else if (sub === 'thermal') {
      setSpecialistCapability('thermal');
      setFormFactor('bullet');
    } else if (sub === 'industrial') {
      setSpecialistCapability('none');
      setFormFactor('other');
    }
  };

  // Camera count update helper with boundary enforcement
  const handleUpdateCameraCount = (newCount: number) => {
    const maxLimit = systemArch === 'wireless' ? 8 : 128;
    const validCount = Math.max(1, Math.min(maxLimit, Math.floor(newCount) || 1));
    setCameraCount(validCount);
    setCustomCountInput(String(validCount));
  };

  // Load existing packages for reference
  useEffect(() => {
    packageService.getPackages().then((list) => {
      setPackages(list || []);
      setLoadingPackages(false);

      if (packageSlug && packageSlug !== 'custom' && packageSlug !== 'builder' && list.length > 0) {
        const found = list.find((p) => p.slug === packageSlug || p.id === packageSlug);
        if (found) {
          setSelectedBasePkg(found);
          // Initialize builder states from existing package
          if (found.systemTypeSlug === 'wireless') setSystemArch('wireless');
          else if (found.systemTypeSlug === 'ip') setSystemArch('ip');
          else setSystemArch('analogue');

          if (found.cameraCount) {
            setCameraCount(found.cameraCount);
            setCustomCountInput(String(found.cameraCount));
          }

          if (found.seriesId === 'series-colorvu' || found.name.toLowerCase().includes('color')) {
            setNightVision('colorvu');
          } else if (found.seriesId === 'series-hybrid' || found.name.toLowerCase().includes('hybrid')) {
            setNightVision('hybrid');
          } else {
            setNightVision('ir');
          }

          if (found.cameraCount && found.cameraCount >= 16) setStorageOption('2tb');
          else if (found.cameraCount && found.cameraCount >= 8) setStorageOption('1tb');
          else setStorageOption('500gb');

          // Jump directly to Step 2 if package was preselected
          setCurrentStep(2);
        }
      }
    });
  }, [packageSlug]);

  // Adjust default storage when camera count changes
  useEffect(() => {
    if (systemArch === 'wireless') {
      // Wi-Fi cameras use MicroSD or 500GB/1TB Wi-Fi NVR
      return;
    }
    if (cameraCount >= 16) {
      setStorageOption('2tb');
    } else if (cameraCount >= 8) {
      setStorageOption('1tb');
    } else {
      setStorageOption('500gb');
    }
  }, [cameraCount, systemArch]);

  // Compatible Catalog Cameras based on current system architecture
  const compatibleCatalogCameras = useMemo(() => {
    if (systemArch === 'wireless') {
      return catalogProducts.filter((p) => {
        const cat = p.categorySlug || p.categoryId || '';
        return (cat.includes('wi-fi') || cat.includes('wifi')) && p.status !== 'archived';
      });
    }

    if (systemArch === 'ip') {
      return catalogProducts.filter((p) => {
        const cat = p.categorySlug || p.categoryId || '';
        const name = (p.name || '').toLowerCase();
        const specs = JSON.stringify(p.specifications || {}).toLowerCase();
        return (cat === 'cctv-cameras' || cat === 'ip-cameras') &&
          (name.includes('ip') || name.includes('poe') || specs.includes('poe') || specs.includes('network') || p.id.includes('ip')) &&
          p.status !== 'archived';
      });
    }

    // Analogue HD
    return catalogProducts.filter((p) => {
      const cat = p.categorySlug || p.categoryId || '';
      const name = (p.name || '').toLowerCase();
      const isAnalogueCat = cat === 'cctv-cameras' || cat === 'analog-cameras';
      const isNotIp = !name.includes('poe') && !name.includes('wireless') && !name.includes('wi-fi');
      return isAnalogueCat && isNotIp && p.status !== 'archived';
    });
  }, [catalogProducts, systemArch]);

  // Compatible Catalog Recorders based on current architecture and channel capacity
  const compatibleCatalogRecorders = useMemo(() => {
    const recorders = catalogProducts.filter((p) => {
      const cat = p.categorySlug || p.categoryId || '';
      return (cat === 'recorders' || cat === 'dvr-nvr-recorders') && p.status !== 'archived';
    });

    if (systemArch === 'wireless') {
      // Wireless NVRs
      return recorders.filter(r => (r.name || '').toLowerCase().includes('wireless') || (r.name || '').toLowerCase().includes('wi-fi'));
    }

    if (systemArch === 'ip') {
      // IP Network NVRs
      return recorders.filter(r => (r.name || '').toLowerCase().includes('nvr') || (r.name || '').toLowerCase().includes('poe'));
    }

    // Analogue HD DVRs / XVRs
    return recorders.filter(r => (r.name || '').toLowerCase().includes('dvr') || (r.name || '').toLowerCase().includes('xvr'));
  }, [catalogProducts, systemArch]);

  // Derive Recorder Sizing (Rule: Recorder channels must be >= camera count)
  const recorderSpec = useMemo(() => {
    // 1. If user manually selected a catalog recorder, use it if compatible
    if (selectedRecorderProduct) {
      const specs = selectedRecorderProduct.specifications || {};
      const chStr = specs.channels || specs.channel_capacity || '';
      const parsedCh = parseInt(chStr, 10) || 8;
      const isMultiRecorder = cameraCount > parsedCh;

      return {
        channels: parsedCh,
        name: selectedRecorderProduct.name,
        model: selectedRecorderProduct.modelNumber || selectedRecorderProduct.model || 'REC-CUSTOM',
        sku: selectedRecorderProduct.sku || selectedRecorderProduct.id,
        unitPrice: getProductPrice(selectedRecorderProduct),
        isCustomModel: true,
        isMultiRecorder
      };
    }

    // 2. Wireless
    if (systemArch === 'wireless') {
      const neededChannels = cameraCount <= 4 ? 4 : 8;
      const foundInCatalog = compatibleCatalogRecorders.find(r => {
        const specStr = JSON.stringify(r.specifications || {});
        return specStr.includes(`${neededChannels} CH`) || (r.name || '').includes(`${neededChannels}-Channel`);
      });

      return {
        channels: neededChannels,
        name: foundInCatalog ? foundInCatalog.name : (neededChannels <= 4 ? 'EZVIZ 4-Channel Wireless Smart NVR' : 'EZVIZ 8-Channel Wireless Smart NVR'),
        model: foundInCatalog?.modelNumber || (neededChannels <= 4 ? 'CS-X5S-4W' : 'CS-X5S-8W'),
        sku: foundInCatalog?.sku || (neededChannels <= 4 ? 'EZV-NVR-4CH' : 'EZV-NVR-8CH'),
        unitPrice: foundInCatalog ? (getProductPrice(foundInCatalog) ?? 6500) : (neededChannels <= 4 ? 6500 : 9500),
        isCustomModel: false,
        isMultiRecorder: cameraCount > 8
      };
    }

    // 3. IP Network
    if (systemArch === 'ip') {
      if (cameraCount <= 8) {
        const catalog8 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-nvr-8ch-poe');
        return {
          channels: 8,
          name: catalog8 ? catalog8.name : 'Hikvision 8-Channel 4K Embedded PoE Network Video Recorder',
          model: catalog8?.modelNumber || 'DS-7608NI-Q1/8P',
          sku: catalog8?.sku || 'HIK-NVR-8CH-POE',
          unitPrice: getProductPrice(catalog8) ?? 14800,
          isCustomModel: false,
          isMultiRecorder: false
        };
      } else if (cameraCount <= 16) {
        return {
          channels: 16,
          name: 'Hikvision 16-Channel 4K Ultra HD PoE NVR',
          model: 'DS-7616NI-K2/16P',
          sku: 'HIK-NVR-16CH-POE',
          unitPrice: 24500,
          isCustomModel: false,
          isMultiRecorder: false
        };
      } else if (cameraCount <= 32) {
        return {
          channels: 32,
          name: 'Hikvision 32-Channel 4K Enterprise NVR',
          model: 'DS-7732NI-M4',
          sku: 'HIK-NVR-32CH',
          unitPrice: null, // Quote only
          isCustomModel: false,
          isMultiRecorder: false
        };
      } else {
        // > 32 cameras (e.g. 64 cameras) -> Multi-recorder enterprise cluster
        return {
          channels: 64,
          name: 'Dual Hikvision 32-Channel Enterprise 4K NVR Headend System (2x 32-CH)',
          model: 'DS-7732NI-M4 (x2 Units)',
          sku: 'HIK-NVR-64CH-DUAL',
          unitPrice: null, // Enterprise quote required
          isCustomModel: false,
          isMultiRecorder: true
        };
      }
    }

    // 4. Analogue HD (Turbo HD DVR / XVR)
    if (cameraCount <= 4) {
      const catalog4 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-4ch');
      return {
        channels: 4,
        name: catalog4 ? catalog4.name : 'Hikvision 4-Channel 1080p AcuSense HD DVR',
        model: catalog4?.modelNumber || 'iDS-7204HQHI-M1/S',
        sku: catalog4?.sku || 'HIK-DVR-4CH',
        unitPrice: getProductPrice(catalog4) ?? 4500,
        isCustomModel: false,
        isMultiRecorder: false
      };
    } else if (cameraCount <= 8) {
      const catalog8 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-8ch');
      return {
        channels: 8,
        name: catalog8 ? catalog8.name : 'Hikvision 8-Channel 1080p AcuSense HD DVR',
        model: catalog8?.modelNumber || 'iDS-7208HQHI-M1/S',
        sku: catalog8?.sku || 'HIK-DVR-8CH',
        unitPrice: getProductPrice(catalog8) ?? 6800,
        isCustomModel: false,
        isMultiRecorder: false
      };
    } else if (cameraCount <= 16) {
      const catalog16 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-16ch');
      return {
        channels: 16,
        name: catalog16 ? catalog16.name : 'Hikvision 16-Channel 1080p AcuSense HD DVR',
        model: catalog16?.modelNumber || 'iDS-7216HQHI-M2/S',
        sku: catalog16?.sku || 'HIK-DVR-16CH',
        unitPrice: getProductPrice(catalog16) ?? 12500,
        isCustomModel: false,
        isMultiRecorder: false
      };
    } else if (cameraCount <= 32) {
      const catalog32 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-32ch');
      return {
        channels: 32,
        name: catalog32 ? catalog32.name : 'Hikvision 32-Channel Enterprise AcuSense HD DVR',
        model: catalog32?.modelNumber || 'iDS-7232HQHI-M2/S',
        sku: catalog32?.sku || 'HIK-DVR-32CH',
        unitPrice: getProductPrice(catalog32) ?? 28000,
        isCustomModel: false,
        isMultiRecorder: false
      };
    } else {
      // > 32 cameras Analogue Enterprise (e.g. 64 cams) -> Multi-DVR cluster
      return {
        channels: 64,
        name: 'Dual Hikvision 32-Channel Enterprise AcuSense HD DVR Headend Setup (2x 32-CH)',
        model: 'iDS-7232HQHI-M2/S (x2 Units)',
        sku: 'HIK-DVR-64CH-DUAL',
        unitPrice: null, // High-density quote only
        isCustomModel: false,
        isMultiRecorder: true
      };
    }
  }, [systemArch, cameraCount, selectedRecorderProduct, compatibleCatalogRecorders]);

  // Derive Camera Model based on Hierarchy + Catalog + Overrides + Form Factor + Specialist + Night Vision
  const cameraSpec = useMemo(() => {
    // 1. If customer explicitly selected a catalog camera model
    if (selectedCameraProduct) {
      const price = getProductPrice(selectedCameraProduct);
      return {
        name: selectedCameraProduct.name,
        model: selectedCameraProduct.modelNumber || selectedCameraProduct.model || 'CAM-CUSTOM',
        sku: selectedCameraProduct.sku || selectedCameraProduct.id,
        unitPrice: price,
        brand: getProductBrand(selectedCameraProduct),
        isSpecialist: false,
        isCustomOverride: true,
        warrantyMonths: (selectedCameraProduct as any).warrantyMonths || 12
      };
    }

    // 2. IP Series -> Specialized Cameras (Revealed ONLY when ip_specialized is selected)
    if (cameraCategory === 'ip_specialized') {
      if (specialistSubcategory === 'thermal' || specialistCapability === 'thermal') {
        return {
          name: 'Hikvision Enterprise Thermographic Heat Detection Specialist Camera',
          model: 'DS-2TD2617B-3/PA (Thermal)',
          sku: 'HIK-THERM-CONSULT',
          unitPrice: null, // Quote required
          brand: 'Hikvision',
          isSpecialist: true,
          specialistReason: 'Requires certified thermal calibration and on-site engineering survey.',
          isCustomOverride: false,
          warrantyMonths: 24
        };
      }
      if (specialistSubcategory === 'industrial') {
        return {
          name: 'Hikvision Stainless Steel 316L Explosion-Proof Industrial Camera',
          model: 'DS-2XE6222F-IS/316L',
          sku: 'HIK-EXPL-CONSULT',
          unitPrice: null, // Quote required
          brand: 'Hikvision',
          isSpecialist: true,
          specialistReason: 'ATEX/IECEx hazardous environment certification and customized stainless conduit design required.',
          isCustomOverride: false,
          warrantyMonths: 24
        };
      }
      // Default specialized: ANPR
      return {
        name: 'Hikvision DeepinView License Plate Recognition (ANPR) Camera',
        model: 'iDS-2CD7A46G0/P-IZHS',
        sku: 'HIK-ANPR-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Requires vehicle lane speed assessment, focal depth mapping, and gate relay integration.',
        isCustomOverride: false,
        warrantyMonths: 24
      };
    }

    // 3. Analogue / HD Series
    if (cameraCategory === 'analogue_bullet') {
      if (nightVision === 'colorvu') {
        const catalogColor = compatibleCatalogCameras.find(c => c.id === 'prod-hik-color-2mp');
        return {
          name: catalogColor ? catalogColor.name : 'Hikvision 2MP ColorVu Full-Color Audio Bullet Camera',
          model: catalogColor?.modelNumber || 'DS-2CE10DF0T-FS',
          sku: catalogColor?.sku || 'prod-hik-color-2mp',
          unitPrice: getProductPrice(catalogColor) ?? 3800,
          brand: 'Hikvision',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 12
        };
      }
      if (nightVision === 'hybrid') {
        return {
          name: 'Hikvision 2MP Smart Hybrid Light Audio Bullet Camera',
          model: 'DS-2CE16D0T-LPFS',
          sku: 'HIK-2MP-HYBRID',
          unitPrice: 3100,
          brand: 'Hikvision',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 12
        };
      }
      // Pure Infrared (IRPF) Standard: monochrome night vision, zero fabricated color claims
      const catalogBullet = compatibleCatalogCameras.find(c => c.id === 'prod-hik-irpf-2mp');
      return {
        name: catalogBullet ? catalogBullet.name : 'Hikvision 2MP Audio Fixed Mini Bullet Camera',
        model: catalogBullet?.modelNumber || 'DS-2CE16D0T-ITPFS',
        sku: catalogBullet?.sku || 'prod-hik-irpf-2mp',
        unitPrice: getProductPrice(catalogBullet) ?? 2400,
        brand: 'Hikvision',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'analogue_dome') {
      const catalogDome = compatibleCatalogCameras.find(c => c.id === 'prod-dahua-dome-2mp');
      return {
        name: catalogDome ? catalogDome.name : 'Dahua 2MP HDCVI Vandal-Resistant Dome Camera',
        model: catalogDome?.modelNumber || 'DH-HAC-HDBW1200E',
        sku: catalogDome?.sku || 'prod-dahua-dome-2mp',
        unitPrice: getProductPrice(catalogDome) ?? 2400,
        brand: 'Dahua',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'analogue_turret') {
      const catalogTurret = compatibleCatalogCameras.find(c => c.id === 'prod-hik-dome-2mp' || c.id === 'prod-dahua-eyeball-2mp');
      return {
        name: catalogTurret ? catalogTurret.name : 'Hikvision 2MP Audio Turret Camera (Eyeball)',
        model: catalogTurret?.modelNumber || 'DS-2CE76D0T-ITPFS',
        sku: catalogTurret?.sku || 'prod-hik-dome-2mp',
        unitPrice: getProductPrice(catalogTurret) ?? 2500,
        brand: 'Hikvision',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'analogue_box') {
      return {
        name: 'CamneX Specialized C/CS-Mount Box Camera System',
        model: 'DS-2CC12D9T-A (Box)',
        sku: 'HIK-BOX-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Interchangeable optical lens, auto-iris calibration, and specialized outdoor housing selection required.',
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'analogue_ptz') {
      const catalogPTZ = compatibleCatalogCameras.find(c => c.id === 'prod-hik-ptz-2mp');
      return {
        name: catalogPTZ ? catalogPTZ.name : 'Hikvision 2MP 4-Inch Speed Dome Mini PTZ Camera',
        model: catalogPTZ?.modelNumber || 'DS-2DE4225IW-DE',
        sku: catalogPTZ?.sku || 'prod-hik-ptz-2mp',
        unitPrice: getProductPrice(catalogPTZ) ?? 28500,
        brand: 'Hikvision',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    // 4. IP Series
    if (cameraCategory === 'ip_smart_ai') {
      return {
        name: `Hikvision 4MP AcuSense Deep Learning AI PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
        model: formFactor === 'dome' ? 'DS-2CD2146G2-ISU' : 'DS-2CD2046G2-IU',
        sku: 'HIK-IP-ACUSENSE-4MP',
        unitPrice: 10800,
        brand: 'Hikvision',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 24
      };
    }

    if (cameraCategory === 'ip_multi_sensor') {
      return {
        name: 'Hikvision PanoVu Multi-Sensor 180° Panoramic Network Camera',
        model: 'DS-2CD6986G0-IHS',
        sku: 'HIK-MULTISENSOR-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Multi-stream NVR bandwidth calculation and high-elevation panoramic mounting survey required.',
        isCustomOverride: false,
        warrantyMonths: 24
      };
    }

    if (cameraCategory === 'ip_fisheye') {
      return {
        name: 'Hikvision 12MP 360° Hemispheric Immervision Fisheye Camera',
        model: 'DS-2CD63C5G0-IVS',
        sku: 'HIK-FISHEYE-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Software dewarping license and ceiling acoustic reflection analysis required.',
        isCustomOverride: false,
        warrantyMonths: 24
      };
    }

    if (cameraCategory === 'ip_poe') {
      if (nightVision === 'colorvu') {
        return {
          name: `Hikvision 4MP ColorVu PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
          model: formFactor === 'dome' ? 'DS-2CD2147G2-SU' : 'DS-2CD2047G2-LU',
          sku: 'HIK-IP-COLORVU-4MP',
          unitPrice: 9200,
          brand: 'Hikvision',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 24
        };
      }
      if (nightVision === 'hybrid') {
        return {
          name: `Hikvision 4MP Smart Hybrid Light PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
          model: formFactor === 'dome' ? 'DS-2CD2147G2-LU/SL' : 'DS-2CD2047G2-LU/SL',
          sku: 'HIK-IP-HYBRID-4MP',
          unitPrice: 9500,
          brand: 'Hikvision',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 24
        };
      }
      return {
        name: `Hikvision 4MP EXIR PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
        model: formFactor === 'dome' ? 'DS-2CD1143G0-I' : 'DS-2CD1043G0-I',
        sku: 'HIK-IP-EXIR-4MP',
        unitPrice: 7200,
        brand: 'Hikvision',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    // 5. Wireless Series
    if (cameraCategory === 'wifi_smart') {
      if (formFactor === 'dome' || formFactor === 'turret') {
        const catalogC6N = compatibleCatalogCameras.find(c => c.id === 'prod-wifi-c6n');
        return {
          name: catalogC6N ? catalogC6N.name : 'EZVIZ C6N 3MP Pan & Tilt Smart Wi-Fi Camera',
          model: catalogC6N?.modelNumber || 'CS-C6N-D0-8B3WF',
          sku: catalogC6N?.sku || 'EZV-C6N-3MP',
          unitPrice: getProductPrice(catalogC6N) ?? 4200,
          brand: 'EZVIZ',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 12
        };
      }
      const catalogH3c = compatibleCatalogCameras.find(c => c.id === 'prod-wifi-h3c');
      return {
        name: catalogH3c ? catalogH3c.name : 'EZVIZ H3c 2K Color Night Vision Outdoor Wi-Fi Camera',
        model: catalogH3c?.modelNumber || 'CS-H3c-R100-1K3WKFL',
        sku: catalogH3c?.sku || 'EZV-H3C-3MP',
        unitPrice: getProductPrice(catalogH3c) ?? 6500,
        brand: 'EZVIZ',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'wifi_two_way_audio') {
      const catalogH3c = compatibleCatalogCameras.find(c => c.id === 'prod-wifi-h3c');
      return {
        name: 'EZVIZ H3c 2K Active Defense Wi-Fi Camera with Two-Way Audio',
        model: catalogH3c?.modelNumber || 'CS-H3c-R100-1K3WKFL',
        sku: 'EZV-H3C-AUDIO-2K',
        unitPrice: getProductPrice(catalogH3c) ?? 6500,
        brand: 'EZVIZ',
        isSpecialist: false,
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'wifi_cellular') {
      return {
        name: 'Hikvision 4G LTE Cellular Standalone Solar-Ready Camera',
        model: 'DS-2CD2047G2-4G',
        sku: 'HIK-4G-LTE-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Requires 4G/5G mobile operator SIM data provisioning and tower signal dBm verification.',
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'wifi_solar') {
      return {
        name: 'Hikvision Standalone Solar-Powered Security Camera Kit',
        model: 'DS-2XS2T47G0-LDW/4G',
        sku: 'HIK-SOLAR-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Solar azimuth angle, daily sunshine hours, and battery autonomy calculation required.',
        isCustomOverride: false,
        warrantyMonths: 24
      };
    }

    if (cameraCategory === 'wifi_battery') {
      return {
        name: 'EZVIZ Standalone Low-Power PIR Battery Camera',
        model: 'CS-EB3-R100',
        sku: 'EZV-BATTERY-CONSULT',
        unitPrice: null, // Quote required
        brand: 'EZVIZ',
        isSpecialist: true,
        specialistReason: 'Battery duty cycle and PIR motion trigger frequency assessment required.',
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    if (cameraCategory === 'wifi_pinhole') {
      return {
        name: 'Hikvision Covert Pinhole Modular Security Camera',
        model: 'DS-2CD2D14WD',
        sku: 'HIK-PINHOLE-CONSULT',
        unitPrice: null, // Quote required
        brand: 'Hikvision',
        isSpecialist: true,
        specialistReason: 'Covert installation compliance, mounting depth, and thermal dissipation assessment required.',
        isCustomOverride: false,
        warrantyMonths: 12
      };
    }

    // Default Fallback
    const catalogBullet = compatibleCatalogCameras.find(c => c.id === 'prod-hik-irpf-2mp');
    return {
      name: catalogBullet ? catalogBullet.name : 'Hikvision 2MP Audio Fixed Mini Bullet Camera',
      model: catalogBullet?.modelNumber || 'DS-2CE16D0T-ITPFS',
      sku: catalogBullet?.sku || 'prod-hik-irpf-2mp',
      unitPrice: getProductPrice(catalogBullet) ?? 2400,
      brand: 'Hikvision',
      isSpecialist: false,
      isCustomOverride: false,
      warrantyMonths: 12
    };
  }, [
    cameraCategory,
    nightVision,
    formFactor,
    specialistCapability,
    specialistSubcategory,
    selectedCameraProduct,
    compatibleCatalogCameras
  ]);

  // Derive Hard Drive Sizing
  const storageSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      return {
        name: 'Kingston High-Endurance 128GB MicroSD Card (Per Camera)',
        model: 'SDCE/128GB',
        sku: 'SD-128GB-SURV',
        qty: cameraCount,
        unitPrice: 1450,
        lineTotal: 1450 * cameraCount,
        warrantyMonths: 36
      };
    }

    if (storageOption === 'none') {
      return null;
    }

    if (storageOption === '500gb') {
      return {
        name: 'Western Digital Purple 500GB 3.5" Surveillance Internal HDD',
        model: 'WD5000PURZ',
        sku: 'prod-wd-purple-500gb',
        qty: 1,
        unitPrice: 1800,
        lineTotal: 1800,
        warrantyMonths: 36
      };
    }

    if (storageOption === '1tb') {
      return {
        name: 'Western Digital Purple 1TB 3.5" Surveillance Internal HDD',
        model: 'WD10PURZ',
        sku: 'prod-wd-purple-1tb',
        qty: 1,
        unitPrice: 4800,
        lineTotal: 4800,
        warrantyMonths: 36
      };
    }

    if (storageOption === '2tb') {
      return {
        name: 'Western Digital Purple 2TB 3.5" Surveillance Internal HDD',
        model: 'WD20PURZ',
        sku: 'prod-wd-purple-2tb',
        qty: 1,
        unitPrice: 6900,
        lineTotal: 6900,
        warrantyMonths: 36
      };
    }

    // 4TB
    return {
      name: 'Seagate SkyHawk 4TB Surveillance Internal Hard Drive 3.5"',
      model: 'ST4000VX016',
      sku: 'prod-st-skyhawk-4tb',
      qty: 1,
      unitPrice: 11200,
      lineTotal: 11200,
      warrantyMonths: 36
    };
  }, [storageOption, systemArch, cameraCount]);

  // Strict Cable Allocation: 10m per camera default, editable by customer
  const defaultCableMeters = cameraCount * 10;
  const cableLengthMeters = customCableLength !== null ? customCableLength : defaultCableMeters;

  // Power Distribution
  const powerSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      return {
        name: 'CamneX 12V 2A Regulated Power Adapter (Per Camera)',
        model: 'AD-12V2A-DC',
        sku: 'acc-power-adapter',
        qty: cameraCount,
        unitPrice: 350,
        lineTotal: 350 * cameraCount,
        warrantyMonths: 6
      };
    }

    if (systemArch === 'ip') {
      // PoE is supplied by NVR or PoE Switch
      return {
        name: 'Integrated IEEE 802.3af/at PoE Power Delivery via NVR Ports',
        model: 'POE-BUILTIN',
        sku: 'POE-NVR-PORTS',
        qty: 1,
        unitPrice: 0,
        lineTotal: 0,
        warrantyMonths: 0
      };
    }

    // Analogue
    if (cameraCount <= 2) {
      return {
        name: 'CamneX Pro 12V 2A Regulated DC Switching Power Adapter',
        model: 'AD-12V2A-DC',
        sku: 'acc-power-adapter',
        qty: 2,
        unitPrice: 350,
        lineTotal: 700,
        warrantyMonths: 6
      };
    }

    return {
      name: 'CamneX Central 12V 10A 9-Channel Metal Cased Power Supply Box',
      model: 'PS-12V10A-9CH',
      sku: 'acc-power',
      qty: 1,
      unitPrice: 1800,
      lineTotal: 1800,
      warrantyMonths: 12
    };
  }, [systemArch, cameraCount]);

  // Optional Monitor Spec (Preserves standard presets: 17" for 2-4 cams, 19" for 16 cams)
  const monitorSpec = useMemo(() => {
    if (monitorOption === '17inch') {
      return {
        name: '17-Inch HD 75Hz CCTV Surveillance Monitor (HDMI & VGA)',
        model: 'MON-SURV-17HD',
        sku: 'MON-17INCH-SURV',
        qty: 1,
        unitPrice: null, // Quote item per catalog
        warrantyMonths: 12
      };
    }
    if (monitorOption === '19inch') {
      return {
        name: '19-Inch Full HD 24/7 Security Display Monitor',
        model: 'MON-SURV-19FHD',
        sku: 'MON-19INCH-SURV',
        qty: 1,
        unitPrice: null, // Quote item per catalog
        warrantyMonths: 12
      };
    }
    if (monitorOption === 'large') {
      return {
        name: '24-Inch Professional CCTV Security Display Wall Console',
        model: 'MON-SURV-24FHD',
        sku: 'MON-24INCH-SURV',
        qty: 1,
        unitPrice: null,
        warrantyMonths: 12
      };
    }
    return null;
  }, [monitorOption]);

  // Compute Complete Bill of Materials (BOM)
  const computedBOM: BomItem[] = useMemo(() => {
    const list: BomItem[] = [];

    // 1. Cameras
    list.push({
      role: 'Surveillance Cameras',
      name: cameraSpec.name,
      model: cameraSpec.model,
      sku: cameraSpec.sku,
      qty: cameraCount,
      unitPrice: cameraSpec.unitPrice,
      lineTotal: cameraSpec.unitPrice !== null ? cameraSpec.unitPrice * cameraCount : null
    });

    // 2. Video Recorder
    list.push({
      role: 'Recording Hardware',
      name: recorderSpec.name,
      model: recorderSpec.model,
      sku: recorderSpec.sku,
      qty: 1,
      unitPrice: recorderSpec.unitPrice,
      lineTotal: recorderSpec.unitPrice
    });

    // 3. Storage
    if (storageSpec) {
      list.push({
        role: 'Surveillance Storage',
        name: storageSpec.name,
        model: storageSpec.model,
        sku: storageSpec.sku,
        qty: storageSpec.qty,
        unitPrice: storageSpec.unitPrice,
        lineTotal: storageSpec.lineTotal
      });
    }

    // 4. Cabling (Default 10m/camera, user-editable)
    if (systemArch !== 'wireless') {
      const isIp = systemArch === 'ip';
      const isUtpAnalogue = systemArch === 'analogue' && analogueTransmission === 'utp_baluns';
      list.push({
        role: 'Transmission Cabling',
        name: isIp || isUtpAnalogue
          ? `D-Link CAT6 UTP Pure Solid Copper Cable (${cableLengthMeters}m @ 10m/cam default)`
          : `High-Shield Pure Solid Copper RG59 Coaxial Video Cable (${cableLengthMeters}m @ 10m/cam default)`,
        model: isIp || isUtpAnalogue ? 'NCB-C6UBLUR-305' : 'COAX-RG59-CU',
        sku: isIp || isUtpAnalogue ? 'DL-CAT6-UTP' : 'COAX-RG59-PURE',
        qty: cableLengthMeters,
        unitPrice: isIp || isUtpAnalogue ? 32 : 30,
        lineTotal: (isIp || isUtpAnalogue ? 32 : 30) * cableLengthMeters
      });
    }

    // 5. Connectors & Baluns (Baluns included ONLY when UTP transmission design is chosen!)
    if (systemArch === 'analogue') {
      if (analogueTransmission === 'utp_baluns') {
        list.push({
          role: 'Video & Power Baluns',
          name: 'Passive HD Video Balun & DC Power Pigtails (Per Camera Kit)',
          model: 'BALUN-HD-KIT',
          sku: 'acc-balun',
          qty: cameraCount,
          unitPrice: 250,
          lineTotal: 250 * cameraCount
        });
      } else {
        // Direct Coaxial: Heavy-duty BNC connectors & DC pigtails (No unnecessary baluns!)
        list.push({
          role: 'Coaxial BNC & DC Connectors',
          name: 'Heavy-Duty Male BNC Crimp Connectors & 12V DC Pigtail Kit',
          model: 'BNC-DC-MALE-KIT',
          sku: 'ACC-BNC-DC-KIT',
          qty: cameraCount,
          unitPrice: 150,
          lineTotal: 150 * cameraCount
        });
      }
    } else if (systemArch === 'ip') {
      list.push({
        role: 'Network Terminations',
        name: 'RJ45 Modular Plugs & Snagless Protective Boots Kit',
        model: 'RJ45-CAT6-KIT',
        sku: 'ACC-RJ45-KIT',
        qty: cameraCount * 2,
        unitPrice: 25,
        lineTotal: cameraCount * 2 * 25
      });
    }

    // 6. Power Distribution
    if (powerSpec && powerSpec.unitPrice !== 0) {
      list.push({
        role: 'Power Distribution',
        name: powerSpec.name,
        model: powerSpec.model,
        sku: powerSpec.sku,
        qty: powerSpec.qty,
        unitPrice: powerSpec.unitPrice,
        lineTotal: powerSpec.lineTotal
      });
    }

    // 7. Optional Monitor
    if (monitorSpec) {
      list.push({
        role: 'Display Monitor',
        name: monitorSpec.name,
        model: monitorSpec.model,
        sku: monitorSpec.sku,
        qty: monitorSpec.qty,
        unitPrice: monitorSpec.unitPrice,
        lineTotal: null
      });
    }

    return list;
  }, [
    cameraSpec,
    cameraCount,
    recorderSpec,
    storageSpec,
    systemArch,
    analogueTransmission,
    cableLengthMeters,
    powerSpec,
    monitorSpec
  ]);

  // Calculate Pricing & Quote-Only status
  const { totalPrice, quotationRequired, quotationReason } = useMemo(() => {
    let sum = 0;
    let quoteOnly = false;
    const unpricedItems: string[] = [];

    if (cameraCount > 64) {
      quoteOnly = true;
      unpricedItems.push(`${cameraCount} Camera High-Capacity Enterprise System`);
    } else if (cameraCount >= 32) {
      quoteOnly = true;
      unpricedItems.push('32+ Enterprise Scale System');
    }

    if (cameraSpec.isSpecialist) {
      quoteOnly = true;
      unpricedItems.push(cameraSpec.name);
    }

    for (const item of computedBOM) {
      if (item.unitPrice === null || item.lineTotal === null) {
        quoteOnly = true;
        unpricedItems.push(item.name);
      } else {
        sum += item.lineTotal;
      }
    }

    return {
      totalPrice: quoteOnly ? null : sum,
      quotationRequired: quoteOnly,
      quotationReason: quoteOnly
        ? `One or more custom items (${unpricedItems.join(', ')}) require technical site assessment or official engineering quotation.`
        : null
    };
  }, [computedBOM, cameraCount, cameraSpec]);

  // Pure Infrared standard check
  const isPureIR = nightVision === 'ir' && systemArch === 'analogue';

  // Action: Add Package to Cart
  const handleAddPackageToCart = () => {
    if (quotationRequired || totalPrice === null) {
      handleRequestQuote();
      return;
    }

    const bundleId = `bundle-${systemArch}-${cameraCount}cam-${formFactor}-${Date.now()}`;
    const bundleName = `${cameraCount}-Camera ${
      systemArch === 'wireless'
        ? 'Wireless Smart Kit'
        : systemArch === 'ip'
        ? '4K IP Network Surveillance System'
        : 'Turbo HD Security Setup'
    } (${formFactor.toUpperCase()})`;

    const bundleProduct: any = {
      id: bundleId,
      name: bundleName,
      brand: 'Hikvision',
      modelNumber: `CAMNEX-${cameraCount}C-${formFactor.toUpperCase()}`,
      sku: `PKG-${systemArch.toUpperCase()}-${cameraCount}C`,
      category: 'CCTV Packages',
      categoryId: 'packages',
      productType: 'package_bundle',
      status: 'active',
      images: ['/images/products/hikvision-bullet.svg'],
      primaryImage: '/images/products/hikvision-bullet.svg',
      shortDescription: `Custom ${cameraCount}-camera ${systemArch.toUpperCase()} setup with ${recorderSpec.channels}-ch recorder, ${storageOption.toUpperCase()} storage, and ${cableLengthMeters}m cable.`,
      description: 'Custom engineered security camera package.',
      keyFeatures: [
        `${cameraCount}x ${cameraSpec.name}`,
        `1x ${recorderSpec.name}`,
        `Surveillance storage: ${storageOption.toUpperCase()}`,
        `Cabling: ${cableLengthMeters}m pure copper allocation`
      ],
      specifications: {},
      pricing: { regularPrice: totalPrice, currency: 'BDT' },
      inventory: { available: 15, status: 'in_stock' },
      unit: 'Complete Turnkey Set'
    };

    addItemToCart(bundleProduct, 1, formFactor, {
      systemArch,
      cameraCount,
      formFactor,
      nightVision,
      storageOption,
      cableLengthMeters,
      totalPrice,
      components: computedBOM
    });

    onNavigate('cart');
  };

  // Action: Open In-Page Quotation Modal
  const handleRequestQuote = () => {
    setShowQuoteModal(true);
    setQuoteErrorMessage(null);
    setQuoteSuccessResult(null);

    // Also update localStorage prefill as backup for navigation
    const summaryText = `[Custom Package Builder Configuration]
Architecture: ${systemArch.toUpperCase()}
Cameras: ${cameraCount}x ${cameraSpec.name} (${formFactor.toUpperCase()})
Night Vision: ${nightVision.toUpperCase()}
Recorder: ${recorderSpec.name} (${recorderSpec.channels} Channels)
Storage: ${storageSpec ? storageSpec.name : 'None'}
Cable Allocation: ${cableLengthMeters}m (${systemArch === 'ip' ? 'Cat6 UTP Solid Copper' : 'RG59 Coax Solid Copper'})
Power: ${powerSpec?.name || 'Standard'}
Monitor: ${monitorSpec ? monitorSpec.name : 'None'}
Calculated Price: ${totalPrice ? `৳${totalPrice.toLocaleString()}` : 'Quotation Required'}
Reason: ${quotationReason || 'Standard verification'}`;

    try {
      localStorage.setItem(
        'camnex_quote_prefill',
        JSON.stringify({
          cameraCount,
          serviceType: 'cctv_installation',
          notes: summaryText
        })
      );
    } catch (_) {}
  };

  // In-Page Quote Submission Handler
  const handleQuoteFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteErrorMessage(null);

    if (!quoteFormData.customerName.trim() || quoteFormData.customerName.trim().length < 2) {
      setQuoteErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = quoteFormData.phone.trim();
    if (!cleanPhone || cleanPhone.length < 11) {
      setQuoteErrorMessage('Please enter a valid 11-digit mobile phone number (e.g. 01712345678).');
      return;
    }

    setQuoteSubmitting(true);

    const notesContent = `[Package Builder Official Quote Request]
Architecture: ${systemArch.toUpperCase()}
Cameras: ${cameraCount}x ${cameraSpec.name} (${formFactor.toUpperCase()})
Night Vision: ${nightVision.toUpperCase()}
Recorder: ${recorderSpec.name} (${recorderSpec.channels} Channels)
Surveillance Storage: ${storageSpec ? storageSpec.name : 'None'}
Transmission Cable: ${cableLengthMeters}m (${systemArch === 'ip' ? 'Cat6 UTP Solid Copper' : 'RG59 Coax Solid Copper'})
Power Supply: ${powerSpec?.name || 'Included'}
Monitor: ${monitorSpec ? monitorSpec.name : 'None'}
Installation Service Requested: ${quoteFormData.includeInstallation ? 'YES (Full Turnkey Installation)' : 'NO (Equipment Only)'}
Quotation Status: ${quotationReason || 'Standard Package Verification'}
Calculated Hardware Estimate: ${totalPrice !== null ? `৳${totalPrice.toLocaleString()} BDT` : 'Quotation Required'}
Customer Site Notes: ${quoteFormData.notes || 'None provided'}`;

    try {
      const payload: any = {
        customerName: quoteFormData.customerName.trim(),
        phone: cleanPhone,
        email: quoteFormData.email.trim() || undefined,
        serviceType: 'cctv_installation',
        propertyType: cameraCount <= 4 ? 'home' : cameraCount <= 16 ? 'office' : 'factory',
        siteAddress: quoteFormData.siteAddress.trim() || 'Dhaka, Bangladesh',
        cameraCount: cameraCount,
        companyName: quoteFormData.companyName.trim() || undefined,
        notes: notesContent,
        quotationAmount: totalPrice || undefined
      };

      const result = await quoteService.createQuote(payload);
      setQuoteSuccessResult({
        quoteNumber: (result as any).referenceNumber || (result as any).quoteNumber || result.id || 'CNX-QTE-CONFIRMED'
      });
      setQuoteSubmitting(false);
    } catch (err: any) {
      setQuoteErrorMessage(err?.message || 'Failed to submit quote request. Please try again or call our hotline.');
      setQuoteSubmitting(false);
    }
  };

  // Copy BOM to clipboard (with 7-day validity and disclaimers)
  const handleCopyBOM = () => {
    const lines = computedBOM.map(
      (b, idx) =>
        `${idx + 1}. [${b.role}] ${b.name} (Model: ${b.model}) - Qty: ${b.qty} ${
          b.lineTotal !== null ? `@ ৳${b.lineTotal.toLocaleString()} BDT` : '(Quotation required)'
        }`
    );
    lines.unshift(`CamneX Bangladesh — Official Technical Bill of Materials (${cameraCount} Cameras)\nDate of Issue: ${bomDates.issueDate} | Validity: 7 Calendar Days (Valid Until: ${bomDates.validUntilDate})\n======================================================`);
    if (totalPrice) {
      lines.push(`\nCalculated Hardware Subtotal: ৳${totalPrice.toLocaleString()} BDT`);
    } else {
      lines.push(`\nTotal: Official Engineering Quotation Required (${quotationReason || 'Custom setup'})`);
    }
    lines.push('\nImportant Disclaimers:');
    lines.push('1. Prices may change depending on the actual order date and exchange rates.');
    lines.push('2. Installation and service charges are excluded from the equipment total unless explicitly quoted.');
    lines.push('3. Official Bangladesh distributor warranty applies to all eligible cameras, recorders, and storage.');

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedBOM(true);
    setTimeout(() => setCopiedBOM(false), 2500);
  };

  // Download BOM as clean formatted technical text file
  const handleDownloadBOM = () => {
    const lines: string[] = [];
    lines.push('================================================================================');
    lines.push('CAMNEX BANGLADESH — OFFICIAL TECHNICAL BILL OF MATERIALS (BOM)');
    lines.push('Authorized Hikvision Partner & Certified Security Systems Integrator');
    lines.push('Corporate Office: Dhaka, Bangladesh | Web: https://camnexbd.com');
    lines.push('================================================================================');
    lines.push(`System Architecture : ${systemArch.toUpperCase()}`);
    lines.push(`Camera Quantity     : ${cameraCount} Cameras`);
    lines.push(`Form Factor         : ${formFactor.toUpperCase()}`);
    lines.push(`Night Vision Type   : ${nightVision === 'ir' ? 'Pure Infrared (IR)' : nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'Full Color (ColorVu)'}`);
    lines.push(`Date of Issue       : ${bomDates.issueDate}`);
    lines.push(`BOM Validity        : Valid for 7 calendar days (Expires: ${bomDates.validUntilDate})`);
    lines.push('--------------------------------------------------------------------------------');
    lines.push('ITEMIZED HARDWARE BREAKDOWN:');
    lines.push('--------------------------------------------------------------------------------');
    computedBOM.forEach((item, idx) => {
      const priceStr = item.lineTotal !== null ? `৳${item.lineTotal.toLocaleString()} BDT` : 'Quotation Required';
      const unitStr = item.unitPrice !== null ? `(@ ৳${item.unitPrice.toLocaleString()}/ea)` : '';
      lines.push(`${idx + 1}. [${item.role}] ${item.name}`);
      lines.push(`   Model: ${item.model} | SKU: ${item.sku}`);
      lines.push(`   Quantity: ${item.qty} ${unitStr} -> Line Total: ${priceStr}`);
      lines.push('');
    });
    lines.push('--------------------------------------------------------------------------------');
    if (totalPrice !== null) {
      lines.push(`CALCULATED HARDWARE TOTAL: ৳${totalPrice.toLocaleString()} BDT`);
    } else {
      lines.push(`TOTAL: Official Engineering Quotation Required (${quotationReason || 'Custom Setup'})`);
    }
    lines.push('--------------------------------------------------------------------------------');
    lines.push('TERMS, WARRANTY & SERVICE CONDITIONS:');
    lines.push('1. BOM Validity: This bill of materials is valid for 7 calendar days from the issue date.');
    lines.push('2. Pricing: Equipment prices may vary depending on official distributor exchange rate and actual order date.');
    lines.push('3. Service Charges: Installation, conduit piping, and engineering commissioning charges are excluded from the hardware total and will be quoted following on-site survey.');
    lines.push('4. Warranty: Official Bangladesh distributor warranty applies to all eligible cameras, recorders, and hard drives.');
    lines.push('================================================================================');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CamneX_BOM_${cameraCount}_Cam_${systemArch.toUpperCase()}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedBOM(true);
    setTimeout(() => setDownloadedBOM(false), 2500);
  };

  const steps = [
    { num: 1, label: 'System Type' },
    { num: 2, label: 'Cameras & Coverage' },
    { num: 3, label: 'Recorder & Storage' },
    { num: 4, label: 'Accessories & Monitor' },
    { num: 5, label: 'BOM Review' },
    { num: 6, label: 'Finalize & Order' }
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-6 sm:py-10">
      <SEO
        title="Custom CCTV Package Builder & Estimator | CamneX Bangladesh"
        description="Design and configure your security camera system online. Transparent engineering rules, 10m/camera cable allocation, surveillance HDD auto-sizing, and genuine Hikvision IRPF hardware."
        canonicalPath="/packages"
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', onClick: () => onNavigate('home') },
            { label: 'CCTV Packages', onClick: () => onNavigate('packages') },
            { label: selectedBasePkg ? selectedBasePkg.name : 'Package Builder' }
          ]}
        />

        {/* Builder Header Card */}
        <div className="bg-white rounded-[20px] border border-[#EDE8E1] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F15A24] px-2.5 py-0.5 rounded-full">
                Guided 6-Step System Builder
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Official Bangladesh Warranty & Standards
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#111827]">
              Intelligent CCTV Package Builder
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6472] max-w-2xl leading-relaxed">
              Configure your exact security setup. Recorders, surveillance storage, power supplies, and cabling are automatically verified against CamneX engineering rules.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('packages')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-full hover:bg-slate-50 transition cursor-pointer"
            >
              Browse Ready-Made Sets
            </button>
            <button
              type="button"
              onClick={handleRequestQuote}
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-full hover:bg-black transition cursor-pointer shadow-xs"
            >
              Book Site Survey
            </button>
          </div>
        </div>

        {/* 6-Step Stepper Progress Bar */}
        <div className="bg-white rounded-2xl border border-[#EDE8E1] p-3 sm:p-4 shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px] gap-2">
            {steps.map((st) => {
              const isPast = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setCurrentStep(st.num)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#F15A24] text-white shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isCurrent
                        ? 'bg-white text-[#F15A24]'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                  </span>
                  <span className="whitespace-nowrap">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Step Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Step Panel (7 or 8 columns on desktop) */}
          <div className="lg:col-span-8 bg-white rounded-[20px] border border-[#EDE8E1] p-6 sm:p-8 shadow-xs space-y-6">

            {/* ==================================================================== */}
            {/* STEP 1: SYSTEM ARCHITECTURE SELECTION */}
            {/* ==================================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                    Step 1 of 6
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Choose System Architecture
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Select the transmission technology that best matches your building layout, budget, and performance needs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Analogue HD */}
                  <div
                    onClick={() => handleSelectArchitecture('analogue')}
                    data-arch-card="analogue"
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      systemArch === 'analogue'
                        ? 'border-[#F15A24] bg-orange-50/30 shadow-xs'
                        : 'border-[#EDE8E1] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-base text-[#111827]">
                          Analogue HD
                        </div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Best Value Standard
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6472] leading-relaxed">
                        Coaxial transmission with zero network latency. Supports 1080p to 3K with Audio Over Coax (AoC).
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="font-semibold text-slate-700">Recommended for:</div>
                      <div>Homes, shops, retail stores & standalone offices.</div>
                    </div>
                  </div>

                  {/* IP Network */}
                  <div
                    onClick={() => handleSelectArchitecture('ip')}
                    data-arch-card="ip"
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      systemArch === 'ip'
                        ? 'border-[#F15A24] bg-orange-50/30 shadow-xs'
                        : 'border-[#EDE8E1] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-base text-[#111827]">
                          IP Network (PoE)
                        </div>
                        <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          Ultra HD & Scalable
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6472] leading-relaxed">
                        Digital Cat6 Ethernet cabling. Ultra 4K clarity, edge AI detection, and Power over Ethernet (PoE).
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="font-semibold text-slate-700">Recommended for:</div>
                      <div>Corporate headquarters, factories, schools & campuses.</div>
                    </div>
                  </div>

                  {/* Wi-Fi Wireless */}
                  <div
                    onClick={() => handleSelectArchitecture('wireless')}
                    data-arch-card="wireless"
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      systemArch === 'wireless'
                        ? 'border-[#F15A24] bg-orange-50/30 shadow-xs'
                        : 'border-[#EDE8E1] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Wifi className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-bold text-base text-[#111827]">
                          Wi-Fi Wireless
                        </div>
                        <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          Zero Video Cabling
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6472] leading-relaxed">
                        Streams over Wi-Fi directly to smartphone app or cloud. Requires local power socket only.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="font-semibold text-slate-700">Recommended for:</div>
                      <div>Rental apartments, interior rooms, clinics & boutiques.</div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Engineering Note based on Selected Architecture */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>
                      <strong className="text-slate-800">
                        Engineering Note ({systemArch === 'analogue' ? 'Analogue HD' : systemArch === 'ip' ? 'IP Network PoE' : 'Wi-Fi Wireless'}):
                      </strong>{' '}
                      {systemArch === 'analogue' && (
                        <span>
                          Analogue HD systems deliver guaranteed zero-latency video over solid copper coaxial cable. Solid copper RG59/RG6 coaxial transmission ensures point-to-point physical connection and Audio Over Coax (AoC) without network load. Includes strict 10m solid copper cabling per camera.
                        </span>
                      )}
                      {systemArch === 'ip' && (
                        <span>
                          IP Network systems offer maximum flexibility and 4K digital expansion. Digital Cat6 UTP cabling with 48V Power-over-Ethernet (IEEE 802.3af/at) carries video, power, and AI analytics over a single cable up to 100m. Supports surveillance VLAN isolation and high-throughput NVR uplinks.
                        </span>
                      )}
                      {systemArch === 'wireless' && (
                        <span>
                          Wi-Fi systems eliminate video cabling by streaming directly to your network over 2.4GHz Wi-Fi (requires &gt; -65 dBm signal at camera spots). Each camera requires a local 220V AC socket within adapter reach. Recommended for up to 8 cameras per residential access point.
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Both Analogue HD and IP Network include full mobile app viewing with zero monthly subscription fees.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================================== */}
            {/* STEP 2: COVERAGE & CAMERA SELECTION (PROGRESSIVE 3-LEVEL HIERARCHY) */}
            {/* ==================================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                    Step 2 of 6
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Camera Count, Form Factor & Night Vision Hierarchy
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Select your camera count and explore camera options through the progressive 3-level hierarchy: Series, Category, and Category-Specific Options.
                  </p>
                </div>

                {/* 1. Camera Count Selection with Custom Quantity Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      1. Number of Cameras
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCount(!isCustomCount)}
                      className="text-xs font-bold text-[#F15A24] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isCustomCount ? 'Use Standard Counts' : '+ Custom Quantity (>32)'}
                    </button>
                  </div>

                  {!isCustomCount ? (
                    <div className={`grid gap-2 sm:gap-3 ${systemArch === 'wireless' ? 'grid-cols-3' : 'grid-cols-5'}`}>
                      {(systemArch === 'wireless' ? [2, 4, 8] : [2, 4, 8, 16, 32]).map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => handleUpdateCameraCount(cnt)}
                          className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            cameraCount === cnt
                              ? 'bg-[#F15A24] border-[#F15A24] text-white shadow-xs font-bold'
                              : 'bg-white border-[#EDE8E1] text-[#111827] hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-base font-heading font-black">{cnt} Cams</div>
                          <div className={`text-[10px] ${cameraCount === cnt ? 'text-white/80' : 'text-slate-400'}`}>
                            {cnt <= 4 ? 'Standard' : cnt <= 8 ? 'Complete' : 'Enterprise'}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-heading font-bold text-sm text-slate-900">
                            Custom Camera Quantity
                          </div>
                          <p className="text-xs text-slate-600">
                            Enter any quantity from 1 to {systemArch === 'wireless' ? '8 (Wi-Fi limit)' : '128 (Enterprise cluster)'}.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCameraCount(cameraCount - 1)}
                            disabled={cameraCount <= 1}
                            className="w-9 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={systemArch === 'wireless' ? 8 : 128}
                            value={customCountInput}
                            onChange={(e) => {
                              setCustomCountInput(e.target.value);
                              const parsed = parseInt(e.target.value, 10);
                              if (!isNaN(parsed)) {
                                handleUpdateCameraCount(parsed);
                              }
                            }}
                            className="w-20 py-1.5 px-3 border border-slate-300 rounded-lg text-center font-heading font-black text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCameraCount(cameraCount + 1)}
                            disabled={cameraCount >= (systemArch === 'wireless' ? 8 : 128)}
                            className="w-9 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-700">Cameras</span>
                        </div>
                      </div>

                      {systemArch !== 'wireless' && (
                        <div className="flex items-center gap-2 pt-1 border-t border-orange-200/60 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-600">Quick Large Presets:</span>
                          {[40, 48, 64].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => handleUpdateCameraCount(cnt)}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                cameraCount === cnt
                                  ? 'bg-[#F15A24] text-white'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {cnt} Cams
                            </button>
                          ))}
                        </div>
                      )}

                      {cameraCount > 32 && cameraCount <= 64 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>High-Density Deployment ({cameraCount} Cameras):</strong> Deployments exceeding 32 channels are configured with an enterprise multi-recorder cluster (e.g. dual 32-ch headends). Requires engineer verification and official custom quotation.
                          </span>
                        </div>
                      )}

                      {cameraCount > 64 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Large Enterprise Deployment (&gt;64 Cameras):</strong> Configurations above 64 channels require dedicated engineering survey, distribution switch planning, and custom clustered headend design.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Progressive 3-Level Camera Hierarchy */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      2. Camera Series & Category Selection
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Level 1: Series → Level 2: Category → Level 3: Options
                    </span>
                  </div>

                  {/* Level 1: Three Primary Series Cards */}
                  <div className="space-y-3">
                    {CAMERA_SERIES_CONFIG.map((s) => {
                      const isExpanded = systemArch === s.id;
                      return (
                        <div
                          key={s.id}
                          data-series-card={s.id}
                          data-series-expanded={isExpanded ? "true" : undefined}
                          data-series-collapsed={!isExpanded ? "true" : undefined}
                          onClick={() => {
                            if (!isExpanded) handleSelectSeries(s.id);
                          }}
                          className={`rounded-2xl border transition-all ${
                            isExpanded
                              ? 'border-[#F15A24] bg-white ring-1 ring-[#F15A24]/30 shadow-xs'
                              : 'border-[#EDE8E1] bg-white hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                          }`}
                        >
                          {/* Series Header / Accordion Trigger */}
                          <div
                            data-series-toggle={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSeries(s.id);
                            }}
                            className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isExpanded
                                    ? 'bg-[#F15A24] text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {s.id === 'analogue' && <Video className="w-4 h-4" />}
                                {s.id === 'ip' && <Server className="w-4 h-4" />}
                                {s.id === 'wireless' && <Wifi className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-heading font-bold text-sm sm:text-base text-slate-900">
                                    {s.name}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                                    {s.badge}
                                  </span>
                                  {isExpanded && (
                                    <span className="text-[9px] font-black uppercase text-white bg-[#F15A24] px-1.5 py-0.5 rounded">
                                      Active Series
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                                  {s.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                                {isExpanded ? 'Expanded' : 'Click to select'}
                              </span>
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                                  isExpanded ? 'bg-orange-100 text-[#F15A24] rotate-180' : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content: Level 2 Categories & Level 3 Options */}
                          {isExpanded && (
                            <div className="px-4 pb-5 sm:px-5 space-y-5 border-t border-slate-100 pt-4">
                              {/* Infrastructure Cabling Banner */}
                              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-xs text-slate-700 flex items-center gap-2.5">
                                <Info className="w-4 h-4 text-[#F15A24] shrink-0" />
                                <div>
                                  <span className="font-bold text-slate-900">Cabling & Architecture: </span>
                                  <span>{s.cablingNote}</span>
                                </div>
                              </div>

                              {/* Level 2: Camera Categories Grid */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                                    Select Camera Category:
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {s.categories.length} categories available
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {s.categories.map((catId) => {
                                    const cat = CAMERA_CATEGORIES_CONFIG[catId];
                                    const isSelected = cameraCategory === catId;
                                    return (
                                      <button
                                        key={catId}
                                        type="button"
                                        onClick={() => handleSelectCameraCategory(catId)}
                                        data-category-card={catId}
                                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                          isSelected
                                            ? 'border-[#111827] bg-slate-900 text-white shadow-xs'
                                            : 'border-[#EDE8E1] bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-1.5 mb-1">
                                            <span className="font-heading font-bold text-xs sm:text-sm">
                                              {cat.name}
                                            </span>
                                            <span
                                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                isSelected
                                                  ? 'bg-slate-800 text-slate-200'
                                                  : cat.isStocked
                                                  ? 'bg-slate-100 text-slate-600'
                                                  : 'bg-amber-100 text-amber-800'
                                              }`}
                                            >
                                              {cat.badge}
                                            </span>
                                          </div>
                                          <p className={`text-[11px] leading-snug mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {cat.description}
                                          </p>
                                        </div>

                                        <div className="pt-2.5 mt-2 border-t border-slate-200/20 flex items-center justify-between text-[10px]">
                                          <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                                            {cat.isStocked ? 'Catalog Stocked' : 'Engineering Quote'}
                                          </span>
                                          <span className={`font-bold ${isSelected ? 'text-orange-400' : 'text-[#F15A24]'}`}>
                                            {isSelected ? '✓ Selected' : 'Select'}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Level 3: Category-Specific Options for Selected Category */}
                              <div className="pt-2 border-t border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                                    Category Options & Specification: {CAMERA_CATEGORIES_CONFIG[cameraCategory]?.name}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {CAMERA_CATEGORIES_CONFIG[cameraCategory]?.specsSummary}
                                  </span>
                                </div>

                                {/* SPECIALIST CAPABILITIES: EXCLUSIVELY REVEALED WHEN ip_specialized IS ACTIVE */}
                                {cameraCategory === 'ip_specialized' && (
                                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-700" />
                                        <label className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                                          Specialist Mission-Critical Capability
                                        </label>
                                      </div>
                                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                                        Engineering Survey Required
                                      </span>
                                    </div>
                                    <p className="text-xs text-amber-900 leading-relaxed">
                                      Specialized cameras require dedicated optical planning, site assessment, and project quotation. Select your target application:
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                      {SPECIALIST_SUBCATEGORIES_CONFIG.map((sub) => {
                                        const isSubSelected = specialistSubcategory === sub.id || (specialistCapability === sub.id);
                                        return (
                                          <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => handleSelectSpecialistSubcategory(sub.id)}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                              isSubSelected
                                                ? 'border-[#F15A24] bg-white text-slate-900 shadow-2xs font-semibold ring-2 ring-[#F15A24]'
                                                : 'border-amber-200 bg-white/90 text-slate-700 hover:bg-white hover:border-amber-300'
                                            }`}
                                          >
                                            <div>
                                              <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-xs font-bold">{sub.shortName}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sub.badgeColor}`}>
                                                  Quote
                                                </span>
                                              </div>
                                              <p className="text-[10px] text-slate-600 leading-snug">
                                                {sub.description}
                                              </p>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-100">
                                              Ref Model: {sub.model}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Physical Form Factor Selector (if flexible for this category) */}
                                {CAMERA_CATEGORIES_CONFIG[cameraCategory]?.supportedFormFactors &&
                                  CAMERA_CATEGORIES_CONFIG[cameraCategory]!.supportedFormFactors!.length > 1 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                        Physical Housing & Form Factor
                                      </label>
                                      <span className="text-[11px] text-slate-500">
                                        Select mounting style
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2.5">
                                      {[
                                        { key: 'bullet', name: 'Bullet Housing', desc: 'Weatherproof wall mount with hood' },
                                        { key: 'dome', name: 'Dome Housing', desc: 'Vandal-resistant ceiling mount' },
                                        { key: 'turret', name: 'Turret Eyeball', desc: '3-axis ball-and-socket zero IR glare' }
                                      ]
                                        .filter(f => CAMERA_CATEGORIES_CONFIG[cameraCategory]?.supportedFormFactors?.includes(f.key as any))
                                        .map((f) => (
                                          <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => setFormFactor(f.key as CameraFormFactor)}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                              formFactor === f.key
                                                ? 'border-[#F15A24] bg-orange-50/50 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                                                : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                                            }`}
                                          >
                                            <div className="text-xs font-bold">{f.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Fixed Form Factor Indicator (when locked by category) */}
                                {(!CAMERA_CATEGORIES_CONFIG[cameraCategory]?.supportedFormFactors ||
                                  CAMERA_CATEGORIES_CONFIG[cameraCategory]!.supportedFormFactors!.length <= 1) && (
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-slate-500" />
                                      <span>
                                        <strong>Physical Form Factor:</strong>{' '}
                                        {formFactor === 'bullet' && 'Weatherproof Cylindrical Bullet'}
                                        {formFactor === 'dome' && 'Vandal-Resistant Ceiling Dome'}
                                        {formFactor === 'turret' && '3-Axis Eyeball Turret'}
                                        {formFactor === 'ptz' && 'Motorized Speed Dome (PTZ)'}
                                        {formFactor === 'other' && 'Specialty Optical / Industrial Housing'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                                      Standard for this category
                                    </span>
                                  </div>
                                )}

                                {/* Selected Camera Model Showcase Card with Catalog Override Action */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Configured Camera Model
                                      </span>
                                      {cameraSpec.isCustomOverride && (
                                        <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                          Custom Catalog Selection
                                        </span>
                                      )}
                                      {cameraSpec.isSpecialist && (
                                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                          Specialist Consultation
                                        </span>
                                      )}
                                      {!CAMERA_CATEGORIES_CONFIG[cameraCategory]?.isStocked && !cameraSpec.isSpecialist && (
                                        <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                          Custom Procurement
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {cameraSpec.isCustomOverride && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedCameraProduct(null)}
                                          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                        >
                                          Reset to Standard
                                        </button>
                                      )}
                                      {CAMERA_CATEGORIES_CONFIG[cameraCategory]?.isStocked && (
                                        <button
                                          type="button"
                                          onClick={() => setShowCameraPicker(true)}
                                          data-modal-open="camera"
                                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#111827] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                          <Settings2 className="w-3.5 h-3.5 text-[#F15A24]" />
                                          <span>Change Model ({compatibleCatalogCameras.length} Available)</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                    <div>
                                      <div className="font-heading font-bold text-sm sm:text-base text-[#111827]">
                                        {cameraSpec.name}
                                      </div>
                                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                                        Brand: {cameraSpec.brand} · Model: {cameraSpec.model} · SKU: {cameraSpec.sku}
                                      </div>
                                      {cameraSpec.isSpecialist && cameraSpec.specialistReason && (
                                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-2 leading-relaxed">
                                          ⚠️ <strong>Consultation Note:</strong> {cameraSpec.specialistReason}
                                        </p>
                                      )}
                                      {!CAMERA_CATEGORIES_CONFIG[cameraCategory]?.isStocked && !cameraSpec.isSpecialist && (
                                        <p className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded p-2 mt-2 leading-relaxed">
                                          ℹ️ <strong>Project Procurement:</strong> This category requires verified site measurements or optical requirements. CamneX engineers will provide detailed model specifications during quotation.
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Unit Price</div>
                                      {cameraSpec.unitPrice !== null ? (
                                        <div className="font-heading font-black text-base sm:text-lg text-[#F15A24]">
                                          ৳{cameraSpec.unitPrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ cam</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded inline-block">
                                          Quotation Required
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Night Vision Technology - EXACT ORDER: 1. Infrared (IR), 2. Hybrid Light, 3. Full Color */}
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                    Night Vision Technology
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* 1. Infrared (IR) */}
                                    <button
                                      type="button"
                                      onClick={() => setNightVision('ir')}
                                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        nightVision === 'ir'
                                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="font-heading text-sm">1. Infrared (IR)</div>
                                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                                        Pure infrared monochrome night vision up to 20m in complete dark.
                                      </div>
                                    </button>

                                    {/* 2. Hybrid Light */}
                                    <button
                                      type="button"
                                      onClick={() => setNightVision('hybrid')}
                                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        nightVision === 'hybrid'
                                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="font-heading text-sm">2. Hybrid Light</div>
                                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                                        Infrared standby; switches automatically to white light on target detection.
                                      </div>
                                    </button>

                                    {/* 3. Full Color */}
                                    <button
                                      type="button"
                                      onClick={() => setNightVision('colorvu')}
                                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                        nightVision === 'colorvu'
                                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="font-heading text-sm">3. Full Color</div>
                                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                                        24/7 full-color imaging in total darkness with warm supplemental lighting.
                                      </div>
                                    </button>
                                  </div>
                                </div>

                                {/* Pure IR Notice for Analogue Bullet with IR */}
                                {isPureIR && cameraCategory === 'analogue_bullet' && (
                                  <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs space-y-1.5">
                                    <span className="font-bold text-orange-400 flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4" />
                                      <span>Pure Infrared Night Vision Standard (Hikvision IRPF)</span>
                                    </span>
                                    <p className="text-slate-300 text-[11px] leading-relaxed">
                                      This setup uses authentic Hikvision IRPF infrared hardware. It produces reliable black-and-white night vision up to 20 meters. In strict accordance with CamneX engineering rules, this setup makes zero fabricated full-color claims for night footage.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================================== */}
            {/* STEP 3: RECORDER & STORAGE MATCHING */}
            {/* ==================================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                    Step 3 of 6
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Recorder Sizing & Surveillance Hard Drive
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Recorders are automatically matched to support your channel count. Surveillance-grade hard drives ensure 24/7 continuous write durability.
                  </p>
                </div>

                {/* Matched Recorder Card with Catalog Override Actions */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Matched Hardware Recorder
                    </span>
                    <div className="flex items-center gap-2">
                      {recorderSpec.isMultiRecorder ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Enterprise Multi-Recorder Cluster ({recorderSpec.channels} Channels across 2x Units)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {recorderSpec.channels} Channels Matched for {cameraCount} Cameras
                        </span>
                      )}
                      {recorderSpec.isCustomModel && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-heading font-bold text-base text-[#111827]">
                        {recorderSpec.name}
                      </h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Model: {recorderSpec.model} · SKU: {recorderSpec.sku}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      {recorderSpec.unitPrice !== null ? (
                        <div className="font-heading font-black text-lg text-[#111827]">
                          ৳{recorderSpec.unitPrice.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Quote required
                        </span>
                      )}
                    </div>
                  </div>

                  {recorderSpec.isMultiRecorder && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                      💡 <strong>Multi-Unit Headend Architecture:</strong> Configurations with &gt;32 cameras utilize dual interconnected 32-channel network/digital video recorders for optimal bandwidth management and redundancy. Official engineering quotation required.
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                    <span className="text-slate-500">
                      Looking for a specific recorder model?
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedRecorderProduct && (
                        <button
                          type="button"
                          onClick={() => setSelectedRecorderProduct(null)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                        >
                          Reset to Recommended
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowRecorderPicker(true)}
                        data-modal-open="recorder"
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Wrench className="w-3.5 h-3.5 text-[#F15A24]" />
                        <span>Change Recorder ({compatibleCatalogRecorders.length} Models)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Storage Capacity Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Surveillance Storage Capacity
                    </label>
                    <span className="text-xs text-slate-500">
                      WD Purple / Seagate SkyHawk 24/7 Surveillance Series
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: '500gb', size: '500 GB', days: '~7-10 Days', price: '৳1,800' },
                      { key: '1tb', size: '1 TB', days: '~10-14 Days', price: '৳4,800' },
                      { key: '2tb', size: '2 TB', days: '~14-21 Days', price: '৳6,900' },
                      { key: '4tb', size: '4 TB', days: '~30+ Days', price: '৳11,200' }
                    ].map((stg) => (
                      <button
                        key={stg.key}
                        type="button"
                        onClick={() => setStorageOption(stg.key as StorageOption)}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          storageOption === stg.key
                            ? 'bg-[#F15A24] border-[#F15A24] text-white shadow-xs'
                            : 'bg-white border-[#EDE8E1] text-[#111827] hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-heading font-bold text-base">{stg.size}</div>
                        <div className={`text-xs ${storageOption === stg.key ? 'text-white/80' : 'text-slate-500'}`}>
                          {stg.days}
                        </div>
                        <div className={`text-[11px] font-bold mt-1 ${storageOption === stg.key ? 'text-white' : 'text-[#F15A24]'}`}>
                          {stg.price}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    * Estimated retention days are calculated for {cameraCount} cameras with H.265+ smart motion compression.
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================================== */}
            {/* STEP 4: ACCESSORIES & MONITOR */}
            {/* ==================================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                    Step 4 of 6
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Cabling, Power Supplies & Display Monitor
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Transparent accessory calculation. Power adapters, video baluns, and cables are scaled to your exact camera count.
                  </p>
                </div>

                {/* Cable Allocation Rule Banner & Interactive Distance Control */}
                <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[#D94D1C]">
                      <Cable className="w-4 h-4" />
                      <span>Strict 10m/Camera Cable Allocation Rule</span>
                    </div>
                    {customCableLength !== null && (
                      <button
                        type="button"
                        onClick={() => setCustomCableLength(null)}
                        className="text-[11px] font-bold text-[#F15A24] hover:underline cursor-pointer"
                      >
                        Reset to Default (10m/cam)
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    Based on CamneX installation standards, exactly <strong>10 meters of pure copper cable</strong> is allocated per camera by default. For your {cameraCount} cameras, this totals <strong>{cableLengthMeters} meters</strong> of high-grade transmission cable.
                  </p>

                  {/* Interactive Cable Quantity Adjustment */}
                  <div className="pt-3 border-t border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        Adjust Cable Length for Site Layout
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Current: {cableLengthMeters}m ({(cableLengthMeters / cameraCount).toFixed(1)}m/cam average)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomCableLength(Math.max(10, cableLengthMeters - 10))}
                        disabled={cableLengthMeters <= 10}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40 cursor-pointer text-xs"
                      >
                        -10m
                      </button>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          step="5"
                          value={cableLengthMeters}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 5) {
                              setCustomCableLength(val);
                            }
                          }}
                          className="w-16 py-1 px-2 border border-slate-300 rounded-lg text-center font-heading font-black text-sm text-slate-900 bg-white"
                        />
                        <span className="ml-1 text-xs font-bold text-slate-600">m</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomCableLength(cableLengthMeters + 10)}
                        className="w-8 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer text-xs"
                      >
                        +10m
                      </button>
                    </div>
                  </div>

                  {/* Quick Distance Presets */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                    <span className="font-bold text-slate-600">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setCustomCableLength(cameraCount * 10)}
                      className={`px-2.5 py-0.5 rounded border transition cursor-pointer font-semibold ${
                        cableLengthMeters === cameraCount * 10
                          ? 'bg-[#F15A24] border-[#F15A24] text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Standard (10m/cam = {cameraCount * 10}m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomCableLength(cameraCount * 15)}
                      className={`px-2.5 py-0.5 rounded border transition cursor-pointer font-semibold ${
                        cableLengthMeters === cameraCount * 15
                          ? 'bg-[#F15A24] border-[#F15A24] text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Medium (15m/cam = {cameraCount * 15}m)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomCableLength(cameraCount * 25)}
                      className={`px-2.5 py-0.5 rounded border transition cursor-pointer font-semibold ${
                        cableLengthMeters === cameraCount * 25
                          ? 'bg-[#F15A24] border-[#F15A24] text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Long Distance (25m/cam = {cameraCount * 25}m)
                    </button>
                  </div>
                </div>

                {/* Analogue Transmission Technology Mode Toggle */}
                {systemArch === 'analogue' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Analogue Transmission Cabling Architecture
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAnalogueTransmission('coaxial')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          analogueTransmission === 'coaxial'
                            ? 'border-[#F15A24] bg-orange-50/40 text-slate-900 font-bold ring-1 ring-[#F15A24]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-heading text-sm text-slate-900">
                          Direct Solid Copper RG59 Coaxial
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
                          Pure point-to-point coaxial video. Uses heavy-duty BNC crimp connectors & DC pigtails (zero baluns).
                        </div>
                        <span className="inline-block mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Recommended Standard
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAnalogueTransmission('utp_baluns')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          analogueTransmission === 'utp_baluns'
                            ? 'border-[#F15A24] bg-orange-50/40 text-slate-900 font-bold ring-1 ring-[#F15A24]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-heading text-sm text-slate-900">
                          Cat6 UTP with HD Video Baluns
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
                          Transmits video over twisted-pair Cat6 network cable using matched passive HD video baluns.
                        </div>
                        <span className="inline-block mt-2 text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                          Multi-Pair / Conduit Laying
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Power Supply Info Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>Regulated Power Distribution</span>
                  </div>
                  <div className="text-slate-600">
                    Included: <strong>{powerSpec?.name}</strong>. Provides clean, surge-protected 12V DC power distribution matched to camera load.
                  </div>
                </div>

                {/* Optional Display Monitor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Optional Security Display Monitor
                    </label>
                    <span className="text-xs text-slate-500">
                      Connects directly to HDMI output
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setMonitorOption('none')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === 'none'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">No Monitor Included</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Use smartphone app, PC browser, or existing TV / computer monitor.
                      </div>
                      <div className="text-xs font-bold text-emerald-600 mt-2">৳0 (Included)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonitorOption('17inch')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === '17inch'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">17-Inch HD Monitor</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Compact security desk display. Recommended for 2 to 4 camera setups.
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-2">Ask for price</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonitorOption('19inch')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === '19inch'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">19-Inch LED Monitor</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Full surveillance display with wide angles. Recommended for 8 to 16 cameras.
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-2">Ask for price</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================================== */}
            {/* STEP 5: ITEMIZED BILL OF MATERIALS (BOM) REVIEW */}
            {/* ==================================================================== */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                      Step 5 of 6
                    </span>
                    <h2 className="text-xl font-heading font-black text-[#111827]">
                      Itemized Bill of Materials (BOM)
                    </h2>
                    <p className="text-xs text-[#5B6472] mt-0.5">
                      Inspect every hardware component, model number, unit quantity, and line price before ordering.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyBOM}
                      className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedBOM ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedBOM ? 'BOM Copied!' : 'Copy BOM'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBOM}
                      className="px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      {downloadedBOM ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-slate-300" />}
                      <span>{downloadedBOM ? 'Downloaded!' : 'Download BOM (.txt)'}</span>
                    </button>
                  </div>
                </div>

                {/* Stable 7-Day BOM Validity Banner */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>
                      <strong>Date of Issue:</strong> {bomDates.issueDate} · <strong>Validity:</strong> 7 Calendar Days (Valid Until: <span className="text-orange-400 font-bold">{bomDates.validUntilDate}</span>)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Ref: BOM-NX-{cameraCount}C-{systemArch.toUpperCase()}
                  </span>
                </div>

                {/* Compatibility Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Channels</div>
                    <div className="font-bold">{recorderSpec.channels} Ch Matched</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Storage</div>
                    <div className="font-bold">{storageOption.toUpperCase()} Surveillance</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Cable Rule</div>
                    <div className="font-bold">{cableLengthMeters}m ({systemArch === 'ip' ? 'Cat6' : analogueTransmission === 'utp_baluns' ? 'UTP' : 'RG59'})</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Power Unit</div>
                    <div className="font-bold">12V Regulated</div>
                  </div>
                </div>

                {/* BOM Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm">
                  {computedBOM.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-slate-50 transition"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F15A24]">
                          {comp.role}
                        </span>
                        <div className="font-heading font-bold text-slate-900">
                          {comp.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Model: {comp.model} · SKU: {comp.sku}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-500">Qty: </span>
                          <span className="font-bold text-slate-800">{comp.qty}</span>
                        </div>

                        <div className="text-right min-w-[90px]">
                          {comp.lineTotal !== null ? (
                            <div className="font-heading font-black text-slate-900">
                              ৳{comp.lineTotal.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Ask for price
                            </span>
                          )}
                          {comp.unitPrice !== null && comp.qty > 1 && (
                            <div className="text-[10px] text-slate-400">
                              @ ৳{comp.unitPrice.toLocaleString()}/ea
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclaimers & Notes */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#F15A24]" />
                    <span>Important Commercial & Service Disclaimers</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 leading-relaxed">
                    <li>
                      <strong>Pricing:</strong> Equipment prices may vary depending on official distributor exchange rate and actual order placement date.
                    </li>
                    <li>
                      <strong>Service Charges:</strong> Installation, conduit casing/piping, and engineering commissioning charges are excluded from the hardware total and will be quoted following on-site survey.
                    </li>
                    <li>
                      <strong>Warranty:</strong> Official Bangladesh distributor warranty applies to all eligible cameras (1-2 years), recorders (1-2 years), and Western Digital / Seagate surveillance hard drives (3 years).
                    </li>
                  </ul>
                </div>

                {/* Pure IR Notice */}
                {isPureIR && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pure Infrared Verification:</strong> This bill of materials contains genuine Hikvision IRPF hardware. Real infrared clarity up to 20m.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================================== */}
            {/* STEP 6: FINALIZE & ORDER / QUOTE */}
            {/* ==================================================================== */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                    Step 6 of 6
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Ready to Order or Request Site Survey
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Your custom system has been verified. You can add it directly to cart or submit it for an engineer site consultation in Dhaka.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      Engineered Turnkey Configuration
                    </span>
                    <span className="text-xs text-slate-400">
                      {cameraCount} Cameras · {formFactor.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div className="space-y-1.5">
                      <div><strong>Architecture:</strong> {systemArch.toUpperCase()}</div>
                      <div><strong>Camera Model:</strong> {cameraSpec.name}</div>
                      <div><strong>Night Vision:</strong> {nightVision.toUpperCase()}</div>
                      <div><strong>Recorder:</strong> {recorderSpec.name}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div><strong>Storage:</strong> {storageOption.toUpperCase()} (Surveillance)</div>
                      <div><strong>Cabling:</strong> {cableLengthMeters}m @ 10m/cam</div>
                      <div><strong>Power Supply:</strong> {powerSpec?.name || 'Standard'}</div>
                      <div><strong>Monitor:</strong> {monitorSpec ? monitorSpec.name : 'None'}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {quotationRequired ? 'System Pricing' : 'Total Package Price'}
                      </span>
                      {totalPrice !== null ? (
                        <div className="text-3xl font-heading font-black text-white">
                          ৳{totalPrice.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-2xl font-heading font-black text-amber-400">
                          Ask for price
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {quotationRequired
                          ? quotationReason || 'Custom setup requires technical consultation.'
                          : 'Includes all hardware, cables, connectors & 1-Year Bangladesh Warranty'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {quotationRequired ? (
                        <Button
                          size="lg"
                          onClick={handleRequestQuote}
                          className="bg-[#F15A24] hover:bg-[#D94D1C] text-white"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          <span>Request Official Quote</span>
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          onClick={handleAddPackageToCart}
                          className="bg-[#F15A24] hover:bg-[#D94D1C] text-white"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          <span>Add Package to Cart</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Engineering Support Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-800 mb-0.5">1-Year Warranty</strong>
                    Official Bangladesh distributor warranty on all cameras and recorders.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-800 mb-0.5">Nationwide Delivery</strong>
                    Safe express courier delivery across all 64 districts in Bangladesh.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-800 mb-0.5">Installation Available</strong>
                    Experienced CamneX certified technician team available in Dhaka and major cities.
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Controls (Prev / Next) */}
            <div className="pt-6 border-t border-[#EDE8E1] flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  data-prev-step="true"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  data-next-step="true"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Next: {steps[currentStep].label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestQuote}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Book Site Survey Instead</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Sticky Summary Sidebar (4 columns on desktop) */}
          <div className="lg:col-span-4 bg-white rounded-[20px] border border-[#EDE8E1] p-6 shadow-xs space-y-5 lg:sticky lg:top-24">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#111827]">
                Live Package Summary
              </h3>
              <Badge variant="orange" className="text-[10px]">
                {cameraCount} Cameras
              </Badge>
            </div>

            {/* Spec Highlights List */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">System:</span>
                <span className="font-bold text-slate-800 text-right capitalize">
                  {systemArch === 'wireless' ? 'Wi-Fi Wireless' : systemArch === 'ip' ? 'IP Network (PoE)' : 'Analogue HD'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Camera Model:</span>
                <span className="font-bold text-slate-800 text-right line-clamp-1" title={cameraSpec.name}>
                  {cameraSpec.name}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Housing:</span>
                <span className="font-bold text-slate-800 capitalize text-right">
                  {formFactor} mount
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Night Vision:</span>
                <span className="font-bold text-slate-800 capitalize text-right">
                  {nightVision === 'ir' ? 'Pure IR (20m)' : nightVision === 'colorvu' ? 'ColorVu (24/7 Color)' : 'Smart Hybrid'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Recorder:</span>
                <span className="font-bold text-slate-800 text-right">
                  {recorderSpec.channels}-Ch ({recorderSpec.model})
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Surveillance HDD:</span>
                <span className="font-bold text-slate-800 text-right">
                  {storageOption.toUpperCase()}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Cable Allocation:</span>
                <span className="font-bold text-emerald-700 text-right">
                  {cableLengthMeters}m (10m/cam)
                </span>
              </div>

              {monitorOption !== 'none' && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Display Monitor:</span>
                  <span className="font-bold text-amber-700 text-right">
                    {monitorOption === '17inch' ? '17" HD Monitor' : '19" LED Monitor'}
                  </span>
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {quotationRequired ? 'Investment Assessment' : 'Package Total Price'}
              </span>
              {totalPrice !== null ? (
                <div className="text-2xl sm:text-3xl font-heading font-black text-[#F15A24]">
                  ৳{totalPrice.toLocaleString()}
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-heading font-black text-amber-600">
                  Ask for price
                </div>
              )}
              <div className="text-[10px] text-slate-500">
                {quotationRequired
                  ? 'Custom specification requires engineer quote.'
                  : 'Includes all parts, cables, storage & accessories.'}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {quotationRequired ? (
                <button
                  type="button"
                  onClick={handleRequestQuote}
                  className="w-full py-3 px-4 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Request Official Quotation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddPackageToCart}
                  className="w-full py-3 px-4 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Package to Cart</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRequestQuote}
                className="w-full py-2.5 px-4 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Book Site Survey for Setup</span>
              </button>
            </div>
          </div>

        </div>

        {/* ==================================================================== */}
        {/* CAMERA CATALOG PICKER MODAL */}
        {/* ==================================================================== */}
        {showCameraPicker && (
          <div data-modal="camera-catalog" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-heading font-black text-lg text-[#111827]">
                    Select Camera from Catalog
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing {compatibleCatalogCameras.length} compatible {systemArch.toUpperCase()} camera models from live inventory
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCameraPicker(false)}
                  data-modal-close="camera"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                {compatibleCatalogCameras.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No matching camera models found in catalog for this system architecture.
                  </div>
                ) : (
                  compatibleCatalogCameras.map((prod) => {
                    const isSelected = selectedCameraProduct?.id === prod.id;
                    const price = getProductPrice(prod);

                    return (
                      <div
                        key={prod.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-[#F15A24] bg-orange-50/40 ring-1 ring-[#F15A24]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-sm text-[#111827]">
                              {prod.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase text-white bg-[#F15A24] px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Model: {prod.modelNumber || prod.id} · Brand: {prod.brand || 'Hikvision'}
                          </div>
                          {prod.shortDescription && (
                            <p className="text-xs text-slate-600 line-clamp-1">
                              {prod.shortDescription}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                          <div className="font-heading font-black text-base text-[#111827]">
                            {price ? `৳${price.toLocaleString()}` : 'Ask for price'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCameraProduct(prod);
                              setShowCameraPicker(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-[#111827] hover:bg-black text-white shadow-xs'
                            }`}
                          >
                            {isSelected ? 'Keep Selected' : 'Select This Camera'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                {selectedCameraProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCameraProduct(null);
                      setShowCameraPicker(false);
                    }}
                    className="text-xs font-bold text-[#F15A24] hover:underline cursor-pointer"
                  >
                    Reset to Auto-Engineered Model
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => setShowCameraPicker(false)}
                  data-modal-close="camera"
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* RECORDER CATALOG PICKER MODAL */}
        {/* ==================================================================== */}
        {showRecorderPicker && (
          <div data-modal="recorder-catalog" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-heading font-black text-lg text-[#111827]">
                    Select Compatible Recorder
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing {compatibleCatalogRecorders.length} compatible {systemArch.toUpperCase()} recorder units
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecorderPicker(false)}
                  data-modal-close="recorder"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                {compatibleCatalogRecorders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No matching recorders found for this system type.
                  </div>
                ) : (
                  compatibleCatalogRecorders.map((rec) => {
                    const isSelected = selectedRecorderProduct?.id === rec.id;
                    const price = getProductPrice(rec);
                    const ch = rec.specifications?.channels || rec.specifications?.channel_capacity;

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-[#F15A24] bg-orange-50/40 ring-1 ring-[#F15A24]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-sm text-[#111827]">
                              {rec.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase text-white bg-[#F15A24] px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                            {ch && (
                              <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                {ch} Channels
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Model: {rec.modelNumber || rec.id} · Brand: {rec.brand || 'Hikvision'}
                          </div>
                          {ch && parseInt(ch, 10) < cameraCount && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 rounded p-1.5 border border-amber-200">
                              ⚠️ Channel count ({ch}) is lower than camera count ({cameraCount}). Additional cluster unit will be required.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                          <div className="font-heading font-black text-base text-[#111827]">
                            {price ? `৳${price.toLocaleString()}` : 'Ask for price'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecorderProduct(rec);
                              setShowRecorderPicker(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-[#111827] hover:bg-black text-white shadow-xs'
                            }`}
                          >
                            {isSelected ? 'Keep Selected' : 'Select This Recorder'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                {selectedRecorderProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecorderProduct(null);
                      setShowRecorderPicker(false);
                    }}
                    className="text-xs font-bold text-[#F15A24] hover:underline cursor-pointer"
                  >
                    Reset to Recommended Recorder
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => setShowRecorderPicker(false)}
                  data-modal-close="recorder"
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* IN-PAGE QUOTATION REQUEST MODAL */}
        {/* ==================================================================== */}
        {showQuoteModal && (
          <div data-modal="package-quote" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-[#111827]">
                      Request Official Engineering Quotation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configured for {cameraCount} Cameras · {systemArch.toUpperCase()} Architecture
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  data-modal-close="package-quote"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {quoteSuccessResult ? (
                  <div className="py-8 px-4 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Quote Submitted Successfully
                      </span>
                      <h4 className="font-heading font-black text-xl text-[#111827]">
                        Thank You, {quoteFormData.customerName.trim()}!
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                        Your custom CCTV system configuration has been registered with our senior surveillance integration engineers in Dhaka.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Quotation Reference Number</span>
                      <div className="font-mono font-black text-lg text-[#F15A24]">
                        {quoteSuccessResult.quoteNumber}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Please save this reference number. Our engineer will call you within 2–4 business hours.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowQuoteModal(false)}
                      className="px-6 py-2.5 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Done & Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleQuoteFormSubmit} className="space-y-4">
                    {/* Hardware Summary Box */}
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 text-xs space-y-2">
                      <div className="font-heading font-bold text-slate-900 flex items-center justify-between">
                        <span>BOM Hardware Summary</span>
                        <span className="font-black text-[#F15A24]">
                          {totalPrice !== null ? `৳${totalPrice.toLocaleString()} BDT` : 'Quotation Required'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                        <div><strong>Architecture:</strong> {systemArch.toUpperCase()}</div>
                        <div><strong>Cameras:</strong> {cameraCount}x {cameraSpec.name}</div>
                        <div><strong>Night Vision:</strong> {nightVision.toUpperCase()}</div>
                        <div><strong>Recorder:</strong> {recorderSpec.channels}-Ch ({recorderSpec.model})</div>
                        <div><strong>Storage:</strong> {storageOption.toUpperCase()} Surveillance</div>
                        <div><strong>Cabling:</strong> {cableLengthMeters}m pure copper</div>
                      </div>
                    </div>

                    {/* Turnkey Installation Checkbox */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="includeInstallation"
                        checked={quoteFormData.includeInstallation}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, includeInstallation: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-[#F15A24] rounded border-slate-300 focus:ring-[#F15A24] cursor-pointer"
                      />
                      <label htmlFor="includeInstallation" className="text-xs text-slate-700 cursor-pointer">
                        <strong className="text-slate-900 block">Include Turnkey Installation & Commissioning Service</strong>
                        Certified technician team will handle physical cable laying, conduit piping, camera aiming, and DVR/NVR network configuration on-site in Dhaka and major cities.
                      </label>
                    </div>

                    {/* Customer Contact Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={quoteFormData.customerName}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, customerName: e.target.value })}
                          placeholder="e.g. Engr. Tanvir Ahmed"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Mobile Phone (11 Digits) *</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={quoteFormData.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuoteFormData(prev => ({
                              ...prev,
                              phone: val,
                              whatsapp: prev.whatsappSameAsPhone ? val : prev.whatsapp
                            }));
                          }}
                          placeholder="01712345678"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700 flex items-center gap-1">
                            <span>WhatsApp Number</span>
                          </label>
                          <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quoteFormData.whatsappSameAsPhone}
                              onChange={(e) => {
                                const chk = e.target.checked;
                                setQuoteFormData(prev => ({
                                  ...prev,
                                  whatsappSameAsPhone: chk,
                                  whatsapp: chk ? prev.phone : prev.whatsapp
                                }));
                              }}
                              className="rounded border-slate-300 text-[#F15A24]"
                            />
                            <span>Same as mobile</span>
                          </label>
                        </div>
                        <input
                          type="tel"
                          value={quoteFormData.whatsapp}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, whatsapp: e.target.value })}
                          placeholder="01712345678 (Optional)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Email Address</span>
                        </label>
                        <input
                          type="email"
                          value={quoteFormData.email}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, email: e.target.value })}
                          placeholder="you@example.com (Optional)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>Company / Organization</span>
                        </label>
                        <input
                          type="text"
                          value={quoteFormData.companyName}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, companyName: e.target.value })}
                          placeholder="Company name or Home (Optional)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Installation Site Address</span>
                        </label>
                        <input
                          type="text"
                          value={quoteFormData.siteAddress}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, siteAddress: e.target.value })}
                          placeholder="e.g. Uttara Sector 7, Dhaka"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700">
                        Project Notes / Special Site Requirements
                      </label>
                      <textarea
                        rows={2}
                        value={quoteFormData.notes}
                        onChange={(e) => setQuoteFormData({ ...quoteFormData, notes: e.target.value })}
                        placeholder="Mention any ceiling type, outdoor boundary distance, or specific installation timeline..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24] resize-none"
                      />
                    </div>

                    {quoteErrorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{quoteErrorMessage}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowQuoteModal(false)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={quoteSubmitting}
                        className="px-6 py-2.5 rounded-full bg-[#F15A24] hover:bg-[#D94D1C] text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {quoteSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting Quote Request...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Official Quote Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
