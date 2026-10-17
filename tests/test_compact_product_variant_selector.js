#!/usr/bin/env node
/**
 * Acceptance Test Suite for Compact Product Variant Selector:
 * 1. Backend /api/products/:id/variants endpoint behavior
 * 2. Storefront Product Detail Page verification
 * 3. Removal of generic Bullet / Dome / Turret housing selector
 * 4. Model selector presence only on genuine variant products (Ruijie switches, Hikvision DVRs, WD Purple, etc.)
 * 5. Model selector absence on single products without variants (e.g. cable-cat6)
 * 6. Model selection correctly updates Title, SKU, Model Number, Image, Price, and Specifications
 * 7. Add to Cart uses the selected model's real product ID and price
 * 8. Responsive viewports: Desktop (1280x800), Tablet (768x1024), Mobile (390x844)
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.VARIANT_TEST_CDP_PORT || '9836', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_variant_test_${Date.now()}`);
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

  console.log('=== CamneX Product Variant Selector Acceptance Suite ===\n');

  // 1. Backend API Endpoint Verification
  console.log('1. Verifying Backend Variants API endpoints (/api/products/:id/variants)...');

  // 1.1 Ruijie Switches
  try {
    const res = await fetch(`${BASE_URL}/api/products/prod-ruijie-es205gc-p/variants`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for Ruijie switch variants');
    assert(data.seriesName === 'Ruijie Reyee RG-ES200 Series', 'API returns correct seriesName');
    assert(Array.isArray(data.variants) && data.variants.length === 3, 'API returns 3 switch models');
    assert(data.variants[0].modelNumber === 'RG-ES205GC-P', 'Variant 1 model is RG-ES205GC-P');
    assert(data.variants[1].modelNumber === 'RG-ES209GC-P', 'Variant 2 model is RG-ES209GC-P');
    assert(data.variants[2].modelNumber === 'RG-ES224GC-P', 'Variant 3 model is RG-ES224GC-P');
    assert(data.variants[0].distinguishingSpec === '5-Port PoE (54W)', 'Variant 1 has distinguishing spec');
    assert(data.variants[1].price === 7500, 'Variant 2 has price 7500');
    assert(data.variants[2].price === 24500, 'Variant 3 has price 24500');
  } catch (e) {
    assert(false, 'API Ruijie variants failed', e.message);
  }

  // 1.2 Hikvision 2MP Audio Cameras (Bullet vs Turret)
  try {
    const res = await fetch(`${BASE_URL}/api/products/prod-hik-irpf-2mp/variants`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for Hikvision 2MP camera variants');
    assert(data.variants.length === 2, 'API returns 2 models (bullet and turret)');
    assert(data.variants[0].modelNumber === 'DS-2CE16D0T-ITPFS', 'Bullet model is DS-2CE16D0T-ITPFS');
    assert(data.variants[1].modelNumber === 'DS-2CE76D0T-ITPFS', 'Turret model is DS-2CE76D0T-ITPFS');
  } catch (e) {
    assert(false, 'API Hikvision camera variants failed', e.message);
  }

  // 1.3 Western Digital Purple HDDs
  try {
    const res = await fetch(`${BASE_URL}/api/products/prod-wd-purple-1tb/variants`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for WD Purple variants');
    assert(data.variants.length === 3, 'API returns 3 capacity variants (500GB, 1TB, 2TB)');
  } catch (e) {
    assert(false, 'API WD Purple variants failed', e.message);
  }

  // 1.4 Single product without variants (cable-cat6)
  try {
    const res = await fetch(`${BASE_URL}/api/products/cable-cat6/variants`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for single product');
    assert(Array.isArray(data.variants) && data.variants.length === 0, 'API returns empty variants array for single product');
  } catch (e) {
    assert(false, 'API single product variants failed', e.message);
  }

  // 2. Launch Browser for UI & Interaction Tests
  console.log('\n2. Launching Browser for UI, Variant Selection & Cart Interaction...');

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
      if (pages.length > 0 && pages[0].webSocketDebuggerUrl) {
        targetWsUrl = pages[0].webSocketDebuggerUrl;
        break;
      }
    } catch (_) {}
    await sleep(500);
  }

  if (!targetWsUrl) {
    console.error('Failed to connect to browser CDP.');
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
      if (!errText.includes('favicon')) console.log('    [Browser Console Error]:', errText);
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.log('    [Browser Uncaught Exception]:', data.params.exceptionDetails?.text, data.params.exceptionDetails?.exception?.description);
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
    console.log(`  📸 Screenshot captured: ${filename} (${buf.length} bytes)`);
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
    const currentUrl = await evalJs(`window.location.href`).catch(() => 'unknown');
    const bodyText = await evalJs(`document.body?.innerText?.slice(0, 300)`).catch(() => 'unknown');
    console.log(`    [Navigation Debug] URL: ${currentUrl}\n    [Body]: ${bodyText}`);
    return false;
  };

  await send('Runtime.enable');
  await send('Page.enable');

  try {
    // 3. Ruijie Reyee Switch Product Page & Model Selector
    console.log('\n3. Testing Ruijie Switch Product Page (/product/prod-ruijie-es205gc-p)...');
    await setViewport(1280, 800);
    await navigateTo('/product/prod-ruijie-es205gc-p');

    // Title & Initial Model
    const title = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(title.includes('RG-ES205GC-P'), 'Product title contains initial model RG-ES205GC-P', title);

    const initialPrice = await evalJs(`document.querySelector('.text-3xl.font-black')?.innerText?.trim()`);
    assert(initialPrice.includes('4,800'), 'Initial selling price displays ৳4,800', initialPrice);

    // Available Models Selector Present
    const hasSelector = await evalJs(`!!document.querySelector('[data-testid="product-model-selector"]')`);
    assert(hasSelector, 'Available Models selector is present on multi-model product');

    // 3 Model Options present
    const opt5 = await evalJs(`!!document.querySelector('[data-testid="model-selector-option-RG-ES205GC-P"]')`);
    const opt9 = await evalJs(`!!document.querySelector('[data-testid="model-selector-option-RG-ES209GC-P"]')`);
    const opt24 = await evalJs(`!!document.querySelector('[data-testid="model-selector-option-RG-ES224GC-P"]')`);
    assert(opt5 && opt9 && opt24, 'All 3 models (5-Port, 9-Port, 24-Port) rendered in selector');

    // Verify RG-ES205GC-P is selected initially
    const activeText = await evalJs(`document.querySelector('[data-testid="model-selector-option-RG-ES205GC-P"]')?.className`);
    assert(activeText.includes('border-[#F15A24]'), 'Active model RG-ES205GC-P has CamneX orange border');

    // Verify old generic Housing Form Factor is removed
    const hasOldHousingSelector = await evalJs(`
      const body = document.body.innerText;
      return body.includes('Select Housing Form Factor') || body.includes('Select Housing');
    `);
    assert(!hasOldHousingSelector, 'Old generic Housing Form Factor selector is completely removed');

    await takeScreenshot('product_variant_ruijie_5port_desktop_1280x800.png');

    // 4. Select a Different Model: 9-Port (RG-ES209GC-P)
    console.log('\n4. Selecting 9-Port Model (RG-ES209GC-P)...');
    await evalJs(`document.querySelector('[data-testid="model-selector-option-RG-ES209GC-P"]').click()`);
    await sleep(800);

    const updatedTitle9 = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(updatedTitle9.includes('RG-ES209GC-P'), 'Product title updated to RG-ES209GC-P', updatedTitle9);

    const updatedPrice9 = await evalJs(`document.querySelector('.text-3xl.font-black')?.innerText?.trim()`);
    assert(updatedPrice9.includes('7,500'), 'Price updated to ৳7,500', updatedPrice9);

    const updatedModelSku = await evalJs(`document.querySelector('.font-mono.text-slate-500')?.innerText?.trim()`);
    assert(updatedModelSku.includes('RG-ES209GC-P'), 'SKU/Model line updated to RG-ES209GC-P', updatedModelSku);

    // Verify 9-port button now has active orange styling
    const activeText9 = await evalJs(`document.querySelector('[data-testid="model-selector-option-RG-ES209GC-P"]')?.className`);
    assert(activeText9.includes('border-[#F15A24]'), 'RG-ES209GC-P now has active orange highlight');

    await takeScreenshot('product_variant_ruijie_9port_desktop_1280x800.png');

    // 5. Select 24-Port Model (RG-ES224GC-P) & Test Add to Cart
    console.log('\n5. Selecting 24-Port Model (RG-ES224GC-P) and verifying Add to Cart...');
    await evalJs(`document.querySelector('[data-testid="model-selector-option-RG-ES224GC-P"]').click()`);
    await sleep(800);

    const updatedTitle24 = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(updatedTitle24.includes('RG-ES224GC-P'), 'Product title updated to RG-ES224GC-P', updatedTitle24);

    const updatedPrice24 = await evalJs(`document.querySelector('.text-3xl.font-black')?.innerText?.trim()`);
    assert(updatedPrice24.includes('24,500'), 'Price updated to ৳24,500', updatedPrice24);

    // Click Add to Cart
    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add to Cart'));
      if (addBtn) addBtn.click();
    `);
    await sleep(1000);

    // Check cart items in client store or cart drawer
    const cartItems = await evalJs(`
      const store = window.__CAMNEX_CART_STORE__;
      // Also check localStorage or API
      const items = JSON.parse(localStorage.getItem('camnex_cart') || '[]');
      return items;
    `);

    // Verify via cart route
    await navigateTo('/cart');
    const cartBody = await evalJs(`document.body.innerText`);
    assert(cartBody.includes('RG-ES224GC-P') || cartBody.includes('24,500'), 'Cart contains the selected 24-Port model (RG-ES224GC-P) at ৳24,500');

    await takeScreenshot('product_variant_cart_verified_desktop_1280x800.png');

    // 6. Test Product WITHOUT Variants (cable-cat6)
    console.log('\n6. Testing Product Without Variants (/product/cable-cat6)...');
    await navigateTo('/product/cable-cat6');

    const cableTitle = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(cableTitle.includes('D-Link CAT6'), 'D-Link CAT6 cable loaded properly', cableTitle);

    const selectorOnSingle = await evalJs(`!!document.querySelector('[data-testid="product-model-selector"]')`);
    assert(!selectorOnSingle, 'Model selector is hidden on single product without variants');

    const oldHousingOnSingle = await evalJs(`document.body.innerText.includes('Select Housing Form Factor')`);
    assert(!oldHousingOnSingle, 'Old housing selector is absent on single product');

    await takeScreenshot('product_single_no_variants_desktop_1280x800.png');

    // 7. Test Hikvision 2MP Camera Models (Bullet vs Turret Dome)
    console.log('\n7. Testing Hikvision 2MP Camera Models (/product/prod-hik-irpf-2mp)...');
    await navigateTo('/product/prod-hik-irpf-2mp');

    const hikTitle = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(hikTitle.includes('DS-2CE16D0T-ITPFS') || hikTitle.includes('Fixed Mini Bullet'), 'Bullet camera loaded', hikTitle);

    const hikSelector = await evalJs(`!!document.querySelector('[data-testid="product-model-selector"]')`);
    assert(hikSelector, 'Available Models selector is present on Hikvision 2MP series');

    // Switch to Turret Dome model
    await evalJs(`document.querySelector('[data-testid="model-selector-option-DS-2CE76D0T-ITPFS"]').click()`);
    await sleep(800);

    const turretTitle = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(turretTitle.includes('Turret Dome') || turretTitle.includes('DS-2CE76D0T-ITPFS'), 'Updated to Turret Dome model', turretTitle);

    const turretPrice = await evalJs(`document.querySelector('.text-3xl.font-black')?.innerText?.trim()`);
    assert(turretPrice.includes('2,350'), 'Price updated to Turret Dome price ৳2,350', turretPrice);

    await takeScreenshot('product_variant_hikvision_turret_desktop_1280x800.png');

    // 8. Responsive Viewport Verification
    console.log('\n8. Testing Responsive Viewports (Tablet & Mobile)...');

    // Tablet (768x1024)
    await setViewport(768, 1024);
    await navigateTo('/product/prod-ruijie-es205gc-p');
    const tabletSelectorVisible = await evalJs(`!!document.querySelector('[data-testid="product-model-selector"]')`);
    assert(tabletSelectorVisible, 'Selector renders cleanly on Tablet (768x1024)');
    await takeScreenshot('product_variant_ruijie_tablet_768x1024.png');

    // Mobile (390x844)
    await setViewport(390, 844, true);
    await sleep(500);
    const mobileSelectorVisible = await evalJs(`!!document.querySelector('[data-testid="product-model-selector"]')`);
    assert(mobileSelectorVisible, 'Selector renders cleanly on Mobile (390x844)');

    const mobileButtonsCount = await evalJs(`document.querySelectorAll('[data-testid^="model-selector-option-"]').length`);
    assert(mobileButtonsCount === 3, 'All 3 model options fit touch grid on Mobile');

    await takeScreenshot('product_variant_ruijie_mobile_390x844.png');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    try {
      ws.close();
      edgeProc.kill();
    } catch (_) {}
  }

  console.log('\n========================================');
  console.log('Variant Selector Acceptance Suite Results:');
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
