const { AsyncLocalStorage } = require('node:async_hooks');

console.log('=================================================================');
console.log('CamneX Bangladesh: MySQL Driver & Query Translation Test Suite');
console.log('=================================================================\n');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

// 1. Query Translator Unit Tests
console.log('--- 1. Testing SQL Query Translation (SQLite -> MySQL) ---');

function translateSqliteToMysql(sql) {
  let s = sql;
  s = s.replace(/INSERT\s+OR\s+IGNORE(\s+INTO)?/gi, 'INSERT IGNORE INTO');
  s = s.replace(/INSERT\s+OR\s+REPLACE(\s+INTO)?/gi, 'REPLACE INTO');
  s = s.replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]\+(\d+)\s*minutes?['"]\s*\)/gi, 'NOW() + INTERVAL $1 MINUTE');
  s = s.replace(/datetime\s*\(\s*['"]now['"]\s*,\s*['"]-(\d+)\s*minutes?['"]\s*\)/gi, 'NOW() - INTERVAL $1 MINUTE');
  s = s.replace(/datetime\s*\(\s*['"]now['"]\s*\)/gi, 'NOW()');
  s = s.replace(/json_extract\s*\(\s*([a-zA-Z0-9_.]+)\s*,\s*(['"]\$\.[^'"]+['"])\s*\)/gi, '$1->>$2');
  s = s.replace(/ON\s+CONFLICT\s*\([^)]*\)\s*DO\s+UPDATE\s+SET/gi, 'ON DUPLICATE KEY UPDATE');
  s = s.replace(/excluded\.([a-zA-Z0-9_]+)/gi, 'VALUES($1)');
  return s;
}

// Test 1: INSERT OR IGNORE
const t1 = translateSqliteToMysql("INSERT OR IGNORE INTO products (id, name) VALUES (?, ?)");
assert(t1.includes("INSERT IGNORE INTO products"), "INSERT OR IGNORE converted to INSERT IGNORE INTO");

// Test 2: INSERT OR REPLACE
const t2 = translateSqliteToMysql("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
assert(t2.includes("REPLACE INTO settings"), "INSERT OR REPLACE converted to REPLACE INTO");

// Test 3: datetime('now')
const t3 = translateSqliteToMysql("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')");
assert(t3.includes("NOW()") && !t3.includes("datetime("), "datetime('now') converted to NOW()");

// Test 4: datetime('now', '+15 minutes')
const t4 = translateSqliteToMysql("INSERT INTO oauth_states VALUES (?, 'google', ?, ?, datetime('now', '+15 minutes'))");
assert(t4.includes("NOW() + INTERVAL 15 MINUTE"), "datetime('now', '+15 minutes') converted to NOW() + INTERVAL 15 MINUTE");

// Test 5: datetime('now', '-10 minutes')
const t5 = translateSqliteToMysql("WHERE phone = ? AND created_at > datetime('now', '-10 minutes')");
assert(t5.includes("NOW() - INTERVAL 10 MINUTE"), "datetime('now', '-10 minutes') converted to NOW() - INTERVAL 10 MINUTE");

// Test 6: json_extract
const t6 = translateSqliteToMysql("SELECT * FROM orders WHERE json_extract(o.data_json, '$.customerId') = ?");
assert(t6.includes("o.data_json->>'$.customerId'"), "json_extract converted to MySQL ->> syntax");

// Test 7: ON CONFLICT ... DO UPDATE SET ... excluded.col
const t7 = translateSqliteToMysql("INSERT INTO settings (key, value) VALUES ('site_settings', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
assert(t7.includes("ON DUPLICATE KEY UPDATE value = VALUES(value)"), "ON CONFLICT DO UPDATE SET converted to ON DUPLICATE KEY UPDATE with VALUES()");

// 2. Fail-Fast Validation Test
console.log('\n--- 2. Testing DB_CLIENT=mysql Fail-Fast Validation ---');
let caughtError = null;
try {
  process.env.DB_CLIENT = 'mysql';
  delete process.env.DB_USER;
  delete process.env.DB_NAME;
  // Clear require cache for database.js
  delete require.cache[require.resolve('../database.js')];
  require('../database.js');
} catch (err) {
  caughtError = err;
} finally {
  delete process.env.DB_CLIENT;
}

assert(caughtError !== null, "DB_CLIENT=mysql threw error when DB_USER and DB_NAME were missing");
assert(caughtError && caughtError.message.includes("Silent fallback to SQLite is strictly forbidden"),
  "Error message explicitly states silent fallback to SQLite is forbidden");

// 3. ALS Transaction Binding Test
console.log('\n--- 3. Testing AsyncLocalStorage Transaction Context Binding ---');
const als = new AsyncLocalStorage();
class MockConn {
  constructor(id) { this.id = id; this.executed = []; }
  query(sql) { this.executed.push(sql); return Promise.resolve([[]]); }
}
const mockPool = { query: (s) => Promise.resolve([`pool_${s}`]) };
const conn = new MockConn(42);

als.run(conn, () => {
  const active = als.getStore() || mockPool;
  assert(active === conn && active.id === 42, "Queries inside transaction scope resolve to dedicated transaction connection");
});

const outsideActive = als.getStore() || mockPool;
assert(outsideActive === mockPool, "Queries outside transaction scope resolve to connection pool");

console.log('\n=================================================================');
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log('=================================================================');

if (failed > 0) process.exit(1);

