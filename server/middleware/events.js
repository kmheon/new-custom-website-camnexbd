/**
 * Domain Events & Outbox Pattern Worker (matches domain_events schema in database.js)
 */

const crypto = require('crypto');
const db = require('../../database');

const subscribers = {};

function onDomainEvent(eventType, handler) {
  (subscribers[eventType] = subscribers[eventType] || []).push(handler);
}

function emitDomainEvent(eventType, payload = {}) {
  try {
    const id = `evt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const aggregateType = String(eventType).split('.')[0];
    const aggregateId = String(payload.id || payload.productId || payload.orderId || payload.categoryId || payload.brandId || 'n/a');
    db.prepare(`
      INSERT INTO domain_events (id, event_type, aggregate_type, aggregate_id, payload, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(id, eventType, aggregateType, aggregateId, JSON.stringify(payload));
    return id;
  } catch (err) {
    console.error('[DOMAIN EVENT ERROR]', err.message);
    return null;
  }
}

function processPendingEvents() {
  try {
    const events = db.prepare(`SELECT * FROM domain_events WHERE status = 'pending' ORDER BY created_at ASC LIMIT 20`).all();
    for (const event of events) {
      let payload = {};
      try { payload = JSON.parse(event.payload); } catch (_) {}
      let error = null;
      for (const handler of subscribers[event.event_type] || []) {
        try { handler(payload, event); } catch (e) { error = e.message; }
      }
      db.prepare(`
        UPDATE domain_events
        SET status = ?, attempts = attempts + 1, last_error = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(error ? 'failed' : 'processed', error, event.id);
    }
  } catch (_) {}
}

let workerInterval = null;
function startDomainEventWorker(intervalMs = 3000) {
  if (workerInterval) return;
  workerInterval = setInterval(processPendingEvents, intervalMs);
  if (workerInterval.unref) workerInterval.unref();
}

module.exports = { emitDomainEvent, onDomainEvent, processPendingEvents, startDomainEventWorker };
