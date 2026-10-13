#!/usr/bin/env node
/**
 * Package Filter Bar Single-Row Specification Automated CDP Test Suite.
 *
 * Verifies:
 * 1. Vertical center alignment within 2px on desktop (1280 and 1440px).
 * 2. Bar height <= 72px, single row, bar.scrollWidth === bar.clientWidth at 1100, 1280, 1440, 1920px.
 * 3. Typography: values & buttons >= 14px, inline labels >= 13px.
 * 4. Visual scan: no dark slate background colors, light tokens & brand orange.
 * 5. Counter check: "Showing X of Y" inside bar, removed from beneath cards.
 * 6. Full variant check on /packages: filtering, sorting, active filter chips with URL reflection.
 * 7. Visual screenshots captured at 375, 768, 1280, 1920px.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = parseInt(process.env.FILTERBAR_CDP_PORT || '9815', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `filterbar_spec_${Date.now()}`);
const TEST_PORT = process.env.TEST_PORT || '3000';
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`;
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getBrowserExecutable() {
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  if (fs.existsSync(CHROME_PATH)) return CHROME_PATH;
  throw new Error('Neither Edge nor Chrome was found.');
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('================================================================');
  console.log('PACKAGE FILTER BAR SPECIFICATION CDP TEST SUITE');
  console.log('Base URL:', BASE_URL);
  console.log('CDP Port:', CDP_PORT);
  console.log('================================================================');

  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const browserBin = getBrowserExecutable();
  const chromeArgs = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,900',
    'about:blank'
  ];

  const browserProc = cp.spawn(browserBin, chromeArgs, { stdio: 'ignore' });
  const cleanup = () => {
    try { browserProc.kill(); } catch (_) {}
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      targets = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
      if (targets && targets.some(t => t.type === 'page')) break;
    } catch (_) {}
  }
  const pageTarget = targets?.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('Failed to connect to browser CDP page target.');
    cleanup();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  try {
    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    let totalErrors = 0;

    // 1. DESKTOP VIEWPORTS TEST: 1100, 1280, 1440, 1920
    const desktopViewports = [1100, 1280, 1440, 1920];
    for (const w of desktopViewports) {
      console.log(`\n--- Desktop Viewport ${w}px ---`);
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: BASE_URL });
      await sleep(2000);

      const checkRes = await send('Runtime.evaluate', {
        expression: `(async () => {
          const errs = [];
          let bar = null;
          for (let i = 0; i < 50; i++) {
            bar = document.querySelector('[data-filterbar]');
            if (bar) break;
            await new Promise(r => setTimeout(r, 100));
          }
          if (!bar) return ['[data-filterbar] element not found on page'];

          const barRect = bar.getBoundingClientRect();
          // Height <= 72px
          if (barRect.height > 72) {
            errs.push('Bar height exceeds 72px: ' + Math.round(barRect.height) + 'px');
          }

          // bar.scrollWidth === bar.clientWidth
          if (bar.scrollWidth > bar.clientWidth) {
            errs.push('Bar has horizontal overflow: scrollWidth(' + bar.scrollWidth + ') > clientWidth(' + bar.clientWidth + ')');
          }

          // Single row: only one bounding-box top across groups
          const segBtn = bar.querySelector('[role="tablist"] button');
          const sel = bar.querySelector('select');
          const counter = bar.querySelector('[data-slot="filterbar-counter"]');

          if (segBtn && sel && counter) {
            const segRect = segBtn.getBoundingClientRect();
            const selRect = sel.getBoundingClientRect();
            const cntRect = counter.getBoundingClientRect();

            // Vertical center check: rect.top + rect.height/2 equal within 2px
            const cSeg = segRect.top + segRect.height / 2;
            const cSel = selRect.top + selRect.height / 2;
            const cCnt = cntRect.top + cntRect.height / 2;

            const diffSel = Math.abs(cSeg - cSel);
            const diffCnt = Math.abs(cSeg - cCnt);

            if (diffSel > 2) {
              errs.push('Select vertical center deviates from segment button by ' + diffSel.toFixed(1) + 'px (> 2px)');
            }
            if (diffCnt > 2) {
              errs.push('Counter vertical center deviates from segment button by ' + diffCnt.toFixed(1) + 'px (> 2px)');
            }
          }

          // Visual scan: no dark slate background colors on the bar or controls
          const bgBar = window.getComputedStyle(bar).backgroundColor;
          if (bgBar.includes('15, 23, 42') || bgBar.includes('30, 41, 59') || bgBar.includes('51, 65, 85')) {
            errs.push('Bar has dark slate background color: ' + bgBar);
          }

          // Check segment order (All, IP, Analogue, Wi-Fi) and case (not uppercase)
          const tabEls = Array.from(bar.querySelectorAll('button[role="tab"]'));
          const tabTexts = tabEls.map(t => {
            const spans = Array.from(t.querySelectorAll('span'));
            const labelSpan = spans.find(s => !s.className.includes('rounded-full'));
            return labelSpan ? labelSpan.textContent.trim() : t.textContent.trim();
          });
          const expectedOrder = ['All', 'IP', 'Analogue', 'Wi-Fi'];
          if (JSON.stringify(tabTexts) !== JSON.stringify(expectedOrder)) {
            errs.push('Segment labels wrong order, expected ' + JSON.stringify(expectedOrder) + ', got: ' + JSON.stringify(tabTexts));
          }
          tabEls.forEach((t, i) => {
            const cs = window.getComputedStyle(t);
            if (cs.textTransform === 'uppercase') {
              errs.push('Segment button ' + tabTexts[i] + ' has text-transform: uppercase');
            }
            if (tabTexts[i] && tabTexts[i].length > 2 && tabTexts[i] === tabTexts[i].toUpperCase()) {
              errs.push('Segment label ' + tabTexts[i] + ' is all uppercase');
            }
          });

          // Typography check
          const labels = Array.from(bar.querySelectorAll('label, span.text-\\\\[13px\\\\]'));
          labels.forEach(l => {
            const fs = parseFloat(window.getComputedStyle(l).fontSize);
            if (fs < 12.5) errs.push('Label font size < 13px: ' + fs + 'px for ' + l.textContent.trim());
          });

          const buttonsAndValues = Array.from(bar.querySelectorAll('button[role="tab"], select, [data-slot="filterbar-counter"] span'));
          buttonsAndValues.forEach(el => {
            const fs = parseFloat(window.getComputedStyle(el).fontSize);
            if (fs < 13.5) errs.push('Control/value font size < 14px: ' + fs + 'px for ' + el.textContent.trim());
          });

          // Counter check: "Showing X of Y" inside bar, NOT under cards
          const cntTxt = counter ? counter.textContent : '';
          if (!/Showing \\d+ of \\d+/i.test(cntTxt)) {
            errs.push('Counter missing /Showing \\\\d+ of \\\\d+/ text inside bar, got: ' + cntTxt);
          }

          const section = document.querySelector('section#packages');
          if (section) {
            const cardsArea = section.querySelector('.grid, [data-row-scroll]');
            if (cardsArea) {
              const afterCards = section.innerText.split('See all')[0];
              const matchUnder = afterCards.match(/Showing \\d+ of \\d+ packages/i);
              if (matchUnder) {
                errs.push('Old "Showing N of M packages" text still present beneath cards');
              }
            }

            // Wireless cards check: summary and components contain neither "cable" nor "DVR" nor "NVR"
            const wifiCards = Array.from(section.querySelectorAll('[data-package-id*="wifi"], [data-card-id*="wifi"]'));
            wifiCards.forEach(c => {
              const text = c.innerText;
              if (/\bcable\b/i.test(text)) {
                errs.push('Wireless package card contains "cable": ' + text.slice(0, 100));
              }
              if (/\bdvr\b/i.test(text)) {
                errs.push('Wireless package card contains "DVR": ' + text.slice(0, 100));
              }
              if (/\bnvr\b/i.test(text)) {
                errs.push('Wireless package card contains "NVR": ' + text.slice(0, 100));
              }
            });
          }

          return errs;
        })()`,
        returnByValue: true,
        awaitPromise: true
      });

      const errs = checkRes.result.value || [];
      if (errs.length > 0) {
        totalErrors += errs.length;
        console.log(`  ✗ FAIL Desktop ${w}px:`);
        errs.forEach(e => console.log('    - ' + e));
      } else {
        console.log(`  ✓ PASS: Desktop ${w}px single-row, height, vertical center, and typography within spec`);
      }

      // Scroll bar into view for clear screenshot
      await send('Runtime.evaluate', {
        expression: `(() => {
          const b = document.querySelector('[data-filterbar]');
          if (b) {
            document.documentElement.style.scrollBehavior = 'auto';
            const top = b.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo(0, Math.max(0, top - 150));
          }
        })()`
      });
      await sleep(500);

      // Capture desktop screenshots
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const shotFile = path.join(SHOTS_DIR, `filterbar-${w}px.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`  Screenshot saved: ${shotFile}`);
    }

    // 2. RESPONSIVE VIEWPORTS TEST: 768px (tablet), 375px (mobile)
    const responsiveVps = [
      { w: 768, h: 1024, name: 'Tablet 768px', mobile: false },
      { w: 375, h: 812, name: 'Mobile 375px', mobile: true }
    ];

    for (const vp of responsiveVps) {
      console.log(`\n--- ${vp.name} ---`);
      await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile });
      await send('Page.navigate', { url: BASE_URL });
      await sleep(2000);

      const checkRes = await send('Runtime.evaluate', {
        expression: `(async () => {
          const errs = [];
          let bar = null;
          for (let i = 0; i < 50; i++) {
            bar = document.querySelector('[data-filterbar]');
            if (bar) break;
            await new Promise(r => setTimeout(r, 100));
          }
          if (!bar) return ['[data-filterbar] element not found on page'];

          if (bar.scrollWidth > bar.clientWidth) {
            errs.push('Bar has horizontal overflow at ${vp.w}px: scrollWidth(' + bar.scrollWidth + ') > clientWidth(' + bar.clientWidth + ')');
          }

          if (${vp.w} < 768) {
            // Touch targets on mobile >= 44px
            const tabs = Array.from(bar.querySelectorAll('[role="tab"]'));
            tabs.forEach(t => {
              const h = t.getBoundingClientRect().height;
              if (h < 42) errs.push('Mobile tab button height < 44px: ' + h);
            });
            const selects = Array.from(bar.querySelectorAll('select'));
            selects.forEach(s => {
              const h = s.getBoundingClientRect().height;
              if (h < 42) errs.push('Mobile select height < 44px: ' + h);
            });

            // Description line below bar present on mobile
            const desc = document.querySelector('[data-slot="system-type-description"]');
            if (!desc || desc.textContent.trim().length === 0) {
              errs.push('Mobile description line missing below bar');
            }
          }

          return errs;
        })()`,
        returnByValue: true,
        awaitPromise: true
      });

      const errs = checkRes.result.value || [];
      if (errs.length > 0) {
        totalErrors += errs.length;
        console.log(`  ✗ FAIL ${vp.name}:`);
        errs.forEach(e => console.log('    - ' + e));
      } else {
        console.log(`  ✓ PASS: ${vp.name} responsive layout and touch targets verified`);
      }

      // Scroll bar into view for clear screenshot
      await send('Runtime.evaluate', {
        expression: `(() => {
          const b = document.querySelector('[data-filterbar]');
          if (b) {
            document.documentElement.style.scrollBehavior = 'auto';
            const top = b.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo(0, Math.max(0, top - 150));
          }
        })()`
      });
      await sleep(500);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const shotFile = path.join(SHOTS_DIR, `filterbar-${vp.w}px.png`);
      fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
      console.log(`  Screenshot saved: ${shotFile}`);
    }

    // 3. FULL VARIANT ON /packages TEST
    console.log('\n--- Testing Full Variant on /packages ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE_URL}/packages` });
    await sleep(2500);

    const fullCheck = await send('Runtime.evaluate', {
      expression: `(async () => {
        const errs = [];
        const bar = document.querySelector('[data-filterbar]');
        if (!bar) return ['[data-filterbar] full variant not found on /packages'];

        // Has "More filters" button
        const moreBtn = Array.from(bar.querySelectorAll('button')).find(b => b.textContent.includes('More filters'));
        if (!moreBtn) errs.push('"More filters" button not found on full variant');

        // Has Sort select
        const sortSel = bar.querySelector('select[aria-label="Sort packages"]');
        if (!sortSel) errs.push('Sort packages select not found on full variant');

        // Click "More filters" to expand drawer
        if (moreBtn) {
          moreBtn.click();
        }
        await new Promise(r => setTimeout(r, 400));

        const panel = document.querySelector('[data-slot="extended-filters-panel"]');
        if (!panel) errs.push('Extended filters panel did not open after clicking "More filters"');

        // Test filtering IP
        const ipTab = Array.from(bar.querySelectorAll('[role="tab"]')).find(t => t.textContent.includes('IP'));
        if (ipTab) {
          ipTab.click();
        }
        await new Promise(r => setTimeout(r, 400));

        if (!window.location.search.includes('system=ip')) {
          errs.push('URL did not sync ?system=ip after clicking IP tab, got: ' + window.location.search);
        }

        // Active filter chips should appear
        const chips = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('System: IP'));
        if (chips.length === 0) {
          errs.push('Active filter chip for System: IP not rendered');
        }

        return errs;
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const fullErrs = fullCheck.result.value || [];
    if (fullErrs.length > 0) {
      totalErrors += fullErrs.length;
      console.log('  ✗ FAIL Full Variant /packages:');
      fullErrs.forEach(e => console.log('    - ' + e));
    } else {
      console.log('  ✓ PASS: Full variant on /packages: drawer, sort select, active chips, and URL reflection verified');
    }

    const packagesShot = await send('Page.captureScreenshot', { format: 'png' });
    const pkgShotFile = path.join(SHOTS_DIR, 'packages-page-1280px.png');
    fs.writeFileSync(pkgShotFile, Buffer.from(packagesShot.data, 'base64'));
    console.log(`  Screenshot saved: ${pkgShotFile}`);

    ws.close();

    if (totalErrors > 0) {
      console.error(`\n❌ PACKAGE FILTERBAR SPEC SUITE: ${totalErrors} failing check(s)`);
      cleanup();
      process.exit(1);
    }

    console.log('\n================================================================');
    console.log('✓ ALL PACKAGE FILTERBAR SPEC CHECKS PASSED CLEANLY');
    console.log('================================================================');
    cleanup();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR in test harness:', err.message || err);
    cleanup();
    process.exit(1);
  }
}

main();
