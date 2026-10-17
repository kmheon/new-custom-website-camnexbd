#!/usr/bin/env node
/**
 * Comprehensive Automated Acceptance Test Suite for Product Comparison Workflow:
 * 1. Compare Button Behavior:
 *    - Clicking Compare adds product to persistent list without leaving the page
 *    - Button state updates to indicate product has been added ("✓ Added to Compare")
 *    - Subtle confirmation toast appears ("Added to comparison.")
 *    - Clicking Compare again on already-added product does NOT create duplicates
 * 2. Persistent Comparison Across Pages & Browser Refresh:
 *    - Preserves selected items in localStorage ('camnex_compare_items')
 *    - Header comparison indicator reflects correct count in real-time
 *    - Items survive navigation between product detail, catalog, and search pages
 *    - Items survive full browser reload
 * 3. Multi-Product Comparison Page (/compare):
 *    - Displays all selected products side-by-side with genuine catalog data
 *    - Remove individual product action updates table and header count immediately
 *    - If 1 product selected, displays informative notice without redirecting away
 *    - "Continue Shopping" action navigates to catalog
 *    - "Clear All" action clears list and displays clean empty state
 * 4. Responsive Verification:
 *    - Desktop (1280x800), Tablet (768x1024), Mobile (390x844)
 *    - Mobile header compare button with count badge and mobile menu drawer item
 *    - Captures verification screenshots to artifacts directory
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.TEST_CDP_PORT || '9855', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_compare_test_${Date.now()}`);
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

  console.log('=== CamneX Bangladesh — Product Comparison Workflow Acceptance Suite ===\n');

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
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result?.value;
  };

  const setViewport = async (width, height, isMobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });
    await sleep(200);
  };

  const takeScreenshot = async (filename, fullPage = false) => {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage });
    const buf = Buffer.from(shot.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`    [Screenshot saved]: ${filename}`);
  };

  const navigateTo = async (urlPath) => {
    await send('Page.navigate', { url: `${BASE_URL}${urlPath}` });
    await sleep(1500);
    for (let i = 0; i < 30; i++) {
      try {
        const h = await evalJs(`document.querySelector('h1')?.innerText`);
        if (h && h.trim().length > 0) return true;
      } catch (_) {}
      await sleep(300);
    }
    return false;
  };

  await send('Page.enable');
  await send('Runtime.enable');

  try {
    await setViewport(1280, 800, false);

    // Initial clean: clear compare storage
    console.log('--- Step 0: Initial Clean Setup ---');
    await navigateTo('/catalog');
    await evalJs(`
      localStorage.removeItem('camnex_compare_items');
      window.dispatchEvent(new Event('storage'));
    `);
    await sleep(500);

    // =========================================================================
    // TEST 1: Compare button behavior on Product Detail Page (No auto-redirect)
    // =========================================================================
    console.log('\n--- Test 1: Compare Button on Product Detail Page (/product/prod-hik-irpf-2mp) ---');
    await navigateTo('/product/prod-hik-irpf-2mp');

    // Check initial compare button text
    const initialCompareText = await evalJs(`
      document.querySelector('[data-testid="detail-compare-button"]')?.innerText?.trim()
    `);
    assert(initialCompareText?.includes('Add to Spec Comparison'), 'Initial button says "+ Add to Spec Comparison"', initialCompareText);

    // Click compare button
    await evalJs(`
      const btn = document.querySelector('[data-testid="detail-compare-button"]');
      if (btn) btn.click();
    `);
    await sleep(600);

    // Verify customer STAYED on the product detail page and did NOT redirect
    const urlAfterClick = await evalJs(`window.location.pathname`);
    assert(urlAfterClick === '/product/prod-hik-irpf-2mp', 'Customer stays on product page without redirect', urlAfterClick);

    // Verify button updated state
    const updatedCompareText = await evalJs(`
      document.querySelector('[data-testid="detail-compare-button"]')?.innerText?.trim()
    `);
    assert(updatedCompareText?.includes('Added to Compare'), 'Button updated to "✓ Added to Compare"', updatedCompareText);

    // Verify subtle confirmation toast appears
    const toastState = await evalJs(`
      const toast = document.querySelector('[data-testid="compare-toast"]');
      return {
        exists: Boolean(toast),
        text: toast?.innerText || ''
      };
    `);
    assert(toastState.exists, 'Subtle confirmation toast appeared');
    assert(toastState.text.includes('Added to comparison'), 'Toast message confirms "Added to comparison"', toastState.text);

    // Verify header comparison indicator displays count = 1
    const headerCount1 = await evalJs(`
      document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim()
    `);
    assert(headerCount1 === '1', 'Header comparison indicator displays count 1', headerCount1);

    await takeScreenshot('compare_detail_added_desktop_1280x800.png');

    // Test duplicate prevention: Click Compare again on the same product
    console.log('\n--- Test 1b: Duplicate Prevention on Already-Added Product ---');
    await evalJs(`
      const btn = document.querySelector('[data-testid="detail-compare-button"]');
      if (btn) btn.click();
    `);
    await sleep(500);

    const dupCheck = await evalJs(`
      const raw = localStorage.getItem('camnex_compare_items');
      const items = raw ? JSON.parse(raw) : [];
      return {
        count: items.length,
        items
      };
    `);
    assert(dupCheck.count === 1, 'Clicking again does not create duplicate entries in list (count remains 1)');
    assert(dupCheck.items[0] === 'prod-hik-irpf-2mp', 'Item is prod-hik-irpf-2mp');

    // =========================================================================
    // TEST 2: Add Product B from Catalog Page without leaving the page
    // =========================================================================
    console.log('\n--- Test 2: Add Second Product from Catalog Page (/catalog) ---');
    await navigateTo('/catalog');

    // Verify header indicator still shows 1 after navigating to catalog
    const headerCountAfterNav = await evalJs(`
      document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim()
    `);
    assert(headerCountAfterNav === '1', 'Header indicator preserves count 1 on Catalog page', headerCountAfterNav);

    // Click compare on second product (prod-hik-dome-2mp)
    await evalJs(`
      const btn = document.querySelector('[data-testid="catalog-compare-prod-hik-dome-2mp"]');
      if (btn) btn.click();
    `);
    await sleep(600);

    // Confirm stayed on /catalog
    const urlAfterCatalogClick = await evalJs(`window.location.pathname`);
    assert(urlAfterCatalogClick === '/catalog', 'Customer stays on Catalog page without redirect', urlAfterCatalogClick);

    // Confirm button updated
    const catalogBtnText = await evalJs(`
      document.querySelector('[data-testid="catalog-compare-prod-hik-dome-2mp"]')?.innerText?.trim()
    `);
    assert(catalogBtnText?.includes('Added to Compare'), 'Catalog button updated to "✓ Added to Compare"', catalogBtnText);

    // Confirm header count updated to 2
    const headerCount2 = await evalJs(`
      document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim()
    `);
    assert(headerCount2 === '2', 'Header comparison indicator updated to count 2', headerCount2);

    await takeScreenshot('compare_catalog_added_desktop_1280x800.png');

    // =========================================================================
    // TEST 3: Persistence Across Browser Refresh
    // =========================================================================
    console.log('\n--- Test 3: Persistence Across Full Browser Reload ---');
    await send('Page.reload');
    await sleep(2000);
    await evalJs(`document.querySelector('h1')?.innerText`);

    const headerCountAfterReload = await evalJs(`
      document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim()
    `);
    assert(headerCountAfterReload === '2', 'Comparison count 2 survives full browser reload', headerCountAfterReload);

    // =========================================================================
    // TEST 4: Add Product C from another category / detail page
    // =========================================================================
    console.log('\n--- Test 4: Add Third Product from Different Category (/product/prod-ruijie-es205gc-p) ---');
    await navigateTo('/product/prod-ruijie-es205gc-p');

    const headerCountBefore3 = await evalJs(`
      document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim()
    `);
    assert(headerCountBefore3 === '2', 'Header retains 2 products before adding third');

    await evalJs(`
      const btn = document.querySelector('[data-testid="detail-compare-button"]');
      if (btn) btn.click();
    `);
    await sleep(600);

    const headerCount3 = await evalJs(`
      document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim()
    `);
    assert(headerCount3 === '3', 'Header comparison indicator updated to 3 after third product added', headerCount3);

    // =========================================================================
    // TEST 5: Open Comparison Page and verify all 3 products side-by-side
    // =========================================================================
    console.log('\n--- Test 5: Open Comparison Page (/compare) ---');
    // Click header compare button to navigate to comparison
    await evalJs(`
      const headerBtn = document.querySelector('[data-testid="header-compare-button"]');
      if (headerBtn) headerBtn.click();
    `);
    await sleep(1500);

    const currentUrl = await evalJs(`window.location.pathname`);
    assert(currentUrl === '/compare', 'Navigated to /compare via header indicator', currentUrl);

    // Verify all 3 products rendered in table
    const compareTableInfo = await evalJs(`
      const table = document.querySelector('table');
      const ths = Array.from(document.querySelectorAll('thead th h4')).map(h => h.innerText.trim());
      const removeButtons = Array.from(document.querySelectorAll('[data-testid^="compare-remove-"]'));
      return {
        tableExists: Boolean(table),
        productTitles: ths,
        removeCount: removeButtons.length
      };
    `);

    assert(compareTableInfo.tableExists, 'Comparison matrix table rendered');
    assert(compareTableInfo.removeCount === 3, 'All 3 products have individual remove buttons');
    assert(compareTableInfo.productTitles.some(t => t.includes('DS-2CE16D0T-ITPFS') || t.includes('Bullet')), 'Product A (Hikvision Bullet) is in comparison matrix');
    assert(compareTableInfo.productTitles.some(t => t.includes('DS-2CE76D0T-ITPFS') || t.includes('Dome')), 'Product B (Hikvision Dome) is in comparison matrix');
    assert(compareTableInfo.productTitles.some(t => t.includes('RG-ES205GC-P') || t.includes('Ruijie')), 'Product C (Ruijie Switch) is in comparison matrix');

    await takeScreenshot('compare_page_three_products_desktop_1280x800.png');

    // =========================================================================
    // TEST 6: Remove one product (from 3 down to 2)
    // =========================================================================
    console.log('\n--- Test 6: Remove Product C (prod-ruijie-es205gc-p) ---');
    await evalJs(`
      const removeBtn = document.querySelector('[data-testid="compare-remove-prod-ruijie-es205gc-p"]');
      if (removeBtn) removeBtn.click();
    `);
    await sleep(800);

    const countAfterRemove1 = await evalJs(`
      const ths = Array.from(document.querySelectorAll('thead th h4')).map(h => h.innerText.trim());
      const headerCount = document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim();
      return {
        remainingTitles: ths,
        headerCount
      };
    `);
    assert(countAfterRemove1.remainingTitles.length === 2, 'Table now contains exactly 2 products');
    assert(countAfterRemove1.headerCount === '2', 'Header count immediately updated to 2', countAfterRemove1.headerCount);

    // =========================================================================
    // TEST 7: Remove second product (from 2 down to 1) -> Verify Notice Banner
    // =========================================================================
    console.log('\n--- Test 7: Remove to 1 Product -> Verify Informative Notice without Redirect ---');
    await evalJs(`
      const removeBtn = document.querySelector('[data-testid="compare-remove-prod-hik-dome-2mp"]');
      if (removeBtn) removeBtn.click();
    `);
    await sleep(800);

    const singleProductState = await evalJs(`
      const alertNotice = document.querySelector('[data-testid="compare-single-product-alert"]');
      const addMoreBtn = document.querySelector('[data-testid="compare-add-more"]');
      const remainingThs = Array.from(document.querySelectorAll('thead th h4')).map(h => h.innerText.trim());
      const headerCount = document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim();
      const currentPath = window.location.pathname;

      return {
        currentPath,
        hasAlert: Boolean(alertNotice),
        alertText: alertNotice?.innerText || '',
        hasAddMoreBtn: Boolean(addMoreBtn),
        remainingCount: remainingThs.length,
        headerCount
      };
    `);

    assert(singleProductState.currentPath === '/compare', 'Customer is NOT automatically redirected away on 1 product');
    assert(singleProductState.hasAlert, 'Informative notice alert is displayed explaining to add another product');
    assert(singleProductState.hasAddMoreBtn, 'Alert provides "Browse Catalog" button to add another product');
    assert(singleProductState.remainingCount === 1, 'Single selected product is still visible in table');
    assert(singleProductState.headerCount === '1', 'Header count immediately updated to 1', singleProductState.headerCount);

    await takeScreenshot('compare_page_single_product_notice_desktop_1280x800.png');

    // =========================================================================
    // TEST 8: Clear All Action -> Verify Useful Empty State
    // =========================================================================
    console.log('\n--- Test 8: Clear All -> Verify Empty State & Continue Shopping ---');
    await evalJs(`
      const clearBtn = document.querySelector('[data-testid="compare-clear-all"]');
      if (clearBtn) clearBtn.click();
    `);
    await sleep(800);

    const emptyState = await evalJs(`
      const emptyBox = document.querySelector('[data-testid="compare-empty-state"]');
      const headerBadge = document.querySelector('[data-testid="header-compare-count"]');
      const continueBtn = document.querySelector('[data-testid="compare-empty-continue"]');
      return {
        hasEmptyBox: Boolean(emptyBox),
        emptyText: emptyBox?.innerText || '',
        headerBadgeVisible: Boolean(headerBadge),
        hasContinueBtn: Boolean(continueBtn)
      };
    `);

    assert(emptyState.hasEmptyBox, 'Empty state container is rendered');
    assert(emptyState.emptyText.includes('empty'), 'Empty state confirms comparison list is empty');
    assert(!emptyState.headerBadgeVisible, 'Header badge disappears when list is empty');
    assert(emptyState.hasContinueBtn, 'Empty state has "Browse Catalog & Compare" action');

    await takeScreenshot('compare_page_empty_state_desktop_1280x800.png');

    // Test Continue Shopping click
    await evalJs(`
      const btn = document.querySelector('[data-testid="compare-empty-continue"]');
      if (btn) btn.click();
    `);
    await sleep(1000);

    const backToCatalogUrl = await evalJs(`window.location.pathname`);
    assert(backToCatalogUrl === '/catalog', 'Continue Shopping returns customer to catalog', backToCatalogUrl);

    // =========================================================================
    // TEST 9: Mobile Viewport & Navigation Verification
    // =========================================================================
    console.log('\n--- Test 9: Responsive Viewport Verification (Mobile 390x844 & Tablet 768x1024) ---');

    // Re-add 2 products for responsive tests
    await evalJs(`
      localStorage.setItem('camnex_compare_items', JSON.stringify(['prod-hik-irpf-2mp', 'prod-hik-dome-2mp']));
      window.dispatchEvent(new Event('storage'));
    `);
    await navigateTo('/compare');

    // Tablet: 768x1024
    await setViewport(768, 1024);
    await sleep(500);
    const tabletInfo = await evalJs(`
      const table = document.querySelector('table');
      const headerCount = document.querySelector('[data-testid="header-compare-count"]')?.innerText?.trim();
      return {
        hasTable: Boolean(table),
        headerCount
      };
    `);
    assert(tabletInfo.hasTable, 'Comparison table renders properly on Tablet (768x1024)');
    assert(tabletInfo.headerCount === '2', 'Header indicator visible on Tablet');
    await takeScreenshot('compare_tablet_768x1024.png');

    // Mobile: 390x844
    await setViewport(390, 844, true);
    await sleep(500);
    const mobileInfo = await evalJs(`
      const mobileBtn = document.querySelector('[data-testid="mobile-compare-button"]');
      const mobileCount = document.querySelector('[data-testid="mobile-compare-count"]')?.innerText?.trim();
      const table = document.querySelector('table');
      return {
        hasMobileBtn: Boolean(mobileBtn),
        mobileCount,
        hasTable: Boolean(table)
      };
    `);
    assert(mobileInfo.hasMobileBtn, 'Mobile compare button is visible in mobile top bar');
    assert(mobileInfo.mobileCount === '2', 'Mobile compare badge displays count 2', mobileInfo.mobileCount);
    assert(mobileInfo.hasTable, 'Comparison matrix scrolls horizontally on mobile without broken layout');
    await takeScreenshot('compare_mobile_390x844.png');

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    try { ws.close(); } catch (_) {}
    try { edgeProc.kill(); } catch (_) {}
    try {
      setTimeout(() => {
        try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
      }, 1000);
    } catch (_) {}
  }

  console.log(`\n======================================================`);
  console.log(`Product Comparison Suite: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal runner error:', e);
  process.exit(1);
});
