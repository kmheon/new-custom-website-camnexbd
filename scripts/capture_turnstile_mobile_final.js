// scripts/capture_turnstile_mobile_final.js
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9933;
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_turnstile_mobile_${Date.now()}`);
const BASE_URL = 'http://127.0.0.1:3000';
const ARTIFACT_DIR = 'C:\\Users\\kmheo\\.gemini\\antigravity\\brain\\36271926-f329-4e6a-b73d-dc302fd8fe3b';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
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
    if (!target) throw new Error('No target page found');

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
    await send('DOM.enable');

    // 1. Mobile OTP Login Form (390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: `${BASE_URL}/account` });
    await sleep(2500);

    // Switch to Sign In tab, then OTP mode
    await send('Runtime.evaluate', {
      expression: `
        const loginTab = document.querySelector('[data-testid="tab-login"]');
        if (loginTab) loginTab.click();
      `
    });
    await sleep(600);

    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const otpBtn = btns.find(b => b.textContent && b.textContent.includes('Sign in with Phone SMS OTP'));
        if (otpBtn) otpBtn.click();
      `
    });
    await sleep(1500);

    await send('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('[data-testid="send-otp-button"]');
        if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await sleep(800);

    let { data: shotData } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'turnstile_otp_mobile_390x844.png'), Buffer.from(shotData, 'base64'));
    console.log('Saved: turnstile_otp_mobile_390x844.png');

    // 2. Mobile Checkout with Turnstile
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('camnex_cart_v1', JSON.stringify([{
          id: 'line-test-1',
          productId: 'prod-hik-irpf-2mp',
          quantity: 1,
          pricePerUnit: 2100,
          product: {
            id: 'prod-hik-irpf-2mp',
            name: 'Hikvision DS-2CE16D0T-IRPF 2MP Fixed Bullet Camera',
            slug: 'hikvision-ds-2ce16d0t-irpf-2mp',
            modelNumber: 'DS-2CE16D0T-IRPF',
            brand: 'Hikvision',
            pricing: { regularPrice: 2400, salePrice: 2100, currency: 'BDT' },
            images: [{ url: '/images/products/hik-bullet.png', isPrimary: true }]
          }
        }]));
      `
    });

    await send('Page.navigate', { url: `${BASE_URL}/cart` });
    await sleep(2500);

    // Click Proceed to Checkout
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const proceedBtn = btns.find(b => b.textContent && b.textContent.includes('Proceed to Checkout'));
        if (proceedBtn) proceedBtn.click();
      `
    });
    await sleep(1500);

    // Scroll to the place order button / turnstile
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('[data-testid="place-order-submit-btn"]');
        if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await sleep(1200);

    let { data: checkoutShot } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'turnstile_checkout_mobile_390x844.png'), Buffer.from(checkoutShot, 'base64'));
    console.log('Saved: turnstile_checkout_mobile_390x844.png');

    // 3. Verification Modal with Turnstile
    await send('Runtime.evaluate', {
      expression: `
        const verifyBtn = document.querySelector('[data-testid="checkout-verify-btn"]');
        if (verifyBtn) verifyBtn.click();
      `
    });
    await sleep(1500);

    let { data: modalShot } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'turnstile_verification_modal_mobile_390x844.png'), Buffer.from(modalShot, 'base64'));
    console.log('Saved: turnstile_verification_modal_mobile_390x844.png');

    ws.close();
    console.log('Done capturing all mobile views!');
  } finally {
    try {
      edgeProc.kill('SIGKILL');
    } catch (_) {}
  }
}

capture().catch(e => {
  console.error('Mobile capture error:', e);
  process.exit(1);
});

