#!/usr/bin/env node
/**
 * End-to-End Acceptance Test Suite for CamneX Bangladesh Brands Page (/brands & /brand/:slug)
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.BRANDS_CDP_PORT || '9791', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_brands_test_${Date.now()}`);
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
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

  console.log('=== CamneX Brands Page Acceptance Suite ===\n');

  // 1. API Verification
  console.log('1. Checking /api/brands and /api/products?brand=... consistency');
  const brandsRes = await fetch(`${BASE_URL}/api/brands`);
  assert(brandsRes.status === 200, 'GET /api/brands returns HTTP 200');
  const brands = await brandsRes.json();
  assert(Array.isArray(brands) && brands.length >= 10, `GET /api/brands returns ${brands.length} brands`);

  for (const b of ['hikvision', 'dahua', 'zkteco', 'ruijie-reyee', 'western-digital', 'seagate', 'tp-link']) {
    const brandEntry = brands.find((x) => x.slug === b);
    assert(Boolean(brandEntry), `Brand '${b}' exists in /api/brands`);
    const prodRes = await fetch(`${BASE_URL}/api/products?brand=${encodeURIComponent(b)}&limit=100`);
    const prodJson = await prodRes.json();
    assert(
      brandEntry.productCount === prodJson.total,
      `Brand '${b}' productCount (${brandEntry.productCount}) matches GET /api/products?brand=${b} (${prodJson.total})`
    );
  }

  // Direct HTML status check for /brands
  const htmlRes = await fetch(`${BASE_URL}/brands`);
  assert(htmlRes.status === 200, 'Direct GET /brands returns HTTP 200 OK');
  const htmlText = await htmlRes.text();
  assert(htmlText.includes('Explore Our Brands'), 'Server-rendered SEO title for /brands includes Explore Our Brands');

  // 2. Launch Headless Edge for UI & Interaction Tests
  console.log('\n2. Launching Headless Browser for E2E UI & Responsive Verification');
  const edgeProc = cp.spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1440,900',
      `${BASE_URL}/`
    ],
    { stdio: 'ignore' }
  );

  let ws;
  try {
    let targetWsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        const pages = await res.json();
        const page = pages.find((p) => p.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          targetWsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (_) {}
      await sleep(300);
    }
    if (!targetWsUrl) throw new Error('Could not connect to Edge CDP');

    ws = new WebSocket(targetWsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    const consoleErrors = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const errText = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        if (!errText.includes('favicon')) consoleErrors.push(errText);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails?.text || 'Uncaught exception');
      }
    };

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    const evalJs = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result?.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sleep(1200);

    // Navigate from Header "Brands" link
    const clickedNav = await evalJs(`(() => {
      const btn = document.querySelector('[data-testid="nav-brands-link"]');
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    assert(clickedNav, 'Header desktop Brands navigation button exists and is clickable');
    await sleep(1000);

    const pathnameAfterNav = await evalJs(`window.location.pathname`);
    assert(pathnameAfterNav === '/brands', `Clicking Header Brands navigates to /brands (got ${pathnameAfterNav})`);

    // Verify Heading & Supporting text
    const headingData = await evalJs(`(() => {
      const h1 = document.querySelector('[data-testid="brands-page-heading"]');
      const sub = document.querySelector('[data-testid="brands-page-subtitle"]');
      return {
        heading: h1 ? h1.textContent.trim() : '',
        subtitle: sub ? sub.textContent.trim() : ''
      };
    })()`);
    assert(
      headingData.heading === 'Explore Our Brands',
      `Brands page heading is 'Explore Our Brands' (got '${headingData.heading}')`
    );
    assert(
      headingData.subtitle ===
        'Discover security, surveillance, networking, and IT brands available through CamneX Bangladesh.',
      'Brands page supporting text matches exact specification'
    );

    // Verify Brand Cards, Logos, Fallbacks, and Product Counts
    const cardsReport = await evalJs(`(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="brand-card-"]'));
      const brokenImgs = Array.from(document.querySelectorAll('[data-testid^="brand-card-"] img')).filter(
        (img) => !img.complete || img.naturalWidth === 0
      );
      const fallbackBadges = Array.from(document.querySelectorAll('[data-testid^="brand-fallback-badge-"]')).map(
        (el) => el.textContent.trim()
      );
      const hikCount = document.querySelector('[data-testid="brand-product-count-hikvision"]')?.textContent?.trim();
      const ruijieCount = document.querySelector('[data-testid="brand-product-count-ruijie-reyee"]')?.textContent?.trim();
      const wdCount = document.querySelector('[data-testid="brand-product-count-western-digital"]')?.textContent?.trim();
      const tplinkCount = document.querySelector('[data-testid="brand-product-count-tp-link"]')?.textContent?.trim();
      return {
        cardCount: cards.length,
        brokenImgCount: brokenImgs.length,
        fallbackBadges,
        hikCount,
        ruijieCount,
        wdCount,
        tplinkCount
      };
    })()`);

    assert(cardsReport.cardCount >= 10, `All catalog brands render in grid (${cardsReport.cardCount} cards)`);
    assert(cardsReport.brokenImgCount === 0, 'Zero broken logo images on Brands page');
    assert(
      cardsReport.fallbackBadges.includes('Seagate') && cardsReport.fallbackBadges.includes('TP-Link'),
      `Missing logos use clean typographic fallback badges (${cardsReport.fallbackBadges.join(', ')})`
    );
    assert(cardsReport.hikCount === '22 Products', `Hikvision card shows '22 Products' (got '${cardsReport.hikCount}')`);
    assert(cardsReport.ruijieCount === '10 Products', `Ruijie Reyee card shows '10 Products' (got '${cardsReport.ruijieCount}')`);
    assert(cardsReport.wdCount === '3 Products', `Western Digital card shows '3 Products' (got '${cardsReport.wdCount}')`);
    assert(cardsReport.tplinkCount === '0 Products', `TP-Link card shows '0 Products' (got '${cardsReport.tplinkCount}')`);

    // Test Case-Insensitive Real-time Search & Empty State
    await evalJs(`(() => {
      const input = document.querySelector('[data-testid="brand-search-input"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'rUiJiE');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(300);

    const searchMatchCount = await evalJs(`document.querySelectorAll('[data-testid^="brand-card-"]').length`);
    assert(searchMatchCount === 1, `Case-insensitive search for 'rUiJiE' filters to 1 brand card (got ${searchMatchCount})`);

    // Empty state search
    await evalJs(`(() => {
      const input = document.querySelector('[data-testid="brand-search-input"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'NonExistentBrandXYZ999');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(300);

    const emptyStateVisible = await evalJs(`Boolean(document.querySelector('[data-testid="brands-empty-search"]'))`);
    assert(emptyStateVisible, 'Empty search state renders cleanly when no brands match');

    // Clear search button
    await evalJs(`document.querySelector('[data-testid="brand-search-clear"]').click()`);
    await sleep(300);
    const restoredCount = await evalJs(`document.querySelectorAll('[data-testid^="brand-card-"]').length`);
    assert(restoredCount === cardsReport.cardCount, `Clear search button restores all ${restoredCount} brand cards`);

    // Responsive Viewport Checks & Screenshots (1440x900, 1280x800, 768x1024, 390x844)
    const viewports = [
      { w: 1440, h: 900, mobile: false },
      { w: 1280, h: 800, mobile: false },
      { w: 768, h: 1024, mobile: true },
      { w: 390, h: 844, mobile: true }
    ];
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await sleep(500);
      const overflow = await evalJs(`document.documentElement.scrollWidth > window.innerWidth + 1`);
      assert(!overflow, `Zero horizontal overflow on /brands at ${vp.w}x${vp.h}`);

      try {
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot && shot.data && fs.existsSync(ARTIFACT_DIR)) {
          fs.writeFileSync(path.join(ARTIFACT_DIR, `brands_page_${vp.w}x${vp.h}.png`), Buffer.from(shot.data, 'base64'));
        }
      } catch (_) {}
    }

    // Restore 1440x900
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(400);

    // Click Ruijie Reyee brand card -> /brand/ruijie-reyee
    await evalJs(`document.querySelector('[data-testid="brand-card-ruijie-reyee"]').click()`);
    await sleep(1000);

    const ruijiePage = await evalJs(`(() => {
      return {
        path: window.location.pathname,
        h1: document.querySelector('h1')?.textContent?.trim(),
        showingText: document.body.innerText.match(/Showing\\s+\\d+\\s+of\\s+\\d+\\s+verified\\s+products/i)?.[0] || ''
      };
    })()`);
    assert(ruijiePage.path === '/brand/ruijie-reyee', `Clicking Ruijie Reyee card navigates to /brand/ruijie-reyee (got ${ruijiePage.path})`);
    assert(ruijiePage.h1 === 'Ruijie Reyee', `Brand page displays 'Ruijie Reyee' heading (got '${ruijiePage.h1}')`);
    assert(
      ruijiePage.showingText.includes('Showing 10 of 10'),
      `Ruijie Reyee product listing displays all 10 products ('${ruijiePage.showingText}')`
    );

    // Click "All Brands" button to return to /brands
    await evalJs(`document.querySelector('[data-testid="back-to-brands-btn"]').click()`);
    await sleep(800);
    assert((await evalJs(`window.location.pathname`)) === '/brands', 'Clicking All Brands returns to /brands');

    // Click Zero-Product Brand (TP-Link) -> /brand/tp-link
    await evalJs(`document.querySelector('[data-testid="brand-card-tp-link"]').click()`);
    await sleep(1000);
    const zeroBrandState = await evalJs(`(() => {
      const box = document.querySelector('[data-testid="brand-zero-products-state"]');
      return {
        exists: Boolean(box),
        text: box ? box.innerText : ''
      };
    })()`);
    assert(
      zeroBrandState.exists && zeroBrandState.text.includes('Request Quotation'),
      'Zero-product brand (TP-Link) displays graceful empty state with Request Quotation CTA'
    );

    // Click Clear Brand Filter -> /catalog
    await evalJs(`document.querySelector('[data-testid="clear-brand-filter-btn"]').click()`);
    await sleep(1000);
    assert((await evalJs(`window.location.pathname`)) === '/catalog', 'Clear Brand Filter navigates to /catalog');

    // Direct URL visit & page reload on /brands
    await send('Page.navigate', { url: `${BASE_URL}/brands` });
    await sleep(1200);
    await send('Page.reload');
    await sleep(1200);
    const afterReloadH1 = await evalJs(`document.querySelector('[data-testid="brands-page-heading"]')?.textContent?.trim()`);
    assert(afterReloadH1 === 'Explore Our Brands', 'Direct URL visit and browser refresh on /brands loads cleanly');

    assert(consoleErrors.length === 0, `Zero browser console/runtime errors (${consoleErrors.length} errors)`, consoleErrors.join('; '));
  } finally {
    if (ws) {
      try { ws.close(); } catch (_) {}
    }
    try { edgeProc.kill('SIGKILL'); } catch (_) {}
  }

  console.log(`\n=== Summary: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

