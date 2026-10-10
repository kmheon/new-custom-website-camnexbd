const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9899;
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_pass2_shots_${Date.now()}`);
const BASE_URL = 'http://127.0.0.1:3000';
const SHOTS_DIR = path.join(__dirname, '../scratch/shots');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
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

    // 1. Desktop 1280px Viewport
    console.log('Capturing Desktop 1280px...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(3500);

    // Capture Above-the-fold Desktop
    const shotDesktopTop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'desktop-1280-top.png'), Buffer.from(shotDesktopTop.data, 'base64'));
    console.log('Saved desktop-1280-top.png');

    // Scroll to middle (Category grid, Special offers, Popular)
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1100)' });
    await sleep(800);
    const shotDesktopMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'desktop-1280-categories-offers.png'), Buffer.from(shotDesktopMid.data, 'base64'));
    console.log('Saved desktop-1280-categories-offers.png');

    // Scroll to Packages & Solutions
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 2400)' });
    await sleep(800);
    const shotDesktopSolutions = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'desktop-1280-packages-solutions.png'), Buffer.from(shotDesktopSolutions.data, 'base64'));
    console.log('Saved desktop-1280-packages-solutions.png');

    // Scroll to Services & Testimonials & Rows
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3600)' });
    await sleep(800);
    const shotDesktopServices = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'desktop-1280-services-rows.png'), Buffer.from(shotDesktopServices.data, 'base64'));
    console.log('Saved desktop-1280-services-rows.png');

    // 2. Mobile 375px Viewport
    console.log('Capturing Mobile 375px...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${BASE_URL}/` });
    await sleep(3500);

    const shotMobileTop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'mobile-375-top.png'), Buffer.from(shotMobileTop.data, 'base64'));
    console.log('Saved mobile-375-top.png');

    // Mobile scroll to offers & packages
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1400)' });
    await sleep(800);
    const shotMobileMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'mobile-375-mid.png'), Buffer.from(shotMobileMid.data, 'base64'));
    console.log('Saved mobile-375-mid.png');

    // Mobile scroll to solutions & services
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 3200)' });
    await sleep(800);
    const shotMobileSolutions = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS_DIR, 'mobile-375-solutions.png'), Buffer.from(shotMobileSolutions.data, 'base64'));
    console.log('Saved mobile-375-solutions.png');

    console.log('All screenshots captured successfully!');
    ws.close();
  } finally {
    edgeProc.kill('SIGKILL');
    try {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    } catch (_) {}
  }
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});

