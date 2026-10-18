/**
 * CamneX Bangladesh - Courier Service Layer
 * Coordinates database order records, shipments, credential decryption, and courier adapters.
 */

const crypto = require('crypto');
const db = require('../../../database');
const { decrypt, maskSecret } = require('../../shared/cryptoHelper');
const { courierRegistry } = require('./courier.registry');
const { INTEGRATION_STATUS, SHIPMENT_STATUS } = require('./courier.types');

class CourierService {
  /**
   * Helper to fetch and parse site_settings
   */
  getSiteSettings() {
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get();
      return row ? JSON.parse(row.value) : {};
    } catch (err) {
      console.error('[CourierService] Error fetching site_settings:', err.message);
      return {};
    }
  }

  /**
   * Helper to retrieve decrypted credentials for a provider
   */
  getDecryptedProviderConfig(providerId) {
    const settings = this.getSiteSettings();
    const integrations = settings.courierIntegrations || {};
    const rawConfig = integrations[providerId] || {};

    const decrypted = { ...rawConfig };
    const secretKeys = ['apiKey', 'secretKey', 'clientSecret', 'password', 'token', 'apiSecret', 'authHeader'];

    for (const key of secretKeys) {
      if (decrypted[key] && typeof decrypted[key] === 'string') {
        decrypted[key] = decrypt(decrypted[key]);
      }
    }

    return decrypted;
  }

  /**
   * Get all courier providers from catalog with their configured/active status
   */
  getCouriersCatalog() {
    const settings = this.getSiteSettings();
    const integrations = settings.courierIntegrations || {};
    const catalog = courierRegistry.getProviderCatalog();

    return catalog.map(provider => {
      const savedConfig = integrations[provider.id] || {};
      const isIntegrated = courierRegistry.isIntegrated(provider.id);
      
      // Determine if credentials are configured
      let hasCredentials = false;
      if (provider.id === 'steadfast') {
        hasCredentials = Boolean(savedConfig.apiKey && savedConfig.secretKey);
      } else if (provider.id === 'pathao') {
        hasCredentials = Boolean(savedConfig.clientId && savedConfig.clientSecret);
      } else {
        hasCredentials = Object.keys(savedConfig).some(k => k !== 'enabled' && k !== 'testMode' && Boolean(savedConfig[k]));
      }

      // Mask sensitive fields for security
      const safeConfig = { ...savedConfig };
      for (const field of provider.fields) {
        if (field.secret && safeConfig[field.key]) {
          safeConfig[field.key] = maskSecret(safeConfig[field.key]);
        }
      }

      return {
        ...provider,
        isIntegrated,
        isConfigured: hasCredentials,
        isEnabled: Boolean(savedConfig.enabled),
        config: safeConfig
      };
    });
  }

  /**
   * Test connection to a courier provider
   * @param {string} providerId
   * @param {Object} overrideCredentials Optional credentials passed from UI test modal
   */
  async testCourierConnection(providerId, overrideCredentials = null) {
    if (!courierRegistry.isIntegrated(providerId)) {
      return {
        success: false,
        message: `Provider "${providerId}" is catalogued as "development_required". An API adapter must be implemented before connection testing.`
      };
    }

    const savedConfig = this.getDecryptedProviderConfig(providerId);
    let effectiveConfig = { ...savedConfig };

    if (overrideCredentials && typeof overrideCredentials === 'object') {
      for (const [k, v] of Object.entries(overrideCredentials)) {
        if (v && !String(v).startsWith('••••')) {
          effectiveConfig[k] = v;
        }
      }
    }

    try {
      const adapter = courierRegistry.createAdapter(providerId, effectiveConfig);
      return await adapter.testConnection();
    } catch (err) {
      return {
        success: false,
        message: `Adapter error: ${err.message}`
      };
    }
  }

  /**
   * Dispatch an order via selected courier provider with idempotency / duplicate booking protection
   */
  async dispatchOrder(orderId, { providerId, instructions, weight, itemType, cityId, zoneId } = {}) {
    if (!providerId) {
      throw new Error('A courier provider must be selected for dispatch.');
    }

    // 1. Fetch order
    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ? OR data_json LIKE ?').get(orderId, `%"orderNumber":"${orderId}"%`);
    if (!orderRow) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const orderData = JSON.parse(orderRow.data_json);

    // 2. Duplicate dispatch / Replay protection: check shipments table and order data
    const existingShipment = db.prepare('SELECT * FROM shipments WHERE order_id = ? AND status != ?').get(orderRow.id, SHIPMENT_STATUS.CANCELLED);
    if (existingShipment && existingShipment.consignment_id) {
      return {
        success: true,
        alreadyDispatched: true,
        message: `Order was already dispatched via ${existingShipment.provider_id} (Consignment: ${existingShipment.consignment_id}).`,
        shipment: existingShipment,
        order: orderData
      };
    }

    // Also check if already has trackingNumber on orderData
    if (orderData.trackingNumber && orderData.status === 'dispatched') {
      return {
        success: true,
        alreadyDispatched: true,
        message: `Order already marked as dispatched with tracking number ${orderData.trackingNumber}.`,
        shipment: null,
        order: orderData
      };
    }

    // 3. Verify provider adapter is implemented
    if (!courierRegistry.isIntegrated(providerId)) {
      throw new Error(`Courier provider "${providerId}" is not yet integrated into the automated dispatch pipeline.`);
    }

    // 4. Retrieve decrypted config
    const providerConfig = this.getDecryptedProviderConfig(providerId);
    if (!providerConfig.enabled) {
      // If disabled in settings, warn admin
      throw new Error(`Courier provider "${providerId}" is currently disabled in Site Settings. Enable it before booking shipments.`);
    }

    // 5. Instantiate adapter and create shipment
    const adapter = courierRegistry.createAdapter(providerId, providerConfig);
    const dispatchOptions = {
      note: instructions,
      weight: Number(weight) || 1.0,
      itemType: itemType || 2,
      cityId,
      zoneId
    };

    const shipmentResult = await adapter.createShipment(orderData, dispatchOptions);

    if (!shipmentResult.success || !shipmentResult.consignmentId) {
      throw new Error(shipmentResult.message || 'Courier partner rejected consignment creation.');
    }

    const consignmentId = String(shipmentResult.consignmentId);
    const trackingCode = String(shipmentResult.trackingCode || consignmentId);
    const trackingUrl = shipmentResult.trackingUrl || adapter.getTrackingUrl(trackingCode);
    const shipmentStatus = shipmentResult.status || SHIPMENT_STATUS.PENDING;
    const providerStatus = shipmentResult.rawStatus || 'created';

    // 6. Record shipment in shipments table
    const shipmentId = `ship_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    try {
      db.prepare(`
        INSERT INTO shipments (
          id, order_id, provider_id, consignment_id, tracking_code, tracking_url,
          status, provider_status, raw_response_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        shipmentId,
        orderRow.id,
        providerId,
        consignmentId,
        trackingCode,
        trackingUrl,
        shipmentStatus,
        providerStatus,
        JSON.stringify(shipmentResult.raw || {})
      );
    } catch (insertErr) {
      console.error('[CourierService] Warning: failed to insert into shipments table:', insertErr.message);
    }

    // 7. Update order data_json and order_status
    const updatedOrder = { ...orderData };
    updatedOrder.courierName = adapter.getName();
    updatedOrder.courierProviderId = providerId;
    updatedOrder.trackingNumber = trackingCode;
    updatedOrder.consignmentId = consignmentId;
    updatedOrder.courierTrackingUrl = trackingUrl;
    updatedOrder.shipmentStatus = shipmentStatus;
    updatedOrder.status = 'dispatched';

    // Append to timeline
    if (!Array.isArray(updatedOrder.timeline)) {
      updatedOrder.timeline = [];
    }
    updatedOrder.timeline.push({
      title: 'Handed to Courier Partner',
      description: `Consignment booked with ${adapter.getName()} (${trackingCode}). Live tracking link active.`,
      date: new Date().toISOString()
    });

    // Write back to orders table
    db.prepare(`
      UPDATE orders
      SET order_status = 'dispatched',
          data_json = ?
      WHERE id = ?
    `).run(JSON.stringify(updatedOrder), orderRow.id);

    return {
      success: true,
      consignmentId,
      trackingCode,
      trackingUrl,
      courierName: adapter.getName(),
      shipment: {
        id: shipmentId,
        order_id: orderRow.id,
        provider_id: providerId,
        consignment_id: consignmentId,
        tracking_code: trackingCode,
        tracking_url: trackingUrl,
        status: shipmentStatus,
        provider_status: providerStatus
      },
      order: updatedOrder
    };
  }

  /**
   * Fetch live tracking status from courier for an order and update order state
   */
  async getLiveOrderTracking(orderId) {
    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ? OR data_json LIKE ?').get(orderId, `%"orderNumber":"${orderId}"%`);
    if (!orderRow) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const orderData = JSON.parse(orderRow.data_json);
    const shipment = db.prepare('SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(orderRow.id);

    const providerId = shipment?.provider_id || orderData.courierProviderId || (
      orderData.courierName?.toLowerCase().includes('steadfast') ? 'steadfast' :
      orderData.courierName?.toLowerCase().includes('pathao') ? 'pathao' : null
    );

    const consignmentId = shipment?.consignment_id || orderData.trackingNumber || orderData.consignmentId;

    if (!providerId || !consignmentId) {
      return {
        success: false,
        message: 'No active courier consignment found for this order.',
        order: orderData
      };
    }

    if (!courierRegistry.isIntegrated(providerId)) {
      return {
        success: false,
        message: `Provider "${providerId}" has no live tracking adapter available.`,
        order: orderData
      };
    }

    const providerConfig = this.getDecryptedProviderConfig(providerId);
    const adapter = courierRegistry.createAdapter(providerId, providerConfig);

    const trackingResult = await adapter.getTracking(consignmentId);

    if (trackingResult.success) {
      // Update shipment record
      if (shipment) {
        db.prepare(`
          UPDATE shipments
          SET status = ?,
              provider_status = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(trackingResult.status, trackingResult.rawStatus, shipment.id);
      }

      // Update order data_json
      const updatedOrder = { ...orderData };
      const previousStatus = updatedOrder.shipmentStatus;
      updatedOrder.shipmentStatus = trackingResult.status;

      if (trackingResult.status === SHIPMENT_STATUS.DELIVERED && updatedOrder.status !== 'delivered') {
        updatedOrder.status = 'delivered';
        if (!Array.isArray(updatedOrder.timeline)) updatedOrder.timeline = [];
        updatedOrder.timeline.push({
          title: 'Delivered to Customer',
          description: `Consignment verified delivered by ${adapter.getName()}.`,
          date: new Date().toISOString()
        });
      }

      db.prepare('UPDATE orders SET data_json = ? WHERE id = ?').run(JSON.stringify(updatedOrder), orderRow.id);

      return {
        success: true,
        providerId,
        consignmentId,
        status: trackingResult.status,
        rawStatus: trackingResult.rawStatus,
        trackingUrl: trackingResult.trackingUrl || adapter.getTrackingUrl(consignmentId),
        order: updatedOrder
      };
    }

    return trackingResult;
  }
}

const courierService = new CourierService();

module.exports = {
  CourierService,
  courierService
};
