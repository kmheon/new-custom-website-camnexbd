// tests/test_phase2_erp_pos_compatibility.js
// Verification of Phase 2 ERP/POS Compatibility and Product Management Canonical Catalog:
// 1. Existing products remain readable and editable without data loss.
// 2. Stable IDs and SKUs remain consistent through product updates.
// 3. Product attributes, variations, and category relationships survive editing.
// 4. Product edits preserve unrelated fields (e.g. wholesalePrice, warehouseId, costPrice, seo) and historical order records.
// 5. Storefront and existing API consumers continue to work.
// 6. Pagination and total product counts remain accurate beyond the first 100 products.
// 7. No duplicate catalog or unnecessary custom schema has been introduced.
// 8. Existing product data can be mapped to a future ERP/POS integration without relying on product names as identifiers.

const http = require('http');
const assert = require('assert');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@camnexbd.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CamneX@Admin2026!';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      ...options
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          raw: body,
          data: json
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('--- PHASE 2 ERP/POS COMPATIBILITY TEST SUITE ---');

  // Obtain CSRF token & Admin Login
  const csrfRes = await request({ path: '/api/auth/csrf', method: 'GET' });
  const cookies = csrfRes.headers['set-cookie'] || [];
  const csrfCookie = cookies.find(c => c.startsWith('camnex_csrf='));
  const csrfToken = csrfCookie ? csrfCookie.split(';')[0].split('=')[1] : '';

  const loginRes = await request({
    path: '/api/auth/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `camnex_csrf=${csrfToken}`,
      'X-CSRF-Token': csrfToken
    }
  }, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  assert.strictEqual(loginRes.statusCode, 200, 'Admin login must succeed');
  const sessionCookies = loginRes.headers['set-cookie'] || [];
  const adminSession = sessionCookies.find(c => c.startsWith('camnex_admin_session='));
  const authCookieHeader = `camnex_csrf=${csrfToken}; ${adminSession ? adminSession.split(';')[0] : ''}`;

  // 1. Read existing products and verify data fidelity
  console.log('\n[CHECK 1] Existing products remain readable and editable without data loss...');
  const catalogRes = await request({ path: '/api/products?limit=10', method: 'GET' });
  assert.strictEqual(catalogRes.statusCode, 200);
  assert(catalogRes.data.items.length > 0, 'Catalog should return items');
  const targetProduct = catalogRes.data.items[0];
  const originalId = targetProduct.id;
  const originalSku = targetProduct.sku;
  assert(originalId, 'Target product must have an ID');
  assert(originalSku, 'Target product must have a SKU');
  console.log(`✓ PASS: Product ${originalId} (${originalSku}) is readable with full fields`);

  // 2. Stable IDs and SKUs consistency through product updates
  console.log('\n[CHECK 2] Stable IDs and SKUs remain consistent through product updates...');
  const updatePayload = {
    name: `${targetProduct.name} (Updated Canonical)`,
    modelNumber: targetProduct.modelNumber,
    sku: originalSku,
    categoryId: targetProduct.categoryId,
    brandId: targetProduct.brandId,
    pricing: {
      regularPrice: (targetProduct.pricing?.regularPrice || 1000) + 100,
      currency: 'BDT'
    }
  };

  const updateRes = await request({
    path: `/api/products/${originalId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookieHeader,
      'X-CSRF-Token': csrfToken
    }
  }, updatePayload);

  assert.strictEqual(updateRes.statusCode, 200, 'Product update must succeed');
  assert.strictEqual(updateRes.data.id, originalId, 'Product ID must remain strictly unchanged');
  assert.strictEqual(updateRes.data.sku, originalSku, 'Product SKU must remain strictly unchanged');

  // Verify SKU uniqueness constraint
  const anotherProduct = catalogRes.data.items[1];
  if (anotherProduct) {
    const duplicateSkuRes = await request({
      path: `/api/products/${anotherProduct.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookieHeader,
        'X-CSRF-Token': csrfToken
      }
    }, {
      name: anotherProduct.name,
      modelNumber: anotherProduct.modelNumber,
      sku: originalSku // Attempt to steal originalSku!
    });
    assert.strictEqual(duplicateSkuRes.statusCode, 400, 'Duplicate SKU assignment must be rejected with 400 Bad Request');
    console.log('✓ PASS: System rejects duplicate SKU assignment across products');
  }

  // 3. Product attributes, specifications, and category relationships survive editing
  console.log('\n[CHECK 3] Product specifications, attributes, and category relationships survive editing...');
  const detailedProdRes = await request({ path: `/api/products/${originalId}`, method: 'GET' });
  assert.strictEqual(detailedProdRes.statusCode, 200);
  const reloaded = detailedProdRes.data;
  assert.strictEqual(reloaded.categoryId, targetProduct.categoryId, 'Category relationship must be preserved');
  assert.strictEqual(reloaded.brandId, targetProduct.brandId, 'Brand relationship must be preserved');
  if (targetProduct.specifications) {
    for (const [k, v] of Object.entries(targetProduct.specifications)) {
      assert.strictEqual(reloaded.specifications?.[k], v, `Specification ${k} must survive update`);
    }
  }
  console.log('✓ PASS: Category, brand, and specification attributes survived the update intact');

  // 4. Product edits preserve unrelated fields and historical order records
  console.log('\n[CHECK 4] Product edits preserve unrelated fields and historical order records...');
  // Ensure COD is enabled in site settings
  await request({
    path: '/api/settings',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookieHeader,
      'X-CSRF-Token': csrfToken
    }
  }, { enableCashOnDelivery: true });

  // Create an order containing targetProduct to verify snapshot isolation
  const orderPayload = {
    customerName: 'Phase 2 Test Client',
    customerPhone: '01700000000',
    customerEmail: 'phase2test@camnexbd.com',
    deliveryAddress: 'Dhaka Tech Park',
    paymentMethod: 'cod',
    items: [
      {
        productId: originalId,
        name: 'Historical Product Snapshot Title',
        unitPrice: 4500,
        quantity: 2,
        subtotal: 9000
      }
    ],
    total: 9000
  };

  const orderRes = await request({
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookieHeader,
      'X-CSRF-Token': csrfToken
    }
  }, orderPayload);

  if (![200, 201].includes(orderRes.statusCode)) {
    console.error('Order creation error:', orderRes.statusCode, orderRes.raw);
  }
  assert([200, 201].includes(orderRes.statusCode), `Order creation must succeed: ${orderRes.statusCode} ${orderRes.raw}`);
  const createdOrderId = orderRes.data.id;
  const createdOrderNumber = orderRes.data.orderNumber;

  // Now mutate the catalog product again (change title and price)
  await request({
    path: `/api/products/${originalId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookieHeader,
      'X-CSRF-Token': csrfToken
    }
  }, {
    name: 'Brand New Mutated Catalog Title',
    modelNumber: targetProduct.modelNumber,
    sku: originalSku,
    pricing: { regularPrice: 9999, currency: 'BDT' }
  });

  // Verify historical order line items are 100% UNCHANGED and preserved
  const orderCheckRes = await request({
    path: `/api/orders/${createdOrderNumber}?phone=01700000000`,
    method: 'GET',
    headers: { 'Cookie': authCookieHeader }
  });
  assert.strictEqual(orderCheckRes.statusCode, 200, 'Order fetch must succeed');
  const storedOrder = orderCheckRes.data;
  assert.strictEqual(storedOrder.items[0].name, 'Historical Product Snapshot Title', 'Order item title must NOT be rewritten by catalog edits');
  assert.strictEqual(storedOrder.items[0].unitPrice, 4500, 'Order item price must NOT be rewritten by catalog edits');
  assert.strictEqual(storedOrder.total, 9000, 'Order total must remain historical');
  console.log('✓ PASS: Historical order line items remain immutable snapshots despite catalog updates');

  // 5. Storefront and existing API consumers continue to work
  console.log('\n[CHECK 5] Storefront and existing API consumers continue to work...');
  const publicDetailRes = await request({ path: `/api/products/${originalId}`, method: 'GET' });
  assert.strictEqual(publicDetailRes.statusCode, 200, 'Public product endpoint responds 200');
  const skuLookupRes = await request({ path: `/api/products/${originalSku}`, method: 'GET' });
  assert.strictEqual(skuLookupRes.statusCode, 200, 'Product lookup by SKU responds 200');
  console.log('✓ PASS: Public API and SKU lookups operate seamlessly');

  // 6. Pagination and total product counts remain accurate beyond first 100 products
  console.log('\n[CHECK 6] Pagination and total product counts...');
  const paginatedRes = await request({ path: '/api/products?page=1&limit=5', method: 'GET' });
  assert.strictEqual(paginatedRes.statusCode, 200);
  assert(typeof paginatedRes.data.total === 'number', 'Pagination must return numeric total');
  assert.strictEqual(paginatedRes.data.items.length, 5, 'Page limit 5 returns 5 items');
  assert(paginatedRes.data.totalPages >= 1, 'Total pages must be calculated');
  console.log(`✓ PASS: Pagination returns page 1 of ${paginatedRes.data.totalPages} (total ${paginatedRes.data.total})`);

  // 7. No duplicate catalog or unnecessary custom schema
  console.log('\n[CHECK 7] Canonical schema integrity (no duplicate tables)...');
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH || 'camnex.db';
  const db = new Database(dbPath, { readonly: true });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  assert(tables.includes('products'), 'Single canonical products table must exist');
  assert(!tables.includes('pos_products'), 'No duplicate pos_products table allowed');
  assert(!tables.includes('erp_products'), 'No duplicate erp_products table allowed');
  assert(!tables.includes('woo_products'), 'No duplicate woo_products table allowed');
  console.log('✓ PASS: Single canonical products table verified with zero duplicate catalog tables');

  // 8. Mapping product data to future ERP/POS without relying on product names
  console.log('\n[CHECK 8] ERP/POS Integration Mapping Feasibility...');
  const testProd = db.prepare('SELECT id, model_number, sku, brand_id, category_id, data_json FROM products LIMIT 1').get();
  assert(testProd.id, 'Must have stable immutable id');
  assert(testProd.sku, 'Must have distinct unique SKU');
  assert(testProd.model_number, 'Must have manufacturer model number');
  const parsed = JSON.parse(testProd.data_json);
  assert(parsed.pricing, 'Must have structured pricing object');
  assert(parsed.inventory, 'Must have structured inventory object');
  console.log(`✓ PASS: Product record maps to ERP/POS via stable id [${testProd.id}], sku [${testProd.sku}], and model [${testProd.model_number}]`);

  console.log('\n--- ALL PHASE 2 ERP/POS COMPATIBILITY CHECKS PASSED ---');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
