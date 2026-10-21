#!/usr/bin/env node
/**
 * CamneX Platform - Secure Administrator Password Reset Utility
 *
 * Resets the administrator password, clears any active login lockouts,
 * invalidates existing administrator sessions, and logs a structured
 * security audit entry using the real database schema.
 *
 * Usage:
 *   node scripts/reset_admin_password.js [email]
 *   NEW_ADMIN_PASSWORD="StrongNewPassword123!" node scripts/reset_admin_password.js admin@camnexbd.com
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../database');

async function askPassword(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log('CAMNEX PLATFORM - SECURE ADMINISTRATOR PASSWORD RESET');
  console.log('================================================================');

  const rawArg = process.argv[2];
  const targetEmail = (rawArg || process.env.ADMIN_EMAIL || 'admin@camnexbd.com').trim().toLowerCase();

  if (!targetEmail || !targetEmail.includes('@') || targetEmail.length < 5) {
    console.error(`[ERROR] Invalid or malformed email address: "${rawArg || ''}"`);
    console.error('  Usage: node scripts/reset_admin_password.js <admin-email>');
    console.error('  Example: node scripts/reset_admin_password.js admin@camnexbd.com');
    process.exit(1);
  }

  const user = db.prepare('SELECT id, name, email, role, failed_login_attempts, locked_until FROM users WHERE LOWER(email) = ?').get(targetEmail);
  if (!user || !user.id || !user.email) {
    console.error(`[ERROR] User not found with email: ${targetEmail}`);
    process.exit(1);
  }

  let newPass = (process.env.NEW_ADMIN_PASSWORD || '').trim();
  if (!newPass) {
    newPass = await askPassword(`Enter new password for ${user.email} (${user.role}): `);
  }

  if (!newPass || typeof newPass !== 'string' || newPass.trim().length < 8) {
    console.error('[ERROR] Password must be at least 8 characters long.');
    process.exit(1);
  }
  newPass = newPass.trim();

  console.log('\n[1/3] Hashing password with bcrypt (cost = 10)...');
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPass, salt);

  console.log('[2/3] Updating database credentials, clearing account lockout, and invalidating sessions...');
  const tx = db.transaction(() => {
    // 1. Update password, reset force-change flag, and clear failed attempt lockout counters
    // Note: 'updated_at' is omitted as it does not exist on the production users schema.
    const updateResult = db.prepare(`
      UPDATE users
      SET password_hash = ?,
          must_change_password = 0,
          failed_login_attempts = 0,
          locked_until = NULL
      WHERE id = ?
    `).run(hash, user.id);

    if (updateResult && updateResult.changes === 0) {
      throw new Error(`Failed to update password: user ${user.id} was not modified.`);
    }

    // 2. Invalidate existing sessions for this administrator
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

    // 3. Record security audit log entry matching canonical audit_logs schema
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const auditPayload = JSON.stringify({
      action: 'password_reset',
      targetEmail: user.email,
      sessionsRevoked: true,
      lockoutCleared: true,
      resetTimestamp: new Date().toISOString()
    });

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_email, surface, entity_type, entity_id, action, after_data)
      VALUES (?, ?, ?, ?, 'cli', 'users', ?, 'password_reset', ?)
    `).run(
      auditId,
      user.id,
      user.name || 'Administrator',
      user.email,
      user.id,
      auditPayload
    );
  });

  // Execute atomically
  tx();

  // Verify resulting database state directly
  const verified = db.prepare('SELECT id, failed_login_attempts, locked_until, must_change_password FROM users WHERE id = ?').get(user.id);
  if (!verified || verified.failed_login_attempts !== 0 || verified.locked_until !== null) {
    throw new Error(`Database verification failed after reset: failed_attempts=${verified?.failed_login_attempts}, locked_until=${verified?.locked_until}`);
  }

  console.log('[3/3] Administrator password updated successfully!');
  console.log(`  Target Email: ${user.email}`);
  console.log('  Account lockout cleared: Yes (verified: failed_login_attempts=0, locked_until=NULL)');
  console.log('  Active sessions revoked: Yes');
  console.log('  Audit log entry recorded: Yes');
  console.log('================================================================');

  if (typeof db.close === 'function') {
    db.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[FATAL ERROR]', err.message);
    process.exit(1);
  });
}

module.exports = { main };
