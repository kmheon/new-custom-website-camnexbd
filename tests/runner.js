#!/usr/bin/env node
/**
 * CamneX Platform - Master Test Runner
 *
 * 1. Initializes a temporary SQLite database (clean, zero demo data) using scripts/create_clean_db.js.
 * 2. Starts a temporary Express server on an isolated test port (3099).
 * 3. Waits for the server to become healthy and ready.
 * 4. Executes test suites:
 *    - test_clean_db_storefront.js (tests clean database empty states and unconfigured checkout guard)
 *    - seeds baseline hardware catalog into test DB
 *    - test_security_attacks.js (RBAC, CSRF on orders & product save, IDOR, SQLi, uploads, rate limits)
 *    - test_platform.js (compression, caching, search, background jobs)
 *    - test_packages_dynamic.js (BOM dynamic pricing calculation)
 *    - test_media_upload.js (magic bytes, WebP conversion, deletion)
 *    - test_admin_completeness.js (admin CRUD operations)
 * 5. Tears down the temporary server and removes temporary database files.
 */

const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const TEST_PORT = 3099;
const TEST_DB_PATH = path.join(__dirname, 'temp_test.db');
const ADMIN_EMAIL = 'admin@camnexbd.com';
const ADMIN_PASSWORD = 'TestRunnerAdminPass2026!';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanTempDbFiles() {
  const extensions = ['', '-wal', '-shm'];
  for (const ext of extensions) {
    const f = `${TEST_DB_PATH}${ext}`;
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
  }
}

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get({
          hostname: '127.0.0.1',
          port,
          path: '/api/auth/csrf',
          timeout: 1000
        }, res => resolve(res.statusCode));
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });
      if (res === 200) return true;
    } catch (_) {}
    await sleep(200);
  }
  return false;
}

