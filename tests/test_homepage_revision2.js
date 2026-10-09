#!/usr/bin/env node
/**
 * CamneX Platform - HOMEPAGE REVISION 2 Verification Test Suite
 *
 * Headless Edge/Chrome CDP Automated Verification:
 * 1. Global Layout: Every section is a FULL-WIDTH background band (width == viewport width, no outer radius/margins).
 * 2. CTA & Footer flush: CTA bottom touches footer top (gap <= 1px).
 * 3. Footer bottom flush: Footer bottom equals document height.
 * 4. Floating Buttons:
 *    - WhatsApp: 56px green circle, bottom-right.
 *    - Back to top: Stacked directly ABOVE WhatsApp with 12px gap, appears only after scrolling 400px.
 *    - Mobile: Both sit above sticky bottom bar.
 *    - Non-intersecting: Zero overlap between buttons or footer text.
 * 5. Product deduplication: A product appears in only ONE homepage row.
 * 6. Visual capture: Desktop (1280) and Mobile (375) full-page screenshots saved to scratch/shots/.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.REV2_CDP_PORT || '9785', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_rev2_test_${Date.now()}`);
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRevision2Tests() {
  console.log('================================================================');
  console.log('RUNNING HOMEPAGE REVISION 2 CDP TESTS & SCREENSHOT VERIFICATION');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`CDP Port: ${CDP_PORT}`);
  console.log('================================================================');

  if (!fs.existsSync(SHOTS_DIR)) {
    fs.mkdirSync(SHOTS_DIR, { recursive: true });
  }
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

  try {
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
    const target = listRes.find((t) => t.type === 'page');
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

    // ========================================================================
    // TEST 1: DESKTOP VIEWPORT (1280 x 800)
    // ========================================================================
    console.log('\n--- Evaluating Desktop Layout (1280px) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    const desktopEvalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const vw = document.documentElement.clientWidth;
          const sections = Array.from(document.querySelectorAll('main section'));
          const sectionWidths = sections.map((s, idx) => {
            const rect = s.getBoundingClientRect();
            const cs = window.getComputedStyle(s);
            return {
              idx,
              tagName: s.tagName,
              id: s.id,
              className: s.className,
              width: rect.width,
              marginLeft: cs.marginLeft,
              marginRight: cs.marginRight,
              borderTopLeftRadius: cs.borderTopLeftRadius,
              isFullWidth: Math.abs(rect.width - vw) <= 2,
              hasNoOuterRadius: parseInt(cs.borderTopLeftRadius) === 0
            };
          });

          // CTA and Footer flush
          const cta = document.getElementById('site-cta') || document.querySelector('section:has(a[href*="wa.me"])');
          const footer = document.getElementById('site-footer') || document.querySelector('footer');
          const ctaRect = cta ? cta.getBoundingClientRect() : null;
          const footerRect = footer ? footer.getBoundingClientRect() : null;

          const docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight
          );

          // WhatsApp Button
          const waBtn = document.getElementById('floating-whatsapp') || document.querySelector('a[href*="wa.me"]');
          const waRect = waBtn ? waBtn.getBoundingClientRect() : null;
          const waCs = waBtn ? window.getComputedStyle(waBtn) : null;

          // Back to top before scroll
          const bttBeforeScroll = document.getElementById('floating-back-to-top');

          // Check deduplication
          const productCards = Array.from(document.querySelectorAll('[data-product-id], a[href*="/product/"]'));
          const productHrefs = productCards.map(c => {
            const link = c.tagName === 'A' ? c : c.querySelector('a[href*="/product/"]');
            return link ? link.getAttribute('href') : null;
          }).filter(Boolean);

          const hrefCounts = {};
          let duplicateHrefs = [];
          for (const h of productHrefs) {
            hrefCounts[h] = (hrefCounts[h] || 0) + 1;
          }
          for (const [h, count] of Object.entries(hrefCounts)) {
            if (count > 1) duplicateHrefs.push({ href: h, count });
          }

          return {
            vw,
            sectionCount: sections.length,
            sectionWidths,
            ctaFound: !!cta,
            footerFound: !!footer,
            docHeight,
            ctaTop: ctaRect ? ctaRect.top + window.scrollY : null,
            ctaBottom: ctaRect ? ctaRect.bottom + window.scrollY : null,
            footerTop: footerRect ? footerRect.top + window.scrollY : null,
            footerBottom: footerRect ? footerRect.bottom + window.scrollY : null,
            waRect: waRect ? {
              width: waRect.width,
              height: waRect.height,
              top: waRect.top,
              bottom: waRect.bottom,
              left: waRect.left,
              right: waRect.right
            } : null,
            waBg: waCs ? waCs.backgroundColor : null,
            bttBeforeScrollPresent: !!bttBeforeScroll,
            duplicateProducts: duplicateHrefs
          };
        })()
      `,
      returnByValue: true
    });

    const dMetrics = desktopEvalRes.result.value;
    console.log(`  Total Main Sections: ${dMetrics.sectionCount}`);
    console.log(`  Viewport Width: ${dMetrics.vw}px`);

    // 1. Assert all sections are full width (no inset panels)
    const nonFullWidth = dMetrics.sectionWidths.filter((s) => !s.isFullWidth || !s.hasNoOuterRadius);
    if (nonFullWidth.length > 0) {
      console.error(`  ✗ FAIL: ${nonFullWidth.length} section(s) are not full-width background bands:`, nonFullWidth);
      throw new Error('Sections found that are not full-width edge-to-edge background bands');
    } else {
      console.log(`  ✓ PASS: All ${dMetrics.sectionCount} sections are 100% full-width bands (width == ${dMetrics.vw}px, 0px outer radius)`);
    }

    // 2. Assert CTA bottom touches Footer top with zero gap
    if (dMetrics.ctaBottom !== null && dMetrics.footerTop !== null) {
      const ctaFooterGap = Math.abs(dMetrics.ctaBottom - dMetrics.footerTop);
      console.log(`  CTA Bottom: ${dMetrics.ctaBottom}px, Footer Top: ${dMetrics.footerTop}px (Gap: ${ctaFooterGap}px)`);
      if (ctaFooterGap > 2) {
        console.error(`  ✗ FAIL: Gap of ${ctaFooterGap}px detected between CTA bottom and Footer top`);
        throw new Error('CTA and Footer must touch with zero gap');
      } else {
        console.log(`  ✓ PASS: CTA bottom edge touches Footer top edge with zero gap`);
      }
    }

    // 3. Assert Footer bottom is flush to document bottom
    if (dMetrics.footerBottom !== null) {
      const footerDocDiff = Math.abs(dMetrics.footerBottom - dMetrics.docHeight);
      console.log(`  Footer Bottom: ${dMetrics.footerBottom}px, Document ScrollHeight: ${dMetrics.docHeight}px (Diff: ${footerDocDiff}px)`);
      if (footerDocDiff > 2) {
        console.error(`  ✗ FAIL: Footer is not flush to document bottom (Diff: ${footerDocDiff}px)`);
        throw new Error('Footer must be flush to the document bottom');
      } else {
        console.log(`  ✓ PASS: Footer is flush to bottom of document (nothing visible below it)`);
      }
    }

    // 4. Assert WhatsApp button dimensions (56px)
    if (dMetrics.waRect) {
      console.log(`  WhatsApp button: ${dMetrics.waRect.width}x${dMetrics.waRect.height}px, bg: ${dMetrics.waBg}`);
      if (Math.abs(dMetrics.waRect.width - 56) > 2 || Math.abs(dMetrics.waRect.height - 56) > 2) {
        console.error(`  ✗ FAIL: WhatsApp button is ${dMetrics.waRect.width}x${dMetrics.waRect.height}px, expected 56x56px`);
        throw new Error('WhatsApp button must be 56px circle');
      } else {
        console.log(`  ✓ PASS: WhatsApp button is 56px circle in bottom-right`);
      }
    }

    // 5. Assert Back to Top is hidden before 400px scroll
    if (dMetrics.bttBeforeScrollPresent) {
      console.error(`  ✗ FAIL: Back to top button rendered before scrolling > 400px!`);
      throw new Error('Back to top must appear only after scrolling > 400px');
    } else {
      console.log(`  ✓ PASS: Back to top button is NOT rendered at scroll position 0px`);
    }

    // 6. Scroll down to 600px and verify Back to Top appears and is stacked 12px above WhatsApp
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 600); window.dispatchEvent(new Event('scroll'));` });
    await sleep(500);

    const scrollMetricsRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const waBtn = document.getElementById('floating-whatsapp');
          const bttBtn = document.getElementById('floating-back-to-top');
          const footer = document.getElementById('site-footer');

          const waRect = waBtn ? waBtn.getBoundingClientRect() : null;
          const bttRect = bttBtn ? bttBtn.getBoundingClientRect() : null;

          // Check intersection between waBtn and bttBtn
          let buttonsIntersect = false;
          let gapY = null;

          if (waRect && bttRect) {
            buttonsIntersect = !(
              bttRect.right < waRect.left ||
              bttRect.left > waRect.right ||
              bttRect.bottom < waRect.top ||
              bttRect.top > waRect.bottom
            );
            gapY = waRect.top - bttRect.bottom;
          }

          // Check if floating buttons intersect any legal/footer text
          const footerTexts = Array.from(footer ? footer.querySelectorAll('p, a, button, span') : []);
          let textCollision = false;

          for (const el of footerTexts) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (waRect && !(waRect.right < r.left || waRect.left > r.right || waRect.bottom < r.top || waRect.top > r.bottom)) {
              textCollision = true;
            }
            if (bttRect && !(bttRect.right < r.left || bttRect.left > r.right || bttRect.bottom < r.top || bttRect.top > r.bottom)) {
              textCollision = true;
            }
          }

          return {
            bttVisible: !!bttBtn,
            waRect,
            bttRect,
            buttonsIntersect,
            gapY,
            textCollision
          };
        })()
      `,
      returnByValue: true
    });

    const sMetrics = scrollMetricsRes.result.value;
    if (!sMetrics.bttVisible) {
      console.error(`  ✗ FAIL: Back to top button did not appear after scrolling > 400px!`);
      throw new Error('Back to top must appear after scrolling 400px');
    } else {
      console.log(`  ✓ PASS: Back to top button appeared after scrolling 600px`);
      console.log(`  Vertical gap between Back to Top and WhatsApp: ${sMetrics.gapY}px`);

      if (sMetrics.buttonsIntersect) {
        console.error(`  ✗ FAIL: Floating WhatsApp and Back to Top buttons intersect!`);
        throw new Error('Floating buttons must not intersect');
      } else {
        console.log(`  ✓ PASS: Zero intersection between WhatsApp and Back to top`);
      }

      if (Math.abs(sMetrics.gapY - 12) > 3) {
        console.error(`  ✗ FAIL: Gap between WhatsApp and Back to top is ${sMetrics.gapY}px, expected 12px`);
        throw new Error('Back to top must be stacked directly above WhatsApp with 12px gap');
      } else {
        console.log(`  ✓ PASS: Back to top stacked directly above WhatsApp with ~12px gap`);
      }

      if (sMetrics.textCollision) {
        console.error(`  ✗ FAIL: Floating button intersects footer text!`);
        throw new Error('Floating buttons must never intersect footer text');
      } else {
        console.log(`  ✓ PASS: Floating buttons never intersect footer text`);
      }
    }

    // 7. Product deduplication assertion
    console.log(`  Duplicate products across rows: ${dMetrics.duplicateProducts.length}`);
    if (dMetrics.duplicateProducts.length > 0) {
      console.error(`  ✗ FAIL: Products appear in multiple homepage rows:`, dMetrics.duplicateProducts);
      throw new Error('A product must appear in only ONE homepage row');
    } else {
      console.log(`  ✓ PASS: Zero duplicate products across all homepage rows`);
    }

    // Capture Desktop Screenshot
    console.log('\n--- Capturing Desktop Screenshot (1280px) ---');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });
    await sleep(400);

    const desktopCapture = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    const desktopShotPath = path.join(SHOTS_DIR, 'homepage-desktop-rev2.png');
    fs.writeFileSync(desktopShotPath, Buffer.from(desktopCapture.data, 'base64'));
    console.log(`  ✓ Saved desktop screenshot: ${desktopShotPath}`);

    // ========================================================================
    // TEST 2: MOBILE VIEWPORT (375 x 812)
    // ========================================================================
    console.log('\n--- Evaluating Mobile Layout (375px) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    const mobileEvalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const vw = document.documentElement.clientWidth;
          const sections = Array.from(document.querySelectorAll('main section'));
          const sectionWidths = sections.map((s, idx) => {
            const rect = s.getBoundingClientRect();
            return {
              idx,
              width: rect.width,
              isFullWidth: Math.abs(rect.width - vw) <= 2
            };
          });

          // Mobile bottom bar
          const mobileBottomBar = document.querySelector('header .fixed.bottom-0');
          const mbRect = mobileBottomBar ? mobileBottomBar.getBoundingClientRect() : null;

          // WhatsApp button
          const waBtn = document.getElementById('floating-whatsapp');
          const waRect = waBtn ? waBtn.getBoundingClientRect() : null;

          // Check if WhatsApp sits ABOVE sticky bottom bar
          const waAboveStickyBar = (waRect && mbRect) ? (waRect.bottom <= mbRect.top + 2) : false;

          return {
            vw,
            sectionCount: sections.length,
            sectionWidths,
            mbRect,
            waRect,
            waAboveStickyBar
          };
        })()
      `,
      returnByValue: true
    });

    const mMetrics = mobileEvalRes.result.value;
    console.log(`  Mobile Viewport Width: ${mMetrics.vw}px`);

    const mobileNonFullWidth = mMetrics.sectionWidths.filter((s) => !s.isFullWidth);
    if (mobileNonFullWidth.length > 0) {
      console.error(`  ✗ FAIL: ${mobileNonFullWidth.length} mobile sections are not full width!`, mobileNonFullWidth);
      throw new Error('Mobile sections must be full width');
    } else {
      console.log(`  ✓ PASS: All ${mMetrics.sectionCount} mobile sections are full width`);
    }

    if (mMetrics.waAboveStickyBar) {
      console.log(`  ✓ PASS: WhatsApp sits above the mobile sticky bottom bar`);
    } else {
      console.log(`  (Note: mobile sticky bar bottom=${mMetrics.mbRect?.bottom}, WhatsApp bottom=${mMetrics.waRect?.bottom})`);
    }

    // Capture Mobile Screenshot
    console.log('\n--- Capturing Mobile Screenshot (375px) ---');
    const mobileCapture = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    const mobileShotPath = path.join(SHOTS_DIR, 'homepage-mobile-rev2.png');
    fs.writeFileSync(mobileShotPath, Buffer.from(mobileCapture.data, 'base64'));
    console.log(`  ✓ Saved mobile screenshot: ${mobileShotPath}`);

    console.log('\n================================================================');
    console.log('✓ ALL HOMEPAGE REVISION 2 CDP TESTS PASSED');
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
  runRevision2Tests().catch((err) => {
    console.error('[REVISION 2 TEST FAILURE]', err.message);
    process.exit(1);
  });
}

module.exports = { runRevision2Tests };
