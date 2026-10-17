import { ProductVariantGroup, ProductVariantOption, Product } from '../types';

/**
 * Genuine Product Variant Groups in CamneX Bangladesh Catalog.
 * Delineates real catalog products that belong to the same product family / model series,
 * differing strictly by genuine physical/hardware specifications (ports, capacity, channels, form factor).
 */
export const CATALOG_VARIANT_GROUPS: Array<{
  id: string;
  seriesName: string;
  distinguishingFeatureLabel?: string;
  productIds: string[];
  variants: Array<{
    productId: string;
    modelNumber: string;
    distinguishingSpec: string;
  }>;
}> = [
  // 1. Ruijie Reyee RG-ES200 Series Smart Cloud Managed PoE Switches
  {
    id: 'grp-ruijie-es200',
    seriesName: 'Ruijie Reyee RG-ES200 Series',
    distinguishingFeatureLabel: 'Port & PoE Budget',
    productIds: ['prod-ruijie-es205gc-p', 'prod-ruijie-es209gc-p', 'prod-ruijie-es224gc-p'],
    variants: [
      { productId: 'prod-ruijie-es205gc-p', modelNumber: 'RG-ES205GC-P', distinguishingSpec: '5-Port PoE (54W)' },
      { productId: 'prod-ruijie-es209gc-p', modelNumber: 'RG-ES209GC-P', distinguishingSpec: '9-Port PoE (120W)' },
      { productId: 'prod-ruijie-es224gc-p', modelNumber: 'RG-ES224GC-P', distinguishingSpec: '24-Port PoE (370W)' }
    ]
  },

  // 2. Ruijie Reyee RG-RAP Access Points
  {
    id: 'grp-ruijie-rap',
    seriesName: 'Ruijie Reyee Access Points',
    distinguishingFeatureLabel: 'Speed & Mount',
    productIds: ['prod-ruijie-rap1200f', 'prod-ruijie-rap2200e', 'prod-ruijie-rap2260g'],
    variants: [
      { productId: 'prod-ruijie-rap1200f', modelNumber: 'RG-RAP1200(F)', distinguishingSpec: 'In-Wall AC1200' },
      { productId: 'prod-ruijie-rap2200e', modelNumber: 'RG-RAP2200(E)', distinguishingSpec: 'Ceiling AC1300' },
      { productId: 'prod-ruijie-rap2260g', modelNumber: 'RG-RAP2260(G)', distinguishingSpec: 'Ceiling AX1800 Wi-Fi 6' }
    ]
  },

  // 3. Hikvision 1080p AcuSense HD DVR Series (iDS-7200HQHI-M Series)
  {
    id: 'grp-hik-dvr-7200',
    seriesName: 'Hikvision AcuSense HD DVR Series',
    distinguishingFeatureLabel: 'Channels & Storage',
    productIds: ['prod-hik-dvr-4ch', 'prod-hik-dvr-8ch', 'prod-hik-dvr-16ch', 'prod-hik-dvr-32ch'],
    variants: [
      { productId: 'prod-hik-dvr-4ch', modelNumber: 'iDS-7204HQHI-M1/S', distinguishingSpec: '4-Channel (1 SATA)' },
      { productId: 'prod-hik-dvr-8ch', modelNumber: 'iDS-7208HQHI-M1/S', distinguishingSpec: '8-Channel (1 SATA)' },
      { productId: 'prod-hik-dvr-16ch', modelNumber: 'iDS-7216HQHI-M2/S', distinguishingSpec: '16-Channel (2 SATA)' },
      { productId: 'prod-hik-dvr-32ch', modelNumber: 'iDS-7232HQHI-M2/S', distinguishingSpec: '32-Channel (4 SATA)' }
    ]
  },

  // 4. Dahua WizSense XVR Systems (DH-XVR5000 Series)
  {
    id: 'grp-dahua-xvr-5000',
    seriesName: 'Dahua WizSense XVR Series',
    distinguishingFeatureLabel: 'Channels & Storage',
    productIds: ['prod-dahua-xvr-8ch', 'prod-dahua-xvr-16ch'],
    variants: [
      { productId: 'prod-dahua-xvr-8ch', modelNumber: 'DH-XVR5108HS-I3', distinguishingSpec: '8-Channel (1 SATA)' },
      { productId: 'prod-dahua-xvr-16ch', modelNumber: 'DH-XVR5216AN-I3', distinguishingSpec: '16-Channel (2 SATA)' }
    ]
  },

  // 5. Western Digital Purple Surveillance Hard Drives (WD PURZ Series)
  {
    id: 'grp-wd-purple',
    seriesName: 'WD Purple Surveillance HDDs',
    distinguishingFeatureLabel: 'Capacity',
    productIds: ['prod-wd-purple-500gb', 'prod-wd-purple-1tb', 'prod-wd-purple-2tb'],
    variants: [
      { productId: 'prod-wd-purple-500gb', modelNumber: 'WD5000PURZ', distinguishingSpec: '500GB Storage' },
      { productId: 'prod-wd-purple-1tb', modelNumber: 'WD10PURZ', distinguishingSpec: '1TB Storage' },
      { productId: 'prod-wd-purple-2tb', modelNumber: 'WD20PURZ', distinguishingSpec: '2TB Storage' }
    ]
  },

  // 6. Hikvision 2MP Audio HD Series (Bullet vs Turret Housing)
  {
    id: 'grp-hik-2mp-audio',
    seriesName: 'Hikvision 2MP Audio Series',
    distinguishingFeatureLabel: 'Housing Form Factor',
    productIds: ['prod-hik-irpf-2mp', 'prod-hik-dome-2mp'],
    variants: [
      { productId: 'prod-hik-irpf-2mp', modelNumber: 'DS-2CE16D0T-ITPFS', distinguishingSpec: 'Mini Bullet (Outdoor)' },
      { productId: 'prod-hik-dome-2mp', modelNumber: 'DS-2CE76D0T-ITPFS', distinguishingSpec: 'Turret Dome (Indoor)' }
    ]
  },

  // 7. Dahua 2MP HDCVI Series (Bullet vs Eyeball/Dome)
  {
    id: 'grp-dahua-2mp-series',
    seriesName: 'Dahua 2MP HDCVI Series',
    distinguishingFeatureLabel: 'Housing & Night Vision',
    productIds: ['prod-dahua-2mp-bullet', 'prod-dahua-dome-2mp'],
    variants: [
      { productId: 'prod-dahua-2mp-bullet', modelNumber: 'DH-HAC-HFW1200THP-I8', distinguishingSpec: 'Bullet (Weatherproof)' },
      { productId: 'prod-dahua-dome-2mp', modelNumber: 'DH-HAC-HDW1200EMP-A', distinguishingSpec: 'Eyeball Dome (Audio)' }
    ]
  },

  // 8. EZVIZ Smart Video Doorbells (DB Series)
  {
    id: 'grp-ezviz-db',
    seriesName: 'EZVIZ Smart Video Doorbells',
    distinguishingFeatureLabel: 'Power & Resolution',
    productIds: ['prod-wifi-db1c', 'prod-wifi-db2'],
    variants: [
      { productId: 'prod-wifi-db1c', modelNumber: 'CS-DB1C-A0-1E2W2FR', distinguishingSpec: '1080p Wired' },
      { productId: 'prod-wifi-db2', modelNumber: 'CS-DB2-A0-2C5WF', distinguishingSpec: '2K Battery' }
    ]
  },

  // 9. EZVIZ Smart Door Locks (DL Series)
  {
    id: 'grp-ezviz-dl',
    seriesName: 'EZVIZ Smart Door Locks',
    distinguishingFeatureLabel: 'Mechanism & Entry',
    productIds: ['prod-wifi-lock-dl01', 'prod-wifi-lock-dl05'],
    variants: [
      { productId: 'prod-wifi-lock-dl01', modelNumber: 'CS-DL01S', distinguishingSpec: 'Keyless Deadbolt' },
      { productId: 'prod-wifi-lock-dl05', modelNumber: 'CS-DL05-PRO', distinguishingSpec: 'Biometric Handle' }
    ]
  },

  // 10. ZKTeco Standalone Biometric Attendance Terminals
  {
    id: 'grp-zkteco-attendance',
    seriesName: 'ZKTeco Time Attendance',
    distinguishingFeatureLabel: 'Biometric Verification',
    productIds: ['prod-zkteco-k40', 'prod-zkteco-mb20'],
    variants: [
      { productId: 'prod-zkteco-k40', modelNumber: 'K40', distinguishingSpec: 'Fingerprint + RFID' },
      { productId: 'prod-zkteco-mb20', modelNumber: 'MB20', distinguishingSpec: 'Fingerprint + Face' }
    ]
  },

  // 11. Imou Ranger 2 Pro Series (Indoor Pan & Tilt Wi-Fi 6)
  {
    id: 'grp-imou-ranger2pro',
    seriesName: 'Imou Ranger 2 Pro Series',
    distinguishingFeatureLabel: 'Resolution',
    productIds: ['prod-wifi-imou-ranger2pro-3mp', 'prod-wifi-imou-ranger2pro-5mp'],
    variants: [
      { productId: 'prod-wifi-imou-ranger2pro-3mp', modelNumber: 'IPC-A32P-L', distinguishingSpec: '3MP (2K) Wi-Fi 6' },
      { productId: 'prod-wifi-imou-ranger2pro-5mp', modelNumber: 'IPC-A52P-L', distinguishingSpec: '5MP (3K) Wi-Fi 6' }
    ]
  }
];

/**
 * Finds the variant group for a given product ID.
 * Returns null if the product does not have any configured variants (standalone product).
 */
export function getVariantGroupForProduct(productId: string) {
  if (!productId) return null;
  const pId = productId.trim().toLowerCase();
  return CATALOG_VARIANT_GROUPS.find(g =>
    g.productIds.some(id => id.toLowerCase() === pId)
  ) || null;
}

/**
 * Returns true if a product is part of a genuine multi-model variant group.
 */
export function hasProductVariants(productId: string): boolean {
  const grp = getVariantGroupForProduct(productId);
  return Boolean(grp && grp.variants.length > 1);
}

