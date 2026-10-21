#!/usr/bin/env node
/**
 * CamneX Platform - Secure Administrator Password Reset Utility
 *
 * Prompts interactively for a new administrator password (or reads from NEW_ADMIN_PASSWORD env),
 * hashes it using bcrypt (salt rounds = 10), updates the user record, invalidates all existing
 * administrator sessions, and logs an audit entry.
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

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE LOWER(email) = ?').get(targetEmail);
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

  console.log('[2/3] Updating database credentials and invalidating active sessions...');
  const tx = db.transaction(() => {
    const updateResult = db.prepare(`
      UPDATE users
      SET password_hash = ?,
          must_change_password = 0,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(hash, user.id);

    if (updateResult && updateResult.changes === 0) {
      throw new Error(`Failed to update password: user ${user.id} was not modified.`);
    }

    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO audit_logs (id, entity, entity_id, action, actor_id, actor_name, changes_json, created_at)
      VALUES (?, 'users', ?, 'password_reset', 'system-cli', 'CLI Admin Tool', ?, datetime('now'))
    `).run(
      auditId,
      user.id,
      JSON.stringify({
        action: 'password_reset',
        targetEmail: user.email,
        sessionsRevoked: true,
        resetTimestamp: new Date().toISOString()
      })
    );
  });

  tx();

  console.log('[3/3] Administrator password updated successfully!');
  console.log(`  Target Email: ${user.email}`);
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
