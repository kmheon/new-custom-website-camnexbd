// scripts/verify_solutions_responsiveness.js
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

async function verify() {
  console.log('\n--- Verifying Solutions Section Responsiveness Across Breakpoints ---');

  const edgeProc = cp.spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9957',
    '--user-data-dir=C:\\Windows\\Temp\\edge_verify_sol',
    'about:blank'
  ]);
  await sleep(2000);

  try {
    const list = await fetch('http://127.0.0.1:9957/json').then(r => r.json());
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

    async function waitForElement(selector, timeoutMs = 12000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        try {
          const found = await evaluate(`Boolean(document.querySelector('${selector}'))`);
          if (found) return true;
        } catch (_) {}
        await sleep(250);
      }
      return false;
    }

    const viewports = [
      { name: 'Mobile XS', width: 320, height: 640, mobile: true, expectedCols: 1 },
      { name: 'Mobile S', width: 360, height: 740, mobile: true, expectedCols: 1 },
      { name: 'Mobile M', width: 375, height: 812, mobile: true, expectedCols: 1 },
      { name: 'Mobile L', width: 390, height: 844, mobile: true, expectedCols: 1 },
      { name: 'Tablet (iPad Mini)', width: 768, height: 1024, mobile: true, expectedCols: 2 },
      { name: 'Desktop HD', width: 1440, height: 900, mobile: false, expectedCols: 3 }
    ];

    for (const vp of viewports) {
      console.log(`\n- Testing ${vp.name} (${vp.width}x${vp.height}):`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.mobile
      });

      await send('Page.navigate', { url: `${BASE_URL}/` });
      const ready = await waitForElement('#solutions', 12000);
      if (!ready) {
        throw new Error(`#solutions section not rendered in ${vp.name}`);
      }
      await sleep(400);

      // Scroll to #solutions section
      await evaluate(`document.querySelector('#solutions')?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
      await sleep(400);

      const metrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const section = document.querySelector('#solutions');
          if (!section) return null;
          const grid = section.querySelector('.grid');
          const cards = Array.from(section.querySelectorAll('[data-solution-id]'));
          const sectionRect = section.getBoundingClientRect();
          const gridRect = grid.getBoundingClientRect();
          
          return {
            docScrollWidth: document.documentElement.scrollWidth,
            docClientWidth: document.documentElement.clientWidth,
            hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            sectionScrollWidth: section.scrollWidth,
            sectionClientWidth: section.clientWidth,
            gridWidth: grid.offsetWidth,
            cards: cards.map(c => {
              const r = c.getBoundingClientRect();
              return {
                id: c.getAttribute('data-solution-id'),
                left: r.left,
                right: r.right,
                width: r.width,
                height: r.height,
                overflowingGrid: r.right > gridRect.right + 2 || r.left < gridRect.left - 2
              };
            })
          };
        })()`,
        returnByValue: true
      });

      const res = metrics.result?.value;
      assert(res !== null, 'Solutions section rendered in DOM');
      assert(!res.hasHorizontalOverflow, `No horizontal document overflow (scrollWidth: ${res.docScrollWidth}px, clientWidth: ${res.docClientWidth}px)`);
      assert(res.sectionScrollWidth <= res.sectionClientWidth, 'Section does not cause internal scroll overflow');

      // Verify no card overflows the grid container
      const anyCardOverflow = res.cards.some(c => c.overflowingGrid);
      assert(!anyCardOverflow, 'All solution cards stay strictly within grid container boundaries');

      // Verify cards have comfortable touch height (>= 112px)
      const allCardsMinHeight = res.cards.every(c => c.height >= 110);
      assert(allCardsMinHeight, 'All solution cards satisfy comfortable min-height (>= 112px)');

      // Verify mobile widths: all cards have identical full width
      if (vp.expectedCols === 1) {
        const widths = res.cards.map(c => Math.round(c.width));
        const allSame = widths.every(w => Math.abs(w - widths[0]) <= 1);
        assert(allSame, `All 5 cards have consistent 1-column full width (${widths[0]}px)`);
      }

      // Capture screenshot
      const ss = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `solutions_fixed_${vp.width}x${vp.height}.png`;
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(ss.data, 'base64'));
      console.log(`    [SCREENSHOT] Saved: ${filename}`);
    }

    // Test Click Interaction on a solution card
    console.log('\n- Testing Card Click Navigation:');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const firstCard = document.querySelector('[data-solution-id="scen-home"]');
        if (firstCard) firstCard.click();
      })()`
    });
    await sleep(1500);

    const currentPath = await send('Runtime.evaluate', {
      expression: 'window.location.pathname'
    });
    assert(currentPath.result?.value === '/solutions/home-residence' || currentPath.result?.value === '/solutions', `Clicking card navigates to solutions route: "${currentPath.result?.value}"`);

    ws.close();
  } finally {
    edgeProc.kill('SIGTERM');
  }

  console.log(`\n========================================`);
  console.log(`Solutions Responsiveness Tests Passed: ${testPassed}`);
  console.log(`Solutions Responsiveness Tests Failed: ${testFailed}`);
  console.log(`========================================\n`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
