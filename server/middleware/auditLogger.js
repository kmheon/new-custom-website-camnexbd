/**
 * Audit Logger Service
 * Writes immutable audit logs for domain mutations (matches audit_logs schema in database.js).
 */

const crypto = require('crypto');
const db = require('../../database');

function computeDiff(before, after) {
  if (!before && !after) return null;
  if (!before && after) return { created: { old: null, new: after } };
  if (before && !after) return { deleted: { old: before, new: null } };
  if (typeof before !== 'object' || typeof after !== 'object') {
    return { value: { old: before, new: after } };
  }
  const diff = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of allKeys) {
    const oldVal = before[k];
    const newVal = after[k];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[k] = { old: oldVal, new: newVal };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}

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
  diff = null,
  ip = null,
  userAgent = null
}) {
  try {
    const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const diffData = diff || computeDiff(before, after);
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_email, surface, entity_type, entity_id, action, before_data, after_data, diff, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, actorId, actorName, actorEmail, surface, String(entity), String(entityId), action,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      diffData ? JSON.stringify(diffData) : null,
      ip,
      userAgent
    );
    return id;
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err.message);
    return null;
  }
}

module.exports = { logAudit };
