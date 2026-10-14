/**
 * RBAC / identity test suite (platform item 2)
 * - allowed + denied cases for every system role
 * - must_change_password enforcement, disabled accounts, lockout
 * - purchase-cost field hiding without pricing.cost.read
 * - separate session cookies per surface
 * - customers can never reach staff/admin endpoints
 */
const crypto = require('crypto');
const Database = require('better-sqlite3');

const BASE = process.env.TEST_BASE_URL || `http://127.0.0.1:${process.env.TEST_PORT || 3099}`;
const DB_PATH = process.env.DB_PATH;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`[PASS] ${name}`); }
  else { failed++; console.log(`[FAIL] ${name} ${detail}`); }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
  return { status: res.status, json, headers: res.headers };
}

function sessionFor(db, userId) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare(`INSERT INTO sessions (id, user_id, role, email, name, app, expires_at) VALUES (?, ?, ?, ?, ?, 'staff', ?)`)
    .run(token, u.id, u.role, u.email, u.name, new Date(Date.now() + 3600e3).toISOString());
  return token;
}

const denied = (r) => r.status === 401 || r.status === 403;

(async () => {
  console.log('--- RBAC & IDENTITY TEST SUITE ---');
  const db = new Database(DB_PATH);

  // Super admin session (admin user is seeded from env, no default password)
  const adminRow = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(ADMIN_EMAIL);
  const adminToken = sessionFor(db, adminRow.id);

  // 1. System roles exist, are flagged system, and cannot be deleted
  const rolesRes = await call('GET', '/api/staff/roles', { token: adminToken });
  const roleNames = (rolesRes.json || []).map(r => r.name);
  for (const n of ['Super Admin', 'Website Manager', 'Content Editor', 'Catalog Manager', 'Sales Staff', 'Support Staff']) {
    check(`System role seeded: ${n}`, roleNames.includes(n));
  }
  const del = await call('DELETE', '/api/staff/roles/role-sales-staff', { token: adminToken });
  check('System role cannot be deleted', del.status === 400, `status ${del.status}`);

  // 2. Create one staff user per role
  const pw = 'RolePass#2026xyz';
  const roles = {
    wm: 'role-website-manager', ce: 'role-content-editor', cm: 'role-catalog-manager',
    sales: 'role-sales-staff', support: 'role-support-staff'
  };
  const users = {};
  for (const [key, roleId] of Object.entries(roles)) {
    const email = `${key}@rbac.test`;
    const r = await call('POST', '/api/staff/users', { token: adminToken, body: { email, name: `RBAC ${key}`, password: pw, roleIds: [roleId] } });
    check(`Create staff user (${key})`, r.status === 200 && r.json && r.json.id, `status ${r.status} ${JSON.stringify(r.json)}`);
    users[key] = r.json && r.json.id;
  }

  // 3. must_change_password: login works, everything else blocked until password changed
  const loginRes = await fetch(BASE + '/api/auth/staff/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@rbac.test', password: pw })
  });
  const loginJson = await loginRes.json();
  const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  const cookieKV = setCookies.map(c => c.split(';')[0]);
  check('Staff login returns staff session cookie (camnex_staff_session)', loginRes.status === 200 && cookieKV.some(c => c.startsWith('camnex_staff_session=')), `status ${loginRes.status}`);
  check('Staff login does not set the customer/admin cookie', !cookieKV.some(c => /^camnex_(session|admin_session)=/.test(c)));
  const csrfKV = cookieKV.find(c => c.startsWith('camnex_csrf='));
  const csrfVal = csrfKV ? csrfKV.split('=')[1] : '';
  const staffCookies = cookieKV;
  const salesCall = async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method, headers: { 'Content-Type': 'application/json', Cookie: staffCookies.join('; '), 'X-CSRF-Token': csrfVal },
      body: body ? JSON.stringify(body) : undefined
    });
    let j = null; try { j = await res.json(); } catch (_) {}
    return { status: res.status, json: j };
  };
  check('Login reports must_change_password', loginJson.user && loginJson.user.must_change_password === true);
  const blocked = await salesCall('GET', '/api/orders');
  check('must_change_password blocks other endpoints server-side', blocked.status === 403 && blocked.json && blocked.json.code === 'PASSWORD_CHANGE_REQUIRED', `status ${blocked.status}`);
  const chg = await salesCall('POST', '/api/staff/change-password', { currentPassword: pw, newPassword: 'NewRolePass#2026abc' });
  check('Password change succeeds', chg.status === 200, `status ${chg.status} ${JSON.stringify(chg.json)}`);
  const afterChg = await salesCall('GET', '/api/orders');
  check('Endpoints usable after password change', afterChg.status === 200, `status ${afterChg.status}`);

  // 4. Session cookie isolation: an admin-surface cookie is not accepted by the staff surface
  const adminOnly = await call('GET', '/api/staff/users', { cookies: [`camnex_admin_session=${adminToken}`] });
  check('Admin-surface cookie rejected on staff endpoints', denied(adminOnly), `status ${adminOnly.status}`);
  const customerCookieOnly = await call('GET', '/api/staff/users', { cookies: [`camnex_session=${adminToken}`] });
  check('Storefront cookie rejected on staff endpoints', denied(customerCookieOnly), `status ${customerCookieOnly.status}`);

  // 5. Role matrix. Allowed means "not 401/403"; denied means 401/403.
  db.prepare('UPDATE users SET must_change_password = 0').run();
  const tokens = { admin: adminToken };
  for (const k of Object.keys(roles)) tokens[k] = sessionFor(db, users[k]);

  const matrix = [
    // [label, method, path, body, roles allowed]
    ['orders.read      GET /api/orders', 'GET', '/api/orders', null, ['admin', 'wm', 'sales', 'support']],
    ['quotes.manage    GET /api/quotes', 'GET', '/api/quotes', null, ['admin', 'wm', 'sales']],
    ['customers.read   GET /api/customers', 'GET', '/api/customers', null, ['admin', 'wm', 'sales', 'support']],
    ['settings.write   PUT /api/settings', 'PUT', '/api/settings', {}, ['admin', 'wm']],
    ['content.write    POST /api/cms/faqs', 'POST', '/api/cms/faqs', {}, ['admin', 'wm', 'ce']],
    ['catalog.write    POST /api/products', 'POST', '/api/products', {}, ['admin', 'wm', 'cm']],
    ['redirects.write  GET /api/admin/redirects', 'GET', '/api/admin/redirects', null, ['admin', 'wm']],
    ['staff.access     GET /api/staff/users', 'GET', '/api/staff/users', null, ['admin', 'cm', 'sales', 'support']],
    ['staff.manage     POST /api/staff/users', 'POST', '/api/staff/users', {}, ['admin']],
    ['roles.manage     POST /api/staff/roles', 'POST', '/api/staff/roles', {}, ['admin']],
    ['audit.read       GET /api/audit-logs', 'GET', '/api/audit-logs', null, ['admin']],
    ['inventory.adjust POST /api/inventory/adjust', 'POST', '/api/inventory/adjust', {}, ['admin']],
    ['inventory.read   GET /api/inventory/movements', 'GET', '/api/inventory/movements', null, ['admin', 'cm']],
  ];
  const actors = ['admin', 'wm', 'ce', 'cm', 'sales', 'support'];
  for (const [label, method, path, body, allowed] of matrix) {
    for (const actor of actors) {
      const r = await call(method, path, { token: tokens[actor], body });
      const shouldAllow = allowed.includes(actor);
      check(`${label} as ${actor}: ${shouldAllow ? 'allowed' : 'denied'}`, shouldAllow ? !denied(r) : denied(r), `status ${r.status}`);
    }
    const anon = await call(method, path, { body });
    check(`${label} as anonymous: denied`, denied(anon), `status ${anon.status}`);
  }

  // 6. Customers can never access /admin or /staff APIs
  const phone = '017' + String(Math.floor(10000000 + Math.random() * 89999999));
  const reg = await fetch(BASE + '/api/auth/customer/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Rbac Customer', phone, password: 'CustomerPass#1' })
  });
  const regCookies = (reg.headers.getSetCookie ? reg.headers.getSetCookie() : []).map(c => c.split(';')[0]);
  for (const path of ['/api/staff/users', '/api/admin/redirects', '/api/orders', '/api/audit-logs', '/api/customers']) {
    const r = await call('GET', path, { cookies: regCookies });
    check(`Customer denied on ${path}`, denied(r), `status ${r.status}`);
  }
  const staffLoginAsCustomer = await fetch(BASE + '/api/auth/staff/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${phone}@x.com`, password: 'CustomerPass#1' })
  });
  check('Customer credentials cannot log in to the staff app', staffLoginAsCustomer.status !== 200, `status ${staffLoginAsCustomer.status}`);

  // 7. Purchase-cost fields hidden without pricing.cost.read
  const prodId = 'prod-rbac-cost-' + Date.now();
  const created = await call('POST', '/api/products', {
    token: adminToken,
    body: { id: prodId, name: 'RBAC Cost Product', modelNumber: 'RBAC-1', sku: 'RBAC-SKU-' + Date.now(), costPrice: 123, pricing: { regularPrice: 500, costPrice: 123 } }
  });
  check('Super admin can create product with cost', created.status === 200, `status ${created.status}`);
  const asAdmin = await call('GET', `/api/products/${prodId}`, { token: tokens.admin });
  const asCm = await call('GET', `/api/products/${prodId}`, { token: tokens.cm });
  const asWm = await call('GET', `/api/products/${prodId}`, { token: tokens.wm });
  const asAnon = await call('GET', `/api/products/${prodId}`);
  check('Cost visible with pricing.cost.read (super admin)', asAdmin.json && asAdmin.json.costPrice === 123);
  check('Cost visible with pricing.cost.read (catalog manager)', asCm.json && asCm.json.costPrice === 123);
  check('Cost hidden for website manager (no pricing.cost.read)', asWm.json && asWm.json.costPrice === undefined && asWm.json.pricing.costPrice === undefined);
  check('Cost hidden for anonymous visitors', asAnon.json && asAnon.json.costPrice === undefined && asAnon.json.pricing.costPrice === undefined);
  const list = await call('GET', '/api/products?limit=200');
  check('Cost hidden in product list for anonymous', JSON.stringify(list.json).indexOf('costPrice') === -1);
  const wmEdit = await call('PUT', `/api/products/${prodId}`, { token: tokens.wm, body: { name: 'RBAC Cost Product v2', modelNumber: 'RBAC-1', sku: created.json.sku } });
  const afterEdit = await call('GET', `/api/products/${prodId}`, { token: tokens.admin });
  check('Editing without cost access does not erase the stored cost', wmEdit.status === 200 && afterEdit.json.costPrice === 123, `status ${wmEdit.status}`);

  // 8. Disabled accounts cannot log in, and existing sessions stop working
  const disable = await call('PUT', `/api/staff/users/${users.support}`, { token: adminToken, body: { status: 'disabled' } });
  check('Admin can disable a staff user', disable.status === 200, `status ${disable.status}`);
  const afterDisable = await call('GET', '/api/orders', { token: tokens.support });
  check('Disabled user\'s existing session is rejected', denied(afterDisable), `status ${afterDisable.status}`);
  const disabledLogin = await fetch(BASE + '/api/auth/staff/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'support@rbac.test', password: pw })
  });
  check('Disabled user cannot log in', disabledLogin.status === 403, `status ${disabledLogin.status}`);

  // 9. Lockout after repeated failures (wait for the per-minute login rate limiter window first)
  console.log('  (waiting 62s for the login rate-limit window to reset...)');
  await sleep(62000);
  const statuses = [];
  for (let i = 0; i < 5; i++) {
    const r = await fetch(BASE + '/api/auth/staff/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ce@rbac.test', password: 'wrong-password-' + i })
    });
    statuses.push(r.status);
  }
  check('Repeated wrong passwords are rejected, 5th locks the account', statuses.slice(0, 4).every(s => s === 401) && statuses[4] === 423, JSON.stringify(statuses));
  const lockedRow = db.prepare('SELECT locked_until, failed_login_attempts FROM users WHERE id = ?').get(users.ce);
  check('Lockout is recorded in the database', !!lockedRow.locked_until && lockedRow.failed_login_attempts >= 5);

  // 10. No default passwords: stored hashes are bcrypt, never plaintext
  const hashes = db.prepare('SELECT password_hash FROM users').all();
  check('All staff passwords are stored as bcrypt hashes', hashes.every(h => /^\$2[aby]\$/.test(h.password_hash)));

  // 12. Canonical Permission Registry Integrity & Strict Key Validator
  const { PERMISSIONS: CANONICAL_PERMS, VALID_PERMISSIONS_SET, canonicalizePermission } = require('../server/shared/permissions');
  const { requirePermission } = require('../server/middleware/auth');
  const { RULES } = require('../server/middleware/policy');

  // Test that requirePermission throws if an unmapped / non-registry key is provided
  let bogusThrew = false;
  try {
    requirePermission('non_existent.bogus.permission');
  } catch (e) {
    bogusThrew = true;
  }
  check('requirePermission rejects unregistered permission keys with fatal error', bogusThrew);

  // Test that all policy.js RULES use valid canonical registry keys
  let policyKeysValid = true;
  for (const rule of RULES) {
    const perm = rule[2];
    if (perm !== null && !VALID_PERMISSIONS_SET.has(perm)) {
      policyKeysValid = false;
      console.error(`Invalid policy permission key: "${perm}"`);
    }
  }
  check('All server policy middleware rules enforce canonical permission keys', policyKeysValid);

  // Test alias resolution maps legacy styles to canonical dotted keys
  const sampleAliasTests = [
    ['website_content.write', 'website.content.write'],
    ['website_settings.write', 'website.settings.write'],
    ['orders.status.update', 'orders.update'],
    ['orders.payment.verify', 'orders.update'],
    ['analytics.read', 'website.access'],
    ['system.jobs.manage', 'website.settings.write']
  ];
  const allAliasesResolve = sampleAliasTests.every(([alias, canonical]) => canonicalizePermission(alias) === canonical);
  check('Permission alias map correctly resolves all legacy/alternate styles to canonical dotted keys', allAliasesResolve);

  // Test stored database role_permissions are canonical dotted keys
  const storedPerms = db.prepare('SELECT DISTINCT permission_key FROM role_permissions').all().map(r => r.permission_key);
  const allStoredAreCanonical = storedPerms.every(k => VALID_PERMISSIONS_SET.has(canonicalizePermission(k)));
  check('All stored role permissions in database match canonical dotted registry', allStoredAreCanonical);

  console.log(`\nRBAC SUITE: ${passed} passed, ${failed} failed`);
  db.close();
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });

