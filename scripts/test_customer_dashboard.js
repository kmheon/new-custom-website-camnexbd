// scripts/test_customer_dashboard.js
const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');
const db = require('../database.js');

const EDGE_PATH = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9933;
const USER_DATA_DIR = path.join(os.tmpdir(), `edge_cust_dash_${Date.now()}`);
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

// 0. Ensure deterministic test customer in DB
const TEST_CUST_ID = 'cust-dash-tester';
const TEST_CUST_EMAIL = 'tester@camnexbd.test';
const TEST_CUST_PHONE = '01799887766';
const TEST_CUST_PASS = 'TestPass123!';

function setupTestCustomer() {
  const existing = db.prepare('SELECT id FROM customers WHERE id = ?').get(TEST_CUST_ID);
  const passwordHash = bcrypt.hashSync(TEST_CUST_PASS, 10);
  const custData = {
    id: TEST_CUST_ID,
    name: 'Fahim Chowdhury',
    phone: TEST_CUST_PHONE,
    email: TEST_CUST_EMAIL,
    companyName: 'CamneX BD Ltd',
    customerType: 'individual',
    email_verified: true,
    emailVerified: true,
    phone_verified: true,
    phoneVerified: true,
    addresses: [
      {
        id: 'addr-test-1',
        label: 'Office',
        recipientName: 'Fahim Chowdhury',
        recipientPhone: '01799887766',
        addressLine: 'House 42, Road 11, Banani',
        district: 'Dhaka',
        thana: 'Banani',
        area: 'Block D',
        city: 'Dhaka',
        postalCode: '1213',
        isDefault: true
      }
    ],
    createdAt: new Date().toISOString()
  };

  if (existing) {
    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, password_hash = ?, email_verified = 1, phone_verified = 1, data_json = ?
      WHERE id = ?
    `).run(custData.name, custData.phone, custData.email, passwordHash, JSON.stringify(custData), TEST_CUST_ID);
  } else {
    db.prepare(`
      INSERT INTO customers (id, name, phone, email, password_hash, customer_type, email_verified, phone_verified, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, 'individual', 1, 1, ?, ?)
    `).run(TEST_CUST_ID, custData.name, custData.phone, custData.email, passwordHash, JSON.stringify(custData), custData.createdAt);
  }

  // Also ensure a test order exists for this customer
  const orderId = 'ord-dash-test-1';
  const existingOrder = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
  const orderData = {
    id: orderId,
    orderNumber: 'CNX-2026-9999',
    customerId: TEST_CUST_ID,
    customerName: 'Fahim Chowdhury',
    customerPhone: TEST_CUST_PHONE,
    customerEmail: TEST_CUST_EMAIL,
    items: [
      {
        productId: 'prod-hik-irpf-2mp',
        productName: 'Hikvision 2MP Fixed Bullet Network Camera',
        model: 'DS-2CD1023G0E-I',
        quantity: 2,
        unitPrice: 3200,
        totalPrice: 6400
      }
    ],
    subtotal: 6400,
    shippingCost: 60,
    totalAmount: 6460,
    deliveryMethod: 'courier',
    shippingAddress: {
      addressLine: 'House 42, Road 11, Banani',
      district: 'Dhaka',
      thana: 'Banani',
      city: 'Dhaka'
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'confirmed',
    courierName: 'Steadfast Courier',
    trackingNumber: 'STF-TEST-889911',
    createdAt: new Date().toISOString()
  };

  if (!existingOrder) {
    db.prepare(`
      INSERT INTO orders (id, order_number, customer_name, customer_phone, customer_email, total_amount, payment_method, payment_status, order_status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, orderData.orderNumber, orderData.customerName, orderData.customerPhone, orderData.customerEmail, orderData.totalAmount, orderData.paymentMethod, orderData.paymentStatus, orderData.orderStatus, JSON.stringify(orderData), orderData.createdAt);
  }

  // Ensure wishlist item exists
  const prodRow = db.prepare('SELECT id FROM products LIMIT 1').get();
  if (prodRow) {
    db.prepare('INSERT OR IGNORE INTO wishlists (customer_id, product_id) VALUES (?, ?)').run(TEST_CUST_ID, prodRow.id);
  }
}

