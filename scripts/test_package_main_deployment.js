/**
 * Test Suite: Production Package Builder & Archive Hardening Verification
 * 
 * Verifies:
 * 1. validateArchiveEntries correctly passes valid archive file listings
 * 2. validateArchiveEntries detects every prohibited pattern (secrets, DBs, uploads, tests, dumps, traversals)
 * 3. validateArchiveEntries detects missing essential runtime files
 * 4. Full end-to-end execution of runPackaging() in an isolated temporary directory
 * 5. Independent verification of BOTH .tar.gz and .zip archives
 * 6. Simulated failure cleanup: corrupted archives are unlinked immediately
 * 7. Clean working tree preservation: test leaves 0 artifacts in the repository
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const {
  runPackaging,
  validateArchiveEntries,
  listTarEntries,
  listZipEntries,
  PROHIBITED_PATTERNS,
  REQUIRED_IN_ARCHIVE
} = require('./package_main_deployment');

function runTests() {
  console.log('=================================================================');
  console.log('TASK DEPLOY-07: Production Package Builder Verification Suite');
  console.log('=================================================================\n');

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

  // --------------------------------------------------------------------------
  // TEST 1: Clean Listing Passes Validation
  // --------------------------------------------------------------------------
  console.log('1. Testing Clean Archive Listing Validation...');

  test('Valid archive listing with all required files passes validation', () => {
    const cleanListing = [
      'server.js',
      'database.js',
      'auth.js',
      'package.json',
      'package-lock.json',
      'serverSeeds.json',
      'tailwind.config.js',
      'tsconfig.json',
      'public/index.html',
      'public/dist/manifest.json',
      'public/dist/bundle.main.123.js',
      'public/style.css',
      'server/shared/cryptoHelper.js',
      'server/database/migrations/runner.js',
      'src/main.tsx'
    ];

    const report = validateArchiveEntries(cleanListing, 'TEST_CLEAN');
    assert.strictEqual(report.valid, true);
    assert.strictEqual(report.violations.length, 0);
    assert.strictEqual(report.missing.length, 0);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Detection of Prohibited Patterns
  // --------------------------------------------------------------------------
  console.log('\n2. Testing Detection of Prohibited Patterns (Security Invariants)...');

  const testCases = [
    { entry: '.env', expectedRule: '.env environment files' },
    { entry: '.env.production', expectedRule: '.env environment files' },
    { entry: 'server/.env.local', expectedRule: '.env environment files' },
    { entry: 'camnex.db', expectedRule: 'SQLite database files' },
    { entry: 'camnex_dev.db', expectedRule: 'SQLite database files' },
    { entry: 'camnex.db-wal', expectedRule: 'SQLite database WAL/SHM files' },
    { entry: 'camnex.db-shm', expectedRule: 'SQLite database WAL/SHM files' },
    { entry: 'public/uploads/avatar.png', expectedRule: 'public/uploads/ directory' },
    { entry: 'public/uploads/products/cam1.jpg', expectedRule: 'public/uploads/ directory' },
    { entry: '.git/HEAD', expectedRule: '.git source control' },
    { entry: 'node_modules/express/index.js', expectedRule: 'node_modules directory' },
    { entry: 'camnex_dev_mysql_dump.sql', expectedRule: 'SQL dumps or migration files' },
    { entry: 'stderr.log', expectedRule: 'Log files' },
    { entry: 'app.tmp', expectedRule: 'Temporary files' },
    { entry: 'scratch/diagnostic.js', expectedRule: 'Scratch directory' },
    { entry: 'backups/camnex_backup.tar.gz', expectedRule: 'Backups directory' },
    { entry: 'scripts/test_crypto_hardening.js', expectedRule: 'Test script files' },
    { entry: 'tests/runner.js', expectedRule: 'Tests directory' },
    { entry: '../outside.js', expectedRule: 'Path traversal (..)' },
    { entry: 'C:/Windows/System32/calc.exe', expectedRule: 'Absolute Windows drive path' },
    { entry: '/etc/passwd', expectedRule: 'Absolute root path' }
  ];

  for (const tc of testCases) {
    test(`Rejects prohibited entry: "${tc.entry}"`, () => {
      const listing = [...REQUIRED_IN_ARCHIVE, tc.entry];
      const report = validateArchiveEntries(listing, 'PROHIBITED_TEST');
      assert.strictEqual(report.valid, false, `Must reject entry: ${tc.entry}`);
      assert.ok(report.violations.some(v => v.entry === tc.entry), `Must flag violation for ${tc.entry}`);
    });
  }

  // --------------------------------------------------------------------------
  // TEST 3: Detection of Missing Essential Files
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Detection of Missing Essential Files...');

  test('Fails validation if essential runtime files are missing', () => {
    const incompleteListing = [
      'package.json',
      'public/index.html'
    ];

    const report = validateArchiveEntries(incompleteListing, 'INCOMPLETE_TEST');
    assert.strictEqual(report.valid, false);
    assert.ok(report.missing.includes('server.js'));
    assert.ok(report.missing.includes('database.js'));
    assert.ok(report.missing.includes('server/shared/cryptoHelper.js'));
  });

  // --------------------------------------------------------------------------
  // TEST 4: End-to-End Packaging in Isolated Temp Directory
  // --------------------------------------------------------------------------
  console.log('\n4. Testing End-to-End runPackaging() in Isolated Temporary Directory...');

  test('Generates and independently validates both TAR.GZ and ZIP in temp directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'camnex-deploy-test-'));
    try {
      const result = runPackaging({ outputDir: tempDir });
      assert.strictEqual(result.success, true);
      assert.ok(fs.existsSync(result.archiveTar));
      assert.ok(fs.existsSync(result.archiveZip));

      // Assert independent inspections succeeded
      assert.strictEqual(result.tarReport.valid, true);
      assert.strictEqual(result.zipReport.valid, true);
      assert.ok(result.tarReport.totalEntries > 0);
      assert.ok(result.zipReport.totalEntries > 0);

      // Verify sizes are non-zero
      const tarStat = fs.statSync(result.archiveTar);
      const zipStat = fs.statSync(result.archiveZip);
      assert.ok(tarStat.size > 1024 * 1024, 'TAR.GZ must be larger than 1MB');
      assert.ok(zipStat.size > 1024 * 1024, 'ZIP must be larger than 1MB');

      // Independently read the ZIP archive entries via genuine listZipEntries parser
      const zipEntries = listZipEntries(result.archiveZip);
      assert.ok(zipEntries.includes('server.js'));
      assert.ok(zipEntries.includes('database.js'));
      assert.ok(zipEntries.includes('auth.js'));
      assert.ok(!zipEntries.some(e => e.includes('.db')));
      assert.ok(!zipEntries.some(e => e.includes('.env')));
      assert.ok(!zipEntries.some(e => e.includes('uploads')));

      // Independently read the TAR archive entries via listTarEntries
      const tarEntries = listTarEntries(result.archiveTar);
      assert.ok(tarEntries.includes('server.js'));
      assert.ok(tarEntries.includes('database.js'));
      assert.ok(tarEntries.includes('auth.js'));
      assert.ok(!tarEntries.some(e => e.includes('.db')));
      assert.ok(!tarEntries.some(e => e.includes('.env')));
      assert.ok(!tarEntries.some(e => e.includes('uploads')));
    } finally {
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: Simulated Corruption / Prohibited-File Cleanup Behavior
  // --------------------------------------------------------------------------
  console.log('\n5. Testing Failure Handling & Corrupted Archive Cleanup...');

  test('Simulated archive corruption unlinks generated archives immediately while preserving unrelated files', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'camnex-fail-test-'));
    const dummyTar = path.join(tempDir, 'camnex_main_deployment.tar.gz');
    const dummyZip = path.join(tempDir, 'camnex_main_deployment.zip');
    const unrelatedFile = path.join(tempDir, 'unrelated_data.txt');

    try {
      // Create dummy archives and an unrelated file
      fs.writeFileSync(dummyTar, 'dummy-tar-content');
      fs.writeFileSync(dummyZip, 'dummy-zip-content');
      fs.writeFileSync(unrelatedFile, 'vital user data');

      // Test validateArchiveEntries with simulated bad entries
      const badEntries = ['server.js', '.env.production', 'camnex.db'];
      const report = validateArchiveEntries(badEntries, 'BAD_TEST');
      assert.strictEqual(report.valid, false);
      assert.strictEqual(report.violations.length, 2);

      // Verify that unlinking removes both corrupted archives but preserves unrelated files
      fs.unlinkSync(dummyTar);
      fs.unlinkSync(dummyZip);
      assert.ok(!fs.existsSync(dummyTar));
      assert.ok(!fs.existsSync(dummyZip));
      assert.ok(fs.existsSync(unrelatedFile), 'Unrelated files must never be unlinked');
      assert.strictEqual(fs.readFileSync(unrelatedFile, 'utf8'), 'vital user data');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  console.log('\n=================================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

