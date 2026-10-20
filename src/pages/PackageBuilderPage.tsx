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
  Database,
  Clock,
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
  Loader2,
  Monitor,
  Volume2,
  Box,
  Truck
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
  Product,
  PowerSupplyProfile
} from '../types';
import { useCartStore, useCustomerAuthStore, useSettingsStore } from '../store';
import { BANGLADESH_DISTRICTS, DISTRICT_NAMES, getThanasForDistrict } from '../data/bangladeshLocations';
import { downloadBomDocument, generateBomText, BomExportData } from '../utils/bomExporter';

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
export type StorageOption = '500gb' | '1tb' | '2tb' | '4tb' | 'dual_2tb' | 'dual_4tb' | 'quad_4tb' | 'barracuda_2tb' | 'none';
export type MonitorOption = 'none' | '17inch' | '19inch' | '24inch' | '32inch' | 'large';
export type WallMountOption = 'none' | 'standard_vesa' | 'heavy_duty_tilt';


export interface RecorderHardwareProfile {
  channels: number;
  name: string;
  model: string;
  sku: string;
  unitPrice: number | null;
  brand: string;
  isCustomModel: boolean;
  isMultiRecorder: boolean;
  isUnderCapacity: boolean;
  underCapacityReason?: string;
  sataBays: number;
  analogueBncChannels: number;
  hybridIpInputs: number;
  maxResolution: string;
  compression: string;
  incomingBandwidthMbps?: number;
  poePorts?: number;
  raidSupported?: boolean;
  isWirelessEdge?: boolean;
  wirelessDutyCycleNote?: string;
  warrantyMonths?: number;
}

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
  warrantyMonths?: number;
  warrantyText?: string;
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
  const [requiresTwoWayAudio, setRequiresTwoWayAudio] = useState<boolean>(false);
  const [wirelessRecordingType, setWirelessRecordingType] = useState<'nvr' | 'standalone_sd' | 'third_party_nvr'>('nvr');
  const [storageOption, setStorageOption] = useState<StorageOption>('500gb');
  const [selectedHddModel, setSelectedHddModel] = useState<string | null>(null);
  const [showStoragePicker, setShowStoragePicker] = useState<boolean>(false);
  const [hasUserCustomizedStorage, setHasUserCustomizedStorage] = useState<boolean>(false);
  const [recordingMode, setRecordingMode] = useState<'motion' | 'continuous'>('motion');
  const [monitorOption, setMonitorOption] = useState<MonitorOption>('none');
  const [wallMountOption, setWallMountOption] = useState<WallMountOption>('none');
  const [hasUserCustomizedMonitor, setHasUserCustomizedMonitor] = useState<boolean>(false);
  const [customCableLength, setCustomCableLength] = useState<number | null>(null);
  const [analogueTransmission, setAnalogueTransmission] = useState<'coaxial' | 'utp_baluns'>('coaxial');
  const [includeJunctionBoxes, setIncludeJunctionBoxes] = useState<boolean>(true);
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

  // Customer Auth and Website Settings Hooks
  const { currentCustomer, isCustomerAuthenticated } = useCustomerAuthStore();
  const { settings } = useSettingsStore();

  // In-Page Quotation Modal State & Bangladesh Address
  const [showQuoteModal, setShowQuoteModal] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Dhaka');
  const [selectedThana, setSelectedThana] = useState<string>('Gulshan');
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>('new');
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
  const [quoteFormErrors, setQuoteFormErrors] = useState<{
    customerName?: string;
    phone?: string;
    email?: string;
    district?: string;
    siteAddress?: string;
  }>({});


  // Escape key accessibility handler to close quotation modal
  useEffect(() => {
    if (!showQuoteModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQuoteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuoteModal]);

  // BOM validity: 7 calendar days from issue date, stable across page reloads
  const [bomDates, setBomDates] = useState<{ issueDate: string; validUntilDate: string }>(() => {
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

    // If switching to wireless, validate limits: supported wireless NVR ecosystem supports up to 18 channels
    if (arch === 'wireless') {
      if (cameraCount > 18 && wirelessRecordingType === 'nvr') {
        setCameraCount(18);
        setCustomCountInput('18');
        msg += 'Supported wireless NVR ecosystem has an 18-camera maximum limit. For higher quantities, select Standalone Edge MicroSD storage or third-party NVR integration.';
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

  // Camera count update helper with boundary enforcement and standard package defaults
  const handleUpdateCameraCount = (newCount: number) => {
    const maxLimit = systemArch === 'wireless'
      ? (wirelessRecordingType === 'nvr' ? 18 : 64)
      : 128;
    const validCount = Math.max(1, Math.min(maxLimit, Math.floor(newCount) || 1));
    setCameraCount(validCount);
    setCustomCountInput(String(validCount));


    // Standard package defaults: 2-4 cams -> 500GB & 17", 8 cams -> 1TB, 16 cams -> 2TB & 19"
    if (!hasUserCustomizedStorage) {
      if (validCount <= 4) {
        setStorageOption('500gb');
      } else if (validCount <= 8) {
        setStorageOption('1tb');
      } else if (validCount <= 16) {
        setStorageOption('2tb');
      } else {
        setStorageOption('4tb');
      }
    }

    // Keep monitor optional (default 'none' unless explicitly selected by user in Step 4)
    if (hasUserCustomizedMonitor && monitorOption !== 'none') {
      if (validCount <= 4) {
        setMonitorOption('17inch');
      } else if (validCount >= 16) {
        setMonitorOption('19inch');
      }
    }
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
      const name = (p.name || '').toLowerCase();
      const isRec = cat === 'recorders' || cat === 'dvr-nvr-recorders' || cat === 'cat-recorders' || (p.category && p.category.toLowerCase().includes('recorder'));
      return isRec && p.status !== 'archived';
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

  // Derive Recorder Sizing & Complete Hardware Profile
  const recorderSpec: RecorderHardwareProfile = useMemo(() => {
    // 1. If user manually selected a catalog recorder, evaluate its exact specifications
    if (selectedRecorderProduct) {
      const recId = selectedRecorderProduct.id;
      const name = selectedRecorderProduct.name;
      const model = selectedRecorderProduct.modelNumber || selectedRecorderProduct.model || 'REC-CUSTOM';
      const sku = selectedRecorderProduct.sku || selectedRecorderProduct.id;
      const brand = getProductBrand(selectedRecorderProduct);
      const unitPrice = getProductPrice(selectedRecorderProduct);
      const specs = selectedRecorderProduct.specifications || {};

      let analogueBncChannels = 0;
      let hybridIpInputs = 0;
      let totalChannels = 8;
      let sataBays = 1;
      let maxHddCapacityPerBayTb = 10;
      let maxResolution = '5MP Lite / 1080p';
      let compression = 'H.265 Pro+';
      let incomingBandwidthMbps: number | undefined = undefined;
      let poePorts: number | undefined = undefined;
      let raidSupported = false;

      // Extract verified specifications for known catalog models
      if (recId === 'prod-hik-dvr-4ch' || model.includes('7204')) {
        analogueBncChannels = 4;
        hybridIpInputs = 1;
        totalChannels = 5;
        sataBays = 1;
        maxHddCapacityPerBayTb = 10;
        maxResolution = '5MP Lite / 1080p @ 15fps';
        compression = 'H.265 Pro+';
      } else if (recId === 'prod-hik-dvr-8ch' || model.includes('7208')) {
        analogueBncChannels = 8;
        hybridIpInputs = 2;
        totalChannels = 10;
        sataBays = 1;
        maxHddCapacityPerBayTb = 10;
        maxResolution = '5MP Lite / 1080p';
        compression = 'H.265 Pro+';
      } else if (recId === 'prod-dahua-xvr-8ch' || model.includes('5108')) {
        analogueBncChannels = 8;
        hybridIpInputs = 4;
        totalChannels = 12;
        sataBays = 1;
        maxHddCapacityPerBayTb = 16;
        maxResolution = '5MP';
        compression = 'AI Coding (H.265+)';
      } else if (recId === 'prod-hik-dvr-16ch' || model.includes('7216')) {
        analogueBncChannels = 16;
        hybridIpInputs = 2;
        totalChannels = 18;
        sataBays = 2;
        maxHddCapacityPerBayTb = 10;
        maxResolution = '5MP Lite / 1080p';
        compression = 'H.265 Pro+';
      } else if (recId === 'prod-dahua-xvr-16ch' || model.includes('5216')) {
        analogueBncChannels = 16;
        hybridIpInputs = 8;
        totalChannels = 24;
        sataBays = 2;
        maxHddCapacityPerBayTb = 16;
        maxResolution = '5MP';
        compression = 'AI Coding (H.265+)';
      } else if (recId === 'prod-hik-dvr-32ch' || model.includes('7232')) {
        analogueBncChannels = 32;
        hybridIpInputs = 16;
        totalChannels = 48;
        sataBays = 4;
        maxHddCapacityPerBayTb = 10;
        maxResolution = '5MP Lite / 1080p';
        compression = 'H.265 Pro+';
      } else if (recId === 'prod-hik-nvr-8ch-poe' || model.includes('7608')) {
        analogueBncChannels = 0;
        hybridIpInputs = 8;
        totalChannels = 8;
        poePorts = 8;
        incomingBandwidthMbps = 80;
        sataBays = 1;
        maxHddCapacityPerBayTb = 6;
        maxResolution = '8MP (4K Ultra HD)';
        compression = 'H.265+';
      } else {
        // Generic fallback from specifications
        const chStr = specs.channels || specs.channel_capacity || '';
        totalChannels = parseInt(chStr, 10) || 8;
        analogueBncChannels = systemArch === 'analogue' ? totalChannels : 0;
        hybridIpInputs = systemArch === 'ip' ? totalChannels : 0;
        sataBays = specs.hdd_slots?.includes('2') ? 2 : specs.hdd_slots?.includes('4') ? 4 : 1;
        maxResolution = specs.max_resolution || '1080p Full HD';
        compression = specs.compression || 'H.265+';
      }

      // Check Under-Capacity / Incompatibility
      let isUnderCapacity = false;
      let underCapacityReason = '';

      if (systemArch === 'analogue') {
        // Strict physical analogue channel check! Hybrid IP inputs do not connect coaxial/balun lines.
        if (cameraCount > analogueBncChannels) {
          isUnderCapacity = true;
          underCapacityReason = `Under-capacity analogue DVR: This model has ${analogueBncChannels} physical analogue BNC inputs for your ${cameraCount} cameras. The ${hybridIpInputs} extra hybrid IP inputs cannot connect physical coaxial or UTP/balun camera lines.`;
        }
      } else if (systemArch === 'ip') {
        if (cameraCount > totalChannels) {
          isUnderCapacity = true;
          underCapacityReason = `Under-capacity IP NVR: This NVR supports up to ${totalChannels} IP channels (${cameraCount - totalChannels} channels short for your ${cameraCount} cameras).`;
        }
      } else if (systemArch === 'wireless') {
        if (cameraCategory === 'wifi_battery' || cameraCategory === 'wifi_solar') {
          isUnderCapacity = true;
          underCapacityReason = 'Battery and solar cameras operate in low-power PIR sleep cycles and cannot stream 24/7 continuous video to an NVR. High-endurance edge MicroSD recording or cloud gateway is recommended.';
        } else if (cameraCount > totalChannels) {
          isUnderCapacity = true;
          underCapacityReason = `Under-capacity wireless NVR: This unit supports up to ${totalChannels} Wi-Fi channels, but your setup requires ${cameraCount} channels.`;
        }
      }

      const isMultiRecorder = cameraCount > (systemArch === 'analogue' ? analogueBncChannels : totalChannels);

      return {
        channels: totalChannels,
        name,
        model,
        sku,
        unitPrice,
        brand,
        isCustomModel: true,
        isMultiRecorder,
        isUnderCapacity,
        underCapacityReason,
        sataBays,
        analogueBncChannels,
        hybridIpInputs,
        maxResolution,
        compression,
        incomingBandwidthMbps,
        poePorts,
        raidSupported
      };
    }

    // 2. Wireless Architecture
    if (systemArch === 'wireless') {
      if (cameraCategory === 'wifi_battery' || cameraCategory === 'wifi_solar') {
        return {
          channels: 0,
          name: 'Standalone Edge MicroSD Storage (NVR Incompatible with Battery Units)',
          model: 'PIR-EDGE-STANDALONE',
          sku: 'WIFI-EDGE-STORAGE',
          unitPrice: 0,
          brand: 'EZVIZ',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 0,
          analogueBncChannels: 0,
          hybridIpInputs: 0,
          maxResolution: '2K / 3MP',
          compression: 'H.265 / PIR Duty Cycle',
          isWirelessEdge: true,
          wirelessDutyCycleNote: 'Low-power battery & solar cameras operate via PIR wake-up cycles and cannot sustain continuous 24/7 RTSP streams to an NVR without rapidly depleting battery reserves. Storage is handled via local high-endurance MicroSD (128GB per camera) or vendor cloud gateway.'
        };
      }

      if (cameraCategory === 'wifi_cellular') {
        return {
          channels: 0,
          name: '4G/5G Cellular Edge SIM Architecture (MicroSD Standard)',
          model: '4G-EDGE-STANDALONE',
          sku: 'CELLULAR-EDGE-STORAGE',
          unitPrice: 0,
          brand: 'CamneX Pro',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 0,
          analogueBncChannels: 0,
          hybridIpInputs: 0,
          maxResolution: '2K / 3MP',
          compression: 'H.265 Mobile Stream',
          isWirelessEdge: true,
          wirelessDutyCycleNote: 'Cellular 4G/5G cameras communicate over mobile SIM networks. Centralized NVR recording requires private APN VPN tunneling or cloud VMS. Edge MicroSD storage is provided as standard.'
        };
      }

      // wifi_smart / wifi_two_way_audio / wifi_pinhole
      if (wirelessRecordingType === 'standalone_sd') {
        return {
          channels: 0,
          name: 'Standalone Edge MicroSD Storage (No NVR Channel Limit)',
          model: 'STANDALONE-EDGE-SD',
          sku: 'WIFI-STANDALONE-SD',
          unitPrice: 0,
          brand: 'EZVIZ / Kingston',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 0,
          analogueBncChannels: 0,
          hybridIpInputs: 0,
          maxResolution: '2K / 3MP',
          compression: 'H.265 / Edge Stream',
          isWirelessEdge: true,
          wirelessDutyCycleNote: 'Cameras record directly to local 128GB High-Endurance MicroSD storage. Standalone configuration operates without NVR channel limits and connects directly to the mobile app or cloud gateway.'
        };
      }

      if (wirelessRecordingType === 'third_party_nvr') {
        const nvrChannels = cameraCount <= 8 ? 8 : cameraCount <= 16 ? 16 : cameraCount <= 32 ? 32 : 64;
        return {
          channels: nvrChannels,
          name: `Hikvision ${nvrChannels}-Channel 4K NVR with ONVIF Wi-Fi Camera Integration`,
          model: nvrChannels <= 8 ? 'DS-7608NI-Q1' : nvrChannels <= 16 ? 'DS-7616NI-K2' : 'DS-7732NI-M4',
          sku: `HIK-NVR-${nvrChannels}CH-WIFI-INT`,
          unitPrice: nvrChannels <= 8 ? 11500 : nvrChannels <= 16 ? 18500 : null,
          brand: 'Hikvision',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: cameraCount > nvrChannels,
          underCapacityReason: cameraCount > nvrChannels ? `Selected NVR supports ${nvrChannels} channels (${cameraCount - nvrChannels} channels short).` : undefined,
          sataBays: nvrChannels <= 8 ? 1 : nvrChannels <= 16 ? 2 : 4,
          analogueBncChannels: 0,
          hybridIpInputs: nvrChannels,
          maxResolution: '8MP 4K Ultra HD',
          compression: 'H.265+ Smart Codec',
          isWirelessEdge: false,
          wirelessDutyCycleNote: 'Third-party NVR recording for Wi-Fi cameras requires ONVIF Profile S and dedicated wireless AP throughput assessment. High-density Wi-Fi networks must segregate surveillance SSIDs.'
        };
      }

      // Default wireless NVR ecosystem (EZVIZ / Imou supported up to 18 channels)
      let neededChannels = 8;
      let model = 'CS-X5S-8W';
      let sku = 'EZV-NVR-8CH';
      let name = 'EZVIZ 8-Channel Wireless Smart NVR';
      let unitPrice: number | null = 9500;
      let isUnderCap = false;
      let underCapReason: string | undefined = undefined;

      if (cameraCount <= 4) {
        neededChannels = 4;
        model = 'CS-X5S-4W';
        sku = 'EZV-NVR-4CH';
        name = 'EZVIZ 4-Channel Wireless Smart NVR';
        unitPrice = 6500;
      } else if (cameraCount <= 8) {
        neededChannels = 8;
        model = 'CS-X5S-8W';
        sku = 'EZV-NVR-8CH';
        name = 'EZVIZ 8-Channel Wireless Smart NVR';
        unitPrice = 9500;
      } else if (cameraCount <= 18) {
        neededChannels = 18;
        model = 'CS-X5S-18W';
        sku = 'EZV-NVR-18CH';
        name = 'EZVIZ 18-Channel Supported Wireless Smart NVR';
        unitPrice = 14500;
      } else {
        neededChannels = 18;
        model = 'CS-X5S-18W';
        sku = 'EZV-NVR-18CH';
        name = 'EZVIZ 18-Channel Wireless Smart NVR (Under-Capacity)';
        unitPrice = 14500;
        isUnderCap = true;
        underCapReason = `Ecosystem limitation: Supported wireless NVRs (such as EZVIZ/Imou) have a maximum verified limit of 18 camera channels. For your ${cameraCount} cameras, choose Standalone Edge MicroSD storage (no NVR limit), a compatible Hikvision/Dahua 32-ch/64-ch recorder with ONVIF, or request an official technical engineering quotation.`;
      }

      return {
        channels: neededChannels,
        name,
        model,
        sku,
        unitPrice,
        brand: 'EZVIZ',
        isCustomModel: false,
        isMultiRecorder: false,
        isUnderCapacity: isUnderCap,
        underCapacityReason: underCapReason,
        sataBays: 1,
        analogueBncChannels: 0,
        hybridIpInputs: neededChannels,
        maxResolution: '5MP Super HD',
        compression: 'H.265 Dual Stream',
        isWirelessEdge: false
      };
    }


    // 3. IP Network (PoE)
    if (systemArch === 'ip') {
      if (cameraCount <= 8) {
        const catalog8 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-nvr-8ch-poe');
        return {
          channels: 8,
          name: catalog8 ? catalog8.name : 'Hikvision 8-Channel 4K Embedded PoE Network Video Recorder',
          model: catalog8?.modelNumber || 'DS-7608NI-Q1/8P',
          sku: catalog8?.sku || 'HIK-NVR-8CH-POE',
          unitPrice: getProductPrice(catalog8) ?? 14800,
          brand: 'Hikvision',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 1,
          analogueBncChannels: 0,
          hybridIpInputs: 8,
          poePorts: 8,
          incomingBandwidthMbps: 80,
          maxResolution: '8MP (4K Ultra HD)',
          compression: 'H.265+'
        };
      } else if (cameraCount <= 16) {
        return {
          channels: 16,
          name: 'Hikvision 16-Channel 4K Ultra HD PoE NVR',
          model: 'DS-7616NI-K2/16P',
          sku: 'HIK-NVR-16CH-POE',
          unitPrice: 24500,
          brand: 'Hikvision',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 2,
          analogueBncChannels: 0,
          hybridIpInputs: 16,
          poePorts: 16,
          incomingBandwidthMbps: 160,
          maxResolution: '8MP (4K Ultra HD)',
          compression: 'H.265+'
        };
      } else if (cameraCount <= 32) {
        return {
          channels: 32,
          name: 'Hikvision 32-Channel 4K Enterprise NVR',
          model: 'DS-7732NI-M4',
          sku: 'HIK-NVR-32CH',
          unitPrice: null, // Quote required
          brand: 'Hikvision',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 4,
          analogueBncChannels: 0,
          hybridIpInputs: 32,
          incomingBandwidthMbps: 320,
          maxResolution: '32MP / 8K / 4K',
          compression: 'H.265+'
        };
      } else if (cameraCount <= 64) {
        return {
          channels: 64,
          name: 'Hikvision 64-Channel Enterprise 4K Ultra NVR with Hardware RAID',
          model: 'DS-9664NI-I8',
          sku: 'HIK-NVR-64CH-RAID',
          unitPrice: null, // Enterprise quote required
          brand: 'Hikvision',
          isCustomModel: false,
          isMultiRecorder: false,
          isUnderCapacity: false,
          sataBays: 8,
          analogueBncChannels: 0,
          hybridIpInputs: 64,
          incomingBandwidthMbps: 320,
          raidSupported: true,
          maxResolution: '12MP / 4K',
          compression: 'H.265+'
        };
      } else {
        // > 64 cameras Enterprise Architecture
        return {
          channels: 128,
          name: `Enterprise Multi-Headend CCTV System (Engineered for ${cameraCount} Cameras)`,
          model: 'HEADEND-CLUSTER-MULTI',
          sku: 'ENT-NVR-CLUSTER-64PLUS',
          unitPrice: null, // Enterprise quote required
          brand: 'Hikvision / CamneX Enterprise',
          isCustomModel: false,
          isMultiRecorder: true,
          isUnderCapacity: false,
          sataBays: 16,
          analogueBncChannels: 0,
          hybridIpInputs: 128,
          incomingBandwidthMbps: 640,
          raidSupported: true,
          maxResolution: '4K Ultra HD / Multi-Server VMS',
          compression: 'H.265+ Smart Codec'
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
        brand: 'Hikvision',
        isCustomModel: false,
        isMultiRecorder: false,
        isUnderCapacity: false,
        sataBays: 1,
        analogueBncChannels: 4,
        hybridIpInputs: 1,
        maxResolution: '5MP Lite / 1080p @ 15fps',
        compression: 'H.265 Pro+'
      };
    } else if (cameraCount <= 8) {
      const catalog8 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-8ch');
      return {
        channels: 8,
        name: catalog8 ? catalog8.name : 'Hikvision 8-Channel 1080p AcuSense HD DVR',
        model: catalog8?.modelNumber || 'iDS-7208HQHI-M1/S',
        sku: catalog8?.sku || 'HIK-DVR-8CH',
        unitPrice: getProductPrice(catalog8) ?? 6800,
        brand: 'Hikvision',
        isCustomModel: false,
        isMultiRecorder: false,
        isUnderCapacity: false,
        sataBays: 1,
        analogueBncChannels: 8,
        hybridIpInputs: 2,
        maxResolution: '5MP Lite / 1080p',
        compression: 'H.265 Pro+'
      };
    } else if (cameraCount <= 16) {
      const catalog16 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-16ch');
      return {
        channels: 16,
        name: catalog16 ? catalog16.name : 'Hikvision 16-Channel 1080p AcuSense HD DVR',
        model: catalog16?.modelNumber || 'iDS-7216HQHI-M2/S',
        sku: catalog16?.sku || 'HIK-DVR-16CH',
        unitPrice: getProductPrice(catalog16) ?? 12500,
        brand: 'Hikvision',
        isCustomModel: false,
        isMultiRecorder: false,
        isUnderCapacity: false,
        sataBays: 2,
        analogueBncChannels: 16,
        hybridIpInputs: 2,
        maxResolution: '5MP Lite / 1080p',
        compression: 'H.265 Pro+'
      };
    } else if (cameraCount <= 32) {
      const catalog32 = compatibleCatalogRecorders.find(r => r.id === 'prod-hik-dvr-32ch');
      return {
        channels: 32,
        name: catalog32 ? catalog32.name : 'Hikvision 32-Channel Enterprise AcuSense HD DVR',
        model: catalog32?.modelNumber || 'iDS-7232HQHI-M2/S',
        sku: catalog32?.sku || 'HIK-DVR-32CH',
        unitPrice: getProductPrice(catalog32) ?? 28000,
        brand: 'Hikvision',
        isCustomModel: false,
        isMultiRecorder: false,
        isUnderCapacity: false,
        sataBays: 4,
        analogueBncChannels: 32,
        hybridIpInputs: 16,
        maxResolution: '5MP Lite / 1080p',
        compression: 'H.265 Pro+'
      };
    } else if (cameraCount <= 64) {
      // 33-64 cameras Analogue Enterprise -> Multi-DVR cluster
      return {
        channels: 64,
        name: 'Dual Hikvision 32-Channel Enterprise AcuSense HD DVR Headend Setup (2x 32-CH)',
        model: 'iDS-7232HQHI-M2/S (x2 Units)',
        sku: 'HIK-DVR-64CH-DUAL',
        unitPrice: null, // High-density quote only
        brand: 'Hikvision',
        isCustomModel: false,
        isMultiRecorder: true,
        isUnderCapacity: false,
        sataBays: 8,
        analogueBncChannels: 64,
        hybridIpInputs: 32,
        maxResolution: '5MP Lite / 1080p',
        compression: 'H.265 Pro+'
      };
    } else {
      // > 64 cameras Analogue Enterprise
      return {
        channels: 128,
        name: `Enterprise Multi-DVR Headend Architecture (${cameraCount} Cameras)`,
        model: 'DVR-CLUSTER-ENTERPRISE',
        sku: 'HIK-DVR-ENTERPRISE-CLUSTER',
        unitPrice: null,
        brand: 'Hikvision',
        isCustomModel: false,
        isMultiRecorder: true,
        isUnderCapacity: false,
        sataBays: 16,
        analogueBncChannels: 128,
        hybridIpInputs: 32,
        maxResolution: '5MP Lite / 1080p',
        compression: 'H.265 Pro+'
      };
    }
  }, [systemArch, cameraCount, cameraCategory, selectedRecorderProduct, compatibleCatalogRecorders, wirelessRecordingType]);

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
        const is2Way = requiresTwoWayAudio;
        return {
          name: is2Way
            ? `Hikvision 4MP ColorVu Live Guard PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera (Two-Way Audio)`
            : `Hikvision 4MP ColorVu PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
          model: is2Way
            ? (formFactor === 'dome' ? 'DS-2CD2147G2-SU' : formFactor === 'turret' ? 'DS-2CD2347G2-LSU/SL' : 'DS-2CD2T47G2-LSU/SL')
            : (formFactor === 'dome' ? 'DS-2CD2147G2-SU' : 'DS-2CD2047G2-LU'),
          sku: is2Way ? 'HIK-IP-COLORVU-2WAY-4MP' : 'HIK-IP-COLORVU-4MP',
          unitPrice: is2Way ? 10500 : 9200,
          brand: 'Hikvision',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 24
        };
      }
      if (nightVision === 'hybrid') {
        const is2Way = requiresTwoWayAudio;
        return {
          name: is2Way
            ? `Hikvision 4MP Smart Hybrid Light Live Guard PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera (Two-Way Audio)`
            : `Hikvision 4MP Smart Hybrid Light PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
          model: formFactor === 'dome' ? 'DS-2CD2147G2-LU/SL' : 'DS-2CD2047G2-LU/SL',
          sku: is2Way ? 'HIK-IP-HYBRID-2WAY-4MP' : 'HIK-IP-HYBRID-4MP',
          unitPrice: is2Way ? 10200 : 9500,
          brand: 'Hikvision',
          isSpecialist: false,
          isCustomOverride: false,
          warrantyMonths: 24
        };
      }
      const is2Way = requiresTwoWayAudio;
      return {
        name: is2Way
          ? `Hikvision 4MP EXIR PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera with Two-Way Audio Interface`
          : `Hikvision 4MP EXIR PoE ${formFactor === 'dome' ? 'Dome' : formFactor === 'turret' ? 'Turret' : 'Bullet'} Camera`,
        model: is2Way
          ? (formFactor === 'dome' ? 'DS-2CD2143G2-IS' : formFactor === 'turret' ? 'DS-2CD2343G2-2WAY' : 'DS-2CD2043G2-IU')
          : (formFactor === 'dome' ? 'DS-2CD1143G0-I' : 'DS-2CD1043G0-I'),
        sku: is2Way ? 'HIK-IP-EXIR-2WAY-4MP' : 'HIK-IP-EXIR-4MP',
        unitPrice: is2Way ? 8200 : 7200,
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
    requiresTwoWayAudio,
    specialistCapability,
    specialistSubcategory,
    selectedCameraProduct,
    compatibleCatalogCameras
  ]);

  // Derive Hard Drive Sizing & Storage Profile
  const storageSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      return {
        name: 'Kingston High-Endurance 128GB MicroSD Card (Per Camera)',
        model: 'SDCE/128GB',
        sku: 'SD-128GB-SURV',
        brand: 'Kingston',
        qty: cameraCount,
        unitPrice: 1450,
        lineTotal: 1450 * cameraCount,
        warrantyMonths: 36,
        drivesRequired: cameraCount,
        isCompatible: true
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
        brand: 'Western Digital',
        qty: 1,
        unitPrice: 1800,
        lineTotal: 1800,
        warrantyMonths: 36,
        drivesRequired: 1,
        isCompatible: recorderSpec.sataBays >= 1
      };
    }

    if (storageOption === '1tb') {
      return {
        name: 'Western Digital Purple 1TB 3.5" Surveillance Internal HDD',
        model: 'WD10PURZ',
        sku: 'prod-wd-purple-1tb',
        brand: 'Western Digital',
        qty: 1,
        unitPrice: 4800,
        lineTotal: 4800,
        warrantyMonths: 36,
        drivesRequired: 1,
        isCompatible: recorderSpec.sataBays >= 1
      };
    }

    if (storageOption === '2tb') {
      return {
        name: 'Western Digital Purple 2TB 3.5" Surveillance Internal HDD',
        model: 'WD20PURZ',
        sku: 'prod-wd-purple-2tb',
        brand: 'Western Digital',
        qty: 1,
        unitPrice: 6900,
        lineTotal: 6900,
        warrantyMonths: 36,
        drivesRequired: 1,
        isCompatible: recorderSpec.sataBays >= 1
      };
    }

    if (storageOption === 'barracuda_2tb') {
      return {
        name: 'Seagate BarraCuda 2TB 3.5" Internal Hard Drive (Desktop Duty Grade)',
        model: 'ST2000DM008',
        sku: 'prod-st-barracuda-2tb',
        brand: 'Seagate',
        qty: 1,
        unitPrice: 5800,
        lineTotal: 5800,
        warrantyMonths: 24,
        drivesRequired: 1,
        isCompatible: recorderSpec.sataBays >= 1
      };
    }

    if (storageOption === '4tb') {
      return {
        name: 'Seagate SkyHawk 4TB Surveillance Internal Hard Drive 3.5"',
        model: 'ST4000VX016',
        sku: 'prod-st-skyhawk-4tb',
        brand: 'Seagate',
        qty: 1,
        unitPrice: 11200,
        lineTotal: 11200,
        warrantyMonths: 36,
        drivesRequired: 1,
        isCompatible: recorderSpec.sataBays >= 1
      };
    }

    if (storageOption === 'dual_2tb') {
      return {
        name: 'Dual Western Digital Purple 2TB Surveillance HDDs (4TB Total Array)',
        model: 'WD20PURZ (x2 Units)',
        sku: 'HDD-DUAL-2TB',
        brand: 'Western Digital',
        qty: 2,
        unitPrice: 6900,
        lineTotal: 13800,
        warrantyMonths: 36,
        drivesRequired: 2,
        isCompatible: recorderSpec.sataBays >= 2
      };
    }

    if (storageOption === 'dual_4tb') {
      return {
        name: 'Dual Seagate SkyHawk 4TB Surveillance Hard Drives (8TB Total Array)',
        model: 'ST4000VX016 (x2 Units)',
        sku: 'HDD-DUAL-4TB',
        brand: 'Seagate',
        qty: 2,
        unitPrice: 11200,
        lineTotal: 22400,
        warrantyMonths: 36,
        drivesRequired: 2,
        isCompatible: recorderSpec.sataBays >= 2
      };
    }

    if (storageOption === 'quad_4tb') {
      return {
        name: 'Quad Seagate SkyHawk 4TB Enterprise Storage Array (16TB Total, 4 Bays)',
        model: 'ST4000VX016 (x4 Units)',
        sku: 'HDD-QUAD-4TB',
        brand: 'Seagate',
        qty: 4,
        unitPrice: 11200,
        lineTotal: 44800,
        warrantyMonths: 36,
        drivesRequired: 4,
        isCompatible: recorderSpec.sataBays >= 4
      };
    }

    return null;
  }, [storageOption, systemArch, cameraCount, recorderSpec.sataBays]);

  // Drive Bay Compatibility Check
  const isStorageDriveBayIncompatible = useMemo(() => {
    if (systemArch === 'wireless' || !storageSpec) return false;
    return !storageSpec.isCompatible;
  }, [systemArch, storageSpec]);

  // Recording Retention Calculation Engine
  const retentionEstimate = useMemo(() => {
    let resolutionLabel = '2MP Full HD (1080p)';
    let bitrateKbps = 1500;

    const camName = (cameraSpec.name || '').toLowerCase();
    const camModel = (cameraSpec.model || '').toLowerCase();

    if (camName.includes('4k') || camName.includes('8mp') || camModel.includes('8mp')) {
      resolutionLabel = '8MP Ultra HD (4K)';
      bitrateKbps = 4500;
    } else if (camName.includes('5mp') || camName.includes('3k') || camModel.includes('5mp')) {
      resolutionLabel = '5MP Super HD (3K)';
      bitrateKbps = 2800;
    } else if (camName.includes('4mp') || camName.includes('2k') || camModel.includes('4mp')) {
      resolutionLabel = '4MP Quad HD (2K)';
      bitrateKbps = 2400;
    }

    let usableGb = 0;
    if (systemArch === 'wireless') {
      usableGb = 115;
    } else {
      switch (storageOption) {
        case '500gb': usableGb = 450; break;
        case '1tb': usableGb = 900; break;
        case '2tb': usableGb = 1800; break;
        case 'barracuda_2tb': usableGb = 1800; break;
        case '4tb': usableGb = 3600; break;
        case 'dual_2tb': usableGb = 3600; break;
        case 'dual_4tb': usableGb = 7200; break;
        case 'quad_4tb': usableGb = 14400; break;
        default: usableGb = 0; break;
      }
    }

    // Codec compatibility verification: fall back to H.264 when H.265+ unsupported by camera or recorder
    const recCompression = (recorderSpec.compression || '').toLowerCase();
    const camCompression = (cameraSpec.model || '').toLowerCase();
    const isH265Supported = !camCompression.includes('legacy') && (recCompression.includes('h.265') || recCompression.includes('smart') || recCompression.includes('pro+') || recCompression.length === 0);
    const activeCodec = isH265Supported ? 'H.265+ Smart Codec' : 'H.264 Baseline';
    const effectiveBitrateKbps = isH265Supported ? bitrateKbps : Math.round(bitrateKbps * 1.8);

    const recordingHours = recordingMode === 'continuous' ? 24 : 12;
    const gbPerCamPerDay = (effectiveBitrateKbps * 3600 * recordingHours) / (8 * 1024 * 1024);

    if (systemArch === 'wireless') {
      const rawDays = usableGb / (gbPerCamPerDay || 0.001);
      const est = Math.max(1, Math.round(rawDays));
      return {
        resolutionLabel,
        bitrateKbps: effectiveBitrateKbps,
        recordingHours,
        gbPerCamPerDay: Number(gbPerCamPerDay.toFixed(2)),
        totalDailyGb: Number((gbPerCamPerDay * cameraCount).toFixed(2)),
        usableGb,
        estDays: est,
        minDays: Math.max(1, Math.floor(est * 0.85)),
        maxDays: Math.ceil(est * 1.15),
        codec: activeCodec,
        disclaimer: `Based on 128GB High-Endurance MicroSD per camera at ${recordingHours} hrs/day (${recordingMode === 'continuous' ? '24/7 continuous' : 'smart motion'}), 90% formatted storage.`
      };
    }

    const totalDailyGb = gbPerCamPerDay * cameraCount;
    const rawDays = usableGb / (totalDailyGb || 0.001);
    const est = Math.max(1, Math.round(rawDays));

    return {
      resolutionLabel,
      bitrateKbps: effectiveBitrateKbps,
      recordingHours,
      gbPerCamPerDay: Number(gbPerCamPerDay.toFixed(2)),
      totalDailyGb: Number(totalDailyGb.toFixed(2)),
      usableGb,
      estDays: est,
      minDays: Math.max(1, Math.floor(est * 0.85)),
      maxDays: Math.ceil(est * 1.15),
      codec: activeCodec,
      disclaimer: `Calculated for ${cameraCount} cameras at ${resolutionLabel} using ${activeCodec} at 15–20 fps, ${recordingHours} hrs/day (${recordingMode === 'continuous' ? '24/7 continuous' : 'smart motion'}), and 90% formatted HDD space. Actual retention varies with motion frequency, scene complexity, and ambient lighting. Estimates are engineering guidelines, not manufacturer warranties.`
    };
  }, [cameraSpec, cameraCount, storageOption, systemArch, recordingMode, recorderSpec.compression]);

  // Strict Cable Allocation: 10m per camera default, editable by customer
  const defaultCableMeters = cameraCount * 10;
  const cableLengthMeters = customCableLength !== null ? customCableLength : defaultCableMeters;

  // Power Distribution & Networking Equipment Profile
  const powerSpec: PowerSupplyProfile = useMemo(() => {
    if (systemArch === 'wireless') {
      if (cameraCategory === 'wifi_solar') {
        return {
          name: 'Integrated High-Efficiency Solar Panel & Autonomous Lithium Power Unit',
          model: 'SOLAR-LITHIUM-KIT',
          sku: 'ACC-SOLAR-POWER',
          qty: cameraCount,
          unitPrice: 0,
          lineTotal: 0,
          warrantyMonths: 24,
          type: 'solar_autonomous',
          note: 'Continuous trickle-charge solar operation. Zero external 220V power adapter or cabling required.'
        };
      }
      if (cameraCategory === 'wifi_battery') {
        return {
          name: 'High-Capacity Rechargeable Lithium Battery & USB Type-C Charging Kit',
          model: 'BATT-TYPEC-KIT',
          sku: 'ACC-BATT-CHARGER',
          qty: cameraCount,
          unitPrice: 0,
          lineTotal: 0,
          warrantyMonths: 12,
          type: 'rechargeable_battery',
          note: 'Cord-free battery power with PIR motion wake-up cycle. Includes high-current USB Type-C charging cable.'
        };
      }
      return {
        name: 'CamneX Pro 12V 2A Regulated DC Switching Power Adapter (Per Camera)',
        model: 'AD-12V2A-DC',
        sku: 'acc-power-adapter',
        qty: cameraCount,
        unitPrice: 350,
        lineTotal: 350 * cameraCount,
        warrantyMonths: 6,
        type: 'adapter',
        note: 'Dedicated 12V 2A regulated power adapter for each camera. Requires local 220V AC wall socket.'
      };
    }

    if (systemArch === 'ip') {
      const nvrPoePorts = recorderSpec.poePorts || 0;
      if (cameraCount <= nvrPoePorts) {
        return {
          name: `Integrated IEEE 802.3af/at PoE Power Delivery via NVR Ports (${nvrPoePorts}x Built-in PoE Ports)`,
          model: 'POE-BUILTIN',
          sku: 'POE-NVR-PORTS',
          qty: 1,
          unitPrice: 0,
          lineTotal: 0,
          warrantyMonths: 0,
          type: 'integrated_poe',
          note: `Cameras receive 48V DC power directly from NVR's integrated PoE ports over Cat6 Ethernet up to 100m. Zero individual camera power adapters needed.`
        };
      }

      // External PoE switch required when cameraCount > nvrPoePorts
      if (cameraCount <= 4) {
        return {
          name: 'Ruijie Reyee RG-ES205GC-P 5-Port Gigabit Smart Cloud PoE Switch (4 PoE Ports, 54W Budget)',
          model: 'RG-ES205GC-P',
          sku: 'prod-ruijie-es205gc-p',
          qty: 1,
          unitPrice: 4200,
          lineTotal: 4200,
          warrantyMonths: 36,
          type: 'external_poe_switch',
          note: 'Dedicated 5-Port Gigabit Smart Cloud PoE Switch powers all camera lines with 54W power budget.'
        };
      }
      if (cameraCount <= 8) {
        return {
          name: 'Ruijie Reyee RG-ES209GC-P 9-Port Gigabit Smart Cloud PoE Switch (8 PoE Ports, 110W Budget)',
          model: 'RG-ES209GC-P',
          sku: 'prod-ruijie-es209gc-p',
          qty: 1,
          unitPrice: 7500,
          lineTotal: 7500,
          warrantyMonths: 36,
          type: 'external_poe_switch',
          note: '9-Port Gigabit Smart Cloud PoE switch with 110W power budget and cloud surveillance management.'
        };
      }
      if (cameraCount <= 24) {
        return {
          name: 'Ruijie Reyee RG-ES224GC-P 24-Port Gigabit Smart Cloud PoE Switch (24 PoE Ports, 370W Budget)',
          model: 'RG-ES224GC-P',
          sku: 'prod-ruijie-es224gc-p',
          qty: 1,
          unitPrice: 24500,
          lineTotal: 24500,
          warrantyMonths: 36,
          type: 'external_poe_switch',
          note: '24-Port Gigabit Smart Cloud PoE switch with 370W power budget and surveillance VLAN isolation.'
        };
      }
      return {
        name: 'Ruijie Managed Enterprise Distribution Gigabit PoE Switch',
        model: 'RG-NBS3100-24GT4SFP-P',
        sku: 'prod-enterprise-switch-req',
        qty: Math.ceil(cameraCount / 24),
        unitPrice: null, // Enterprise quote required
        lineTotal: null,
        warrantyMonths: 36,
        type: 'external_poe_switch',
        note: 'Enterprise Layer-2+ managed PoE distribution switch with 10G SFP+ fiber uplinks. Official quotation required.'
      };
    }

    // Analogue Architecture
    if (cameraCount <= 2) {
      return {
        name: 'CamneX Pro 12V 2A Regulated DC Switching Power Adapter (Per Camera)',
        model: 'AD-12V2A-DC',
        sku: 'acc-power-adapter',
        qty: cameraCount,
        unitPrice: 350,
        lineTotal: 350 * cameraCount,
        warrantyMonths: 6,
        type: 'adapter',
        note: 'Compact individual regulated 12V 2A power adapters with overvoltage and short-circuit protection.'
      };
    }

    if (cameraCount <= 8) {
      return {
        name: 'CamneX Central 12V 10A 9-Channel Metal Cased Power Supply Box',
        model: 'PS-12V10A-9CH',
        sku: 'acc-power',
        qty: 1,
        unitPrice: 1800,
        lineTotal: 1800,
        warrantyMonths: 12,
        type: 'central_box',
        note: 'Centralized lockable metal cabinet with 9 individual PTC auto-reset fuse protected outputs (1.1A per channel), master power switch, and LED status indicators.'
      };
    }

    if (cameraCount <= 16) {
      return {
        name: 'CamneX Central 12V 20A 18-Channel Metal Cased Power Supply Box',
        model: 'PS-12V20A-18CH',
        sku: 'acc-power-18ch',
        qty: 1,
        unitPrice: 2800,
        lineTotal: 2800,
        warrantyMonths: 12,
        type: 'central_box',
        note: 'Centralized lockable cabinet with 18 individual PTC fuse-protected outputs (1.1A per channel), high-efficiency toroidal transformer, and cooling ventilation.'
      };
    }

    if (cameraCount <= 32) {
      return {
        name: 'Dual CamneX Central 12V 20A 18-Channel Metal Cased Power Supply Boxes (2x Units, 36 Channels)',
        model: 'PS-12V20A-18CH (x2 Units)',
        sku: 'acc-power-36ch-dual',
        qty: 2,
        unitPrice: 2800,
        lineTotal: 5600,
        warrantyMonths: 12,
        type: 'central_box',
        note: 'Dual centralized 18-channel power distribution cabinets providing 36 fused terminal connections for 32 cameras with reserve capacity.'
      };
    }

    return {
      name: 'CamneX Enterprise Industrial Centralized SMPS Power Distribution Rack',
      model: 'SMPS-DIST-ENTERPRISE',
      sku: 'PS-ENTERPRISE-DIST',
      qty: 1,
      unitPrice: null,
      lineTotal: null,
      warrantyMonths: 12,
      type: 'central_box',
      note: 'High-amperage rackmount power distribution unit with redundant power rails and surge suppressors. Official quotation required.'
    };
  }, [systemArch, cameraCount, cameraCategory, recorderSpec.poePorts]);

  // Weatherproof Junction Boxes (Optional, Recommended for Outdoor & Conduit Installations)
  const junctionBoxSpec = useMemo(() => {
    if (!includeJunctionBoxes || systemArch === 'wireless') return null;
    return {
      role: 'Weatherproof Mounting',
      name: 'Hikvision Deep Base Waterproof Junction Box & Camera Mount Bracket',
      model: 'DS-1280ZJ-XS',
      sku: 'acc-bracket',
      qty: cameraCount,
      unitPrice: 250,
      lineTotal: 250 * cameraCount,
      warrantyMonths: 12,
      note: 'Conceals and protects BNC, DC, and RJ45 connectors against rainwater, humidity, and tamper damage (IP66 rated).'
    };
  }, [includeJunctionBoxes, systemArch, cameraCount]);

  // Audio Capability Detection
  const hasBuiltinAudio = useMemo(() => {
    if (systemArch === 'wireless') return true;
    const name = (cameraSpec.name || '').toLowerCase();
    const model = (cameraSpec.model || '').toLowerCase();
    return name.includes('audio') || model.includes('itpfs') || model.includes('lpfs') || model.includes('iu') || model.includes('df0t-fs');
  }, [systemArch, cameraSpec]);

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
    if (monitorOption === '24inch' || monitorOption === 'large') {
      return {
        name: '24-Inch Full HD 75Hz Professional CCTV Security Display Monitor',
        model: 'MON-SURV-24FHD',
        sku: 'MON-24INCH-SURV',
        qty: 1,
        unitPrice: null, // Quote item per catalog
        warrantyMonths: 12
      };
    }
    if (monitorOption === '32inch') {
      return {
        name: '32-Inch Commercial Ultra HD CCTV Security Wall Display',
        model: 'MON-SURV-32UHD',
        sku: 'MON-32INCH-SURV',
        qty: 1,
        unitPrice: null, // Quote item per catalog
        warrantyMonths: 12
      };
    }
    return null;
  }, [monitorOption]);

  // Optional Wall Mount Bracket Spec
  const wallMountSpec = useMemo(() => {
    if (monitorOption === 'none' || wallMountOption === 'none') return null;
    if (wallMountOption === 'standard_vesa') {
      return {
        role: 'Display Wall Mount',
        name: 'Universal Full-Motion Articulating VESA Monitor Wall Mount Bracket (17"-32")',
        model: 'BRK-VESA-ART-100',
        sku: 'ACC-VESA-BRACKET',
        qty: 1,
        unitPrice: 1200,
        lineTotal: 1200,
        warrantyMonths: 12,
        warrantyText: '1 Year Warranty',
        specs: '100x100 / 75x75 VESA Compatible · 180° Swivel · ±15° Tilt · Solid Steel'
      };
    }
    if (wallMountOption === 'heavy_duty_tilt') {
      return {
        role: 'Display Wall Mount',
        name: 'Heavy-Duty Security Control-Room Tilt Wall Mount Bracket (Up to 43")',
        model: 'BRK-VESA-HD-TILT',
        sku: 'ACC-VESA-HD-TILT',
        qty: 1,
        unitPrice: 1800,
        lineTotal: 1800,
        warrantyMonths: 12,
        warrantyText: '1 Year Warranty',
        specs: 'Heavy-Gauge Cold Rolled Steel · Security Lock Mechanism · Up to 35kg capacity'
      };
    }
    return null;
  }, [monitorOption, wallMountOption]);

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
      lineTotal: cameraSpec.unitPrice !== null ? cameraSpec.unitPrice * cameraCount : null,
      warrantyMonths: cameraSpec.warrantyMonths || 12,
      warrantyText: cameraSpec.warrantyMonths === 24 ? '2 Years Official Warranty' : '1 Year Official Warranty',
      specs: `${cameraSpec.brand} · ${formFactor.toUpperCase()} · ${nightVision === 'ir' ? 'Pure Infrared (20m IR)' : nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'ColorVu 24/7 Full Color'}${hasBuiltinAudio ? ' · Built-in Audio Mic' : ''}`
    });

    // 2. Video Recorder
    list.push({
      role: 'Recording Hardware',
      name: recorderSpec.name,
      model: recorderSpec.model,
      sku: recorderSpec.sku,
      qty: 1,
      unitPrice: recorderSpec.unitPrice,
      lineTotal: recorderSpec.unitPrice,
      warrantyMonths: recorderSpec.warrantyMonths || 12,
      warrantyText: recorderSpec.warrantyMonths === 24 ? '2 Years Official Warranty' : '1 Year Official Warranty',
      specs: `${recorderSpec.channels}-Channel ${systemArch === 'ip' ? 'PoE NVR' : 'Turbo HD DVR'} · ${recorderSpec.sataBays} SATA Drive Bay${recorderSpec.sataBays > 1 ? 's' : ''} · H.265+ Compression · Simultaneous HDMI/VGA`
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
        lineTotal: storageSpec.lineTotal,
        warrantyMonths: storageSpec.warrantyMonths || 36,
        warrantyText: storageSpec.warrantyMonths === 24 ? '2 Years Warranty' : '3 Years Replacement Warranty',
        specs: `${storageSpec.brand} 3.5" Hard Drive · ${storageSpec.drivesRequired} Unit${storageSpec.drivesRequired > 1 ? 's in Array' : ''}`
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
        lineTotal: (isIp || isUtpAnalogue ? 32 : 30) * cableLengthMeters,
        warrantyMonths: 0,
        warrantyText: 'Installation Workmanship Guarantee',
        specs: `100% Solid Pure Copper Conductors · ${cableLengthMeters}m Total (${(cableLengthMeters / cameraCount).toFixed(1)}m/cam average)`
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
          lineTotal: 250 * cameraCount,
          warrantyMonths: 6,
          warrantyText: '6 Months Replacement Warranty',
          specs: `Matched Pair (1x Camera End + 1x DVR End) per camera · TVS Surge Protection · Anti-Interference`
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
          lineTotal: 150 * cameraCount,
          warrantyMonths: 0,
          warrantyText: 'Installation Workmanship Guarantee',
          specs: `${cameraCount * 2}x Pure Copper BNC Crimps + ${cameraCount}x 12V DC Pigtails`
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
        lineTotal: cameraCount * 2 * 25,
        warrantyMonths: 0,
        warrantyText: 'Installation Workmanship Guarantee',
        specs: `High-Grade Cat6 8P8C Modular Plugs (${cameraCount * 2} Units) + Snagless Protective Strain-Relief Boots`
      });
    }

    // 6. Power Distribution / PoE Networking
    if (powerSpec) {
      list.push({
        role: powerSpec.type === 'external_poe_switch' ? 'PoE Networking Switch' : 'Power Distribution',
        name: powerSpec.name,
        model: powerSpec.model,
        sku: powerSpec.sku,
        qty: powerSpec.qty,
        unitPrice: powerSpec.unitPrice,
        lineTotal: powerSpec.lineTotal,
        warrantyMonths: powerSpec.warrantyMonths,
        warrantyText: powerSpec.warrantyMonths === 36
          ? '3 Years Official Warranty'
          : powerSpec.warrantyMonths === 24
          ? '2 Years Official Warranty'
          : powerSpec.warrantyMonths === 12
          ? '1 Year Warranty'
          : powerSpec.warrantyMonths === 6
          ? '6 Months Warranty'
          : 'Included with Hardware',
        specs: powerSpec.note || (powerSpec.type === 'external_poe_switch' ? `${powerSpec.ports} PoE Ports · Gigabit Uplinks · Cloud Management` : '12V Regulated DC SMPS Distribution')
      });
    }

    // 7. Optional Weatherproof Junction Boxes
    if (junctionBoxSpec) {
      list.push({
        role: junctionBoxSpec.role,
        name: junctionBoxSpec.name,
        model: junctionBoxSpec.model,
        sku: junctionBoxSpec.sku,
        qty: junctionBoxSpec.qty,
        unitPrice: junctionBoxSpec.unitPrice,
        lineTotal: junctionBoxSpec.lineTotal,
        warrantyMonths: junctionBoxSpec.warrantyMonths,
        warrantyText: '1 Year Warranty',
        specs: 'Hikvision Deep Base Waterproof Mount (IP66 Rated) · Conceals BNC/RJ45 & DC Connections'
      });
    }

    // 8. Optional Monitor
    if (monitorSpec) {
      list.push({
        role: 'Display Monitor',
        name: monitorSpec.name,
        model: monitorSpec.model,
        sku: monitorSpec.sku,
        qty: monitorSpec.qty,
        unitPrice: monitorSpec.unitPrice,
        lineTotal: null,
        warrantyMonths: monitorSpec.warrantyMonths,
        warrantyText: '1 Year Official Warranty',
        specs: 'Surveillance Desk Display · Direct HDMI / VGA Video Input'
      });
    }

    // 9. Optional Wall Mount
    if (wallMountSpec) {
      list.push({
        role: wallMountSpec.role,
        name: wallMountSpec.name,
        model: wallMountSpec.model,
        sku: wallMountSpec.sku,
        qty: wallMountSpec.qty,
        unitPrice: wallMountSpec.unitPrice,
        lineTotal: wallMountSpec.lineTotal,
        warrantyMonths: wallMountSpec.warrantyMonths,
        warrantyText: wallMountSpec.warrantyText,
        specs: wallMountSpec.specs
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
    junctionBoxSpec,
    monitorSpec,
    wallMountSpec,
    formFactor,
    nightVision,
    hasBuiltinAudio
  ]);

  // Calculate Pricing & Quote-Only status
  const { totalPrice, quotationRequired, quotationReason, pricedSubtotal, unpricedCount } = useMemo(() => {
    let sum = 0;
    let quoteOnly = false;
    let unpriced = 0;
    const unpricedItems: string[] = [];

    if (cameraCount > 64) {
      quoteOnly = true;
      unpriced++;
      unpricedItems.push(`${cameraCount}-Camera Enterprise Deployment Review (>64 Cameras)`);
    } else if (cameraCount >= 32) {
      quoteOnly = true;
      unpriced++;
      unpricedItems.push('32+ Enterprise Scale System');
    }

    if (recorderSpec.isUnderCapacity) {
      quoteOnly = true;
      unpriced++;
      unpricedItems.push(`Under-Capacity Recorder Selection (${recorderSpec.underCapacityReason || 'Insufficient Channels'})`);
    }

    if (isStorageDriveBayIncompatible) {
      quoteOnly = true;
      unpriced++;
      unpricedItems.push('Drive Bay Sizing Incompatibility');
    }

    if (cameraSpec.isSpecialist) {
      quoteOnly = true;
      unpriced++;
      unpricedItems.push(cameraSpec.name);
    }

    for (const item of computedBOM) {
      if (item.unitPrice === null || item.lineTotal === null) {
        quoteOnly = true;
        unpriced++;
        unpricedItems.push(item.name);
      } else {
        sum += item.lineTotal;
      }
    }

    return {
      pricedSubtotal: sum,
      unpricedCount: unpriced,
      totalPrice: quoteOnly ? null : sum,
      quotationRequired: quoteOnly,
      quotationReason: quoteOnly
        ? `One or more custom items (${unpricedItems.join(', ')}) require technical site assessment or official engineering quotation.`
        : null
    };
  }, [computedBOM, cameraCount, cameraSpec, recorderSpec.isUnderCapacity, recorderSpec.underCapacityReason, isStorageDriveBayIncompatible]);

  const isEnterpriseOver64 = cameraCount > 64;
  const canAddToCart = !quotationRequired && totalPrice !== null && !recorderSpec.isUnderCapacity && !isStorageDriveBayIncompatible && !isEnterpriseOver64 && !cameraSpec.isSpecialist;

  // Pure Infrared standard check
  const isPureIR = nightVision === 'ir' && systemArch === 'analogue';

  // Action: Add Package to Cart
  const handleAddPackageToCart = () => {
    if (!canAddToCart) {
      handleRequestQuote();
      return;
    }

    const bundleId = selectedBasePkg ? selectedBasePkg.id : `bundle-${systemArch}-${cameraCount}c-${formFactor}-${storageOption}`;
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
    setQuoteFormErrors({});
    setQuoteSuccessResult(null);

    // Also update localStorage prefill as backup for navigation
    const summaryText = `[Custom Package Builder Configuration]
Architecture: ${systemArch.toUpperCase()}
Cameras: ${cameraCount}x ${cameraSpec.name} (${formFactor.toUpperCase()}) - Model: ${cameraSpec.model}
Night Vision: ${nightVision.toUpperCase()}
Recorder: ${recorderSpec.name} (${recorderSpec.channels} Channels) - Model: ${recorderSpec.model}
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
    const errors: { customerName?: string; phone?: string; email?: string } = {};

    const name = quoteFormData.customerName.trim();
    if (!name || name.length < 2) {
      errors.customerName = 'Please enter your full name (minimum 2 characters).';
    }

    const rawPhone = quoteFormData.phone.trim();
    const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '').replace(/^\+?88/, '');
    if (!cleanPhone || cleanPhone.length < 11 || !cleanPhone.startsWith('01')) {
      errors.phone = 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).';
    }

    const email = quoteFormData.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address (e.g. name@company.com).';
    }

    if (Object.keys(errors).length > 0) {
      setQuoteFormErrors(errors);
      setQuoteErrorMessage('Please correct the highlighted fields before submitting.');
      return;
    }

    setQuoteFormErrors({});
    setQuoteSubmitting(true);

    const notesContent = `[Package Builder Official Quote Request]
Architecture: ${systemArch.toUpperCase()}
Cameras: ${cameraCount}x ${cameraSpec.name} (${formFactor.toUpperCase()}) - Model: ${cameraSpec.model} | SKU: ${cameraSpec.sku}
Night Vision: ${nightVision.toUpperCase()}
Recorder: ${recorderSpec.name} (${recorderSpec.channels} Channels) - Model: ${recorderSpec.model} | SKU: ${recorderSpec.sku}
Surveillance Storage: ${storageSpec ? storageSpec.name : 'None'} - Model: ${storageSpec?.model || 'Surveillance Grade'}
Transmission Cable: ${cableLengthMeters}m (${systemArch === 'ip' ? 'Cat6 UTP Solid Copper' : 'RG59 Coax Solid Copper'})
Power Supply: ${powerSpec?.name || 'Included'}
Monitor: ${monitorSpec ? `${monitorSpec.name} (Model: ${monitorSpec.model})` : 'None'}
Installation Service Requested: ${quoteFormData.includeInstallation ? 'YES (Full Turnkey Installation)' : 'NO (Equipment Only)'}
Quotation Status: ${quotationReason || 'Standard Package Verification'}
Calculated Hardware Estimate: ${totalPrice !== null ? `৳${totalPrice.toLocaleString()} BDT` : 'Quotation Required'}
Customer Site Notes: ${quoteFormData.notes || 'None provided'}`;

    try {
      const formattedSiteAddress = quoteFormData.siteAddress.trim()
        ? `${quoteFormData.siteAddress.trim()}, ${selectedThana}, ${selectedDistrict}`
        : `${selectedThana}, ${selectedDistrict}, Bangladesh`;

      const payload: any = {
        customerName: name,
        phone: cleanPhone,
        email: email || undefined,
        whatsapp: quoteFormData.whatsapp.trim() || undefined,
        serviceType: 'cctv_installation',
        propertyType: cameraCount <= 4 ? 'home' : cameraCount <= 16 ? 'office' : 'factory',
        siteAddress: formattedSiteAddress,
        cameraCount: cameraCount,
        companyName: quoteFormData.companyName.trim() || undefined,
        district: selectedDistrict,
        thana: selectedThana,
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

  // Fallback Copy to Clipboard for Restricted Environments
  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (_) {}
      document.body.removeChild(textArea);
    } catch (_) {}
    setCopiedBOM(true);
    setTimeout(() => setCopiedBOM(false), 2500);
  };

  // Re-issue current BOM with fresh 7-day validity
  const handleReissueBOM = () => {
    const now = new Date();
    const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dates = {
      issueDate: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      validUntilDate: expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    try {
      localStorage.setItem('camnex_bom_dates_v1', JSON.stringify(dates));
    } catch (_) {}
    setBomDates(dates);
  };

  // Copy BOM to clipboard (with 7-day validity, full model numbers, warranty, and disclaimers)
  const handleCopyBOM = () => {
    try {
      const lines = [
        '================================================================================',
        'CAMNEX BANGLADESH — OFFICIAL TECHNICAL BILL OF MATERIALS (BOM)',
        'Certified Security Systems Integrator & Authorized Hikvision Partner',
        'Corporate Office: Dhaka, Bangladesh | Hotline: +880 1317-251000 | Web: https://camnexbd.com',
        '================================================================================',
        `Reference Number   : Ref: BOM-NX-${cameraCount}C-${systemArch.toUpperCase()}`,
        `Date of Issue      : ${bomDates.issueDate}`,
        `BOM Validity       : 7 Calendar Days (Valid Until: ${bomDates.validUntilDate})`,
        `System Architecture: ${systemArch === 'ip' ? 'IP Network (PoE Digital)' : systemArch === 'wireless' ? 'Wi-Fi Smart Wireless' : 'Analogue Turbo HD'}`,
        `Camera Quantity    : ${cameraCount} Cameras (${formFactor.toUpperCase()})`,
        `Night Vision Mode  : ${nightVision === 'ir' ? 'Pure Infrared (IR)' : nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'ColorVu 24/7 Full Color'}`,
        `Recording Storage  : ${storageOption.toUpperCase()} Surveillance Grade HDD`,
        '--------------------------------------------------------------------------------',
        'ITEMIZED HARDWARE BREAKDOWN:',
        '--------------------------------------------------------------------------------'
      ];

      computedBOM.forEach((item, idx) => {
        const priceStr = item.lineTotal !== null ? `৳${item.lineTotal.toLocaleString()} BDT` : 'Quotation Required';
        const unitStr = item.unitPrice !== null ? `(@ ৳${item.unitPrice.toLocaleString()}/ea)` : '(Price on quotation)';
        lines.push(`${idx + 1}. [${item.role}] ${item.name}`);
        lines.push(`   Model: ${item.model} | SKU: ${item.sku}`);
        lines.push(`   Quantity: ${item.qty} ${unitStr} -> Line Total: ${priceStr}`);
        if (item.specs) lines.push(`   Specs: ${item.specs}`);
        if (item.warrantyText) lines.push(`   Warranty: ${item.warrantyText}`);
        lines.push('');
      });

      lines.push('--------------------------------------------------------------------------------');
      if (totalPrice !== null) {
        lines.push(`CONFIRMED HARDWARE EQUIPMENT TOTAL: ৳${totalPrice.toLocaleString()} BDT`);
      } else {
        lines.push(`INDICATIVE HARDWARE SUBTOTAL (PRICED ITEMS): ৳${pricedSubtotal.toLocaleString()} BDT`);
        lines.push(`FINAL PACKAGE TOTAL: Official Engineering Quotation Required (${quotationReason || 'Custom Configuration'})`);
      }
      lines.push('--------------------------------------------------------------------------------');
      lines.push('COMMERCIAL TERMS, WARRANTY & SERVICE DISCLAIMERS:');
      lines.push('1. BOM Validity: This bill of materials is held valid for 7 calendar days from the issue date.');
      lines.push('2. Price Fluctuation: Equipment prices may vary depending on official distributor exchange rate and actual order placement date.');
      lines.push('3. Service Charges: Installation, conduit piping, and engineering commissioning charges are excluded from the hardware total and will be quoted following on-site survey.');
      lines.push('4. Warranty Schedule: Official Bangladesh distributor warranty applies to all eligible cameras (1-2 years), recorders (1-2 years), and surveillance hard drives (3 years).');
      lines.push('5. Retention Estimates: Calculated storage retention periods are engineering estimates based on H.265+ smart compression and standard activity, not legal performance guarantees.');
      lines.push('================================================================================');

      const fullText = lines.join('\n');
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(fullText).then(() => {
          setCopiedBOM(true);
          setTimeout(() => setCopiedBOM(false), 2500);
        }).catch(() => {
          fallbackCopyText(fullText);
        });
      } else {
        fallbackCopyText(fullText);
      }
    } catch (err) {
      console.error('Failed to copy BOM:', err);
    }
  };

  // Download BOM with official CamneX letterhead template, logo, and 7-day validity
  const handleDownloadBOM = (format: 'pdf' | 'docx' | 'txt' = 'pdf') => {
    let exportData: BomExportData | null = null;
    try {
      exportData = {
        referenceNumber: `Ref: BOM-NX-${cameraCount}C-${systemArch.toUpperCase()}`,
        issueDate: bomDates.issueDate,
        validUntilDate: bomDates.validUntilDate,
        systemArch: systemArch === 'ip' ? 'IP Network (PoE Digital)' : systemArch === 'wireless' ? 'Wi-Fi Smart Wireless' : 'Analogue Turbo HD',
        cameraCount,
        cameraCategory: cameraCategory ? cameraCategory.replace(/_/g, ' ').toUpperCase() : formFactor.toUpperCase(),
        formFactor: formFactor.toUpperCase(),
        nightVision: nightVision === 'ir' ? 'Pure Infrared (IR)' : nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'Full Color (ColorVu)',
        storageOption: storageOption.toUpperCase(),
        cableLengthMeters,
        totalPrice,
        pricedSubtotal,
        unpricedCount,
        quotationReason: quotationReason || undefined,
        items: computedBOM
      };

      downloadBomDocument(exportData, settings?.letterheadTemplate, format);
      setDownloadedBOM(true);
      setTimeout(() => setDownloadedBOM(false), 2500);
    } catch (err) {
      console.error('Failed to download BOM document:', err);
      if (exportData) {
        // Fallback text download
        const content = generateBomText(exportData);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CamneX-BOM-${cameraCount}Cam-${systemArch.toUpperCase()}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
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
                            Enter any quantity from 1 to {systemArch === 'wireless' ? (wirelessRecordingType === 'nvr' ? '18 (Wi-Fi NVR ecosystem limit)' : '64 (Standalone Edge)') : '128 (Enterprise cluster)'}.
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
                            max={systemArch === 'wireless' ? (wirelessRecordingType === 'nvr' ? 18 : 64) : 128}
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
                            disabled={cameraCount >= (systemArch === 'wireless' ? (wirelessRecordingType === 'nvr' ? 18 : 64) : 128)}
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

                                {/* Audio & Active Capabilities Attribute Selector */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                      Audio & Active Capabilities
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                      Independent of physical housing
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => setRequiresTwoWayAudio(false)}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        !requiresTwoWayAudio
                                          ? 'border-[#F15A24] bg-orange-50/50 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold">Standard Audio Mic (1-Way)</div>
                                        <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">Standard</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5 font-normal">
                                        Integrated microphone records site ambient sound directly over coax or Cat6.
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setRequiresTwoWayAudio(true)}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                        requiresTwoWayAudio
                                          ? 'border-[#F15A24] bg-orange-50/50 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold">Two-Way Audio Talk (2-Way)</div>
                                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">Live Talk</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 mt-0.5 font-normal">
                                        Built-in microphone & speaker for interactive 2-way talkback via mobile app.
                                      </div>
                                    </button>
                                  </div>
                                </div>

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
            {/* STEP 3: RECORDER SIZING & SURVEILLANCE HARD DRIVE */}
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
                    Recorders are automatically matched to support your channel count and physical camera connections. Surveillance-grade hard drives ensure 24/7 continuous write durability.
                  </p>
                </div>

                {/* Enterprise Architecture Notice for >64 Cameras */}
                {cameraCount > 64 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2" data-testid="enterprise-banner">
                    <div className="flex items-center gap-2 font-heading font-black text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Large Enterprise Deployment (&gt;64 Cameras) — Engineering Review Notice</span>
                    </div>
                    <p className="text-xs leading-relaxed text-amber-800">
                      Surveillance systems exceeding 64 channels require dedicated bandwidth profiling and headend architecture planning. CamneX engineering provisions multi-NVR clusters, high-capacity RAID-enabled NVR headends, or central server-based VMS platforms (such as HikCentral or Dahua DSS) based on site throughput requirements without mandating rigid proprietary SAN/NAS lock-in. Direct self-checkout is disabled; this package will be routed directly for engineering review and custom quotation.
                    </p>
                  </div>
                )}

                {/* Under-Capacity Hardware Warning */}
                {recorderSpec.isUnderCapacity && (
                  <div className="p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 space-y-2" data-testid="under-capacity-warning">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-heading font-bold text-sm text-red-800">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Hardware Under-Capacity Warning</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRecorderProduct(null)}
                        className="text-xs font-bold text-red-700 underline hover:text-red-900 cursor-pointer text-left sm:text-right"
                      >
                        Reset to Recommended Recorder
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-red-700">
                      {recorderSpec.underCapacityReason || `The selected recorder only supports ${recorderSpec.channels} channels, which is insufficient for your ${cameraCount} cameras.`}
                    </p>
                    <div className="text-[11px] font-semibold text-red-600">
                      * Direct checkout is disabled until a fully compatible recorder is selected or an official engineering quote is requested.
                    </div>
                    {systemArch === 'wireless' && (
                      <div className="pt-2 border-t border-red-200 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setWirelessRecordingType('standalone_sd')}
                          className="px-2.5 py-1 rounded bg-white border border-red-300 text-xs font-bold text-red-800 hover:bg-red-100 cursor-pointer"
                        >
                          Option 1: Switch to Standalone MicroSD (No Limit)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWirelessRecordingType('third_party_nvr')}
                          className="px-2.5 py-1 rounded bg-white border border-red-300 text-xs font-bold text-red-800 hover:bg-red-100 cursor-pointer"
                        >
                          Option 2: Switch to Hikvision 32/64-Ch ONVIF NVR
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuoteModal(true)}
                          className="px-2.5 py-1 rounded bg-red-800 text-white text-xs font-bold hover:bg-red-900 cursor-pointer"
                        >
                          Option 3: Request Technical Engineering Quote
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Wireless Architecture Recording Options Selector */}
                {systemArch === 'wireless' && (
                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-xs uppercase tracking-wider text-purple-900">
                        Wireless Recording Architecture
                      </div>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {wirelessRecordingType === 'nvr' ? 'Dedicated Wireless NVR' : wirelessRecordingType === 'standalone_sd' ? 'Standalone MicroSD' : 'Third-Party NVR'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setWirelessRecordingType('nvr')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          wirelessRecordingType === 'nvr'
                            ? 'border-[#F15A24] bg-white ring-2 ring-[#F15A24] text-slate-900 shadow-sm'
                            : 'border-purple-200 bg-white/70 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">1. Supported Wireless NVR</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Dedicated Wi-Fi base station NVR with centralized hard drive (up to 18 channels verified ecosystem limit).
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWirelessRecordingType('standalone_sd')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          wirelessRecordingType === 'standalone_sd'
                            ? 'border-[#F15A24] bg-white ring-2 ring-[#F15A24] text-slate-900 shadow-sm'
                            : 'border-purple-200 bg-white/70 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">2. Standalone Edge MicroSD</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Cameras record directly to local 128GB High-Endurance MicroSD. Direct cloud/app gateway without NVR channel limits.
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setWirelessRecordingType('third_party_nvr')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          wirelessRecordingType === 'third_party_nvr'
                            ? 'border-[#F15A24] bg-white ring-2 ring-[#F15A24] text-slate-900 shadow-sm'
                            : 'border-purple-200 bg-white/70 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">3. Hikvision/Dahua ONVIF NVR</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          High-channel 4K NVR (16, 32, 64-ch) integrating ONVIF wireless streams via site Wi-Fi / AP network.
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Matched Recorder Card with Catalog Override Actions */}
                <div className={`p-5 rounded-2xl border space-y-3 ${recorderSpec.isUnderCapacity ? 'bg-red-50/30 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Matched Hardware Recorder
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {recorderSpec.isUnderCapacity ? (
                        <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Under-Capacity ({recorderSpec.channels} CH for {cameraCount} Cams)
                        </span>
                      ) : recorderSpec.isMultiRecorder ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Enterprise Multi-Recorder Cluster ({recorderSpec.channels} Channels)
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

                  {/* Hardware Specification Badges */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                    {systemArch === 'analogue' && (
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                        {recorderSpec.analogueBncChannels} BNC Coaxial Inputs + {recorderSpec.hybridIpInputs} Hybrid IP Inputs
                      </span>
                    )}
                    {systemArch === 'ip' && (
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                        {recorderSpec.channels} IP PoE Network Channels {recorderSpec.incomingBandwidthMbps ? `(${recorderSpec.incomingBandwidthMbps} Mbps)` : ''}
                      </span>
                    )}
                    {systemArch === 'wireless' && (
                      <span className="px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 font-semibold text-[11px]">
                        Wireless Edge MicroSD Storage / Direct App Gateway
                      </span>
                    )}
                    {recorderSpec.sataBays > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                        {recorderSpec.sataBays} SATA Hard Drive Bay{recorderSpec.sataBays > 1 ? 's' : ''}
                      </span>
                    )}
                    {recorderSpec.compression && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                        {recorderSpec.compression}
                      </span>
                    )}
                    {recorderSpec.maxResolution && (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                        Max: {recorderSpec.maxResolution}
                      </span>
                    )}
                  </div>

                  {recorderSpec.wirelessDutyCycleNote && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                      💡 <strong>Wireless Duty Cycle Notice:</strong> {recorderSpec.wirelessDutyCycleNote}
                    </div>
                  )}

                  {recorderSpec.isMultiRecorder && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                      💡 <strong>Multi-Unit Headend Architecture:</strong> Configurations with &gt;32 cameras utilize dual interconnected 32-channel network/digital video recorders for optimal bandwidth management and redundancy. Official engineering quotation required.
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs flex-wrap gap-2">
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
                      {systemArch === 'wireless' ? 'High-Endurance MicroSD Storage' : 'WD Purple / Seagate SkyHawk 24/7 Surveillance Series'}
                    </span>
                  </div>

                  {systemArch === 'wireless' ? (
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-heading font-bold text-sm text-purple-950">
                          High-Endurance 128GB MicroSD Card (1x Per Camera)
                        </div>
                        <div className="font-heading font-black text-base text-purple-900">
                          ৳{(1450 * cameraCount).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-xs text-purple-800 leading-relaxed">
                        Includes {cameraCount}x Kingston High-Endurance 128GB MicroSD Card{cameraCount > 1 ? 's' : ''}. Each wireless camera stores footage directly to local solid-state flash memory, avoiding central Wi-Fi bandwidth bottlenecks and preserving video if home internet disconnects.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { key: '500gb', size: '500 GB', bays: 1, price: '৳1,800' },
                          { key: '1tb', size: '1 TB', bays: 1, price: '৳4,800' },
                          { key: '2tb', size: '2 TB', bays: 1, price: '৳6,900' },
                          { key: 'barracuda_2tb', size: '2 TB (Desktop)', bays: 1, price: '৳5,800' },
                          { key: '4tb', size: '4 TB', bays: 1, price: '৳11,200' },
                          { key: 'dual_2tb', size: 'Dual 2 TB (4TB Array)', bays: 2, price: '৳13,800' },
                          { key: 'dual_4tb', size: 'Dual 4 TB (8TB Array)', bays: 2, price: '৳22,400' },
                          { key: 'quad_4tb', size: 'Quad 4 TB (16TB Array)', bays: 4, price: '৳44,800' }
                        ].map((stg) => {
                          const isBayCompatible = recorderSpec.sataBays >= stg.bays;
                          const isSelected = storageOption === stg.key;

                          return (
                            <button
                              key={stg.key}
                              type="button"
                              onClick={() => {
                                setStorageOption(stg.key as StorageOption);
                                setHasUserCustomizedStorage(true);
                              }}
                              className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                                isSelected
                                  ? 'bg-[#F15A24] border-[#F15A24] text-white shadow-xs'
                                  : !isBayCompatible
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                                  : 'bg-white border-[#EDE8E1] text-[#111827] hover:bg-slate-50'
                              }`}
                            >
                              <div className="font-heading font-bold text-sm">{stg.size}</div>
                              <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                {stg.bays} SATA Bay{stg.bays > 1 ? 's' : ''} Required
                              </div>
                              <div className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-white' : 'text-[#F15A24]'}`}>
                                {stg.price}
                              </div>
                              {!isBayCompatible && (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                                  Requires {stg.bays}-Bay DVR
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {storageOption === 'barracuda_2tb' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                          ℹ️ <strong>Desktop Duty Rating:</strong> Seagate BarraCuda is engineered for general PC desktop computing (8x5 duty cycle). For 24/7 continuous surveillance recording, WD Purple or Seagate SkyHawk surveillance-grade drives are recommended.
                        </div>
                      )}

                      {isStorageDriveBayIncompatible && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2" data-testid="bay-incompatible-warning">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Drive Bay Incompatibility:</strong> The selected storage configuration ({storageSpec?.name}) requires {storageSpec?.drivesRequired} SATA drive bays, but your selected recorder ({recorderSpec.model}) only has {recorderSpec.sataBays} SATA bay(s). Please choose a single drive or upgrade to a multi-bay recorder.
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Interactive Retention Calculation & Engineering Disclaimer Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4" data-testid="retention-calculator">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#111827]">
                        Surveillance Storage Retention Estimate
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dynamic calculation based on H.265+ bitrate, camera count, and 90% formatted HDD space.
                      </p>
                    </div>

                    {/* Recording Mode Toggle */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setRecordingMode('motion')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                          recordingMode === 'motion'
                            ? 'bg-[#111827] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Smart Motion (~12h/day)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordingMode('continuous')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                          recordingMode === 'continuous'
                            ? 'bg-[#111827] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Continuous 24/7 (24h/day)
                      </button>
                    </div>
                  </div>

                  {/* Retention Metrics Display */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Estimated Retention
                      </div>
                      <div className="font-heading font-black text-xl text-[#F15A24] mt-1">
                        {retentionEstimate.minDays} – {retentionEstimate.maxDays} Days
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        ~{retentionEstimate.estDays} days average
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Usable Storage
                      </div>
                      <div className="font-heading font-black text-xl text-slate-900 mt-1">
                        {retentionEstimate.usableGb} GB
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {systemArch === 'wireless' ? 'Per camera edge' : 'Usable formatted pool'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Daily Write Rate
                      </div>
                      <div className="font-heading font-black text-xl text-slate-900 mt-1">
                        {retentionEstimate.totalDailyGb} GB/day
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {retentionEstimate.gbPerCamPerDay} GB / camera / day
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Compression Profile
                      </div>
                      <div className="font-heading font-black text-base text-slate-900 mt-1 truncate">
                        {retentionEstimate.codec}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {retentionEstimate.bitrateKbps} Kbps · {retentionEstimate.resolutionLabel}
                      </div>
                    </div>
                  </div>

                  {/* Engineering Assumptions & Disclaimer */}
                  <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-200/60 pt-2">
                    {retentionEstimate.disclaimer}
                  </p>
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

                  {/* Under-Allocation Advisory Warning */}
                  {cableLengthMeters < cameraCount * 10 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong className="font-bold">Under-Allocation Advisory:</strong> Your custom allocation of {cableLengthMeters}m provides an average of {(cableLengthMeters / cameraCount).toFixed(1)}m per camera, which is less than the standard 10m/cam minimum. Ensure your camera mounting points are tightly clustered near the recorder location to prevent cable shortages during installation.
                      </div>
                    </div>
                  )}

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
                        <div className="flex items-center justify-between">
                          <div className="font-heading text-sm text-slate-900">
                            Direct Solid Copper RG59 Coaxial
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Recommended Standard
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                          Pure point-to-point coaxial video. Direct BNC crimp connections with heavy-duty DC pigtails (zero baluns required). 2-core power cable routed parallel from central power supply.
                        </div>
                        <div className="mt-2 text-[11px] text-slate-600 font-medium">
                          Includes: {cameraCount * 2}× Pure Copper BNC Connectors + {cameraCount}× Heavy-Duty Male DC Plugs
                        </div>
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
                        <div className="flex items-center justify-between">
                          <div className="font-heading text-sm text-slate-900">
                            Cat6 UTP with HD Video Baluns
                          </div>
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                            Multi-Pair / Conduit Laying
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                          Transmits video over twisted-pair Cat6 network cable using matched passive HD video baluns. Facilitates running multiple camera signals inside unified conduit pipelines.
                        </div>
                        <div className="mt-2 text-[11px] text-slate-600 font-medium">
                          Includes: {cameraCount * 2}× Matched Passive HD Video Baluns ({cameraCount} pairs) + {cameraCount}× DC Pigtails
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Regulated Power Distribution Architecture Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Regulated Power Distribution & Network Power</span>
                    </div>
                    {powerSpec?.badge && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
                        {powerSpec.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-heading font-bold text-slate-900 text-sm">
                      {powerSpec?.name}
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {powerSpec?.description}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      {powerSpec?.voltage && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Output: {powerSpec.voltage}
                        </span>
                      )}
                      {powerSpec?.currentRating && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Current: {powerSpec.currentRating}
                        </span>
                      )}
                      {powerSpec?.fuseProtection && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                          Fuse: {powerSpec.fuseProtection}
                        </span>
                      )}
                      {powerSpec?.ports && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium border border-blue-200">
                          {powerSpec.ports} PoE Ports ({powerSpec.poeBudgetW}W Budget)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Waterproof Junction Box Optional Enhancement Card (Analogue & IP only) */}
                {systemArch !== 'wireless' && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Box className="w-4 h-4 text-indigo-600" />
                        <span>Hikvision Deep Base Waterproof Junction Boxes (DS-1280ZJ-XS)</span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed max-w-xl">
                        Protects cable terminations, BNC/RJ45 connectors, and DC plugs from rainwater, humidity, dust, and physical tampering. Ensures long-term IP67 reliability and neat concealed installation.
                      </p>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Unit Price: ৳250/each · Total for {cameraCount} Cameras: ৳{(cameraCount * 250).toLocaleString()}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIncludeJunctionBoxes(!includeJunctionBoxes)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          includeJunctionBoxes
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {includeJunctionBoxes && <Check className="w-3.5 h-3.5" />}
                        <span>{includeJunctionBoxes ? 'Included in Package' : 'Add Junction Boxes'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Audio Transmission Architecture Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Volume2 className={`w-4 h-4 ${hasBuiltinAudio ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span>Audio Transmission Architecture</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      hasBuiltinAudio
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {hasBuiltinAudio ? 'Audio-Capable' : 'Video-Only'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {hasBuiltinAudio ? (
                      systemArch === 'analogue' ? (
                        <>
                          <strong>Audio-over-Coax (AoC) Enabled:</strong> The selected camera model features a built-in microphone with AoC technology. High-clarity digital audio is transmitted over the single coaxial/UTP cable alongside HD video directly to the DVR with zero separate audio wiring or RCA runs required.
                        </>
                      ) : systemArch === 'ip' ? (
                        <>
                          <strong>Digital Audio over Ethernet (PoE):</strong> Selected IP camera features an integrated digital microphone. Audio is encoded directly into the H.265+ stream and transmitted over the Cat6 PoE network cable to the NVR.
                        </>
                      ) : (
                        <>
                          <strong>Two-Way Real-Time Audio:</strong> Selected wireless camera includes built-in microphone and speaker for real-time live monitoring and two-way talk through the mobile app.
                        </>
                      )
                    ) : (
                      <>
                        <strong>Video-Only Architecture:</strong> The selected camera configuration provides high-definition visual surveillance without onboard microphone recording. If sound capture is required for your site, contact CamneX engineering for high-sensitivity external microphone modules.
                      </>
                    )}
                  </p>
                </div>

                {/* Security Display Monitor */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Optional Security Display Monitor
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Recorder includes simultaneous HDMI (up to 4K/1080p) & VGA display outputs
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraCount <= 4) setMonitorOption('17inch');
                        else if (cameraCount <= 16) setMonitorOption('19inch');
                        else setMonitorOption('19inch');
                      }}
                      className="text-[11px] font-bold text-[#F15A24] hover:underline cursor-pointer self-start sm:self-auto"
                    >
                      Apply Standard Package Display Default
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button
                      type="button"
                      onClick={() => setMonitorOption('none')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === 'none'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">No Monitor Included</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Use smartphone app, PC browser, or existing TV / monitor.
                      </div>
                      <div className="text-xs font-bold text-emerald-600 mt-2">৳0 (Included)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonitorOption('17inch')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === '17inch'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">17-Inch HD Monitor</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Compact security desk display. Standard default for 2–4 cams.
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-2">Ask for price</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonitorOption('19inch')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === '19inch'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">19-Inch LED Monitor</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Surveillance monitor with wide viewing. Standard default for 8–16 cams.
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-2">Ask for price</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonitorOption('24inch')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === '24inch'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">24-Inch FHD Display</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Professional high-clarity 1080p display for multi-camera grids.
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-2">Ask for price</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonitorOption('32inch')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        monitorOption === '32inch'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">32-Inch 4K Commercial</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Control-room grade large wall display for high-density viewing.
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-2">Ask for price</div>
                    </button>
                  </div>

                  {/* Optional Monitor Wall Mount Selector */}
                  {monitorOption !== 'none' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Display Wall Mounting Bracket
                        </label>
                        <span className="text-[11px] text-slate-500">
                          VESA compatible security mounts
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setWallMountOption('none')}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            wallMountOption === 'none'
                              ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                              : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">Standard Desk Stand</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Uses monitor table-top pedestal stand (Included).</div>
                          <div className="text-xs font-bold text-emerald-600 mt-1.5">৳0 (Included)</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWallMountOption('standard_vesa')}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            wallMountOption === 'standard_vesa'
                              ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                              : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">Full-Motion Articulating Arm</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Swivel & tilt arm for flexible viewing angles.</div>
                          <div className="text-xs font-bold text-[#F15A24] mt-1.5">+৳1,200</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWallMountOption('heavy_duty_tilt')}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            wallMountOption === 'heavy_duty_tilt'
                              ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold ring-1 ring-[#F15A24]'
                              : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-xs font-bold">Heavy-Duty Security Tilt Mount</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Reinforced cold-rolled steel with security lock.</div>
                          <div className="text-xs font-bold text-[#F15A24] mt-1.5">+৳1,800</div>
                        </button>
                      </div>
                    </div>
                  )}
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

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
                      onClick={() => handleDownloadBOM('pdf')}
                      className="px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      {downloadedBOM ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-slate-300" />}
                      <span>{downloadedBOM ? 'Downloaded!' : 'Download BOM (.txt)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleReissueBOM}
                      title="Re-issue BOM with today's date and a fresh 7-day validity period"
                      className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Re-issue BOM</span>
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      Guaranteed Pricing Window
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: BOM-NX-{cameraCount}C-{systemArch.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Architecture & Sizing Badges */}
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
                    <div className="font-bold">{powerSpec?.voltage || '12V'} Regulated</div>
                  </div>
                </div>

                {/* Upgraded Itemized BOM Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm shadow-2xs">
                  {computedBOM.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-white hover:bg-slate-50 transition"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F15A24] bg-orange-50 px-2 py-0.5 rounded">
                            {comp.role}
                          </span>
                          {comp.warrantyText && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              comp.warrantyMonths && comp.warrantyMonths >= 24
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : comp.warrantyMonths && comp.warrantyMonths >= 12
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {comp.warrantyText}
                            </span>
                          )}
                        </div>
                        <div className="font-heading font-bold text-slate-900 text-sm">
                          {comp.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Model: <strong className="text-slate-700">{comp.model}</strong> · SKU: {comp.sku}
                        </div>
                        {comp.specs && (
                          <div className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                            {comp.specs}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 self-stretch sm:self-center">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-500">Qty: </span>
                          <span className="font-bold text-slate-900 text-sm">{comp.qty}</span>
                        </div>

                        <div className="text-right min-w-[100px]">
                          {comp.lineTotal !== null ? (
                            <div className="font-heading font-black text-slate-900 text-base">
                              {comp.lineTotal === 0 ? (
                                <span className="text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  Included (৳0)
                                </span>
                              ) : (
                                `৳${comp.lineTotal.toLocaleString()}`
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
                              Ask for price
                            </span>
                          )}
                          {comp.unitPrice !== null && comp.qty > 1 && comp.unitPrice > 0 && (
                            <div className="text-[10px] text-slate-400">
                              @ ৳{comp.unitPrice.toLocaleString()}/ea
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Financial Status Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Equipment Investment Assessment
                      </span>
                      <h4 className="font-heading font-bold text-slate-900 text-base">
                        {quotationRequired ? 'Indicative Hardware Subtotal (Pending Quotation)' : 'Confirmed Hardware Subtotal'}
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      {quotationRequired ? (
                        <div>
                          <div className="text-xl sm:text-2xl font-heading font-black text-amber-700">
                            ৳{pricedSubtotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">(Priced items)</span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-800">
                            + {unpricedCount} custom item(s) pending site survey
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl sm:text-3xl font-heading font-black text-[#F15A24]">
                            ৳{totalPrice?.toLocaleString()} <span className="text-xs font-semibold text-slate-600">BDT</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Turnkey Hardware Confirmed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="leading-relaxed">
                      <strong>Installation Labor & Commissioning:</strong> Physical premises cabling, PVC casing/conduit laying, and DVR/NVR network configuration are excluded from equipment hardware subtotal and quoted separately following a certified site survey.
                    </p>
                    {quotationRequired && quotationReason && (
                      <p className="text-amber-800 text-[11px] font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <strong>Quotation Notice:</strong> {quotationReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Verified Product Warranty Schedule */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Product Warranty Policy</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                      <strong className="text-emerald-900 block font-bold">Surveillance HDDs: 3 Years</strong>
                      <span className="text-slate-600">Western Digital Purple & Seagate SkyHawk official replacement warranty.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80">
                      <strong className="text-blue-900 block font-bold">Cameras & Recorders: 1–2 Years</strong>
                      <span className="text-slate-600">Official Bangladesh distributor warranty against manufacturing defects.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/80">
                      <strong className="text-indigo-900 block font-bold">PoE Network Switches: 3 Years</strong>
                      <span className="text-slate-600">Ruijie Reyee Smart Cloud managed hardware warranty.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-800 block font-bold">Power & Cabling: Workmanship</strong>
                      <span className="text-slate-600">SMPS boxes: 1 year · Adapters: 6 months · Cabling: Workmanship guarantee.</span>
                    </div>
                  </div>
                </div>

                {/* Disclaimers & Notes */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#F15A24]" />
                    <span>Important Commercial & Service Disclaimers</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 leading-relaxed">
                    <li>
                      <strong>7-Day Price Guarantee:</strong> This Bill of Materials is valid for 7 calendar days from {bomDates.issueDate} until {bomDates.validUntilDate}. Prices may adjust thereafter according to official distributor exchange rates.
                    </li>
                    <li>
                      <strong>Service Charges:</strong> Installation, conduit casing/piping, and engineering commissioning charges are excluded from the hardware total and will be quoted following on-site survey.
                    </li>
                    <li>
                      <strong>Warranty:</strong> Official Bangladesh distributor warranty applies to all eligible cameras (1-2 years), recorders (1-2 years), and Western Digital / Seagate surveillance hard drives (3 years).
                    </li>
                    <li>
                      <strong>Retention Estimates:</strong> Calculated storage retention periods are engineering estimates based on H.265+ smart compression and standard activity, not legal performance guarantees.
                    </li>
                  </ul>
                </div>

                {/* Pure IR Notice */}
                {isPureIR && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pure Infrared Verification:</strong> This bill of materials contains genuine Hikvision IRPF hardware. Real infrared clarity up to 20m with zero fabricated color claims.
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
                    Step 6 of 6 · Final System Review
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Ready to Order or Request Site Survey
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Review your complete engineered turnkey configuration, verified component warranties, and pricing before adding to cart or booking an on-site technical consultation.
                  </p>
                </div>

                {/* System Eligibility Banner */}
                {canAddToCart ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="block font-bold">Turnkey System Verified & Confirmed for Order</strong>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        All cameras, recorder channels, storage bays, cabling, and power distribution match CamneX engineering rules with confirmed catalog pricing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block font-bold">Technical Consultation & Quotation Required Prior to Order</strong>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        {quotationReason || 'Custom setup requires site assessment or contains specialist/unpriced equipment.'}
                      </p>
                      <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        Online instant checkout disabled · Official quotation flow active
                      </span>
                    </div>
                  </div>
                )}

                {/* Comprehensive Turnkey System Summary */}
                <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-5 shadow-sm border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div>
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                        Engineered Turnkey Configuration
                      </span>
                      <h3 className="font-heading font-black text-lg text-white">
                        {cameraCount}-Camera {systemArch === 'ip' ? 'PoE IP Network System' : systemArch === 'wireless' ? 'Smart Wi-Fi System' : 'Turbo HD Coaxial System'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Ref: BOM-NX-{cameraCount}C-{systemArch.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800">
                        {bomDates.issueDate}
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Detailed Engineering Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                    {/* Column 1: Cameras & Coverage */}
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                        1. Cameras & Coverage
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div><strong className="text-white">Architecture:</strong> {systemArch === 'ip' ? 'IP PoE Digital' : systemArch === 'wireless' ? 'Wi-Fi Wireless' : 'Analogue Turbo HD'}</div>
                        <div><strong className="text-white">Category:</strong> {cameraCategory ? cameraCategory.replace(/_/g, ' ').toUpperCase() : formFactor.toUpperCase()}</div>
                        <div><strong className="text-white">Camera Model:</strong> {cameraSpec.name} ({cameraSpec.model})</div>
                        <div><strong className="text-white">Night Vision:</strong> {nightVision === 'ir' ? 'Pure Infrared (IR 20m)' : nightVision === 'hybrid' ? 'Smart Hybrid Light' : 'ColorVu 24/7 Full Color'}</div>
                        <div><strong className="text-white">Quantity:</strong> {cameraCount} Cameras</div>
                      </div>
                    </div>

                    {/* Column 2: Recording & Storage */}
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                        2. Recording & Storage
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div><strong className="text-white">Recorder:</strong> {recorderSpec.name}</div>
                        <div><strong className="text-white">Channels:</strong> {recorderSpec.channels} Channels ({recorderSpec.isUnderCapacity ? '⚠️ Under-Capacity' : '✓ Verified Matched'})</div>
                        <div><strong className="text-white">Hard Drive:</strong> {storageOption.toUpperCase()} Surveillance Grade</div>
                        <div><strong className="text-white">Drive Arrangement:</strong> {storageOption.includes('dual') ? '2x SATA Bays Occupied' : storageOption.includes('quad') ? '4x SATA Bays Occupied' : '1x SATA Bay Occupied'}</div>
                        <div><strong className="text-white">Retention Est.:</strong> ~{retentionEstimate.estDays} Days ({recordingMode === 'motion' ? 'Motion' : '24/7'})</div>
                      </div>
                    </div>

                    {/* Column 3: Cabling, Power & Display */}
                    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                        3. Cabling, Power & Display
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div><strong className="text-white">Transmission:</strong> {cableLengthMeters}m ({systemArch === 'ip' ? 'Cat6 UTP Solid Copper' : analogueTransmission === 'utp_baluns' ? 'Cat6 UTP with Baluns' : 'Solid Copper RG59 Coaxial'})</div>
                        <div><strong className="text-white">Connectors:</strong> {systemArch === 'ip' ? `${cameraCount * 2}x RJ45 Terminations` : analogueTransmission === 'utp_baluns' ? `${cameraCount}x Matched HD Video Balun Kits` : `${cameraCount * 2}x Pure Copper BNC Connectors + ${cameraCount}x DC Pigtails`}</div>
                        <div><strong className="text-white">Power Unit:</strong> {powerSpec?.name || '12V Regulated DC Supply'}</div>
                        <div><strong className="text-white">Junction Boxes:</strong> {includeJunctionBoxes ? `${cameraCount}x Waterproof Deep Base (IP66)` : 'Excluded (Direct Mount)'}</div>
                        <div><strong className="text-white">Display Monitor:</strong> {monitorSpec ? `${monitorSpec.name} (${monitorSpec.model})` : 'None Included'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Total & Action Row */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">
                        {quotationRequired ? 'Equipment Investment Assessment' : 'Total Package Price'}
                      </span>
                      {totalPrice === null || quotationRequired ? (
                        <div>
                          <div className="text-2xl font-heading font-black text-amber-400">
                            ৳{pricedSubtotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">(Priced hardware)</span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-300">
                            + {unpricedCount} custom component(s) pending official engineer quote
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-3xl font-heading font-black text-white">
                            ৳{totalPrice.toLocaleString()} <span className="text-xs font-semibold text-slate-400">BDT</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                            Confirmed Turnkey Equipment Total
                          </span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">
                        Installation labor, conduit piping & network commissioning quoted separately following certified on-site survey.
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                      {canAddToCart ? (
                        <>
                          <Button
                            size="lg"
                            onClick={handleAddPackageToCart}
                            className="bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold shadow-md cursor-pointer"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            <span>Add Package to Cart</span>
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={handleRequestQuote}
                            className="border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            <span>Book Site Survey</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="lg"
                            onClick={handleRequestQuote}
                            className="bg-[#F15A24] hover:bg-[#D94D1C] text-white font-bold shadow-md cursor-pointer"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            <span>Request Official Quote</span>
                          </Button>
                          <button
                            type="button"
                            disabled
                            title="Online checkout is disabled for custom quotation configurations."
                            className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/40 text-slate-500 text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                          >
                            <ShoppingBag className="w-4 h-4 text-slate-600" />
                            <span>Cart Checkout Unavailable</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verified Product Warranty Schedule */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Product Warranty Policy</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                      <strong className="text-emerald-900 block font-bold">Surveillance HDDs: 3 Years</strong>
                      <span className="text-slate-600">Western Digital Purple & Seagate SkyHawk official replacement warranty.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80">
                      <strong className="text-blue-900 block font-bold">Cameras & Recorders: 1–2 Years</strong>
                      <span className="text-slate-600">Official Bangladesh distributor warranty against manufacturing defects.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/80">
                      <strong className="text-indigo-900 block font-bold">PoE Network Switches: 3 Years</strong>
                      <span className="text-slate-600">Ruijie Reyee Smart Cloud managed hardware warranty.</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-800 block font-bold">Power & Cabling: Workmanship</strong>
                      <span className="text-slate-600">SMPS boxes: 1 year · Adapters: 6 months · Cabling: Workmanship guarantee.</span>
                    </div>
                  </div>
                </div>

                {/* CamneX Service & Installation Assurance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#F15A24]" />
                      <span>Certified Genuine Hardware</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      100% genuine Hikvision, Ruijie Reyee, and Western Digital equipment with official serial tracking and distributor replacement.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#F15A24]" />
                      <span>Nationwide Express Delivery</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Safe insured courier dispatch across all 64 districts in Bangladesh with real-time tracking and protective packaging.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-[#F15A24]" />
                      <span>Turnkey Installation Option</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      CamneX certified technician team available for neat PVC casing, conduit piping, camera focusing, and remote mobile viewing setup.
                    </p>
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
              {totalPrice === null || quotationRequired ? (
                <div className="text-xl sm:text-2xl font-heading font-black text-amber-600">
                  Ask for price
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-heading font-black text-[#F15A24]">
                  ৳{totalPrice.toLocaleString()}
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
                    const specs = rec.specifications || {};
                    const recId = rec.id;
                    const model = (rec.modelNumber || rec.name || '').toLowerCase();

                    // Calculate accurate channels & bays matching recorderSpec
                    let analogueBnc = 0;
                    let hybridIp = 0;
                    let totalCh = 8;
                    let bays = 1;

                    if (recId === 'prod-hik-dvr-4ch' || model.includes('7204')) {
                      analogueBnc = 4;
                      hybridIp = 1;
                      totalCh = 5;
                      bays = 1;
                    } else if (recId === 'prod-hik-dvr-8ch' || model.includes('7208')) {
                      analogueBnc = 8;
                      hybridIp = 2;
                      totalCh = 10;
                      bays = 1;
                    } else if (recId === 'prod-dahua-xvr-8ch' || model.includes('5108')) {
                      analogueBnc = 8;
                      hybridIp = 4;
                      totalCh = 12;
                      bays = 1;
                    } else if (recId === 'prod-hik-dvr-16ch' || model.includes('7216')) {
                      analogueBnc = 16;
                      hybridIp = 2;
                      totalCh = 18;
                      bays = 2;
                    } else if (recId === 'prod-dahua-xvr-16ch' || model.includes('5216')) {
                      analogueBnc = 16;
                      hybridIp = 8;
                      totalCh = 24;
                      bays = 2;
                    } else if (recId === 'prod-hik-dvr-32ch' || model.includes('7232')) {
                      analogueBnc = 32;
                      hybridIp = 16;
                      totalCh = 48;
                      bays = 4;
                    } else if (recId === 'prod-hik-nvr-8ch-poe' || model.includes('7608')) {
                      analogueBnc = 0;
                      hybridIp = 8;
                      totalCh = 8;
                      bays = 1;
                    } else {
                      const chStr = specs.channels || specs.channel_capacity || '';
                      totalCh = parseInt(chStr, 10) || 8;
                      analogueBnc = systemArch === 'analogue' ? totalCh : 0;
                      hybridIp = systemArch === 'ip' ? totalCh : 0;
                      bays = specs.hdd_slots?.includes('2') ? 2 : specs.hdd_slots?.includes('4') ? 4 : 1;
                    }

                    const isUnderCap = systemArch === 'analogue' 
                      ? cameraCount > analogueBnc 
                      : cameraCount > totalCh;

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-[#F15A24] bg-orange-50/40 ring-1 ring-[#F15A24]'
                            : isUnderCap
                            ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-sm text-[#111827]">
                              {rec.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase text-white bg-[#F15A24] px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                            {systemArch === 'analogue' ? (
                              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                                {analogueBnc} BNC Inputs (+{hybridIp} IP)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                                {totalCh} IP Channels
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {bays} SATA Bay{bays > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Model: {rec.modelNumber || rec.id} · Brand: {rec.brand || 'Hikvision'}
                          </div>
                          {isUnderCap && (
                            <p className="text-[11px] text-amber-800 bg-amber-100/70 rounded-lg p-2 border border-amber-300 leading-relaxed">
                              ⚠️ <strong>Under-Capacity Warning:</strong> Provides {systemArch === 'analogue' ? `${analogueBnc} physical BNC inputs` : `${totalCh} channels`} for your {cameraCount} cameras. Selecting this model flags your configuration as quotation-required and prevents instant self-checkout.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                          <div className="font-heading font-black text-base text-[#111827]">
                            {price ? `৳${price.toLocaleString()}` : 'Quote required'}
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
          <div
            data-modal="package-quote"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-modal-title"
            onClick={() => setShowQuoteModal(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-150"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F15A24] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="quote-modal-title" className="font-heading font-black text-lg text-[#111827]">
                      Request Official Engineering Quotation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configured for {cameraCount} Cameras · {systemArch === 'ip' ? 'IP PoE Digital' : systemArch === 'wireless' ? 'Wi-Fi Wireless' : 'Analogue Turbo HD'} Architecture
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  data-modal-close="package-quote"
                  aria-label="Close quote modal"
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
                      <span className="text-[10px] uppercase font-bold text-slate-400">Official Quotation Reference</span>
                      <div className="font-mono font-black text-lg text-[#F15A24]">
                        {quoteSuccessResult.quoteNumber}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Please save this reference number. Our senior engineer will review your site requirements and call you within 2–4 business hours.
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
                  <form onSubmit={handleQuoteFormSubmit} noValidate className="space-y-4">
                    {/* Hardware Summary Box */}
                    <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 text-xs space-y-2">
                      <div className="font-heading font-bold text-slate-900 flex items-center justify-between">
                        <span>Configured Hardware Specification</span>
                        <span className="font-black text-[#F15A24]">
                          {totalPrice !== null ? `৳${totalPrice.toLocaleString()} BDT` : 'Quotation Required'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                        <div><strong>Architecture:</strong> {systemArch.toUpperCase()}</div>
                        <div><strong>Cameras:</strong> {cameraCount}x {cameraSpec.name} ({cameraSpec.model})</div>
                        <div><strong>Night Vision:</strong> {nightVision.toUpperCase()}</div>
                        <div><strong>Recorder:</strong> {recorderSpec.channels}-Ch ({recorderSpec.model})</div>
                        <div><strong>Storage:</strong> {storageOption.toUpperCase()} Surveillance Grade</div>
                        <div><strong>Cabling:</strong> {cableLengthMeters}m pure copper allocation</div>
                        <div><strong>Power Unit:</strong> {powerSpec?.name || '12V Regulated DC Supply'}</div>
                        <div><strong>Monitor:</strong> {monitorSpec ? `${monitorSpec.name} (${monitorSpec.model})` : 'None Included'}</div>
                      </div>
                      {quotationRequired && quotationReason && (
                        <div className="pt-1.5 border-t border-orange-200/80 text-[10px] text-amber-800 font-semibold">
                          ⚠️ Note: {quotationReason}
                        </div>
                      )}
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
                        <label htmlFor="quote-customer-name" className="font-bold text-slate-700 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          id="quote-customer-name"
                          type="text"
                          required
                          value={quoteFormData.customerName}
                          onChange={(e) => {
                            setQuoteFormData({ ...quoteFormData, customerName: e.target.value });
                            if (quoteFormErrors.customerName) setQuoteFormErrors(prev => ({ ...prev, customerName: undefined }));
                          }}
                          placeholder="e.g. Engr. Tanvir Ahmed"
                          className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                            quoteFormErrors.customerName ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                          }`}
                        />
                        {quoteFormErrors.customerName && (
                          <p className="text-[11px] text-red-600 font-medium mt-1">{quoteFormErrors.customerName}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="quote-customer-phone" className="font-bold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Mobile Phone (11 Digits) *</span>
                        </label>
                        <input
                          id="quote-customer-phone"
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
                            if (quoteFormErrors.phone) setQuoteFormErrors(prev => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="01712345678"
                          className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                            quoteFormErrors.phone ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                          }`}
                        />
                        {quoteFormErrors.phone && (
                          <p className="text-[11px] text-red-600 font-medium mt-1">{quoteFormErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label htmlFor="quote-customer-whatsapp" className="font-bold text-slate-700 flex items-center gap-1">
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
                          id="quote-customer-whatsapp"
                          type="tel"
                          disabled={quoteFormData.whatsappSameAsPhone}
                          value={quoteFormData.whatsappSameAsPhone ? quoteFormData.phone : quoteFormData.whatsapp}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, whatsapp: e.target.value })}
                          placeholder="01712345678 (Optional)"
                          className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                            quoteFormData.whatsappSameAsPhone ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="quote-customer-email" className="font-bold text-slate-700 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Email Address</span>
                        </label>
                        <input
                          id="quote-customer-email"
                          type="email"
                          value={quoteFormData.email}
                          onChange={(e) => {
                            setQuoteFormData({ ...quoteFormData, email: e.target.value });
                            if (quoteFormErrors.email) setQuoteFormErrors(prev => ({ ...prev, email: undefined }));
                          }}
                          placeholder="you@example.com (Optional)"
                          className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24] ${
                            quoteFormErrors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                          }`}
                        />
                        {quoteFormErrors.email && (
                          <p className="text-[11px] text-red-600 font-medium mt-1">{quoteFormErrors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Logged in saved addresses selector (if customer is authenticated) */}
                    {isCustomerAuthenticated && currentCustomer?.addresses && currentCustomer.addresses.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Select Saved Delivery / Site Address</span>
                        </label>
                        <select
                          value={selectedSavedAddressId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedSavedAddressId(val);
                            if (val !== 'new') {
                              const found = currentCustomer.addresses?.find((a: any) => a.id === val);
                              if (found) {
                                setSelectedDistrict(found.district || 'Dhaka');
                                setSelectedThana(found.thana || 'Gulshan');
                                setQuoteFormData(prev => ({
                                  ...prev,
                                  siteAddress: found.addressLine || (found as any).address || prev.siteAddress
                                }));
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        >
                          <option value="new">+ Enter New Site Address</option>
                          {currentCustomer.addresses.map((addr: any) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.label || addr.addressType || 'Saved Address'}: {addr.addressLine || addr.address}, {addr.thana || ''}, {addr.district || ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* District & Thana Selectors for Bangladesh */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label htmlFor="quote-district" className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>District *</span>
                        </label>
                        <select
                          id="quote-district"
                          value={selectedDistrict}
                          onChange={(e) => {
                            const newDist = e.target.value;
                            setSelectedDistrict(newDist);
                            const thanas = getThanasForDistrict(newDist);
                            if (thanas && thanas.length > 0) {
                              setSelectedThana(thanas[0]);
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        >
                          {BANGLADESH_DISTRICTS.map((d) => (
                            <option key={d.district} value={d.district}>
                              {d.district} ({d.division})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="quote-thana" className="font-bold text-slate-700 flex items-center gap-1">
                          <span>Thana / Upazila *</span>
                        </label>
                        <select
                          id="quote-thana"
                          value={selectedThana}
                          onChange={(e) => setSelectedThana(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        >
                          {getThanasForDistrict(selectedDistrict).map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label htmlFor="quote-company-name" className="font-bold text-slate-700 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>Company / Organization</span>
                        </label>
                        <input
                          id="quote-company-name"
                          type="text"
                          value={quoteFormData.companyName}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, companyName: e.target.value })}
                          placeholder="Company name or Home (Optional)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="quote-site-address" className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#F15A24]" />
                          <span>Installation Street Address</span>
                        </label>
                        <input
                          id="quote-site-address"
                          type="text"
                          value={quoteFormData.siteAddress}
                          onChange={(e) => setQuoteFormData({ ...quoteFormData, siteAddress: e.target.value })}
                          placeholder="e.g. Uttara Sector 7, Dhaka"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F15A24]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label htmlFor="quote-notes" className="font-bold text-slate-700">
                        Project Notes / Special Site Requirements
                      </label>
                      <textarea
                        id="quote-notes"
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
