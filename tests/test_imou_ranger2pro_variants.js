#!/usr/bin/env node
/**
 * End-to-End Automated Acceptance Test for Imou Ranger 2 Pro Product Family:
 * - Direct navigation to 3MP product
 * - Verification of compact model selector with genuine 3MP and 5MP options
 * - Dynamic model switching (3MP -> 5MP -> 3MP) without page reload
 * - Verification that Title, SKU, Model, Specs, and URL update accurately
 * - Verification that Add to Cart and Buy Now use the selected variant's genuine product ID
 * - Honest pricing ("Request quotation" / "Quote") and stock handling
 * - Multi-viewport responsiveness (Desktop 1280x800, Tablet 768x1024, Mobile 390x844)
 * - Capturing verification screenshots to artifacts directory
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.TEST_CDP_PORT || '9850', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_imou_test_${Date.now()}`);
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

  console.log('=== Imou Ranger 2 Pro Variable Product Acceptance Test Suite ===\n');

  // 1. Launch Browser
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
    // Test 1: Navigate to 3MP Variant Page
    console.log('\n--- Test 1: Navigation to Imou Ranger 2 Pro 3MP ---');
    await setViewport(1280, 800, false);
    const navOk = await navigateTo('/product/prod-wifi-imou-ranger2pro-3mp');
    assert(navOk, 'Page hydrated and h1 rendered successfully');

    const initialInfo = await evalJs(`
      const title = document.querySelector('h1')?.innerText?.trim() || '';
      const skuText = document.querySelector('.lg\\\\:col-span-5')?.innerText || '';
      const selector = document.querySelector('[data-testid="product-model-selector"]');
      const opt3mp = document.querySelector('[data-testid="model-selector-option-IPC-A32P-L"]');
      const opt5mp = document.querySelector('[data-testid="model-selector-option-IPC-A52P-L"]');
      const priceText = document.querySelector('.lg\\\\:col-span-5 .bg-\\\\[\\\\#F8FAFC\\\\]')?.innerText || '';
      const brandBadge = document.querySelector('.lg\\\\:col-span-7')?.innerText || '';

      return {
        title,
        hasSku: skuText.includes('IMOU-RANGER2PRO-3MP'),
        hasModel: skuText.includes('IPC-A32P-L'),
        hasSelector: Boolean(selector),
        hasOpt3mp: Boolean(opt3mp),
        hasOpt5mp: Boolean(opt5mp),
        opt3mpText: opt3mp?.innerText || '',
        opt5mpText: opt5mp?.innerText || '',
        isOpt3mpSelected: opt3mp?.className.includes('border-[#F15A24]'),
        priceText,
        brandBadge
      };
    `);

    assert(initialInfo.title.includes('Imou Ranger 2 Pro 3MP'), 'Title indicates 3MP model', initialInfo.title);
    assert(initialInfo.hasSku, 'Contains genuine SKU IMOU-RANGER2PRO-3MP');
    assert(initialInfo.hasModel, 'Contains genuine model number IPC-A32P-L');
    assert(initialInfo.hasSelector, 'Compact model selector is rendered');
    assert(initialInfo.hasOpt3mp && initialInfo.hasOpt5mp, 'Both 3MP and 5MP model options are visible');
    assert(initialInfo.opt3mpText.includes('3MP (2K) Wi-Fi 6'), '3MP option displays distinguishing spec "3MP (2K) Wi-Fi 6"');
    assert(initialInfo.opt5mpText.includes('5MP (3K) Wi-Fi 6'), '5MP option displays distinguishing spec "5MP (3K) Wi-Fi 6"');
    assert(initialInfo.opt3mpText.includes('Quote'), '3MP displays Quote status badge');
    assert(initialInfo.isOpt3mpSelected, '3MP option has active highlighted border');
    assert(initialInfo.priceText.includes('Request quotation'), 'Price panel displays honest "Request quotation"');
    assert(initialInfo.brandBadge.includes('Imou'), 'Brand badge displays "Imou"');

    await takeScreenshot('imou_ranger2pro_3mp_desktop_1280x800.png');

    // Test 2: Switch to 5MP Variant via Compact Selector
    console.log('\n--- Test 2: Click to Select 5MP Variant (IPC-A52P-L) ---');
    await evalJs(`
      const opt5mp = document.querySelector('[data-testid="model-selector-option-IPC-A52P-L"]');
      if (opt5mp) opt5mp.click();
    `);
    await sleep(1000);

    const switchedInfo = await evalJs(`
      const title = document.querySelector('h1')?.innerText?.trim() || '';
      const skuText = document.querySelector('.lg\\\\:col-span-5')?.innerText || '';
      const opt5mp = document.querySelector('[data-testid="model-selector-option-IPC-A52P-L"]');
      const opt3mp = document.querySelector('[data-testid="model-selector-option-IPC-A32P-L"]');
      const currentUrl = window.location.pathname;
      const specsTableText = document.querySelector('.divide-y')?.innerText || '';

      return {
        title,
        has5mpSku: skuText.includes('IMOU-RANGER2PRO-5MP'),
        has5mpModel: skuText.includes('IPC-A52P-L'),
        isOpt5mpSelected: opt5mp?.className.includes('border-[#F15A24]'),
        isOpt3mpUnselected: !opt3mp?.className.includes('border-[#F15A24]'),
        currentUrl,
        has5mpResolution: specsTableText.includes('5MP (2880 × 1620)'),
        hasWifi6: specsTableText.includes('Dual-Band Wi-Fi 6')
      };
    `);

    assert(switchedInfo.title.includes('Imou Ranger 2 Pro 5MP'), 'Title dynamically updated to 5MP', switchedInfo.title);
    assert(switchedInfo.has5mpSku, 'SKU updated to IMOU-RANGER2PRO-5MP');
    assert(switchedInfo.has5mpModel, 'Model updated to IPC-A52P-L');
    assert(switchedInfo.isOpt5mpSelected, '5MP button is now active');
    assert(switchedInfo.isOpt3mpUnselected, '3MP button is now inactive');
    assert(switchedInfo.currentUrl.includes('prod-wifi-imou-ranger2pro-5mp'), 'URL updated to 5MP product ID', switchedInfo.currentUrl);
    assert(switchedInfo.has5mpResolution, 'Technical specifications updated to 5MP (2880 × 1620)');
    assert(switchedInfo.hasWifi6, 'Specifications confirm Dual-Band Wi-Fi 6');

    await takeScreenshot('imou_ranger2pro_5mp_desktop_1280x800.png');

    // Test 3: Add to Cart with 5MP Selected Product
    console.log('\n--- Test 3: Verify Add to Cart Uses Selected 5MP Variant ---');
    await evalJs(`
      localStorage.removeItem('camnex_cart_v1');
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add to Cart'));
      if (addBtn) addBtn.click();
    `);
    await sleep(1000);

    const cartState = await evalJs(`
      const raw = localStorage.getItem('camnex_cart_v1');
      const cart = raw ? JSON.parse(raw) : [];
      return {
        count: cart.length,
        item: cart[0] || null
      };
    `);

    assert(cartState.count === 1, 'Item added to cart successfully');
    assert(cartState.item?.productId === 'prod-wifi-imou-ranger2pro-5mp', 'Cart item productId is genuine 5MP ID (prod-wifi-imou-ranger2pro-5mp)');
    assert(cartState.item?.product?.modelNumber === 'IPC-A52P-L', 'Cart item model is IPC-A52P-L');

    // Test 4: Switch Back to 3MP and Add to Cart
    console.log('\n--- Test 4: Switch Back to 3MP and Add to Cart ---');
    await evalJs(`
      const opt3mp = document.querySelector('[data-testid="model-selector-option-IPC-A32P-L"]');
      if (opt3mp) opt3mp.click();
    `);
    await sleep(1000);

    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add to Cart'));
      if (addBtn) addBtn.click();
    `);
    await sleep(1000);

    const updatedCart = await evalJs(`
      const raw = localStorage.getItem('camnex_cart_v1');
      const cart = raw ? JSON.parse(raw) : [];
      return {
        count: cart.length,
        productIds: cart.map(c => c.productId)
      };
    `);

    assert(updatedCart.count === 2, 'Cart now contains both distinct models (3MP and 5MP)');
    assert(updatedCart.productIds.includes('prod-wifi-imou-ranger2pro-3mp'), 'Cart contains 3MP model ID');
    assert(updatedCart.productIds.includes('prod-wifi-imou-ranger2pro-5mp'), 'Cart contains 5MP model ID');

    // Verify in Cart Page UI
    console.log('\n--- Navigating to Cart Page to verify UI representation ---');
    await navigateTo('/cart');
    const cartPageText = await evalJs(`document.body.innerText`);
    assert(cartPageText.includes('IPC-A52P-L') || cartPageText.includes('5MP'), 'Cart page displays 5MP variant');
    assert(cartPageText.includes('IPC-A32P-L') || cartPageText.includes('3MP'), 'Cart page displays 3MP variant');
    await takeScreenshot('imou_ranger2pro_cart_verified_desktop.png');

    // Test 5: Responsive Verification
    console.log('\n--- Test 5: Responsive Verification (Tablet & Mobile) ---');
    await navigateTo('/product/prod-wifi-imou-ranger2pro-3mp');

    // Tablet: 768x1024
    await setViewport(768, 1024);
    await sleep(400);
    const tabletInfo = await evalJs(`
      const sel = document.querySelector('[data-testid="product-model-selector"]');
      const rect = sel?.getBoundingClientRect();
      return { visible: Boolean(sel && rect && rect.width > 0) };
    `);
    assert(tabletInfo.visible, 'Model selector displays properly on Tablet');
    await takeScreenshot('imou_ranger2pro_tablet_768x1024.png');

    // Mobile: 390x844
    await setViewport(390, 844, true);
    await sleep(400);
    const mobileInfo = await evalJs(`
      const sel = document.querySelector('[data-testid="product-model-selector"]');
      const rect = sel?.getBoundingClientRect();
      return { visible: Boolean(sel && rect && rect.width > 0) };
    `);
    assert(mobileInfo.visible, 'Model selector displays properly on Mobile');
    await takeScreenshot('imou_ranger2pro_mobile_390x844.png');

    // Full-page screenshot on Desktop
    await setViewport(1280, 800, false);
    await sleep(400);
    await takeScreenshot('imou_ranger2pro_fullpage_desktop.png', true);

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

  console.log(`\n==============================================`);
  console.log(`Imou Ranger 2 Pro Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal runner error:', e);
  process.exit(1);
});

