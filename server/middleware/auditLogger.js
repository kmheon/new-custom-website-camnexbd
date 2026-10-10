/**
 * Audit Logger Service
 * Writes immutable audit logs for domain mutations (matches audit_logs schema in database.js).
 */

const crypto = require('crypto');
const db = require('../../database');

function logAudit({
  entity,
  entityId,
  action,
  actorId = null,
  actorName = null,
  actorEmail = null,
  surface = 'api',
  before = null,
  after = null,
  ip = null
}) {
  try {
    const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_email, surface, entity_type, entity_id, action, before_data, after_data, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, actorId, actorName, actorEmail, surface, String(entity), String(entityId), action,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      ip
    );
    return id;
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err.message);
    return null;
  }
}

module.exports = { logAudit };
