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
    const aggregateId = String(payload.id || payload.productId || payload.orderId || payload.categoryId || payload.brandId || payload.userId || 'n/a');
    db.prepare(`
      INSERT INTO domain_events (id, event_type, aggregate_type, aggregate_id, payload, status, attempts)
      VALUES (?, ?, ?, ?, ?, 'pending', 0)
    `).run(id, eventType, aggregateType, aggregateId, JSON.stringify(payload));
    return id;
  } catch (err) {
    console.error('[DOMAIN EVENT ERROR]', err.message);
    return null;
  }
}

async function processPendingEvents() {
  try {
    const events = db.prepare(`SELECT * FROM domain_events WHERE status = 'pending' AND attempts < 3 ORDER BY created_at ASC LIMIT 20`).all();
    for (const event of events) {
      let payload = {};
      try { payload = JSON.parse(event.payload); } catch (_) {}
      let error = null;
      const handlers = subscribers[event.event_type] || [];
      for (const handler of handlers) {
        try {
          const res = handler(payload, event);
          if (res && typeof res.then === 'function') {
            await res;
          }
        } catch (e) {
          error = e.message || String(e);
          break; // Stop subsequent handlers on failure so event can retry
        }
      }

      const attempts = (event.attempts || 0) + 1;
      const isFailed = Boolean(error);
      const newStatus = isFailed ? (attempts >= 3 ? 'failed' : 'pending') : 'processed';
      const markProcessed = newStatus === 'processed' || newStatus === 'failed';

      db.prepare(`
        UPDATE domain_events
        SET status = ?, attempts = ?, last_error = ?, processed_at = ${markProcessed ? 'CURRENT_TIMESTAMP' : 'NULL'}
        WHERE id = ?
      `).run(newStatus, attempts, error || null, event.id);
    }
  } catch (err) {
    console.error('[OUTBOX WORKER ERROR]', err.message);
  }
}

// Phase 1 Handlers (async, idempotent)
function registerPhase1Handlers() {
  // 1. Search index refresh handler
  const handleCatalogIndex = async (payload, event) => {
    // Phase 1: in-memory cache/search re-indexing signal
  };
  onDomainEvent('catalog.product.created', handleCatalogIndex);
  onDomainEvent('catalog.product.updated', handleCatalogIndex);
  onDomainEvent('catalog.product.archived', handleCatalogIndex);
  onDomainEvent('product.created', handleCatalogIndex);
  onDomainEvent('product.updated', handleCatalogIndex);
  onDomainEvent('product.archived', handleCatalogIndex);
  onDomainEvent('category.updated', handleCatalogIndex);

  // 2. Order notification handler
  const handleOrderNotification = async (payload) => {
    // Phase 1: audit/log channel for new orders
  };
  onDomainEvent('order.placed', handleOrderNotification);
  onDomainEvent('order.created', handleOrderNotification);

  // 3. High-value mutation handler
  const handleHighValue = async (payload, event) => {
    // Phase 1: high-value commercial mutation signal
  };
  onDomainEvent('pricing.changed', handleHighValue);
  onDomainEvent('inventory.adjusted', handleHighValue);
  onDomainEvent('stock.changed', handleHighValue);
  onDomainEvent('staff.user_disabled', handleHighValue);
}

registerPhase1Handlers();

let workerInterval = null;
function startDomainEventWorker(intervalMs = 5000) {
  if (workerInterval) return;
  workerInterval = setInterval(processPendingEvents, intervalMs);
  if (workerInterval.unref) workerInterval.unref();
}

function stopDomainEventWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

module.exports = {
  emitDomainEvent,
  onDomainEvent,
  processPendingEvents,
  startDomainEventWorker,
  stopDomainEventWorker,
  _subscribers: subscribers
};
