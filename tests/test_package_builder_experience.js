// tests/test_package_builder_experience.js
// Automated Verification Suite for CamneX Complete Packages Experience:
// Ready-Made Storefront, Advanced Filtering, and 6-Step Intelligent Package Builder

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const cp = require('child_process');
const http = require('http');
const os = require('os');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${PORT}`;
const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = parseInt(process.env.BUILDER_CDP_PORT || '9825', 10);
const USER_DATA_DIR = path.join(os.tmpdir(), `builder_spec_${Date.now()}`);

const ARTIFACT_DIR = path.join(__dirname, '../../Users/kmheo/.gemini/antigravity/brain/36271926-f329-4e6a-b73d-dc302fd8fe3b');
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function run() {
  console.log('================================================================');
  console.log('CAMNEX COMPLETE PACKAGES & 6-STEP BUILDER TEST SUITE');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // PART 1: Architectural Audit of Packages Experience
  // --------------------------------------------------------------------------
  console.log('--- 1. Architecture Audit & Component Implementation ---');

  const builderPagePath = path.join(__dirname, '../src/pages/PackageBuilderPage.tsx');
  const packagesPagePath = path.join(__dirname, '../src/pages/PackagesPage.tsx');
  const appPath = path.join(__dirname, '../src/App.tsx');
  const quotePath = path.join(__dirname, '../src/pages/QuoteAndServicesPage.tsx');

  test('PackageBuilderPage.tsx exists in src/pages', () => {
    assert.ok(fs.existsSync(builderPagePath), 'PackageBuilderPage.tsx must exist');
  });

  const builderContent = fs.readFileSync(builderPagePath, 'utf8');

  test('PackageBuilderPage implements the 6 guided steps', () => {
    assert.ok(builderContent.includes('Step 1 of 6') && builderContent.includes('Choose System Architecture'), 'Step 1: System Architecture');
    assert.ok(builderContent.includes('Step 2 of 6') && builderContent.includes('Camera Count, Form Factor & Night Vision'), 'Step 2: Cameras & Coverage');
    assert.ok(builderContent.includes('Step 3 of 6') && builderContent.includes('Recorder Sizing & Surveillance Hard Drive'), 'Step 3: Recorder & Storage');
    assert.ok(builderContent.includes('Step 4 of 6') && builderContent.includes('Cabling, Power Supplies & Display Monitor'), 'Step 4: Accessories & Monitor');
    assert.ok(builderContent.includes('Step 5 of 6') && builderContent.includes('Itemized Bill of Materials (BOM)'), 'Step 5: BOM Review');
    assert.ok(builderContent.includes('Step 6 of 6') && builderContent.includes('Ready to Order or Request Site Survey'), 'Step 6: Finalize & Actions');
  });

  test('Strict Cable Allocation Rule: exactly 10 meters allocated per camera', () => {
    assert.ok(builderContent.includes('cameraCount * 10'), 'Must calculate exactly 10m per camera');
    assert.ok(builderContent.includes('Strict 10m/Camera Cable Allocation'), 'Must display strict cable allocation banner');
  });

  test('Pure Infrared Rule: IRPF cameras enforce pure IR standard with zero fake color claims', () => {
    assert.ok(builderContent.includes('Pure Infrared Night Vision Standard (Hikvision IRPF)'), 'Must include Pure IR standard notice');
    assert.ok(builderContent.includes('zero fabricated full-color') || builderContent.includes('does not fabricate'), 'Must explicitly disclaim fabricated full-color claims');
  });

  test('Storage Scaling Rule: 500GB for 2-4 cams, 1TB for 8 cams, 2TB for 16 cams', () => {
    assert.ok(builderContent.includes('500gb') && builderContent.includes('1tb') && builderContent.includes('2tb') && builderContent.includes('4tb'), 'Storage options must cover 500GB, 1TB, 2TB, 4TB');
    assert.ok(builderContent.includes('cameraCount >= 16') && builderContent.includes('cameraCount >= 8'), 'Must auto-scale default storage based on camera count');
  });

  test('Recorder Channel Validation: channel count strictly validates against camera count', () => {
    assert.ok(builderContent.includes('Channels Matched for'), 'Must indicate recorder channel validation');
    assert.ok(builderContent.includes('cameraCount <= 4') && builderContent.includes('cameraCount <= 8') && builderContent.includes('cameraCount <= 16'), 'Must pair 4, 8, 16, 32 channels');
  });

  test('Quotation Required / Missing Price Handling: unpriced items mark setup as quotation required', () => {
    assert.ok(builderContent.includes('quotationRequired') && builderContent.includes('totalPrice === null'), 'Must require quotation if price is missing');
    assert.ok(builderContent.includes('Ask for price'), 'Must render "Ask for price" instead of 0 BDT');
  });

  const packagesContent = fs.readFileSync(packagesPagePath, 'utf8');
  test('PackagesPage includes Custom Package Maker entry banner', () => {
    assert.ok(packagesContent.includes('Custom Package Maker') || packagesContent.includes('Build Your Own System'), 'Must include Custom Package Maker banner');
    assert.ok(packagesContent.includes('Launch Package Builder'), 'Must include Launch Package Builder button');
  });

  const appContent = fs.readFileSync(appPath, 'utf8');
  test('App.tsx routes /package-builder and /packages/:slug to PackageBuilderPage', () => {
    assert.ok(appContent.includes('/package-builder') || appContent.includes('package-builder'), 'Must support package-builder path');
    assert.ok(appContent.includes('PackageBuilderPage'), 'Must render PackageBuilderPage when param or builder is present');
  });

  const quoteContent = fs.readFileSync(quotePath, 'utf8');
  test('QuoteAndServicesPage loads prefill from Package Builder quote handoff', () => {
    assert.ok(quoteContent.includes('camnex_quote_prefill'), 'Must load quote prefill from localStorage');
  });

  // --------------------------------------------------------------------------
  // PART 2: Real Browser CDP Visual & Functional Test Pass
  // --------------------------------------------------------------------------
  console.log('\n--- 2. End-to-End CDP Browser Verification ---');

  const browserPath = getBrowserExecutable();
  if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

  const browserProc = cp.spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try { browserProc.kill('SIGTERM'); } catch (_) {}
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (_) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  let ws;
  try {
    // Wait for browser to be ready
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
      throw new Error('Failed to connect to browser CDP page target.');
    }

    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let idCounter = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    // 2a. Test Storefront Packages Page at 1280px
    console.log('  Testing /packages route on Desktop 1280px...');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE_URL}/packages` });
    await sleep(3000);

    const storefrontEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const h1 = document.querySelector('h1');
        const filterBar = document.querySelector('[data-filterbar]');
        const makerBanner = Array.from(document.querySelectorAll('h2, span, button')).some(el => el.textContent.includes('Package Builder') || el.textContent.includes('Build Your Own'));
        const cards = document.querySelectorAll('[data-package-id], [data-card-id]');
        return {
          hasH1: h1 ? h1.textContent.includes('Complete CCTV Packages') : false,
          hasFilterBar: !!filterBar,
          hasMakerBanner: makerBanner,
          cardCount: cards.length
        };
      })()`,
      returnByValue: true
    });

    test('/packages renders heading, filter bar, and package maker banner', () => {
      assert.strictEqual(storefrontEval.result.value.hasH1, true, 'Must have H1 heading');
      assert.strictEqual(storefrontEval.result.value.hasFilterBar, true, 'Must render [data-filterbar]');
      assert.strictEqual(storefrontEval.result.value.hasMakerBanner, true, 'Must render Package Builder entry banner');
      assert.ok(storefrontEval.result.value.cardCount > 0, 'Must render package cards');
    });

    // 2b. Test Package Builder Page at 1280px
    console.log('  Testing /package-builder route on Desktop 1280px...');
    await send('Page.navigate', { url: `${BASE_URL}/package-builder` });
    await sleep(2500);

    const builderEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasTitle = text.includes('Intelligent CCTV Package Builder');
        const hasStep1 = text.includes('Choose System Architecture');
        const hasAnalogue = text.includes('Analogue HD');
        const hasIp = text.includes('IP Network');
        const hasWifi = text.includes('Wi-Fi Wireless');
        return { hasTitle, hasStep1, hasAnalogue, hasIp, hasWifi };
      })()`,
      returnByValue: true
    });

    test('Package Builder initializes at Step 1 with 3 system architecture options', () => {
      const v = builderEval.result.value;
      assert.strictEqual(v.hasTitle, true, 'Builder title must be present');
      assert.strictEqual(v.hasStep1, true, 'Step 1 heading must be present');
      assert.strictEqual(v.hasAnalogue, true, 'Analogue HD option present');
      assert.strictEqual(v.hasIp, true, 'IP Network option present');
      assert.strictEqual(v.hasWifi, true, 'Wi-Fi Wireless option present');
    });

    // 2c. Click Next to Step 2 (Coverage & Cameras)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next: Cameras'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await sleep(600);

    const step2Eval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasStep2: text.includes('Camera Count, Form Factor & Night Vision'),
          hasPureIRNotice: text.includes('Pure Infrared Night Vision Standard'),
          hasFormFactors: text.includes('Bullet Camera') && text.includes('Dome Camera') && text.includes('Turret')
        };
      })()`,
      returnByValue: true
    });

    test('Package Builder Step 2 renders camera count, form factors & Pure IR compliance notice', () => {
      const v = step2Eval.result.value;
      assert.strictEqual(v.hasStep2, true, 'Step 2 must be active');
      assert.strictEqual(v.hasPureIRNotice, true, 'Pure IR compliance notice must be rendered');
      assert.strictEqual(v.hasFormFactors, true, 'Bullet, Dome, and Turret form factors rendered');
    });

    // 2d. Click Next to Step 3 (Recorder & Storage)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next: Recorder'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await sleep(600);

    const step3Eval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasStep3: text.includes('Recorder Sizing & Surveillance Hard Drive'),
          hasChannelMatch: text.includes('Channels Matched for'),
          hasStorageOptions: text.includes('500 GB') && text.includes('1 TB') && text.includes('2 TB')
        };
      })()`,
      returnByValue: true
    });

    test('Package Builder Step 3 validates recorder channels & displays surveillance storage', () => {
      const v = step3Eval.result.value;
      assert.strictEqual(v.hasStep3, true, 'Step 3 must be active');
      assert.strictEqual(v.hasChannelMatch, true, 'Recorder channel matching badge rendered');
      assert.strictEqual(v.hasStorageOptions, true, 'Surveillance HDD sizing options rendered');
    });

    // 2e. Click Next to Step 4 (Cabling & Accessories)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next: Accessories'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await sleep(600);

    const step4Eval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasStep4: text.includes('Cabling, Power Supplies & Display Monitor'),
          hasCableRule: text.includes('Strict 10m/Camera Cable Allocation Rule'),
          has40mCable: text.includes('40 meters') || text.includes('40m'),
          hasMonitorOptions: text.includes('17-Inch HD Monitor') && text.includes('19-Inch LED Monitor')
        };
      })()`,
      returnByValue: true
    });

    test('Package Builder Step 4 enforces strict 10m/camera cable rule (4 cams = 40m) & monitors', () => {
      const v = step4Eval.result.value;
      assert.strictEqual(v.hasStep4, true, 'Step 4 must be active');
      assert.strictEqual(v.hasCableRule, true, '10m/camera rule callout rendered');
      assert.strictEqual(v.has40mCable, true, 'Exactly 40m calculated for 4 cameras');
      assert.strictEqual(v.hasMonitorOptions, true, '17-inch and 19-inch monitor options present');
    });

    // 2f. Click Next to Step 5 (BOM Review)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const stepBtns = Array.from(document.querySelectorAll('button'));
        const nextBtn = stepBtns.find(b => b.textContent.includes('Next: BOM Review')) ||
                        stepBtns.find(b => b.textContent.includes('BOM Review'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await sleep(1000);

    const step5Eval = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasStep5: text.includes('Itemized Bill of Materials (BOM)'),
          hasCopyBOM: text.includes('Copy BOM') || text.includes('BOM Copied'),
          hasCameras: text.includes('Surveillance Cameras') || text.includes('Camera'),
          hasRecorder: text.includes('Recording Hardware') || text.includes('Recorder') || text.includes('DVR'),
          hasStorage: text.includes('Surveillance Storage') || text.includes('HDD') || text.includes('Hard Drive'),
          hasLineTotals: text.includes('৳'),
          snippet: text.slice(0, 300)
        };
      })()`,
      returnByValue: true
    });

    test('Package Builder Step 5 displays transparent itemized Bill of Materials with line totals', () => {
      const v = step5Eval.result.value || {};
      assert.strictEqual(v.hasStep5, true, 'Step 5 must be active');
      assert.strictEqual(v.hasCopyBOM, true, 'Copy BOM button rendered');
      assert.strictEqual(v.hasCameras, true, 'Cameras line rendered');
      assert.strictEqual(v.hasRecorder, true, 'Recorder line rendered');
      assert.strictEqual(v.hasStorage, true, 'Storage line rendered');
      assert.strictEqual(v.hasLineTotals, true, 'Priced line items display BDT totals');
    });

    // 2g. Capture Viewport Screenshots (1440, 1280, 768, 390)
    const viewports = [
      { w: 1440, h: 900, name: 'desktop-1440px' },
      { w: 1280, h: 800, name: 'desktop-1280px' },
      { w: 768, h: 1024, name: 'tablet-768px' },
      { w: 390, h: 844, name: 'mobile-390px' }
    ];

    console.log('\n--- 3. Capturing Multi-Viewport Screenshots ---');
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w < 768
      });
      await sleep(400);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `package_builder_${vp.w}x${vp.h}.png`;

      // Save to scratch shots
      const localShot = path.join(SHOTS_DIR, filename);
      fs.writeFileSync(localShot, Buffer.from(shot.data, 'base64'));

      // Save to brain artifact directory if it exists
      if (fs.existsSync(ARTIFACT_DIR)) {
        const artifactPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(artifactPath, Buffer.from(shot.data, 'base64'));
      }
      console.log(`  ✓ Saved screenshot: ${filename} (${vp.w}x${vp.h})`);
    }

  } finally {
    if (ws) ws.close();
    cleanup();
  }

  console.log('\n================================================================');
  console.log(`PACKAGES & BUILDER TEST SUITE FINISHED: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { run };
