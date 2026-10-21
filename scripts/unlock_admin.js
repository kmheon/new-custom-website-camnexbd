#!/usr/bin/env node
/**
 * CamneX Platform - Safe Targeted Administrator Account Unlock Recovery Tool
 *
 * Safely clears active or expired account lockouts (resets failed_login_attempts to 0
 * and locked_until to NULL) for a specific user without modifying passwords,
 * sessions, or global security/rate-limiting controls.
 *
 * Usage:
 *   node scripts/unlock_admin.js [email]
 *   node scripts/unlock_admin.js admin@camnexbd.com
 */

const db = require('../database');

async function unlockUser(email) {
  const targetEmail = (email || process.env.ADMIN_EMAIL || 'admin@camnexbd.com').trim().toLowerCase();

  if (!targetEmail || !targetEmail.includes('@') || targetEmail.length < 5) {
    throw new Error(`Invalid or malformed email address: "${email || ''}"`);
  }

  const user = db.prepare(`
    SELECT id, name, email, role, status, failed_login_attempts, locked_until
    FROM users
    WHERE LOWER(email) = ?
  `).get(targetEmail);

  if (!user || !user.id || !user.email) {
    throw new Error(`User not found with email: ${targetEmail}`);
  }

  const beforeState = {
    failed_login_attempts: user.failed_login_attempts !== undefined ? Number(user.failed_login_attempts) : 0,
    locked_until: user.locked_until || null
  };

  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const auditPayload = JSON.stringify({
    action: 'admin_account_unlock',
    targetEmail: user.email,
    previousFailedAttempts: beforeState.failed_login_attempts,
    previousLockedUntil: beforeState.locked_until,
    unlockedAt: new Date().toISOString()
  });

  const tx = db.transaction(() => {
    // 1. Reset lockout counters strictly for this target user
    const updateResult = db.prepare(`
      UPDATE users
      SET failed_login_attempts = 0,
          locked_until = NULL
      WHERE id = ?
    `).run(user.id);

    if (updateResult && updateResult.changes === 0) {
      throw new Error(`Failed to unlock account: user ${user.id} was not updated.`);
    }

    // 2. Insert audit log entry matching canonical audit_logs schema
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_email, surface, entity_type, entity_id, action, after_data)
      VALUES (?, ?, ?, ?, 'cli', 'users', ?, 'account_unlock', ?)
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

  // 3. Verify resulting database state directly
  const verified = db.prepare(`
    SELECT id, email, failed_login_attempts, locked_until
    FROM users
    WHERE id = ?
  `).get(user.id);

  if (!verified) {
    throw new Error('User record could not be re-queried after update.');
  }

  const afterState = {
    failed_login_attempts: Number(verified.failed_login_attempts || 0),
    locked_until: verified.locked_until || null
  };

  if (afterState.failed_login_attempts !== 0 || afterState.locked_until !== null) {
    throw new Error(`Verification failed: failed_login_attempts=${afterState.failed_login_attempts}, locked_until=${afterState.locked_until}`);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    },
    before: beforeState,
    after: afterState,
    auditId
  };
}

async function main() {
  console.log('================================================================');
  console.log('CAMNEX PLATFORM - SAFE TARGETED ACCOUNT UNLOCK UTILITY');
  console.log('================================================================');

  const rawArg = process.argv[2];
  const targetEmail = (rawArg || process.env.ADMIN_EMAIL || 'admin@camnexbd.com').trim().toLowerCase();

  try {
    console.log(`[1/3] Locating account: ${targetEmail}...`);
    const result = await unlockUser(targetEmail);

    console.log(`[2/3] Account located: ${result.user.name} (${result.user.email}) [Role: ${result.user.role}]`);
    console.log(`  Previous State: failed_login_attempts = ${result.before.failed_login_attempts}, locked_until = ${result.before.locked_until || 'NULL'}`);

    console.log('[3/3] Account lockout successfully reset and verified in database!');
    console.log(`  Current State:  failed_login_attempts = ${result.after.failed_login_attempts}, locked_until = NULL`);
    console.log(`  Security Audit: Logged under ID ${result.auditId}`);
    console.log('================================================================');
    console.log('Status: ACCOUNT UNLOCKED & READY FOR LOGIN');
    console.log('================================================================');
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    if (typeof db.close === 'function') {
      try { db.close(); } catch (_) {}
    }
    process.exit(1);
  }

  if (typeof db.close === 'function') {
    try { db.close(); } catch (_) {}
  }
}

if (require.main === module) {
  main();
}

module.exports = { unlockUser, main };
