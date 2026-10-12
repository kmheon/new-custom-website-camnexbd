#!/usr/bin/env node
/**
 * Final Homepage Tweaks CDP Test Suite (headless browser).
 *
 * Each check is a browser-side expression returning an array of error strings.
 * Checks run at 375px and 1280px, and a screenshot of each viewport is saved
 * to scratch/shots/tweaks-<width>px.png.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = parseInt(process.env.TWEAKS_CDP_PORT || '9802', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `final_tweaks_${Date.now()}`);
const TEST_PORT = process.env.TEST_PORT || '3000';
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${TEST_PORT}`;
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Browser-side checks. Each is the body of an async function returning string[].
// ---------------------------------------------------------------------------
const CHECKS = [
  {
    name: 'System-type control renders real buttons (>=2 types) or nothing (<2); no empty/skeleton bar',
    body: `
      const errors = [];
      const [pkgs, types] = await Promise.all([
        fetch('/api/packages').then(r => r.json()),
        fetch('/api/package-system-types').then(r => r.json())
      ]);
      const list = Array.isArray(pkgs) ? pkgs : (pkgs.items || []);
      const typesWithPkgs = types.filter(t => t.enabled !== false && list.some(p => (p.systemTypeSlug || '') === t.slug || p.systemTypeId === t.id));
      const section = document.querySelector('section#packages');
      if (!section) return ['Packages section not found'];
      const group = section.querySelector('[role="radiogroup"]');
      if (typesWithPkgs.length >= 2) {
        if (!group) errors.push('Expected system-type control for ' + typesWithPkgs.length + ' types, found none');
        else {
          const btns = Array.from(group.querySelectorAll('button[role="radio"]')).filter(b => b.getBoundingClientRect().width > 0 && b.textContent.trim().length > 0);
          if (btns.length !== typesWithPkgs.length) errors.push('Expected ' + typesWithPkgs.length + ' visible system-type buttons, found ' + btns.length);
        }
      } else if (group) {
        errors.push('System-type control rendered although fewer than 2 types have packages');
      }
      // No empty pill/skeleton containers anywhere in the toolbar area
      const toolbar = section.querySelector('select#filter-cameras')?.closest('div[class*="rounded-2xl"]');
      if (toolbar) {
        toolbar.querySelectorAll('*').forEach(el => {
          const cls = String(el.className || '');
          if (cls.includes('animate-pulse')) errors.push('Skeleton element in toolbar: ' + cls);
          if (/bg-slate-100|bg-gray-100|rounded-xl/.test(cls) && el.children.length === 0 && el.textContent.trim() === '' && el.tagName !== 'svg' && !el.closest('svg') && el.getBoundingClientRect().width > 40) {
            errors.push('Empty pill-like element in toolbar: <' + el.tagName.toLowerCase() + ' class="' + cls + '">');
          }
        });
      }
      // Removed helper line and wording
      if (/Choose an architecture/i.test(section.innerText)) errors.push('Old toolbar helper line still present');
      const nightSel = section.querySelector('select#filter-night-view');
      if (nightSel && !/^Night picture: All/.test(nightSel.options[0].textContent.trim())) {
        errors.push('Night dropdown first option should read "Night picture: All", got "' + nightSel.options[0].textContent.trim() + '"');
      }
      return errors;
    `
  },
  {
    name: 'Package tag ribbon matches admin tag; technology label is separate and never replaces it',
    body: `
      const errors = [];
      const pkgs = await fetch('/api/packages').then(r => r.json());
      const list = Array.isArray(pkgs) ? pkgs : (pkgs.items || []);
      const byId = Object.fromEntries(list.map(p => [p.id, p]));
      const cards = Array.from(document.querySelectorAll('section#packages [data-package-id]'));
      if (cards.length === 0) return ['No package cards rendered'];
      cards.forEach(card => {
        const p = byId[card.getAttribute('data-package-id')];
        if (!p) return;
        const ribbon = card.querySelector('[data-pkg-tag]');
        const tech = card.querySelector('[data-pkg-tech]');
        const tag = (p.badge || '').trim();
        if (tag && (!ribbon || ribbon.textContent.trim().toLowerCase() !== tag.toLowerCase())) errors.push(p.name + ': expected ribbon "' + tag + '"');
        if (!tag && ribbon) errors.push(p.name + ': ribbon shown without a tag');
        if (ribbon && tech && ribbon.contains(tech)) errors.push(p.name + ': technology label inside ribbon');
        if (p.technologyLabel && (!tech || tech.textContent.trim() !== p.technologyLabel)) errors.push(p.name + ': technology label missing under title');
        if (ribbon && p.technologyLabel && ribbon.textContent.trim() === p.technologyLabel && tag !== p.technologyLabel) errors.push(p.name + ': ribbon shows technology label');
      });
      return errors;
    `
  },
  {
    name: 'Package item names: short, never end in "...", fit in 2 lines; popover shows full names',
    body: `
      const errors = [];
      const pkgs = await fetch('/api/packages').then(r => r.json());
      const list = Array.isArray(pkgs) ? pkgs : (pkgs.items || []);
      const byId = Object.fromEntries(list.map(p => [p.id, p]));
      const cards = Array.from(document.querySelectorAll('section#packages [data-package-id]'));
      cards.forEach(card => {
        const p = byId[card.getAttribute('data-package-id')];
        card.querySelectorAll('[data-pkg-item]').forEach(el => {
          const t = el.textContent.trim();
          if (/(\\.\\.\\.|\\u2026)$/.test(t)) errors.push((p && p.name) + ': item ends in ellipsis: "' + t + '"');
          if (t.length > 36) errors.push((p && p.name) + ': short name longer than 36 chars: "' + t + '"');
          if (el.scrollHeight > el.clientHeight + 1) errors.push((p && p.name) + ': item is clamped (overflows 2 lines): "' + t + '"');
          const cs = getComputedStyle(el);
          if (cs.textOverflow === 'ellipsis' && cs.whiteSpace === 'nowrap') errors.push((p && p.name) + ': item uses single-line truncate');
        });
      });
      // Popover shows the full names
      const firstCard = cards[0];
      const btn = firstCard && Array.from(firstCard.querySelectorAll('button')).find(b => /See what/i.test(b.textContent));
      if (!btn) errors.push('No "See what\\'s included" button on first package card');
      else {
        btn.click();
        await new Promise(r => setTimeout(r, 300));
        const dialog = document.querySelector('[role="dialog"]');
        const full = dialog ? Array.from(dialog.querySelectorAll('[data-pkg-full-item]')).map(e => e.textContent.trim()) : [];
        const expected = (byId[firstCard.getAttribute('data-package-id')]?.inclusions) || [];
        if (!dialog) errors.push('Popover did not open');
        else if (expected.length && JSON.stringify(full) !== JSON.stringify(expected)) errors.push('Popover names differ from full inclusion names: ' + JSON.stringify(full));
        if (dialog) dialog.click();
        await new Promise(r => setTimeout(r, 200));
      }
      return errors;
    `
  },
  {
    name: 'Each homepage section has at most one "view all" control (never both header link and bottom button)',
    body: `
      const errors = [];
      const sections = Array.from(document.querySelectorAll('main section, #packages, #solutions'));
      sections.forEach(sec => {
        const titleEl = sec.querySelector('h2, h3');
        const secName = titleEl ? titleEl.textContent.trim() : (sec.getAttribute('aria-label') || sec.id);
        const headerAction = Array.from(sec.querySelectorAll('button, a')).filter(el => {
          const t = el.textContent.trim();
          const isTop = el.closest('[class*="justify-between"]') && !el.closest('.card-row-scroller') && !el.closest('[class*="mt-"]');
          return isTop && /^(View all|All packages|All categories)/i.test(t);
        });
        const bottomBtn = Array.from(sec.querySelectorAll('button, a')).filter(el => {
          const t = el.textContent.trim();
          const isBottom = el.closest('[class*="mt-5"], [class*="mt-8"], [class*="justify-center"]') && !el.closest('.card-row-scroller');
          return isBottom && /^(See all|View all)/i.test(t);
        });
        if (headerAction.length > 0 && bottomBtn.length > 0) {
          errors.push(secName + ': has both header link ("' + headerAction[0].textContent.trim() + '") and bottom button ("' + bottomBtn[0].textContent.trim() + '")');
        }
      });
      const pkgSec = document.querySelector('section#packages');
      if (pkgSec) {
        const topLink = Array.from(pkgSec.querySelectorAll('h2, h3')).some(h => {
          const header = h.closest('[class*="justify-between"]');
          return header && header.querySelector('button, a');
        });
        if (topLink) errors.push('Packages section still has a header "All packages" link');
      }
      return errors;
    `
  }
];

async function main() {
  console.log('================================================================');
  console.log('FINAL HOMEPAGE TWEAKS CDP TEST SUITE');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('================================================================');

  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const browserPath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;
  if (!fs.existsSync(browserPath)) throw new Error(`Browser executable not found at ${browserPath}`);
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  const browserProc = cp.spawn(browserPath, [
    '--headless=new', '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { browserProc.kill('SIGTERM'); } catch (_) {}
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
  };
  process.on('exit', cleanup);

  try {
    await sleep(2200);
    const targets = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
    const target = targets.find((t) => t.type === 'page');
    if (!target) throw new Error('No page target');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    const viewports = [
      { width: 375, height: 812, mobile: true },
      { width: 1280, height: 900, mobile: false }
    ];

    let failures = 0;
    for (const vp of viewports) {
      console.log(`\n--- Viewport ${vp.width}px ---`);
      await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile });
      await send('Page.navigate', { url: BASE_URL });
      await sleep(2500);

      for (const check of CHECKS) {
        const res = await send('Runtime.evaluate', {
          expression: `(async () => { ${check.body} })()`,
          awaitPromise: true,
          returnByValue: true
        });
        if (res.exceptionDetails) {
          failures++;
          console.log(`  ✗ FAIL: ${check.name}\n      exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
          continue;
        }
        const errs = res.result.value || [];
        if (errs.length) {
          failures++;
          console.log(`  ✗ FAIL: ${check.name}`);
          errs.slice(0, 12).forEach((e) => console.log(`      - ${e}`));
        } else {
          console.log(`  ✓ PASS: ${check.name}`);
        }
      }

      const metrics = await send('Page.getLayoutMetrics');
      const h = Math.min(12000, Math.ceil(metrics.cssContentSize?.height || 5000));
      await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: h, deviceScaleFactor: 1, mobile: vp.mobile });
      await sleep(300);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(SHOTS_DIR, `tweaks-${vp.width}px.png`);
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(`  Screenshot: ${file}`);
    }

    ws.close();
    if (failures) {
      console.error(`\n❌ FINAL TWEAKS SUITE: ${failures} failing check(s)`);
      cleanup();
      process.exit(1);
    }
    console.log('\n✓ ALL FINAL TWEAKS CHECKS PASSED');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FINAL TWEAKS SUITE ERROR:', err.message || err);
    cleanup();
    process.exit(1);
  }
}

main();

