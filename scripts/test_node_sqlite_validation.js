const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Force USE_NODE_SQLITE=1 and point to isolated validation copy
process.env.USE_NODE_SQLITE = '1';
delete process.env.DB_CLIENT; // ensure not mysql
process.env.DB_PATH = path.join(__dirname, '..', 'camnex_dev_validation.db');

console.log('=================================================================');
console.log('CamneX Bangladesh: Comprehensive node:sqlite Validation Suite');
console.log('=================================================================');

// 1. Module resolution and active engine verification
console.log('\n--- 1. Testing Engine Selection & Module Resolution ---');
let dbModule;
try {
  dbModule = require('../database.js');
} catch (err) {
  console.error('[FAIL] Error loading database.js:', err);
  process.exit(1);
}

const db = dbModule;
assert.strictEqual(db._engine, 'node:sqlite', 'Database engine must be node:sqlite');
assert.ok(db._raw, 'Database _raw instance must exist');
console.log('  [PASS] database.js initialized with _engine:', db._engine);

// Verify better-sqlite3 was NOT loaded into require.cache
const loadedBetterSqlite = Object.keys(require.cache).some(k => k.includes('better-sqlite3'));
assert.strictEqual(loadedBetterSqlite, false, 'better-sqlite3 must NOT be loaded when USE_NODE_SQLITE=1');
console.log('  [PASS] better-sqlite3 native addon was NOT loaded into require cache');

// 2. Synchronous Reads: prepare().get() and prepare().all()
console.log('\n--- 2. Testing Synchronous Reads (get and all) ---');
const catRow = db.prepare('SELECT id, name, slug FROM categories ORDER BY id ASC LIMIT 1').get();
assert.ok(catRow, 'Category row must be returned');
assert.ok(catRow.id, 'Category must have an id');
console.log(`  [PASS] Synchronous get() returned category: id=${catRow.id}, name=${catRow.name}`);

const prodRows = db.prepare("SELECT id, name, price, stock_quantity FROM products WHERE status = 'active' LIMIT 5").all();
assert.ok(Array.isArray(prodRows), 'Products must be an array');
assert.ok(prodRows.length > 0, 'Products array must not be empty');
console.log(`  [PASS] Synchronous all() returned ${prodRows.length} products`);

// Verify get() on empty result returns undefined synchronously
const nonExistent = db.prepare('SELECT * FROM products WHERE id = ?').get('non-existent-prod-id-99999');
assert.strictEqual(nonExistent, undefined, 'get() with no match must return undefined synchronously');
console.log('  [PASS] get() on missing row returns undefined synchronously');

// 3. Synchronous Writes: prepare().run() with changes and lastInsertRowid
console.log('\n--- 3. Testing Synchronous Writes (run) ---');
const testKey = 'test_validation_key_' + Date.now();
const testVal = 'val_' + Math.random().toString(36).substring(2, 9);
const insertRes = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(testKey, testVal);
assert.strictEqual(insertRes.changes, 1, 'insert must report 1 change');
console.log(`  [PASS] Synchronous run() insert reported changes=${insertRes.changes}`);

const readBack = db.prepare('SELECT value FROM settings WHERE key = ?').get(testKey);
assert.strictEqual(readBack.value, testVal, 'readBack value must match inserted value');
console.log('  [PASS] Inserted value read back successfully');

const updateRes = db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('updated_val', testKey);
assert.strictEqual(updateRes.changes, 1, 'update must report 1 change');
const readBackUpdated = db.prepare('SELECT value FROM settings WHERE key = ?').get(testKey);
assert.strictEqual(readBackUpdated.value, 'updated_val', 'updated value must match');
console.log('  [PASS] Synchronous run() update reported changes=1 and updated correctly');

const deleteRes = db.prepare('DELETE FROM settings WHERE key = ?').run(testKey);
assert.strictEqual(deleteRes.changes, 1, 'delete must report 1 change');
console.log('  [PASS] Synchronous run() delete reported changes=1');

