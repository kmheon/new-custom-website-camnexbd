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
  FileText,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Info,
  AlertCircle,
  Eye,
  Wifi,
  Video,
  Radio,
  Server
} from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { Breadcrumbs, Button, Badge } from '../components/common/UI';
import { packageService } from '../services';
import { SecurityPackage, CameraFormFactor } from '../types';
import { useCartStore } from '../store';

export type SystemArch = 'analogue' | 'ip' | 'wireless';
export type NightVisionMode = 'ir' | 'colorvu' | 'hybrid';
export type StorageOption = '500gb' | '1tb' | '2tb' | '4tb' | 'none';
export type MonitorOption = 'none' | '17inch' | '19inch';

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
}

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
  const [formFactor, setFormFactor] = useState<CameraFormFactor>('bullet');
  const [nightVision, setNightVision] = useState<NightVisionMode>('ir');
  const [hasAudio, setHasAudio] = useState<boolean>(true);
  const [storageOption, setStorageOption] = useState<StorageOption>('1tb');
  const [monitorOption, setMonitorOption] = useState<MonitorOption>('none');
  const [copiedBOM, setCopiedBOM] = useState(false);

  const addItemToCart = useCartStore((s) => s.addItem);

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

          if (found.cameraCount) setCameraCount(found.cameraCount);

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

  // Derive Recorder Sizing (Rule: Recorder channels must be >= camera count)
  const recorderSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      return {
        channels: cameraCount <= 4 ? 4 : 8,
        name: cameraCount <= 4 ? 'EZVIZ 4-Channel Wireless Smart NVR' : 'EZVIZ 8-Channel Wireless Smart NVR',
        model: cameraCount <= 4 ? 'CS-X5S-4W' : 'CS-X5S-8W',
        sku: cameraCount <= 4 ? 'EZV-NVR-4CH' : 'EZV-NVR-8CH',
        unitPrice: cameraCount <= 4 ? 6500 : 9500
      };
    }

    if (systemArch === 'ip') {
      if (cameraCount <= 8) {
        return {
          channels: 8,
          name: 'Hikvision 8-Channel 4K Embedded PoE Network Video Recorder',
          model: 'DS-7608NI-Q1/8P',
          sku: 'HIK-NVR-8CH-POE',
          unitPrice: 14800
        };
      } else if (cameraCount <= 16) {
        return {
          channels: 16,
          name: 'Hikvision 16-Channel 4K Ultra HD PoE NVR',
          model: 'DS-7616NI-K2/16P',
          sku: 'HIK-NVR-16CH-POE',
          unitPrice: 24500
        };
      } else {
        return {
          channels: 32,
          name: 'Hikvision 32-Channel 4K Enterprise NVR',
          model: 'DS-7732NI-M4',
          sku: 'HIK-NVR-32CH',
          unitPrice: null // Quote only
        };
      }
    }

    // Analogue HD (Turbo HD DVR)
    if (cameraCount <= 4) {
      return {
        channels: 4,
        name: 'Hikvision 4-Channel 1080p AcuSense HD DVR',
        model: 'iDS-7204HQHI-M1/S',
        sku: 'HIK-DVR-4CH',
        unitPrice: 4500
      };
    } else if (cameraCount <= 8) {
      return {
        channels: 8,
        name: 'Hikvision 8-Channel 1080p AcuSense HD DVR',
        model: 'iDS-7208HQHI-M1/S',
        sku: 'HIK-DVR-8CH',
        unitPrice: 6800
      };
    } else if (cameraCount <= 16) {
      return {
        channels: 16,
        name: 'Hikvision 16-Channel 1080p AcuSense HD DVR',
        model: 'iDS-7216HQHI-M2/S',
        sku: 'HIK-DVR-16CH',
        unitPrice: 12500
      };
    } else {
      return {
        channels: 32,
        name: 'Hikvision 32-Channel Enterprise AcuSense HD DVR',
        model: 'iDS-7232HQHI-M2/S',
        sku: 'HIK-DVR-32CH',
        unitPrice: 28000
      };
    }
  }, [systemArch, cameraCount]);

  // Derive Camera Model based on System + Night Vision + Form Factor
  const cameraSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      if (formFactor === 'dome' || formFactor === 'turret') {
        return {
          name: 'EZVIZ C6N 3MP Pan & Tilt Smart Wi-Fi Camera',
          model: 'CS-C6N-D0-8B3WF',
          sku: 'EZV-C6N-3MP',
          unitPrice: 4200
        };
      }
      return {
        name: 'EZVIZ H3c 2K Color Night Vision Outdoor Wi-Fi Camera',
        model: 'CS-H3c-R100-1K3WKFL',
        sku: 'EZV-H3C-3MP',
        unitPrice: 6500
      };
    }

    if (systemArch === 'ip') {
      if (nightVision === 'colorvu') {
        return {
          name: `Hikvision 4MP ColorVu PoE ${formFactor === 'dome' ? 'Dome' : 'Bullet'} Camera`,
          model: formFactor === 'dome' ? 'DS-2CD2147G2-SU' : 'DS-2CD2047G2-LU',
          sku: 'HIK-IP-COLORVU-4MP',
          unitPrice: 9200
        };
      }
      return {
        name: `Hikvision 4MP EXIR PoE ${formFactor === 'dome' ? 'Dome' : 'Bullet'} Camera`,
        model: formFactor === 'dome' ? 'DS-2CD1143G0-I' : 'DS-2CD1043G0-I',
        sku: 'HIK-IP-EXIR-4MP',
        unitPrice: 7200
      };
    }

    // Analogue HD
    if (nightVision === 'colorvu') {
      return {
        name: 'Hikvision 2MP ColorVu Full-Color Audio Bullet Camera',
        model: 'DS-2CE10DF0T-FS',
        sku: 'prod-hik-color-2mp',
        unitPrice: 3800
      };
    }

    if (nightVision === 'hybrid') {
      return {
        name: 'Hikvision 2MP Smart Hybrid Light Audio Camera',
        model: 'DS-2CE16D0T-LPFS',
        sku: 'HIK-2MP-HYBRID',
        unitPrice: 3100
      };
    }

    // Pure Infrared IRPF Standard
    if (formFactor === 'dome') {
      return {
        name: 'Hikvision 2MP Indoor Audio Turret Dome Camera',
        model: 'DS-2CE76D0T-ITPFS',
        sku: 'prod-hik-dome-2mp',
        unitPrice: 2350
      };
    }

    return {
      name: 'Hikvision 2MP Audio Fixed Mini Bullet Camera',
      model: 'DS-2CE16D0T-ITPFS',
      sku: 'prod-hik-irpf-2mp',
      unitPrice: 2400
    };
  }, [systemArch, nightVision, formFactor]);

  // Derive Hard Drive Sizing
  const storageSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      return {
        name: 'Kingston High-Endurance 128GB MicroSD Card (Per Camera)',
        model: 'SDCE/128GB',
        sku: 'SD-128GB-SURV',
        qty: cameraCount,
        unitPrice: 1450,
        lineTotal: 1450 * cameraCount
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
        lineTotal: 1800
      };
    }

    if (storageOption === '1tb') {
      return {
        name: 'Western Digital Purple 1TB 3.5" Surveillance Internal HDD',
        model: 'WD10PURZ',
        sku: 'prod-wd-purple-1tb',
        qty: 1,
        unitPrice: 4800,
        lineTotal: 4800
      };
    }

    if (storageOption === '2tb') {
      return {
        name: 'Western Digital Purple 2TB 3.5" Surveillance Internal HDD',
        model: 'WD20PURZ',
        sku: 'prod-wd-purple-2tb',
        qty: 1,
        unitPrice: 6900,
        lineTotal: 6900
      };
    }

    // 4TB
    return {
      name: 'Seagate SkyHawk 4TB Surveillance Internal Hard Drive 3.5"',
      model: 'ST4000VX016',
      sku: 'prod-st-skyhawk-4tb',
      qty: 1,
      unitPrice: 11200,
      lineTotal: 11200
    };
  }, [storageOption, systemArch, cameraCount]);

  // Strict Rule: 10m cable per camera
  const cableLengthMeters = cameraCount * 10;

  // Power Distribution
  const powerSpec = useMemo(() => {
    if (systemArch === 'wireless') {
      return {
        name: 'CamneX 12V 2A Regulated Power Adapter (Per Camera)',
        model: 'AD-12V2A-DC',
        sku: 'acc-power-adapter',
        qty: cameraCount,
        unitPrice: 350,
        lineTotal: 350 * cameraCount
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
        lineTotal: 0
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
        lineTotal: 700
      };
    }

    return {
      name: 'CamneX Central 12V 10A 9-Channel Metal Cased Power Supply Box',
      model: 'PS-12V10A-9CH',
      sku: 'acc-power',
      qty: 1,
      unitPrice: 1800,
      lineTotal: 1800
    };
  }, [systemArch, cameraCount]);

  // Optional Monitor Spec
  const monitorSpec = useMemo(() => {
    if (monitorOption === '17inch') {
      return {
        name: '17-Inch HD 75Hz CCTV Surveillance Monitor (HDMI & VGA)',
        model: 'MON-SURV-17HD',
        sku: 'MON-17INCH-SURV',
        qty: 1,
        unitPrice: null // Quote item per catalog
      };
    }
    if (monitorOption === '19inch') {
      return {
        name: '19-Inch Full HD 24/7 Security Display Monitor',
        model: 'MON-SURV-19FHD',
        sku: 'MON-19INCH-SURV',
        qty: 1,
        unitPrice: null // Quote item per catalog
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

    // 4. Cabling (Strict 10m per camera)
    if (systemArch !== 'wireless') {
      const isIp = systemArch === 'ip';
      list.push({
        role: 'Transmission Cabling',
        name: isIp
          ? `D-Link CAT6 UTP Pure Solid Copper Cable (${cableLengthMeters}m @ 10m/cam)`
          : `High-Shield Pure Copper Coaxial Video Cable (${cableLengthMeters}m @ 10m/cam)`,
        model: isIp ? 'NCB-C6UBLUR-305' : 'COAX-RG59-CU',
        sku: isIp ? 'DL-CAT6-UTP' : 'COAX-RG59-PURE',
        qty: cableLengthMeters,
        unitPrice: isIp ? 32 : 30,
        lineTotal: (isIp ? 32 : 30) * cableLengthMeters
      });
    }

    // 5. Connectors & Baluns
    if (systemArch === 'analogue') {
      list.push({
        role: 'Video & Power Connectors',
        name: 'Passive HD Video Balun & DC Power Pigtails (Per Camera Kit)',
        model: 'BALUN-HD-KIT',
        sku: 'acc-balun',
        qty: cameraCount,
        unitPrice: 250,
        lineTotal: 250 * cameraCount
      });
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
    cableLengthMeters,
    powerSpec,
    monitorSpec
  ]);

  // Calculate Pricing & Quote-Only status
  // Rule: If any component has missing price or 32+ cameras or monitor selected, mark as quotationRequired
  const { totalPrice, quotationRequired, quotationReason } = useMemo(() => {
    let sum = 0;
    let quoteOnly = false;
    const unpricedItems: string[] = [];

    if (cameraCount >= 32) {
      quoteOnly = true;
      unpricedItems.push('32+ Enterprise Scale System');
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
        ? `One or more custom items (${unpricedItems.join(', ')}) require technical site assessment or engineering quotation.`
        : null
    };
  }, [computedBOM, cameraCount]);

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
        `Cabling: ${cableLengthMeters}m pure copper allocation (strictly 10m/cam)`
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

  // Action: Request Quote with Pre-filled Data
  const handleRequestQuote = () => {
    const summaryText = `[Custom Package Builder Configuration]
Architecture: ${systemArch.toUpperCase()}
Cameras: ${cameraCount}x ${cameraSpec.name} (${formFactor.toUpperCase()})
Night Vision: ${nightVision.toUpperCase()}
Recorder: ${recorderSpec.name} (${recorderSpec.channels} Channels)
Storage: ${storageSpec ? storageSpec.name : 'None'}
Cable Allocation: ${cableLengthMeters}m (Strict 10m/camera rule)
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

    onNavigate('quote');
  };

  // Copy BOM to clipboard
  const handleCopyBOM = () => {
    const lines = computedBOM.map(
      (b, idx) =>
        `${idx + 1}. [${b.role}] ${b.name} (Model: ${b.model}) - Qty: ${b.qty} ${
          b.lineTotal !== null ? `@ ৳${b.lineTotal.toLocaleString()}` : '(Quote required)'
        }`
    );
    lines.unshift(`CamneX Bangladesh — Technical Bill of Materials (${cameraCount} Cameras)\n======================================================`);
    if (totalPrice) {
      lines.push(`\nCalculated Total: ৳${totalPrice.toLocaleString()} BDT`);
    } else {
      lines.push(`\nTotal: Quotation Required (${quotationReason || 'Custom setup'})`);
    }

    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedBOM(true);
    setTimeout(() => setCopiedBOM(false), 2500);
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
                    onClick={() => setSystemArch('analogue')}
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
                    onClick={() => setSystemArch('ip')}
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
                    onClick={() => setSystemArch('wireless')}
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

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#F15A24] shrink-0 mt-0.5" />
                  <span>
                    <strong>Engineering Note:</strong> Analogue HD systems deliver guaranteed zero-latency video over solid copper coaxial cable. IP Network systems offer maximum flexibility and 4K digital expansion. Both include full mobile app viewing.
                  </span>
                </div>
              </div>
            )}

            {/* ==================================================================== */}
            {/* STEP 2: COVERAGE & CAMERA SELECTION */}
            {/* ==================================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                    Step 2 of 6
                  </span>
                  <h2 className="text-xl font-heading font-black text-[#111827]">
                    Camera Count, Form Factor & Night Vision
                  </h2>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Select how many monitoring points you need and your preferred camera housing and night vision sensor.
                  </p>
                </div>

                {/* Camera Count Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. Number of Cameras
                  </label>
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {[2, 4, 8, 16, 32].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setCameraCount(cnt)}
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
                </div>

                {/* Form Factor Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Camera Form Factor & Mounting
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: 'bullet',
                        name: 'Bullet Camera',
                        desc: 'Weatherproof wall mount with sunshield hood. Outdoor perimeters, gates & corridors.'
                      },
                      {
                        key: 'dome',
                        name: 'Dome Camera',
                        desc: 'Discreet ceiling mount with tamper-resistant housing. Indoor receptions & rooms.'
                      },
                      {
                        key: 'turret',
                        name: 'Turret (Eyeball)',
                        desc: 'Flexible 3-axis ball-and-socket. Zero infrared reflection. Indoor/outdoor versatile.'
                      }
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFormFactor(f.key as CameraFormFactor)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          formFactor === f.key
                            ? 'border-[#111827] bg-slate-900 text-white shadow-xs'
                            : 'border-[#EDE8E1] bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-heading font-bold text-sm">{f.name}</div>
                          <div className={`text-xs mt-1 leading-snug ${formFactor === f.key ? 'text-slate-300' : 'text-slate-500'}`}>
                            {f.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Night Vision Technology */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    3. Night Vision Technology
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNightVision('ir')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        nightVision === 'ir'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">Pure Infrared (EXIR)</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Monochrome black-and-white night vision up to 20m in complete dark.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNightVision('colorvu')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        nightVision === 'colorvu'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">ColorVu (Full-Color)</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        24/7 vivid color night imaging with F1.0 large aperture lens.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNightVision('hybrid')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        nightVision === 'hybrid'
                          ? 'border-[#F15A24] bg-orange-50/40 text-[#111827] font-bold'
                          : 'border-[#EDE8E1] bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-heading text-sm">Smart Hybrid Light</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        Infrared standby; switches automatically to white light on target detection.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Pure IR Notice */}
                {isPureIR && (
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

                {/* Matched Recorder Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Matched Hardware Recorder
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {recorderSpec.channels} Channels Matched for {cameraCount} Cameras
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-bold text-base text-[#111827]">
                        {recorderSpec.name}
                      </h4>
                      <div className="text-xs text-slate-500 font-mono">
                        Model: {recorderSpec.model} · SKU: {recorderSpec.sku}
                      </div>
                    </div>
                    <div className="text-right">
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

                {/* Cable Allocation Rule Banner */}
                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#D94D1C]">
                    <Cable className="w-4 h-4" />
                    <span>Strict 10m/Camera Cable Allocation Rule</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    Based on CamneX installation standards, exactly <strong>10 meters of pure copper cable</strong> is allocated per camera. For your {cameraCount} cameras, this totals <strong>{cableLengthMeters} meters</strong> of high-grade transmission cable.
                  </p>
                </div>

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#F15A24] uppercase tracking-wider block">
                      Step 5 of 6
                    </span>
                    <h2 className="text-xl font-heading font-black text-[#111827]">
                      Itemized Bill of Materials (BOM)
                    </h2>
                    <p className="text-xs text-[#5B6472] mt-1">
                      Inspect every hardware component, model number, unit quantity, and line price before ordering.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyBOM}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedBOM ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedBOM ? 'BOM Copied!' : 'Copy BOM'}</span>
                  </button>
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
                    <div className="font-bold">{cableLengthMeters}m @ 10m/cam</div>
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

      </div>
    </div>
  );
};
