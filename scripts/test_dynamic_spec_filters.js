// scripts/test_dynamic_spec_filters.js
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';
const BASE_URL = 'http://127.0.0.1:3000';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('\n=== CamneX Bangladesh: Dynamic Specification Filters Test Suite ===\n');

  // --- 1. Backend Facets & Data-Driven Logic Tests ---
  console.log('--- 1. Testing Backend Facet Generation for Representative Categories ---');

  // 1a. CCTV Cameras
  const cctv = await fetch(`${BASE_URL}/api/products/spec-filters/cctv-cameras`).then(r => r.json());
  assert(cctv.totalProducts === 8, `CCTV totalProducts is 8 (got ${cctv.totalProducts})`);
  const cctvKeys = cctv.facets.map(f => f.key);
  assert(cctvKeys.includes('resolution'), 'CCTV includes resolution facet');
  assert(cctvKeys.includes('form_factor'), 'CCTV includes form_factor facet');
  assert(cctvKeys.includes('night_vision'), 'CCTV includes night_vision facet');
  assert(cctvKeys.includes('lens'), 'CCTV includes lens facet');
  assert(cctvKeys.includes('ip_rating'), 'CCTV includes ip_rating facet');
  assert(cctvKeys.includes('audio_support'), 'CCTV includes audio_support facet');
  assert(!cctvKeys.includes('ports'), 'CCTV strictly excludes ports facet');
  assert(!cctvKeys.includes('channels'), 'CCTV strictly excludes channels facet');
  assert(!cctvKeys.includes('wifi_standard'), 'CCTV strictly excludes wifi_standard facet');

  const cctvForm = cctv.facets.find(f => f.key === 'form_factor');
  const bulletOpt = cctvForm?.options.find(o => o.value === 'Bullet');
  assert(bulletOpt && bulletOpt.count === 4, `Bullet camera count is 4 (got ${bulletOpt?.count})`);

  // 1b. Network Switches
  const switches = await fetch(`${BASE_URL}/api/products/spec-filters/network-switches`).then(r => r.json());
  assert(switches.totalProducts === 6, `Switches totalProducts is 6 (got ${switches.totalProducts})`);
  const switchKeys = switches.facets.map(f => f.key);
  assert(switchKeys.includes('ports'), 'Switches includes ports facet');
  assert(switchKeys.includes('poe_support'), 'Switches includes poe_support facet');
  assert(switchKeys.includes('poe_budget'), 'Switches includes poe_budget facet');
  assert(switchKeys.includes('managed'), 'Switches includes managed facet');
  assert(!switchKeys.includes('lens'), 'Switches strictly excludes lens facet');
  assert(!switchKeys.includes('channels'), 'Switches strictly excludes channels facet');

  // 1c. Access Points & Wi-Fi
  const ap = await fetch(`${BASE_URL}/api/products/spec-filters/access-points-wifi`).then(r => r.json());
  assert(ap.totalProducts === 4, `AP totalProducts is 4 (got ${ap.totalProducts})`);
  const apKeys = ap.facets.map(f => f.key);
  assert(apKeys.includes('wifi_standard'), 'AP includes wifi_standard facet');
  assert(apKeys.includes('max_speed'), 'AP includes max_speed facet');
  assert(apKeys.includes('poe_support'), 'AP includes poe_support facet');
  assert(!apKeys.includes('coverage') && !apKeys.includes('range'), 'AP strictly excludes undocumented range/coverage facet');

  // 1d. DVR & Recorders
  const dvr = await fetch(`${BASE_URL}/api/products/spec-filters/dvr`).then(r => r.json());
  assert(dvr.totalProducts === 7, `DVR totalProducts is 7 (got ${dvr.totalProducts})`);
  const dvrKeys = dvr.facets.map(f => f.key);
  assert(dvrKeys.includes('channels'), 'DVR includes channels facet');
  assert(dvrKeys.includes('compression'), 'DVR includes compression facet');
  assert(dvrKeys.includes('max_resolution'), 'DVR includes max_resolution facet');
  assert(dvrKeys.includes('hdd_slots'), 'DVR includes hdd_slots facet');
  assert(!dvrKeys.includes('audio_channels'), 'DVR strictly excludes undocumented audio_channels facet');

  // --- 2. Testing API Multi-Select AND/OR Filtering Logic ---
  console.log('\n--- 2. Testing API Multi-Select AND/OR Filtering Logic ---');

  // Multi-select OR logic within single attribute
  const orRes = await fetch(`${BASE_URL}/api/products?categorySlug=cctv-cameras&specFilters=${encodeURIComponent(JSON.stringify({ form_factor: ['Bullet', 'Dome'] }))}`).then(r => r.json());
  assert(orRes.total === 6, `Bullet OR Dome returns 6 products (got ${orRes.total})`);

  // Multi-attribute AND logic
  const andRes = await fetch(`${BASE_URL}/api/products?categorySlug=cctv-cameras&specFilters=${encodeURIComponent(JSON.stringify({ form_factor: ['Bullet'], audio_support: 'true' }))}`).then(r => r.json());
  assert(andRes.total === 2, `Bullet AND Built-in Audio returns 2 products (got ${andRes.total})`);

  // Missing spec rejection test:
  // Dahua 2MP bullet has audio_support: false. Filter for audio_support: true must exclude it!
  const audioBulletNames = andRes.items.map(p => p.name);
  assert(!audioBulletNames.some(n => n.includes('Dahua 2MP HDCVI Weatherproof IR Bullet')), 'Audio filter correctly excludes products with audio_support: false');

  // --- 3. Browser UI Verification via Edge CDP ---
  console.log('\n--- 3. Testing Interactive UI in Browser via Edge CDP ---');

  const edgeProc = cp.spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9961',
    '--user-data-dir=C:\\Windows\\Temp\\edge_verify_filters',
    'about:blank'
  ]);
  await sleep(2000);

  try {
    const list = await fetch('http://127.0.0.1:9961/json').then(r => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (m, p = {}) => new Promise((resolve, reject) => {
      const cur = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === cur) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(new Error(d.error.message));
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result?.value;
    }

    async function waitForElement(selector, timeoutMs = 12000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
          if (found) return true;
        } catch (_) {}
        await sleep(250);
      }
      return false;
    }

    async function saveScreenshot(filename) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const targetPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(targetPath, Buffer.from(data, 'base64'));
      console.log(`    [SCREENSHOT] Saved: ${filename}`);
    }

    // Set Desktop viewport (1440x900)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    // Test Desktop CCTV Cameras Page
    console.log('\n- Testing Desktop CCTV Cameras Page (/category/cctv-cameras):');
    await send('Page.navigate', { url: `${BASE_URL}/category/cctv-cameras` });
    await sleep(2500);
    await waitForElement('[data-testid="dynamic-spec-filters"]', 12000);

    const cctvDynamicFiltersRendered = await evaluate(`Boolean(document.querySelector('[data-testid="dynamic-spec-filters"]'))`);
    assert(cctvDynamicFiltersRendered, 'Dynamic specification filters rendered in sidebar');

    const bulletFacetExists = await evaluate(`Boolean(document.querySelector('[data-testid="facet-form_factor-Bullet"]'))`);
    assert(bulletFacetExists, 'Form factor: Bullet checkbox option rendered');

    // Click Bullet checkbox
    await evaluate(`document.querySelector('[data-testid="facet-form_factor-Bullet"]').click()`);
    await sleep(800);

    const activeChipsBarExists = await evaluate(`Boolean(document.querySelector('[data-testid="active-filter-chips-bar"]'))`);
    assert(activeChipsBarExists, 'Active filter chips bar appeared');

    const bulletChipExists = await evaluate(`Boolean(document.querySelector('[data-testid="active-chip-form_factor-Bullet"]'))`);
    assert(bulletChipExists, 'Bullet filter chip rendered with remove button');

    const filteredProductCount = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(filteredProductCount === 4, `Filtered to 4 bullet cameras on page (found ${filteredProductCount})`);
    await saveScreenshot('dynamic_filter_cctv_bullet_desktop_1440x900.png');

    // Multi-select: Also select Dome checkbox
    await evaluate(`document.querySelector('[data-testid="facet-form_factor-Dome"]').click()`);
    await sleep(800);
    const multiProductCount = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(multiProductCount === 6, `Filtered to 6 cameras for Bullet OR Dome (found ${multiProductCount})`);
    await saveScreenshot('dynamic_filter_cctv_multi_select_desktop_1440x900.png');

    // Remove Bullet chip by clicking its X button
    await evaluate(`document.querySelector('[data-testid="active-chip-form_factor-Bullet"] button').click()`);
    await sleep(800);
    const domeOnlyCount = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(domeOnlyCount === 2, `Removing Bullet chip leaves 2 Dome cameras (found ${domeOnlyCount})`);

    // Click Clear All Chips
    await evaluate(`document.querySelector('[data-testid="clear-all-chips-btn"]').click()`);
    await sleep(800);
    const resetCount = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(resetCount === 8, `Clicking Clear All resets to all 8 CCTV cameras (found ${resetCount})`);

    // Switch Category to Network Switches
    console.log('\n- Testing Category Switch to Network Switches:');
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('aside button')).find(b => b.textContent.includes('Network Switches'));
      if (btn) btn.click();
    `);
    await sleep(1000);
    await waitForElement('[data-testid="facet-ports-24 Ports"]', 10000);

    const switchFacetRendered = await evaluate(`Boolean(document.querySelector('[data-testid="facet-ports-24 Ports"]'))`);
    assert(switchFacetRendered, 'Port Count: 24 Ports facet rendered on Network Switches category');

    const cctvFilterAbsence = await evaluate(`!document.querySelector('[data-testid="facet-form_factor-Bullet"]')`);
    assert(cctvFilterAbsence, 'CCTV form factor filter is strictly absent from Network Switches category');

    // Filter switches by PoE Supported
    await evaluate(`document.querySelector('[data-testid="facet-poe_support-true"]').click()`);
    await sleep(800);
    const poeSwitchesCount = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(poeSwitchesCount === 4, `Filtered to 4 PoE switches (found ${poeSwitchesCount})`);
    await saveScreenshot('dynamic_filter_switches_poe_desktop_1440x900.png');

    // Test Mobile Viewport & Drawer (390x844)
    console.log('\n- Testing Mobile Viewport & Mobile Filter Drawer (390x844):');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${BASE_URL}/category/cctv-cameras` });
    await sleep(2500);
    await waitForElement('button .lucide-sliders-horizontal', 12000);

    // Open mobile filter modal
    await evaluate(`
      const btn = document.querySelector('button .lucide-sliders-horizontal')?.parentElement;
      if (btn) btn.click();
    `);
    await sleep(600);

    const mobileModalOpen = await evaluate(`Boolean(document.querySelector('[data-testid="mobile-filter-modal"]'))`);
    assert(mobileModalOpen, 'Mobile filter drawer opened successfully');

    const mobileBulletFacet = await evaluate(`Boolean(document.querySelector('[data-testid="mobile-facet-form_factor-Bullet"]'))`);
    assert(mobileBulletFacet, 'Mobile drawer displays dynamic specification filters (Bullet option present)');

    // Select Bullet inside mobile drawer
    await evaluate(`document.querySelector('[data-testid="mobile-facet-form_factor-Bullet"]').click()`);
    await sleep(500);

    await saveScreenshot('dynamic_filter_mobile_drawer_390x844.png');

    // Click Apply Filters button
    await evaluate(`
      const applyBtn = Array.from(document.querySelectorAll('[data-testid="mobile-filter-modal"] button')).find(b => b.textContent.includes('Apply Filters'));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(800);

    const mobileFilteredCards = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(mobileFilteredCards === 4, `Mobile product grid filtered to 4 bullet cameras (found ${mobileFilteredCards})`);
    await saveScreenshot('dynamic_filter_mobile_applied_390x844.png');

    ws.close();
  } finally {
    edgeProc.kill();
  }

  console.log('\n========================================');
  console.log(`Dynamic Specification Filter Tests Passed: ${testPassed}`);
  console.log(`Dynamic Specification Filter Tests Failed: ${testFailed}`);
  console.log('========================================\n');

  if (testFailed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
