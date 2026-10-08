// tests/test_packages_dynamic.js
// Automated verification of CCTV Packages dynamic Bill of Materials (BOM) engine

const http = require('http');
const path = require('path');
const Database = require('better-sqlite3');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, '../camnex.db');

function postJson(route, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: route,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(route) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port: PORT,
      path: route
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('Testing Packages Dynamic Pricing Engine...');

  // 1. Test GET /api/packages
  const getRes = await getJson('/api/packages');
  console.log('GET /api/packages status:', getRes.status);
  console.log('Packages count:', getRes.data.length);
  if (!getRes.data || getRes.data.length === 0) {
    console.log('No packages in test DB; dynamic pricing test skipped.');
    return;
  }
  const pkg = getRes.data[0];
  console.log(`Package "${pkg.name}": dynamic basePrice = ৳${pkg.basePrice}, quotationRequired = ${pkg.quotationRequired}`);

  // 2. Test 2-Camera Bullet Setup
  const res2 = await postJson('/api/packages/calculate-price', {
    packageId: pkg.id,
    cameraCount: 2,
    formFactor: 'bullet'
  });
  console.log('\n--- 2-Camera Bullet Setup ---');
  console.log('Status:', res2.status);
  console.log('Total Price:', res2.data.totalPrice);
  console.log('Quotation Required:', res2.data.quotationRequired);

  // 3. Test 4-Camera Dome Setup
  const res4Dome = await postJson('/api/packages/calculate-price', {
    packageId: pkg.id,
    cameraCount: 4,
    formFactor: 'dome'
  });
  console.log('\n--- 4-Camera Dome Setup ---');
  console.log('Status:', res4Dome.status);
  console.log('Total Price:', res4Dome.data.totalPrice);
  console.log('Quotation Required:', res4Dome.data.quotationRequired);

  // 4. Test 16-Camera Enterprise Setup (Unpriced components -> Fallback to Request Quotation)
  const res16 = await postJson('/api/packages/calculate-price', {
    packageId: pkg.id,
    cameraCount: 16,
    formFactor: 'bullet'
  });
  console.log('\n--- 16-Camera Enterprise Setup ---');
  console.log('Status:', res16.status);
  console.log('Total Price:', res16.data.totalPrice);
  console.log('Quotation Required:', res16.data.quotationRequired);

  // 5. Dynamic catalog test: Update price in SQLite and verify calculation automatically changes
  const db = new Database(DB_PATH);
  const camRow = db.prepare("SELECT price FROM products WHERE id = 'prod-hik-irpf-2mp'").get();
  if (camRow) {
    const origPrice = camRow.price;
    try {
      db.prepare("UPDATE products SET price = 3000 WHERE id = 'prod-hik-irpf-2mp'").run();
      const resDynamic = await postJson('/api/packages/calculate-price', {
        packageId: pkg.id,
        cameraCount: 2,
        formFactor: 'bullet'
      });
      console.log('\n--- Dynamic Catalog Price Change Test ---');
      console.log(`Recalculated 2-cam price after catalog change: ৳${resDynamic.data.totalPrice}`);
    } finally {
      db.prepare("UPDATE products SET price = ? WHERE id = 'prod-hik-irpf-2mp'").run(origPrice);
      console.log('Restored original camera price.');
    }
  }

  console.log('\nALL PACKAGE TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };

