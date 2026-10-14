/**
 * HMAC-Signed Outbound Webhook Dispatcher
 * Dispatches domain events to registered webhook endpoints with HMAC-SHA256 signatures,
 * replay protection headers (X-Camnex-Timestamp), and automatic delivery logging.
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const db = require('../../../database');

class WebhookService {
  listSubscriptions() {
    const rows = db.prepare('SELECT * FROM webhook_subscriptions ORDER BY created_at DESC').all();
    return rows.map(r => ({
      ...r,
      events: JSON.parse(r.events_json || '["*"]')
    }));
  }

  getSubscription(id) {
    const row = db.prepare('SELECT * FROM webhook_subscriptions WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      events: JSON.parse(row.events_json || '["*"]')
    };
  }

  createSubscription({ name, target_url, secret, events = ['*'] }) {
    if (!name || !target_url) {
      throw new Error('Name and target URL are required for webhook subscription');
    }
    const id = `wh-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const generatedSecret = secret || crypto.randomBytes(24).toString('hex');
    const eventsJson = JSON.stringify(events);

    db.prepare(`
      INSERT INTO webhook_subscriptions (id, name, target_url, secret, events_json, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(id, name.trim(), target_url.trim(), generatedSecret, eventsJson);

    return this.getSubscription(id);
  }

  deleteSubscription(id) {
    const existing = db.prepare('SELECT * FROM webhook_subscriptions WHERE id = ?').get(id);
    if (!existing) return false;
    db.prepare('DELETE FROM webhook_subscriptions WHERE id = ?').run(id);
    return true;
  }

  listDeliveries(subscriptionId = null, limit = 50) {
    let sql = 'SELECT * FROM webhook_deliveries';
    const params = [];
    if (subscriptionId) {
      sql += ' WHERE subscription_id = ?';
      params.push(subscriptionId);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Math.max(1, parseInt(limit)));

    const rows = db.prepare(sql).all(...params);
    return rows.map(r => ({
      ...r,
      payload: JSON.parse(r.payload_json || '{}')
    }));
  }

  computeSignature(secret, timestamp, payloadString) {
    const signaturePayload = `${timestamp}.${payloadString}`;
    return crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');
  }

  async dispatch(eventType, payload) {
    const subscriptions = this.listSubscriptions().filter(s => {
      if (!s.is_active) return false;
      return s.events.includes('*') || s.events.includes(eventType);
    });

    const deliveries = [];
    for (const sub of subscriptions) {
      const deliveryId = `del-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const payloadString = JSON.stringify(payload);
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.computeSignature(sub.secret, timestamp, payloadString);

      db.prepare(`
        INSERT INTO webhook_deliveries (id, subscription_id, event_type, payload_json, status, attempts, created_at)
        VALUES (?, ?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP)
      `).run(deliveryId, sub.id, eventType, payloadString);

      // Perform non-blocking delivery
      this.sendDelivery(deliveryId, sub.target_url, eventType, payloadString, timestamp, signature)
        .catch(err => console.error(`[WEBHOOK DELIVERY ERROR ${deliveryId}]`, err.message));

      deliveries.push({ deliveryId, subscriptionId: sub.id, status: 'dispatched' });
    }

    return deliveries;
  }

  async sendDelivery(deliveryId, targetUrl, eventType, payloadString, timestamp, signature) {
    return new Promise((resolve, reject) => {
      try {
        const urlObj = new URL(targetUrl);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          timeout: 8000,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadString),
            'X-Camnex-Event': eventType,
            'X-Camnex-Delivery': deliveryId,
            'X-Camnex-Timestamp': String(timestamp),
            'X-Camnex-Signature': `sha256=${signature}`,
            'User-Agent': 'CamneX-Webhook-Engine/1.0.0'
          }
        };

        db.prepare('UPDATE webhook_deliveries SET attempts = attempts + 1 WHERE id = ?').run(deliveryId);

        const req = client.request(options, (res) => {
          let responseBody = '';
          res.on('data', chunk => responseBody += chunk);
          res.on('end', () => {
            const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
            db.prepare(`
              UPDATE webhook_deliveries
              SET status = ?, response_code = ?, response_body = ?, delivered_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(
              isSuccess ? 'delivered' : 'failed',
              res.statusCode,
              responseBody.slice(0, 1000),
              deliveryId
            );
            resolve({ statusCode: res.statusCode, body: responseBody });
          });
        });

        req.on('error', (err) => {
          db.prepare(`
            UPDATE webhook_deliveries
            SET status = 'failed', last_error = ?, response_code = 0
            WHERE id = ?
          `).run(err.message, deliveryId);
          resolve({ error: err.message });
        });

        req.on('timeout', () => {
          req.destroy();
          db.prepare(`
            UPDATE webhook_deliveries
            SET status = 'failed', last_error = 'Connection timed out (8s)', response_code = 408
            WHERE id = ?
          `).run(deliveryId);
          resolve({ error: 'Timeout' });
        });

        req.write(payloadString);
        req.end();
      } catch (err) {
        db.prepare(`
          UPDATE webhook_deliveries
          SET status = 'failed', last_error = ?
          WHERE id = ?
        `).run(err.message, deliveryId);
        resolve({ error: err.message });
      }
    });
  }
}

module.exports = new WebhookService();

