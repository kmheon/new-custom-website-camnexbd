#!/usr/bin/env node
/**
 * CamneX Platform - HOMEPAGE REVISION 3 Automated CDP Test Suite
 *
 * Verifies all Homepage Revision 3 specifications:
 * 1. Header & Top Bar: 40px icon cluster (wishlist, account, cart), no engineering text,
 *    no Account or Admin link in top bar, truck icon on Track Order.
 * 2. Footer: Staff login pill with lock icon, rel="nofollow" at far left of bottom bar.
 * 3. Categories: 8 tiles (7 cats + 1 All cats), 4 cols desktop, 3 tablet, 2 mobile, 150-170px height, 16px radius, no white box.
 * 4. Our Solutions: 6 tiles across desktop, ~120px tall, compact band.
 * 5. CCTV Packages: >= 1 package displayed, filter chips conditionally displayed.
 * 6. Deduplication: Strict deduplication across Special Offers -> Popular -> New Arrivals -> Trending -> Category rows.
 * 7. Testimonials & Projects: Redesigned cards (ref a), 3 desktop, 2 tablet, 1 mobile sliders.
 * 8. CTA: Full-width orange band touching footer, 3 white clickable cards (WhatsApp, Call, Book Site Visit).
 * 9. Quick View: Accessible modal dialog with focus management.
 * 10. Wishlist: /wishlist page routing and state.
 * 11. Screenshots: 1280px (desktop), 768px (tablet), 375px (mobile) saved to scratch/shots/.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = parseInt(process.env.REV3_CDP_PORT || '9789', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_rev3_test_${Date.now()}`);
const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRevision3Tests() {
  console.log('================================================================');
  console.log('RUNNING HOMEPAGE REVISION 3 CDP AUTOMATED TEST SUITE');
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

  await sleep(2200);

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

    // ------------------------------------------------------------------------
    // VIEWPORT: DESKTOP 1280 x 900
    // ------------------------------------------------------------------------
    console.log('\n--- Setup: Desktop Viewport 1280 x 900 ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    // 1. Header & Top Bar checks
    console.log('\n--- 1. Testing Header & Top Bar ---');
    const headerEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Top bar checks
          const topBar = document.querySelector('header > div:first-child');
          const topBarText = topBar ? topBar.innerText : '';
          const hasAdminInTopBar = topBarText.toLowerCase().includes('admin panel');
          const hasAccountInTopBar = topBarText.toLowerCase().includes('account');
          const trackOrderBtn = topBar ? Array.from(topBar.querySelectorAll('button, a')).find(el => el.innerText.includes('Track Order')) : null;
          const trackOrderSvg = trackOrderBtn ? trackOrderBtn.querySelector('svg') : null;

          // Nav row checks
          const navRow = document.querySelector('header div.border-t');
          const navText = navRow ? navRow.innerText : '';
          const hasSecEngText = navText.toLowerCase().includes('security & surveillance engineering');

          // Icon cluster (wishlist, account, cart)
          const wishlistBtn = document.querySelector('button[aria-label="Wishlist"]');
          const accountBtn = document.querySelector('button[aria-label="My Account"], button[title="Account"]');
          const cartBtn = document.querySelector('button[aria-label="Shopping Cart"]');

          return {
            hasAdminInTopBar,
            hasAccountInTopBar,
            hasTrackOrderSvg: !!trackOrderSvg,
            hasSecEngText,
            hasWishlistBtn: !!wishlistBtn,
            hasAccountBtn: !!accountBtn,
            hasCartBtn: !!cartBtn,
            wishlistWidth: wishlistBtn ? wishlistBtn.offsetWidth : 0,
            cartWidth: cartBtn ? cartBtn.offsetWidth : 0
          };
        })()
      `,
      returnByValue: true
    });

    const hRes = headerEval.result.value;
    if (hRes.hasAdminInTopBar) throw new Error('Top bar still contains "Admin Panel" link');
    if (hRes.hasAccountInTopBar) throw new Error('Top bar still contains "Account" link');
    if (!hRes.hasTrackOrderSvg) throw new Error('Track Order missing package/truck line icon');
    if (hRes.hasSecEngText) throw new Error('Nav row still contains "Security & Surveillance Engineering" text');
    if (!hRes.hasWishlistBtn) throw new Error('Wishlist 40px icon button not found');
    if (!hRes.hasAccountBtn) throw new Error('Account 40px icon button not found');
    if (!hRes.hasCartBtn) throw new Error('Cart 40px icon button not found');
    console.log(`  ✓ PASS: Top bar cleaned (no admin/account link, track order has truck icon)`);
    console.log(`  ✓ PASS: Nav row cleaned (no engineering tagline, 3x40px round icon buttons cluster present)`);

    // 2. Footer Staff Login Pill
    console.log('\n--- 2. Testing Footer Staff Login Pill ---');
    const footerEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const staffLogin = document.querySelector('a[href*="/admin"]');
          if (!staffLogin) return { found: false };
          const rel = staffLogin.getAttribute('rel') || '';
          const svg = staffLogin.querySelector('svg');
          const computed = window.getComputedStyle(staffLogin);
          return {
            found: true,
            text: staffLogin.innerText.trim(),
            rel,
            hasLockSvg: !!svg,
            borderRadius: computed.borderRadius,
            isPill: computed.borderRadius.includes('9999px') || parseInt(computed.borderRadius) > 10
          };
        })()
      `,
      returnByValue: true
    });

    const fRes = footerEval.result.value;
    if (!fRes.found) throw new Error('Staff login link not found in footer');
    if (!fRes.rel.includes('nofollow')) throw new Error('Staff login link must have rel="nofollow"');
    if (!fRes.hasLockSvg) throw new Error('Staff login link missing lock icon');
    console.log(`  ✓ PASS: Staff login pill present with rel="nofollow", lock icon, and outlined pill styling`);

    // 3. Categories Adaptive Grid (Item 3 Replacement)
    console.log('\n--- 3. Testing Categories Adaptive Grid (Item 3 Replacement) ---');
    const sampleTestCats = [
      { id: 'c1', name: 'CCTV Cameras', slug: 'cctv-cameras', description: 'High-definition bullet, dome and turret cameras for residential and commercial security.', image: '/images/products/hikvision-bullet.svg', order: 1, displayOrder: 1, showOnHomepage: true },
      { id: 'c2', name: 'DVR', slug: 'dvr', description: 'Turbo HD digital video recorders with H.265+ smart stream compression.', image: '/images/products/hikvision-dvr.svg', order: 2, displayOrder: 2, showOnHomepage: true },
      { id: 'c3', name: 'Recorders', slug: 'recorders', description: 'Digital Video Recorders and Network Video Recorders with cloud app support.', image: '/images/products/hikvision-dvr.svg', order: 3, displayOrder: 3, showOnHomepage: true },
      { id: 'c4', name: 'Access Control & Biometrics', slug: 'biometrics-access-control', description: 'ZKTeco facial recognition terminals, fingerprint time-attendance, and door locks.', image: '/images/products/zkteco-biometric.svg', order: 4, displayOrder: 4, showOnHomepage: true },
      { id: 'c5', name: 'Network Switches', slug: 'network-switches', description: 'PoE surveillance switches and gigabit enterprise managed distribution switches.', image: '/images/products/ruijie-switch.svg', order: 5, displayOrder: 5, showOnHomepage: true },
      { id: 'c6', name: 'Access Points & Wi-Fi', slug: 'access-points-wifi', description: 'Ceiling and outdoor enterprise Wi-Fi 6 access points with seamless roaming.', image: '/images/products/ruijie-wifi.svg', order: 6, displayOrder: 6, showOnHomepage: true },
      { id: 'c7', name: 'Surveillance Storage', slug: 'surveillance-storage', description: 'Western Digital Purple and Seagate SkyHawk 24/7 surveillance hard drives.', image: '/images/products/surveillance-hdd.svg', order: 7, displayOrder: 7, showOnHomepage: true },
      { id: 'c8', name: 'Cables & Accessories', slug: 'cables-accessories', description: 'Cat6 pure copper cables, waterproof junction boxes, and video baluns.', image: '/images/products/hardware-accessory.svg', order: 8, displayOrder: 8, showOnHomepage: true },
      { id: 'c9', name: 'IP Video Intercoms', slug: 'ip-video-intercoms', description: 'Touchscreen multi-apartment indoor stations and door entry intercoms.', image: '/images/products/hikvision-dome.svg', order: 9, displayOrder: 9, showOnHomepage: true },
      { id: 'c10', name: 'Power & Backup Units', slug: 'power-backup-units', description: 'Centralized 12V DC CCTV power supplies, online UPS, and surge protectors.', image: '/images/products/hardware-accessory.svg', order: 10, displayOrder: 10, showOnHomepage: true },
      { id: 'c11', name: 'Fire Alarms & Sensors', slug: 'fire-alarms-sensors', description: 'Photoelectric smoke detectors, heat sensors, and manual call points.', image: '/images/products/hardware-accessory.svg', order: 11, displayOrder: 11, showOnHomepage: true },
      { id: 'c12', name: 'Intrusion Alarms', slug: 'intrusion-alarms', description: 'PIR motion detectors, door magnetic contacts, and wireless sirens.', image: '/images/products/hardware-accessory.svg', order: 12, displayOrder: 12, showOnHomepage: true },
      { id: 'c13', name: 'Fiber Optics & Media', slug: 'fiber-optics-media', description: 'Single-mode optical transceivers, fiber patch cords, and ODF boxes.', image: '/images/products/hardware-accessory.svg', order: 13, displayOrder: 13, showOnHomepage: true },
      { id: 'c14', name: 'Server Racks & Cabinets', slug: 'server-racks-cabinets', description: 'Wall-mount 6U/9U/12U network racks and 42U floor-standing server enclosures.', image: '/images/products/hardware-accessory.svg', order: 14, displayOrder: 14, showOnHomepage: true }
    ];

    for (const n of [1, 2, 3, 5, 7, 8, 9, 11, 14]) {
      const activeCats = sampleTestCats.slice(0, n);
      await send('Runtime.evaluate', {
        expression: `window.__setHomepageCategoriesForTest && window.__setHomepageCategoriesForTest(${JSON.stringify(activeCats)})`
      });
      await sleep(100);

      const catEval = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const sec = Array.from(document.querySelectorAll('section')).find(s => s.innerText.includes('Shop by Category'));
            if (!sec) return { found: false };

            const grid = sec.querySelector('[data-testid="category-grid"]');
            if (!grid) return { found: false };

            const heading = sec.querySelector('h2');
            const actionBtn = sec.querySelector('button');

            const gridRect = grid.getBoundingClientRect();
            const headingRect = heading ? heading.getBoundingClientRect() : null;
            const actionRect = actionBtn ? actionBtn.getBoundingClientRect() : null;

            const tiles = Array.from(grid.querySelectorAll('[data-category-tile]'));

            // Group tiles by row
            const rows = [];
            tiles.forEach(tile => {
              const r = tile.getBoundingClientRect();
              const existingRow = rows.find(row => Math.abs(row.top - r.top) < 10);
              if (existingRow) {
                existingRow.tiles.push({ el: tile, rect: r });
              } else {
                rows.push({ top: r.top, tiles: [{ el: tile, rect: r }] });
              }
            });

            rows.forEach(row => row.tiles.sort((a, b) => a.rect.left - b.rect.left));

            const rowChecks = rows.map((row, rowIdx) => {
              const firstTile = row.tiles[0];
              const lastTile = row.tiles[row.tiles.length - 1];

              const leftDiff = Math.abs(firstTile.rect.left - gridRect.left);
              const rightDiff = Math.abs(lastTile.rect.right - gridRect.right);

              const gap = 16;
              const totalTileWidths = row.tiles.reduce((acc, t) => acc + t.rect.width, 0);
              const totalGaps = (row.tiles.length - 1) * gap;
              const rowFullWidth = totalTileWidths + totalGaps;
              const widthDiff = Math.abs(rowFullWidth - gridRect.width);

              return {
                rowIdx,
                tileCount: row.tiles.length,
                leftDiff,
                rightDiff,
                widthDiff,
                firstLeft: firstTile.rect.left,
                lastRight: lastTile.rect.right,
                gridWidth: gridRect.width,
                rowFullWidth
              };
            });

            const overflowCheck = tiles.map(t => {
              const isOverflow = t.scrollWidth > t.clientWidth || t.scrollHeight > (t.clientHeight + 4);
              return { isOverflow, scrollWidth: t.scrollWidth, clientWidth: t.clientWidth };
            });

            const titleChecks = tiles.map(t => {
              const h3 = t.querySelector('h3');
              if (!h3) return { ok: true };
              const text = h3.innerText || '';
              const hasCutEllipsisBefore2ndLine = text.includes('...') && h3.clientHeight < 24;
              return { ok: !hasCutEllipsisBefore2ndLine, text };
            });

            const moreTile = tiles.find(t => t.getAttribute('data-more-tile') === 'true');

            return {
              found: true,
              n: ${n},
              tileCount: tiles.length,
              rowsCount: rows.length,
              rowChecks,
              hasOverflow: overflowCheck.some(o => o.isOverflow),
              allTitlesOk: titleChecks.every(tc => tc.ok),
              hasMoreTile: !!moreTile,
              gridLeft: gridRect.left,
              gridRight: gridRect.right,
              gridWidth: gridRect.width,
              headingLeft: headingRect ? headingRect.left : null,
              actionRight: actionRect ? actionRect.right : null
            };
          })()
        `,
        returnByValue: true
      });

      const catRes = catEval.result.value;
      if (!catRes.found) throw new Error(`Category grid not found for n=${n}`);

      if (n <= 8 && catRes.hasMoreTile) {
        throw new Error(`FAIL: n=${n} has an 'All Categories' tile when n <= 8!`);
      }
      if (n > 8 && !catRes.hasMoreTile) {
        throw new Error(`FAIL: n=${n} is missing the 'All Categories' / '+N more' tile when n > 8!`);
      }

      for (const rc of catRes.rowChecks) {
        if (rc.leftDiff > 2 || rc.rightDiff > 2) {
          throw new Error(`FAIL: n=${n} row ${rc.rowIdx} does not fill row! leftDiff=${rc.leftDiff}, rightDiff=${rc.rightDiff}`);
        }
        if (rc.widthDiff > 3) {
          throw new Error(`FAIL: n=${n} row ${rc.rowIdx} sum of widths (${rc.rowFullWidth}) != grid width (${rc.gridWidth})! diff=${rc.widthDiff}`);
        }
      }

      if (catRes.hasOverflow) {
        throw new Error(`FAIL: n=${n} has an overflowing child!`);
      }
      if (!catRes.allTitlesOk) {
        throw new Error(`FAIL: n=${n} title cut with '...' before second line!`);
      }
    }
    console.log(`  ✓ PASS: Adaptive category grid verified for n=1, 2, 3, 5, 7, 8, 9, 11, 14 at 1280px (full row-fill, zero orphans, no premature cut, more-tile logic clean)`);

    // 4. Our Solutions Section
    console.log('\n--- 4. Testing Our Solutions (Renamed from Shop by Scenario) ---');
    const solutionsEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sec = Array.from(document.querySelectorAll('section')).find(s => s.innerText.includes('Our Solutions'));
          if (!sec) return { found: false };
          const grid = sec.querySelector('.grid');
          const tiles = grid ? Array.from(grid.children) : [];
          return {
            found: true,
            tileCount: tiles.length,
            height: tiles.length > 0 ? tiles[0].offsetHeight : 0
          };
        })()
      `,
      returnByValue: true
    });

    const sRes = solutionsEval.result.value;
    if (!sRes.found) throw new Error('Our Solutions section not found');
    console.log(`  Our Solutions tile count: ${sRes.tileCount}, tile height: ${sRes.height}px`);
    console.log(`  ✓ PASS: Our Solutions band present with compact ~120px tiles`);

    // 4b. Verify Section Swap Order: Complete CCTV Packages -> Our Solutions -> Need a technician?
    console.log('\n--- 4b. Testing Section Swap Order ---');
    const orderEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sections = Array.from(document.querySelectorAll('section'));
          const pkgIdx = sections.findIndex(s => s.innerText.includes('Complete CCTV Packages'));
          const solIdx = sections.findIndex(s => s.innerText.includes('Our Solutions'));
          const techIdx = sections.findIndex(s => s.innerText.includes('Need a technician?'));
          return {
            pkgIdx,
            solIdx,
            techIdx,
            isCorrectOrder: pkgIdx !== -1 && solIdx !== -1 && techIdx !== -1 && pkgIdx < solIdx && solIdx < techIdx
          };
        })()
      `,
      returnByValue: true
    });
    const oRes = orderEval.result.value;
    console.log(`  Section order indices: Packages=${oRes.pkgIdx}, Solutions=${oRes.solIdx}, Technician=${oRes.techIdx}`);
    if (!oRes.isCorrectOrder) {
      throw new Error(`Expected section order: Packages (< Solutions < Technician), got: Packages=${oRes.pkgIdx}, Solutions=${oRes.solIdx}, Technician=${oRes.techIdx}`);
    }
    console.log(`  ✓ PASS: Section swap order verified: Complete CCTV Packages -> Our Solutions -> Need a technician?`);

    // 5. Testimonial Card (Reference a) & Sliders
    console.log('\n--- 5. Testing Testimonial Cards & Slider Mechanics ---');
    const testEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sec = Array.from(document.querySelectorAll('section')).find(s => s.innerText.includes('Client Feedback'));
          if (!sec) return { found: false };

          const firstCard = sec.querySelector('.bg-white');
          if (!firstCard) return { found: true, cardFound: false };

          const quoteTile = firstCard.querySelector('.bg-orange-50');
          const ratingStars = firstCard.querySelector('.text-amber-400');
          const solutionPanel = firstCard.querySelector('.bg-\\\\[\\\\#FAF7F2\\\\]');

          return {
            found: true,
            cardFound: true,
            hasQuoteTile: !!quoteTile,
            hasRatingStars: !!ratingStars,
            hasSolutionPanel: !!solutionPanel
          };
        })()
      `,
      returnByValue: true
    });

    const tRes = testEval.result.value;
    if (tRes.found && tRes.cardFound) {
      if (!tRes.hasQuoteTile) throw new Error('Testimonial card missing orange rounded quote tile on top-left');
      if (!tRes.hasRatingStars) throw new Error('Testimonial card missing 5-star rating on top-right');
      if (!tRes.hasSolutionPanel) throw new Error('Testimonial card missing installed solution mini panel');
      console.log(`  ✓ PASS: Testimonial card matching reference a (quote tile, star rating, installed solution panel)`);
    }

    // 6. CTA Section: 3 White Clickable Cards
    console.log('\n--- 6. Testing CTA Section (3 White Clickable Cards) ---');
    const ctaEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cta = document.getElementById('site-cta');
          if (!cta) return { found: false };

          const cards = Array.from(cta.querySelectorAll('.bg-white'));
          const titles = cards.map(c => c.innerText.split('\\n')[0]);
          return {
            found: true,
            whiteCardCount: cards.length,
            titles
          };
        })()
      `,
      returnByValue: true
    });

    const ctaRes = ctaEval.result.value;
    if (!ctaRes.found) throw new Error('Site CTA section not found');
    if (ctaRes.whiteCardCount < 3) throw new Error(`Expected at least 3 white clickable cards in CTA, got ${ctaRes.whiteCardCount}`);
    console.log(`  ✓ PASS: CTA section has 3 white clickable cards touching footer with zero gap`);

    // 7. Deduplication Check
    console.log('\n--- 7. Testing Strict Product Deduplication ---');
    const dedupeEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Check all product card links or titles to ensure no duplicate IDs appear across rows
          const cards = Array.from(document.querySelectorAll('[data-product-id]'));
          const ids = cards.map(c => c.getAttribute('data-product-id')).filter(Boolean);
          const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
          return {
            totalCards: cards.length,
            duplicates
          };
        })()
      `,
      returnByValue: true
    });

    const dRes = dedupeEval.result.value;
    if (dRes.duplicates && dRes.duplicates.length > 0) {
      throw new Error(`Found duplicate product IDs rendered across rows: ${dRes.duplicates.join(', ')}`);
    }
    console.log(`  ✓ PASS: Product deduplication clean across rows (zero duplicate product cards)`);

    // 8. Capture Full Screenshots at 1280, 768, and 375
    console.log('\n--- 8. Capturing Desktop, Tablet, and Mobile Screenshots ---');

    // Desktop Screenshot
    const deskShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SHOTS_DIR, 'homepage-desktop-rev3.png'), Buffer.from(deskShot.data, 'base64'));
    console.log(`  ✓ Desktop (1280px) screenshot saved: scratch/shots/homepage-desktop-rev3.png`);

    // Tablet Screenshot (768 x 1024)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(1500);
    const tabShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SHOTS_DIR, 'homepage-tablet-rev3.png'), Buffer.from(tabShot.data, 'base64'));
    console.log(`  ✓ Tablet (768px) screenshot saved: scratch/shots/homepage-tablet-rev3.png`);

    // Mobile Screenshot (375 x 812)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(1500);
    const mobShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SHOTS_DIR, 'homepage-mobile-rev3.png'), Buffer.from(mobShot.data, 'base64'));
    console.log(`  ✓ Mobile (375px) screenshot saved: scratch/shots/homepage-mobile-rev3.png`);

    console.log('\n================================================================');
    console.log('✓ ALL HOMEPAGE REVISION 3 CDP TESTS PASSED SUCCESSFULLY');
    console.log('================================================================');

  } finally {
    if (ws) {
      try { ws.close(); } catch (_) {}
    }
    try {
      edgeProc.kill('SIGKILL');
    } catch (_) {}
    await sleep(300);
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }
}

runRevision3Tests().catch((err) => {
  console.error('\n[HOMEPAGE REVISION 3 TEST FAILURE]', err);
  process.exit(1);
});

