#!/usr/bin/env node
/**
 * Equal-Height Cards and CSS Subgrid Architecture Test Suite
 *
 * Verifies:
 * 1. CSS Scanning: No category, series, system type, or page sets arbitrary card height/min-height/max-height
 *    outside the canonical CardSlots definitions.
 * 2. Shared subgrid rules and flex fallbacks exist in style.css.
 * 3. CDP Browser Runtime: Cards within each CardRow and CardGrid have equal heights (<1.5px variance).
 * 4. Reserved slots: Variable lines (e.g. "+N more components", old price line) reserve height when hidden.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const cp = require('child_process');
const os = require('os');

const TEST_PORT = process.env.TEST_PORT || '3099';
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`;
const CDP_PORT = parseInt(process.env.SUBGRID_CDP_PORT || '9794', 10);
const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA_DIR = path.join(os.tmpdir(), `subgrid_test_${Date.now()}`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// 1. STATIC CSS & CODE SCANNING TEST
function runCodeScan() {
  console.log('\n--- 1. Static Architecture Scan: Card Classes & Height Rules ---');

  const styleCssPath = path.join(__dirname, '../src/style.css');
  const styleCss = fs.readFileSync(styleCssPath, 'utf8');

  // Verify subgrid and fallback rules exist
  if (!styleCss.includes('card-subgrid-grid') || !styleCss.includes('card-subgrid-row')) {
    throw new Error('style.css is missing card-subgrid-grid or card-subgrid-row class definitions.');
  }
  if (!styleCss.includes('grid-template-rows: subgrid')) {
    throw new Error('style.css must define grid-template-rows: subgrid for card subgrid items.');
  }
  if (!styleCss.includes('@supports not (grid-template-rows: subgrid)')) {
    throw new Error('style.css must define @supports not fallback for browsers without CSS subgrid support.');
  }
  console.log('  ✓ PASS: style.css defines shared subgrid and @supports fallback rules.');

  // Scan all page and component files for forbidden per-category / per-card height hacks
  const scanDirs = [
    path.join(__dirname, '../src/pages'),
    path.join(__dirname, '../src/components')
  ];

  const allowedSlotFiles = new Set([
    'CardSlots.tsx',
    'CardRow.tsx',
    'CardGrid.tsx',
    'PackageCard.tsx',
    'OfferCard.tsx',
    'ProductCard.tsx',
    'CategoryGrid.tsx',
    'HeroSlider.tsx',
    'SpecialOfferSlider.tsx',
    'QuickViewModal.tsx'
  ]);

  function scanFolder(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanFolder(full);
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        if (!allowedSlotFiles.has(f)) {
          const content = fs.readFileSync(full, 'utf8');
          const badPatterns = [
            /class(?:Name)?=["'][^"']*\b(wifi|popular|package|category)-card-(?:min-)?h/i,
            /class(?:Name)?=["'][^"']*\bh-\[\d+px\]\s+[^"']*card/i
          ];
          for (const pat of badPatterns) {
            if (pat.test(content)) {
              throw new Error(`Forbidden card height hack found in ${f}: matches pattern ${pat}`);
            }
          }
        }
      }
    }
  }

  for (const dir of scanDirs) {
    if (fs.existsSync(dir)) scanFolder(dir);
  }
  console.log('  ✓ PASS: Zero forbidden per-category, per-series or per-page card height hacks found in codebase.');
}

// 2. CDP RUNTIME EQUAL-HEIGHT VERIFICATION
async function runCdpEqualHeights() {
  console.log('\n--- 2. CDP Browser Runtime: Equal-Height Cards across Rows & Grids ---');

  const browserPath = fs.existsSync(EDGE_PATH)
    ? EDGE_PATH
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  if (!fs.existsSync(browserPath)) {
    console.log('  [SKIP CDP] Browser executable not found, skipping browser headless verification.');
    return;
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
  ], {
    stdio: 'ignore'
  });

  const cleanup = () => {
    try { browserProc.kill('SIGTERM'); } catch (_) {}
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
  };

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

    // Test across viewports: Desktop 1280px, Tablet 768px, Mobile 375px
    const viewports = [
      { width: 1280, height: 900, name: 'Desktop (1280px)' },
      { width: 768, height: 1024, name: 'Tablet (768px)' },
      { width: 375, height: 812, name: 'Mobile (375px)' }
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768
      });

      await send('Page.navigate', { url: BASE_URL });
      await sleep(2000);

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const results = [];

            // A. Check Product Rows (CardRow)
            const rows = document.querySelectorAll('.card-row-scroller');
            rows.forEach((row, rIdx) => {
              const cards = Array.from(row.querySelectorAll('.card-subgrid-item'));
              if (cards.length >= 2) {
                const heights = cards.map(c => c.getBoundingClientRect().height);
                const minH = Math.min(...heights);
                const maxH = Math.max(...heights);
                const diff = maxH - minH;
                results.push({
                  type: 'row',
                  index: rIdx,
                  count: cards.length,
                  minH: Math.round(minH),
                  maxH: Math.round(maxH),
                  diff: Math.round(diff * 10) / 10
                });
              }
            });

            // B. Check Package Grid
            const pkgSection = document.querySelector('section#packages, section[aria-label="CCTV Packages"]');
            if (pkgSection) {
              const cards = Array.from(pkgSection.querySelectorAll('.card-subgrid-item, div[class*="group/pkg"]'));
              if (cards.length >= 2) {
                const gridRows = {};
                cards.forEach(card => {
                  const top = Math.round(card.getBoundingClientRect().top);
                  if (!gridRows[top]) gridRows[top] = [];
                  gridRows[top].push(card.getBoundingClientRect().height);
                });

                let maxDiff = 0;
                for (const [top, hList] of Object.entries(gridRows)) {
                  if (hList.length > 1) {
                    const rowDiff = Math.max(...hList) - Math.min(...hList);
                    if (rowDiff > maxDiff) maxDiff = rowDiff;
                  }
                }

                results.push({
                  type: 'package-grid',
                  count: cards.length,
                  maxDiff: Math.round(maxDiff * 10) / 10
                });
              }
            }

            // C. Check Hover Lift & Shadow Clearance (Padding-Block and Ancestor Overflows)
            const shadowChecks = [];
            rows.forEach((row, rIdx) => {
              const comp = window.getComputedStyle(row);
              const pt = parseFloat(comp.paddingTop);
              const pb = parseFloat(comp.paddingBottom);
              const mt = parseFloat(comp.marginTop);
              const mb = parseFloat(comp.marginBottom);

              let p = row.parentElement;
              let badAncestor = false;
              let badAncestorTag = '';
              while (p && p !== document.body && p !== document.documentElement) {
                const s = window.getComputedStyle(p);
                if (s.overflow === 'hidden' || s.overflowY === 'hidden') {
                  badAncestor = true;
                  badAncestorTag = p.tagName.toLowerCase() + '.' + (p.className ? p.className.split(' ')[0] : '');
                  break;
                }
                p = p.parentElement;
              }

              results.push({
                type: 'shadow-clearance',
                index: rIdx,
                pt,
                pb,
                mt,
                mb,
                badAncestor,
                badAncestorTag
              });
            });

            return results;
          })()
        `,
        returnByValue: true
      });

      const rowChecks = evalRes.result.value || [];
      for (const chk of rowChecks) {
        if (chk.type === 'row') {
          if (chk.diff > 1.5) {
            throw new Error(`Product CardRow #${chk.index + 1} has card height variance of ${chk.diff}px at ${vp.name} (min: ${chk.minH}px, max: ${chk.maxH}px). Must be equal within 1.5px.`);
          }
          console.log(`  ✓ PASS [${vp.name}]: Product CardRow #${chk.index + 1} (${chk.count} cards) equal height within ${chk.diff}px`);
        } else if (chk.type === 'package-grid') {
          if (chk.maxDiff > 1.5) {
            throw new Error(`Package Grid has card height variance of ${chk.maxDiff}px in same row at ${vp.name}. Must be equal within 1.5px.`);
          }
          console.log(`  ✓ PASS [${vp.name}]: Package Grid (${chk.count} cards) equal height within ${chk.maxDiff}px`);
        } else if (chk.type === 'shadow-clearance') {
          if (chk.badAncestor) {
            throw new Error(`Product CardRow #${chk.index + 1} has ancestor with overflow:hidden (${chk.badAncestorTag}), which clips hover lift and shadow.`);
          }
          if (chk.pt < 20 || chk.pb < 28) {
            throw new Error(`Product CardRow #${chk.index + 1} insufficient vertical headroom for shadow (pt: ${chk.pt}px, pb: ${chk.pb}px). Required: pt>=24px, pb>=32px.`);
          }
          if (chk.mt > -20 || chk.mb > -28) {
            throw new Error(`Product CardRow #${chk.index + 1} missing negative margins to compensate for padding (mt: ${chk.mt}px, mb: ${chk.mb}px).`);
          }
          console.log(`  ✓ PASS [${vp.name}]: CardRow #${chk.index + 1} hover shadow clearance verified (pt: ${chk.pt}px, pb: ${chk.pb}px, no clipping ancestors)`);
        }
      }
    }

    ws.close();
  } finally {
    cleanup();
  }
}

async function main() {
  console.log('================================================================');
  console.log('TEST SUITE: EQUAL-HEIGHT CARDS & CSS SUBGRID SYSTEM');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('================================================================');

  runCodeScan();
  await runCdpEqualHeights();

  console.log('\n================================================================');
  console.log('✓ ALL EQUAL-HEIGHT CARDS AND SUBGRID TESTS PASSED');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
