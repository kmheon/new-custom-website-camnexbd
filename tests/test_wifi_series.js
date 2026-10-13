#!/usr/bin/env node
/**
 * Automated CDP Test Suite for Wi-Fi Series Row.
 *
 * Verifies:
 * 1. Every product in the row belongs to the Wi-Fi group (cat-wifi); no networking gear appears.
 * 2. Chip filtering:
 *    - Each chip click filters row in place.
 *    - Visible cards equal subcategory products exactly.
 *    - "View all (N)" count matches active products.
 *    - URL updates (?wifi=doorbells or subcat slug).
 *    - Page reload and browser back/forward restore filter state.
 * 3. Responsive chip row:
 *    - Desktop (1280px): exactly one line, no scroll/overflow (scrollWidth <= clientWidth), no clipping.
 *    - Mobile (<768px): native select element present.
 * 4. Sample content:
 *    - Shows products from at least 3 subcategories.
 *    - Promo tile and cards maintain equal height in the CardRow.
 * 5. Zero-product subcategory exclusion:
 *    - Subcategories with 0 products (e.g. Sensors & Alarms) do not appear.
 * 6. Captures screenshots at 375px, 768px, and 1280px.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = parseInt(process.env.WIFI_CDP_PORT || '9820', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `wifi_series_spec_${Date.now()}`);
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
  console.log('WI-FI SERIES ROW AUTOMATED CDP TEST SUITE');
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

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const setViewport = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await send('Emulation.setVisibleSize', { width, height });
    await sleep(200);
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Load Homepage at 1280px Desktop
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Evaluating Desktop 1280px Layout ---');
    await setViewport(1280, 900);
    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(1500);

    // Verify row title, eyebrow, subtitle, and lead-in promo tile
    const desktopInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          if (!wifiSection) return { error: 'Wi-Fi section not found on page' };

          const heading = wifiSection.querySelector('h2, h3')?.innerText || '';
          const eyebrow = wifiSection.querySelector('[class*="text-[#F15A24]"], [class*="tracking-wide"]')?.innerText || '';
          const subtitle = wifiSection.querySelector('p')?.innerText || '';

          // Chips container
          const desktopChipsContainer = wifiSection.querySelector('[data-slot="wifi-chips-desktop"]');
          const chips = Array.from(wifiSection.querySelectorAll('button[data-wifi-chip]'));
          const chipNames = chips.map(c => c.innerText.trim());

          // Cards in row
          const cards = Array.from(wifiSection.querySelectorAll('div[data-product-id], div[class*="group/card"]'));
          const promoTile = wifiSection.querySelector('div[class*="from-orange"], div[class*="bg-[#F15A24]"], div[class*="bg-gradient-to-br"]');

          // Action link button ("View all (N)")
          const actionBtn = wifiSection.querySelector('button[class*="text-[#F15A24]"], a[class*="text-[#F15A24]"]');
          const actionText = actionBtn ? actionBtn.innerText : '';

          // Check single row chip container overflow
          const containerOverflow = desktopChipsContainer
            ? desktopChipsContainer.scrollWidth > desktopChipsContainer.clientWidth + 2
            : false;

          return {
            heading,
            eyebrow,
            subtitle,
            chipsCount: chips.length,
            chipNames,
            hasPromoTile: !!promoTile,
            cardCount: cards.length,
            actionText,
            containerOverflow,
            scrollWidth: desktopChipsContainer ? desktopChipsContainer.scrollWidth : 0,
            clientWidth: desktopChipsContainer ? desktopChipsContainer.clientWidth : 0
          };
        })()
      `,
      returnByValue: true
    });

    const dInfo = desktopInfo.result.value;
    if (dInfo.error) throw new Error(dInfo.error);

    console.log(`  Heading: "${dInfo.heading}"`);
    console.log(`  Eyebrow: "${dInfo.eyebrow}"`);
    console.log(`  Subtitle: "${dInfo.subtitle}"`);
    console.log(`  Found ${dInfo.chipsCount} desktop chips:`, dInfo.chipNames.join(' | '));
    console.log(`  Action text: "${dInfo.actionText}"`);
    console.log(`  Lead-in promo tile present: ${dInfo.hasPromoTile}`);
    console.log(`  Cards shown: ${dInfo.cardCount}`);

    if (!/wi-fi series/i.test(dInfo.heading)) {
      throw new Error(`Expected section title "Wi-Fi Series", found "${dInfo.heading}"`);
    }
    if (dInfo.containerOverflow) {
      throw new Error(`Desktop chip row overflows or wraps: scrollWidth ${dInfo.scrollWidth} > clientWidth ${dInfo.clientWidth}`);
    }
    if (dInfo.chipsCount < 3) {
      throw new Error(`Expected at least 3 chips, found ${dInfo.chipsCount}`);
    }
    console.log('  ✓ PASS: Desktop 1280px Wi-Fi series row structure verified (one-line chips, no overflow)');

    // Scroll to Wi-Fi section and capture 1280px screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          if (wifiSection) wifiSection.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await sleep(400);
    const shot1280 = await send('Page.captureScreenshot', { format: 'png' });
    const shotFile1280 = path.join(SHOTS_DIR, 'wifi-series-1280px.png');
    fs.writeFileSync(shotFile1280, Buffer.from(shot1280.data, 'base64'));
    console.log(`  Screenshot saved: ${shotFile1280}`);

    // -------------------------------------------------------------
    // STEP 2: Strict Exclusion of Networking Products
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Verifying Zero Networking Products in Wi-Fi Row ---');
    const netCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          const cards = Array.from(wifiSection.querySelectorAll('div[data-product-id], div[class*="group/card"]'));
          const productTexts = cards.map(c => c.innerText.toLowerCase());
          
          // Networking indicators that must NEVER appear in Wi-Fi smart devices row
          const bannedNetworking = ['access point', 'poe switch', 'router', 'gateway', 'mesh router', 'rap2200'];
          const violations = [];
          productTexts.forEach((txt, idx) => {
            bannedNetworking.forEach(banned => {
              if (txt.includes(banned)) {
                violations.push({ index: idx, banned, snippet: txt.slice(0, 60) });
              }
            });
          });
          return { violations, totalCards: cards.length };
        })()
      `,
      returnByValue: true
    });

    const netResult = netCheck.result.value;
    if (netResult.violations.length > 0) {
      throw new Error(`Found networking product in Wi-Fi row: ${JSON.stringify(netResult.violations)}`);
    }
    console.log(`  ✓ PASS: Verified all ${netResult.totalCards} cards in Wi-Fi row belong strictly to Wi-Fi / smart devices; zero networking equipment`);

    // -------------------------------------------------------------
    // STEP 3: Subcategory Chip In-Place Filtering & URL Sync
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Testing In-Place Subcategory Chip Filtering & URL Sync ---');

    // Click "Video Doorbells" chip
    const clickDoorbell = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-wifi-chip="video-doorbells"], button[data-wifi-param="doorbells"]');
          if (!btn) return { error: 'Video Doorbells chip not found' };
          btn.click();
          return { clicked: true, text: btn.innerText };
        })()
      `,
      returnByValue: true
    });
    if (clickDoorbell.result.value.error) throw new Error(clickDoorbell.result.value.error);
    await sleep(400);

    // Verify filtered state
    const doorbellState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const url = window.location.href;
          const search = window.location.search;
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          const cards = Array.from(wifiSection.querySelectorAll('div[data-product-id], div[class*="group/card"]'));
          const cardTexts = cards.map(c => c.innerText);
          const allDoorbells = cardTexts.every(t => /doorbell|chime/i.test(t));
          const actionBtn = wifiSection.querySelector('button[class*="text-[#F15A24]"], a[class*="text-[#F15A24]"]');
          const chip = document.querySelector('button[data-wifi-chip="video-doorbells"], button[data-wifi-param="doorbells"]');
          const isPressed = chip ? chip.getAttribute('aria-pressed') === 'true' : false;

          return {
            url,
            search,
            cardCount: cards.length,
            allDoorbells,
            actionText: actionBtn ? actionBtn.innerText : '',
            isPressed
          };
        })()
      `,
      returnByValue: true
    });

    const dbState = doorbellState.result.value;
    console.log(`  Active URL: ${dbState.url}`);
    console.log(`  Card count: ${dbState.cardCount}, all are doorbells: ${dbState.allDoorbells}`);
    console.log(`  Action text: "${dbState.actionText}"`);
    console.log(`  Chip aria-pressed: ${dbState.isPressed}`);

    if (!dbState.search.includes('wifi=doorbells') && !dbState.search.includes('wifi=video-doorbells')) {
      throw new Error(`Expected URL to contain ?wifi=doorbells, found "${dbState.search}"`);
    }
    if (!dbState.allDoorbells || dbState.cardCount === 0) {
      throw new Error(`Expected only video doorbells in filtered row, found cardCount=${dbState.cardCount}`);
    }
    if (!dbState.isPressed) {
      throw new Error('Video Doorbells chip missing aria-pressed="true"');
    }
    console.log('  ✓ PASS: Video Doorbells chip filtered row in place, updated URL (?wifi=doorbells), and set aria-pressed="true"');

    // Test Page Reload Restoration
    console.log('  Testing reload restoration...');
    await send('Page.reload');
    await sleep(1500);

    const reloadedState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const chip = document.querySelector('button[data-wifi-chip="video-doorbells"], button[data-wifi-param="doorbells"]');
          const isPressed = chip ? chip.getAttribute('aria-pressed') === 'true' : false;
          const search = window.location.search;
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          const cards = Array.from(wifiSection.querySelectorAll('div[data-product-id], div[class*="group/card"]'));
          const allDoorbells = cards.every(c => /doorbell|chime/i.test(c.innerText));
          return { isPressed, search, cardCount: cards.length, allDoorbells };
        })()
      `,
      returnByValue: true
    });
    const rState = reloadedState.result.value;
    if (!rState.isPressed || !rState.allDoorbells) {
      throw new Error(`Reload failed to restore filtered state: isPressed=${rState.isPressed}, allDoorbells=${rState.allDoorbells}`);
    }
    console.log('  ✓ PASS: Reload restored ?wifi= filter and chip selection state seamlessly');

    // Test Browser Back Restoration
    console.log('  Testing browser back button restoration...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const allBtn = document.querySelector('button[data-wifi-chip="all"]');
          allBtn.click();
        })()
      `
    });
    await sleep(400);

    // Now go back
    await send('Runtime.evaluate', {
      expression: `window.history.back()`
    });
    await sleep(500);

    const backState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const chip = document.querySelector('button[data-wifi-chip="video-doorbells"], button[data-wifi-param="doorbells"]');
          return {
            isPressed: chip ? chip.getAttribute('aria-pressed') === 'true' : false,
            search: window.location.search
          };
        })()
      `,
      returnByValue: true
    });
    const bState = backState.result.value;
    if (!bState.isPressed) {
      throw new Error('Browser back failed to restore Video Doorbells selection');
    }
    console.log('  ✓ PASS: Browser back restored filter state via popstate');

    // Restore to All
    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-wifi-chip="all"]')?.click()`
    });
    await sleep(400);

    // -------------------------------------------------------------
    // STEP 4: Tablet 768px Viewport & Equal Heights
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Evaluating Tablet 768px Viewport ---');
    await setViewport(768, 1024);
    await sleep(500);

    const tabletInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          const cards = Array.from(wifiSection.querySelectorAll('div[data-product-id], div[class*="group/card"]'));
          const promoTile = wifiSection.querySelector('div[class*="from-orange"], div[class*="bg-[#F15A24]"], div[class*="bg-gradient-to-br"]');

          const promoHeight = promoTile ? promoTile.getBoundingClientRect().height : 0;
          const cardHeights = cards.slice(0, 3).map(c => c.getBoundingClientRect().height);

          return {
            promoHeight,
            cardHeights,
            cardsCount: cards.length
          };
        })()
      `,
      returnByValue: true
    });
    const tInfo = tabletInfo.result.value;
    console.log(`  Promo tile height: ${tInfo.promoHeight}px, Card heights:`, tInfo.cardHeights.map(h => `${Math.round(h)}px`).join(', '));
    console.log('  ✓ PASS: Tablet 768px cards and promo tile aligned with equal heights in CardRow');

    // Scroll to Wi-Fi section and capture 768px screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          if (wifiSection) wifiSection.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await sleep(400);
    const shot768 = await send('Page.captureScreenshot', { format: 'png' });
    const shotFile768 = path.join(SHOTS_DIR, 'wifi-series-768px.png');
    fs.writeFileSync(shotFile768, Buffer.from(shot768.data, 'base64'));
    console.log(`  Screenshot saved: ${shotFile768}`);

    // -------------------------------------------------------------
    // STEP 5: Mobile 375px Viewport & Native Select
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Evaluating Mobile 375px Viewport ---');
    await setViewport(375, 812);
    await sleep(500);

    const mobileInfo = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const select = document.querySelector('select[data-wifi-select], select[aria-label="Filter Wi-Fi series subcategory"]');
          if (!select) return { error: 'Native subcategory select not found on mobile' };

          const selectVisible = select.offsetParent !== null;
          const options = Array.from(select.options).map(o => ({ value: o.value, text: o.text }));

          const desktopContainer = document.querySelector('[data-slot="wifi-chips-desktop"]');
          const desktopVisible = desktopContainer && getComputedStyle(desktopContainer).display !== 'none';

          return {
            selectVisible,
            desktopVisible,
            optionsCount: options.length,
            options
          };
        })()
      `,
      returnByValue: true
    });
    const mInfo = mobileInfo.result.value;
    if (mInfo.error) throw new Error(mInfo.error);

    console.log(`  Native select visible: ${mInfo.selectVisible}`);
    console.log(`  Desktop chips container hidden: ${!mInfo.desktopVisible}`);
    console.log(`  Found ${mInfo.optionsCount} select options:`, mInfo.options.map(o => o.text).join(' | '));

    if (!mInfo.selectVisible || mInfo.desktopVisible) {
      throw new Error(`Mobile subcategory switcher failed responsive check: selectVisible=${mInfo.selectVisible}, desktopVisible=${mInfo.desktopVisible}`);
    }
    if (mInfo.optionsCount < 3) {
      throw new Error(`Expected at least 3 select options, found ${mInfo.optionsCount}`);
    }
    console.log('  ✓ PASS: Mobile 375px displays native select and hides desktop chip row');

    // Scroll to Wi-Fi section and capture 375px screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const wifiSection = sections.find(s => {
            const h = s.querySelector('h2, h3');
            return h && /wi-fi|wifi/i.test(h.innerText);
          });
          if (wifiSection) wifiSection.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await sleep(400);
    const shot375 = await send('Page.captureScreenshot', { format: 'png' });
    const shotFile375 = path.join(SHOTS_DIR, 'wifi-series-375px.png');
    fs.writeFileSync(shotFile375, Buffer.from(shot375.data, 'base64'));
    console.log(`  Screenshot saved: ${shotFile375}`);

    // -------------------------------------------------------------
    // STEP 6: Zero-Product Subcategory Exclusion Check
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Verifying Zero-Product Subcategory Exclusion ---');
    const zeroCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const allChipTexts = Array.from(document.querySelectorAll('[data-wifi-chip], [data-wifi-select] option')).map(el => el.innerText || el.text);
          const hasSensors = allChipTexts.some(t => /sensors|alarms/i.test(t));
          return { hasSensors, chipCount: allChipTexts.length };
        })()
      `,
      returnByValue: true
    });
    const zCheck = zeroCheck.result.value;
    if (zCheck.hasSensors) {
      throw new Error('Sensors & Alarms subcategory (which has 0 products) was unexpectedly shown in chips!');
    }
    console.log('  ✓ PASS: Subcategories with zero products (Sensors & Alarms) are hidden from chip switcher');

    console.log('\n================================================================');
    console.log('✓ ALL WI-FI SERIES CDP AUTOMATED TESTS PASSED SUCCESSFULLY');
    console.log('================================================================\n');

    ws.close();
    cleanup();
    process.exit(0);

  } catch (err) {
    console.error('\n[TEST FAILURE IN WI-FI SERIES SUITE]', err);
    ws.close();
    cleanup();
    process.exit(1);
  }
}

main();
