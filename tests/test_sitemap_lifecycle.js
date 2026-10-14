// tests/test_sitemap_lifecycle.js
// Automated verification that:
// 1. /sitemap.xml is served dynamically with no static file shadowing it.
// 2. Newly published product appears in /sitemap.xml.
// 3. Archived product does NOT appear in /sitemap.xml.
// 4. Restored product reappears in /sitemap.xml.

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@camnexbd.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CamneX@Admin2026!';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      ...options
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          data: parsed
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
  console.log('Testing Sitemap Dynamic Lifecycle & Archive Exclusion...');

  // 1. Verify no static public/sitemap.xml file exists on disk
  const staticSitemapPath = path.join(__dirname, '../public/sitemap.xml');
  assert(!fs.existsSync(staticSitemapPath), 'public/sitemap.xml must NOT exist as a static file on disk');
  console.log('[PASS] Verified zero static public/sitemap.xml shadowing dynamic route');

  // 2. Fetch dynamic sitemap
  const sitemapRes = await request({ path: '/sitemap.xml', method: 'GET' });
  assert.strictEqual(sitemapRes.statusCode, 200, 'Sitemap route must return 200');
  const contentType = sitemapRes.headers['content-type'] || '';
  assert(contentType.includes('xml'), `Expected XML content type, got: ${contentType}`);
  assert(sitemapRes.body.includes('<urlset'), 'Sitemap must contain <urlset>');
  console.log('[PASS] /sitemap.xml served dynamically with XML headers and valid structure');

  // 3. Obtain CSRF token & Admin Login
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

  // 4. Create a newly published product
  const testProdId = `prod-sitemap-test-${Date.now()}`;
  const createRes = await request({
    path: '/api/products',
    method: 'POST',
    headers: authHeaders
  }, {
    id: testProdId,
    name: 'Dynamic Sitemap Test Camera',
    modelNumber: 'TEST-SITEMAP-CAM-01',
    sku: `SKU-SITEMAP-${Date.now()}`,
    brandId: 'brand-hikvision',
    brand: 'Hikvision',
    categoryId: 'cat-cctv',
    category: 'CCTV Cameras',
    categorySlug: 'cctv-cameras',
    status: 'active',
    pricing: { regularPrice: 4500, salePrice: 4200 },
    inventory: { stock: 15, trackQuantity: true }
  });
  assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Failed creating test product: ${createRes.body}`);
  console.log(`[PASS] Created active product: ${testProdId}`);

  // 5. Verify the newly published product appears in /sitemap.xml
  const sitemapWithProdRes = await request({ path: '/sitemap.xml', method: 'GET' });
  assert(sitemapWithProdRes.body.includes(`/product/${testProdId}`), `Newly published product ${testProdId} MUST appear in /sitemap.xml`);
  console.log('[PASS] Newly published product appears in /sitemap.xml');

  // 6. Archive the product
  const archiveRes = await request({
    path: `/api/products/${testProdId}/archive`,
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(archiveRes.statusCode, 200, 'Archiving product failed');
  console.log(`[PASS] Archived product: ${testProdId}`);

  // 7. Verify the archived product is excluded from /sitemap.xml
  const sitemapArchivedRes = await request({ path: '/sitemap.xml', method: 'GET' });
  assert(!sitemapArchivedRes.body.includes(`/product/${testProdId}`), `Archived product ${testProdId} MUST NOT appear in /sitemap.xml`);
  console.log('[PASS] Archived product is excluded from /sitemap.xml');

  // 8. Restore the product
  const restoreRes = await request({
    path: `/api/products/${testProdId}/restore`,
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(restoreRes.statusCode, 200, 'Restoring product failed');
  console.log(`[PASS] Restored product: ${testProdId}`);

  // 9. Verify restored product appears again in /sitemap.xml
  const sitemapRestoredRes = await request({ path: '/sitemap.xml', method: 'GET' });
  assert(sitemapRestoredRes.body.includes(`/product/${testProdId}`), `Restored product ${testProdId} MUST appear in /sitemap.xml`);
  console.log('[PASS] Restored product reappears in /sitemap.xml');

  // 10. Clean up test product
  const delRes = await request({
    path: `/api/products/${testProdId}`,
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delRes.statusCode, 200, 'Deleting test product failed');
  console.log(`[PASS] Cleaned up test product: ${testProdId}`);

  // Confirm static file was not generated during operations
  assert(!fs.existsSync(staticSitemapPath), 'No static file should be written to public/sitemap.xml');
  console.log('[PASS] Confirmed zero static sitemap files created on disk');

  console.log('\nALL SITEMAP LIFECYCLE TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Sitemap lifecycle test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
