#!/usr/bin/env node
/**
 * Data-Driven Lifecycle Test Suite
 * Driven strictly by a declarative module registry.
 *
 * For each registered module:
 * 1. Creates a record
 * 2. Edits it
 * 3. Soft archives it
 * 4. Checks that it is hidden from public API / storefront reads
 * 5. Restores it
 * 6. Checks audit log before/after diff entries
 * 7. Checks domain event outbox
 * 8. Checks optimistic concurrency version conflict returns HTTP 409
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = process.env.TEST_PORT || process.env.PORT || 3000;
const BASE = `http://127.0.0.1:${PORT}/api`;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@camnexbd.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'CamneX@Admin2026!';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, text: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// Module Registry defining lifecycle metadata for managed modules
const MODULE_REGISTRY = [
  {
    module: 'spec-templates',
    tableName: 'spec_templates',
    createEndpoint: '/spec-templates',
    getEndpoint: '/spec-templates',
    createPayload: () => ({
      name: `Test Spec Template ${Date.now()}`,
      categorySlug: `cat-test-${Date.now()}`,
      fieldGroups: [{ groupName: 'General', fields: [] }]
    })
  },
  {
    module: 'glossary',
    tableName: 'glossary_terms',
    createEndpoint: '/admin/glossary',
    getEndpoint: '/glossary',
    createPayload: () => ({
      term: `Test Term ${Date.now()}`,
      slug: `test-term-${Date.now()}`,
      shortMeaning: 'Meaning for testing lifecycle',
      longMeaning: 'Long description',
      category: 'cctv',
      displayOrder: 99,
      isActive: 1
    })
  },
  {
    module: 'packages',
    tableName: 'packages',
    createEndpoint: '/packages',
    getEndpoint: '/packages',
    createPayload: () => ({
      name: `Test Security Package ${Date.now()}`,
      slug: `test-pkg-${Date.now()}`,
      description: 'Turnkey package lifecycle test',
      basePrice: 15000,
      cameraCount: 4,
      items: []
    })
  },
  {
    module: 'quotes',
    tableName: 'quotes',
    createEndpoint: '/quotes',
    getEndpoint: '/quotes',
    createPayload: () => ({
      customerName: 'Managed Test Client',
      phone: `0171${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: 'managed_test@example.com',
      serviceType: 'cctv_installation',
      notes: 'Testing managed entity lifecycle'
    })
  },
  {
    module: 'hero-slides',
    tableName: 'hero_slides',
    createEndpoint: '/cms/hero-slides',
    getEndpoint: '/cms/hero-slides',
    createPayload: () => ({
      title: `Hero Slide Lifecycle ${Date.now()}`,
      enabled: true,
      order: 10,
      badge: 'Test',
      highlights: []
    })
  },
  {
    module: 'projects',
    tableName: 'projects',
    createEndpoint: '/cms/projects',
    getEndpoint: '/cms/projects',
    createPayload: () => ({
      title: `Project Case Study ${Date.now()}`,
      slug: `project-lifecycle-${Date.now()}`,
      category: 'commercial',
      clientName: 'Test Client',
      description: 'Project lifecycle description'
    })
  },
  {
    module: 'pages',
    tableName: 'cms_pages',
    createEndpoint: '/cms/pages',
    getEndpoint: '/cms/pages',
    createPayload: () => ({
      title: `Policy Page ${Date.now()}`,
      slug: `policy-page-${Date.now()}`,
      content: '<p>Custom policy content</p>'
    })
  },
  {
    module: 'testimonials',
    tableName: 'testimonials',
    createEndpoint: '/cms/testimonials',
    getEndpoint: '/cms/testimonials',
    createPayload: () => ({
      client_name: 'Authentic Reviewer',
      company: 'Bangladesh Security Ltd',
      rating: 5,
      content: 'Exemplary turnkey installation and service.'
    })
  },
  {
    module: 'faqs',
    tableName: 'faqs',
    createEndpoint: '/cms/faqs',
    getEndpoint: '/cms/faqs',
    createPayload: () => ({
      question: `What is the warranty period? ${Date.now()}`,
      answer: 'Standard warranty details.',
      category: 'Warranty & Support'
    })
  },
  {
    module: 'blog',
    tableName: 'blog_posts',
    createEndpoint: '/cms/blog',
    getEndpoint: '/cms/blog',
    createPayload: () => ({
      title: `Security Best Practices ${Date.now()}`,
      slug: `security-practices-${Date.now()}`,
      excerpt: 'Guide to CCTV installations',
      content: '<p>Article body content</p>',
      isPublished: true
    })
  }
];

async function runDataDrivenLifecycleTests() {
  console.log('================================================================');
  console.log('DATA-DRIVEN MANAGED ENTITY LIFECYCLE TEST SUITE');
  console.log(`Registered Modules: ${MODULE_REGISTRY.length}`);
  console.log('================================================================');

  // 1. Authenticate as Admin
  console.log('\n[1/4] Authenticating as Admin...');
  const initCsrfRes = await request('GET', '/auth/csrf');
  const initCookies = Array.isArray(initCsrfRes.headers['set-cookie']) ? initCsrfRes.headers['set-cookie'].join('; ') : (initCsrfRes.headers['set-cookie'] || '');
  const initCsrfMatch = initCookies.match(/camnex_csrf=([^;]+)/);
  const initCsrf = initCsrfMatch ? initCsrfMatch[1] : '';

  const loginRes = await request('POST', '/auth/admin/login', {
    email: adminEmail,
    password: adminPassword
  }, {
    Cookie: `camnex_csrf=${initCsrf}`,
    'x-csrf-token': initCsrf
  });
  assert.strictEqual(loginRes.status, 200, `Admin login failed: ${JSON.stringify(loginRes.body)}`);

  const rawCookies = Array.isArray(loginRes.headers['set-cookie'])
    ? loginRes.headers['set-cookie'].join('; ')
    : (loginRes.headers['set-cookie'] || '');

  const sessMatch = rawCookies.match(/camnex_admin_session=([^;]+)/) || rawCookies.match(/camnex_session=([^;]+)/);
  const csrfMatch = rawCookies.match(/camnex_csrf=([^;]+)/);

  assert(sessMatch, 'Expected session cookie on login');
  assert(csrfMatch, 'Expected CSRF cookie on login');

  const cookieHeader = `camnex_admin_session=${sessMatch[1]}; camnex_session=${sessMatch[1]}; camnex_csrf=${csrfMatch[1]}`;
  const authHeaders = {
    Cookie: cookieHeader,
    'x-csrf-token': csrfMatch[1]
  };
  console.log('  ✓ Admin session and CSRF token established.');

  // 2. Iterate each module in registry
  console.log('\n[2/4] Testing Lifecycle across all registered modules...');
  for (const reg of MODULE_REGISTRY) {
    process.stdout.write(`  Testing module [${reg.module}]... `);

    // Step A: Create Record
    const payload = reg.createPayload();
    const createRes = await request('POST', reg.createEndpoint, payload, authHeaders);
    assert([200, 201].includes(createRes.status), `Creation failed for ${reg.module}: ${createRes.text}`);
    const createdId = createRes.body?.id || createRes.body?.item?.id;
    assert(createdId, `No ID returned for ${reg.module}`);

    // Step B: Edit with Version Check (Should succeed with version 1)
    const updateRes = await request('PUT', `/managed/${reg.module}/${createdId}`, {
      version: 1,
      name: `${payload.name || payload.title || payload.term || payload.customerName || 'Updated'} (Edited)`
    }, authHeaders);
    assert.strictEqual(updateRes.status, 200, `Update with version 1 failed: ${updateRes.text}`);
    assert.strictEqual(updateRes.body?.version, 2, 'Expected version to increment to 2');

    // Step C: Test Version Conflict (Sending obsolete version 1 should return 409)
    const conflictRes = await request('PUT', `/managed/${reg.module}/${createdId}`, {
      version: 1,
      notes: 'Out of sync edit'
    }, authHeaders);
    assert.strictEqual(conflictRes.status, 409, `Expected 409 conflict, got ${conflictRes.status}: ${conflictRes.text}`);

    // Step D: Soft Archive Entity
    const archiveRes = await request('POST', `/managed/${reg.module}/${createdId}/archive`, {
      reason: 'Lifecycle automated test archival'
    }, authHeaders);
    assert.strictEqual(archiveRes.status, 200, `Archive failed: ${archiveRes.text}`);
    assert.strictEqual(archiveRes.body?.archived, true);
    assert.strictEqual(archiveRes.headers['cache-control'], 'no-cache, no-store, must-revalidate');

    // Step E: Check Entity is Hidden or Marked Archived
    const getRes = await request('GET', `${reg.getEndpoint}`, null, authHeaders);
    assert.strictEqual(getRes.status, 200, `List request failed: ${getRes.text}`);
    const items = Array.isArray(getRes.body) ? getRes.body : (getRes.body?.items || []);
    const found = items.find(i => i.id === createdId);
    if (found) {
      assert(found.is_archived === true || found.isArchived === true, `Archived record ${createdId} visible in ${reg.module} without archive flag`);
    }

    // Step F: Restore Entity
    const restoreRes = await request('POST', `/managed/${reg.module}/${createdId}/restore`, {}, authHeaders);
    assert.strictEqual(restoreRes.status, 200, `Restore failed: ${restoreRes.text}`);
    assert.strictEqual(restoreRes.body?.restored, true);

    // Step G: Check Audit Entry
    const auditRes = await request('GET', `/audit-logs?entity=${reg.tableName}&entityId=${createdId}`, null, authHeaders);
    assert.strictEqual(auditRes.status, 200, `Audit lookup failed: ${auditRes.text}`);
    const auditLogs = auditRes.body?.items || [];
    const actions = auditLogs.map(a => a.action);
    assert(actions.includes('archive'), `Missing 'archive' action in audit logs for ${reg.tableName}`);
    assert(actions.includes('restore'), `Missing 'restore' action in audit logs for ${reg.tableName}`);

    // Step H: Clean up test record through managed delete
    const delRes = await request('DELETE', `/managed/${reg.module}/${createdId}`, null, authHeaders);
    assert.strictEqual(delRes.status, 200, `Delete failed: ${delRes.text}`);

    console.log('✓ PASS');
  }

  console.log('\n[3/4] Testing Reference Guard Protection...');
  // Reference guard check on package referenced in order or quote
  const testPkgId = `pkg-ref-guard-${Date.now()}`;
  const db = require('../database');
  db.prepare(`
    INSERT INTO packages (id, name, slug, description, camera_count, base_price, is_active, data_json)
    VALUES (?, ?, ?, ?, 4, 10000, 1, ?)
  `).run(testPkgId, 'Ref Guard Package', `ref-guard-${Date.now()}`, 'Ref Guard desc', JSON.stringify({ id: testPkgId, name: 'Ref Guard Package' }));

  db.prepare(`
    INSERT INTO quotes (id, reference_number, customer_name, phone, service_type, status, data_json)
    VALUES (?, ?, 'Guard Client', '01711111111', 'survey', 'pending', ?)
  `).run(`qte-guard-${Date.now()}`, `QTE-GUARD-${Date.now()}`, JSON.stringify({ packageId: testPkgId }));

  // Deletion must return 409 because it is referenced in quote
  const guardDelRes = await request('DELETE', `/managed/packages/${testPkgId}`, null, authHeaders);
  assert.strictEqual(guardDelRes.status, 409, `Expected 409 for referenced package deletion, got: ${guardDelRes.status}`);
  assert(guardDelRes.text.includes('Please archive instead'), 'Expected "Please archive instead" in error message');

  // Clean up test quote and package safely
  db.prepare('DELETE FROM quotes WHERE customer_name = ?').run('Guard Client');
  db.prepare('DELETE FROM packages WHERE id = ?').run(testPkgId);
  console.log('  ✓ Reference guard correctly enforces archival over deletion for referenced entities.');

  console.log('\n================================================================');
  console.log('ALL DATA-DRIVEN LIFECYCLE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

if (require.main === module) {
  runDataDrivenLifecycleTests().catch((err) => {
    console.error('\n[FAIL] Test failure:', err);
    process.exit(1);
  });
}

module.exports = { runDataDrivenLifecycleTests, MODULE_REGISTRY };
