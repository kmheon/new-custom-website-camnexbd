const assert = require('assert');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

console.log('================================================================');
console.log('TEST SUITE: STAFF AUTHENTICATION & ADMIN PASSWORD RESET');
console.log('================================================================\n');

// Use an isolated temporary SQLite database
const tempDbPath = path.join(__dirname, 'temp_auth_test.db');
if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

process.env.DATABASE_PATH = tempDbPath;
process.env.DB_CLIENT = 'sqlite';
process.env.SKIP_SEED = '1';

const db = require('../database');
const staffService = require('../server/modules/staff/staff.service');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    console.error(err.stack);
  }
}

async function run() {
  console.log('--- 1. Testing Input Validation in staffService.login ---');

  test('Missing email rejects with 400', () => {
    assert.throws(() => staffService.login('', 'Password123!'), (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('Email is required'));
      return true;
    });
  });

  test('Non-string email rejects with 400', () => {
    assert.throws(() => staffService.login(null, 'Password123!'), (err) => {
      assert.strictEqual(err.statusCode, 400);
      return true;
    });
  });

  test('Missing password rejects with 400', () => {
    assert.throws(() => staffService.login('admin@camnexbd.com', ''), (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.ok(err.message.includes('Password is required'));
      return true;
    });
  });

  console.log('\n--- 2. Testing Missing User & Missing Password Hash ---');

  test('Non-existent user rejects with 401', () => {
    assert.throws(() => staffService.login('nonexistent@camnexbd.com', 'Password123!'), (err) => {
      assert.strictEqual(err.statusCode, 401);
      assert.ok(err.message.includes('Invalid email or password'));
      return true;
    });
  });

  // Seed user without password_hash (e.g. empty string)
  db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, role)
    VALUES ('usr-corrupt', 'Corrupt User', 'corrupt@camnexbd.com', '', 'admin')
  `).run();

  test('Missing password_hash rejects cleanly with 401 (not 500 Illegal arguments)', () => {
    assert.throws(() => staffService.login('corrupt@camnexbd.com', 'Password123!'), (err) => {
      assert.strictEqual(err.statusCode, 401);
      assert.ok(!err.message.includes('Illegal arguments'));
      return true;
    });
  });

  console.log('\n--- 3. Testing Authentication & Session Invalidation ---');

  const oldPassword = 'OldInitialPassword123!';
  const oldHash = bcrypt.hashSync(oldPassword, 10);
  const adminId = 'usr-admin-1';
  const otherId = 'usr-other-2';

  db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, role)
    VALUES (?, 'CamneX Admin', 'admin@camnexbd.com', ?, 'admin')
  `).run(adminId, oldHash);

  const otherPassword = 'OtherUserPassword123!';
  const otherHash = bcrypt.hashSync(otherPassword, 10);
  db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, role)
    VALUES (?, 'Other Staff', 'staff@camnexbd.com', ?, 'staff')
  `).run(otherId, otherHash);

  // Insert active session for admin and other user
  db.prepare(`
    INSERT OR REPLACE INTO sessions (id, user_id, role, email, name, expires_at)
    VALUES ('sess-admin-1', ?, 'admin', 'admin@camnexbd.com', 'CamneX Admin', datetime('now', '+1 day')),
           ('sess-other-1', ?, 'staff', 'staff@camnexbd.com', 'Other Staff', datetime('now', '+1 day'))
  `).run(adminId, otherId);

  test('Correct old password authenticates successfully', () => {
    const result = staffService.login('admin@camnexbd.com', oldPassword);
    assert.strictEqual(result.id, adminId);
    assert.strictEqual(result.email, 'admin@camnexbd.com');
  });

  test('Incorrect password rejects with 401', () => {
    assert.throws(() => staffService.login('admin@camnexbd.com', 'WrongPassword123!'), (err) => {
      assert.strictEqual(err.statusCode, 401);
      return true;
    });
  });

  console.log('\n--- 4. Testing Password Reset Functionality ---');

  const newPassword = 'NewStrongPassword456!';
  process.env.NEW_ADMIN_PASSWORD = newPassword;

  // Run password reset logic directly
  const newHash = bcrypt.hashSync(newPassword, 10);
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(newHash, adminId);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(adminId);
  });
  tx();

  test('New password authenticates successfully', () => {
    const result = staffService.login('admin@camnexbd.com', newPassword);
    assert.strictEqual(result.id, adminId);
  });

  test('Old password is now rejected with 401', () => {
    assert.throws(() => staffService.login('admin@camnexbd.com', oldPassword), (err) => {
      assert.strictEqual(err.statusCode, 401);
      return true;
    });
  });

  test('Admin session was invalidated', () => {
    const sess = db.prepare('SELECT * FROM sessions WHERE id = ?').get('sess-admin-1');
    assert.strictEqual(sess, undefined);
  });

  test('Other user was not modified or invalidated', () => {
    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherId);
    assert.strictEqual(otherUser.password_hash, otherHash);
    const otherSess = db.prepare('SELECT * FROM sessions WHERE id = ?').get('sess-other-1');
    assert.ok(otherSess, 'Other user session must still exist');
  });

  console.log('\n================================================================');
  console.log(`Results: ${passed} / ${total} tests passed.`);
  console.log('================================================================\n');

  // Teardown
  try {
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
  } catch (_) {}

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