async function runApiTests() {
  console.log('\n--- 1. Testing Customer Dashboard APIs ---');
  setupTestCustomer();
  
  // Login as test customer
  const loginRes = await fetch(`${BASE_URL}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: TEST_CUST_PHONE,
      password: TEST_CUST_PASS
    })
  });

  const rawCookie = loginRes.headers.get('set-cookie');
  let authCookie = '';
  if (rawCookie) {
    authCookie = rawCookie.split(';')[0];
  }

  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success, 'Customer login succeeded');
  assert(authCookie.includes('camnex_session='), 'Session cookie returned upon login');

  // Fetch CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: { Cookie: authCookie }
  });
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken || '';
  assert(csrfToken.length > 0, 'CSRF token retrieved for authenticated customer');

  // Test GET /api/customer/orders
  console.log('\n- Testing GET /api/customer/orders:');
  const ordersRes = await fetch(`${BASE_URL}/api/customer/orders`, {
    headers: { Cookie: authCookie }
  });
  assert(ordersRes.status === 200, 'Orders endpoint returns 200 OK');
  const orders = await ordersRes.json();
  assert(Array.isArray(orders), 'Returns orders array');
  assert(orders.length >= 1, `Found ${orders.length} order(s) for customer`);
  assert(orders[0].orderNumber === 'CNX-2026-9999', 'Order number matches test order');
  assert(orders[0].trackingNumber === 'STF-TEST-889911', 'Tracking number present on order');

  // Verify unauthorized access to /api/customer/orders
  const unauthOrdersRes = await fetch(`${BASE_URL}/api/customer/orders`);
  assert(unauthOrdersRes.status === 401, 'Unauthenticated GET /api/customer/orders returns 401 Unauthorized');

  // Test GET /api/customer/profile
  console.log('\n- Testing GET & PUT /api/customer/profile:');
  const profileRes = await fetch(`${BASE_URL}/api/customer/profile`, {
    headers: { Cookie: authCookie }
  });
  assert(profileRes.status === 200, 'Profile endpoint returns 200 OK');
  const profileData = await profileRes.json();
  assert(profileData.customer && profileData.customer.phone === TEST_CUST_PHONE, 'Returns correct customer profile');
  assert(profileData.customer.email_verified === true, 'Profile contains email_verified flag');
  assert(profileData.customer.phone_verified === true, 'Profile contains phone_verified flag');

  // Update profile
  const updateRes = await fetch(`${BASE_URL}/api/customer/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      name: 'Fahim Chowdhury Updated',
      companyName: 'CamneX Technologies Bangladesh',
      role: 'admin', // Privilege escalation attempt
      email_verified: 0 // Tamper attempt
    })
  });
  assert(updateRes.status === 200, 'PUT /api/customer/profile succeeds');
  const updateData = await updateRes.json();
  assert(updateData.customer.name === 'Fahim Chowdhury Updated', 'Customer name updated');
  assert(updateData.customer.companyName === 'CamneX Technologies Bangladesh', 'Company name updated');
  assert(updateData.customer.role !== 'admin', 'Privilege escalation rejected: role is not admin');

  // Test GET & Manage Addresses
  console.log('\n- Testing Saved Addresses CRUD:');
  const addrRes = await fetch(`${BASE_URL}/api/customer/addresses`, {
    headers: { Cookie: authCookie }
  });
  assert(addrRes.status === 200, 'GET /api/customer/addresses returns 200 OK');
  const initialAddresses = await addrRes.json();
  assert(Array.isArray(initialAddresses), 'Returns addresses array');

  // Add new address
  const addAddrRes = await fetch(`${BASE_URL}/api/customer/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      label: 'Home',
      recipientName: 'Fahim Chowdhury',
      recipientPhone: '01799887766',
      addressLine: 'House 12, Road 4, Sector 5',
      district: 'Dhaka',
      thana: 'Uttara',
      area: 'Sector 5',
      postalCode: '1230',
      isDefault: true
    })
  });
  assert(addAddrRes.status === 200 || addAddrRes.status === 201, 'POST /api/customer/addresses succeeded');
  const updatedAddrs = await addAddrRes.json();
  assert(Array.isArray(updatedAddrs) && updatedAddrs.length === initialAddresses.length + 1, 'Address appended to list');
  const addedAddr = updatedAddrs.find(a => a.label === 'Home');
  assert(addedAddr && addedAddr.thana === 'Uttara', 'New address contains correct thana and district');

  // Delete address
  if (addedAddr) {
    const delAddrRes = await fetch(`${BASE_URL}/api/customer/addresses/${addedAddr.id}`, {
      method: 'DELETE',
      headers: {
        'Cookie': authCookie,
        'X-CSRF-Token': csrfToken
      }
    });
    assert(delAddrRes.status === 200, 'DELETE /api/customer/addresses/:id succeeds');
  }

  // Test Security Info and Password Change
  console.log('\n- Testing Security & Password API:');
  const secRes = await fetch(`${BASE_URL}/api/customer/security`, {
    headers: { Cookie: authCookie }
  });
  assert(secRes.status === 200, 'GET /api/customer/security returns 200 OK');
  const secData = await secRes.json();
  assert(secData.hasPassword === true, 'Customer has password set');
  assert(typeof secData.googleLinked === 'boolean', 'Google linked flag returned');
  assert(secData.appleSupported === false, 'Apple ID explicitly marked as deferred (false)');

  // Test password change with wrong password
  const wrongPwRes = await fetch(`${BASE_URL}/api/customer/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword999!',
      newPassword: 'BrandNewPass123!'
    })
  });
  assert(wrongPwRes.status === 400, 'Password change with wrong current password rejected (400)');

  // Change password to new password
  const validPwRes = await fetch(`${BASE_URL}/api/customer/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      currentPassword: TEST_CUST_PASS,
      newPassword: 'BrandNewPass123!'
    })
  });
  assert(validPwRes.status === 200, 'Password change with correct password succeeds (200)');

  // Restore original password
  const restorePwRes = await fetch(`${BASE_URL}/api/customer/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      currentPassword: 'BrandNewPass123!',
      newPassword: TEST_CUST_PASS
    })
  });
  assert(restorePwRes.status === 200, 'Restored original password succeeds');

  return { authCookie };
}

