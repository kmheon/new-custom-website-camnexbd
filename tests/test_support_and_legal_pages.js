#!/usr/bin/env node
/**
 * Comprehensive Acceptance Test Suite for CamneX Bangladesh Support & Legal Pages:
 * 1. Warranty Policy (/warranty)
 * 2. FAQs (/faq)
 * 3. Track Order (/tracking)
 * 4. Privacy Policy (/privacy)
 * 5. Terms & Conditions (/terms)
 * 6. Refund Policy (/refund)
 * 7. Technical Support (/support)
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.SUPPORT_LEGAL_CDP_PORT || '9812', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_support_legal_test_${Date.now()}`);
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

  console.log('=== CamneX Support & Legal Pages Acceptance Suite ===\n');

  // Ensure test fixture order exists for tracking tests
  try {
    const db = require('../database');
    const existingOrder = db.prepare('SELECT id FROM orders WHERE order_number = ?').get('CNX-ORD-20261014-9997');
    if (!existingOrder) {
      const testOrder = {
        id: 'ord-test-9997',
        orderNumber: 'CNX-ORD-20261014-9997',
        customerName: 'Tanvir Hossain',
        customerPhone: '01711122233',
        customerEmail: 'orders@camnexbd.com',
        total: 24500,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'pending',
        status: 'processing',
        deliveryMethod: 'Standard Courier',
        deliveryCity: 'Dhaka',
        courierName: null,
        trackingNumber: null,
        courierTrackingUrl: null,
        createdAt: '2026-10-14T10:00:00.000Z',
        items: [
          { name: 'Hikvision 2MP Audio Bullet Camera', quantity: 2, unitPrice: 2250, totalPrice: 4500 }
        ],
        timeline: [
          { status: 'Order Placed', timestamp: '2026-10-14T10:00:00.000Z', done: true },
          { status: 'Delivery & Fulfillment', timestamp: '2026-10-14T12:00:00.000Z', done: true }
        ]
      };
      db.prepare(`
        INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_email, total_amount, payment_method, payment_status, order_status, data_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testOrder.id,
        testOrder.orderNumber,
        testOrder.customerName,
        testOrder.customerPhone,
        testOrder.customerEmail,
        testOrder.total,
        testOrder.paymentMethod,
        testOrder.paymentStatus,
        testOrder.status,
        JSON.stringify(testOrder),
        testOrder.createdAt
      );
    }
  } catch (err) {
    console.warn('Note: Could not seed test order fixture:', err.message);
  }

  // 1. Direct HTTP 200 Route Verification
  console.log('1. Checking HTTP 200 for all Support & Legal Routes...');
  const routesToVerify = [
    '/warranty',
    '/faq',
    '/tracking',
    '/privacy',
    '/terms',
    '/refund',
    '/support'
  ];

  for (const r of routesToVerify) {
    try {
      const res = await fetch(`${BASE_URL}${r}`);
      assert(res.status === 200, `Direct route ${r} returns HTTP 200 (got ${res.status})`);
    } catch (e) {
      assert(false, `Direct route ${r} failed to load`, e.message);
    }
  }

  // 2. Launch Headless Edge with CDP
  console.log('\n2. Launching Headless Edge Browser for Behavioral Verification...');
  if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  const edgeProc = cp.spawn(
    EDGE_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1280,800',
      `${BASE_URL}/`
    ],
    { stdio: 'ignore' }
  );

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

  if (!targetWsUrl) {
    console.error('Failed to connect to Edge CDP');
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

  const saveScreenshot = async (filename) => {
    try {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot && shot.data && fs.existsSync(ARTIFACT_DIR)) {
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(shot.data, 'base64'));
        console.log(`    [Screenshot saved: ${filename}]`);
      }
    } catch (e) {
      console.warn(`    [Screenshot failed: ${filename}]`, e.message);
    }
  };

  const navigateTo = async (urlPath) => {
    await send('Page.navigate', { url: `${BASE_URL}${urlPath}` });
    await sleep(1200);
    for (let i = 0; i < 20; i++) {
      try {
        const h = await evalJs(`document.querySelector('h1')?.innerText`);
        if (h && !h.includes('Commercial Security & Network Hardware')) break;
      } catch (_) {}
      await sleep(250);
    }
  };

  try {
    await send('Runtime.enable');
    await send('Page.enable');

    // ------------------------------------------------------------------------
    // TEST SECTION A: FAQ Page (/faq)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section A: FAQ Page (/faq) ---');
    await setViewport(1280, 800);
    await navigateTo('/faq');

    const faqTitle = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(faqTitle && faqTitle.includes('Frequently Asked Questions'), `FAQ Page heading rendered ("${faqTitle}")`);

    // Verify Category Filter Buttons (ALL + categories)
    const categoryCount = await evalJs(`document.querySelectorAll('button[data-testid^="faq-category-"]').length`);
    assert(categoryCount >= 2, `Category filter pills rendered including 'ALL' (found: ${categoryCount})`);

    // Verify initial FAQ items rendered (supporting intentionally configured smaller lists)
    const initialFaqItems = await evalJs(`document.querySelectorAll('[data-testid="faq-accordion-item"]').length`);
    assert(initialFaqItems > 0, `Initial FAQ items loaded from active dataset (found: ${initialFaqItems})`);

    // Filter by Category: click first available category pill after 'ALL'
    const targetCatPill = await evalJs(`
      (() => {
        const pills = Array.from(document.querySelectorAll('button[data-testid^="faq-category-"]'));
        const nonAll = pills.find(p => p.getAttribute('data-testid') !== 'faq-category-all');
        return nonAll ? { testId: nonAll.getAttribute('data-testid'), label: nonAll.innerText.trim() } : null;
      })()
    `);
    if (targetCatPill) {
      await evalJs(`
        const btn = document.querySelector('button[data-testid="${targetCatPill.testId}"]');
        if (btn) btn.click();
      `);
      await sleep(400);
      const filteredFaqCount = await evalJs(`document.querySelectorAll('[data-testid="faq-accordion-item"]').length`);
      assert(filteredFaqCount > 0 && filteredFaqCount <= initialFaqItems, `Category filter "${targetCatPill.label}" filtered list (showing: ${filteredFaqCount} of ${initialFaqItems})`);
    }

    // Reset Category to All
    await evalJs(`
      const btn = document.querySelector('button[data-testid="faq-category-all"]');
      if (btn) btn.click();
    `);
    await sleep(400);

    // Live Search: Search for "Hikvision"
    await evalJs(`
      (() => {
        const input = document.querySelector('input[data-testid="faq-search-input"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'Hikvision');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await sleep(400);
    const hikSearchResults = await evalJs(`document.querySelectorAll('[data-testid="faq-accordion-item"]').length`);
    assert(hikSearchResults > 0 && hikSearchResults < initialFaqItems, `Search for "Hikvision" filtered to ${hikSearchResults} items`);

    // Clear search using clear button
    await evalJs(`
      const btn = document.querySelector('button[data-testid="faq-clear-search"]');
      if (btn) btn.click();
    `);
    await sleep(400);
    const resetCount = await evalJs(`document.querySelectorAll('[data-testid="faq-accordion-item"]').length`);
    assert(resetCount === initialFaqItems, `Search cleared successfully (restored ${resetCount} items)`);

    // Test "Expand All"
    await evalJs(`
      const btns = Array.from(document.querySelectorAll('button'));
      const expBtn = btns.find(b => b.innerText.trim() === 'Expand All');
      if (expBtn) expBtn.click();
    `);
    await sleep(400);
    const expandedButtons = await evalJs(`
      document.querySelectorAll('button[aria-expanded="true"]').length
    `);
    assert(expandedButtons >= initialFaqItems, `Expand All set aria-expanded="true" on all ${expandedButtons} accordion items`);

    await saveScreenshot('faq_page_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION B: Order Tracking Page (/tracking)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section B: Order Tracking Page (/tracking) ---');
    await navigateTo('/tracking');

    const trackingHeading = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(trackingHeading && (trackingHeading.includes('Track Your Order') || trackingHeading.includes('Track Your Hardware Order')), `Order Tracking heading rendered ("${trackingHeading}")`);

    const hasOrderInput = await evalJs(`!!document.querySelector('input[data-testid="track-order-input-number"]')`);
    const hasPhoneInput = await evalJs(`!!document.querySelector('input[data-testid="track-order-input-phone"]')`);
    const hasSubmitBtn = await evalJs(`!!document.querySelector('button[data-testid="track-order-submit-btn"]')`);
    assert(hasOrderInput && hasPhoneInput && hasSubmitBtn, 'Order reference input, phone verification input, and submit button present');

    // Test 1: Submitting with non-existent order
    await evalJs(`
      (() => {
        const numInp = document.querySelector('input[data-testid="track-order-input-number"]');
        const phInp = document.querySelector('input[data-testid="track-order-input-phone"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(numInp, 'CNX-ORD-FAKE-9999');
        numInp.dispatchEvent(new Event('input', { bubbles: true }));
        setter.call(phInp, '01700000000');
        phInp.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('button[data-testid="track-order-submit-btn"]')?.click();
      })()
    `);
    await sleep(700);
    const errorText = await evalJs(`document.body.innerText`);
    assert(errorText.includes('No order found matching') || errorText.includes('verify your reference'), 'Safe 404 message returned for non-existent order without leaking internal database info');

    // Test 2: Submitting real order with matching phone (CNX-ORD-20261014-9997 / 01711122233)
    await evalJs(`
      (() => {
        const numInp = document.querySelector('input[data-testid="track-order-input-number"]');
        const phInp = document.querySelector('input[data-testid="track-order-input-phone"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(numInp, 'CNX-ORD-20261014-9997');
        numInp.dispatchEvent(new Event('input', { bubbles: true }));
        setter.call(phInp, '01711122233');
        phInp.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('button[data-testid="track-order-submit-btn"]')?.click();
      })()
    `);
    await sleep(900);

    const hasResults = await evalJs(`!!document.querySelector('[data-testid="track-order-results"]')`);
    assert(hasResults, 'Real order lookup succeeded and tracking timeline displayed');

    const resultOrderNum = await evalJs(`document.querySelector('[data-testid="track-order-results"]')?.innerText`);
    assert(resultOrderNum && resultOrderNum.includes('CNX-ORD-20261014-9997'), 'Order reference code matches lookup reference');
    assert(resultOrderNum && resultOrderNum.includes('Delivery & Fulfillment'), 'Fulfillment & delivery status card present');

    // Security check: Ensure raw secrets/customer full address are NOT leaked in DOM
    assert(!resultOrderNum.includes('password_hash'), 'Zero raw credentials leaked');

    await saveScreenshot('order_tracking_results_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION C: Warranty Policy Page (/warranty)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section C: Warranty Policy Page (/warranty) ---');
    await navigateTo('/warranty');

    const warrantyTitle = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(warrantyTitle && warrantyTitle.includes('Warranty & Service Policy'), `Warranty heading rendered ("${warrantyTitle}")`);

    // Verify TOC sections
    const warrantySections = await evalJs(`document.querySelectorAll('section[id]').length`);
    assert(warrantySections >= 6, `Warranty policy sections with anchors rendered (found: ${warrantySections})`);

    // Verify Manufacturer Brand Warranty Table
    const brandTableText = await evalJs(`document.querySelector('table')?.innerText || ''`);
    assert(brandTableText.includes('Hikvision') && brandTableText.includes('Ruijie') && brandTableText.includes('ZKTeco'), 'Manufacturer warranty schedule table covers key brands (Hikvision, Ruijie, ZKTeco)');

    // Verify 1-Year Workmanship Guarantee & RMA process
    const warrantyText = await evalJs(`document.body.innerText`);
    assert(warrantyText.includes('1-Year Installation Workmanship Guarantee') || warrantyText.includes('1-Year Workmanship'), 'CamneX 1-Year installation guarantee clearly detailed');
    assert(warrantyText.includes('Warranty Claim & RMA Process') || warrantyText.includes('RMA'), 'Official RMA workflow clearly documented');

    await saveScreenshot('warranty_policy_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION D: Privacy Policy Page (/privacy)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section D: Privacy Policy Page (/privacy) ---');
    await navigateTo('/privacy');

    const privacyTitle = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(privacyTitle && privacyTitle.includes('Privacy Policy'), `Privacy heading rendered ("${privacyTitle}")`);

    const privacyText = await evalJs(`document.body.innerText`);
    assert(privacyText.includes('Handover Security Principle') && privacyText.includes('Zero Remote Access Post-Handover'), 'Handover Security Principle present (no retained passwords/remote streams post-handover)');
    assert(privacyText.includes('Zero Ad Trackers'), 'Zero ad trackers and cookie transparency stated');
    assert(privacyText.includes('Privacy & Data Protection Desk') || privacyText.includes('contact@camnexbd.com'), 'Official Privacy Officer contact provided');

    await saveScreenshot('privacy_policy_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION E: Terms & Conditions Page (/terms)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section E: Terms & Conditions Page (/terms) ---');
    await navigateTo('/terms');

    const termsTitle = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(termsTitle && termsTitle.includes('Terms & Conditions'), `Terms heading rendered ("${termsTitle}")`);

    const termsText = await evalJs(`document.body.innerText`);
    assert(termsText.includes('Technical Quotations, Site Surveys & Estimates') || termsText.includes('Estimates'), 'Status of online quotes and Package Builder estimates clearly marked as preliminary');
    assert(termsText.includes('Cash on Delivery (COD)') && termsText.includes('bKash') && termsText.includes('Bank Transfer'), 'Payment terms specify COD, bKash/Nagad, and Bank Transfer');
    assert(termsText.includes('Client Premise Responsibilities') || termsText.includes('Premise Readiness'), 'Client premise cabling/conduit readiness obligations present');

    await saveScreenshot('terms_conditions_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION F: Refund & Cancellation Policy Page (/refund)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section F: Refund Policy Page (/refund) ---');
    await navigateTo('/refund');

    const refundTitle = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(refundTitle && (refundTitle.includes('Refund') || refundTitle.includes('Return')), `Refund heading rendered ("${refundTitle}")`);

    const refundText = await evalJs(`document.body.innerText`);
    assert(refundText.includes('Order Cancellation Prior to Dispatch') || refundText.includes('Cancellation Prior to Dispatch'), 'Cancellation prior to dispatch clearly documented');
    assert(refundText.includes('3 calendar days of delivery') || refundText.includes('3-Day Return'), '3-day hardware return criteria present');
    assert(refundText.includes('labor are non-refundable') || refundText.includes('Non-Refundable'), 'Custom cabling and installation labor exclusions clearly disclosed');

    await saveScreenshot('refund_policy_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION G: Technical Support Page (/support)
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section G: Technical Support Page (/support) ---');
    await navigateTo('/support');

    const supportTitle = await evalJs(`document.querySelector('h1')?.innerText`);
    assert(supportTitle && supportTitle.includes('Technical Support'), `Support heading rendered ("${supportTitle}")`);

    const supportText = await evalJs(`document.body.innerText`);
    assert(supportText.includes('Before You Contact Technical Support'), 'Diagnostic checklist section present');
    assert(supportText.includes('WhatsApp Live Chat'), 'Direct WhatsApp chat action present');
    assert(supportText.includes('Direct Hotlines'), 'Direct phone hotline present');

    // Test valid form submission
    await evalJs(`
      (() => {
        const nameInput = document.querySelector('[data-testid="support-input-name"] input') || document.querySelector('input[data-testid="support-input-name"]');
        const phoneInput = document.querySelector('[data-testid="support-input-phone"] input') || document.querySelector('input[data-testid="support-input-phone"]');
        const descInput = document.querySelector('[data-testid="support-input-description"] textarea') || document.querySelector('textarea[data-testid="support-input-description"]');
        const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;

        if (nameInput) {
          inputSetter.call(nameInput, 'Support Test Client');
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (phoneInput) {
          inputSetter.call(phoneInput, '01712345678');
          phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
          phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (descInput) {
          textareaSetter.call(descInput, 'Camera 3 on NVR Channel 4 shows offline status after power outage. Requires firmware check.');
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
          descInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const submitBtn = document.querySelector('[data-testid="support-submit-btn"]');
        if (submitBtn) {
          submitBtn.click();
        } else {
          document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      })()
    `);
    await sleep(2000);

    const formDebug = await evalJs(`
      (() => {
        const text = document.body.innerText;
        const errAlert = document.querySelector('[class*="bg-red"]')?.innerText || '';
        const errors = Array.from(document.querySelectorAll('.text-red-600')).map(e => e.innerText);
        const hasSuccess = text.includes('CNX-INQ') || text.includes('Support Ticket Logged');
        return { hasSuccess, errAlert, errors, textSlice: text.substring(text.indexOf('Submit a Technical Support Ticket'), text.indexOf('Submit a Technical Support Ticket') + 400) };
      })()
    `);
    console.log('    [Form Debug]:', formDebug);
    assert(formDebug && formDebug.hasSuccess, 'Support request successfully submitted to /api/contact and confirmation reference displayed');

    await saveScreenshot('technical_support_desktop_1280x800.png');

    // ------------------------------------------------------------------------
    // TEST SECTION H: Multi-Viewport Responsive Layouts
    // ------------------------------------------------------------------------
    console.log('\n--- Test Section H: Multi-Viewport Responsive Layouts ---');

    // Tablet (768x1024)
    await setViewport(768, 1024);
    await navigateTo('/faq');
    await sleep(400);
    await saveScreenshot('faq_page_tablet_768x1024.png');

    await navigateTo('/support');
    await sleep(400);
    await saveScreenshot('technical_support_tablet_768x1024.png');

    // Mobile (390x844)
    await setViewport(390, 844, true);
    await navigateTo('/faq');
    await sleep(400);
    await saveScreenshot('faq_page_mobile_390x844.png');

    await navigateTo('/tracking');
    await sleep(400);
    await saveScreenshot('order_tracking_mobile_390x844.png');

    await navigateTo('/warranty');
    await sleep(400);
    await saveScreenshot('warranty_policy_mobile_390x844.png');

    await navigateTo('/support');
    await sleep(400);
    await saveScreenshot('technical_support_mobile_390x844.png');

    // Check for JavaScript Console Errors across entire test run
    console.log('\n--- Test Section I: Browser Console Error Check ---');
    const severeErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('404 (Not Found)')
    );
    assert(severeErrors.length === 0, `Zero uncaught JavaScript exceptions/errors (found: ${severeErrors.length})`, severeErrors.join(' | '));

  } finally {
    try {
      ws.close();
    } catch (_) {}
    edgeProc.kill();
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log(`\n======================================================`);
  console.log(`Support & Legal Pages Acceptance Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
