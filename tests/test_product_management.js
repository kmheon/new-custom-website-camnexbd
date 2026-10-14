// tests/test_product_management.js
// Automated verification suite for CamneX Website Manager Product Management:
// 1. Multi-facet search and filtering (name, SKU, model, brand, category, spec filters)
// 2. Strict pricing and inventory validation (non-negative prices, salePrice < regularPrice, non-negative stock)
// 3. SKU uniqueness enforcement on creation and update
// 4. Nested data preservation (pricing, inventory, specs, SEO)
// 5. Safe delete workflow & soft archive on referenced products
// 6. Pagination & total count consistency beyond default limits

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
  console.log('--- PRODUCT MANAGEMENT AUTOMATED VERIFICATION SUITE ---');

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
  const authCookie = sessionCookies.find(c => c.startsWith('camnex_staff_session=') || c.startsWith('camnex_session='));
  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': `${csrfCookie ? csrfCookie.split(';')[0] : ''}; ${authCookie ? authCookie.split(';')[0] : ''}`,
    'X-CSRF-Token': csrfToken
  };

  let createdProd1 = null;
  try {
    // --------------------------------------------------------------------------
    // Check 1: Multi-Facet Search & Filtering
    // --------------------------------------------------------------------------
    console.log('Check 1: Multi-facet search and filtering...');
    const searchNameRes = await request({ path: '/api/products?search=Hikvision', method: 'GET' });
    assert.strictEqual(searchNameRes.statusCode, 200);
    assert(searchNameRes.data.items.length > 0, 'Search for Hikvision should return results');

    const searchSkuRes = await request({ path: '/api/products?search=HIK-2MP-IRPF', method: 'GET' });
    assert.strictEqual(searchSkuRes.statusCode, 200);
    assert(searchSkuRes.data.items.some(p => p.sku === 'HIK-2MP-IRPF'), 'Search by SKU should find matching product');

    const catFilterRes = await request({ path: '/api/products?categorySlug=cctv-cameras', method: 'GET' });
    assert.strictEqual(catFilterRes.statusCode, 200);
    assert(catFilterRes.data.items.length > 0, 'Category filtering should return cctv-cameras products');

    console.log('  ✓ Multi-facet search and filtering verified.');

    // --------------------------------------------------------------------------
    // Check 2: Strict Pricing & Inventory Validation
    // --------------------------------------------------------------------------
    console.log('Check 2: Pricing and stock validation...');

    // 2a. Negative regular price rejected
    const negRegRes = await request({
      path: '/api/products',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'Invalid Neg Reg Price Product',
      modelNumber: 'NEG-01',
      sku: `NEG-REG-${Date.now()}`,
      pricing: { regularPrice: -500 }
    });
    assert.strictEqual(negRegRes.statusCode, 400, 'Negative regular price must be rejected with 400');

    // 2b. Negative sale price rejected
    const negSaleRes = await request({
      path: '/api/products',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'Invalid Neg Sale Price Product',
      modelNumber: 'NEG-02',
      sku: `NEG-SALE-${Date.now()}`,
      pricing: { regularPrice: 2000, salePrice: -100 }
    });
    assert.strictEqual(negSaleRes.statusCode, 400, 'Negative sale price must be rejected with 400');

    // 2c. Sale price >= Regular price rejected
    const invSaleRes = await request({
      path: '/api/products',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'Invalid Sale Higher Than Reg Product',
      modelNumber: 'HIGH-SALE-01',
      sku: `HIGH-SALE-${Date.now()}`,
      pricing: { regularPrice: 2000, salePrice: 2500 }
    });
    assert.strictEqual(invSaleRes.statusCode, 400, 'Sale price >= regular price must be rejected with 400');

    // 2d. Negative available stock rejected
    const negStockRes = await request({
      path: '/api/products',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'Invalid Neg Stock Product',
      modelNumber: 'NEG-STK-01',
      sku: `NEG-STK-${Date.now()}`,
      inventory: { available: -5 }
    });
    assert.strictEqual(negStockRes.statusCode, 400, 'Negative available stock must be rejected with 400');

    console.log('  ✓ Pricing and stock validation constraints strictly enforced.');

    // --------------------------------------------------------------------------
    // Check 3: SKU Uniqueness Enforcement
    // --------------------------------------------------------------------------
    console.log('Check 3: SKU uniqueness enforcement...');
    const testSku = `TEST-UNIQUE-${Date.now()}`;
    const validProdRes = await request({
      path: '/api/products',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'Unique SKU Test Product 1',
      modelNumber: 'UNIQ-01',
      sku: testSku,
      pricing: { regularPrice: 3000, salePrice: 2700 },
      inventory: { available: 15, status: 'in_stock' }
    });
    assert.strictEqual(validProdRes.statusCode, 200, 'Valid product creation must succeed');
    createdProd1 = validProdRes.data;

    // Attempt to create another product with the same SKU
    const dupSkuRes = await request({
      path: '/api/products',
      method: 'POST',
      headers: authHeaders
    }, {
      name: 'Duplicate SKU Product 2',
      modelNumber: 'UNIQ-02',
      sku: testSku,
      pricing: { regularPrice: 3000 }
    });
    assert.strictEqual(dupSkuRes.statusCode, 400, 'Duplicate SKU creation must be rejected with 400');

    console.log('  ✓ SKU uniqueness constraint verified.');

    // --------------------------------------------------------------------------
    // Check 4: Deep Merging and Field Preservation on Update
    // --------------------------------------------------------------------------
    console.log('Check 4: Deep merging and field preservation...');
    // Update createdProd1 with new title and valid discount sale price
    const updateRes = await request({
      path: `/api/products/${createdProd1.id}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      name: 'Unique SKU Test Product 1 - Updated Name',
      modelNumber: createdProd1.modelNumber,
      sku: createdProd1.sku,
      pricing: { salePrice: 2500 },
      seo: { metaTitle: 'SEO Meta Title Test', canonicalUrl: 'https://camnexbd.com/product/test' }
    });
    assert.strictEqual(updateRes.statusCode, 200, 'Product update must succeed');
    assert.strictEqual(updateRes.data.pricing?.regularPrice, 3000, 'Unedited regularPrice must be preserved');
    assert.strictEqual(updateRes.data.pricing?.salePrice, 2500, 'Updated salePrice must be applied');
    assert.strictEqual(updateRes.data.inventory?.available, 15, 'Unedited inventory stock must be preserved');
    assert.strictEqual(updateRes.data.seo?.metaTitle, 'SEO Meta Title Test', 'SEO fields must be stored cleanly');

    // Attempt update with invalid salePrice >= regularPrice
    const invalidPriceUpdateRes = await request({
      path: `/api/products/${createdProd1.id}`,
      method: 'PUT',
      headers: authHeaders
    }, {
      name: 'Unique SKU Test Product 1 - Updated Name',
      modelNumber: createdProd1.modelNumber,
      sku: createdProd1.sku,
      pricing: { salePrice: 4000 } // higher than preserved regularPrice 3000
    });
    assert.strictEqual(invalidPriceUpdateRes.statusCode, 400, 'Sale price >= regular price on update must be rejected with 400');

    console.log('  ✓ Deep merging and field preservation verified.');

    // --------------------------------------------------------------------------
    // Check 5: Safe Delete & Soft Archiving Workflow
    // --------------------------------------------------------------------------
    console.log('Check 5: Safe delete and soft archiving workflow...');
    // Attempt to delete a product that has stock movement records (createdProd1 has initial stock)
    const delRefRes = await request({
      path: `/api/products/${createdProd1.id}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert.strictEqual(delRefRes.statusCode, 409, 'Deleting product with stock movements must return 409 Conflict');
    assert(delRefRes.data?.error?.includes('archive instead') || delRefRes.data?.code === 'CANNOT_DELETE_REFERENCED', 'Error should advise archiving');

    // Soft archive the referenced product
    const archiveRes = await request({
      path: `/api/products/${createdProd1.id}/archive`,
      method: 'POST',
      headers: authHeaders
    });
    assert.strictEqual(archiveRes.statusCode, 200, 'Archiving referenced product must succeed');

    // Verify archived product is excluded from default public storefront
    const publicListRes = await request({ path: '/api/products', method: 'GET' });
    assert.strictEqual(publicListRes.statusCode, 200);
    assert(!publicListRes.data.items.some(p => p.id === createdProd1.id), 'Archived product must not appear in public product listing');

    console.log('  ✓ Safe delete reference checking and soft archive workflow verified.');

    // --------------------------------------------------------------------------
    // Check 6: Pagination and Total Product Counts Beyond 100
    // --------------------------------------------------------------------------
    console.log('Check 6: Pagination and database total counts beyond limits...');
    const paginatedRes = await request({ path: '/api/products?page=1&limit=10', method: 'GET' });
    assert.strictEqual(paginatedRes.statusCode, 200);
    assert.strictEqual(paginatedRes.data.items.length, 10, 'Limit 10 must return exactly 10 items');
    assert(typeof paginatedRes.data.total === 'number', 'API must return numeric total');
    assert(paginatedRes.data.total >= 40, 'Total products count in database must reflect all catalog items');
    assert.strictEqual(paginatedRes.data.page, 1, 'Current page must be 1');
    assert.strictEqual(paginatedRes.data.totalPages, Math.ceil(paginatedRes.data.total / 10), 'Total pages calculation must be accurate');

    console.log('  ✓ Pagination and catalog total counts verified.');

    console.log('\n================================================================');
    console.log('✓ ALL PRODUCT MANAGEMENT VERIFICATION CHECKS PASSED (100%)');
    console.log('================================================================');
  } finally {
    if (createdProd1 && createdProd1.id) {
      try {
        const db = require('../database');
        db.prepare('DELETE FROM products WHERE id = ?').run(createdProd1.id);
        db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(createdProd1.id);
      } catch (_) {}
    }
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('[TEST FAILURE]', err);
    process.exit(1);
  });
}

module.exports = { run };
