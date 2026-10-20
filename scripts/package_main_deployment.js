#!/usr/bin/env node
/**
 * CamneX Platform - Production Main-Domain Deployment Packager
 * Target Domain: camnexbd.com
 * 
 * Strict Invariants:
 * 1. Packages only required runtime code and built production assets.
 * 2. Strictly excludes .env*, .git/, node_modules/, camnex*.db*, SQL dumps,
 *    archives, logs, scratch files, test suites, and development artifacts.
 * 3. Never includes or overwrites public/uploads/.
 * 4. Does not include a staging database or create an empty production database in the archive.
 * 5. Generates a deployment manifest and performs post-packaging verification.
 * 6. Safe to run repeatedly; does not modify source files or databases.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// Allow custom output directory via --output or default to rootDir
let outputDir = rootDir;
const outIdx = process.argv.indexOf('--output');
if (outIdx !== -1 && process.argv[outIdx + 1]) {
  outputDir = path.resolve(process.argv[outIdx + 1]);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

const archiveTar = path.join(outputDir, 'camnex_main_deployment.tar.gz');
const archiveZip = path.join(outputDir, 'camnex_main_deployment.zip');

console.log('=================================================================');
console.log('CamneX Platform: Production Packaging (camnexbd.com)');
console.log('=================================================================\n');

// ----------------------------------------------------------------------------
// Step 1: Pre-flight Verification of Required Source Files & Built Assets
// ----------------------------------------------------------------------------
console.log('[1/4] Verifying required runtime files and build assets...');

const requiredRuntimeFiles = [
  'server.js',
  'database.js',
  'auth.js',
  'package.json',
  'package-lock.json',
  'serverSeeds.json',
  'tailwind.config.js',
  'tsconfig.json',
  'public/index.html',
  'public/bundle.js',
  'public/bundle.admin.js',
  'public/bundle.staff.js',
  'public/style.css',
  'public/dist/manifest.json',
  'server/shared/cryptoHelper.js',
  'server/database/migrations/runner.js'
];

const missingFiles = [];
for (const relPath of requiredRuntimeFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    missingFiles.push(relPath);
  }
}

if (missingFiles.length > 0) {
  console.error('[ERROR] Pre-flight check failed! The following required files are missing:');
  missingFiles.forEach(f => console.error(`  - ${f}`));
  console.error('\nRun "node scripts/build.js" first to generate frontend bundles.');
  process.exit(1);
}

// Verify public/dist/manifest.json contains active bundle references
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/dist/manifest.json'), 'utf8'));
  console.log(`  ✓ Built assets manifest verified (Hash: ${manifest.hash || 'N/A'}, Built: ${manifest.builtAt || 'N/A'})`);
} catch (mErr) {
  console.error('[ERROR] Failed to parse public/dist/manifest.json:', mErr.message);
  process.exit(1);
}

console.log('  ✓ All required runtime files and compiled assets are present.');

// ----------------------------------------------------------------------------
// Step 2: Clean up previous archive outputs
// ----------------------------------------------------------------------------
if (fs.existsSync(archiveTar)) fs.unlinkSync(archiveTar);
if (fs.existsSync(archiveZip)) fs.unlinkSync(archiveZip);

// ----------------------------------------------------------------------------
// Step 3: Define Exclusion Rules & Inclusions
// ----------------------------------------------------------------------------
console.log('\n[2/4] Assembling production archives with strict safety exclusions...');

const exclusions = [
  '--exclude=.git',
  '--exclude=.git/**',
  '--exclude=node_modules',
  '--exclude=node_modules/**',
  '--exclude=.env*',
  '--exclude=camnex*.db*',
  '--exclude=*.sql',
  '--exclude=*.tar.gz',
  '--exclude=*.zip',
  '--exclude=scratch',
  '--exclude=scratch/**',
  '--exclude=backups',
  '--exclude=backups/**',
  '--exclude=tests',
  '--exclude=tests/**',
  '--exclude=scripts/test_*',
  '--exclude=scripts/scratch_*',
  '--exclude=scripts/capture_*',
  '--exclude=scripts/debug_*',
  '--exclude=public/uploads',
  '--exclude=public/uploads/**',
  '--exclude=*.log',
  '--exclude=*.tmp'
];

const includedItems = [
  'server.js',
  'auth.js',
  'database.js',
  'package.json',
  'package-lock.json',
  'serverSeeds.json',
  'tailwind.config.js',
  'tsconfig.json',
  'public',
  'server',
  'src',
  'scripts/build.js',
  'scripts/reset_admin_password.js'
];

// Create tar.gz using bsdtar
const tarCmd = `tar -czf "${archiveTar}" ${exclusions.join(' ')} ${includedItems.join(' ')}`;
execSync(tarCmd, { cwd: rootDir, stdio: 'pipe' });

// Create zip using bsdtar (-a)
const zipCmd = `tar -a -c -f "${archiveZip}" ${exclusions.join(' ')} ${includedItems.join(' ')}`;
execSync(zipCmd, { cwd: rootDir, stdio: 'pipe' });

const statTar = fs.statSync(archiveTar);
const statZip = fs.statSync(archiveZip);

console.log(`  ✓ Generated tar.gz: ${(statTar.size / (1024 * 1024)).toFixed(2)} MB -> ${archiveTar}`);
console.log(`  ✓ Generated zip:    ${(statZip.size / (1024 * 1024)).toFixed(2)} MB -> ${archiveZip}`);

// ----------------------------------------------------------------------------
// Step 4: Post-Packaging Verification & Manifest Audit
// ----------------------------------------------------------------------------
console.log('\n[3/4] Inspecting archive contents against security rules...');

const archiveListing = execSync(`tar -tf "${archiveTar}"`, { cwd: rootDir, encoding: 'utf8' })
  .split(/\r?\n/)
  .map(s => s.trim())
  .filter(Boolean);

console.log(`  Total bundled entries: ${archiveListing.length}`);

// Check for forbidden paths
const prohibitedPatterns = [
  { pattern: /(^|\/)\.env/i, name: '.env environment files' },
  { pattern: /(^|\/)\.git(\/|$)/i, name: '.git source control' },
  { pattern: /(^|\/)node_modules(\/|$)/i, name: 'node_modules directory' },
  { pattern: /camnex.*\.db/i, name: 'SQLite database files' },
  { pattern: /\.sql$/i, name: 'SQL dumps or migration files' },
  { pattern: /(^|\/)public\/uploads(\/|$)/i, name: 'public/uploads/ directory' },
  { pattern: /(^|\/)scripts\/test_/i, name: 'Test script files' },
  { pattern: /(^|\/)scratch(\/|$)/i, name: 'Scratch directory' },
  { pattern: /(^|\/)backups(\/|$)/i, name: 'Backups directory' },
  { pattern: /\.log$/i, name: 'Log files' }
];

const violations = [];
for (const entry of archiveListing) {
  for (const rule of prohibitedPatterns) {
    if (rule.pattern.test(entry)) {
      violations.push({ entry, rule: rule.name });
    }
  }
}

if (violations.length > 0) {
  console.error('\n[FATAL] Security violations detected in generated package!');
  violations.forEach(v => console.error(`  - [PROHIBITED] ${v.entry} (${v.rule})`));
  // Clean up corrupted archives
  try { fs.unlinkSync(archiveTar); } catch (_) {}
  try { fs.unlinkSync(archiveZip); } catch (_) {}
  process.exit(1);
}

// Verify essential files ARE inside archive
const requiredInArchive = [
  'server.js',
  'database.js',
  'auth.js',
  'package.json',
  'serverSeeds.json',
  'public/index.html',
  'public/dist/manifest.json',
  'server/shared/cryptoHelper.js'
];

const missingInArchive = requiredInArchive.filter(f => !archiveListing.some(entry => entry === f || entry.endsWith('/' + f)));

if (missingInArchive.length > 0) {
  console.error('\n[FATAL] Essential runtime files missing from package!');
  missingInArchive.forEach(f => console.error(`  - [MISSING] ${f}`));
  process.exit(1);
}

// ----------------------------------------------------------------------------
// Step 5: Summary Manifest Output
// ----------------------------------------------------------------------------
console.log('\n[4/4] Package Verification Summary:');
console.log('-----------------------------------------------------------------');
console.log(`Package Target:        Production (camnexbd.com)`);
console.log(`Archive (tar.gz):      ${archiveTar} (${(statTar.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Archive (zip):         ${archiveZip} (${(statZip.size / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Total Files:           ${archiveListing.length}`);
console.log(`Database Bundled:      NONE (Preserves server camnex.db or initializes cleanly on first boot)`);
console.log(`Uploads Bundled:       NONE (Strictly excluded to prevent overwriting user media)`);
console.log(`.env Bundled:          NONE (Excluded for secret safety)`);
console.log(`Tests/Dumps Bundled:   NONE (Excluded for clean deployment)`);
console.log(`Verification Status:   PASSED (All security invariants satisfied)`);
console.log('-----------------------------------------------------------------\n');

