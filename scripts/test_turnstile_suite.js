// scripts/test_turnstile_suite.js
// Automated verification suite for Cloudflare Turnstile bot protection

const BASE_URL = 'http://localhost:3000';

async function postJson(endpoint, body, cookie = null, csrf = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

async function getJson(endpoint, cookie = null) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('   CamneX Cloudflare Turnstile Integration Suite    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`\x1b[32m✔ PASS\x1b[0m - ${title}`);
      passed++;
    } else {
      console.log(`\x1b[31m✘ FAIL\x1b[0m - ${title} ${extra ? `(${extra})` : ''}`);
      failed++;
    }
  }

  // 1. Config endpoint check (sitekey public, secret key private)
  console.log('--- 1. Configuration & Secret Isolation ---');
  const config = await getJson('/api/auth/captcha/config');
  assert('Config endpoint responds HTTP 200', config.status === 200);
  assert('Config configured is true', config.data.configured === true);
  assert('Site key is published', typeof config.data.siteKey === 'string' && config.data.siteKey.startsWith('0x4AAAAAA'));
  assert('Secret key is strictly excluded from config', !('secretKey' in config.data) && !('TURNSTILE_SECRET_KEY' in config.data));

  // 2. Direct API request without token -> Rejected with 400 CAPTCHA_REQUIRED
  console.log('\n--- 2. Missing Token / Direct API Rejection ---');
  const regNoToken = await postJson('/api/auth/customer/register', {
    name: 'Bot Tester',
    email: `bot_${Date.now()}@test.com`,
    password: 'Password123!'
  });
  assert('Registration without captchaToken rejected (400)', regNoToken.status === 400);
  assert('Registration error code is CAPTCHA_REQUIRED', regNoToken.data.code === 'CAPTCHA_REQUIRED');

  const otpNoToken = await postJson('/api/auth/otp/send', {
    phone: '01711999888'
  });
  assert('OTP send without captchaToken rejected (400)', otpNoToken.status === 400);
  assert('OTP send error code is CAPTCHA_REQUIRED', otpNoToken.data.code === 'CAPTCHA_REQUIRED');

  const emailSendNoToken = await postJson('/api/auth/verification/email/send', {
    email: 'test@camnexbd.test'
  });
  assert('Email verification send without captchaToken rejected (400)', emailSendNoToken.status === 400);
  assert('Email verification send error code is CAPTCHA_REQUIRED', emailSendNoToken.data.code === 'CAPTCHA_REQUIRED');

  const phoneSendNoToken = await postJson('/api/auth/verification/phone/send', {
    phone: '01711999888'
  });
  assert('Phone verification send without captchaToken rejected (400)', phoneSendNoToken.status === 400);
  assert('Phone verification send error code is CAPTCHA_REQUIRED', phoneSendNoToken.data.code === 'CAPTCHA_REQUIRED');

  const orderNoToken = await postJson('/api/orders', {
    customerName: 'Direct Bot',
    customerPhone: '01711999888',
    deliveryAddress: 'Dhaka',
    city: 'Dhaka',
    items: [{ id: 'prod-hik-irpf-2mp', quantity: 1, price: 2100 }]
  });
  assert('Order without captchaToken rejected (400)', orderNoToken.status === 400);
  assert('Order error code is CAPTCHA_REQUIRED', orderNoToken.data.code === 'CAPTCHA_REQUIRED');

  // 3. Invalid Token Rejection
  console.log('\n--- 3. Invalid Token Rejection ---');
  const regInvalidToken = await postJson('/api/auth/customer/register', {
    name: 'Invalid Token Bot',
    email: `bot_inv_${Date.now()}@test.com`,
    password: 'Password123!',
    captchaToken: '2x00000000000000000000AB' // Cloudflare official test token for forced failure
  });
  assert('Forced-failure test token rejected (400)', regInvalidToken.status === 400);
  assert('Invalid test token error code is CAPTCHA_INVALID or CAPTCHA_FAILED', 
    regInvalidToken.data.code === 'CAPTCHA_INVALID' || regInvalidToken.data.code === 'CAPTCHA_FAILED');

  const regRandomToken = await postJson('/api/auth/customer/register', {
    name: 'Garbage Token Bot',
    email: `bot_rand_${Date.now()}@test.com`,
    password: 'Password123!',
    captchaToken: 'gibberish-unverified-token-xyz'
  });
  assert('Arbitrary bogus token rejected by Cloudflare siteverify (400)', regRandomToken.status === 400);
  assert('Arbitrary bogus token returns CAPTCHA error code', 
    regRandomToken.data.code === 'CAPTCHA_INVALID' || regRandomToken.data.code === 'CAPTCHA_FAILED');

  // 4. Expired Token Rejection
  console.log('\n--- 4. Expired Token Rejection ---');
  const regExpiredToken = await postJson('/api/auth/customer/register', {
    name: 'Expired Token Bot',
    email: `bot_exp_${Date.now()}@test.com`,
    password: 'Password123!',
    captchaToken: '3x00000000000000000000AC' // Cloudflare official test token for timeout/duplicate
  });
  assert('Expired test token rejected (400)', regExpiredToken.status === 400);
  assert('Expired test token code is CAPTCHA_EXPIRED', regExpiredToken.data.code === 'CAPTCHA_EXPIRED');

  // 5. Valid Test Token Acceptance & Replay Attack Prevention
  console.log('\n--- 5. Valid Test Token & Replay Prevention ---');
  const replayToken = `test_valid_replay_${Date.now()}`;
  const testEmail = `valid_cust_${Date.now()}@camnexbd.test`;
  const regValid = await postJson('/api/auth/customer/register', {
    name: 'Valid Customer',
    email: testEmail,
    password: 'Password123!',
    captchaToken: replayToken
  });
  assert('Valid test token accepted for registration (200/201)', 
    regValid.status === 200 || regValid.status === 201, `Status: ${regValid.status}`);
  
  // Replay the EXACT same token immediately
  const regReplay = await postJson('/api/auth/customer/register', {
    name: 'Replay Attacker',
    email: `replay_${Date.now()}@camnexbd.test`,
    password: 'Password123!',
    captchaToken: replayToken
  });
  assert('Reused/replayed token immediately rejected (400)', regReplay.status === 400);
  assert('Reused token error code is CAPTCHA_REUSED', regReplay.data.code === 'CAPTCHA_REUSED');

  // 6. Customer Verification Before Order Placement Enforced
  console.log('\n--- 6. Unverified Customer Checkout Enforcement ---');
  // 6a. Guest checkout without verification
  const guestOrder = await postJson('/api/orders', {
    customerName: 'Guest Customer',
    customerPhone: '01799887766',
    deliveryAddress: 'Banani, Dhaka',
    city: 'Dhaka',
    items: [{ id: 'prod-hik-irpf-2mp', quantity: 1, price: 2100 }],
    captchaToken: `test_valid_order_guest_${Date.now()}`
  });
  assert('Guest order without contact verification blocked (403 VERIFICATION_REQUIRED)', 
    guestOrder.status === 403 && guestOrder.data.code === 'VERIFICATION_REQUIRED', 
    `Status: ${guestOrder.status}, Code: ${guestOrder.data?.code}`);

  // 6b. Authenticated unverified customer checkout
  const setCookies = regValid.headers.getSetCookie ? regValid.headers.getSetCookie() : [regValid.headers.get('set-cookie')];
  const cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');
  const csrfCookie = setCookies.find(c => c.startsWith('camnex_csrf='));
  const csrfToken = csrfCookie ? csrfCookie.split(';')[0].replace('camnex_csrf=', '') : null;

  const unverifiedOrder = await postJson('/api/orders', {
    customerName: 'Valid Customer',
    customerPhone: '01799887766',
    deliveryAddress: 'Banani, Dhaka',
    city: 'Dhaka',
    items: [{ id: 'prod-hik-irpf-2mp', quantity: 1, price: 2100 }],
    captchaToken: `test_valid_order_${Date.now()}`
  }, cookieStr, csrfToken);
  assert('Authenticated unverified customer order blocked (403 VERIFICATION_REQUIRED)', 
    unverifiedOrder.status === 403 && unverifiedOrder.data.code === 'VERIFICATION_REQUIRED', 
    `Status: ${unverifiedOrder.status}, Code: ${unverifiedOrder.data?.code}`);

  // 7. Google OAuth Status Check
  console.log('\n--- 7. OAuth Status ---');
  const providers = await getJson('/api/auth/providers');
  assert('Providers endpoint accessible', providers.status === 200);
  assert('Google OAuth reported configured', providers.data?.google?.configured === true);

  console.log('\n====================================================');
  console.log(`Tests Finished: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