// 4. PRAGMA queries and WAL mode
console.log('\n--- 4. Testing PRAGMA and Schema Operations ---');
const journalMode = db.pragma('journal_mode', { simple: true });
console.log('  [PASS] PRAGMA journal_mode returned:', journalMode);
const foreignKeys = db.pragma('foreign_keys', { simple: true });
console.log('  [PASS] PRAGMA foreign_keys returned:', foreignKeys);

// 5. Transaction behavior (commit, nested savepoints, rollback)
console.log('\n--- 5. Testing Transactions & Savepoints ---');
const initialCount = db.prepare('SELECT count(*) as count FROM settings').get().count;

const successfulTx = db.transaction(() => {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('test_tx_key_1', 'val1');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('test_tx_key_2', 'val2');
});
successfulTx();

const afterCommitCount = db.prepare('SELECT count(*) as count FROM settings').get().count;
assert.strictEqual(afterCommitCount, initialCount + 2, 'Two records must be committed');
console.log('  [PASS] db.transaction() successfully committed changes');

// Test transaction rollback
let rollbackThrew = false;
try {
  const failingTx = db.transaction(() => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('test_tx_key_3', 'val3');
    throw new Error('Intentional transaction error');
  });
  failingTx();
} catch (e) {
  rollbackThrew = true;
}
assert.strictEqual(rollbackThrew, true, 'Transaction must throw on error');
const afterRollbackCount = db.prepare('SELECT count(*) as count FROM settings').get().count;
assert.strictEqual(afterRollbackCount, afterCommitCount, 'Rollback must revert inserted records');
console.log('  [PASS] db.transaction() successfully rolled back changes on exception');

// Test nested transaction (savepoint)
const nestedTx = db.transaction(() => {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('test_tx_outer', 'val_outer');
  const innerTx = db.transaction(() => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('test_tx_inner', 'val_inner');
  });
  innerTx();
});
nestedTx();
const afterNestedCount = db.prepare('SELECT count(*) as count FROM settings').get().count;
assert.strictEqual(afterNestedCount, afterCommitCount + 2, 'Nested transaction must commit both outer and inner');
console.log('  [PASS] Nested transaction savepoint committed successfully');

// Clean up test records
db.prepare("DELETE FROM settings WHERE key LIKE 'test_tx_%'").run();

// 6. Authentication and Session Lookups
console.log('\n--- 6. Testing Authentication and Session Queries ---');
const adminUser = db.prepare("SELECT id, email, password_hash, role, status FROM users WHERE email = 'admin@camnexbd.com'").get();
assert.ok(adminUser, 'Admin user must exist');
assert.strictEqual(adminUser.role, 'admin', 'Admin role must be admin');
assert.strictEqual(adminUser.status, 'active', 'Admin status must be active');
assert.ok(adminUser.password_hash.startsWith('$2'), 'Password hash must be bcrypt');
console.log(`  [PASS] Admin user lookup successful: email=${adminUser.email}, role=${adminUser.role}`);

// Test session creation and lookup
const testSessionId = 'test_sess_' + Date.now();
const expiresAt = new Date(Date.now() + 86400000).toISOString();
db.prepare(`
  INSERT INTO sessions (id, user_id, role, email, name, expires_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(testSessionId, adminUser.id, adminUser.role, adminUser.email, 'Admin User', expiresAt);

const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(testSessionId);
assert.ok(sessionRow, 'Session row must be retrieved by id');
assert.strictEqual(sessionRow.user_id, adminUser.id, 'Session must belong to admin user');
assert.strictEqual(sessionRow.role, 'admin', 'Session role must match');
console.log('  [PASS] Session created and fetched by id synchronously');

db.prepare('DELETE FROM sessions WHERE id = ?').run(testSessionId);
console.log('  [PASS] Test session cleaned up');

// 7. Cleanup & Close
console.log('\n--- 7. Testing Close & Lifecyle ---');
assert.strictEqual(typeof db.close, 'function', 'db.close must be a function');
assert.strictEqual(typeof db.isClosed, 'function', 'db.isClosed must be a function');
assert.strictEqual(db.isClosed(), false, 'db.isClosed() must be false initially');

console.log('\n=================================================================');
console.log('All node:sqlite Validation Tests Passed Successfully!');
console.log('=================================================================');
