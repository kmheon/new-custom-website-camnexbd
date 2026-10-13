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
  normalizeCameraCount
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
  console.log('[PASS] Legacy parameter mapping: ?series=full-color -> view=full-color');

  console.log('\nALL 9 PACKAGE FILTER TESTS PASSED SUCCESSFULLY!');
}

runTests();

