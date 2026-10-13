// tests/test_package_filters.js
// Unit tests for package filter pure functions, dependent option resolution,
// badge count calculations, and legacy query param mapping.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Read seed data directly from serverSeeds.json
const seedsPath = path.join(__dirname, '../serverSeeds.json');
const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
const packages = seeds.INITIAL_PACKAGES || [];
const systemTypes = seeds.INITIAL_PACKAGE_SYSTEM_TYPES || [];
const seriesList = seeds.INITIAL_PACKAGE_SERIES || [];

console.log('Testing Package Pure Filter Functions...');
console.log(`Loaded ${packages.length} packages, ${systemTypes.length} system types, ${seriesList.length} series.`);

// Import compiled or bundle or write minimal module test
// Because packageFilters is TypeScript, let's verify logic directly using equivalent pure definitions or compile check
const {
  filterPackages,
  getAvailableCameraCounts,
  calculateBadgeCounts,
  resolveDependentFilterSelection,
  getFilterConflictState,
  buildFilterQuery,
  parseFilterQuery,
  slugifyFilter,
  normalizeCameraCount,
  availableOptions,
  generatePackageSummary
} = require('./helpers/packageFiltersHelper');

function runTests() {
  // Test 1: All packages returned when filters are 'all'
  const allFiltered = filterPackages(packages, { systemSlug: 'all', cameraCount: 'All', nightViewSlug: 'all' }, { systemTypes, seriesList });
  assert.strictEqual(allFiltered.length, packages.length, 'All packages should be returned when filter is all');
  console.log(`[PASS] Filter 'all': returned ${allFiltered.length}/${packages.length} packages`);

  // Test 2: System type filtering
  const analoguePkgs = filterPackages(packages, { systemSlug: 'analogue', cameraCount: 'All', nightViewSlug: 'all' }, { systemTypes, seriesList });
  const ipPkgs = filterPackages(packages, { systemSlug: 'ip', cameraCount: 'All', nightViewSlug: 'all' }, { systemTypes, seriesList });
  const wirelessPkgs = filterPackages(packages, { systemSlug: 'wireless', cameraCount: 'All', nightViewSlug: 'all' }, { systemTypes, seriesList });

  assert.ok(analoguePkgs.length >= 6, 'Analogue should have >= 6 packages');
  assert.ok(ipPkgs.length >= 3, 'IP should have >= 3 packages');
  assert.ok(wirelessPkgs.length >= 2, 'Wireless should have >= 2 packages');
  assert.strictEqual(analoguePkgs.length + ipPkgs.length + wirelessPkgs.length, packages.length, 'Total packages across system types must sum to total');
  console.log(`[PASS] System types filter: Analogue=${analoguePkgs.length}, IP=${ipPkgs.length}, Wireless=${wirelessPkgs.length}`);

  // Test 3: Camera count filtering (No-leak check)
  const count8Pkgs = filterPackages(packages, { systemSlug: 'all', cameraCount: '8', nightViewSlug: 'all' }, { systemTypes, seriesList });
  assert.ok(count8Pkgs.length >= 1, 'Should find packages with 8 cameras');
  for (const pkg of count8Pkgs) {
    const valid = pkg.cameraCount === 8 || (Array.isArray(pkg.cameraCountsSupported) && pkg.cameraCountsSupported.includes(8));
    assert.ok(valid, `Package ${pkg.id} must support 8 cameras`);
  }
  console.log(`[PASS] Camera count 8: found ${count8Pkgs.length} packages with zero leaks`);

  // Test 4: Combined AND filtering (System + Count + Night view)
  const anal4Color = filterPackages(packages, { systemSlug: 'analogue', cameraCount: '4', nightViewSlug: 'full-color' }, { systemTypes, seriesList });
  assert.ok(anal4Color.length >= 1, 'Should find 4-camera Full-Color analogue package');
  assert.strictEqual(anal4Color[0].id, 'pkg-color-4', 'Expected pkg-color-4');
  console.log(`[PASS] AND filter (Analogue + 4 cameras + Full-Color): matched ${anal4Color[0].name}`);

  // Test 5: Dependent Option Resolution: Auto-reset when selecting system type with zero matches
  // If user currently has 32 cameras selected, and switches to 'wireless' (which only has 2 & 4 cams)
  const resolved = resolveDependentFilterSelection('wireless', '32', 'all', packages, { systemTypes, seriesList });
  assert.strictEqual(resolved.cameraCount, 'All', 'Camera count 32 should auto-reset to All under wireless');
  assert.strictEqual(resolved.systemSlug, 'wireless');
  console.log('[PASS] Dependent filter resolution: 32 cameras auto-resets to "All" when switching to wireless');

  // If user currently has 'full-color' selected, and switches to 'ip' (IP only has Enterprise & PTZ)
  const resolvedView = resolveDependentFilterSelection('ip', '4', 'full-color', packages, { systemTypes, seriesList });
  assert.strictEqual(resolvedView.nightViewSlug, 'all', 'Full-color should auto-reset to all under IP');
  console.log('[PASS] Dependent filter resolution: Full-color auto-resets to "all" when switching to IP');

  // Test 6: Helpful Conflict State message
  const conflict = getFilterConflictState({ systemSlug: 'ip', cameraCount: '4', nightViewSlug: 'full-color' }, packages, { systemTypes, seriesList });
  assert.strictEqual(conflict.hasConflict, true, 'Zero match combination should flag conflict');
  assert.ok(conflict.message.includes('4-camera'), 'Conflict message should mention 4-camera');
  assert.ok(conflict.message.includes('Full-Color'), 'Conflict message should mention Full-Color');
  assert.ok(conflict.message.includes('IP'), 'Conflict message should mention IP');
  console.log(`[PASS] Conflict state message: "${conflict.message}"`);

  // Test 7: Badge Count Calculations
  const counts = [2, 4, 8, 16, 32, 64];
  const badges = calculateBadgeCounts(packages, { systemSlug: 'analogue', cameraCount: '4', nightViewSlug: 'all' }, counts, seriesList, systemTypes);
  assert.strictEqual(typeof badges.cameraCounts['4'], 'number');
  assert.strictEqual(typeof badges.nightViews['full-color'], 'number');
  assert.ok(badges.cameraCounts['4'] >= 1, 'Analogue should have 4-camera packages');
  console.log(`[PASS] Badge counts: Analogue 4-cam=${badges.cameraCounts['4']}, Full-Color 4-cam=${badges.nightViews['full-color']}`);

  // Test 8: URL Query String Building & Legacy Param Mapping
  const builtQuery = buildFilterQuery({ systemSlug: 'ip', cameraCount: '16', nightViewSlug: 'enterprise-ptz' });
  assert.strictEqual(builtQuery, '?system=ip&cameras=16&view=enterprise-ptz');

  const parsed = parseFilterQuery(builtQuery, { systemTypes, seriesList });
  assert.deepStrictEqual(parsed, { systemSlug: 'ip', cameraCount: '16', nightViewSlug: 'enterprise-ptz' });
  console.log(`[PASS] URL query sync: built "${builtQuery}" and parsed back identically`);

  // Legacy param mapping: ?type=Wireless
  const legacyWireless = parseFilterQuery('?type=Wireless', { systemTypes, seriesList });
  assert.strictEqual(legacyWireless.systemSlug, 'wireless', 'Legacy ?type=Wireless should map to system=wireless');

  // Legacy param mapping: ?type=Full-Color
  const legacyColor = parseFilterQuery('?type=Full-Color', { systemTypes, seriesList });
  assert.strictEqual(legacyColor.nightViewSlug, 'full-color', 'Legacy ?type=Full-Color should map to view=full-color');
  // Legacy param mapping: ?series=full-color
  const legacySeries = parseFilterQuery('?series=full-color', { systemTypes, seriesList });
  assert.strictEqual(legacySeries.nightViewSlug, 'full-color', 'Legacy ?series=full-color should map to view=full-color');
  // Test 9: System-type segment order and case: All, IP, Analogue, Wi-Fi; no segment label uppercase
  const opts = availableOptions(packages, { systemSlug: 'all', cameraCount: 'All', nightViewSlug: 'all' }, { systemTypes, seriesList });
  const segLabels = opts.systemTypes.map(st => st.shortLabel);
  assert.deepStrictEqual(segLabels, ['All', 'IP', 'Analogue', 'Wi-Fi'], 'Segments must be in order: All, IP, Analogue, Wi-Fi');
  
  for (const label of segLabels) {
    if (label.length > 2) {
      assert.notStrictEqual(label, label.toUpperCase(), `Segment label "${label}" must NOT be all-uppercase`);
    }
  }
  assert.strictEqual(segLabels[2], 'Analogue', 'Analogue label must be "Analogue", not "ANALOGUE"');
  console.log('[PASS] Segment labels order & case: All, IP, Analogue, Wi-Fi (no uppercase words)');

  // Test 10: Wireless packages summary and inclusions contain neither "cable" nor "DVR" nor "NVR"
  const wirelessList = packages.filter(p => (
    p.systemTypeSlug === 'wireless' ||
    (p.systemTypeId && p.systemTypeId.includes('wireless')) ||
    (p.name && p.name.includes('Wireless'))
  ));
  assert.ok(wirelessList.length >= 2, 'Should have at least 2 wireless packages');

  for (const wp of wirelessList) {
    const summary = generatePackageSummary(wp);
    assert.strictEqual(
      /cable|dvr|nvr/i.test(summary),
      false,
      `Wireless package ${wp.id} summary "${summary}" must not contain cable, DVR, or NVR`
    );

    const inclusions = wp.inclusions || [];
    for (const inc of inclusions) {
      assert.strictEqual(
        /cable|dvr|nvr/i.test(inc),
        false,
        `Wireless package ${wp.id} inclusion "${inc}" must not contain cable, DVR, or NVR`
      );
    }
  }
  console.log(`[PASS] Wireless packages: verified ${wirelessList.length} wireless packages contain neither "cable" nor "DVR" nor "NVR" in summary or components`);

  // Test 11: Package pricing verification:
  // - For every package: displayed price == sum of component line totals (or null/"Ask for price" if any component has no price).
  // - Two packages with different components never share a price unless their components and quantities are identical.
  const pricedPackages = [];
  for (const pkg of packages) {
    const components = pkg.components || [];
    let calculatedSum = 0;
    let hasUnpricedComponent = false;

    for (const comp of components) {
      if (comp.unitPrice == null) {
        hasUnpricedComponent = true;
      } else {
        const expectedLineTotal = comp.qty * comp.unitPrice;
        assert.strictEqual(
          comp.lineTotal,
          expectedLineTotal,
          `Package ${pkg.id} component "${comp.name}" lineTotal ${comp.lineTotal} != qty ${comp.qty} * unitPrice ${comp.unitPrice}`
        );
        calculatedSum += expectedLineTotal;
      }
    }

    if (hasUnpricedComponent || pkg.isQuoteOnly || pkg.basePrice == null) {
      assert.strictEqual(
        pkg.basePrice,
        null,
        `Package ${pkg.id} has unpriced components and must have null basePrice ("Ask for price")`
      );
    } else {
      assert.strictEqual(
        pkg.basePrice,
        calculatedSum,
        `Package ${pkg.id} basePrice ${pkg.basePrice} != sum of component line totals ${calculatedSum}`
      );
      pricedPackages.push({
        id: pkg.id,
        name: pkg.name,
        price: pkg.basePrice,
        componentsKey: JSON.stringify(components.map(c => ({ name: c.name, qty: c.qty, unitPrice: c.unitPrice })))
      });
    }
  }

  // Ensure two packages with different components never share a price unless components and quantities are identical
  for (let i = 0; i < pricedPackages.length; i++) {
    for (let j = i + 1; j < pricedPackages.length; j++) {
      const p1 = pricedPackages[i];
      const p2 = pricedPackages[j];
      if (p1.price === p2.price) {
        assert.strictEqual(
          p1.componentsKey,
          p2.componentsKey,
          `Packages ${p1.id} and ${p2.id} share the price ৳${p1.price} but have different components`
        );
      }
    }
  }

  // Specifically verify 2-camera Wi-Fi vs 2-camera Analogue do not share a price
  const wifi2 = packages.find(p => p.id === 'pkg-wifi-2');
  const analogue2 = packages.find(p => p.id === 'pkg-ir-2');
  assert.ok(wifi2 && analogue2, 'Both pkg-wifi-2 and pkg-ir-2 must exist');
  assert.notStrictEqual(wifi2.basePrice, analogue2.basePrice, 'pkg-wifi-2 and pkg-ir-2 must not share a price');
  console.log(`[PASS] Package pricing: verified all ${packages.length} packages (displayed price == sum of components, 2-cam Wi-Fi ৳${wifi2.basePrice} != 2-cam Analogue ৳${analogue2.basePrice})`);

  console.log('\nALL PACKAGE FILTER TESTS PASSED SUCCESSFULLY!');
}

runTests();

