// tests/test_security_attacks.js
// Automated verification pass of security controls against CamneX Business Platform
// Verifies RBAC, CSRF (including POST /api/orders & admin product save), Rate Limiting,
// IDOR / Order Privacy, Upload Validation, and SQL Injection resistance.

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || `http://127.0.0.1:${process.env.TEST_PORT || process.env.PORT || 3000}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@camnexbd.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TestAdminPassword123!';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, pass, details) {
  if (pass) {
    results.passed++;
    console.log(`[PASS] ${name}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${name} -> ${details}`);
  }
  results.tests.push({ name, pass, details });
}

// Helper to make fetch requests with cookie tracking
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  return fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });
}

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('STARTING AUTOMATED SECURITY ATTACK VERIFICATION PASS');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Unauthenticated access to /api/admin/* endpoints
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: UNAUTHENTICATED ADMIN ACCESS ---');
  const adminEndpoints = [
    { method: 'GET', path: '/api/admin/customers' },
    { method: 'GET', path: '/api/admin/redirects' },
    { method: 'POST', path: '/api/admin/redirects', body: JSON.stringify({ from_path: '/x', to_path: '/y' }) },
    { method: 'GET', path: '/api/admin/media' },
    { method: 'GET', path: '/api/admin/research/saved' },
    { method: 'POST', path: '/api/categories', body: JSON.stringify({ name: 'Hack' }) },
    { method: 'POST', path: '/api/brands', body: JSON.stringify({ name: 'Hack' }) },
    { method: 'POST', path: '/api/packages', body: JSON.stringify({ name: 'Hack' }) },
    { method: 'POST', path: '/api/products', body: JSON.stringify({ name: 'Hack' }) },
    { method: 'PUT', path: '/api/orders/ord-test/status', body: JSON.stringify({ status: 'delivered' }) },
    { method: 'PUT', path: '/api/settings', body: JSON.stringify({ companyName: 'Hacked' }) },
    { method: 'POST', path: '/api/cms/pages', body: JSON.stringify({ title: 'Hack', slug: 'hack' }) },
    { method: 'POST', path: '/api/cms/testimonials', body: JSON.stringify({ clientName: 'Hack', content: 'Hack' }) },
    { method: 'POST', path: '/api/cms/projects', body: JSON.stringify({ title: 'Hack', slug: 'hack' }) }
  ];

  for (const ep of adminEndpoints) {
    try {
      const res = await request(ep.path, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body
      });
      const isForbidden = res.status === 403;
      record(`Unauthenticated ${ep.method} ${ep.path} rejected (403)`, isForbidden, `Got status ${res.status}`);
    } catch (err) {
      record(`Unauthenticated ${ep.method} ${ep.path}`, false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 2: Customer Role Privilege Escalation to Admin Routes
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: PRIVILEGE ESCALATION (CUSTOMER ROLE) ---');
  let customerCookie = '';
  let customerCsrf = '';

  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `cust_${Date.now()}@test.com`,
        password: 'CustomerPass123!'
      })
    });

    const setCookies = regRes.headers.get('set-cookie');
    if (setCookies) {
      const sessMatch = setCookies.match(/camnex_session=([^;]+)/);
      const csrfMatch = setCookies.match(/camnex_csrf=([^;]+)/);
      if (sessMatch) customerCookie = `camnex_session=${sessMatch[1]}`;
      if (csrfMatch) {
        customerCsrf = csrfMatch[1];
        customerCookie += `; camnex_csrf=${csrfMatch[1]}`;
      }
    }

    record('Customer Registration succeeds for test setup', regRes.status === 201 || regRes.status === 200, `Status: ${regRes.status}`);

    const custAdminTests = [
      { method: 'GET', path: '/api/admin/customers' },
      { method: 'GET', path: '/api/admin/redirects' },
      { method: 'POST', path: '/api/admin/redirects', body: JSON.stringify({ from_path: '/x', to_path: '/y' }) },
      { method: 'POST', path: '/api/products', body: JSON.stringify({ name: 'Cust Hack' }) },
      { method: 'PUT', path: '/api/orders/ord-001/status', body: JSON.stringify({ status: 'delivered' }) }
    ];

    for (const ep of custAdminTests) {
      const res = await request(ep.path, {
        method: ep.method,
        cookie: customerCookie,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': customerCsrf
        },
        body: ep.body
      });
      const isForbidden = res.status === 403;
      record(`Customer role denied to ${ep.method} ${ep.path}`, isForbidden, `Got status ${res.status}`);
    }
  } catch (err) {
    record('Customer Privilege Escalation Setup', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: CSRF Failure on State-Changing Authenticated Requests
  // (Including POST /api/orders and Admin Product Save POST /api/products)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: CSRF PROTECTION VERIFICATION ---');
  try {
    // 3a. Generic CSRF on /api/auth/logout with session cookie but missing token
    const noCsrfRes = await request('/api/auth/logout', {
      method: 'POST',
      cookie: customerCookie,
      headers: { 'Content-Type': 'application/json' }
    });
    record('Request with session cookie but missing CSRF token rejected (403)', noCsrfRes.status === 403, `Status: ${noCsrfRes.status}`);

    // 3b. Generic CSRF on /api/auth/logout with session cookie and invalid token
    const badCsrfRes = await request('/api/auth/logout', {
      method: 'POST',
      cookie: customerCookie,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid-forged-csrf-token'
      }
    });
    record('Request with invalid CSRF token rejected (403)', badCsrfRes.status === 403, `Status: ${badCsrfRes.status}`);

    // 3c. Customer POST /api/orders without CSRF token
    const orderPayload = JSON.stringify({
      customerName: 'Test Buyer',
      customerPhone: '01711122233',
      deliveryAddress: 'Test Road, Dhaka',
      paymentMethod: 'cod',
      items: [{
        productId: 'prod-test-csrf',
        quantity: 1,
        pricePerUnit: 1200,
        product: { name: 'Test Product', pricing: { regularPrice: 1200 } }
      }]
    });

    const orderNoCsrf = await request('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      headers: { 'Content-Type': 'application/json' },
      body: orderPayload
    });
    record('Customer POST /api/orders with session but missing CSRF token rejected (403)', orderNoCsrf.status === 403, `Status: ${orderNoCsrf.status}`);

    // 3d. Customer POST /api/orders with mismatched/invalid CSRF token
    const orderBadCsrf = await request('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'forged-token-999'
      },
      body: orderPayload
    });
    record('Customer POST /api/orders with session and invalid CSRF token rejected (403)', orderBadCsrf.status === 403, `Status: ${orderBadCsrf.status}`);

    // First ensure COD is enabled in settings for test orders to succeed
    // Login as admin to perform admin product save & verify admin CSRF
    const adminCsrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const adminCsrfCookies = adminCsrfRes.headers.get('set-cookie') || '';
    const adminInitCsrfMatch = adminCsrfCookies.match(/camnex_csrf=([^;]+)/);
    const adminInitCsrf = adminInitCsrfMatch ? adminInitCsrfMatch[1] : '';

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `camnex_csrf=${adminInitCsrf}`,
        'X-CSRF-Token': adminInitCsrf
      },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });

    let adminCookie = '';
    let adminCsrf = '';
    const adminSetCookies = adminLoginRes.headers.get('set-cookie') || '';
    const aSessMatch = adminSetCookies.match(/camnex_session=([^;]+)/);
    const aCsrfMatch = adminSetCookies.match(/camnex_csrf=([^;]+)/);
    if (aSessMatch) adminCookie = `camnex_session=${aSessMatch[1]}`;
    if (aCsrfMatch) {
      adminCsrf = aCsrfMatch[1];
      adminCookie += `; camnex_csrf=${aCsrfMatch[1]}`;
    }

    record('Admin login succeeds for admin CSRF testing', adminLoginRes.status === 200 && !!adminCookie, `Status: ${adminLoginRes.status}`);

    // Enable COD in settings so order creation succeeds
    await request('/api/settings', {
      method: 'PUT',
      cookie: adminCookie,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': adminCsrf
      },
      body: JSON.stringify({ enableCashOnDelivery: true })
    });

    // 3e. Customer POST /api/orders with VALID CSRF token succeeds
    const orderValidCsrf = await request('/api/orders', {
      method: 'POST',
      cookie: customerCookie,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': customerCsrf
      },
      body: orderPayload
    });
    record('Customer POST /api/orders with valid session & matching CSRF token succeeds (200/201)', orderValidCsrf.status === 200 || orderValidCsrf.status === 201, `Status: ${orderValidCsrf.status}`);

    // 3f. Admin Product Save (POST /api/products) without CSRF token
    const testProductPayload = JSON.stringify({
      id: `prod-csrf-${Date.now()}`,
      name: 'CSRF Test Bullet Camera',
      modelNumber: 'DS-2CD-CSRF',
      sku: `SKU-CSRF-${Date.now()}`,
      brand: 'Hikvision',
      category: 'cctv-cameras',
      pricing: { regularPrice: 4500, salePrice: 4200 },
      inventory: { available: 5 }
    });

    const prodNoCsrf = await request('/api/products', {
      method: 'POST',
      cookie: adminCookie,
      headers: { 'Content-Type': 'application/json' },
      body: testProductPayload
    });
    record('Admin product save (POST /api/products) without CSRF token rejected (403)', prodNoCsrf.status === 403, `Status: ${prodNoCsrf.status}`);

    // 3g. Admin Product Save (POST /api/products) with invalid CSRF token
    const prodBadCsrf = await request('/api/products', {
      method: 'POST',
      cookie: adminCookie,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'forged-admin-csrf'
      },
      body: testProductPayload
    });
    record('Admin product save (POST /api/products) with invalid CSRF token rejected (403)', prodBadCsrf.status === 403, `Status: ${prodBadCsrf.status}`);

    // 3h. Admin Product Save (POST /api/products) with VALID CSRF token succeeds
    const prodValidCsrf = await request('/api/products', {
      method: 'POST',
      cookie: adminCookie,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': adminCsrf
      },
      body: testProductPayload
    });
    record('Admin product save (POST /api/products) with valid CSRF token succeeds (200/201)', prodValidCsrf.status === 200 || prodValidCsrf.status === 201, `Status: ${prodValidCsrf.status}`);

  } catch (err) {
    record('CSRF verification test suite', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: IDOR / Privacy Check: Customer A vs Customer B Order Access
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: ORDER PRIVACY & IDOR PREVENTION ---');
  try {
    const victimPhone = `018${Math.floor(10000000 + Math.random() * 90000000)}`;
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Victim Customer',
        customerPhone: victimPhone,
        customerEmail: `victim_${Date.now()}@test.com`,
        deliveryAddress: 'House 1, Road 2, Dhanmondi',
        deliveryCity: 'Dhaka',
        deliveryMethod: 'inside_dhaka',
        paymentMethod: 'cod',
        items: [
          {
            id: 'item-1',
            productId: 'prod-001',
            product: { name: 'Test Cam', pricing: { regularPrice: 2500 } },
            quantity: 1,
            pricePerUnit: 2500
          }
        ]
      })
    });
    const orderData = await orderRes.json();
    const orderNumber = orderData.orderNumber;
    record('Test order created successfully', !!orderNumber, `Order: ${orderNumber}`);

    if (orderNumber) {
      // 1. Guest attempts to read order WITHOUT phone verification query param
      const guestNoPhone = await fetch(`${BASE_URL}/api/orders/${orderNumber}`);
      record('Guest reading order without phone param rejected (401/403)', guestNoPhone.status === 401 || guestNoPhone.status === 403, `Status: ${guestNoPhone.status}`);

      // 2. Guest attempts to read order with WRONG phone verification
      const guestWrongPhone = await fetch(`${BASE_URL}/api/orders/${orderNumber}?phone=01999999999`);
      record('Guest reading order with wrong phone param rejected (403)', guestWrongPhone.status === 403, `Status: ${guestWrongPhone.status}`);

      // 3. Guest with CORRECT phone verification succeeds
      const guestRightPhone = await fetch(`${BASE_URL}/api/orders/${orderNumber}?phone=${victimPhone}`);
      record('Guest reading order with correct phone param allowed (200)', guestRightPhone.status === 200, `Status: ${guestRightPhone.status}`);

      // 4. Different customer logged in attempts to read this order
      const otherCustRes = await request(`/api/orders/${orderNumber}`, {
        cookie: customerCookie
      });
      record('Different logged-in customer reading order rejected (403)', otherCustRes.status === 403, `Status: ${otherCustRes.status}`);
    }
  } catch (err) {
    record('Order Privacy / IDOR Test', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Strict Upload Validation (SVG, Fake Extension, Oversized)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: STRICT UPLOAD SECURITY ---');
  try {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakeFileContent = '<?php echo "evil script"; ?>';
    const fakeBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="payload.png"',
      'Content-Type: image/png',
      '',
      fakeFileContent,
      `--${boundary}--`
    ].join('\r\n');

    const fakeUploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: fakeBody
    });
    const fakeUploadBlocked = fakeUploadRes.status === 400 || fakeUploadRes.status === 403;
    record('Fake extension with invalid magic bytes blocked (400/403)', fakeUploadBlocked, `Status: ${fakeUploadRes.status}`);

    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const svgBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="xss.svg"',
      'Content-Type: image/svg+xml',
      '',
      svgContent,
      `--${boundary}--`
    ].join('\r\n');

    const svgRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: svgBody
    });
    const svgBlocked = svgRes.status === 400 || svgRes.status === 403;
    record('SVG upload attempt rejected (disallowed type/magic bytes)', svgBlocked, `Status: ${svgRes.status}`);

    const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const bigBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="huge.jpg"',
      'Content-Type: image/jpeg',
      '',
      bigBuffer.toString('binary'),
      `--${boundary}--`
    ].join('\r\n');

    const bigRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: bigBody
    });
    const bigBlocked = bigRes.status === 400 || bigRes.status === 413 || bigRes.status === 403;
    record('Oversized upload (>5MB) rejected (400/413/403)', bigBlocked, `Status: ${bigRes.status}`);
  } catch (err) {
    record('Upload Security Test', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: SQL Injection Resilience in Search & Filters
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: SQL INJECTION RESILIENCE ---');
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE products; --",
    '" UNION SELECT * FROM users --',
    "' OR 1=1; --",
    "admin' --",
    "1'; EXEC xp_cmdshell('dir'); --"
  ];

  for (const payload of sqlPayloads) {
    try {
      const encoded = encodeURIComponent(payload);
      const searchRes = await fetch(`${BASE_URL}/api/search?q=${encoded}`);
      const prodRes = await fetch(`${BASE_URL}/api/products?search=${encoded}`);
      
      const searchOk = searchRes.status === 200;
      const prodOk = prodRes.status === 200;

      const searchJson = await searchRes.json();
      const prodJson = await prodRes.json();

      const safe = searchOk && prodOk && Array.isArray(searchJson.products || searchJson) && Array.isArray(prodJson.items || prodJson);
      record(`SQL injection payload "${payload}" handled safely`, safe, `Search: ${searchRes.status}, Products: ${prodRes.status}`);
    } catch (err) {
      record(`SQL injection payload "${payload}"`, false, err.message);
    }
  }

  try {
    const checkRes = await fetch(`${BASE_URL}/api/products?limit=1`);
    const checkJson = await checkRes.json();
    const dbIntact = checkRes.status === 200 && Array.isArray(checkJson.items);
    record('Database integrity verified (products table intact after attack suite)', dbIntact, `Products count: ${checkJson.total || 0}`);
  } catch (err) {
    record('Database integrity check', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: Rate Limiting on Login
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: LOGIN RATE LIMITING ---');
  let rateLimited = false;
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'brute@force.com', password: 'wrongpassword' })
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    } catch (_) {}
  }
  record('Admin login rate limiting triggers 429 on rapid brute force', rateLimited, `Rate limited: ${rateLimited}`);

  console.log('\n====================================================');
  console.log(`AUDIT FINISHED: Passed ${results.passed}/${results.tests.length}, Failed: ${results.failed}`);
  console.log('====================================================\n');

  return results;
}

if (require.main === module) {
  runSecurityAudit().then(r => {
    if (r.failed > 0) process.exit(1);
    process.exit(0);
  });
}

module.exports = { runSecurityAudit };

