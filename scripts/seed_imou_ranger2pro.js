const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'camnex.db');
const db = new Database(dbPath);

const brandImou = {
  id: 'brand-imou',
  name: 'Imou',
  slug: 'imou',
  logo: '/images/brands/dahua.svg',
  description: 'Smart IoT indoor and outdoor Wi-Fi security cameras by Dahua.',
  website: 'https://www.imou.com',
  featured: true
};

const ranger2Pro3MP = {
  id: 'prod-wifi-imou-ranger2pro-3mp',
  name: 'Imou Ranger 2 Pro 3MP Indoor Pan & Tilt Wi-Fi Camera',
  shortName: 'Imou Ranger 2 Pro 3MP',
  modelNumber: 'IPC-A32P-L',
  sku: 'IMOU-RANGER2PRO-3MP',
  brandId: 'brand-imou',
  brand: 'Imou',
  categoryId: 'cat-wifi',
  category: 'Wi-Fi / Smart Devices',
  subcategoryId: 'subcat-wifi-cameras',
  subcategory: 'Indoor Pan & Tilt Cameras',
  subcategorySlug: 'wifi-cameras',
  productType: 'physical',
  status: 'active',
  websiteVisible: true,
  posAvailable: true,
  isPopular: true,
  isFeatured: true,
  primaryImage: '/images/products/hikvision-dome.svg',
  images: [
    '/images/products/hikvision-dome.svg'
  ],
  shortDescription: '3MP (2304 × 1296) 2K indoor smart pan & tilt Wi-Fi 6 camera featuring 355° pan, -5° to 80° tilt, two-way audio, and H.265 video compression.',
  description: 'The Imou Ranger 2 Pro 3MP (IPC-A32P-L) delivers crystal-clear 2K indoor surveillance with 355° horizontal rotation and -5° to 80° vertical tilt. Powered by next-gen Dual-Band Wi-Fi 6 connectivity, it provides ultra-smooth video streaming, AI human detection, smart tracking, two-way audio, abnormal sound detection, and physical privacy shutter mode.',
  keyFeatures: [
    '3MP 2K Resolution (2304 × 1296) with clear detail',
    '355° Pan & -5° to 80° Tilt for complete 360° indoor coverage',
    'Dual-Band Wi-Fi 6 (2.4GHz & 5GHz) for ultra-fast, stable streaming',
    'Two-Way Audio with built-in microphone and high-fidelity speaker',
    'Advanced AI Human Detection & Smart Motion Tracking',
    'Physical Privacy Shield Mode to hide lens when at home',
    'Abnormal Sound Alarm (baby crying, glass breaking alerts)',
    'H.265 / H.264 Video Compression for optimized bandwidth and storage'
  ],
  specifications: {
    resolution: '3MP (2304 × 1296)',
    pan_range: '0° to 355° Pan',
    tilt_range: '-5° to 80° Tilt',
    two_way_audio: 'Built-in Mic & Speaker (Two-Way Audio)',
    wifi_connectivity: 'Dual-Band Wi-Fi 6 (2.4GHz / 5GHz)',
    video_compression: 'H.265 / H.264',
    night_vision: 'Infrared Night Vision up to 10m (33ft)',
    lens: '3.6mm Fixed Lens',
    storage: 'MicroSD Slot (up to 256GB), Imou Cloud, NVR',
    smart_detection: 'AI Human Detection, Pet Detection, Motion Tracking',
    power_source: 'DC 5V 1.5A USB Type-C',
    app_support: 'Imou Life App (iOS / Android)'
  },
  pricing: {
    regularPrice: null,
    salePrice: null,
    currency: 'BDT'
  },
  inventory: {
    available: 0,
    status: 'request_quote'
  },
  unit: 'Piece',
  warrantyMonths: 12,
  warrantyType: 'official',
  warrantyText: '1-Year Official Manufacturer Warranty'
};

