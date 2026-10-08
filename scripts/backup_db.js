#!/usr/bin/env node
// scripts/backup_db.js
// Safe SQLite database backup script with WAL checkpointing

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'camnex.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function backupDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`[ERROR] Source database not found at: ${DB_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const backupFileName = `camnex_backup_${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log(`[BACKUP] Opening live database: ${DB_PATH}`);
  const liveDb = new Database(DB_PATH);

  try {
    // 1. Force a WAL checkpoint to ensure all uncommitted transactions are flushed
    console.log('[BACKUP] Running WAL checkpoint (TRUNCATE)...');
    liveDb.pragma('wal_checkpoint(TRUNCATE)');

    // 2. Perform online SQLite backup
    console.log(`[BACKUP] Writing backup snapshot to: ${backupFilePath}`);
    liveDb.backup(backupFilePath)
      .then(() => {
        const stats = fs.statSync(backupFilePath);
        console.log(`[BACKUP SUCCESS] Backup created: ${backupFileName} (${(stats.size / 1024).toFixed(1)} KB)`);

        // 3. Verify backup database integrity
        const testDb = new Database(backupFilePath, { readonly: true });
        const integrityCheck = testDb.pragma('quick_check');
        testDb.close();
        liveDb.close();

        if (integrityCheck[0]?.integrity_check === 'ok' || integrityCheck[0]?.quick_check === 'ok') {
          console.log('[BACKUP VERIFIED] Integrity check passed successfully.');
          console.log('\n--- RESTORE INSTRUCTIONS ---');
          console.log(`To restore this backup:`);
          console.log(`1. Stop the application: pm2 stop camnex (or systemctl stop camnex)`);
          console.log(`2. Copy backup file over live database:`);
          console.log(`   cp "${backupFilePath}" "${DB_PATH}"`);
          console.log(`3. Restart the application: pm2 start camnex`);
          process.exit(0);
        } else {
          console.error('[ERROR] Backup integrity check failed:', integrityCheck);
          process.exit(1);
        }
      })
      .catch((err) => {
        liveDb.close();
        console.error('[ERROR] Backup operation failed:', err);
        process.exit(1);
      });
  } catch (err) {
    liveDb.close();
    console.error('[ERROR] WAL Checkpoint failed:', err);
    process.exit(1);
  }
}

backupDatabase();

