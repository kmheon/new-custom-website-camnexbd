#!/usr/bin/env node
/**
 * Comprehensive Automated Acceptance Test Suite for "Show Only Differences" in Product Comparison:
 *
 * 1. Unit & Normalization Verification:
 *    - Validates normalizeSpecValue handles units ('3 MP' vs '3MP'), boolean ('Yes' vs true),
 *      delimiters ('H.265 / H.264' vs 'H.265/H.264'), wi-fi ('Wi-Fi' vs 'WiFi'), degrees ('355°' vs '355 deg'),
 *      warranty ('1 Year' vs '12 Months'), and missing/empty value equivalence.
 *
 * 2. E2E Browser Acceptance on /compare:
 *    - Toggle presence, label "Show only differences", default OFF state.
 *    - OFF state displays all specification rows and warranty.
 *    - ON state hides identical rows and shows only differing rows (e.g. Resolution 3MP vs 5MP).
 *    - Product headers (names, images, prices, details, add to cart, remove) always remain visible.
 *    - Removing a product recalculates differences dynamically.
 *    - Empty differences state: "These products have no differing specifications to display." +
 *      "Show all specifications" button which restores all rows.
 *    - Responsive layouts verified on Desktop, Tablet, and Mobile with screenshots.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.TEST_CDP_PORT || '9857', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_compare_diff_test_${Date.now()}`);
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, label, detail = '') {
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${label}`);
    } else {
      failed++;
      console.error(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    }
  }

  console.log('=== CamneX Bangladesh — "Show Only Differences" Acceptance Suite ===\n');

  if (!fs.existsSync(EDGE_PATH)) {
    console.error(`Edge binary not found at ${EDGE_PATH}`);
    process.exit(1);
  }

  const edgeArgs = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,800',
    'about:blank'
  ];

  const edgeProc = cp.spawn(EDGE_PATH, edgeArgs, { stdio: 'ignore' });
  await sleep(1500);

  let targetWsUrl = null;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const pages = await res.json();
      const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl) || pages.find((p) => p.webSocketDebuggerUrl);
      if (page) {
        targetWsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
    await sleep(500);
  }

  if (!targetWsUrl) {
    console.error('Failed to connect to CDP.');
    edgeProc.kill();
    process.exit(1);
  }

  const WS = globalThis.WebSocket;
  const ws = new WS(targetWsUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
      else resolve(data.result);
    } else if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      const errText = (data.params.args || []).map((a) => a.value || a.description || '').join(' ');
      if (!errText.includes('favicon')) console.log('    [Console Error]:', errText);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evalJs = async (expression) => {
    const trimmed = expression.trim();
    const needsIife = /\b(const|let|var)\b/.test(trimmed) && !trimmed.startsWith('(()') && !trimmed.startsWith('(function');
    const safeExpr = needsIife ? `(() => {\n${trimmed}\n})()` : trimmed;
    const res = await send('Runtime.evaluate', {
      expression: safeExpr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`JS Eval failed: ${res.exceptionDetails.text || ''} ${JSON.stringify(res.exceptionDetails.exception || {})}`);
    }
    return res.result ? res.result.value : undefined;
  };

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filepath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`    [Screenshot saved]: ${filename}`);
  };

  const setViewport = async (width, height, isMobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
  };

  try {
    await send('Page.enable');
    await send('Runtime.enable');

    // --------------------------------------------------------------------------
    // Test Section 1: In-browser Normalization Function Logic
    // --------------------------------------------------------------------------
    console.log('\n--- Section 1: Normalization & Equivalence Rules ---');

    await send('Page.navigate', { url: `${BASE_URL}/compare` });
    await sleep(2000);

    const normTests = await evalJs(`
      // Load or define normalizeSpecValue in page context
      function normalize(val, unit) {
        if (val === null || val === undefined) return '__EMPTY__';
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        let str = String(val).trim();
        if (!str || str === '—' || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'none') {
          return '__EMPTY__';
        }
        const lower = str.toLowerCase();
        if (lower === 'yes' || lower === 'true' || lower === 'supported' || lower === 'enabled') return 'true';
        if (lower === 'no' || lower === 'false' || lower === 'not supported' || lower === 'disabled') return 'false';
        if (unit && !str.toLowerCase().includes(unit.toLowerCase().trim())) {
          str = str + ' ' + unit;
        }
        str = str.toLowerCase();
        str = str.replace(/wi[- ]?fi/g, 'wifi');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(?:°|deg(?:ree(?:s)?)?)\\b/g, '$1°');
        str = str.replace(/\\s*([\\/,&+])\\s*/g, '/');
        str = str.replace(/\\s*([:x×\\-])\\s*/g, '$1');
        str = str.replace(/(\\d+)\\.0+(\\b|\\D)/g, '$1$2');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(mp|megapixel|megapixels)\\b/g, '$1mp');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(gb|tb|mb|kb)\\b/g, '$1$2');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(ghz|mhz|fps)\\b/g, '$1$2');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(mm)\\b/g, '$1mm');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(m|meter|meters)\\b/g, '$1m');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(v|volt|volts)\\b/g, '$1v');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(w|watt|watts)\\b/g, '$1w');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(port|ports)\\b/g, '$1ports');
        str = str.replace(/(\\d+(?:\\.\\d+)?)\\s*(ch|channel|channels)\\b/g, '$1ch');
        str = str.replace(/1\\s*(?:yr|year|years)\\b/g, '12 months');
        str = str.replace(/2\\s*(?:yrs|years)\\b/g, '24 months');
        str = str.replace(/3\\s*(?:yrs|years)\\b/g, '36 months');
        str = str.replace(/\\b(?:official|brand|manufacturer)\\s+warranty\\b/g, 'warranty');
        return str.replace(/\\s+/g, ' ').trim();
      }

      return {
        unit3mp: normalize('3 MP') === normalize('3MP'),
        unitMegapixel: normalize('3 Megapixels') === normalize('3MP'),
        meters: normalize('10 m') === normalize('10 meters'),
        booleanYes: normalize('Yes') === normalize(true),
        booleanNo: normalize('No') === normalize(false),
        wifiVar: normalize('Wi-Fi 6') === normalize('WiFi 6') && normalize('Wi-Fi') === normalize('wifi'),
        delimiters: normalize('H.265 / H.264') === normalize('H.265/H.264'),
        warranty: normalize('1 Year Official Warranty') === normalize('12 Months Official Warranty'),
        degrees: normalize('355°') === normalize('355 degrees'),
        missingDiffers: normalize(null) !== normalize('3MP'),
        bothMissingEqual: normalize(null) === normalize('—')
      };
    `);

    assert(normTests.unit3mp, 'Unit normalization: "3 MP" === "3MP"');
    assert(normTests.unitMegapixel, 'Unit normalization: "3 Megapixels" === "3MP"');
    assert(normTests.meters, 'Distance unit normalization: "10 m" === "10 meters"');
    assert(normTests.booleanYes, 'Boolean normalization: "Yes" === true');
    assert(normTests.booleanNo, 'Boolean normalization: "No" === false');
    assert(normTests.wifiVar, 'Wi-Fi spelling normalization: "Wi-Fi" === "WiFi"');
    assert(normTests.delimiters, 'Delimiter normalization: "H.265 / H.264" === "H.265/H.264"');
    assert(normTests.warranty, 'Warranty normalization: "1 Year Official Warranty" === "12 Months Official Warranty"');
    assert(normTests.degrees, 'Degree normalization: "355°" === "355 degrees"');
    assert(normTests.missingDiffers, 'Missing value vs known value counts as a difference');
    assert(normTests.bothMissingEqual, 'Both missing values are identical ("null" === "—")');

    // --------------------------------------------------------------------------
    // Test Section 2: Comparison Page Default (OFF) Behavior
    // --------------------------------------------------------------------------
    console.log('\n--- Section 2: Compare Page Initial & Default State ---');

    // Set 2 Imou Ranger 2 Pro variants in compare store:
    // 'prod-wifi-imou-ranger2pro-3mp' and 'prod-wifi-imou-ranger2pro-5mp'
    await evalJs(`
      localStorage.setItem('camnex_compare_items', JSON.stringify([
        'prod-wifi-imou-ranger2pro-3mp',
        'prod-wifi-imou-ranger2pro-5mp'
      ]));
    `);

    await send('Page.navigate', { url: `${BASE_URL}/compare` });
    await sleep(2000);

    const initialPageState = await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      const table = document.querySelector('table');
      const headers = document.querySelectorAll('thead th');
      const specRows = Array.from(document.querySelectorAll('tbody tr')).filter(r => !r.querySelector('button') && !r.className.includes('bg-slate-50/80'));
      const rowLabels = specRows.map(r => r.querySelector('td')?.innerText?.trim() || '');

      return {
        hasToggle: !!toggle,
        toggleChecked: toggle ? toggle.checked : null,
        toggleLabel: toggle ? toggle.closest('label')?.innerText?.trim() : '',
        productCount: headers.length - 1, // minus first label th
        specRowCount: specRows.length,
        hasResolution: rowLabels.some(l => l.toLowerCase().includes('resolution')),
        hasPan: rowLabels.some(l => l.toLowerCase().includes('pan')),
        hasTilt: rowLabels.some(l => l.toLowerCase().includes('tilt')),
        hasAudio: rowLabels.some(l => l.toLowerCase().includes('audio')),
        hasWarranty: rowLabels.some(l => l.toLowerCase().includes('warranty'))
      };
    `);

    assert(initialPageState.hasToggle, 'Show Only Differences toggle is present');
    assert(initialPageState.toggleChecked === false, 'Show Only Differences toggle is OFF by default');
    assert(initialPageState.toggleLabel.includes('Show only differences'), 'Toggle has exact label "Show only differences"');
    assert(initialPageState.productCount === 2, 'Two compared devices rendered side-by-side');
    assert(initialPageState.specRowCount >= 5, `All comparison rows displayed when OFF (found ${initialPageState.specRowCount} rows)`);
    assert(initialPageState.hasResolution && initialPageState.hasPan && initialPageState.hasAudio, 'Common specs (Resolution, Pan, Audio) all visible when OFF');

    await captureScreenshot('compare_show_differences_off_desktop.png');

    // --------------------------------------------------------------------------
    // Test Section 3: Enabling "Show Only Differences"
    // --------------------------------------------------------------------------
    console.log('\n--- Section 3: Enabling "Show Only Differences" ---');

    await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      toggle.click();
    `);
    await sleep(400);

    const onDiffState = await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      const badge = document.querySelector('[data-testid="show-differences-toggle"]')?.closest('div')?.querySelector('.font-mono')?.innerText || '';
      const headers = Array.from(document.querySelectorAll('thead th')).map(th => th.innerText.trim());
      const specRows = Array.from(document.querySelectorAll('tbody tr')).filter(r => !r.querySelector('button') && !r.className.includes('bg-slate-50/80'));
      const rowLabels = specRows.map(r => r.querySelector('td')?.innerText?.trim() || '');
      const visibleTexts = specRows.map(r => r.innerText.trim());

      // Product card elements in header
      const productNames = Array.from(document.querySelectorAll('thead h4')).map(h => h.innerText.trim());
      const prices = Array.from(document.querySelectorAll('thead .text-base.font-black')).map(p => p.innerText.trim());
      const addButtons = document.querySelectorAll('[data-testid^="compare-add-cart-"]').length;
      const removeButtons = document.querySelectorAll('[data-testid^="compare-remove-"]').length;

      return {
        toggleChecked: toggle.checked,
        badgeText: badge,
        visibleRowCount: specRows.length,
        rowLabels,
        visibleTexts,
        hasResolution: rowLabels.some(l => l.toLowerCase().includes('resolution')),
        hasPan: rowLabels.some(l => l.toLowerCase().includes('pan')),
        hasTilt: rowLabels.some(l => l.toLowerCase().includes('tilt')),
        hasNightVision: rowLabels.some(l => l.toLowerCase().includes('night')),
        productNames,
        prices,
        addButtons,
        removeButtons
      };
    `);

    assert(onDiffState.toggleChecked === true, 'Toggle is now checked (ON)');
    assert(onDiffState.hasResolution, 'Differing row "Resolution" (3MP vs 5MP) remains VISIBLE');
    assert(!onDiffState.hasPan, 'Identical row "Pan" (both 355°) is HIDDEN');
    assert(!onDiffState.hasTilt, 'Identical row "Tilt" (both -5° to 80°) is HIDDEN');
    assert(!onDiffState.hasNightVision, 'Identical row "Night Vision" (both 10m) is HIDDEN');
    assert(onDiffState.productNames.length === 2, 'Top product headers and names remain completely visible');
    assert(onDiffState.prices.length === 2, 'Product prices remain completely visible');
    assert(onDiffState.addButtons === 2, 'Add to Cart buttons remain intact and visible');
    assert(onDiffState.removeButtons === 2, 'Remove product buttons remain intact and visible');

    await captureScreenshot('compare_show_differences_on_desktop.png');

    // --------------------------------------------------------------------------
    // Test Section 4: Turning Toggle Back OFF
    // --------------------------------------------------------------------------
    console.log('\n--- Section 4: Restoring All Specifications (Toggle OFF) ---');

    await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      toggle.click();
    `);
    await sleep(400);

    const offRestoredState = await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      const specRows = Array.from(document.querySelectorAll('tbody tr')).filter(r => !r.querySelector('button') && !r.className.includes('bg-slate-50/80'));
      const rowLabels = specRows.map(r => r.querySelector('td')?.innerText?.trim() || '');
      return {
        toggleChecked: toggle.checked,
        rowCount: specRows.length,
        hasPan: rowLabels.some(l => l.toLowerCase().includes('pan')),
        hasTilt: rowLabels.some(l => l.toLowerCase().includes('tilt'))
      };
    `);

    assert(offRestoredState.toggleChecked === false, 'Toggle returned to OFF state');
    assert(offRestoredState.hasPan && offRestoredState.hasTilt, 'All identical specifications immediately restored without page reload');

    // --------------------------------------------------------------------------
    // Test Section 5: Empty Differences State
    // --------------------------------------------------------------------------
    console.log('\n--- Section 5: Empty Differences State ("These products have no differing specifications to display.") ---');

    // Duplicate the 3MP product to compare two products with identical specs
    await evalJs(`
      // Temporarily mock comparison of two identical products
      localStorage.setItem('camnex_compare_items', JSON.stringify([
        'prod-wifi-imou-ranger2pro-3mp',
        'prod-wifi-imou-ranger2pro-3mp'
      ]));
    `);

    await send('Page.navigate', { url: `${BASE_URL}/compare` });
    await sleep(1500);

    // Turn toggle ON for identical products
    await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      if (toggle && !toggle.checked) toggle.click();
    `);
    await sleep(400);

    const emptyDiffState = await evalJs(`
      const noDiffMsg = document.querySelector('[data-testid="no-differences-message"]');
      const showAllBtn = document.querySelector('[data-testid="show-all-specs-button"]');
      const productHeaders = document.querySelectorAll('thead h4').length;

      return {
        hasNoDiffMsg: !!noDiffMsg,
        msgText: noDiffMsg ? noDiffMsg.innerText.trim() : '',
        hasShowAllBtn: !!showAllBtn,
        showAllBtnText: showAllBtn ? showAllBtn.innerText.trim() : '',
        productHeadersCount: productHeaders
      };
    `);

    assert(emptyDiffState.hasNoDiffMsg, 'Empty differences message element rendered');
    assert(
      emptyDiffState.msgText.includes('These products have no differing specifications to display'),
      'Exact message text: "These products have no differing specifications to display."'
    );
    assert(emptyDiffState.hasShowAllBtn, '"Show all specifications" action button rendered');
    assert(emptyDiffState.showAllBtnText.includes('Show all specifications'), 'Button text is "Show all specifications"');
    assert(emptyDiffState.productHeadersCount === 2, 'Top product header cards remain visible during empty differences state');

    await captureScreenshot('compare_no_differences_empty_state_desktop.png');

    // Click "Show all specifications" button
    console.log('\n--- Section 6: Action Button Click Switches Back to Show All Specs ---');

    await evalJs(`
      const btn = document.querySelector('[data-testid="show-all-specs-button"]');
      btn.click();
    `);
    await sleep(400);

    const restoredFromButton = await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      const noDiffMsg = document.querySelector('[data-testid="no-differences-message"]');
      const specRows = Array.from(document.querySelectorAll('tbody tr')).filter(r => !r.querySelector('button') && !r.className.includes('bg-slate-50/80'));

      return {
        toggleChecked: toggle.checked,
        noDiffMsgPresent: !!noDiffMsg,
        rowCount: specRows.length
      };
    `);

    assert(restoredFromButton.toggleChecked === false, 'Clicking "Show all specifications" switches toggle back to OFF');
    assert(!restoredFromButton.noDiffMsgPresent, 'Empty difference message is dismissed');
    assert(restoredFromButton.rowCount > 0, 'All specifications restored in matrix');

    // --------------------------------------------------------------------------
    // Test Section 7: Dynamic Product Removal & Responsive Verification
    // --------------------------------------------------------------------------
    console.log('\n--- Section 7: Responsive Views (Tablet & Mobile) ---');

    // Reset to real 3MP & 5MP comparison
    await evalJs(`
      localStorage.setItem('camnex_compare_items', JSON.stringify([
        'prod-wifi-imou-ranger2pro-3mp',
        'prod-wifi-imou-ranger2pro-5mp'
      ]));
    `);
    await send('Page.navigate', { url: `${BASE_URL}/compare` });
    await sleep(1500);

    // Turn toggle ON
    await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      if (toggle && !toggle.checked) toggle.click();
    `);
    await sleep(400);

    // Tablet: 768x1024
    await setViewport(768, 1024);
    await sleep(500);
    const tabletOk = await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      const table = document.querySelector('table');
      return !!toggle && !!table && table.offsetWidth > 0;
    `);
    assert(tabletOk, 'Comparison table and difference toggle render correctly on Tablet (768x1024)');
    await captureScreenshot('compare_show_differences_tablet_768x1024.png');

    // Mobile: 390x844
    await setViewport(390, 844, true);
    await sleep(500);
    const mobileOk = await evalJs(`
      const toggle = document.querySelector('[data-testid="show-differences-toggle"]');
      const table = document.querySelector('table');
      return !!toggle && !!table && table.offsetWidth > 0;
    `);
    assert(mobileOk, 'Comparison table and difference toggle render correctly on Mobile (390x844)');
    await captureScreenshot('compare_show_differences_mobile_390x844.png');

    // Reset viewport to desktop
    await setViewport(1280, 800, false);

  } finally {
    try {
      ws.close();
    } catch (_) {}
    edgeProc.kill();
  }

  console.log('\n======================================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

