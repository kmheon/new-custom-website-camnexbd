import { SecurityPackage, PackageSystemType, PackageSeries } from '../types';

export interface FilterState {
  systemSlug: string; // 'all' | 'ip' | 'analogue' | 'wireless'
  cameraCount: string; // 'All' | '2' | '4' | '8' | '16' | '32' | '64'
  nightViewSlug: string; // 'all' | 'night-vision-ir' | 'hybrid-light' | 'full-color' | 'enterprise-ptz' | 'black-and-white'
  // Extended filters for full variant:
  minPrice?: number;
  maxPrice?: number;
  includeAskForPrice?: boolean;
  storage?: string; // 'all' | '128gb' | '500gb' | '1tb' ...
  channels?: string; // 'all' | '4' | '8' | '16' | '32'
  cameraType?: string; // 'all' | 'bullet' | 'dome' | 'turret' | 'ptz'
  resolution?: string; // 'all' | '2mp' | '3mp' | '4mp' | '4k'
  audio?: string; // 'all' | 'with-audio' | 'without-audio'
  brand?: string; // 'all' | 'hikvision' | 'western-digital' ...
  tag?: string; // 'all' | 'most-popular' | 'affordable' ...
  installation?: string; // 'all' | 'available' | 'none'
  sortBy?: string; // 'recommended' | 'price-asc' | 'price-desc' | 'cameras-asc' | 'newest'
  page?: number;
}

export interface BadgeCounts {
  cameraCounts: Record<string, number>; // e.g. { 'All': 13, '2': 2, '4': 5, ... }
  nightViews: Record<string, number>; // e.g. { 'all': 5, 'night-vision-ir': 2, ... }
}

export interface AvailableOptions {
  systemTypes: Array<{
    id?: string;
    slug: string;
    name: string;
    shortLabel: string;
    description: string;
    icon?: string;
    count: number;
    enabled: boolean;
  }>;
  cameraCounts: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  nightViews: Array<{ slug: string; label: string; count: number; disabled: boolean }>;
  priceRange?: { min: number; max: number; hasAskForPrice: boolean };
  storageSizes?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  recorderChannels?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  cameraTypes?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  resolutions?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  audioOptions?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  brands?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  tags?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
  installationOptions?: Array<{ value: string; label: string; count: number; disabled: boolean }>;
}

export interface FilterConflictState {
  hasConflict: boolean;
  message?: string;
  systemName?: string;
  seriesName?: string;
  camerasText?: string;
}

/**
 * Normalizes a camera count value into a clean number or 'All'
 */
export function normalizeCameraCount(val: string | number | undefined | null): string {
  if (!val || val === 'All' || val === 'all' || val === 'All Cameras' || val === 'All Channels') {
    return 'All';
  }
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 'All' : String(num);
}

/**
 * Normalizes a slug or label to lowercase hyphenated string
 */
