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

  const legacySeries = params.get('series');
  if (legacySeries && legacySeries !== 'all' && nightViewSlug === 'all') {
    nightViewSlug = slugifyFilter(legacySeries);
  }

  return {
    systemSlug,
    cameraCount,
    nightViewSlug
  };
}

function normalizeNightViewSlug(slug) {
  const s = slugifyFilter(slug);
  if (s === 'night-vision' || s === 'black-and-white' || s === 'ir' || s === 'night-vision-ir') {
    return 'night-vision-ir';
  }
  return s;
}

function extractPackageStorage(pkg) {
  const text = `${pkg.storageDescription || ''} ${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  const match = text.match(/(\d+\s*(?:TB|GB))/i);
  return match ? match[1].replace(/\s+/g, '').toUpperCase() : null;
}

function extractPackageChannels(pkg) {
  const text = `${pkg.dvrModel || ''} ${(pkg.inclusions || []).join(' ')} ${pkg.name}`;
  const match = text.match(/(\d+)\s*[- ]*(?:Channel|Ch\b)/i);
  return match ? match[1] : null;
}

function extractPackageCameraTypes(pkg) {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  const types = [];
  if (/bullet/i.test(text)) types.push('Bullet');
  if (/dome/i.test(text) && !/speed dome/i.test(text)) types.push('Dome');
  if (/turret/i.test(text)) types.push('Turret');
  if (/ptz|speed dome/i.test(text)) types.push('PTZ');
  return types;
}

function extractPackageResolution(pkg) {
  const text = `${pkg.cameraResolution || ''} ${(pkg.inclusions || []).join(' ')} ${pkg.name}`;
  const match = text.match(/(2MP|3MP|4MP|5MP|6MP|8MP|4K)/i);
  return match ? match[1].toUpperCase() : null;
}

function extractPackageAudio(pkg) {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  return /audio|mic|two-way/i.test(text) ? 'with-audio' : 'without-audio';
}

function extractPackageBrands(pkg) {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.name} ${pkg.description || ''}`;
  const brands = [];
  if (/hikvision/i.test(text)) brands.push('Hikvision');
  if (/western digital|wd purple/i.test(text)) brands.push('Western Digital');
  if (/dahua/i.test(text)) brands.push('Dahua');
  if (/zkteco/i.test(text)) brands.push('ZKTeco');
  if (/ruijie|reyee/i.test(text)) brands.push('Ruijie');
  return brands;
}

function extractPackageInstallation(pkg) {
  const text = `${(pkg.inclusions || []).join(' ')} ${pkg.description || ''}`;
  return /setup|configuration|installation|mounting/i.test(text);
}

