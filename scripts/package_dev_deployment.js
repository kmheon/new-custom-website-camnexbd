const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const archiveTar = path.join(rootDir, 'camnex_dev_deployment.tar.gz');
const archiveZip = path.join(rootDir, 'camnex_dev_deployment.zip');

console.log('[1/4] Preparing package list...');

// Verify camnex_dev.db exists and is healthy
const devDbPath = path.join(rootDir, 'camnex_dev.db');
if (!fs.existsSync(devDbPath)) {
  console.error('Error: camnex_dev.db does not exist. Run scratch/prepare_dev_db.js first!');
  process.exit(1);
}

// Remove old archives if present
if (fs.existsSync(archiveTar)) fs.unlinkSync(archiveTar);
if (fs.existsSync(archiveZip)) fs.unlinkSync(archiveZip);

console.log('[2/4] Creating tar.gz archive using bsdtar...');
const tarCmd = [
  'tar',
  '-czf', 'camnex_dev_deployment.tar.gz',
  '--exclude=.git',
  '--exclude=.git/**',
  '--exclude=node_modules',
  '--exclude=node_modules/**',
  '--exclude=scratch',
  '--exclude=scratch/**',
  '--exclude=backups',
  '--exclude=backups/**',
  '--exclude=tests',
  '--exclude=tests/**',
  '--exclude=.env*',
  '--exclude=camnex.db*',
  '--exclude=camnex_clean.db*',
  '--exclude=camnex_dev_validation.db*',
  '--exclude=camnex_dev_deployment.tar.gz',
  '--exclude=camnex_dev_deployment.zip',
  '--exclude=scripts/test_*',
  '--exclude=scripts/scratch_*',
  'server.js',
  'auth.js',
  'database.js',
  'package.json',
  'package-lock.json',
  'serverSeeds.json',
  'camnex_dev.db',
  'camnex_dev_mysql_dump.sql',
  'public',
  'server',
  'src',
  'scripts',
  'tailwind.config.js',
  'tsconfig.json'
].join(' ');

execSync(tarCmd, { cwd: rootDir, stdio: 'inherit' });

console.log('[3/4] Creating zip archive for cPanel File Manager 1-click unzip...');
const zipCmd = `tar -a -c -f camnex_dev_deployment.zip --exclude=.git --exclude=node_modules --exclude=scratch --exclude=backups --exclude=tests --exclude=.env* --exclude=camnex.db* --exclude=camnex_clean.db* --exclude=camnex_dev_validation.db* --exclude=*.tar.gz --exclude=*.zip --exclude=scripts/test_* --exclude=scripts/scratch_* server.js auth.js database.js package.json package-lock.json serverSeeds.json camnex_dev.db camnex_dev_mysql_dump.sql public server src scripts tailwind.config.js tsconfig.json`;
execSync(zipCmd, { cwd: rootDir, stdio: 'inherit' });

console.log('[4/4] Verifying generated archives...');
const statTar = fs.statSync(archiveTar);
const statZip = fs.statSync(archiveZip);

console.log(`Generated camnex_dev_deployment.tar.gz: ${(statTar.size / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Generated camnex_dev_deployment.zip:    ${(statZip.size / (1024 * 1024)).toFixed(2)} MB`);

// List first few files in tar to verify integrity
console.log('\nArchive file preview:');
const preview = execSync('tar -tf camnex_dev_deployment.tar.gz', { cwd: rootDir, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
console.log(`Total files bundled: ${preview.length}`);
console.log('Sample entries:\n ', preview.slice(0, 15).join('\n  '));

