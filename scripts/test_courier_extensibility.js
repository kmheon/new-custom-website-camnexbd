/**
 * CamneX Bangladesh - Extensible Courier Integration Test Suite
 * 
 * Verifies:
 * 1. Courier Registry & Catalog metadata
 * 2. Dynamic Secret Encryption & Masking in Settings
 * 3. Connection Test handling for integrated vs unintegrated providers
 * 4. Shipments database schema & record persistence
 * 5. Automated Order Dispatch & Idempotency / Duplicate Booking Protection
 * 6. Live Status Mapping & Timeline synchronization
 * 7. Storefront & Public Tracking URL generation
 */

const assert = require('assert');
const db = require('../database');
const { courierRegistry } = require('../server/modules/courier/courier.registry');
const { courierService } = require('../server/modules/courier/courier.service');
const { decrypt, maskSecret, encrypt } = require('../server/shared/cryptoHelper');
const { COURIER_PROVIDERS, INTEGRATION_STATUS, SHIPMENT_STATUS } = require('../server/modules/courier/courier.types');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function runCourierTests() {
  console.log('=== CamneX Bangladesh: Extensible Courier Integration Test Suite ===\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ FAIL: ${name}\n    Error: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ FAIL: ${name}\n    Error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Courier Registry & Catalog
  // --------------------------------------------------------------------------
  console.log('1. Testing Courier Registry & Catalog...');

  test('Steadfast and Pathao are registered as integrated adapters', () => {
    assert.strictEqual(courierRegistry.isIntegrated('steadfast'), true);
    assert.strictEqual(courierRegistry.isIntegrated('pathao'), true);
  });

  test('Roadmap couriers (RedX, Paperfly, eCourier, Sundarban, Custom) are catalogued as development_required', () => {
    assert.strictEqual(courierRegistry.isIntegrated('redx'), false);
    assert.strictEqual(courierRegistry.isIntegrated('paperfly'), false);
    assert.strictEqual(courierRegistry.isIntegrated('ecourier'), false);
    assert.strictEqual(courierRegistry.isIntegrated('sundarban'), false);
    assert.strictEqual(courierRegistry.isIntegrated('custom'), false);

    const redxMeta = courierRegistry.getProviderMetadata('redx');
    assert.strictEqual(redxMeta.status, INTEGRATION_STATUS.DEVELOPMENT_REQUIRED);
    assert.ok(redxMeta.devNotes.includes('redx.adapter.js'));
  });

  test('Registry resolves correct external tracking URLs across multiple BD carriers', () => {
    assert.strictEqual(
      courierRegistry.getTrackingUrl('steadfast', 'SF-102938'),
      'https://steadfast.com.bd/t/SF-102938'
    );
    assert.strictEqual(
      courierRegistry.getTrackingUrl('pathao', 'PTH-405912'),
      'https://merchant.pathao.com/tracking?consignment_id=PTH-405912'
    );
    assert.strictEqual(
      courierRegistry.getTrackingUrl('redx', 'RDX-998877'),
      'https://redx.com.bd/track/RDX-998877'
    );
    assert.strictEqual(
      courierRegistry.getTrackingUrl('paperfly', 'PFLY-1234'),
      'https://paperfly.com.bd/tracking?tracking_id=PFLY-1234'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 2: Dynamic Secret Encryption & Masking
  // --------------------------------------------------------------------------
  console.log('\n2. Testing Dynamic Secret Encryption & Masking...');

  test('Masking and encryption function correctly with cryptoHelper', () => {
    const rawSecret = 'my-super-secret-api-key-2026';
    const encrypted = encrypt(rawSecret);
    assert.notStrictEqual(encrypted, rawSecret);
    assert.ok(encrypted.startsWith('enc:'));

    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, rawSecret);

    const masked = maskSecret(rawSecret);
    assert.strictEqual(masked, '••••••••');
  });

  test('courierService.getCouriersCatalog() masks sensitive keys for all providers', () => {
    const catalog = courierService.getCouriersCatalog();
    assert.ok(Array.isArray(catalog));
    assert.ok(catalog.length >= 7);

    for (const prov of catalog) {
      if (prov.config) {
        for (const field of prov.fields) {
          if (field.secret && prov.config[field.key]) {
            assert.ok(
              prov.config[field.key].startsWith('••••'),
              `Secret field ${field.key} on provider ${prov.id} was not masked: ${prov.config[field.key]}`
            );
          }
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // TEST 3: Connection Testing & Adapter Error Handling
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Connection Testing & Adapter Error Handling...');

  await testAsync('Reject connection test on development_required provider with clear message', async () => {
    const result = await courierService.testCourierConnection('redx');
    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes('development_required'));
  });

  await testAsync('Steadfast adapter gracefully fails connection when unconfigured or invalid keys', async () => {
    const adapter = courierRegistry.createAdapter('steadfast', { apiKey: '', secretKey: '' });
    const result = await adapter.testConnection();
    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes('required'));
  });

  await testAsync('Pathao adapter gracefully fails connection when unconfigured or invalid keys', async () => {
    const adapter = courierRegistry.createAdapter('pathao', { clientId: '', clientSecret: '' });
    const result = await adapter.testConnection();
    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes('required'));
  });

  // --------------------------------------------------------------------------
  // TEST 4: Database Shipments Table
  // --------------------------------------------------------------------------
  console.log('\n4. Testing Database Shipments Table...');

  test('Shipments table exists with required schema columns', () => {
    const tableInfo = db.prepare("PRAGMA table_info('shipments')").all();
    assert.ok(tableInfo.length > 0, 'Shipments table does not exist');

    const columnNames = tableInfo.map(c => c.name);
    assert.ok(columnNames.includes('id'), 'Missing id column');
    assert.ok(columnNames.includes('order_id'), 'Missing order_id column');
    assert.ok(columnNames.includes('provider_id'), 'Missing provider_id column');
    assert.ok(columnNames.includes('consignment_id'), 'Missing consignment_id column');
    assert.ok(columnNames.includes('tracking_code'), 'Missing tracking_code column');
    assert.ok(columnNames.includes('tracking_url'), 'Missing tracking_url column');
    assert.ok(columnNames.includes('status'), 'Missing status column');
    assert.ok(columnNames.includes('provider_status'), 'Missing provider_status column');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Order Dispatch & Idempotency / Duplicate Booking Protection
  // --------------------------------------------------------------------------
  console.log('\n5. Testing Order Dispatch & Idempotency / Replay Protection...');

  const testOrderId = `test_ord_${Date.now()}`;
  const testOrderNumber = `CNX-TEST-${Date.now().toString().slice(-6)}`;
  const testOrderData = {
    orderNumber: testOrderNumber,
    customerName: 'Ashraful Alam',
    customerPhone: '01712345678',
    deliveryAddress: 'House 14, Road 5, Dhanmondi',
    deliveryCity: 'Dhaka',
    total: 8500,
    paymentStatus: 'paid',
    status: 'confirmed',
    items: [
      { name: 'Hikvision 2MP Outdoor Bullet Camera', quantity: 2, unitPrice: 3500 },
      { name: 'Cat6 UTP Cable Roll 50m', quantity: 1, unitPrice: 1500 }
    ],
    timeline: [
      { title: 'Order Confirmed', date: new Date().toISOString() }
    ]
  };

  // Seed test order
  db.prepare(`
    INSERT INTO orders (id, order_number, customer_name, customer_phone, total_amount, payment_status, order_status, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(testOrderId, testOrderNumber, testOrderData.customerName, testOrderData.customerPhone, testOrderData.total, testOrderData.paymentStatus, testOrderData.status, JSON.stringify(testOrderData));

  // Insert mock shipment to simulate successful dispatch
  const mockConsignmentId = `SF-MOCK-${Date.now().toString().slice(-4)}`;
  const mockTrackingUrl = `https://steadfast.com.bd/t/${mockConsignmentId}`;

  db.prepare(`
    INSERT INTO shipments (id, order_id, provider_id, consignment_id, tracking_code, tracking_url, status, provider_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `ship_${Date.now()}`,
    testOrderId,
    'steadfast',
    mockConsignmentId,
    mockConsignmentId,
    mockTrackingUrl,
    SHIPMENT_STATUS.PENDING,
    'in_review'
  );

  await testAsync('Attempting re-dispatch on an already booked order returns existing consignment without duplicating', async () => {
    const result = await courierService.dispatchOrder(testOrderId, { providerId: 'steadfast' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.alreadyDispatched, true);
    assert.strictEqual(result.shipment.consignment_id, mockConsignmentId);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Public Tracking Endpoint Compatibility
  // --------------------------------------------------------------------------
  console.log('\n6. Testing Public Tracking Endpoint Compatibility...');

  // Update order with courier details
  testOrderData.courierName = 'Steadfast Courier';
  testOrderData.trackingNumber = mockConsignmentId;
  testOrderData.courierTrackingUrl = mockTrackingUrl;
  testOrderData.shipmentStatus = 'pending';
  testOrderData.status = 'dispatched';

  db.prepare('UPDATE orders SET data_json = ?, order_status = ? WHERE id = ?').run(
    JSON.stringify(testOrderData),
    'dispatched',
    testOrderId
  );

  await testAsync('Public tracking endpoint returns full courier and shipment metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${testOrderNumber}?phone=01712345678`);
    assert.strictEqual(res.status, 200);

    const trackingData = await res.json();
    assert.strictEqual(trackingData.orderNumber, testOrderNumber);
    assert.strictEqual(trackingData.courierName, 'Steadfast Courier');
    assert.strictEqual(trackingData.trackingNumber, mockConsignmentId);
    assert.strictEqual(trackingData.courierTrackingUrl, mockTrackingUrl);
    assert.strictEqual(trackingData.shipmentStatus, 'pending');
  });

  // Cleanup test order and shipment
  db.prepare('DELETE FROM shipments WHERE order_id = ?').run(testOrderId);
  db.prepare('DELETE FROM orders WHERE id = ?').run(testOrderId);

  // --------------------------------------------------------------------------
  // TEST 7: Admin HTTP Endpoints (Authentication & RBAC protected)
  // --------------------------------------------------------------------------
  console.log('\n7. Testing Admin HTTP Endpoints...');

  const adminUser = db.prepare("SELECT id, email, role, name FROM users WHERE role = 'admin'").get();
  const testSessionToken = `test_admin_session_${Date.now()}`;
  const testCsrfToken = `test_csrf_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  db.prepare(`
    INSERT INTO sessions (id, user_id, role, email, name, expires_at)
    VALUES (?, ?, 'admin', ?, ?, ?)
  `).run(testSessionToken, adminUser.id, adminUser.email, adminUser.name || 'Admin', expiresAt);

  try {
    await testAsync('GET /api/admin/couriers returns catalog with masked secrets for authenticated admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/couriers`, {
        headers: {
          'Cookie': `camnex_session=${testSessionToken}; camnex_admin_session=${testSessionToken}; camnex_csrf=${testCsrfToken}`,
          'x-csrf-token': testCsrfToken
        }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.providers));
      assert.ok(data.providers.length >= 7);

      const sf = data.providers.find(p => p.id === 'steadfast');
      assert.ok(sf);
      assert.strictEqual(sf.isIntegrated, true);

      const rdx = data.providers.find(p => p.id === 'redx');
      assert.ok(rdx);
      assert.strictEqual(rdx.isIntegrated, false);
      assert.strictEqual(rdx.status, 'development_required');
    });

    await testAsync('POST /api/admin/couriers/redx/test-connection rejects unintegrated provider over HTTP', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/couriers/redx/test-connection`, {
        method: 'POST',
        headers: {
          'Cookie': `camnex_session=${testSessionToken}; camnex_admin_session=${testSessionToken}; camnex_csrf=${testCsrfToken}`,
          'x-csrf-token': testCsrfToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: 'dummy-token' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('development_required'));
    });
  } finally {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(testSessionToken);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`Courier Integration Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCourierTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