function sortPackages(packages, sortBy = 'recommended') {
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

function formatSystemShortLabel(slug, shortLabel) {
  if (shortLabel) {
    const trimmed = shortLabel.trim();
    if (trimmed.toUpperCase() === 'ANALOGUE' || trimmed.toLowerCase() === 'analogue') return 'Analogue';
    if (trimmed.toUpperCase() === 'IP') return 'IP';
    if (trimmed.toUpperCase() === 'WI-FI' || trimmed.toUpperCase() === 'WIFI') return 'Wi-Fi';
    if (trimmed.toUpperCase() === 'ALL') return 'All';
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }
    return trimmed;
  }
  const clean = (slug || '').toLowerCase();
  if (clean === 'ip') return 'IP';
  if (clean === 'analogue' || clean === 'analog') return 'Analogue';
  if (clean === 'wireless' || clean === 'wifi' || clean === 'wi-fi') return 'Wi-Fi';
  if (clean === 'all') return 'All';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function availableOptions(packages, filters = { systemSlug: 'all', cameraCount: 'All', nightViewSlug: 'all' }, options) {
  const rawList = (options && options.systemTypes) || [];
  const systemTypesList = [...rawList].sort((a, b) => {
    const orderMap = { ip: 1, analogue: 2, wireless: 3 };
    const oa = a.order != null ? a.order : (a.display_order != null ? a.display_order : (orderMap[a.slug] || 99));
    const ob = b.order != null ? b.order : (b.display_order != null ? b.display_order : (orderMap[b.slug] || 99));
    return oa - ob;
  });
  const seriesList = (options && options.seriesList) || [];

  const systemTypes = [];
  systemTypes.push({
    id: 'st-all',
    slug: 'all',
    name: 'All',
    shortLabel: 'All',
    description: 'Camera sets for homes, shops and offices',
    count: packages.length,
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
        shortLabel: formatSystemShortLabel(st.slug, st.shortLabel),
        description: st.description,
        icon: st.icon,
        count,
        enabled: true
      });
    }
  });

  const allCounts = getAvailableCameraCounts(packages, 'all', systemTypesList);
  const badgeCounts = calculateBadgeCounts(packages, filters, allCounts, seriesList, systemTypesList);

  const cameraCounts = [
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

  const nightViews = [
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

  const prices = packages.map(p => p.basePrice).filter(p => typeof p === 'number' && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000000;
  const hasAskForPrice = packages.some(p => p.basePrice == null || p.basePrice <= 0 || p.isQuoteOnly);
  const priceRange = { min: minPrice, max: maxPrice, hasAskForPrice };

  const rawStorages = new Set();
  packages.forEach(p => {
    const s = extractPackageStorage(p);
    if (s) rawStorages.add(s);
  });
  let storageSizes;
  if (rawStorages.size >= 2) {
    const sorted = Array.from(rawStorages).sort((a, b) => {
      const getBytes = (val) => {
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

  const rawChannels = new Set();
  packages.forEach(p => {
    const ch = extractPackageChannels(p);
    if (ch) rawChannels.add(ch);
  });
  let recorderChannels;
  if (rawChannels.size >= 2) {
    const sorted = Array.from(rawChannels).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    recorderChannels = sorted.map(ch => {
      const matches = filterPackages(packages, { ...filters, channels: ch }, options).length;
      return { value: ch, label: `${ch}-Channel`, count: matches, disabled: matches === 0 };
    });
  }

  const rawCamTypes = new Set();
  packages.forEach(p => {
    extractPackageCameraTypes(p).forEach(t => rawCamTypes.add(t));
  });
  let cameraTypes;
  if (rawCamTypes.size >= 2) {
    cameraTypes = Array.from(rawCamTypes).map(t => {
      const slug = slugifyFilter(t);
      const matches = filterPackages(packages, { ...filters, cameraType: slug }, options).length;
      return { value: slug, label: t, count: matches, disabled: matches === 0 };
    });
  }

  const rawResolutions = new Set();
  packages.forEach(p => {
    const r = extractPackageResolution(p);
    if (r) rawResolutions.add(r);
  });
  let resolutions;
  if (rawResolutions.size >= 2) {
    resolutions = Array.from(rawResolutions).map(r => {
      const slug = slugifyFilter(r);
      const matches = filterPackages(packages, { ...filters, resolution: slug }, options).length;
      return { value: slug, label: r, count: matches, disabled: matches === 0 };
    });
  }

  const rawAudio = new Set();
  packages.forEach(p => rawAudio.add(extractPackageAudio(p)));
  let audioOptions;
  if (rawAudio.size >= 2) {
    audioOptions = [
      { value: 'with-audio', label: 'With audio', count: filterPackages(packages, { ...filters, audio: 'with-audio' }, options).length, disabled: false },
      { value: 'without-audio', label: 'Without audio', count: filterPackages(packages, { ...filters, audio: 'without-audio' }, options).length, disabled: false }
    ];
  }

  const rawBrands = new Set();
  packages.forEach(p => {
    extractPackageBrands(p).forEach(b => rawBrands.add(b));
  });
  let brands;
  if (rawBrands.size >= 2) {
    brands = Array.from(rawBrands).map(b => {
      const slug = slugifyFilter(b);
      const matches = filterPackages(packages, { ...filters, brand: slug }, options).length;
      return { value: slug, label: b, count: matches, disabled: matches === 0 };
    });
  }

  const rawTags = new Set();
  packages.forEach(p => {
    if (p.badge) rawTags.add(p.badge);
  });
  let tags;
  if (rawTags.size >= 2) {
    tags = Array.from(rawTags).map(t => {
      const slug = slugifyFilter(t);
      const matches = filterPackages(packages, { ...filters, tag: slug }, options).length;
      return { value: slug, label: t, count: matches, disabled: matches === 0 };
    });
  }

  const hasInst = packages.some(p => extractPackageInstallation(p));
  let installationOptions;
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
  parseFilterQuery,
  normalizeNightViewSlug,
  extractPackageStorage,
  extractPackageChannels,
  extractPackageCameraTypes,
  extractPackageResolution,
  extractPackageAudio,
  extractPackageBrands,
  extractPackageInstallation,
  sortPackages,
  availableOptions,
  formatSystemShortLabel
};