export function slugifyFilter(val: string | undefined | null): string {
  if (!val) return 'all';
  const clean = val.toLowerCase().trim();
  if (clean === 'all' || clean === 'all types' || clean === 'all views' || clean === 'all systems') {
    return 'all';
  }
  return clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Resolves package system type slug from package object or systemTypes array
 */
export function getPackageSystemSlug(pkg: SecurityPackage, systemTypes?: PackageSystemType[]): string {
  if (pkg.systemTypeSlug) return pkg.systemTypeSlug.toLowerCase();
  if (pkg.systemTypeId) {
    if (pkg.systemTypeId.includes('wireless') || pkg.systemTypeId.includes('wifi')) return 'wireless';
    if (pkg.systemTypeId.includes('ip') || pkg.systemTypeId.includes('ptz') || pkg.systemTypeId.includes('ent')) return 'ip';
    if (pkg.systemTypeId.includes('analogue') || pkg.systemTypeId.includes('analog') || pkg.systemTypeId.includes('ir') || pkg.systemTypeId.includes('hybrid') || pkg.systemTypeId.includes('color')) return 'analogue';
    if (systemTypes) {
      const match = systemTypes.find(st => st.id === pkg.systemTypeId);
      if (match?.slug) return match.slug.toLowerCase();
    }
  }
  // Fallback detection from inclusions or name
  const text = `${pkg.name} ${pkg.description || ''} ${(pkg.inclusions || []).join(' ')}`.toLowerCase();
  if (text.includes('wi-fi') || text.includes('wireless') || text.includes('cable-free')) return 'wireless';
  if (text.includes('nvr') || text.includes('poe') || text.includes('network video')) return 'ip';
  return 'analogue';
}

/**
 * Resolves package night view / series slug from package object or seriesList
 */
export function getPackageNightViewSlug(pkg: SecurityPackage, seriesList?: PackageSeries[]): string {
  if (pkg.nightViewId) {
    const matched = seriesList?.find(s => s.id === pkg.nightViewId);
    if (matched?.slug) return matched.slug.toLowerCase();
  }
  if (pkg.seriesId) {
    const matched = seriesList?.find(s => s.id === pkg.seriesId);
    if (matched?.slug) return matched.slug.toLowerCase();
  }
  if (pkg.seriesName) {
    return slugifyFilter(pkg.seriesName);
  }
  if (pkg.nightViewName) {
    return slugifyFilter(pkg.nightViewName);
  }
  const text = `${pkg.name} ${pkg.description || ''}`.toLowerCase();
  if (text.includes('hybrid')) return 'hybrid-light';
  if (text.includes('color')) return 'full-color';
  if (text.includes('enterprise') || text.includes('ptz')) return 'enterprise-ptz';
  return 'night-vision-ir';
}

/**
 * Normalizes night view slugs to handle synonyms/aliases cleanly
 */
export function normalizeNightViewSlug(slug: string | undefined | null): string {
  const s = slugifyFilter(slug);
  if (s === 'night-vision' || s === 'black-and-white' || s === 'ir' || s === 'night-vision-ir') {
    return 'night-vision-ir';
  }
  return s;
}

/**
 * Extracts storage spec from package inclusions or description (e.g. '128GB', '1TB', '2TB')
 */
export function extractPackageStorage(pkg: SecurityPackage): string | null {
  const text = `${pkg.storageDescription || ''} ${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  const match = text.match(/(\d+\s*(?:TB|GB))/i);
  return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
}

/**
 * Extracts recorder channels count from package inclusions or name (e.g. '4', '8', '16', '32')
 */
export function extractPackageChannels(pkg: SecurityPackage): string | null {
  const text = `${pkg.dvrModel || ''} ${(pkg.inclusions || []).join(' ')} ${pkg.name}`;
  const match = text.match(/(\d+)\s*[- ]*(?:Channel|Ch\b)/i);
  return match ? match[1] : null;
}

/**
 * Extracts camera form factors mentioned in package inclusions (Bullet, Dome, Turret, PTZ)
 */
export function extractPackageCameraTypes(pkg: SecurityPackage): string[] {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  const types: string[] = [];
  if (/bullet/i.test(text)) types.push('Bullet');
  if (/dome/i.test(text) && !/speed dome/i.test(text)) types.push('Dome');
  if (/turret/i.test(text)) types.push('Turret');
  if (/ptz|speed dome/i.test(text)) types.push('PTZ');
  return types;
}

/**
 * Extracts camera resolution (e.g. '2MP', '3MP', '4MP', '4K')
 */
export function extractPackageResolution(pkg: SecurityPackage): string | null {
  const text = `${pkg.cameraResolution || ''} ${(pkg.inclusions || []).join(' ')} ${pkg.name}`;
  const match = text.match(/(2MP|3MP|4MP|5MP|6MP|8MP|4K)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Checks audio support in package
 */
export function extractPackageAudio(pkg: SecurityPackage): 'with-audio' | 'without-audio' {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  return /audio|mic|two-way/i.test(text) ? 'with-audio' : 'without-audio';
}

/**
 * Extracts brands from package inclusions/name
 */
export function extractPackageBrands(pkg: SecurityPackage): string[] {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  const brands: string[] = [];
  if (/hikvision/i.test(text)) brands.push('Hikvision');
  if (/western digital|wd purple/i.test(text)) brands.push('Western Digital');
  if (/dahua/i.test(text)) brands.push('Dahua');
  if (/zkteco/i.test(text)) brands.push('ZKTeco');
  if (/ruijie|reyee/i.test(text)) brands.push('Ruijie');
  return brands;
}

/**
 * Checks whether installation / configuration setup is included or available
 */
export function extractPackageInstallation(pkg: SecurityPackage): boolean {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.description || ''}`;
  return /setup|configuration|installation|mounting/i.test(text);
}

/**
 * Pure filter function checking if a single package matches current filter state
 */
export function packageMatchesFilter(
  pkg: SecurityPackage,
  filters: FilterState,
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): boolean {
  const { systemSlug, cameraCount, nightViewSlug } = filters;

  // 1. System type filter
  if (systemSlug && systemSlug !== 'all') {
    const pkgSys = getPackageSystemSlug(pkg, options?.systemTypes);
    if (pkgSys !== systemSlug.toLowerCase()) {
      return false;
    }
  }

  // 2. Camera count filter
  const normCount = normalizeCameraCount(cameraCount);
  if (normCount !== 'All') {
    const targetNum = parseInt(normCount, 10);
    const hasCount = pkg.cameraCount === targetNum ||
      (Array.isArray(pkg.cameraCountsSupported) && pkg.cameraCountsSupported.includes(targetNum));
    if (!hasCount) {
      return false;
    }
  }

  // 3. Night view filter
  if (nightViewSlug && nightViewSlug !== 'all') {
    const pkgView = normalizeNightViewSlug(getPackageNightViewSlug(pkg, options?.seriesList));
    const targetSlug = normalizeNightViewSlug(nightViewSlug);
    if (pkgView !== targetSlug) {
      return false;
    }
  }

  // 4. Price range filter
  if (filters.minPrice != null || filters.maxPrice != null) {
    const price = pkg.basePrice;
    if (price == null || price <= 0 || pkg.isQuoteOnly) {
      if (!filters.includeAskForPrice) return false;
    } else {
      if (filters.minPrice != null && price < filters.minPrice) return false;
      if (filters.maxPrice != null && price > filters.maxPrice) return false;
    }
  }

  // 5. Storage size filter
  if (filters.storage && filters.storage !== 'all') {
    const pkgStorage = extractPackageStorage(pkg);
    if (!pkgStorage || pkgStorage.toLowerCase() !== filters.storage.toLowerCase()) {
      return false;
    }
  }

  // 6. Recorder channels filter
  if (filters.channels && filters.channels !== 'all') {
    const pkgCh = extractPackageChannels(pkg);
    if (!pkgCh || pkgCh !== filters.channels) {
      return false;
    }
  }

  // 7. Camera type filter
  if (filters.cameraType && filters.cameraType !== 'all') {
    const camTypes = extractPackageCameraTypes(pkg);
    const target = slugifyFilter(filters.cameraType);
    if (!camTypes.some(t => slugifyFilter(t) === target)) {
      return false;
    }
  }

  // 8. Resolution filter
  if (filters.resolution && filters.resolution !== 'all') {
    const res = extractPackageResolution(pkg);
    if (!res || slugifyFilter(res) !== slugifyFilter(filters.resolution)) {
      return false;
    }
  }

  // 9. Audio filter
  if (filters.audio && filters.audio !== 'all') {
    const audio = extractPackageAudio(pkg);
    if (audio !== filters.audio) {
      return false;
    }
  }

  // 10. Brand filter
  if (filters.brand && filters.brand !== 'all') {
    const brands = extractPackageBrands(pkg);
    const target = slugifyFilter(filters.brand);
    if (!brands.some(b => slugifyFilter(b) === target)) {
      return false;
    }
  }

  // 11. Tag filter
  if (filters.tag && filters.tag !== 'all') {
    const badgeSlug = slugifyFilter(pkg.badge);
    if (badgeSlug !== slugifyFilter(filters.tag)) {
      return false;
    }
  }

  // 12. Installation filter
  if (filters.installation && filters.installation !== 'all') {
    const hasInst = extractPackageInstallation(pkg);
    if (filters.installation === 'available' && !hasInst) return false;
    if (filters.installation === 'none' && hasInst) return false;
  }

  return true;
}

/**
 * Sorts packages by selected criteria
 */
export function sortPackages(packages: SecurityPackage[], sortBy: string = 'recommended'): SecurityPackage[] {
  const list = [...packages];
  switch (sortBy) {
    case 'price-asc':
      return list.sort((a, b) => {
        const pa = (a.basePrice != null && a.basePrice > 0 && !a.isQuoteOnly) ? a.basePrice : Infinity;
        const pb = (b.basePrice != null && b.basePrice > 0 && !b.isQuoteOnly) ? b.basePrice : Infinity;
        return pa - pb;
      });
    case 'price-desc':
      return list.sort((a, b) => {
        const pa = (a.basePrice != null && a.basePrice > 0 && !a.isQuoteOnly) ? a.basePrice : -Infinity;
        const pb = (b.basePrice != null && b.basePrice > 0 && !b.isQuoteOnly) ? b.basePrice : -Infinity;
        return pb - pa;
      });
    case 'cameras-asc':
      return list.sort((a, b) => (a.cameraCount || 0) - (b.cameraCount || 0));
    case 'newest':
      return list.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    case 'recommended':
    default:
      return list.sort((a, b) => {
        if (a.featuredOnHomepage && !b.featuredOnHomepage) return -1;
        if (!a.featuredOnHomepage && b.featuredOnHomepage) return 1;
        if (a.badge && !b.badge) return -1;
        if (!a.badge && b.badge) return 1;
        return 0;
      });
  }
}

/**
 * Pure function to filter packages list with given filters
 */
export function filterPackages(
  packages: SecurityPackage[],
  filters: FilterState,
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): SecurityPackage[] {
  if (!packages || !Array.isArray(packages)) return [];
  const filtered = packages.filter(pkg => packageMatchesFilter(pkg, filters, options));
  if (filters.sortBy) {
    return sortPackages(filtered, filters.sortBy);
  }
  return filtered;
}

/**
 * Derives unique camera count numbers from packages matching the given system type
 */
export function getAvailableCameraCounts(
  packages: SecurityPackage[],
  systemSlug: string = 'all',
  systemTypes?: PackageSystemType[]
): number[] {
  const counts = new Set<number>();
  packages.forEach(pkg => {
    if (systemSlug !== 'all') {
      const pkgSys = getPackageSystemSlug(pkg, systemTypes);
      if (pkgSys !== systemSlug.toLowerCase()) return;
    }
    if (pkg.cameraCount) counts.add(pkg.cameraCount);
    if (Array.isArray(pkg.cameraCountsSupported)) {
      pkg.cameraCountsSupported.forEach(c => counts.add(c));
    }
  });
  return Array.from(counts).sort((a, b) => a - b);
}

/**
 * Calculates badge counts for camera counts and night view options
 * dependent on current selections
 */
export function calculateBadgeCounts(
  packages: SecurityPackage[],
  filters: FilterState,
  allCounts: number[],
  allSeries: PackageSeries[],
  systemTypes?: PackageSystemType[]
): BadgeCounts {
  const cameraCounts: Record<string, number> = {};
  const nightViews: Record<string, number> = {};

  const currentSys = filters.systemSlug || 'all';
  cameraCounts['All'] = packages.filter(p => currentSys === 'all' || getPackageSystemSlug(p, systemTypes) === currentSys.toLowerCase()).length;

  for (const count of allCounts) {
    const cStr = String(count);
    cameraCounts[cStr] = filterPackages(packages, {
      ...filters,
      systemSlug: currentSys,
      cameraCount: cStr,
      nightViewSlug: 'all'
    }, { systemTypes }).length;
  }

  const currentCount = filters.cameraCount || 'All';
  nightViews['all'] = filterPackages(packages, {
    ...filters,
    systemSlug: currentSys,
    cameraCount: currentCount,
    nightViewSlug: 'all'
  }, { systemTypes }).length;

  for (const s of allSeries) {
    nightViews[s.slug] = filterPackages(packages, {
      ...filters,
      systemSlug: currentSys,
      cameraCount: currentCount,
      nightViewSlug: s.slug
    }, { systemTypes, seriesList: allSeries }).length;
  }

  return { cameraCounts, nightViews };
}

/**
 * Pure function to derive all available options and counts directly from package dataset
 */
export function availableOptions(
  packages: SecurityPackage[],
  filters: FilterState = { systemSlug: 'all', cameraCount: 'All', nightViewSlug: 'all' },
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): AvailableOptions {
  const systemTypesList = options?.systemTypes || [];
  const seriesList = options?.seriesList || [];

  // 1. System types (only enabled that have packages)
  const systemTypes: AvailableOptions['systemTypes'] = [];
  const allCount = packages.length;
  systemTypes.push({
    id: 'st-all',
    slug: 'all',
    name: 'All',
    shortLabel: 'All',
    description: 'Camera sets for homes, shops and offices',
    count: allCount,
    enabled: true
  });

  systemTypesList.forEach(st => {
    if (st.enabled === false) return;
    const count = packages.filter(p => getPackageSystemSlug(p, systemTypesList) === st.slug.toLowerCase()).length;
    if (count > 0) {
      systemTypes.push({
        id: st.id,
        slug: st.slug.toLowerCase(),
        name: st.name,
        shortLabel: st.shortLabel || (st.slug === 'wireless' ? 'Wi-Fi' : st.slug.toUpperCase()),
        description: st.description,
        icon: st.icon,
        count,
        enabled: true
      });
    }
  });

  // 2. Camera counts (dependent on current system selection)
  const allCounts = getAvailableCameraCounts(packages, 'all', systemTypesList);
  const badgeCounts = calculateBadgeCounts(packages, filters, allCounts, seriesList, systemTypesList);

  const cameraCounts: AvailableOptions['cameraCounts'] = [
    { value: 'All', label: 'All', count: badgeCounts.cameraCounts['All'] || packages.length, disabled: false }
  ];
  allCounts.forEach(num => {
    const cStr = String(num);
    const count = badgeCounts.cameraCounts[cStr] || 0;
    cameraCounts.push({
      value: cStr,
      label: `${num} cameras`,
      count,
      disabled: count === 0
    });
  });

  // 3. Night views (clean series names, no brand jargon)
  const nightViews: AvailableOptions['nightViews'] = [
    { value: 'all', slug: 'all', label: 'All', count: badgeCounts.nightViews['all'] || packages.length, disabled: false }
  ];
  seriesList.forEach(series => {
    const count = badgeCounts.nightViews[series.slug] || 0;
    let label = series.name;
    if (series.slug === 'night-vision-ir' || series.slug === 'black-and-white') label = 'Black and white';
    else if (series.slug === 'hybrid-light') label = 'Hybrid light';
    else if (series.slug === 'full-color') label = 'Full color';
    else if (series.slug === 'enterprise-ptz') label = 'Enterprise & PTZ';

    nightViews.push({
      slug: series.slug,
      label,
      count,
      disabled: count === 0
    });
  });

  // 4. Price range
  const prices = packages.map(p => p.basePrice).filter((p): p is number => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000000;
  const hasAskForPrice = packages.some(p => p.basePrice == null || p.basePrice <= 0 || p.isQuoteOnly);
  const priceRange = { min: minPrice, max: maxPrice, hasAskForPrice };

  // 5. Storage sizes (only if >= 2 distinct values)
  const rawStorages = new Set<string>();
  packages.forEach(p => {
    const s = extractPackageStorage(p);
    if (s) rawStorages.add(s);
  });
  let storageSizes: AvailableOptions['storageSizes'] | undefined;
  if (rawStorages.size >= 2) {
    const sorted = Array.from(rawStorages).sort((a, b) => {
      const getBytes = (val: string) => {
        const num = parseFloat(val);
        return val.includes('TB') ? num * 1024 : num;
      };
      return getBytes(a) - getBytes(b);
    });
    storageSizes = sorted.map(st => {
      const matches = filterPackages(packages, { ...filters, storage: st }, options).length;
      return { value: st.toLowerCase(), label: st, count: matches, disabled: matches === 0 };
    });
  }

  // 6. Recorder channels (only if >= 2 distinct values)
  const rawChannels = new Set<string>();
  packages.forEach(p => {
    const ch = extractPackageChannels(p);
    if (ch) rawChannels.add(ch);
  });
  let recorderChannels: AvailableOptions['recorderChannels'] | undefined;
  if (rawChannels.size >= 2) {
    const sorted = Array.from(rawChannels).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    recorderChannels = sorted.map(ch => {
      const matches = filterPackages(packages, { ...filters, channels: ch }, options).length;
      return { value: ch, label: `${ch}-Channel`, count: matches, disabled: matches === 0 };
    });
  }

  // 7. Camera types (only if >= 2 distinct values)
  const rawCamTypes = new Set<string>();
  packages.forEach(p => {
    extractPackageCameraTypes(p).forEach(t => rawCamTypes.add(t));
  });
  let cameraTypes: AvailableOptions['cameraTypes'] | undefined;
  if (rawCamTypes.size >= 2) {
    cameraTypes = Array.from(rawCamTypes).map(t => {
      const slug = slugifyFilter(t);
      const matches = filterPackages(packages, { ...filters, cameraType: slug }, options).length;
      return { value: slug, label: t, count: matches, disabled: matches === 0 };
    });
  }

  // 8. Resolutions (only if >= 2 distinct values)
  const rawResolutions = new Set<string>();
  packages.forEach(p => {
    const r = extractPackageResolution(p);
    if (r) rawResolutions.add(r);
  });
  let resolutions: AvailableOptions['resolutions'] | undefined;
  if (rawResolutions.size >= 2) {
    resolutions = Array.from(rawResolutions).map(r => {
      const slug = slugifyFilter(r);
      const matches = filterPackages(packages, { ...filters, resolution: slug }, options).length;
      return { value: slug, label: r, count: matches, disabled: matches === 0 };
    });
  }

  // 9. Audio (only if >= 2 distinct values)
  const rawAudio = new Set<string>();
  packages.forEach(p => rawAudio.add(extractPackageAudio(p)));
  let audioOptions: AvailableOptions['audioOptions'] | undefined;
  if (rawAudio.size >= 2) {
    audioOptions = [
      { value: 'with-audio', label: 'With audio', count: filterPackages(packages, { ...filters, audio: 'with-audio' }, options).length, disabled: false },
      { value: 'without-audio', label: 'Without audio', count: filterPackages(packages, { ...filters, audio: 'without-audio' }, options).length, disabled: false }
    ];
  }

  // 10. Brands (only if >= 2 distinct values)
  const rawBrands = new Set<string>();
  packages.forEach(p => {
    extractPackageBrands(p).forEach(b => rawBrands.add(b));
  });
  let brands: AvailableOptions['brands'] | undefined;
  if (rawBrands.size >= 2) {
    brands = Array.from(rawBrands).map(b => {
      const slug = slugifyFilter(b);
      const matches = filterPackages(packages, { ...filters, brand: slug }, options).length;
      return { value: slug, label: b, count: matches, disabled: matches === 0 };
    });
  }

  // 11. Tags (only if >= 2 distinct values)
  const rawTags = new Set<string>();
  packages.forEach(p => {
    if (p.badge) rawTags.add(p.badge);
  });
  let tags: AvailableOptions['tags'] | undefined;
  if (rawTags.size >= 2) {
    tags = Array.from(rawTags).map(t => {
      const slug = slugifyFilter(t);
      const matches = filterPackages(packages, { ...filters, tag: slug }, options).length;
      return { value: slug, label: t, count: matches, disabled: matches === 0 };
    });
  }

  // 12. Installation
  const hasInst = packages.some(p => extractPackageInstallation(p));
  let installationOptions: AvailableOptions['installationOptions'] | undefined;
  if (hasInst) {
    installationOptions = [
      { value: 'available', label: 'Installation available', count: filterPackages(packages, { ...filters, installation: 'available' }, options).length, disabled: false }
    ];
  }

  return {
    systemTypes,
    cameraCounts,
    nightViews,
    priceRange,
    storageSizes,
    recorderChannels,
    cameraTypes,
    resolutions,
    audioOptions,
    brands,
    tags,
    installationOptions
  };
}

/**
 * Dependent filter resolution:
 * If newly selected system type causes the active camera count or night view
 * to have 0 matching packages, automatically resets that chip to 'All'
 */
export function resolveDependentFilterSelection(
  newSystemSlug: string,
  currentCount: string,
  currentNightView: string,
  packages: SecurityPackage[],
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): FilterState {
  let resolvedCount = normalizeCameraCount(currentCount);
  let resolvedView = normalizeNightViewSlug(currentNightView);

  if (resolvedCount !== 'All') {
    const countMatches = filterPackages(packages, {
      systemSlug: newSystemSlug,
      cameraCount: resolvedCount,
      nightViewSlug: 'all'
    }, options);
    if (countMatches.length === 0) {
      resolvedCount = 'All';
    }
  }

  if (resolvedView !== 'all') {
    const viewMatches = filterPackages(packages, {
      systemSlug: newSystemSlug,
      cameraCount: resolvedCount,
      nightViewSlug: resolvedView
    }, options);
    if (viewMatches.length === 0) {
      resolvedView = 'all';
    }
  }

  return {
    systemSlug: newSystemSlug,
    cameraCount: resolvedCount,
    nightViewSlug: resolvedView
  };
}

/**
 * Builds helpful empty state information when a narrowed combination has 0 matches
 */
export function getFilterConflictState(
  filters: FilterState,
  packages: SecurityPackage[],
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): FilterConflictState {
  const matches = filterPackages(packages, filters, options);
  if (matches.length > 0) {
    return { hasConflict: false };
  }

  const { systemSlug, cameraCount, nightViewSlug } = filters;
  const sysObj = options?.systemTypes?.find(s => s.slug === systemSlug);
  const seriesObj = options?.seriesList?.find(s => s.slug === nightViewSlug || normalizeNightViewSlug(s.slug) === normalizeNightViewSlug(nightViewSlug));

  const systemName = sysObj ? sysObj.name.split('/')[0].trim() : (systemSlug !== 'all' ? systemSlug.toUpperCase() : '');
  const seriesName = seriesObj ? seriesObj.name : (nightViewSlug !== 'all' ? nightViewSlug : '');
  const camerasText = cameraCount !== 'All' ? `${cameraCount}-camera` : '';

  const parts = [camerasText, seriesName, systemName].filter(Boolean);
  const title = parts.length > 0 ? parts.join(' ') : 'selected criteria';

  return {
    hasConflict: true,
    message: `No ${title} packages found`,
    systemName,
    seriesName,
    camerasText
  };
}

/**
 * Builds query string from filter state, omitting 'all' values cleanly
 */
export function buildFilterQuery(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.systemSlug && filters.systemSlug !== 'all') {
    params.set('system', filters.systemSlug);
  }
  const normCount = normalizeCameraCount(filters.cameraCount);
  if (normCount !== 'All') {
    params.set('cameras', normCount);
  }
  const normView = slugifyFilter(filters.nightViewSlug);
  if (normView !== 'all') {
    params.set('view', normView);
  }
  if (filters.minPrice != null && filters.minPrice > 0) {
    params.set('min_price', String(filters.minPrice));
  }
  if (filters.maxPrice != null && filters.maxPrice < 10000000) {
    params.set('max_price', String(filters.maxPrice));
  }
  if (filters.includeAskForPrice) {
    params.set('ask_price', '1');
  }
  if (filters.storage && filters.storage !== 'all') {
    params.set('storage', filters.storage);
  }
  if (filters.channels && filters.channels !== 'all') {
    params.set('channels', filters.channels);
  }
  if (filters.cameraType && filters.cameraType !== 'all') {
    params.set('camera_type', filters.cameraType);
  }
  if (filters.resolution && filters.resolution !== 'all') {
    params.set('resolution', filters.resolution);
  }
  if (filters.audio && filters.audio !== 'all') {
    params.set('audio', filters.audio);
  }
  if (filters.brand && filters.brand !== 'all') {
    params.set('brand', filters.brand);
  }
  if (filters.tag && filters.tag !== 'all') {
    params.set('tag', filters.tag);
  }
  if (filters.installation && filters.installation !== 'all') {
    params.set('installation', filters.installation);
  }
  if (filters.sortBy && filters.sortBy !== 'recommended') {
    params.set('sort', filters.sortBy);
  }
  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * Parses query params (URLSearchParams or raw query string), mapping legacy ?type=...
 * to the new system/view schema.
 */
export function parseFilterQuery(
  input: string | URLSearchParams,
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): FilterState {
  const params = typeof input === 'string'
    ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
    : input;

  let systemSlug = params.get('system') ? slugifyFilter(params.get('system')!) : 'all';
  let cameraCount = normalizeCameraCount(params.get('cameras'));
  let nightViewSlug = params.get('view') ? slugifyFilter(params.get('view')!) : 'all';

  // Legacy query param mapping: ?type=... or ?series=...
  const legacyType = params.get('type');
  if (legacyType && legacyType !== 'All' && legacyType !== 'All Types') {
    const legacySlug = slugifyFilter(legacyType);
    if (legacySlug === 'wireless' || legacySlug === 'wifi') {
      if (systemSlug === 'all') systemSlug = 'wireless';
    } else if (legacySlug === 'ip') {
      if (systemSlug === 'all') systemSlug = 'ip';
    } else if (legacySlug === 'analogue' || legacySlug === 'analog') {
      if (systemSlug === 'all') systemSlug = 'analogue';
    } else {
      if (nightViewSlug === 'all') {
        nightViewSlug = normalizeNightViewSlug(legacySlug);
      }
    }
  }

  const legacySeries = params.get('series');
  if (legacySeries && legacySeries !== 'all' && nightViewSlug === 'all') {
    nightViewSlug = normalizeNightViewSlug(slugifyFilter(legacySeries));
  }

  const minPrice = params.get('min_price') ? parseInt(params.get('min_price')!, 10) : undefined;
  const maxPrice = params.get('max_price') ? parseInt(params.get('max_price')!, 10) : undefined;
  const includeAskForPrice = params.get('ask_price') === '1';
  const storage = params.get('storage') ? slugifyFilter(params.get('storage')!) : undefined;
  const channels = params.get('channels') || undefined;
  const cameraType = params.get('camera_type') ? slugifyFilter(params.get('camera_type')!) : undefined;
  const resolution = params.get('resolution') ? slugifyFilter(params.get('resolution')!) : undefined;
  const audio = params.get('audio') ? slugifyFilter(params.get('audio')!) : undefined;
  const brand = params.get('brand') ? slugifyFilter(params.get('brand')!) : undefined;
  const tag = params.get('tag') ? slugifyFilter(params.get('tag')!) : undefined;
  const installation = params.get('installation') ? slugifyFilter(params.get('installation')!) : undefined;
  const sortBy = params.get('sort') || 'recommended';
  const page = params.get('page') ? parseInt(params.get('page')!, 10) : 1;

  return {
    systemSlug,
    cameraCount,
    nightViewSlug,
    minPrice,
    maxPrice,
    includeAskForPrice,
    storage,
    channels,
    cameraType,
    resolution,
    audio,
    brand,
    tag,
    installation,
    sortBy,
    page
  };
}

