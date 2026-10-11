/**
 * Ownership, Deletion, and Archiving Test Suite (platform item 3)
 * - Products, categories, brands, services, customers referenced cannot be hard deleted (409 Conflict).
 * - Unreferenced items can be hard deleted (200) and log audit.
 * - Archiving (is_archived=1) hides from storefront listings, restores (is_archived=0) bring back.
 * - Media cannot be deleted if in use (409 Conflict).
 * - Stock changes require inventory.adjust and record stock_movements.
 */

const crypto = require('crypto');
const Database = require('better-sqlite3');

const BASE = process.env.TEST_BASE_URL || `http://127.0.0.1:${process.env.TEST_PORT || 3099}`;
const DB_PATH = process.env.DB_PATH;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`[PASS] ${name}`); }
  else { failed++; console.log(`[FAIL] ${name} ${detail}`); }
}

async function call(method, path, { token, cookies, body } = {}) {
  const csrf = 'csrf-' + (token || 'x');
  const cookieParts = [];
  if (token) cookieParts.push(`camnex_session=${token}`, `camnex_admin_session=${token}`, `camnex_staff_session=${token}`);
  if (cookies) cookieParts.push(...cookies);
  if (token || cookies) cookieParts.push(`camnex_csrf=${csrf}`);
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieParts.length ? { Cookie: cookieParts.join('; ') } : {}),
      ...(cookieParts.length ? { 'X-CSRF-Token': csrf } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

function sessionFor(db, userId) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare(`INSERT INTO sessions (id, user_id, role, email, name, app, expires_at) VALUES (?, ?, ?, ?, ?, 'staff', datetime('now', '+1 hour'))`)
    .run(token, u.id, u.role, u.email, u.name);
  return token;
}

