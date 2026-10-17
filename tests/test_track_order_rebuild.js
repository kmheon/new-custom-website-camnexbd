#!/usr/bin/env node
/**
 * Comprehensive Acceptance Test Suite for Track Order Page Rebuild:
 * - Public guest order tracking with phone verification
 * - Steadfast Courier integration (badge, consignment, external tracking URL)
 * - Pathao Courier integration (badge, consignment, external tracking URL)
 * - Honest non-dispatched preparation status
 * - Logged-in customer personalized banner, order history, and 1-click tracking
 * - Exact heading and subtitle verification
 * - Support action card (Hotline, WhatsApp, Contact)
 * - Responsive viewports: Desktop (1280x800), Tablet (768x1024), Mobile (390x844)
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.TRACK_ORDER_CDP_PORT || '9825', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_track_order_test_${Date.now()}`);
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

  console.log('=== CamneX Track Order Page Rebuild Acceptance Suite ===\n');

  // 1. API Verification
  console.log('1. Verifying Backend Tracking API endpoints...');

  // 1.1 Steadfast Courier tracking data
  try {
    const res = await fetch(`${BASE_URL}/api/orders/CNX-ORD-STEADFAST-01?phone=01711223344`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for Steadfast order with phone');
    assert(data.courierName === 'Steadfast Courier', 'API exposes courierName: Steadfast Courier');
    assert(data.trackingNumber === 'SF-998241', 'API exposes trackingNumber: SF-998241');
    assert(data.courierTrackingUrl === 'https://steadfast.com.bd/t/SF-998241', 'API exposes correct Steadfast tracking URL');
    assert(Array.isArray(data.items) && data.items.length > 0, 'API exposes items array');
    assert(data.items[0].name.includes('Hikvision'), 'API exposes item name in tracking items');
    assert(data.items[0].totalPrice === 14500, 'API exposes item totalPrice');
    assert(data.paymentMethod.includes('bKash'), 'API exposes friendly payment method');
  } catch (e) {
    assert(false, 'API Steadfast lookup failed', e.message);
  }

  // 1.2 Pathao Courier tracking data
  try {
    const res = await fetch(`${BASE_URL}/api/orders/CNX-ORD-PATHAO-02?phone=01811223344`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for Pathao order with phone');
    assert(data.courierName === 'Pathao Courier', 'API exposes courierName: Pathao Courier');
    assert(data.trackingNumber === 'PTH-778899', 'API exposes trackingNumber: PTH-778899');
    assert(data.courierTrackingUrl === 'https://merchant.pathao.com/tracking?consignment_id=PTH-778899', 'API exposes correct Pathao tracking URL');
  } catch (e) {
    assert(false, 'API Pathao lookup failed', e.message);
  }

  // 1.3 Guest phone verification security test
  try {
    const res = await fetch(`${BASE_URL}/api/orders/CNX-ORD-PATHAO-02?phone=01999999999`);
    const data = await res.json();
    assert(res.status === 404, 'API blocks lookup with wrong phone (returns 404)');
    assert(data.error && data.error.includes('No order found matching the provided reference number and phone number'), 'API returns uniform error to prevent enumeration');
  } catch (e) {
    assert(false, 'API phone verification test failed', e.message);
  }

  // 1.4 Non-dispatched order test
  try {
    const res = await fetch(`${BASE_URL}/api/orders/CNX-ORD-20261014-9997?phone=01711122233`);
    const data = await res.json();
    assert(res.status === 200, 'API returns 200 for non-dispatched order');
    assert(data.courierName === null, 'API exposes null courierName when not dispatched');
    assert(data.trackingNumber === null, 'API exposes null trackingNumber when not dispatched');
    assert(data.courierTrackingUrl === null, 'API exposes null courierTrackingUrl when not dispatched');
  } catch (e) {
    assert(false, 'API non-dispatched test failed', e.message);
  }

  // 2. Launch Headless Browser for UI Acceptance & Screenshots
  console.log('\n2. Launching Browser for UI, Interaction & Responsive tests...');

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
  const consoleErrors = [];

  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
      else resolve(data.result);
    } else if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
      const errText = (data.params.args || []).map((a) => a.value || a.description || '').join(' ');
      if (!errText.includes('favicon')) consoleErrors.push(errText);
    } else if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails?.text || 'Uncaught exception');
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
    const bodyText = await evalJs(`document.body.innerText?.slice(0, 200)`).catch(() => 'unknown');
    console.log(`    [Navigation Debug] URL: ${currentUrl}, Body: ${bodyText}`);
    return false;
  };

  await send('Runtime.enable');
  await send('Page.enable');

  try {
    // 2.1 Navigate to /tracking
    console.log('\n3. Testing Storefront Track Order Page UI...');
    await setViewport(1280, 800);
    await navigateTo('/tracking');

    // Verify Heading and Subtitle
    const headingText = await evalJs(`document.querySelector('h1')?.innerText?.trim()`);
    assert(headingText === 'Track Your Order', 'Page Heading is exactly "Track Your Order"', headingText);

    const subText = await evalJs(`
      const p = document.querySelector('h1')?.nextElementSibling;
      return p ? p.innerText.trim() : '';
    `);
    assert(
      subText.includes('Enter your order details to check the latest available status of your CamneX order.'),
      'Supporting text matches requirement',
      subText
    );

    // Form fields present
    const hasOrderInput = await evalJs(`!!document.querySelector('[data-testid="track-order-input-number"]')`);
    const hasPhoneInput = await evalJs(`!!document.querySelector('[data-testid="track-order-input-phone"]')`);
    const hasSubmitBtn = await evalJs(`!!document.querySelector('[data-testid="track-order-submit-btn"]')`);
    assert(hasOrderInput, 'Order number input exists with data-testid');
    assert(hasPhoneInput, 'Phone number input exists with data-testid');
    assert(hasSubmitBtn, 'Submit button exists with data-testid');

    // Pre-search informational guide section visible (no large blank area)
    const hasGuide = await evalJs(`!!document.querySelector('[data-testid="track-order-guide"]')`);
    assert(hasGuide, 'Pre-search logistics & security guidance cards rendered cleanly');
    const guideText = await evalJs(`document.querySelector('[data-testid="track-order-guide"]')?.innerText || ''`);
    assert(!guideText.includes('Direct integration with Steadfast'), 'Does not claim direct API integration before it exists');
    assert(!guideText.includes('Live consignment tracking'), 'Does not claim live consignment tracking before it exists');
    assert(guideText.includes('Orders are dispatched nationwide via courier partners'), 'Explains honest courier partner dispatch workflow');
    await takeScreenshot('track_order_initial_clean_desktop_1280x800.png');

    // Inject React input setter helper
    await evalJs(`
      window.__setReactInput = function(selector, value) {
        const el = document.querySelector(selector);
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
    `);

    // 2.2 Form Validation: lookup with invalid phone
    console.log('\n4. Testing Order Lookup with Phone Verification Error...');
    await evalJs(`
      window.__setReactInput('[data-testid="track-order-input-number"]', 'CNX-ORD-STEADFAST-01');
      window.__setReactInput('[data-testid="track-order-input-phone"]', '01900000000');
      document.querySelector('[data-testid="track-order-submit-btn"]').click();
    `);
    await sleep(1000);

    const errorAlertText = await evalJs(`document.querySelector('[data-testid="track-order-error"]')?.innerText?.trim() || ''`);
    assert(
      errorAlertText.includes('No order found matching the provided reference number and phone number'),
      'Clear error alert displayed when phone does not match',
      errorAlertText
    );

    // 2.3 Steadfast Courier Lookup (Testing case-insensitive lookup e.g. lowercase cnx-ord-steadfast-01)
    console.log('\n5. Testing Steadfast Courier Order Tracking (Case-Insensitive)...');
    await evalJs(`
      window.__setReactInput('[data-testid="track-order-input-number"]', 'cnx-ord-steadfast-01');
      window.__setReactInput('[data-testid="track-order-input-phone"]', '+880 1711-223344');
      document.querySelector('[data-testid="track-order-submit-btn"]').click();
    `);
    await sleep(1200);

    const hasResults = await evalJs(`!!document.querySelector('[data-testid="track-order-results"]')`);
    assert(hasResults, 'Tracking results card is visible');

    const statusBadge = await evalJs(`document.querySelector('[data-testid="track-order-status-badge"]')?.innerText?.trim() || ''`);
    assert(statusBadge === 'DISPATCHED', 'Status badge displays DISPATCHED', statusBadge);

    const courierCardText = await evalJs(`document.querySelector('[data-testid="track-order-courier-card"]')?.innerText || ''`);
    assert(courierCardText.includes('Steadfast Courier'), 'Courier card displays Steadfast Courier', courierCardText);
    assert(courierCardText.includes('SF-998241'), 'Courier card displays consignment number SF-998241');
    assert(courierCardText.includes('Steadfast Express'), 'Courier card displays Steadfast Express badge');

    const courierLink = await evalJs(`document.querySelector('[data-testid="track-order-courier-link"]')?.getAttribute('href') || ''`);
    assert(courierLink === 'https://steadfast.com.bd/t/SF-998241', 'External tracking link matches Steadfast URL', courierLink);

    const timelineText = await evalJs(`document.querySelector('[data-testid="track-order-timeline"]')?.innerText || ''`);
    assert(timelineText.includes('Dispatched via Steadfast Courier'), 'Timeline shows Steadfast dispatch event');

    const itemsText = await evalJs(`document.querySelector('[data-testid="track-order-items"]')?.innerText || ''`);
    assert(itemsText.includes('Hikvision 4K UHD ColorVu Dome Camera'), 'Hardware ordered shows camera name');
    assert(itemsText.includes('14,500'), 'Hardware ordered shows price breakdown');
    assert(itemsText.includes('bKash Send Money'), 'Payment method displays bKash Send Money');

    const supportCardText = await evalJs(`document.querySelector('[data-testid="track-order-support-card"]')?.innerText || ''`);
    assert(supportCardText.includes('Questions regarding your order or dispatch?'), 'Support desk card is rendered');
    assert(supportCardText.includes('Call Dispatch Desk'), 'Support card has Call Dispatch Desk button');
    assert(supportCardText.includes('WhatsApp Support'), 'Support card has WhatsApp Support button');

    await takeScreenshot('track_order_steadfast_desktop_1280x800.png');
    await takeScreenshot('track_order_steadfast_fullpage.png', true);

    // 2.4 Search Another / Reset Action
    console.log('\n6. Testing Reset / Search Another Order action...');
    await evalJs(`document.querySelector('[data-testid="track-order-reset-btn"]')?.click();`);
    await sleep(500);

    const resultsAfterReset = await evalJs(`!!document.querySelector('[data-testid="track-order-results"]')`);
    assert(!resultsAfterReset, 'Results hidden after clicking Search Another');

    // 2.5 Pathao Courier Lookup
    console.log('\n7. Testing Pathao Courier Order Tracking...');
    await evalJs(`
      window.__setReactInput('[data-testid="track-order-input-number"]', 'CNX-ORD-PATHAO-02');
      window.__setReactInput('[data-testid="track-order-input-phone"]', '01811223344');
      document.querySelector('[data-testid="track-order-submit-btn"]').click();
    `);
    await sleep(1200);

    const pathaoCourierText = await evalJs(`document.querySelector('[data-testid="track-order-courier-card"]')?.innerText || ''`);
    assert(pathaoCourierText.includes('Pathao Courier'), 'Courier card displays Pathao Courier');
    assert(pathaoCourierText.includes('PTH-778899'), 'Courier card displays consignment number PTH-778899');
    assert(pathaoCourierText.includes('Pathao Courier'), 'Courier card displays Pathao Courier badge');

    const pathaoLink = await evalJs(`document.querySelector('[data-testid="track-order-courier-link"]')?.getAttribute('href') || ''`);
    assert(
      pathaoLink === 'https://merchant.pathao.com/tracking?consignment_id=PTH-778899',
      'External tracking link matches Pathao consignment URL',
      pathaoLink
    );

    await takeScreenshot('track_order_pathao_desktop_1280x800.png');

    // 2.6 Non-Dispatched Order (Honest status, no fake consignment)
    console.log('\n8. Testing Non-Dispatched Order (Honest status)...');
    await evalJs(`
      window.__setReactInput('[data-testid="track-order-input-number"]', 'CNX-ORD-20261014-9997');
      window.__setReactInput('[data-testid="track-order-input-phone"]', '01711122233');
      document.querySelector('[data-testid="track-order-submit-btn"]').click();
    `);
    await sleep(1200);

    const prepText = await evalJs(`document.querySelector('[data-testid="track-order-courier-card"]')?.innerText || ''`);
    assert(
      prepText.includes('Shipment tracking will be available once your order is dispatched'),
      'Displays exact requirement: "Shipment tracking will be available once your order is dispatched"'
    );
    assert(prepText.includes('Your security equipment is currently being verified'), 'Displays honest verification text');
    const fakeLink = await evalJs(`!!document.querySelector('[data-testid="track-order-courier-link"]')`);
    assert(!fakeLink, 'No fake courier tracking link rendered when not dispatched');

    await takeScreenshot('track_order_preparing_desktop_1280x800.png');

    // 2.7 Logged-In Customer Experience
    console.log('\n9. Testing Logged-in Customer 1-Click Tracking...');
    // Log in via customer session
    await evalJs(`
      (async () => {
        // Set mock customer in auth store for UI verification
        const store = window.__CAMNEX_CUSTOMER_AUTH_STORE__ || null;
      })();
    `);
    // Direct login via API inside browser
    const loginSuccess = await evalJs(`
      (async () => {
        try {
          const res = await fetch('/api/auth/customer/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: '01725002672', password: 'Customer@2026!' })
          });
          const d = await res.json();
          return d.success === true;
        } catch (_) {
          return false;
        }
      })()
    `);

    // Reload /tracking to trigger logged-in session check
    await navigateTo('/tracking');

    const hasAuthBanner = await evalJs(`!!document.querySelector('[data-testid="customer-auth-banner"]')`);
    assert(hasAuthBanner, 'Customer banner is displayed for logged-in user');

    const customerBannerText = await evalJs(`document.querySelector('[data-testid="customer-auth-banner"]')?.innerText || ''`);
    assert(customerBannerText.includes('Test Customer'), 'Customer banner displays logged-in user name', customerBannerText);
    assert(customerBannerText.includes('1-Click Tracking Active'), 'Customer banner indicates 1-Click tracking is active');

    const hasRecentOrders = await evalJs(`!!document.querySelector('[data-testid="customer-recent-orders"]')`);
    assert(hasRecentOrders, 'Recent orders list is visible in customer banner');

    // Test 1-click tracking
    console.log('  Testing 1-click tracking button on customer recent order...');
    await evalJs(`document.querySelector('[data-testid="track-recent-order-CNX-ORD-CUST-7701"]')?.click();`);
    await sleep(1200);

    const custResultText = await evalJs(`document.querySelector('[data-testid="track-order-results"]')?.innerText || ''`);
    assert(custResultText.includes('CNX-ORD-CUST-7701'), '1-Click tracking instantly loads CNX-ORD-CUST-7701');
    assert(custResultText.includes('Dahua 5MP TiOC Active Deterrence PTZ Camera'), 'Displays correct hardware for customer order');

    await takeScreenshot('track_order_customer_loggedin_1280x800.png');

    // 2.8 Responsive Viewports
    console.log('\n10. Testing Responsive Viewports...');

    // Tablet: 768x1024
    console.log('  Testing Tablet Viewport (768x1024)...');
    await setViewport(768, 1024);
    await sleep(600);
    const tabletVisible = await evalJs(`document.querySelector('[data-testid="track-order-results"]')?.offsetHeight > 0`);
    assert(tabletVisible, 'Tracking results layout renders properly on Tablet (768x1024)');
    await takeScreenshot('track_order_tablet_768x1024.png');

    // Mobile: 390x844
    console.log('  Testing Mobile Viewport (390x844)...');
    await setViewport(390, 844, true);
    await sleep(600);
    const mobileVisible = await evalJs(`document.querySelector('[data-testid="track-order-results"]')?.offsetHeight > 0`);
    assert(mobileVisible, 'Tracking results layout renders properly on Mobile (390x844)');
    await takeScreenshot('track_order_mobile_390x844.png');

  } finally {
    ws.close();
    edgeProc.kill();
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log(`\n========================================`);
  console.log(`Track Order Acceptance Suite Results:`);
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
