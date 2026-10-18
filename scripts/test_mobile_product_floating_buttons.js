const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';

async function run() {
  console.log('--- Starting Mobile Product Floating Buttons Test Suite ---');
  const edge = cp.spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9977',
    'http://127.0.0.1:3000/product/prod-hik-irpf-2mp'
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2500));

  let exitCode = 0;
  try {
    const list = await fetch('http://127.0.0.1:9977/json').then(r => r.json());
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

    const viewports = [
      { name: '320x640', width: 320, height: 640, mobile: true },
      { name: '360x780', width: 360, height: 780, mobile: true },
      { name: '375x667', width: 375, height: 667, mobile: true },
      { name: '390x844', width: 390, height: 844, mobile: true },
      { name: '430x932', width: 430, height: 932, mobile: true },
    ];

    for (const vp of viewports) {
      console.log(`\n=== Testing Viewport ${vp.name} on /product/prod-hik-irpf-2mp ===`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.mobile
      });
      await new Promise(r => setTimeout(r, 1200));

      // Scroll down past 400px to activate Back to Top button
      await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, 800);`,
        returnByValue: true
      });
      await new Promise(r => setTimeout(r, 800));

      const geom = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const wa = document.querySelector('#floating-whatsapp');
            const topBtn = document.querySelector('#floating-back-to-top');
            const stickyBuyBar = document.querySelector('#product-sticky-bar, [data-testid="product-sticky-bar"]');
            const headerBottomBar = document.querySelector('header div[class*="bottom-0"]');

            const getRect = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && r.width > 0 && r.height > 0;
              return {
                x: Math.round(r.x),
                y: Math.round(r.y),
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                left: Math.round(r.left),
                right: Math.round(r.right),
                width: Math.round(r.width),
                height: Math.round(r.height),
                visible: isVisible
              };
            };

            const overlaps = (r1, r2) => {
              if (!r1 || !r2 || !r1.visible || !r2.visible) return false;
              return !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
            };

            const waRect = getRect(wa);
            const topBtnRect = getRect(topBtn);
            const stickyRect = getRect(stickyBuyBar);
            const headerBarRect = getRect(headerBottomBar);

            const buttons = stickyBuyBar ? Array.from(stickyBuyBar.querySelectorAll('button')).map(b => ({
              text: b.innerText.trim(),
              rect: getRect(b)
            })) : [];

            return {
              window: { width: window.innerWidth, height: window.innerHeight },
              waRect,
              topBtnRect,
              stickyRect,
              headerBarRect,
              buttons,
              waOverlapsSticky: overlaps(waRect, stickyRect),
              topBtnOverlapsSticky: overlaps(topBtnRect, stickyRect),
              waOverlapsTopBtn: overlaps(waRect, topBtnRect),
              waAboveStickyMargin: stickyRect && waRect ? (stickyRect.top - waRect.bottom) : null,
              topBtnAboveStickyMargin: stickyRect && topBtnRect ? (stickyRect.top - topBtnRect.bottom) : null,
              horizontalSeparation: waRect && topBtnRect ? (waRect.left - topBtnRect.right) : null
            };
          })()
        `,
        returnByValue: true
      });

      const res = geom.result.value;
      console.log(`Sticky bar height: ${res.stickyRect ? res.stickyRect.height + 'px' : 'none'} (top: ${res.stickyRect?.top}, bottom: ${res.stickyRect?.bottom})`);
      console.log(`WhatsApp: visible=${res.waRect?.visible}, x=${res.waRect?.x}, y=${res.waRect?.y}, bottom=${res.waRect?.bottom}`);
      console.log(`Back to top: visible=${res.topBtnRect?.visible}, x=${res.topBtnRect?.x}, y=${res.topBtnRect?.y}, bottom=${res.topBtnRect?.bottom}`);
      console.log(`Vertical margin (Sticky Top - WA Bottom): ${res.waAboveStickyMargin}px (must be >= 0)`);
      console.log(`Vertical margin (Sticky Top - TopBtn Bottom): ${res.topBtnAboveStickyMargin}px (must be >= 0)`);
      console.log(`Horizontal gap between TopBtn and WA: ${res.horizontalSeparation}px`);
      console.log(`Header bottom bar present: ${res.headerBarRect?.visible ? 'YES (unexpected)' : 'NO (clean)'}`);

      // Assertions
      if (!res.stickyRect || !res.stickyRect.visible) {
        console.error(`FAIL [${vp.name}]: Sticky buy bar is not visible!`);
        exitCode = 1;
      }
      if (res.waOverlapsSticky) {
        console.error(`FAIL [${vp.name}]: WhatsApp button overlaps sticky bar!`);
        exitCode = 1;
      }
      if (res.topBtnOverlapsSticky) {
        console.error(`FAIL [${vp.name}]: Back to top button overlaps sticky bar!`);
        exitCode = 1;
      }
      if (res.waOverlapsTopBtn) {
        console.error(`FAIL [${vp.name}]: WhatsApp button overlaps Back to Top button!`);
        exitCode = 1;
      }
      if (res.waAboveStickyMargin < 8) {
        console.error(`FAIL [${vp.name}]: Insufficient vertical margin between WhatsApp and sticky bar (${res.waAboveStickyMargin}px < 8px)`);
        exitCode = 1;
      }
      if (res.topBtnAboveStickyMargin < 8) {
        console.error(`FAIL [${vp.name}]: Insufficient vertical margin between TopBtn and sticky bar (${res.topBtnAboveStickyMargin}px < 8px)`);
        exitCode = 1;
      }
      if (res.headerBarRect?.visible) {
        console.error(`FAIL [${vp.name}]: Generic header bar should be hidden on product page!`);
        exitCode = 1;
      }

      // Check buy buttons clickable and within bounds
      if (res.buttons.length < 2) {
        console.error(`FAIL [${vp.name}]: Expected Cart and Buy buttons in sticky bar, found ${res.buttons.length}`);
        exitCode = 1;
      }

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgPath = path.join(ARTIFACT_DIR, `mobile_product_${vp.name}.png`);
      fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${imgPath}`);
    }

    // Interactive WhatsApp Popover Test (on 390x844)
    console.log('\n=== Testing Interactive WhatsApp Popover Expansion (390x844) ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    // Click WhatsApp button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('#floating-whatsapp');
          if (btn) btn.click();
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const popoverCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const popover = document.querySelector('#wa-expanded-popover, [data-testid="wa-expanded-popover"]');
          const stickyBuyBar = document.querySelector('#product-sticky-bar');
          if (!popover) return { error: 'Popover not found' };
          const pRect = popover.getBoundingClientRect();
          const sRect = stickyBuyBar.getBoundingClientRect();
          const overlaps = !(pRect.right <= sRect.left || pRect.left >= sRect.right || pRect.bottom <= sRect.top || pRect.top >= sRect.bottom);
          return {
            popover: { top: Math.round(pRect.top), bottom: Math.round(pRect.bottom), height: Math.round(pRect.height) },
            sticky: { top: Math.round(sRect.top), bottom: Math.round(sRect.bottom) },
            overlapsSticky: overlaps,
            margin: Math.round(sRect.top - pRect.bottom),
            chatLinkPresent: !!popover.querySelector('a[href*="wa.me"], a[href*="whatsapp"]')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Popover check:', popoverCheck.result.value);
    if (popoverCheck.result.value.overlapsSticky) {
      console.error('FAIL: Popover overlaps sticky purchase bar!');
      exitCode = 1;
    }
    if (!popoverCheck.result.value.chatLinkPresent) {
      console.error('FAIL: Popover missing direct WhatsApp chat link!');
      exitCode = 1;
    }

    // Capture expanded popover screenshot
    const shotWa = await send('Page.captureScreenshot', { format: 'png' });
    const imgPathWa = path.join(ARTIFACT_DIR, 'mobile_product_wa_expanded_390x844.png');
    fs.writeFileSync(imgPathWa, Buffer.from(shotWa.data, 'base64'));
    console.log(`Saved screenshot: ${imgPathWa}`);

    // Click outside to close popover
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 50, clientY: 50 }));
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 500));

    const closedCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const popover = document.querySelector('#wa-expanded-popover, [data-testid="wa-expanded-popover"]');
          return { closed: !popover };
        })()
      `,
      returnByValue: true
    });
    console.log('Popover closed after outside click:', closedCheck.result.value.closed);
    if (!closedCheck.result.value.closed) {
      console.error('FAIL: Popover did not close on outside click!');
      exitCode = 1;
    }

    // Test Desktop (1440x900)
    console.log('\n=== Testing Desktop Viewport (1440x900) ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll down to check desktop back to top
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, 800);`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const desktopGeom = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const wa = document.querySelector('#floating-whatsapp');
          const topBtn = document.querySelector('#floating-back-to-top');
          const stickyBuyBar = document.querySelector('#product-sticky-bar, [data-testid="product-sticky-bar"]');

          const getRect = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && r.width > 0 && r.height > 0;
            return {
              x: Math.round(r.x),
              y: Math.round(r.y),
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
              height: Math.round(r.height),
              visible: isVisible
            };
          };

          const waRect = getRect(wa);
          const topBtnRect = getRect(topBtn);
          const stickyRect = getRect(stickyBuyBar);

          return {
            window: { width: window.innerWidth, height: window.innerHeight },
            clientWidth: document.documentElement.clientWidth,
            stickyVisible: stickyRect?.visible || false,
            waRect,
            topBtnRect,
            waIsDirectLink: !!(wa?.getAttribute('href')?.includes('wa.me') || wa?.getAttribute('href')?.includes('whatsapp')),
            waDesktopSize: waRect ? waRect.width + 'x' + waRect.height : null,
            waDistanceToBottom: waRect ? (window.innerHeight - waRect.bottom) : null,
            waDistanceToRight: waRect ? (document.documentElement.clientWidth - waRect.right) : null,
            topBtnDistanceToRight: topBtnRect ? (document.documentElement.clientWidth - topBtnRect.right) : null,
            topBtnDistanceToBottom: topBtnRect ? (window.innerHeight - topBtnRect.bottom) : null
          };
        })()
      `,
      returnByValue: true
    });

    const dRes = desktopGeom.result.value;
    console.log('Desktop Sticky Bar Visible:', dRes.stickyVisible, '(expected false)');
    console.log('Desktop WA Size:', dRes.waDesktopSize, '(expected 56x56)');
    console.log('Desktop WA Distance To Bottom:', dRes.waDistanceToBottom, 'px, Distance To Right:', dRes.waDistanceToRight, 'px');
    console.log('Desktop TopBtn Distance To Bottom:', dRes.topBtnDistanceToBottom, 'px, Distance To Right:', dRes.topBtnDistanceToRight, 'px');
    console.log('Desktop WA is direct link:', dRes.waIsDirectLink);

    if (dRes.stickyVisible) {
      console.error('FAIL: Sticky buy bar should be hidden on desktop!');
      exitCode = 1;
    }
    if (dRes.waDesktopSize !== '56x56') {
      console.error(`FAIL: Desktop WA size should be 56x56, got ${dRes.waDesktopSize}`);
      exitCode = 1;
    }
    if (!dRes.waIsDirectLink) {
      console.error('FAIL: Desktop WA should be direct link to whatsapp');
      exitCode = 1;
    }

    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const imgPathDesktop = path.join(ARTIFACT_DIR, 'desktop_product_1440x900.png');
    fs.writeFileSync(imgPathDesktop, Buffer.from(shotDesktop.data, 'base64'));
    console.log(`Saved screenshot: ${imgPathDesktop}`);

    // Regression test homepage on mobile (390x844)
    console.log('\n=== Testing Regression on Homepage (390x844) ===');
    await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 1000);` });
    await new Promise(r => setTimeout(r, 800));

    const homeCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const wa = document.querySelector('#floating-whatsapp');
          const topBtn = document.querySelector('#floating-back-to-top');
          const headerBottomBar = document.querySelector('header div[class*="bottom-0"]');
          
          const getRect = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return {
              visible: s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0,
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              left: Math.round(r.left),
              right: Math.round(r.right),
              height: Math.round(r.height)
            };
          };

          const waR = getRect(wa);
          const topR = getRect(topBtn);
          const barR = getRect(headerBottomBar);

          const overlaps = (r1, r2) => {
            if (!r1 || !r2 || !r1.visible || !r2.visible) return false;
            return !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
          };

          return {
            headerBarVisible: barR?.visible || false,
            headerBarHeight: barR?.height,
            waVisible: waR?.visible || false,
            topBtnVisible: topR?.visible || false,
            waOverlapsBar: overlaps(waR, barR),
            topOverlapsBar: overlaps(topR, barR),
            waOverlapsTop: overlaps(waR, topR),
            marginWaBar: barR && waR ? barR.top - waR.bottom : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Homepage check:', homeCheck.result.value);
    const hRes = homeCheck.result.value;
    if (hRes.waOverlapsBar || hRes.topOverlapsBar) {
      console.error('FAIL: Floating buttons overlap header bottom bar on homepage!');
      exitCode = 1;
    }
    if (hRes.waOverlapsTop) {
      console.error('FAIL: WhatsApp overlaps Back to Top on homepage!');
      exitCode = 1;
    }

    const shotHome = await send('Page.captureScreenshot', { format: 'png' });
    const imgPathHome = path.join(ARTIFACT_DIR, 'mobile_homepage_390x844.png');
    fs.writeFileSync(imgPathHome, Buffer.from(shotHome.data, 'base64'));
    console.log(`Saved screenshot: ${imgPathHome}`);

    ws.close();
  } catch (err) {
    console.error('Test Suite Error:', err);
    exitCode = 1;
  } finally {
    edge.kill();
  }

  if (exitCode === 0) {
    console.log('\n>>> ALL FLOATING BUTTON POSITIONING & INTERACTION TESTS PASSED! <<<');
  } else {
    console.error('\n>>> SOME TESTS FAILED! <<<');
  }
  process.exit(exitCode);
}

run();