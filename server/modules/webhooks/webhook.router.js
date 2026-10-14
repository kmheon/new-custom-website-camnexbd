const express = require('express');
const router = express.Router();
const webhookService = require('./webhook.service');
const { requireAdmin } = require('../../middleware/auth');
const { logAudit } = require('../../middleware/auditLogger');

// 1. List Webhook Subscriptions
router.get('/webhooks/subscriptions', requireAdmin, (req, res) => {
  try {
    const subs = webhookService.listSubscriptions();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create Webhook Subscription
router.post('/webhooks/subscriptions', requireAdmin, (req, res) => {
  try {
    const { name, target_url, secret, events } = req.body;
    if (!name || !target_url) {
      return res.status(400).json({ error: 'Name and target_url are required.' });
    }

    const sub = webhookService.createSubscription({ name, target_url, secret, events });

    logAudit({
      entity: 'webhook_subscription',
      entityId: sub.id,
      action: 'create',
      actorId: req.user?.id,
      actorName: req.user?.name,
      surface: 'api_v1',
      after: sub
    });

    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete Webhook Subscription
router.delete('/webhooks/subscriptions/:id', requireAdmin, (req, res) => {
  try {
    const sub = webhookService.getSubscription(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Webhook subscription not found.' });

    webhookService.deleteSubscription(req.params.id);

    logAudit({
      entity: 'webhook_subscription',
      entityId: req.params.id,
      action: 'delete',
      actorId: req.user?.id,
      actorName: req.user?.name,
      surface: 'api_v1',
      before: sub
    });

    res.json({ success: true, message: `Webhook subscription "${sub.name}" deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. List Deliveries
router.get('/webhooks/deliveries', requireAdmin, (req, res) => {
  try {
    const { subscriptionId, limit } = req.query;
    const deliveries = webhookService.listDeliveries(subscriptionId, limit);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Test Webhook Dispatch
router.post('/webhooks/test', requireAdmin, async (req, res) => {
  try {
    const { eventType = 'test.ping', payload = { ping: 'pong', timestamp: new Date().toISOString() } } = req.body;
    const dispatched = await webhookService.dispatch(eventType, payload);
    res.json({ success: true, message: `Dispatched test event to ${dispatched.length} subscriber(s)`, dispatched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

