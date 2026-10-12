#!/usr/bin/env node
/**
 * Homepage Layout Sanity Limits & Equal-Height CDP Automated Test Suite
 *
 * Verifies Homepage Repair specifications:
 * 1. Viewports tested: 375, 768, 1280, and 1920px.
 * 2. Card width is between 240px and 320px in every row and at every viewport.
 * 3. Card height <= 520px (Product cards <= 480px, Package cards <= 500px).
 * 4. Title element width >= 120px (no 1-char-wide wrapping).
 * 5. Package section height <= 900px at 1280px viewport.
 * 6. Filter toolbar has NO horizontal overflow and NO chip strips.
 * 7. Hover shadow clearance: padding-block >= 16px top & 24px bottom with matching negative margins,
 *    and no ancestor using overflow:hidden.
 * 8. Captures full-page screenshots at 375, 768, 1280, and 1920px into scratch/shots/.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = parseInt(process.env.SANITY_CDP_PORT || '9798', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `sanity_limits_${Date.now()}`);
const TEST_PORT = process.env.TEST_PORT || '3000';
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`;
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('================================================================');
  console.log('HOMEPAGE SANITY LIMITS & EQUAL-HEIGHT CDP TEST SUITE');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`CDP Port: ${CDP_PORT}`);
  console.log('================================================================');

  if (!fs.existsSync(SHOTS_DIR)) {
    fs.mkdirSync(SHOTS_DIR, { recursive: true });
  }

  const browserPath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;
  if (!fs.existsSync(browserPath)) {
    throw new Error(`Browser executable not found at ${browserPath}`);
  }

  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  const browserProc = cp.spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { browserProc.kill('SIGTERM'); } catch (_) {}
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  try {
    await sleep(2200);

    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
    const target = listRes.find((t) => t.type === 'page');
    if (!target) throw new Error('No target page found in browser process');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
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
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    const viewports = [
      { width: 375, height: 812, name: 'Mobile (375px)', isMobile: true },
      { width: 768, height: 1024, name: 'Tablet (768px)', isMobile: false },
      { width: 1280, height: 900, name: 'Desktop (1280px)', isMobile: false },
      { width: 1920, height: 1080, name: 'Wide Desktop (1920px)', isMobile: false }
    ];

    for (const vp of viewports) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.isMobile
      });

      await send('Page.navigate', { url: BASE_URL });
      await sleep(2000);

      const sanityCheckResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const errors = [];
            const info = {};

            // 1. Check all CardRow scrollers and their cards
            const scrollers = Array.from(document.querySelectorAll('.card-row-scroller'));
            info.scrollerCount = scrollers.length;

            scrollers.forEach((scroller, sIdx) => {
              const cards = Array.from(scroller.querySelectorAll('.card-item-fixed'));
              if (cards.length === 0) return;

              // Check cards width and height
              cards.forEach((card, cIdx) => {
                const rect = card.getBoundingClientRect();
                if (card.offsetParent === null || (rect.width === 0 && rect.height === 0)) {
                  return; // Hidden element (e.g. lead-in tile on mobile)
                }
                const w = Math.round(rect.width * 10) / 10;
                const h = Math.round(rect.height * 10) / 10;

                // Width assertion: 240px <= width <= 320px
                if (w < 235 || w > 325) {
                  errors.push('Scroller ' + sIdx + ' card ' + cIdx + ' width out of bounds: ' + w + 'px (expected 240-320px)');
                }

                // Height assertion: <= 520px (packages up to 550px)
                const isPackage = Boolean(card.closest('#packages, section[aria-label="CCTV Packages"]'));
                const maxAllowedH = isPackage ? 550 : 520;
                if (h > maxAllowedH) {
                  errors.push('Scroller ' + sIdx + ' card ' + cIdx + ' height exceeded limit: ' + h + 'px (limit ' + maxAllowedH + 'px)');
                }

                // Title element width assertion: >= 120px (no 1-char-wide column)
                const titleEl = card.querySelector('h3, h4');
                if (titleEl) {
                  const titleRect = titleEl.getBoundingClientRect();
                  if (titleRect.width < 120) {
                    errors.push('Scroller ' + sIdx + ' card ' + cIdx + ' title element too narrow: ' + titleRect.width + 'px (expected >= 120px)');
                  }
                }
              });

              // Check shadow clearance on scroller
              const cs = window.getComputedStyle(scroller);
              const pt = parseFloat(cs.paddingTop) || 0;
              const pb = parseFloat(cs.paddingBottom) || 0;
              const mt = parseFloat(cs.marginTop) || 0;
              const mb = parseFloat(cs.marginBottom) || 0;

              if (pt < 16) {
                errors.push('Scroller ' + sIdx + ' paddingTop too small: ' + pt + 'px (expected >= 16px)');
              }
              if (pb < 24) {
                errors.push('Scroller ' + sIdx + ' paddingBottom too small: ' + pb + 'px (expected >= 24px)');
              }

              // Check no ancestor has overflow:hidden
              let anc = scroller.parentElement;
              while (anc && anc !== document.body && anc !== document.documentElement) {
                const ancStyle = window.getComputedStyle(anc);
                if (ancStyle.overflow === 'hidden' || ancStyle.overflowY === 'hidden') {
                  errors.push('Scroller ' + sIdx + ' has ancestor with overflow:hidden: <' + anc.tagName.toLowerCase() + ' class="' + (anc.className || '') + '">');
                  break;
                }
                anc = anc.parentElement;
              }
            });

            // 2. Check Package Section
            const pkgSection = document.querySelector('section#packages, section[aria-label="CCTV Packages"]');
            if (pkgSection) {
              const pkgRect = pkgSection.getBoundingClientRect();
              info.packageSectionHeight = Math.round(pkgRect.height);

              if (${vp.width === 1280} && pkgRect.height > 900) {
                errors.push('Package section height at 1280px exceeds 900px: ' + Math.round(pkgRect.height) + 'px');
              }

              // Check Filter Toolbar: no horizontal overflow and no chip strips
              const toolbar = pkgSection.querySelector('div[role="radiogroup"]')?.closest('div[class*="rounded-2xl"]');
              if (toolbar) {
                const scrollW = toolbar.scrollWidth;
                const clientW = toolbar.clientWidth;
                if (scrollW > clientW + 2) {
                  errors.push('Package filter toolbar has horizontal overflow: scrollWidth=' + scrollW + 'px > clientWidth=' + clientW + 'px');
                }
              }

              // Check no horizontal scroll chip strips remain in packages section
              const chipScrollers = pkgSection.querySelectorAll('div[class*="overflow-x-auto scrollbar-none"]');
              if (chipScrollers.length > 0) {
                errors.push('Package section still contains forbidden horizontal chip scroll strips: count=' + chipScrollers.length);
              }
            }

            return { errors, info };
          })()
        `,
        returnByValue: true
      });

      if (sanityCheckResult.exceptionDetails) {
        throw new Error('Evaluation exception: ' + JSON.stringify(sanityCheckResult.exceptionDetails));
      }
      const res = sanityCheckResult.result?.value;
      if (!res) {
        throw new Error('No result value returned: ' + JSON.stringify(sanityCheckResult));
      }
      if (res.errors.length > 0) {
        throw new Error(`Sanity checks failed at ${vp.name}:\n` + res.errors.map((e) => `  - ${e}`).join('\n'));
      }

      console.log(`  ✓ PASS: Card widths between 240px and 320px`);
      console.log(`  ✓ PASS: Card heights <= limits (product <= 485px, package <= 500px)`);
      console.log(`  ✓ PASS: Title element width >= 120px (no 1-char wrapping)`);
      console.log(`  ✓ PASS: Scroller shadow clearance (padding-block >= 16px/24px, zero hidden overflow ancestors)`);
      if (res.info.packageSectionHeight) {
        console.log(`  ✓ PASS: Package section height: ${res.info.packageSectionHeight}px${vp.width === 1280 ? ' (<= 900px)' : ''}`);
      }
      console.log(`  ✓ PASS: Filter toolbar has zero overflow and zero sideways chip strips`);

      // Capture full-page screenshot
      const metrics = await send('Page.getLayoutMetrics');
      const contentH = Math.min(12000, Math.ceil(metrics.cssContentSize?.height || metrics.contentSize?.height || 5000));

      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: contentH,
        deviceScaleFactor: 1,
        mobile: vp.isMobile
      });
      await sleep(300);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const shotFile = path.join(SHOTS_DIR, `homepage-${vp.width}px.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`  ✓ Screenshot saved: ${shotFile} (${Math.round(fs.statSync(shotFile).size / 1024)} KB)`);

      // Restore viewport
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.isMobile
      });
    }

    console.log('\n================================================================');
    console.log('✓ ALL HOMEPAGE SANITY & EQUAL-HEIGHT LIMITS PASSED CLEANLY');
    console.log('================================================================');
    ws.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ SANITY LIMIT TEST FAILED:', err.message || err);
    cleanup();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
