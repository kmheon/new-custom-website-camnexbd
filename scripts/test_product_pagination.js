// scripts/test_product_pagination.js
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

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
  console.log('\n=== CamneX Bangladesh: Product Pagination & Display Controls Test Suite ===\n');

  const edgeProc = cp.spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9962',
    '--user-data-dir=C:\\Windows\\Temp\\edge_verify_pagination',
    'about:blank'
  ]);
  await sleep(2500);

  try {
    const list = await fetch('http://127.0.0.1:9962/json').then(r => r.json());
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (m, p = {}) => new Promise((resolve, reject) => {
      const cur = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === cur) {
          ws.removeEventListener('message', handler);
          if (d.error) reject(new Error(d.error.message));
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

    async function evaluate(expression) {
      try {
        const res = await send('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true
        });
        if (res?.exceptionDetails) {
          return null;
        }
        return res?.result?.value;
      } catch (err) {
        return null;
      }
    }

    async function waitForElement(selector, timeoutMs = 15000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const found = await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
        if (found) return true;
        await sleep(300);
      }
      throw new Error(`Timeout waiting for selector: ${selector}`);
    }

    async function takeScreenshot(filepath) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    // 1. Initial Desktop Viewport (1440x900)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('--- 1. Testing Default Pagination on /catalog ---');
    await send('Page.navigate', { url: `${BASE_URL}/catalog` });
    await sleep(2500);
    await waitForElement('[data-testid="products-per-page-select"]');
    await sleep(1500);

    const defaultPageSize = await evaluate(`document.querySelector('[data-testid="products-per-page-select"]').value`);
    assert(defaultPageSize === '24', `Default page size selector is 24 (got ${defaultPageSize})`);

    const resultCountText = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(resultCountText.includes('Showing 1–24 of 59 verified products'), `Result text shows range "1–24 of 59" (got: "${resultCountText}")`);

    const cardCountPage1 = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(cardCountPage1 === 24, `Page 1 displays exactly 24 product cards (got ${cardCountPage1})`);

    const isPrevDisabled = await evaluate(`document.querySelector('[data-testid="prev-page-btn"]').disabled`);
    assert(isPrevDisabled === true, 'Previous button is disabled on page 1');

    const isNextDisabled = await evaluate(`document.querySelector('[data-testid="next-page-btn"]').disabled`);
    assert(isNextDisabled === false, 'Next button is enabled on page 1');

    const page1Active = await evaluate(`document.querySelector('[data-testid="page-num-1"]').classList.contains('bg-[#F15A24]')`);
    assert(page1Active === true, 'Page 1 button has active highlight');

    const topPaginationText = await evaluate(`document.querySelector('[data-testid="top-pagination"] span')?.innerText`);
    assert(topPaginationText === '1 / 3', `Top pagination indicator shows "1 / 3" (got "${topPaginationText}")`);

    await takeScreenshot(path.join(ARTIFACT_DIR, 'pagination_catalog_page_1_desktop_1440x900.png'));

    // 2. Navigate to Page 2
    console.log('\n--- 2. Navigating to Page 2 ---');
    await evaluate(`document.querySelector('[data-testid="page-num-2"]').click()`);
    await sleep(1000);

    const page2Range = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(page2Range.includes('Showing 25–48 of 59 verified products'), `Page 2 shows range "25–48 of 59" (got: "${page2Range}")`);

    const cardCountPage2 = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(cardCountPage2 === 24, `Page 2 displays 24 product cards (got ${cardCountPage2})`);

    const page2Active = await evaluate(`document.querySelector('[data-testid="page-num-2"]').classList.contains('bg-[#F15A24]')`);
    assert(page2Active === true, 'Page 2 button is now active');

    const isPrevPage2Disabled = await evaluate(`document.querySelector('[data-testid="prev-page-btn"]').disabled`);
    assert(isPrevPage2Disabled === false, 'Previous button is now enabled on page 2');

    const topPaginationPage2 = await evaluate(`document.querySelector('[data-testid="top-pagination"] span')?.innerText`);
    assert(topPaginationPage2 === '2 / 3', `Top pagination indicator shows "2 / 3" on page 2 (got "${topPaginationPage2}")`);

    await takeScreenshot(path.join(ARTIFACT_DIR, 'pagination_catalog_page_2_desktop_1440x900.png'));

    // 3. Navigate to Page 3 (Last Page)
    console.log('\n--- 3. Navigating to Page 3 (Final Page) ---');
    await evaluate(`document.querySelector('[data-testid="next-page-btn"]').click()`);
    await sleep(1000);

    const page3Range = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(page3Range.includes('Showing 49–59 of 59 verified products'), `Page 3 shows range "49–59 of 59" (got: "${page3Range}")`);

    const cardCountPage3 = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(cardCountPage3 === 11, `Page 3 displays remaining 11 product cards (got ${cardCountPage3})`);

    const isNextPage3Disabled = await evaluate(`document.querySelector('[data-testid="next-page-btn"]').disabled`);
    assert(isNextPage3Disabled === true, 'Next button is disabled on the last page (page 3)');

    const isPrevPage3Disabled = await evaluate(`document.querySelector('[data-testid="prev-page-btn"]').disabled`);
    assert(isPrevPage3Disabled === false, 'Previous button remains enabled on page 3');

    await takeScreenshot(path.join(ARTIFACT_DIR, 'pagination_catalog_page_3_desktop_1440x900.png'));

    async function selectDropdownOption(selector, val) {
      return await evaluate(`(() => {
        const sel = document.querySelector(${JSON.stringify(selector)});
        if (!sel) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        setter.call(sel, ${JSON.stringify(val)});
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`);
    }

    // 4. Changing Products Per Page Options
    console.log('\n--- 4. Testing Products-Per-Page Options & Page Reset ---');
    
    // Select 12 per page
    await selectDropdownOption('[data-testid="products-per-page-select"]', '12');
    await sleep(1000);

    const range12 = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(range12.includes('Showing 1–12 of 59 verified products'), `Selecting 12 resets to page 1 and shows "1–12 of 59" (got: "${range12}")`);

    const cardCount12 = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(cardCount12 === 12, `Displays exactly 12 cards per page (got ${cardCount12})`);

    const hasPage5 = await evaluate(`Boolean(document.querySelector('[data-testid="page-num-5"]'))`);
    assert(hasPage5 === true, 'Page 5 button exists for 12 per page (59 / 12 = 5 pages)');

    await takeScreenshot(path.join(ARTIFACT_DIR, 'pagination_catalog_12_per_page_desktop_1440x900.png'));

    // Select 48 per page
    await selectDropdownOption('[data-testid="products-per-page-select"]', '48');
    await sleep(1000);

    const range48 = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(range48.includes('Showing 1–48 of 59 verified products'), `Selecting 48 shows "1–48 of 59" (got: "${range48}")`);

    const cardCount48 = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(cardCount48 === 48, `Displays exactly 48 cards per page (got ${cardCount48})`);

    // Select "All products"
    await selectDropdownOption('[data-testid="products-per-page-select"]', 'all');
    await sleep(1200);

    const rangeAll = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(rangeAll.includes('Showing all 59 verified products'), `Selecting "all" shows "Showing all 59 verified products" (got: "${rangeAll}")`);

    const cardCountAll = await evaluate(`document.querySelectorAll('main .grid > div').length`);
    assert(cardCountAll === 59, `Displays all 59 cards on one page (got ${cardCountAll})`);

    const paginationHiddenOnAll = await evaluate(`document.querySelector('[data-testid="pagination-controls"]') === null`);
    assert(paginationHiddenOnAll === true, 'Bottom pagination is cleanly hidden when "All products" is selected');

    await takeScreenshot(path.join(ARTIFACT_DIR, 'pagination_catalog_all_products_desktop_1440x900.png'));

    // 5. Test Filter / Sort reset to page 1
    console.log('\n--- 5. Testing Filter & Sort Reset to Page 1 ---');
    // Set back to 24 per page and go to page 2
    await selectDropdownOption('[data-testid="products-per-page-select"]', '24');
    await sleep(800);
    await evaluate(`document.querySelector('[data-testid="page-num-2"]').click()`);
    await sleep(800);

    const onPage2 = await evaluate(`document.querySelector('[data-testid="page-num-2"]').classList.contains('bg-[#F15A24]')`);
    assert(onPage2 === true, 'Currently on page 2 before filter action');

    // Change sort order to 'price_asc'
    await selectDropdownOption('[data-testid="catalog-sort-select"]', 'price_asc');
    await sleep(800);

    const rangeAfterSort = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(rangeAfterSort.includes('Showing 1–24'), `Changing sort order resets to page 1 (got: "${rangeAfterSort}")`);

    // 6. Test Product Card Interactions
    console.log('\n--- 6. Testing Product Card Interactions (Buy & Compare) ---');
    
    // Click buy on first card
    await evaluate(`(() => {
      const btn = document.querySelector('[data-testid^="catalog-buy-"]');
      if (btn) btn.click();
    })()`);
    await sleep(800);

    const newCartCount = await evaluate(`document.querySelector('[data-testid="header-cart-count"]')?.innerText || '0'`);
    assert(parseInt(newCartCount) >= 1, `Add to Cart successfully added product (cart count: ${newCartCount})`);

    // Test compare button
    const compareBtn = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid^="catalog-compare-"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    await sleep(800);
    assert(compareBtn === true, 'Compare specs clicked on product card');

    const compareStateText = await evaluate(`document.querySelector('[data-testid^="catalog-compare-"]')?.innerText`);
    assert(compareStateText && compareStateText.includes('Added to Compare'), `Compare button shows updated state (got: "${compareStateText}")`);

    // 7. Mobile Responsiveness Tests (390x844)
    console.log('\n--- 7. Testing Mobile Responsiveness (390x844 iPhone 14) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(800);

    const hasHorizontalScroll = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    assert(hasHorizontalScroll === false, 'Mobile catalog page has no horizontal overflow');

    const mobileRangeText = await evaluate(`document.querySelector('[data-testid="results-count-text"]')?.innerText`);
    assert(mobileRangeText.includes('Showing 1–24'), `Mobile displays result range properly (got: "${mobileRangeText}")`);

    const mobileBtnTouchTarget = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="page-num-1"]');
      if (!btn) return { width: 0, height: 0 };
      return { width: btn.offsetWidth, height: btn.offsetHeight };
    })()`);
    assert(mobileBtnTouchTarget.height >= 34 && mobileBtnTouchTarget.width >= 34, `Mobile page button has touch-friendly dimensions (got ${mobileBtnTouchTarget.width}x${mobileBtnTouchTarget.height}px)`);

    // Test next page on mobile
    await evaluate(`document.querySelector('[data-testid="next-page-btn"]').click()`);
    await sleep(800);

    const mobilePage2Active = await evaluate(`document.querySelector('[data-testid="page-num-2"]').classList.contains('bg-[#F15A24]')`);
    assert(mobilePage2Active === true, 'Next page click works properly on mobile viewport');

    await takeScreenshot(path.join(ARTIFACT_DIR, 'pagination_catalog_mobile_390x844.png'));

    console.log(`\n==================================================`);
    console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
    console.log(`==================================================\n`);

    ws.close();
  } finally {
    edgeProc.kill();
  }
}

runTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
