import { SecurityPackage, PackageSystemType, PackageSeries } from '../types';

export interface FilterState {
  systemSlug: string; // 'all' | 'ip' | 'analogue' | 'wireless'
  cameraCount: string; // 'All' | '2' | '4' | '8' | '16' | '32' | '64'
  nightViewSlug: string; // 'all' | 'night-vision-ir' | 'hybrid-light' | 'full-color' | 'enterprise-ptz'
}

export interface BadgeCounts {
  cameraCounts: Record<string, number>; // e.g. { 'All': 13, '2': 2, '4': 5, ... }
  nightViews: Record<string, number>; // e.g. { 'all': 5, 'night-vision-ir': 2, ... }
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
    const pkgView = getPackageNightViewSlug(pkg, options?.seriesList);
    const targetSlug = slugifyFilter(nightViewSlug);
    if (pkgView !== targetSlug) {
      return false;
    }
  }

  return true;
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
  return packages.filter(pkg => packageMatchesFilter(pkg, filters, options));
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
 * dependent on current selections:
 * - Camera count badges show match counts under the current system type
 * - Night view badges show match counts under current system type + camera count
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

  // Camera counts under current system type
  const currentSys = filters.systemSlug || 'all';
  cameraCounts['All'] = packages.filter(p => currentSys === 'all' || getPackageSystemSlug(p, systemTypes) === currentSys.toLowerCase()).length;

  for (const count of allCounts) {
    const cStr = String(count);
    cameraCounts[cStr] = filterPackages(packages, {
      systemSlug: currentSys,
      cameraCount: cStr,
      nightViewSlug: 'all'
    }, { systemTypes }).length;
  }

  // Night views under current system type + current camera count
  const currentCount = filters.cameraCount || 'All';
  nightViews['all'] = filterPackages(packages, {
    systemSlug: currentSys,
    cameraCount: currentCount,
    nightViewSlug: 'all'
  }, { systemTypes }).length;

  for (const s of allSeries) {
    nightViews[s.slug] = filterPackages(packages, {
      systemSlug: currentSys,
      cameraCount: currentCount,
      nightViewSlug: s.slug
    }, { systemTypes, seriesList: allSeries }).length;
  }

  return { cameraCounts, nightViews };
}

/**
 * Dependent filter resolution:
 * If newly selected system type causes the active camera count or night view
 * to have 0 matching packages, automatically resets that chip to 'All'
 * so users never see an empty grid when valid packages exist for that system type.
 */
export function resolveDependentFilterSelection(
  newSystemSlug: string,
  currentCount: string,
  currentNightView: string,
  packages: SecurityPackage[],
  options?: { systemTypes?: PackageSystemType[]; seriesList?: PackageSeries[] }
): FilterState {
  let resolvedCount = normalizeCameraCount(currentCount);
  let resolvedView = slugifyFilter(currentNightView);

  // Check if currentCount has matches under new system type
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

  // Check if currentNightView has matches under new system type & resolved count
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
 * e.g. "No 4-camera Full-Color IP packages found; view all IP packages or view 4-camera packages across all types"
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
  const seriesObj = options?.seriesList?.find(s => s.slug === nightViewSlug);

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

  // Legacy query param mapping: ?type=...
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
      // Series/view slug mapping
      if (nightViewSlug === 'all') {
        nightViewSlug = legacySlug;
      }
    }
  }

  return {
    systemSlug,
    cameraCount,
    nightViewSlug
  };
}

