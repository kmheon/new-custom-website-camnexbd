#!/usr/bin/env node
/**
 * Test Suite: Domain Events and Outbox Worker
 * Verifies:
 * 1. Transactional emission of events into domain_events outbox.
 * 2. Outbox worker processing pending events.
 * 3. Registered event handlers running with payload and event metadata.
 * 4. Error retry mechanism: failing handler retries up to 3 times before becoming 'failed'.
 * 5. Successful handlers marked 'processed' with processed_at timestamp.
 */

const assert = require('assert');
const path = require('path');
const db = require('../database');
const {
  emitDomainEvent,
  onDomainEvent,
  processPendingEvents
} = require('../server/middleware/events');

async function run() {
  console.log('--- DOMAIN EVENTS & OUTBOX WORKER TEST SUITE ---');

  // Clean any old test events
  db.prepare("DELETE FROM domain_events WHERE aggregate_id LIKE 'test-%'").run();

  let passed = 0;
  function pass(msg) {
    console.log(`[PASS] ${msg}`);
    passed++;
  }

  // 1. Emit and process successful event
  let handledNormalPayload = null;
  onDomainEvent('test.event.success', (payload) => {
    handledNormalPayload = payload;
  });

  const evtId1 = emitDomainEvent('test.event.success', {
    id: 'test-success-1',
    message: 'Testing outbox'
  });
  assert(evtId1, 'Event ID should be returned');

  let row1 = db.prepare('SELECT * FROM domain_events WHERE id = ?').get(evtId1);
  assert.strictEqual(row1.status, 'pending', 'Initial status must be pending');
  assert.strictEqual(row1.attempts, 0, 'Initial attempts must be 0');
  assert.strictEqual(row1.processed_at, null, 'Initial processed_at must be null');
  pass('Event emitted transactionally with status pending and 0 attempts');

  // Process worker run
  await processPendingEvents();

  row1 = db.prepare('SELECT * FROM domain_events WHERE id = ?').get(evtId1);
  assert.strictEqual(row1.status, 'processed', 'Status should be processed after worker run');
  assert.strictEqual(row1.attempts, 1, 'Attempts should be 1');
  assert(row1.processed_at, 'processed_at must be populated');
  assert.strictEqual(handledNormalPayload?.message, 'Testing outbox', 'Handler must have received payload');
  pass('Outbox worker processed pending event and ran subscriber handler');

  // 2. Retry up to 3 times and mark failed on 3rd attempt
  let failHandlerCallCount = 0;
  onDomainEvent('test.event.failing', () => {
    failHandlerCallCount++;
    throw new Error('Simulated transient worker failure');
  });

  const evtId2 = emitDomainEvent('test.event.failing', {
    id: 'test-failing-1'
  });

  // Attempt 1
  await processPendingEvents();
  let row2 = db.prepare('SELECT * FROM domain_events WHERE id = ?').get(evtId2);
  assert.strictEqual(row2.status, 'pending', 'Status after 1st failure should remain pending for retry');
  assert.strictEqual(row2.attempts, 1, 'Attempts should be 1');
  assert(row2.last_error?.includes('Simulated transient worker failure'), 'last_error should record failure message');
  assert.strictEqual(row2.processed_at, null, 'processed_at must be null while pending retry');
  pass('Failing event retried on 1st failure (status pending, attempts 1)');

  // Attempt 2
  await processPendingEvents();
  row2 = db.prepare('SELECT * FROM domain_events WHERE id = ?').get(evtId2);
  assert.strictEqual(row2.status, 'pending', 'Status after 2nd failure should remain pending for retry');
  assert.strictEqual(row2.attempts, 2, 'Attempts should be 2');
  pass('Failing event retried on 2nd failure (status pending, attempts 2)');

  // Attempt 3 -> Marks failed
  await processPendingEvents();
  row2 = db.prepare('SELECT * FROM domain_events WHERE id = ?').get(evtId2);
  assert.strictEqual(row2.status, 'failed', 'Status after 3rd failure must transition to failed');
  assert.strictEqual(row2.attempts, 3, 'Attempts should be 3');
  assert(row2.processed_at, 'processed_at should be marked after max attempts exhausted');
  assert.strictEqual(failHandlerCallCount, 3, 'Handler should have been executed exactly 3 times');
  pass('Failing event marks failed after exhausting 3 attempts with timestamp');

  // 3. Verify event types coverage in domain_events table
  const testTypes = [
    'catalog.product.created',
    'catalog.product.updated',
    'catalog.product.archived',
    'pricing.changed',
    'inventory.adjusted',
    'order.placed',
    'order.status_changed',
    'order.paid',
    'customer.registered',
    'staff.user_created',
    'staff.user_disabled'
  ];

  for (const t of testTypes) {
    const id = emitDomainEvent(t, { id: `test-${t}`, detail: 'audit validation' });
    assert(id, `Event ${t} should emit successfully`);
  }
  await processPendingEvents();

  for (const t of testTypes) {
    const row = db.prepare('SELECT status FROM domain_events WHERE event_type = ? AND aggregate_id = ?').get(t, `test-${t}`);
    assert(row, `Event row for ${t} should exist`);
    assert.strictEqual(row.status, 'processed', `Event ${t} should be processed`);
  }
  pass('All standard platform domain event types emitted and processed');

  // Cleanup test rows
  db.prepare("DELETE FROM domain_events WHERE aggregate_id LIKE 'test-%'").run();

  console.log(`\nDOMAIN EVENTS SUITE: ${passed} passed, 0 failed\n`);
}

if (require.main === module) {
  run().catch(err => {
    console.error('DOMAIN EVENTS TEST FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };

