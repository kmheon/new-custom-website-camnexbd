// scripts/test_shop_filters.js
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';
const BASE_URL = 'http://127.0.0.1:3000';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('CamneX Bangladesh: Shop Filter Logic & Expandable Filters Suite');
  console.log('===============================================================\n');

  // --- 1. Backend API Multi-Brand & Combined Filters Verification ---
  console.log('--- 1. Backend Multi-Brand & Combined Filter API Verification ---');
  
  const allProds = await fetch(`${BASE_URL}/api/products?limit=1000`).then(r => r.json());
  assert(allProds.total > 0, `Total catalog products available: ${allProds.total}`);

  const hikProds = await fetch(`${BASE_URL}/api/products?brands=hikvision`).then(r => r.json());
  assert(hikProds.total > 0, `Single brand query (brands=hikvision) returns products: ${hikProds.total}`);

  const dahuaProds = await fetch(`${BASE_URL}/api/products?brands=dahua`).then(r => r.json());
  assert(dahuaProds.total > 0, `Single brand query (brands=dahua) returns products: ${dahuaProds.total}`);

  const multiBrandProds = await fetch(`${BASE_URL}/api/products?brands=hikvision,dahua`).then(r => r.json());
  assert(multiBrandProds.total === hikProds.total + dahuaProds.total, 
    `Multi-brand query (brands=hikvision,dahua) returns exact union sum (${multiBrandProds.total} === ${hikProds.total} + ${dahuaProds.total})`);

  const combinedProds = await fetch(`${BASE_URL}/api/products?brands=hikvision,dahua&specFilters=${encodeURIComponent(JSON.stringify({ resolution: ['4MP'] }))}`).then(r => r.json());
  assert(combinedProds.total > 0 && combinedProds.total <= multiBrandProds.total,
    `Combined multi-brand + spec filter returns matching intersection (${combinedProds.total} <= ${multiBrandProds.total})`);

  // --- 2. Browser CDP Tests: Desktop Filters & Expand/Collapse ---
  console.log('\n--- 2. Desktop Browser CDP Verification (1440x900) ---');
  const edge = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9996',
    'http://127.0.0.1:3000/catalog'
  ], { stdio: 'ignore' });

  await sleep(2500);

  try {
    const list = await fetch('http://127.0.0.1:9996/json').then(r => r.json());
    const pageTarget = list.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return res.result.value;
    };

    const screenshot = async (filename) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    };

    // Set desktop viewport
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE_URL}/catalog` });
    await sleep(2000);

    // 2a. Check Brand Filter group rendered
    const hasBrandGroup = await evaluate(`Boolean(document.querySelector('[data-testid="filter-group-brand"]'))`);
    assert(hasBrandGroup, 'Brands filter group is rendered in desktop sidebar');

    // 2b. Expand/Collapse for Brands (> 5 options)
    console.log('\n--- Testing Expand/Collapse for Brands (> 5 options) ---');
    const initialBrandCount = await evaluate(`(() => {
      const list = document.querySelector('[data-testid="expandable-filter-list-brand"]');
      if (!list) return 0;
      return list.querySelectorAll('button[data-testid^="facet-brand-"]').length;
    })()`);
    assert(initialBrandCount === 5, `Initial collapsed brands list displays exactly 5 options (got ${initialBrandCount})`);

    const showMoreText = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="show-more-btn-brand"]');
      return btn ? btn.innerText.trim() : null;
    })()`);
    assert(showMoreText && showMoreText.includes('Show more'), `"Show more" button visible: "${showMoreText}"`);

    // Click "Show more"
    await evaluate(`document.querySelector('[data-testid="show-more-btn-brand"]').click()`);
    await sleep(400);

    const expandedBrandCount = await evaluate(`(() => {
      const list = document.querySelector('[data-testid="expandable-filter-list-brand"]');
      return list ? list.querySelectorAll('button[data-testid^="facet-brand-"]').length : 0;
    })()`);
    assert(expandedBrandCount === 13, `Expanded brands list displays all 13 options (got ${expandedBrandCount})`);

    const showLessText = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="show-less-btn-brand"]');
      return btn ? btn.innerText.trim() : null;
    })()`);
    assert(showLessText && showLessText.includes('Show less'), `"Show less" button visible: "${showLessText}"`);

    // Click "Show less"
    await evaluate(`document.querySelector('[data-testid="show-less-btn-brand"]').click()`);
    await sleep(400);

    const reCollapsedBrandCount = await evaluate(`(() => {
      const list = document.querySelector('[data-testid="expandable-filter-list-brand"]');
      return list ? list.querySelectorAll('button[data-testid^="facet-brand-"]').length : 0;
    })()`);
    assert(reCollapsedBrandCount === 5, `Re-collapsed brands list returns to 5 options (got ${reCollapsedBrandCount})`);

    // 2c. Selection beyond first 5 options remains visible in collapsed state
    console.log('\n--- Testing Selected Option Beyond First 5 in Collapsed State ---');
    // First expand to click the 11th brand (EZVIZ, slug: 'ezviz')
    await evaluate(`document.querySelector('[data-testid="show-more-btn-brand"]').click()`);
    await sleep(400);

    const ezvizClicked = await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid="facet-brand-ezviz"]');
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
    assert(ezvizClicked, 'Clicked EZVIZ brand button in expanded list');
    await sleep(1000);

    // Collapse list
    await evaluate(`document.querySelector('[data-testid="show-less-btn-brand"]').click()`);
    await sleep(400);

    // Verify EZVIZ is still visible even though the list is collapsed!
    const ezvizInCollapsed = await evaluate(`(() => {
      const list = document.querySelector('[data-testid="expandable-filter-list-brand"]');
      return Boolean(list && list.querySelector('button[data-testid="facet-brand-ezviz"]'));
    })()`);
    assert(ezvizInCollapsed, 'Selected brand beyond first 5 (EZVIZ) remains visible in collapsed state');

    // Deselect EZVIZ
    await evaluate(`document.querySelector('[data-testid="expandable-filter-list-brand"] button[data-testid="facet-brand-ezviz"]').click()`);
    await sleep(800);

    // 2d. Combined Multi-Brand + Dynamic Spec Filtering (Fixing Filter Reset Bug)
    console.log('\n--- Testing Multi-Filter Combination & Bug Fix (Brand + Spec + Category) ---');
    await send('Page.navigate', { url: `${BASE_URL}/category/cctv-cameras` });
    await sleep(2000);

    // 1. Select a specification first: Resolution (e.g. 2MP or 4MP)
    const specInfo = await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid^="facet-resolution-"]');
      if (!btn) return null;
      const testId = btn.getAttribute('data-testid');
      btn.click();
      return testId;
    })()`);
    assert(specInfo !== null, `Selected resolution specification: ${specInfo}`);
    await sleep(1000);

    const activeSpecChipBefore = await evaluate(`Boolean(document.querySelector('[data-testid^="active-chip-resolution-"]'))`);
    assert(activeSpecChipBefore, 'Active specification chip displayed');

    // 2. Now select a brand: Hikvision
    const hikClicked = await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid="facet-brand-hikvision"]');
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    assert(hikClicked, 'Clicked Hikvision brand facet button');
    await sleep(1000);

    // CRITICAL BUG VERIFICATION: Does selecting a brand discard other filters?
    const specChipAfterBrand = await evaluate(`Boolean(document.querySelector('[data-testid^="active-chip-resolution-"]'))`);
    assert(specChipAfterBrand, 'CRITICAL BUG FIXED: Active specification chip was PRESERVED after selecting a brand');

    const brandChipAfterHik = await evaluate(`Boolean(document.querySelector('[data-testid*="active-chip-brand-hikvision"]'))`);
    assert(brandChipAfterHik, 'Active brand chip displayed for Hikvision');

    // 3. Multi-brand selection: also select Dahua
    const dahuaClicked = await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid="facet-brand-dahua"]');
      if (!btn) return false;
      btn.click();
      return true;
    })()`);
    assert(dahuaClicked, 'Clicked Dahua brand facet button (multi-brand selection)');
    await sleep(1000);

    const activeChipsState = await evaluate(`(() => {
      return {
        hasHik: Boolean(document.querySelector('[data-testid*="active-chip-brand-hikvision"]')),
        hasDahua: Boolean(document.querySelector('[data-testid*="active-chip-brand-dahua"]')),
        hasSpec: Boolean(document.querySelector('[data-testid^="active-chip-resolution-"]'))
      };
    })()`);
    assert(activeChipsState.hasHik && activeChipsState.hasDahua && activeChipsState.hasSpec,
      'Active filter chips display Hikvision + Dahua + Resolution simultaneously');

    // 4. Remove individual brand chip
    console.log('\n--- Testing Individual Filter Removal ---');
    await evaluate(`(() => {
      const removeBtn = document.querySelector('button[data-testid="remove-brand-chip-hikvision"]');
      if (removeBtn) removeBtn.click();
    })()`);
    await sleep(1000);

    const chipsAfterRemoval = await evaluate(`(() => {
      return {
        hasHik: Boolean(document.querySelector('[data-testid*="active-chip-brand-hikvision"]')),
        hasDahua: Boolean(document.querySelector('[data-testid*="active-chip-brand-dahua"]')),
        hasSpec: Boolean(document.querySelector('[data-testid^="active-chip-resolution-"]'))
      };
    })()`);
    assert(!chipsAfterRemoval.hasHik, 'Hikvision chip was cleanly removed');
    assert(chipsAfterRemoval.hasDahua, 'Dahua brand chip was preserved after removing Hikvision');
    assert(chipsAfterRemoval.hasSpec, 'Resolution specification chip was preserved after removing Hikvision');

    // 5. Test "Clear All"
    console.log('\n--- Testing Clear All Filters ---');
    await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid="clear-all-chips-btn"]');
      if (btn) btn.click();
    })()`);
    await sleep(1000);

    const chipsBarAfterClear = await evaluate(`Boolean(document.querySelector('[data-testid="active-filter-chips-bar"]'))`);
    assert(!chipsBarAfterClear, 'All active chips cleared after clicking Clear All');

    // Screenshot desktop combined filters
    await screenshot('shop_filters_desktop_combined_1440x900.png');

    // --- 3. Mobile Viewport (390px) Filter Drawer Verification ---
    console.log('\n--- 3. Mobile Viewport (390px) Filter Drawer Verification ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: `${BASE_URL}/catalog` });
    await sleep(2000);

    // Open mobile filter modal
    const openedModal = await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Filters'));
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
    assert(openedModal, 'Mobile "Filters" trigger button clicked');
    await sleep(600);

    const mobileModalVisible = await evaluate(`Boolean(document.querySelector('[data-testid="mobile-filter-modal"]'))`);
    assert(mobileModalVisible, 'Mobile filter drawer modal opened');

    const mobileBrandGroupVisible = await evaluate(`Boolean(document.querySelector('[data-testid="mobile-filter-group-brand"]'))`);
    assert(mobileBrandGroupVisible, 'Mobile Brands filter section rendered');

    // Expand mobile brands
    const mobileShowMoreClicked = await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid="mobile-show-more-btn-brand"]');
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
    assert(mobileShowMoreClicked, 'Clicked "Show more" in mobile Brands filter');
    await sleep(400);

    const mobileShowLessVisible = await evaluate(`Boolean(document.querySelector('button[data-testid="mobile-show-less-btn-brand"]'))`);
    assert(mobileShowLessVisible, 'Mobile toggle switched to "Show less"');

    // Select Dahua in mobile
    await evaluate(`(() => {
      const btn = document.querySelector('button[data-testid="mobile-facet-brand-dahua"]');
      if (btn) btn.click();
    })()`);
    await sleep(400);

    await screenshot('shop_filters_mobile_drawer_390x844.png');

    // Apply mobile filters
    await evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Apply Filters'));
      if (btn) btn.click();
    })()`);
    await sleep(1000);

    const mobileDahuaChipApplied = await evaluate(`Boolean(document.querySelector('[data-testid*="active-chip-brand-dahua"]'))`);
    assert(mobileDahuaChipApplied, 'Dahua active brand chip is displayed on mobile after applying');

    await screenshot('shop_filters_mobile_applied_390x844.png');

    // --- 4. Verify Dedicated Brands Page (/brands) Untouched ---
    console.log('\n--- 4. Dedicated Brands Page (/brands) Integrity Verification ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE_URL}/brands` });
    await sleep(2000);

    const dedicatedBrandsState = await evaluate(`(() => {
      const heading = document.querySelector('h1');
      const search = document.querySelector('input[placeholder*="Search"]');
      const cards = document.querySelectorAll('[data-testid^="brand-card-"]');
      const actionFooters = Array.from(document.querySelectorAll('span')).filter(s => s.innerText.includes('Explore Products') || s.innerText.includes('View Brand'));
      return {
        heading: heading ? heading.innerText : null,
        hasSearch: Boolean(search),
        brandCardsCount: cards.length,
        actionFooterCount: actionFooters.length
      };
    })()`);
    console.log('Dedicated Brands Page Inspection:', dedicatedBrandsState);
    assert(dedicatedBrandsState.heading && dedicatedBrandsState.heading.toLowerCase().includes('brand'),
      `Dedicated Brands page heading intact: "${dedicatedBrandsState.heading}"`);
    assert(dedicatedBrandsState.hasSearch, 'Search input is present on dedicated /brands page');
    assert(dedicatedBrandsState.brandCardsCount > 0, `Dedicated brand cards present: ${dedicatedBrandsState.brandCardsCount}`);
    assert(dedicatedBrandsState.actionFooterCount > 0, `Dedicated brand cards action footers present: ${dedicatedBrandsState.actionFooterCount}`);

    await screenshot('dedicated_brands_page_1440x900.png');

    ws.close();
  } finally {
    edge.kill();
  }

  console.log('\n===============================================================');
  console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
  console.log('===============================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
