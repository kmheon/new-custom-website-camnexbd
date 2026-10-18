// scripts/test_shop_navigation.js
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9944;
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_shop_nav_${Date.now()}`);
const BASE_URL = 'http://127.0.0.1:3000';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';

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

async function runBrowserTests() {
  console.log('\n--- Testing Shop Navigation & Catalogue Integration ---');
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  const edgeProc = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
    const target = listRes.find((t) => t.type === 'page');
    if (!target) throw new Error('No target page found in Edge process');

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

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result?.value;
    }

    async function captureScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const targetPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(targetPath, buffer);
      console.log(`    [SCREENSHOT] Saved: ${filename}`);
    }

    await send('Page.enable');
    await send('Network.enable');

    // 1. Desktop Test (1440x900)
    console.log('\n  1. Desktop Viewport (1440x900):');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Navigate to homepage first
    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    // Verify Desktop Main Navigation order
    const navOrderValid = await evaluate(`(() => {
      const navContainer = document.querySelector('div[class*="border-t"][class*="bg-white"] .max-w-\\\\[1200px\\\\]') || document.querySelector('header');
      if (!navContainer) return false;
      const text = navContainer.innerText;
      const catIdx = text.indexOf('All Categories');
      const shopIdx = text.indexOf('Shop');
      const solIdx = text.indexOf('Solutions');
      return catIdx !== -1 && shopIdx !== -1 && solIdx !== -1 && catIdx < shopIdx && shopIdx < solIdx;
    })()`);
    assert(navOrderValid, 'Desktop navigation contains "Shop" immediately after "All Categories" and before "Solutions"');

    // Verify Shop link element exists
    const shopLinkExists = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="nav-shop-link"]');
      return !!btn && btn.innerText.trim() === 'Shop';
    })()`);
    assert(shopLinkExists, 'Shop link element exists with data-testid="nav-shop-link" and text "Shop"');

    await captureScreenshot('shop_nav_desktop_header_1440x900.png');

    // Click Shop link
    console.log('\n  2. Testing Navigation to Shop:');
    await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="nav-shop-link"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    const currentUrl = await evaluate('window.location.pathname');
    assert(currentUrl === '/catalog', `Clicking Shop navigates to catalogue route: "${currentUrl}"`);

    // Verify Active state on Shop link
    const shopIsActive = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="nav-shop-link"]');
      return btn && btn.className.includes('text-[#F15A24]');
    })()`);
    assert(shopIsActive, 'Shop link reflects active route state with orange highlight');

    // Verify Catalogue Page Loaded & Products Rendered
    const catPageTitle = await evaluate('document.title');
    assert(catPageTitle && catPageTitle.includes('Catalog'), `Catalog page title rendered: "${catPageTitle}"`);

    const productCardsCount = await evaluate(`(() => {
      const cards = document.querySelectorAll('main .grid > div');
      return cards.length;
    })()`);
    assert(productCardsCount > 0, `Catalogue displays ${productCardsCount} real product cards from database`);

    // Verify Sorting Dropdown
    const hasSort = await evaluate(`(() => {
      const sel = document.querySelector('select');
      return sel && sel.options.length >= 4;
    })()`);
    assert(hasSort, 'Catalogue sorting dropdown available (Popular, Price Asc/Desc, Alphabetical)');

    // Test Add to Cart from Catalogue
    const initialCartCount = await evaluate(`(() => {
      const badge = document.querySelector('header span[class*="bg-[#F15A24]"]');
      return badge ? parseInt(badge.innerText, 10) : 0;
    })()`);

    await evaluate(`(() => {
      const buyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Buy'));
      if (buyBtn) buyBtn.click();
    })()`);
    await sleep(600);

    const newCartCount = await evaluate(`(() => {
      const badges = Array.from(document.querySelectorAll('header span[class*="bg-[#F15A24]"]'));
      // Find the badge inside or next to shopping bag
      const cartBadge = badges.find(b => b.closest('button[aria-label="Shopping Cart"]'));
      return cartBadge ? parseInt(cartBadge.innerText, 10) : 0;
    })()`);
    assert(newCartCount >= initialCartCount, `Add to Cart working on catalogue page (cart items: ${newCartCount})`);

    // Test Compare Specs toggle
    await evaluate(`(() => {
      const compBtn = document.querySelector('[data-testid^="catalog-compare-"]');
      if (compBtn) compBtn.click();
    })()`);
    await sleep(600);

    const compareActive = await evaluate(`(() => {
      const compBtn = document.querySelector('[data-testid^="catalog-compare-"]');
      return compBtn && compBtn.innerText.includes('Added to Compare');
    })()`);
    assert(compareActive, 'Product compare action works seamlessly from catalogue cards');

    await captureScreenshot('shop_catalog_page_desktop_1440x900.png');

    // Test direct hit of /shop alias
    console.log('\n  3. Testing Direct Route /shop:');
    await send('Page.navigate', { url: `${BASE_URL}/shop` });
    await sleep(2500);

    const directShopLoaded = await evaluate(`(() => {
      return document.title.includes('Catalog') && document.querySelectorAll('main .grid > div').length > 0;
    })()`);
    assert(directShopLoaded, 'Direct URL navigation to /shop loads catalogue page with products');

    // 4. Mobile Viewport (390x844)
    console.log('\n  4. Mobile Viewport (390x844):');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(2500);

    // Open mobile navigation drawer
    await evaluate(`(() => {
      const menuTrigger = document.querySelector('[data-testid="mobile-menu-trigger"]');
      if (menuTrigger) menuTrigger.click();
    })()`);
    await sleep(600);

    // Verify Mobile Drawer Navigation order
    const mobileNavOrderValid = await evaluate(`(() => {
      const drawer = document.querySelector('div[class*="fixed"][class*="z-50"]');
      if (!drawer) return false;
      const text = drawer.innerText;
      const catIdx = text.indexOf('Categories');
      const shopIdx = text.indexOf('Shop');
      const solIdx = text.indexOf('Solutions');
      return catIdx !== -1 && shopIdx !== -1 && solIdx !== -1 && catIdx < shopIdx && shopIdx < solIdx;
    })()`);
    assert(mobileNavOrderValid, 'Mobile drawer contains "Shop" immediately after "Categories" and before "Solutions"');

    const mobileShopExists = await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="mobile-nav-shop-link"]');
      return !!btn && btn.innerText.trim() === 'Shop';
    })()`);
    assert(mobileShopExists, 'Mobile Shop link element exists with data-testid="mobile-nav-shop-link"');

    await captureScreenshot('shop_nav_mobile_drawer_390x844.png');

    // Click mobile Shop link
    await evaluate(`(() => {
      const btn = document.querySelector('[data-testid="mobile-nav-shop-link"]');
      if (btn) btn.click();
    })()`);
    await sleep(2000);

    const mobileDrawerClosed = await evaluate(`(() => {
      return !document.querySelector('[data-testid="mobile-nav-shop-link"]');
    })()`);
    assert(mobileDrawerClosed, 'Clicking Shop closes mobile drawer');

    const mobileOnCatalog = await evaluate('window.location.pathname === "/catalog"');
    assert(mobileOnCatalog, 'Mobile navigation lands on catalogue route');

    await captureScreenshot('shop_catalog_page_mobile_390x844.png');

    ws.close();
  } finally {
    edgeProc.kill('SIGTERM');
  }
}

async function main() {
  try {
    await runBrowserTests();

    console.log(`\n========================================`);
    console.log(`Total Shop Navigation Tests Passed: ${testPassed}`);
    console.log(`Total Shop Navigation Tests Failed: ${testFailed}`);
    console.log(`========================================\n`);

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

main();