async function runBrowserTests(authCookie) {
  console.log('\n--- 2. Testing Customer Dashboard in Browser (Edge CDP) ---');
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

    // Set auth cookie
    const cookieVal = authCookie.replace('camnex_session=', '');
    await send('Network.setCookie', {
      name: 'camnex_session',
      value: cookieVal,
      domain: '127.0.0.1',
      path: '/'
    });

    // 1. Desktop Test (1440x900)
    console.log('\n  Desktop Viewport (1440x900):');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: `${BASE_URL}/account` });
    await sleep(2500);

    const title = await evaluate('document.title');
    assert(title && title.includes('Customer Account'), `Page loaded with title: "${title}"`);

    // Verify Overview Tab rendered
    const overviewHeading = await evaluate('document.querySelector("h2")?.innerText');
    assert(overviewHeading && overviewHeading.includes('Welcome back'), `Overview tab active: "${overviewHeading}"`);

    // Verify verification badge / alert in Overview
    const hasVerifyBadge = await evaluate(`
      document.body.innerText.includes('Email Verified') || document.body.innerText.includes('Verify Email')
    `);
    assert(hasVerifyBadge, 'Overview displays verification status badges');

    await captureScreenshot('customer_dashboard_overview_desktop_1440x900.png');

    // Navigate to "My Orders" tab
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('My Orders'));
      if (btn) btn.click();
    `);
    await sleep(600);
    const ordersTabHeader = await evaluate('document.body.innerText.includes("Order History")');
    assert(ordersTabHeader, 'My Orders tab rendered with Order History header');
    
    // Check if order number and tracking are visible in orders list
    const hasOrder = await evaluate('document.body.innerText.includes("CNX-2026-9999")');
    assert(hasOrder, 'Test order CNX-2026-9999 visible in order history');
    await captureScreenshot('customer_dashboard_orders_desktop_1440x900.png');

    // Navigate to "Saved Addresses" tab and test Add Address modal
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Saved Addresses'));
      if (btn) btn.click();
    `);
    await sleep(600);
    const addrTabHeader = await evaluate('document.body.innerText.includes("Saved Delivery Addresses")');
    assert(addrTabHeader, 'Saved Addresses tab rendered');

    // Click "Add New Address"
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add New Address') || b.innerText.includes('Add Address'));
      if (btn) btn.click();
    `);
    await sleep(600);
    const modalVisible = await evaluate('document.body.innerText.includes("Add New Delivery Address")');
    assert(modalVisible, 'Address modal opened successfully');

    // Check districts select options count
    const districtCount = await evaluate(`
      const sel = document.querySelector('select');
      sel ? sel.options.length : 0
    `);
    assert(districtCount >= 64, `District dropdown contains ${districtCount} options (all 64 districts)`);
    await captureScreenshot('customer_dashboard_addresses_modal_desktop_1440x900.png');

    // Close modal
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Cancel'));
      if (btn) btn.click();
    `);
    await sleep(400);

    // Navigate to "Profile Information" tab
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Profile Information'));
      if (btn) btn.click();
    `);
    await sleep(600);
    const profileTabHeader = await evaluate('document.body.innerText.includes("Profile Information")');
    assert(profileTabHeader, 'Profile Information tab rendered');
    await captureScreenshot('customer_dashboard_profile_desktop_1440x900.png');

    // Navigate to "Wishlist" tab
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Wishlist'));
      if (btn) btn.click();
    `);
    await sleep(600);
    const wishlistTabHeader = await evaluate('document.body.innerText.includes("My Wishlist")');
    assert(wishlistTabHeader, 'Wishlist tab rendered');
    await captureScreenshot('customer_dashboard_wishlist_desktop_1440x900.png');

    // Navigate to "Security & Login" tab
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Security'));
      if (btn) btn.click();
    `);
    await sleep(600);
    const securityTabHeader = await evaluate('document.body.innerText.includes("Security & Login Methods")');
    assert(securityTabHeader, 'Security tab rendered');
    const deferredAppleMention = await evaluate('document.body.innerText.includes("Apple Sign-In is deferred") || document.body.innerText.includes("Not Configured")');
    assert(deferredAppleMention, 'Apple Sign-In explicitly designated as deferred / not configured');
    await captureScreenshot('customer_dashboard_security_desktop_1440x900.png');

    // 2. Mobile Test (390x844)
    console.log('\n  Mobile Viewport (390x844):');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Overview'));
      if (btn) btn.click();
    `);
    await sleep(800);
    await captureScreenshot('customer_dashboard_overview_mobile_390x844.png');

    // Mobile Orders tab
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Orders'));
      if (btn) btn.click();
    `);
    await sleep(800);
    await captureScreenshot('customer_dashboard_orders_mobile_390x844.png');

    // Mobile Profile tab
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Profile'));
      if (btn) btn.click();
    `);
    await sleep(800);
    await captureScreenshot('customer_dashboard_profile_mobile_390x844.png');

    ws.close();
  } finally {
    edgeProc.kill('SIGTERM');
  }
}

async function main() {
  try {
    const { authCookie } = await runApiTests();
    await runBrowserTests(authCookie);

    console.log(`\n========================================`);
    console.log(`Total Customer Dashboard Tests Passed: ${testPassed}`);
    console.log(`Total Customer Dashboard Tests Failed: ${testFailed}`);
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