(async () => {
  console.log('--- OWNERSHIP & DELETION RULES TEST SUITE ---');
  const db = new Database(DB_PATH);

  const adminRow = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(ADMIN_EMAIL);
  const adminToken = sessionFor(db, adminRow.id);

  // 1. PRODUCT DELETION & ARCHIVING
  // Product with initial stock creates stock movement, so it cannot be hard deleted
  const stockProdId = 'prod-del-stock-' + Date.now();
  const c1 = await call('POST', '/api/products', {
    token: adminToken,
    body: { id: stockProdId, name: 'Stock Movement Camera', modelNumber: 'STOCK-1', sku: 'SKU-' + Date.now(), inventory: { available: 5 } }
  });
  check('Create product with initial stock', c1.status === 200);

  // Initial stock movement was created
  const initMov = db.prepare('SELECT * FROM stock_movements WHERE product_id = ?').get(stockProdId);
  check('Initial stock recorded in stock_movements', !!initMov && initMov.quantity_change === 5);

  // Product with stock movements cannot be hard deleted (409)
  const dStock = await call('DELETE', `/api/products/${stockProdId}`, { token: adminToken });
  check('Product with stock movements hard delete rejected with 409 Conflict', dStock.status === 409 && dStock.json?.code === 'CANNOT_DELETE_REFERENCED');

  // Truly unreferenced product (0 stock, no orders/quotes/packages/movements)
  const unrefProdId = 'prod-del-unref-' + Date.now();
  await call('POST', '/api/products', {
    token: adminToken,
    body: { id: unrefProdId, name: 'Unreferenced Camera', modelNumber: 'UNREF-1', sku: 'SKU-UNREF-' + Date.now(), inventory: { available: 0 } }
  });
  const d1 = await call('DELETE', `/api/products/${unrefProdId}`, { token: adminToken });
  check('Unreferenced product hard delete succeeds (200)', d1.status === 200, `status ${d1.status}`);

  // Create a referenced product (referenced by an order)
  const refProdId = 'prod-del-ref-' + Date.now();
  await call('POST', '/api/products', {
    token: adminToken,
    body: { id: refProdId, name: 'Referenced Camera', modelNumber: 'REF-1', sku: 'SKU-REF-' + Date.now() }
  });
  // Insert order referencing this product
  const ordId = 'ord-test-ref-' + Date.now();
  db.prepare(`
    INSERT INTO orders (id, order_number, customer_name, customer_phone, total_amount, data_json)
    VALUES (?, ?, 'Test Cust', '01700000001', 5000, ?)
  `).run(ordId, 'ORD-REF-1', JSON.stringify({ id: ordId, items: [{ id: refProdId, name: 'Referenced Camera' }] }));

  // Attempting hard delete on referenced product returns 409
  const d2 = await call('DELETE', `/api/products/${refProdId}`, { token: adminToken });
  check('Referenced product hard delete rejected with 409 Conflict', d2.status === 409 && d2.json?.code === 'CANNOT_DELETE_REFERENCED', `status ${d2.status}`);

  // Archive the product
  const a1 = await call('POST', `/api/products/${refProdId}/archive`, { token: adminToken });
  check('Archive referenced product succeeds (200)', a1.status === 200, `status ${a1.status}`);

  // Check excluded from public listings
  const publicList = await call('GET', '/api/products?limit=200');
  const foundInPublic = (publicList.json?.items || []).some(p => p.id === refProdId);
  check('Archived product excluded from public listing', !foundInPublic);

  // Check included with includeArchived=true
  const adminList = await call('GET', '/api/products?includeArchived=true&limit=200', { token: adminToken });
  const foundInAdmin = (adminList.json?.items || []).find(p => p.id === refProdId);
  check('Archived product visible when includeArchived=true with isArchived=true', foundInAdmin && foundInAdmin.isArchived === true);

  // Restore the product
  const r1 = await call('POST', `/api/products/${refProdId}/restore`, { token: adminToken });
  check('Restore archived product succeeds (200)', r1.status === 200, `status ${r1.status}`);
  const afterRestore = await call('GET', '/api/products?limit=200');
  check('Restored product visible in public listing', (afterRestore.json?.items || []).some(p => p.id === refProdId));

  // 2. CATEGORY DELETION & ARCHIVING
  const catId = 'cat-del-test-' + Date.now();
  await call('POST', '/api/categories', {
    token: adminToken,
    body: { id: catId, name: 'Referenced Category', slug: 'ref-category-' + Date.now() }
  });
  // Assign product to category
  db.prepare(`UPDATE products SET category_id = ? WHERE id = ?`).run(catId, refProdId);

  const catDelBlocked = await call('DELETE', `/api/categories/${catId}`, { token: adminToken });
  check('Referenced category hard delete returns 409 Conflict', catDelBlocked.status === 409 && catDelBlocked.json?.code === 'CANNOT_DELETE_REFERENCED');

  const catArch = await call('POST', `/api/categories/${catId}/archive`, { token: adminToken });
  check('Archive category succeeds', catArch.status === 200);
  const catRest = await call('POST', `/api/categories/${catId}/restore`, { token: adminToken });
  check('Restore category succeeds', catRest.status === 200);

  // 3. BRAND DELETION & ARCHIVING
  const brandId = 'b-del-test-' + Date.now();
  await call('POST', '/api/brands', {
    token: adminToken,
    body: { id: brandId, name: 'Referenced Brand', slug: 'ref-brand-' + Date.now() }
  });
  db.prepare(`UPDATE products SET brand_id = ? WHERE id = ?`).run(brandId, refProdId);

  const brandDelBlocked = await call('DELETE', `/api/brands/${brandId}`, { token: adminToken });
  check('Referenced brand hard delete returns 409 Conflict', brandDelBlocked.status === 409 && brandDelBlocked.json?.code === 'CANNOT_DELETE_REFERENCED');

  const brandArch = await call('POST', `/api/brands/${brandId}/archive`, { token: adminToken });
  check('Archive brand succeeds', brandArch.status === 200);
  const brandRest = await call('POST', `/api/brands/${brandId}/restore`, { token: adminToken });
  check('Restore brand succeeds', brandRest.status === 200);

  // 4. SERVICE DELETION & ARCHIVING
  const srvId = 'srv-del-test-' + Date.now();
  await call('POST', '/api/admin/services', {
    token: adminToken,
    body: { id: srvId, title: 'Referenced Service Maintenance', shortLabel: 'Ref Maintenance', enabled: true, order: 1 }
  });
  // Insert quote referencing this service
  db.prepare(`
    INSERT INTO quotes (id, reference_number, customer_name, phone, service_type, status, data_json)
    VALUES (?, ?, 'Cust', '01700000002', 'Referenced Service Maintenance', 'pending', ?)
  `).run('qte-ref-' + Date.now(), 'QTE-REF-1', JSON.stringify({ serviceId: srvId }));

  const srvDelBlocked = await call('DELETE', `/api/admin/services/${srvId}`, { token: adminToken });
  check('Referenced service hard delete returns 409 Conflict', srvDelBlocked.status === 409 && srvDelBlocked.json?.code === 'CANNOT_DELETE_REFERENCED');

  const srvArch = await call('POST', `/api/admin/services/${srvId}/archive`, { token: adminToken });
  check('Archive service succeeds', srvArch.status === 200);
  const srvRest = await call('POST', `/api/admin/services/${srvId}/restore`, { token: adminToken });
  check('Restore service succeeds', srvRest.status === 200);

  // 5. CUSTOMER DELETION & ARCHIVING
  const custId = 'cust-del-test-' + Date.now();
  db.prepare(`
    INSERT INTO customers (id, name, phone, email, data_json)
    VALUES (?, 'Referenced Customer', '01799887766', 'ref@cust.com', ?)
  `).run(custId, JSON.stringify({ id: custId, name: 'Referenced Customer', phone: '01799887766' }));
  db.prepare(`
    INSERT INTO orders (id, order_number, customer_name, customer_phone, total_amount, data_json)
    VALUES (?, ?, 'Referenced Customer', '01799887766', 2000, ?)
  `).run('ord-cust-ref-' + Date.now(), 'ORD-CUST-1', JSON.stringify({ customerId: custId }));

  const custDelBlocked = await call('DELETE', `/api/admin/customers/${custId}`, { token: adminToken });
  check('Referenced customer hard delete returns 409 Conflict', custDelBlocked.status === 409 && custDelBlocked.json?.code === 'CANNOT_DELETE_REFERENCED');

  const custArch = await call('POST', `/api/admin/customers/${custId}/archive`, { token: adminToken });
  check('Archive customer succeeds', custArch.status === 200);
  const custRest = await call('POST', `/api/admin/customers/${custId}/restore`, { token: adminToken });
  check('Restore customer succeeds', custRest.status === 200);

  // 6. MEDIA IN-USE DELETION CHECK
  const mediaId = 'med-del-test-' + Date.now();
  const mediaFilename = `in-use-${Date.now()}.png`;
  db.prepare(`
    INSERT INTO media (id, filename, original_name, mime_type, size, url)
    VALUES (?, ?, 'in-use.png', 'image/png', 1000, ?)
  `).run(mediaId, mediaFilename, `/uploads/${mediaFilename}`);

  // Reference in product
  db.prepare(`UPDATE products SET data_json = json_set(data_json, '$.image', ?) WHERE id = ?`).run(`/uploads/${mediaFilename}`, refProdId);

  const mediaDelBlocked = await call('DELETE', `/api/media/${mediaId}`, { token: adminToken });
  check('Media in use deletion rejected with 409 Conflict (MEDIA_IN_USE)', mediaDelBlocked.status === 409 && mediaDelBlocked.json?.code === 'MEDIA_IN_USE');

  // Unreferenced media can be deleted
  const unrefMediaId = 'med-del-unref-' + Date.now();
  db.prepare(`
    INSERT INTO media (id, filename, original_name, mime_type, size, url)
    VALUES (?, 'unref.png', 'unref.png', 'image/png', 500, '/uploads/unref.png')
  `).run(unrefMediaId);
  const mediaDelUnref = await call('DELETE', `/api/media/${unrefMediaId}`, { token: adminToken });
  check('Unreferenced media delete succeeds (200)', mediaDelUnref.status === 200);

  // 7. STOCK ADJUSTMENT PERMISSIONS & MOVEMENTS
  // Create a staff user without inventory.adjust (Content Editor)
  const noInvToken = crypto.randomBytes(24).toString('hex');
  const ceUser = db.prepare('SELECT id, role, email, name FROM users WHERE email = ?').get('ce@rbac.test');
  if (ceUser) {
    db.prepare(`INSERT INTO sessions (id, user_id, role, email, name, app, expires_at) VALUES (?, ?, ?, ?, ?, 'staff', datetime('now', '+1 hour'))`)
      .run(noInvToken, ceUser.id, ceUser.role, ceUser.email, ceUser.name);

    // Get current stock
    const beforeEdit = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(refProdId);
    // Attempt stock edit without inventory.adjust
    const ceEdit = await call('PUT', `/api/products/${refProdId}`, {
      token: noInvToken,
      body: { name: 'Referenced Camera Edited', modelNumber: 'REF-1', sku: 'SKU-REF-1', inventory: { available: 999 } }
    });
    const afterCeEdit = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(refProdId);
    check('User without inventory.adjust cannot change stock quantity', afterCeEdit.stock_quantity === beforeEdit.stock_quantity);
  }

  // Stock edit with inventory.adjust (Admin)
  const movCountBefore = db.prepare('SELECT count(*) as c FROM stock_movements WHERE product_id = ?').get(refProdId).c;
  const adminStockEdit = await call('PUT', `/api/products/${refProdId}`, {
    token: adminToken,
    body: { name: 'Referenced Camera Edited by Admin', modelNumber: 'REF-1', sku: 'SKU-REF-1', inventory: { available: 42 }, stockReason: 'Physical warehouse count' }
  });
  const afterAdminEdit = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(refProdId);
  const movCountAfter = db.prepare('SELECT count(*) as c FROM stock_movements WHERE product_id = ?').get(refProdId).c;
  check('User with inventory.adjust updates stock quantity', afterAdminEdit.stock_quantity === 42);
  check('Stock adjustment records movement in stock_movements', movCountAfter === movCountBefore + 1);

  // 8. AUDIT LOG WRITTEN FOR MUTATIONS
  const auditEntries = db.prepare(`SELECT count(*) as c FROM audit_logs WHERE entity_type IN ('product', 'category', 'brand', 'service', 'customer')`).get().c;
  check('Audit log entries recorded for catalog and entity mutations', auditEntries >= 5, `count ${auditEntries}`);

  console.log(`\nOWNERSHIP & DELETION SUITE: ${passed} passed, ${failed} failed`);
  db.close();
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