function seedBaselineCatalogIntoDb(dbPath) {
  const Database = require('better-sqlite3');
  const seedsPath = path.join(__dirname, '../serverSeeds.json');
  if (!fs.existsSync(seedsPath)) return;
  const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

  const db = new Database(dbPath);
  try {
    const insertCat = db.prepare(`
      INSERT OR IGNORE INTO categories (id, name, slug, description, image, spec_template_id, display_order, status, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of seeds.INITIAL_CATEGORIES || []) {
      insertCat.run(c.id, c.name, c.slug, c.description || '', c.image || '', c.specTemplateId || '', c.order || 1, 'active', JSON.stringify(c));
    }

    const insertBrand = db.prepare(`
      INSERT OR IGNORE INTO brands (id, name, slug, logo, description, website, featured, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of seeds.INITIAL_BRANDS || []) {
      insertBrand.run(b.id, b.name, b.slug, b.logo || '', b.description || '', b.website || '', b.featured ? 1 : 0, JSON.stringify(b));
    }

    const insertProd = db.prepare(`
      INSERT OR IGNORE INTO products (
        id, name, model_number, sku, brand_id, brand_name, category_id, category_slug,
        status, price, compare_price, stock_quantity, is_featured, is_popular, is_demo, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of seeds.INITIAL_PRODUCTS || []) {
      insertProd.run(
        p.id, p.name, p.modelNumber, p.sku, p.brandId, p.brand, p.categoryId,
        p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
        p.status || 'active', p.pricing?.regularPrice || 0, p.pricing?.salePrice || 0,
        p.inventory?.available || 10, p.isFeatured ? 1 : 0, p.isPopular ? 1 : 0, 0,
        JSON.stringify(p)
      );
    }

    const insertPkg = db.prepare(`
      INSERT OR IGNORE INTO packages (id, name, slug, description, camera_count, base_price, is_active, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const pkg of seeds.INITIAL_PACKAGES || []) {
      insertPkg.run(pkg.id, pkg.name, pkg.slug, pkg.description || '', pkg.cameraCount || 4, pkg.basePrice || 0, 1, JSON.stringify(pkg));
    }
  } finally {
    db.close();
  }
}

async function runTestSuite(name, scriptPath, env) {
  console.log(`\n>>> [TEST RUNNER] Running: ${name} (${scriptPath})...`);
  return new Promise((resolve) => {
    const proc = cp.spawn(process.execPath, [scriptPath], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ...env },
      stdio: 'inherit'
    });
    proc.on('close', (code) => {
      resolve({ name, code });
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('CAMNEX AUTOMATED TEST HARNESS');
  console.log('Starting temporary isolated server on clean database...');
  console.log('================================================================');

  cleanTempDbFiles();

  // 1. Create clean database using production generator
  console.log(`\n[STEP 1] Generating clean test database at: ${TEST_DB_PATH}`);
  cp.execFileSync(process.execPath, [
    path.join(__dirname, '../scripts/create_clean_db.js'),
    `--output=${TEST_DB_PATH}`
  ], {
    env: {
      ...process.env,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    },
    stdio: 'inherit'
  });

  // 2. Spawn temporary server
  console.log(`\n[STEP 2] Spawning temporary Express server on port ${TEST_PORT}...`);
  const serverProc = cp.spawn(process.execPath, [path.join(__dirname, '../server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DB_PATH: TEST_DB_PATH,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      SKIP_SEED: '1',
      NODE_ENV: 'test'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProc.stderr.on('data', (d) => {
    const s = d.toString().trim();
    if (s) console.error(`[TEMP-SERVER-ERR] ${s}`);
  });

  let serverClosed = false;
  serverProc.on('exit', () => { serverClosed = true; });

  const testEnv = {
    TEST_PORT: String(TEST_PORT),
    TEST_BASE_URL: `http://127.0.0.1:${TEST_PORT}`,
    DB_PATH: TEST_DB_PATH,
    ADMIN_EMAIL,
    ADMIN_PASSWORD
  };

  const results = [];

  try {
    const ready = await waitForServer(TEST_PORT);
    if (!ready) {
      throw new Error(`Temporary server failed to start within timeout on port ${TEST_PORT}`);
    }
    console.log(`[TEMP-SERVER] Server ready at http://127.0.0.1:${TEST_PORT}`);

    // 3. Test clean DB storefront behavior first (empty states, payment guard)
    results.push(await runTestSuite('Clean DB Storefront & Payment Guard', path.join(__dirname, 'test_clean_db_storefront.js'), testEnv));

    // 4. Seed baseline products and categories for catalog/search/pricing tests
    console.log('\n[STEP 3] Seeding baseline hardware catalog into test DB for catalog tests...');
    seedBaselineCatalogIntoDb(TEST_DB_PATH);

    // 5. Run test suites (Visual Rendering, Homepage Revision 2, Platform, Packages, Media, Admin, then Security Attacks last)
    results.push(await runTestSuite('Real Visual Computed Styles Suite (CDP)', path.join(__dirname, 'test_visual_rendering.js'), testEnv));
    results.push(await runTestSuite('Homepage Revision 2 Layout Suite (CDP)', path.join(__dirname, 'test_homepage_revision2.js'), testEnv));
    results.push(await runTestSuite('Homepage Fixes Suite (CDP)', path.join(__dirname, 'test_homepage_fixes.js'), testEnv));
    results.push(await runTestSuite('Homepage Revision 3 Suite (CDP)', path.join(__dirname, 'test_homepage_revision3.js'), testEnv));
    results.push(await runTestSuite('Platform Hardening Suite', path.join(__dirname, 'test_platform.js'), testEnv));
    results.push(await runTestSuite('Dynamic Packages Suite', path.join(__dirname, 'test_packages_dynamic.js'), testEnv));
    results.push(await runTestSuite('Media Upload Suite', path.join(__dirname, 'test_media_upload.js'), testEnv));
    results.push(await runTestSuite('Admin Completeness Suite', path.join(__dirname, 'test_admin_completeness.js'), testEnv));
    results.push(await runTestSuite('Security Attacks & CSRF Suite', path.join(__dirname, 'test_security_attacks.js'), testEnv));

  } finally {
    console.log('\n[TEARDOWN] Stopping temporary test server...');
    if (!serverClosed) {
      try { serverProc.kill('SIGTERM'); } catch (_) {}
    }
    await sleep(500);
    cleanTempDbFiles();
    console.log('[TEARDOWN] Temporary database cleaned up.');
  }

  console.log('\n================================================================');
  console.log('TEST HARNESS SUMMARY');
  console.log('================================================================');
  let hasFailure = false;
  for (const r of results) {
    const passed = r.code === 0;
    if (!passed) hasFailure = true;
    console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}: ${r.name}`);
  }
  console.log('================================================================\n');

  if (hasFailure) {
    console.error('Test run failed!');
    process.exit(1);
  } else {
    console.log('All test suites passed successfully!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('[TEST RUNNER FATAL ERROR]', err);
  cleanTempDbFiles();
  process.exit(1);
});
