// tests/helpers/packageFiltersHelper.js
// CommonJS implementation mirroring src/utils/packageFilters.ts for pure unit testing

function normalizeCameraCount(val) {
  if (!val || val === 'All' || val === 'all' || val === 'All Cameras' || val === 'All Channels') {
    return 'All';
  }
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 'All' : String(num);
}

function slugifyFilter(val) {
  if (!val) return 'all';
  const clean = val.toLowerCase().trim();
  if (clean === 'all' || clean === 'all types' || clean === 'all views' || clean === 'all systems') {
    return 'all';
  }
  return clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getPackageSystemSlug(pkg, systemTypes) {
  if (pkg.systemTypeSlug) return pkg.systemTypeSlug.toLowerCase();
  if (pkg.systemTypeId) {
    if (pkg.systemTypeId.includes('wireless') || pkg.systemTypeId.includes('wifi')) return 'wireless';
    if (pkg.systemTypeId.includes('ip') || pkg.systemTypeId.includes('ptz') || pkg.systemTypeId.includes('ent')) return 'ip';
    if (pkg.systemTypeId.includes('analogue') || pkg.systemTypeId.includes('analog') || pkg.systemTypeId.includes('ir') || pkg.systemTypeId.includes('hybrid') || pkg.systemTypeId.includes('color')) return 'analogue';
    if (systemTypes) {
      const match = systemTypes.find(st => st.id === pkg.systemTypeId);
      if (match && match.slug) return match.slug.toLowerCase();
    }
  }
  const text = `${pkg.name} ${pkg.description || ''} ${(pkg.inclusions || []).join(' ')}`.toLowerCase();
  if (text.includes('wi-fi') || text.includes('wireless') || text.includes('cable-free')) return 'wireless';
  if (text.includes('nvr') || text.includes('poe') || text.includes('network video')) return 'ip';
  return 'analogue';
}

function getPackageNightViewSlug(pkg, seriesList) {
  if (pkg.nightViewId) {
    const matched = seriesList && seriesList.find(s => s.id === pkg.nightViewId);
    if (matched && matched.slug) return matched.slug.toLowerCase();
  }
  if (pkg.seriesId) {
    const matched = seriesList && seriesList.find(s => s.id === pkg.seriesId);
    if (matched && matched.slug) return matched.slug.toLowerCase();
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

function packageMatchesFilter(pkg, filters, options) {
  const { systemSlug, cameraCount, nightViewSlug } = filters;

  if (systemSlug && systemSlug !== 'all') {
    const pkgSys = getPackageSystemSlug(pkg, options && options.systemTypes);
    if (pkgSys !== systemSlug.toLowerCase()) {
      return false;
    }
  }

  const normCount = normalizeCameraCount(cameraCount);
  if (normCount !== 'All') {
    const targetNum = parseInt(normCount, 10);
    const hasCount = pkg.cameraCount === targetNum ||
      (Array.isArray(pkg.cameraCountsSupported) && pkg.cameraCountsSupported.includes(targetNum));
    if (!hasCount) {
      return false;
    }
  }

  if (nightViewSlug && nightViewSlug !== 'all') {
    const pkgView = getPackageNightViewSlug(pkg, options && options.seriesList);
    const targetSlug = slugifyFilter(nightViewSlug);
    if (pkgView !== targetSlug) {
      return false;
    }
  }

  return true;
}

function filterPackages(packages, filters, options) {
  if (!packages || !Array.isArray(packages)) return [];
  return packages.filter(pkg => packageMatchesFilter(pkg, filters, options));
}

function getAvailableCameraCounts(packages, systemSlug = 'all', systemTypes) {
  const counts = new Set();
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

function calculateBadgeCounts(packages, filters, allCounts, allSeries, systemTypes) {
  const cameraCounts = {};
  const nightViews = {};

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

function resolveDependentFilterSelection(newSystemSlug, currentCount, currentNightView, packages, options) {
  let resolvedCount = normalizeCameraCount(currentCount);
  let resolvedView = slugifyFilter(currentNightView);

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

function getFilterConflictState(filters, packages, options) {
  const matches = filterPackages(packages, filters, options);
  if (matches.length > 0) {
    return { hasConflict: false };
  }

  const { systemSlug, cameraCount, nightViewSlug } = filters;
  const sysObj = options && options.systemTypes && options.systemTypes.find(s => s.slug === systemSlug);
  const seriesObj = options && options.seriesList && options.seriesList.find(s => s.slug === nightViewSlug);

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

function buildFilterQuery(filters) {
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

function parseFilterQuery(input, options) {
  const params = typeof input === 'string'
    ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input)
    : input;

  let systemSlug = params.get('system') ? slugifyFilter(params.get('system')) : 'all';
  let cameraCount = normalizeCameraCount(params.get('cameras'));
  let nightViewSlug = params.get('view') ? slugifyFilter(params.get('view')) : 'all';

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

module.exports = {
  normalizeCameraCount,
  slugifyFilter,
  getPackageSystemSlug,
  getPackageNightViewSlug,
  packageMatchesFilter,
  filterPackages,
  getAvailableCameraCounts,
  calculateBadgeCounts,
  resolveDependentFilterSelection,
  getFilterConflictState,
  buildFilterQuery,
  parseFilterQuery
};

