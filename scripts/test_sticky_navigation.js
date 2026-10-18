const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';

async function run() {
  console.log('--- Starting Sticky Main Navigation Test Suite ---');
  const edge = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9999',
    'http://127.0.0.1:3000/'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2500));

  let exitCode = 0;
  try {
    const list = await fetch('http://127.0.0.1:9999/json').then(r => r.json());
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

    // Helper to evaluate script
    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return res.result.value;
    };

    // Helper to take screenshot
    const screenshot = async (filename) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${imgPath}`);
    };

    // 1. DESKTOP TESTS (1440x900)
    console.log('\n=== 1. Desktop Sticky Navigation & Dropdowns (1440x900) ===');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await new Promise(r => setTimeout(r, 2000));

    // Initial state at scrollY = 0
    const initialDesktop = await evaluate(`(() => {
      const header = document.querySelector('#main-navigation-header, header');
      const topBar = document.querySelector('#top-utility-bar');
      const hRect = header.getBoundingClientRect();
      const tRect = topBar.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        topBarVisible: tRect.top >= 0 && tRect.bottom > 0,
        topBarHeight: Math.round(tRect.height),
        headerTop: Math.round(hRect.top),
        headerHeight: Math.round(hRect.height),
        hasShadowMd: header.classList.contains('shadow-md'),
        overflowX: document.documentElement.scrollWidth > window.innerWidth
      };
    })()`);
    console.log('Desktop Initial (scrollY = 0):', initialDesktop);

    if (initialDesktop.headerTop < 30) {
      console.error(`FAIL: Header should be below topBar initially (expected ~36px, got ${initialDesktop.headerTop}px)`);
      exitCode = 1;
    }

    // Scroll to 500px
    await evaluate(`window.scrollTo(0, 500);`);
    await new Promise(r => setTimeout(r, 600));

    const scrolledDesktop = await evaluate(`(() => {
      const header = document.querySelector('#main-navigation-header, header');
      const topBar = document.querySelector('#top-utility-bar');
      const hRect = header.getBoundingClientRect();
      const tRect = topBar.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        topBarScrolledAway: tRect.bottom <= 0,
        headerTop: Math.round(hRect.top),
        headerHeight: Math.round(hRect.height),
        hasShadowMd: header.classList.contains('shadow-md'),
        isSticky: window.getComputedStyle(header).position === 'sticky',
        zIndex: window.getComputedStyle(header).zIndex
      };
    })()`);
    console.log('Desktop Scrolled (scrollY = 500):', scrolledDesktop);

    if (scrolledDesktop.headerTop !== 0) {
      console.error(`FAIL: Header should be pinned at top: 0 when scrolled (got ${scrolledDesktop.headerTop}px)`);
      exitCode = 1;
    }
    if (!scrolledDesktop.isSticky) {
      console.error('FAIL: Header position should be sticky');
      exitCode = 1;
    }
    if (!scrolledDesktop.topBarScrolledAway) {
      console.error('FAIL: Top utility bar should scroll away');
      exitCode = 1;
    }

    await screenshot('desktop_sticky_header_scrolled_1440x900.png');

    // Test dropdown opening while sticky
    console.log('\n--- Testing Desktop All Categories Dropdown while Sticky ---');
    await evaluate(`(() => {
      const catBtn = document.querySelector('header button:has(svg)');
      const allBtns = Array.from(document.querySelectorAll('header button'));
      const btn = allBtns.find(b => b.innerText.includes('All Categories'));
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    const catDropdown = await evaluate(`(() => {
      const dropdown = document.querySelector('header div[class*="w-80"]');
      const header = document.querySelector('#main-navigation-header, header');
      if (!dropdown) return { error: 'Categories dropdown not found' };
      const dRect = dropdown.getBoundingClientRect();
      const hRect = header.getBoundingClientRect();
      return {
        dropdownTop: Math.round(dRect.top),
        headerBottom: Math.round(hRect.bottom),
        visible: dRect.height > 0 && dRect.width > 0,
        opensBelowHeader: dRect.top >= hRect.top
      };
    })()`);
    console.log('Categories Dropdown while Sticky:', catDropdown);
    if (!catDropdown.visible || !catDropdown.opensBelowHeader) {
      console.error('FAIL: Categories dropdown not properly positioned while sticky');
      exitCode = 1;
    }

    await screenshot('desktop_sticky_categories_dropdown_1440x900.png');

    // Close dropdown by clicking header body
    await evaluate(`document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }));`);
    await new Promise(r => setTimeout(r, 300));

    // Test scrolling back to top (scrollY = 0)
    console.log('\n--- Testing Desktop Scroll Back to Top ---');
    await evaluate(`window.scrollTo(0, 0);`);
    await new Promise(r => setTimeout(r, 600));

    const backToTopDesktop = await evaluate(`(() => {
      const header = document.querySelector('#main-navigation-header, header');
      const topBar = document.querySelector('#top-utility-bar');
      const hRect = header.getBoundingClientRect();
      const tRect = topBar.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        topBarVisible: tRect.top >= 0,
        headerTop: Math.round(hRect.top),
        headerHeight: Math.round(hRect.height)
      };
    })()`);
    console.log('Desktop Back to Top (scrollY = 0):', backToTopDesktop);
    if (backToTopDesktop.headerTop < 30) {
      console.error(`FAIL: Header did not smoothly rejoin position below top bar (got ${backToTopDesktop.headerTop}px)`);
      exitCode = 1;
    }

    // 2. MOBILE VIEWPORT TESTS across required widths: 320, 360, 375, 390, 430
    const mobileViewports = [
      { name: '320x640', width: 320, height: 640 },
      { name: '360x780', width: 360, height: 780 },
      { name: '375x667', width: 375, height: 667 },
      { name: '390x844', width: 390, height: 844 },
      { name: '430x932', width: 430, height: 932 }
    ];

    for (const vp of mobileViewports) {
      console.log(`\n=== 2. Mobile Sticky Navigation on ${vp.name} ===`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true
      });
      await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
      await new Promise(r => setTimeout(r, 1500));

      // Scroll to 0 initially
      await evaluate(`window.scrollTo(0, 0);`);
      await new Promise(r => setTimeout(r, 400));

      const mobInitial = await evaluate(`(() => {
        const header = document.querySelector('#main-navigation-header, header');
        const topBar = document.querySelector('#top-utility-bar');
        const hRect = header.getBoundingClientRect();
        return {
          headerTop: Math.round(hRect.top),
          headerHeight: Math.round(hRect.height),
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`);
      console.log(`Mobile ${vp.name} Initial:`, mobInitial);

      // Scroll to 600px
      await evaluate(`window.scrollTo(0, 600);`);
      await new Promise(r => setTimeout(r, 600));

      const mobScrolled = await evaluate(`(() => {
        const header = document.querySelector('#main-navigation-header, header');
        const topBar = document.querySelector('#top-utility-bar');
        const hRect = header.getBoundingClientRect();
        const tRect = topBar.getBoundingClientRect();
        return {
          scrollY: window.scrollY,
          headerTop: Math.round(hRect.top),
          headerHeight: Math.round(hRect.height),
          topBarScrolledAway: tRect.bottom <= 0,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
          hasCompactHeight: hRect.height < 75
        };
      })()`);
      console.log(`Mobile ${vp.name} Scrolled:`, mobScrolled);

      if (mobScrolled.headerTop !== 0) {
        console.error(`FAIL [${vp.name}]: Mobile header is not pinned at top: 0 (got ${mobScrolled.headerTop}px)`);
        exitCode = 1;
      }
      if (!mobScrolled.hasCompactHeight) {
        console.error(`FAIL [${vp.name}]: Mobile header height excessive (${mobScrolled.headerHeight}px >= 75px)`);
        exitCode = 1;
      }
      if (mobScrolled.horizontalOverflow) {
        console.error(`FAIL [${vp.name}]: Horizontal overflow detected when scrolling`);
        exitCode = 1;
      }

      await screenshot(`mobile_sticky_header_${vp.name}.png`);
    }

    // 3. MOBILE INTERACTIONS WHILE STICKY (390x844)
    console.log('\n=== 3. Mobile Interactions while Sticky (390x844) ===');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await evaluate(`window.scrollTo(0, 500);`);
    await new Promise(r => setTimeout(r, 500));

    // Test Search trigger toggle
    console.log('Testing mobile search trigger while sticky...');
    await evaluate(`(() => {
      const searchBtn = document.querySelector('button[data-testid="mobile-search-toggle"]');
      if (searchBtn) searchBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));

    const searchInputCheck = await evaluate(`(() => {
      const input = document.querySelector('input[data-testid="mobile-search-input"]');
      const header = document.querySelector('#main-navigation-header, header');
      const hRect = header.getBoundingClientRect();
      return {
        inputVisible: !!input && input.getBoundingClientRect().height > 0,
        headerTop: Math.round(hRect.top)
      };
    })()`);
    console.log('Mobile Search Input expanded:', searchInputCheck);
    if (!searchInputCheck.inputVisible || searchInputCheck.headerTop !== 0) {
      console.error('FAIL: Mobile search expansion failed or header displaced');
      exitCode = 1;
    }

    await screenshot('mobile_sticky_search_expanded_390x844.png');

    // Close search trigger
    await evaluate(`(() => {
      const searchBtn = document.querySelector('button[data-testid="mobile-search-toggle"]');
      if (searchBtn) searchBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 300));

    // Test Mobile Menu Drawer while sticky
    console.log('Testing mobile menu drawer while sticky...');
    await evaluate(`(() => {
      const menuBtn = document.querySelector('button[data-testid="mobile-menu-trigger"]');
      if (menuBtn) menuBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    const drawerCheck = await evaluate(`(() => {
      const drawer = document.querySelector('div[class*="z-50"][class*="fixed inset-0"]');
      const shopLink = document.querySelector('button[data-testid="mobile-nav-shop-link"]');
      return {
        drawerVisible: !!drawer,
        shopLinkVisible: !!shopLink
      };
    })()`);
    console.log('Mobile Menu Drawer opened:', drawerCheck);
    if (!drawerCheck.drawerVisible || !drawerCheck.shopLinkVisible) {
      console.error('FAIL: Mobile drawer did not open while sticky');
      exitCode = 1;
    }

    await screenshot('mobile_sticky_drawer_open_390x844.png');

    // Close mobile drawer by clicking close button
    await evaluate(`(() => {
      const closeBtn = document.querySelector('div[class*="z-50"] button:has(svg)');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));

    // 4. TEST MULTIPLE PAGES (Catalogue, Category, Product Detail)
    console.log('\n=== 4. Testing Multi-Page Sticky Navigation ===');

    const pages = [
      { name: 'Catalogue', url: 'http://127.0.0.1:3000/catalog' },
      { name: 'Category CCTV', url: 'http://127.0.0.1:3000/category/cctv-cameras' },
      { name: 'Product Detail', url: 'http://127.0.0.1:3000/product/prod-hik-irpf-2mp' }
    ];

    for (const p of pages) {
      console.log(`\nTesting page: ${p.name} (${p.url})`);
      await send('Page.navigate', { url: p.url });
      await new Promise(r => setTimeout(r, 1800));

      await evaluate(`window.scrollTo(0, 600);`);
      await new Promise(r => setTimeout(r, 600));

      const pageCheck = await evaluate(`(() => {
        const header = document.querySelector('#main-navigation-header, header');
        const hRect = header.getBoundingClientRect();
        const stickyBar = document.querySelector('#product-sticky-bar');
        const wa = document.querySelector('#floating-whatsapp');
        const sRect = stickyBar ? stickyBar.getBoundingClientRect() : null;
        const wRect = wa ? wa.getBoundingClientRect() : null;

        // Check for collision between sticky header and bottom bar
        const headerCollidesStickyBar = sRect ? (hRect.bottom > sRect.top) : false;

        return {
          scrollY: window.scrollY,
          headerTop: Math.round(hRect.top),
          headerHeight: Math.round(hRect.height),
          isSticky: window.getComputedStyle(header).position === 'sticky',
          headerCollidesStickyBar
        };
      })()`);
      console.log(`${p.name} check:`, pageCheck);

      if (pageCheck.headerTop !== 0 || !pageCheck.isSticky) {
        console.error(`FAIL [${p.name}]: Header not sticky at top: 0`);
        exitCode = 1;
      }
      if (pageCheck.headerCollidesStickyBar) {
        console.error(`FAIL [${p.name}]: Header collides with bottom sticky bar!`);
        exitCode = 1;
      }
    }

    await screenshot('product_page_sticky_header_and_purchase_bar_390x844.png');

    ws.close();
  } catch (err) {
    console.error('Test Suite Error:', err);
    exitCode = 1;
  } finally {
    edge.kill();
  }

  if (exitCode === 0) {
    console.log('\n>>> ALL STICKY MAIN NAVIGATION TESTS PASSED! <<<');
  } else {
    console.error('\n>>> SOME STICKY NAVIGATION TESTS FAILED! <<<');
  }
  process.exit(exitCode);
}

run();