const ranger2Pro5MP = {
  id: 'prod-wifi-imou-ranger2pro-5mp',
  name: 'Imou Ranger 2 Pro 5MP Indoor Pan & Tilt Wi-Fi Camera',
  shortName: 'Imou Ranger 2 Pro 5MP',
  modelNumber: 'IPC-A52P-L',
  sku: 'IMOU-RANGER2PRO-5MP',
  brandId: 'brand-imou',
  brand: 'Imou',
  categoryId: 'cat-wifi',
  category: 'Wi-Fi / Smart Devices',
  subcategoryId: 'subcat-wifi-cameras',
  subcategory: 'Indoor Pan & Tilt Cameras',
  subcategorySlug: 'wifi-cameras',
  productType: 'physical',
  status: 'active',
  websiteVisible: true,
  posAvailable: true,
  isPopular: true,
  isFeatured: true,
  primaryImage: '/images/products/hikvision-dome.svg',
  images: [
    '/images/products/hikvision-dome.svg'
  ],
  shortDescription: '5MP (2880 × 1620) 3K indoor smart pan & tilt Wi-Fi 6 camera featuring 355° pan, -5° to 80° tilt, two-way audio, and H.265 video compression.',
  description: 'The Imou Ranger 2 Pro 5MP (IPC-A52P-L) provides ultra-high 3K resolution surveillance with complete 360° coverage via 355° pan and -5° to 80° tilt. Equipped with Dual-Band Wi-Fi 6 technology, AI-driven human and pet detection, auto-motion tracking, two-way audio communication, abnormal sound alarm, and physical privacy shutter.',
  keyFeatures: [
    '5MP 3K Resolution (2880 × 1620) with ultra-fine clarity',
    '355° Pan & -5° to 80° Tilt for complete 360° indoor coverage',
    'Dual-Band Wi-Fi 6 (2.4GHz & 5GHz) for lag-free high-bitrate streaming',
    'Two-Way Audio with built-in microphone and high-fidelity speaker',
    'Advanced AI Human Detection & Smart Motion Tracking',
    'Physical Privacy Shield Mode to hide lens when at home',
    'Abnormal Sound Alarm (baby crying, glass breaking alerts)',
    'H.265 / H.264 Video Compression for optimized bandwidth and storage'
  ],
  specifications: {
    resolution: '5MP (2880 × 1620)',
    pan_range: '0° to 355° Pan',
    tilt_range: '-5° to 80° Tilt',
    two_way_audio: 'Built-in Mic & Speaker (Two-Way Audio)',
    wifi_connectivity: 'Dual-Band Wi-Fi 6 (2.4GHz / 5GHz)',
    video_compression: 'H.265 / H.264',
    night_vision: 'Infrared Night Vision up to 10m (33ft)',
    lens: '3.6mm Fixed Lens',
    storage: 'MicroSD Slot (up to 256GB), Imou Cloud, NVR',
    smart_detection: 'AI Human Detection, Pet Detection, Motion Tracking',
    power_source: 'DC 5V 1.5A USB Type-C',
    app_support: 'Imou Life App (iOS / Android)'
  },
  pricing: {
    regularPrice: null,
    salePrice: null,
    currency: 'BDT'
  },
  inventory: {
    available: 0,
    status: 'request_quote'
  },
  unit: 'Piece',
  warrantyMonths: 12,
  warrantyType: 'official',
  warrantyText: '1-Year Official Manufacturer Warranty'
};

// 1. Insert brand into database
const insertBrand = db.prepare(`
  INSERT OR REPLACE INTO brands (id, name, slug, logo, description, website, featured, data_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
insertBrand.run(
  brandImou.id,
  brandImou.name,
  brandImou.slug,
  brandImou.logo,
  brandImou.description,
  brandImou.website,
  brandImou.featured ? 1 : 0,
  JSON.stringify(brandImou)
);
console.log('Brand inserted/updated:', brandImou.name);

// 2. Insert products into database
const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (
    id, name, model_number, sku, brand_id, brand_name, category_id, category_slug,
    status, price, compare_price, stock_quantity, is_featured, is_popular, is_demo, data_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of [ranger2Pro3MP, ranger2Pro5MP]) {
  insertProduct.run(
    p.id,
    p.name,
    p.modelNumber,
    p.sku,
    p.brandId,
    p.brand,
    p.categoryId,
    'wifi-smart-devices',
    p.status,
    p.pricing?.regularPrice || null,
    p.pricing?.salePrice || null,
    p.inventory?.available || 0,
    p.isFeatured ? 1 : 0,
    p.isPopular ? 1 : 0,
    0,
    JSON.stringify(p)
  );
  console.log(`Product inserted/updated: ${p.id} (${p.modelNumber})`);
}

// 3. Update serverSeeds.json
const seedsPath = path.join(__dirname, '..', 'serverSeeds.json');
if (fs.existsSync(seedsPath)) {
  const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

  if (!seeds.INITIAL_BRANDS) seeds.INITIAL_BRANDS = [];
  if (!seeds.INITIAL_BRANDS.some(b => b.id === brandImou.id)) {
    seeds.INITIAL_BRANDS.push(brandImou);
  }

  if (!seeds.INITIAL_PRODUCTS) seeds.INITIAL_PRODUCTS = [];
  for (const p of [ranger2Pro3MP, ranger2Pro5MP]) {
    const idx = seeds.INITIAL_PRODUCTS.findIndex(prod => prod.id === p.id);
    if (idx >= 0) {
      seeds.INITIAL_PRODUCTS[idx] = p;
    } else {
      seeds.INITIAL_PRODUCTS.push(p);
    }
  }

  fs.writeFileSync(seedsPath, JSON.stringify(seeds, null, 2), 'utf8');
  console.log('serverSeeds.json updated successfully.');
}

console.log('Done.');

