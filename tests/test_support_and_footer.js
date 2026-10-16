#!/usr/bin/env node
/**
 * Test Suite for CamneX Bangladesh Support Navigation & Footer Refinements:
 * 1. Desktop Support dropdown has exactly 4 items:
 *    - Warranty Policy (/warranty)
 *    - Technical Support (/contact)
 *    - FAQs (/faq)
 *    - Track Order (/tracking)
 * 2. Duplicate "Contact Us" is removed from Support dropdown (since Contact is prominent elsewhere).
 * 3. Mobile menu drawer contains Support accordion with the same 4 items.
 * 4. Footer contains legal links:
 *    - Privacy Policy (/privacy)
 *    - Terms & Conditions (/terms)
 *    - Refund Policy (/refund)
 * 5. Verify all routes exist, render content without 404 or JS runtime errors.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.SUPPORT_CDP_PORT || '9796', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_support_test_${Date.now()}`);
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

  console.log('=== CamneX Support Navigation & Footer Acceptance Suite ===\n');

  // 1. Direct HTTP 200 Route Verification
  console.log('1. Checking HTTP 200 for Support & Policy Routes');
  const routesToVerify = [
    '/warranty',
    '/faq',
    '/tracking',
    '/contact',
    '/support',
    '/privacy',
    '/terms',
    '/refund'
  ];

  for (const r of routesToVerify) {
    try {
      const res = await fetch(`${BASE_URL}${r}`);
      assert(res.status === 200, `Direct route ${r} returns HTTP 200 (got ${res.status})`);
    } catch (e) {
      assert(false, `Direct route ${r} failed to load`, e.message);
    }
  }

  // 2. Launch Headless Edge with desktop window size and initial homepage URL
  console.log('\n2. Launching Browser for Desktop and Mobile Interaction Verification...');
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

  const saveScreenshot = async (filename) => {
    try {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot && shot.data && fs.existsSync(ARTIFACT_DIR)) {
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(shot.data, 'base64'));
        console.log(`  [Screenshot saved: ${filename}]`);
      }
    } catch (err) {
      console.error(`  [Screenshot error: ${err.message}]`);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(2500);

  try {
    // 3. Desktop Header Support Dropdown
    console.log('\n3. Testing Desktop Header Support Dropdown');
    const supportBtnExists = await evalJs(`Boolean(document.querySelector('[data-testid="nav-support-button"]'))`);
    assert(supportBtnExists, 'Header renders desktop Support dropdown button');

    // Click Support button to toggle dropdown open
    await evalJs(`document.querySelector('[data-testid="nav-support-button"]').click()`);
    await sleep(400);

    const dropdownReport = await evalJs(`(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="nav-support-warranty"], [data-testid="nav-support-technical"], [data-testid="nav-support-faq"], [data-testid="nav-support-tracking"]')).map(el => ({
        testid: el.getAttribute('data-testid'),
        text: el.textContent.trim()
      }));
      const allSupportBtns = Array.from(document.querySelectorAll('[data-testid^="nav-support-"]')).map(el => el.textContent.trim());
      return {
        items,
        allSupportBtns,
        hasContactUs: allSupportBtns.some(t => t.toLowerCase() === 'contact us')
      };
    })()`);

    assert(dropdownReport.items.length === 4, `Support dropdown has exactly 4 items (got ${dropdownReport.items.length})`);
    assert(dropdownReport.items.some(i => i.testid === 'nav-support-warranty' && i.text === 'Warranty Policy'), 'Contains "Warranty Policy"');
    assert(dropdownReport.items.some(i => i.testid === 'nav-support-technical' && i.text === 'Technical Support'), 'Contains "Technical Support"');
    assert(dropdownReport.items.some(i => i.testid === 'nav-support-faq' && i.text === 'FAQs'), 'Contains "FAQs"');
    assert(dropdownReport.items.some(i => i.testid === 'nav-support-tracking' && i.text === 'Track Order'), 'Contains "Track Order"');
    assert(!dropdownReport.hasContactUs, 'Duplicate "Contact Us" is removed from Support dropdown');

    await saveScreenshot('support_dropdown_desktop.png');

    // Test clicking Warranty Policy
    console.log('\n4. Testing Support navigation destinations from desktop dropdown');
    await evalJs(`document.querySelector('[data-testid="nav-support-warranty"]').click()`);
    await sleep(800);
    let navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/warranty', `Clicking Warranty Policy navigates to /warranty (got ${navState.path})`);
    assert(navState.h1.includes('Warranty'), `Warranty page renders heading: "${navState.h1}"`);

    // Open Support again and click Technical Support
    await evalJs(`document.querySelector('[data-testid="nav-support-button"]').click()`);
    await sleep(400);
    await evalJs(`document.querySelector('[data-testid="nav-support-technical"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/contact', `Clicking Technical Support navigates to /contact (got ${navState.path})`);
    assert(navState.h1.includes('Contact'), `Technical Support renders heading: "${navState.h1}"`);

    // Open Support again and click FAQs
    await evalJs(`document.querySelector('[data-testid="nav-support-button"]').click()`);
    await sleep(400);
    await evalJs(`document.querySelector('[data-testid="nav-support-faq"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/faq', `Clicking FAQs navigates to /faq (got ${navState.path})`);
    assert(navState.h1.includes('Frequently Asked Questions'), `FAQ page renders heading: "${navState.h1}"`);

    // Open Support again and click Track Order
    await evalJs(`document.querySelector('[data-testid="nav-support-button"]').click()`);
    await sleep(400);
    await evalJs(`document.querySelector('[data-testid="nav-support-tracking"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/tracking', `Clicking Track Order navigates to /tracking (got ${navState.path})`);
    assert(navState.h1.includes('Track'), `Track Order renders heading: "${navState.h1}"`);

    // 5. Footer Legal Links Verification
    console.log('\n5. Testing Footer Legal Links (Privacy, Terms & Conditions, Refund Policy)');
    await evalJs(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(500);

    const legalReport = await evalJs(`(() => {
      const p = document.querySelector('[data-testid="footer-legal-privacy"]');
      const t = document.querySelector('[data-testid="footer-legal-terms"]');
      const r = document.querySelector('[data-testid="footer-legal-refund"]');
      return {
        privacy: { exists: Boolean(p), text: p?.textContent?.trim() },
        terms: { exists: Boolean(t), text: t?.textContent?.trim() },
        refund: { exists: Boolean(r), text: r?.textContent?.trim() }
      };
    })()`);

    assert(legalReport.privacy.exists && legalReport.privacy.text === 'Privacy Policy', 'Footer has "Privacy Policy" legal link');
    assert(legalReport.terms.exists && legalReport.terms.text === 'Terms & Conditions', 'Footer has "Terms & Conditions" legal link');
    assert(legalReport.refund.exists && legalReport.refund.text === 'Refund Policy', 'Footer has "Refund Policy" legal link');

    // Click Terms & Conditions in footer
    await evalJs(`document.querySelector('[data-testid="footer-legal-terms"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/terms', `Clicking Terms & Conditions in footer navigates to /terms (got ${navState.path})`);
    assert(navState.h1.includes('Terms & Conditions'), `Terms & Conditions renders heading: "${navState.h1}"`);

    // Click Refund Policy in footer
    await evalJs(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(300);
    await evalJs(`document.querySelector('[data-testid="footer-legal-refund"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/refund', `Clicking Refund Policy in footer navigates to /refund (got ${navState.path})`);
    assert(navState.h1.includes('Return & Refund Policy'), `Refund Policy renders heading: "${navState.h1}"`);

    // Click Privacy Policy in footer
    await evalJs(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(300);
    await evalJs(`document.querySelector('[data-testid="footer-legal-privacy"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/privacy', `Clicking Privacy Policy in footer navigates to /privacy (got ${navState.path})`);
    assert(navState.h1.includes('Privacy Policy'), `Privacy Policy renders heading: "${navState.h1}"`);

    await saveScreenshot('footer_legal_desktop.png');

    // 6. Mobile Drawer Support Accordion Verification
    console.log('\n6. Testing Mobile Drawer Support Accordion (390x844)');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await evalJs(`window.location.href = '/'`);
    await sleep(2000);

    // Open Mobile Drawer via hamburger menu button
    const openedMenu = await evalJs(`(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const hamburger = btns.find(b => b.querySelector('svg.lucide-menu') || b.getAttribute('aria-label') === 'Open menu');
      if (hamburger) {
        hamburger.click();
        return true;
      }
      return false;
    })()`);
    assert(openedMenu, 'Opened mobile navigation drawer via hamburger button');
    await sleep(600);

    // Check Support accordion button exists in mobile drawer
    const mobileSupportExists = await evalJs(`Boolean(document.querySelector('[data-testid="mobile-nav-support-button"]'))`);
    assert(mobileSupportExists, 'Mobile drawer renders Support accordion button');

    // Click Support accordion to expand
    await evalJs(`document.querySelector('[data-testid="mobile-nav-support-button"]').click()`);
    await sleep(400);

    // Verify the 4 customer-help items
    const mobileReport = await evalJs(`(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="mobile-nav-support-warranty"], [data-testid="mobile-nav-support-technical"], [data-testid="mobile-nav-support-faq"], [data-testid="mobile-nav-support-tracking"]')).map(el => ({
        testid: el.getAttribute('data-testid'),
        text: el.textContent.trim()
      }));
      return items;
    })()`);

    assert(mobileReport.length === 4, `Mobile Support accordion contains exactly 4 items (got ${mobileReport.length})`);
    assert(mobileReport.some(i => i.testid === 'mobile-nav-support-warranty' && i.text === 'Warranty Policy'), 'Mobile Support has "Warranty Policy"');
    assert(mobileReport.some(i => i.testid === 'mobile-nav-support-technical' && i.text === 'Technical Support'), 'Mobile Support has "Technical Support"');
    assert(mobileReport.some(i => i.testid === 'mobile-nav-support-faq' && i.text === 'FAQs'), 'Mobile Support has "FAQs"');
    assert(mobileReport.some(i => i.testid === 'mobile-nav-support-tracking' && i.text === 'Track Order'), 'Mobile Support has "Track Order"');

    await saveScreenshot('support_accordion_mobile_390x844.png');

    // Click mobile Warranty Policy link
    await evalJs(`document.querySelector('[data-testid="mobile-nav-support-warranty"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/warranty', `Mobile Warranty click navigated to /warranty (got ${navState.path})`);
    assert(navState.h1.includes('Warranty'), `Mobile rendered Warranty heading: "${navState.h1}"`);

    // 7. Verify Company navigation remains intact
    console.log('\n7. Verifying Company direct navigation remains intact');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await evalJs(`window.location.href = '/'`);
    await sleep(1500);

    await evalJs(`document.querySelector('[data-testid="nav-company-link"]').click()`);
    await sleep(800);
    navState = await evalJs(`({ path: window.location.pathname, h1: document.querySelector('h1')?.textContent?.trim() || '' })`);
    assert(navState.path === '/company-profile', `Clicking Company navigates directly to /company-profile (got ${navState.path})`);

    // Verify no unexpected console errors
    const seriousErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404 (Not Found)'));
    assert(seriousErrors.length === 0, `No JavaScript runtime errors encountered (found: ${seriousErrors.length})`, seriousErrors.join('; '));

  } finally {
    ws.close();
    edgeProc.kill();
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});

