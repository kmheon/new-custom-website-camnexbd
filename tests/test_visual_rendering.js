#!/usr/bin/env node
/**
 * CamneX Platform - Real Visual Computed Style Test Suite
 *
 * Launches headless Edge/Chrome via DevTools Protocol (CDP) to load:
 * 1. Homepage (/)
 * 2. Product Detail Page (/product/prod-hik-irpf-2mp)
 * 3. Cart Page (/cart)
 * 4. Checkout Page (/checkout)
 * 5. Admin Dashboard (/admin)
 *
 * For EVERY page, evaluates computed styles in the live DOM and asserts:
 * 1. window.getComputedStyle(document.body).backgroundColor is rgb(250, 247, 242) (#FAF7F2)
 * 2. header element computed position is "sticky" or "fixed"
 * 3. At least one button or call-to-action has computed border-radius >= 9999px or >= 24px (pill token)
 * 4. Zero <img> elements are wider than their container element (no giant unstyled image blowouts)
 * 5. document.styleSheets contains the content-hashed CSS bundle file (/dist/bundle.*.css)
 * 6. Zero network requests return 4xx/5xx status codes for CSS, JS, fonts, or images.
 *
 * Fails loudly with exit code 1 if ANY page is unstyled or fails assertions.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.VISUAL_CDP_PORT || '9780', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_visual_test_${Date.now()}`);
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeColor(rgbStr) {
  if (!rgbStr) return '';
  return rgbStr.replace(/\s+/g, '');
}

async function runVisualTests() {
  console.log('================================================================');
  console.log('RUNNING REAL VISUAL COMPUTED STYLE TESTS (Headless Edge CDP)');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`CDP Port: ${CDP_PORT}`);
  console.log('================================================================');

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  const edgeProc = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ], {
    stdio: 'ignore'
  });

  await sleep(2000);

  let ws = null;
  const failedRequests = [];

  try {
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(r => r.json());
    const target = listRes.find(t => t.type === 'page');
    if (!target) throw new Error('No target page found in Edge process');

    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
      } else if (msg.method === 'Network.responseReceived') {
        const resp = msg.params.response;
        const url = resp.url || '';
        const isAsset = url.match(/\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)(\?.*)?$/i) ||
                        url.includes('/dist/') || url.includes('/api/');
        if (isAsset && resp.status >= 400) {
          failedRequests.push({
            url,
            status: resp.status,
            statusText: resp.statusText
          });
        }
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Enable domains
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    const pagesToTest = [
      { name: 'Homepage', path: '/' },
      { name: 'Product Detail', path: '/product/prod-hik-irpf-2mp' },
      { name: 'Cart', path: '/cart' },
      { name: 'Checkout', path: '/checkout' },
      { name: 'Admin Dashboard', path: '/admin' }
    ];

    let overallSuccess = true;

    for (const page of pagesToTest) {
      const targetUrl = `${BASE_URL}${page.path}`;
      console.log(`\n------------------------------------------------------------`);
      console.log(`Testing Visual Rendering: ${page.name} (${targetUrl})`);
      console.log(`------------------------------------------------------------`);

      const initialFailedCount = failedRequests.length;

      // Navigate to page
      await send('Page.navigate', { url: targetUrl });
      await sleep(2000); // Allow React SPA mounting & stylesheet application

      // Evaluate computed styles and DOM properties
      const evalResp = await send('Runtime.evaluate', {
        expression: `(() => {
          const bodyBg = window.getComputedStyle(document.body).backgroundColor;
          
          // Header element
          const header = document.querySelector('header');
          const headerPos = header ? window.getComputedStyle(header).position : null;

          // Buttons and pill CTAs
          const buttons = Array.from(document.querySelectorAll('button, a[role="button"], a.rounded-full, button.rounded-full'));
          let hasRoundedPillButton = false;
          let maxButtonBorderRadius = 0;
          for (const b of buttons) {
            const br = parseFloat(window.getComputedStyle(b).borderTopLeftRadius) || 0;
            if (br > maxButtonBorderRadius) maxButtonBorderRadius = br;
            if (br >= 24) {
              hasRoundedPillButton = true;
            }
          }

          // Check all images for overflow relative to parent container
          const imgs = Array.from(document.querySelectorAll('img'));
          const overflowingImages = [];
          for (const img of imgs) {
            const rect = img.getBoundingClientRect();
            const parent = img.parentElement;
            if (parent && rect.width > 0) {
              const parentRect = parent.getBoundingClientRect();
              if (rect.width > parentRect.width + 3) {
                overflowingImages.push({
                  src: img.src,
                  imgWidth: Math.round(rect.width),
                  parentWidth: Math.round(parentRect.width)
                });
              }
            }
          }

          // Check stylesheets in document.styleSheets
          const styleSheets = Array.from(document.styleSheets);
          let hasHashedCss = false;
          const hrefs = [];
          for (const s of styleSheets) {
            if (s.href) {
              hrefs.push(s.href);
              if (s.href.includes('/dist/bundle.') && s.href.endsWith('.css')) {
                hasHashedCss = true;
              }
            }
          }

          return {
            bodyBg,
            headerPos,
            hasRoundedPillButton,
            maxButtonBorderRadius,
            buttonCount: buttons.length,
            imgCount: imgs.length,
            overflowingImages,
            hasHashedCss,
            styleSheetHrefs: hrefs
          };
        })()`,
        returnByValue: true
      });

      if (evalResp.exceptionDetails) {
        console.error('Exception during evaluate:', evalResp.exceptionDetails);
      }
      const metrics = evalResp.result?.value;
      if (!metrics) {
        console.error('✗ FAILED: Unable to evaluate computed styles on page! evalResp:', JSON.stringify(evalResp));
        overallSuccess = false;
        continue;
      }

      console.log(`  Computed body background: ${metrics.bodyBg}`);
      console.log(`  Computed header position: ${metrics.headerPos}`);
      console.log(`  Pill button (radius >= 24px): ${metrics.hasRoundedPillButton} (Max radius: ${metrics.maxButtonBorderRadius}px)`);
      console.log(`  Total images: ${metrics.imgCount}, Overflowing images: ${metrics.overflowingImages.length}`);
      console.log(`  Hashed CSS bundle found: ${metrics.hasHashedCss}`);

      // 1. Assert body background-color is #FAF7F2 (rgb(250, 247, 242))
      const normalizedBg = normalizeColor(metrics.bodyBg);
      const isWarmBg = normalizedBg === 'rgb(250,247,242)' || normalizedBg === '#faf7f2';
      if (!isWarmBg) {
        console.error(`  ✗ FAIL: body background-color is "${metrics.bodyBg}", expected rgb(250, 247, 242) (#FAF7F2)`);
        overallSuccess = false;
      } else {
        console.log(`  ✓ PASS: body background-color matches token #FAF7F2`);
      }

      // 2. Assert header position is sticky or fixed
      const isStickyOrFixed = metrics.headerPos === 'sticky' || metrics.headerPos === 'fixed';
      if (!isStickyOrFixed) {
        console.error(`  ✗ FAIL: header position is "${metrics.headerPos}", expected sticky or fixed`);
        overallSuccess = false;
      } else {
        console.log(`  ✓ PASS: header position is ${metrics.headerPos}`);
      }

      // 3. Assert at least one button has border-radius >= 9999px or 24px+
      if (!metrics.hasRoundedPillButton) {
        console.error(`  ✗ FAIL: No button with border-radius >= 24px or 9999px found (max: ${metrics.maxButtonBorderRadius}px)`);
        overallSuccess = false;
      } else {
        console.log(`  ✓ PASS: Pill button found with border-radius >= 24px`);
      }

      // 4. Assert no <img> is wider than its container
      if (metrics.overflowingImages.length > 0) {
        console.error(`  ✗ FAIL: ${metrics.overflowingImages.length} image(s) exceed parent container bounds!`, metrics.overflowingImages);
        overallSuccess = false;
      } else {
        console.log(`  ✓ PASS: Zero images exceeding container width`);
      }

      // 5. Assert document.styleSheets contains the hashed CSS file
      if (!metrics.hasHashedCss) {
        console.error(`  ✗ FAIL: document.styleSheets does not contain hashed CSS bundle! Active sheets:`, metrics.styleSheetHrefs);
        overallSuccess = false;
      } else {
        console.log(`  ✓ PASS: document.styleSheets contains active hashed CSS bundle`);
      }

      // 6. Assert no 4xx/5xx requests for assets on this page
      const pageFailedRequests = failedRequests.slice(initialFailedCount);
      if (pageFailedRequests.length > 0) {
        console.error(`  ✗ FAIL: ${pageFailedRequests.length} asset request(s) failed with 4xx/5xx:`, pageFailedRequests);
        overallSuccess = false;
      } else {
        console.log(`  ✓ PASS: Zero 4xx/5xx failed asset requests`);
      }
    }

    if (!overallSuccess) {
      throw new Error('One or more pages failed real visual computed style assertions!');
    }

    console.log('\n================================================================');
    console.log('✓ ALL REAL VISUAL COMPUTED STYLE TESTS PASSED (100% Styled)');
    console.log('================================================================\n');

  } finally {
    if (ws) {
      try { ws.close(); } catch (_) {}
    }
    if (edgeProc) {
      try { edgeProc.kill('SIGTERM'); } catch (_) {}
    }
    await sleep(500);
    try {
      if (fs.existsSync(USER_DATA_DIR)) {
        fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}

if (require.main === module) {
  runVisualTests().catch((err) => {
    console.error('[VISUAL TEST SUITE ERROR]', err.message);
    process.exit(1);
  });
}

module.exports = { runVisualTests };
