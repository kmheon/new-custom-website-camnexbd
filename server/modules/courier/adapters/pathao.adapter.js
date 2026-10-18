/**
 * CamneX Bangladesh - Pathao Logistics Adapter
 * Sandbox: https://courier-api-sandbox.pathao.com
 * Production: https://api-hermes.pathao.com
 */

const BaseCourierAdapter = require('../base.adapter');
const { COURIER_PROVIDERS, SHIPMENT_STATUS, COURIER_CAPABILITIES } = require('../courier.types');

class PathaoAdapter extends BaseCourierAdapter {
  constructor(config = {}) {
    super({ ...config, provider: COURIER_PROVIDERS.PATHAO });
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.username = config.username || '';
    this.password = config.password || '';
    this.storeId = config.storeId || '';
    this.token = null;
    this.tokenExpiry = null;

    // Use sandbox or production URL
    this.baseUrl = config.baseUrl || (this.testMode
      ? 'https://courier-api-sandbox.pathao.com'
      : 'https://api-hermes.pathao.com');
  }

  getName() {
    return 'Pathao Logistics';
  }

  getCapabilities() {
    return [
      COURIER_CAPABILITIES.TEST_CONNECTION,
      COURIER_CAPABILITIES.CREATE_SHIPMENT,
      COURIER_CAPABILITIES.GET_TRACKING
    ];
  }

  getTrackingUrl(consignmentId) {
    if (!consignmentId) return null;
    return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(String(consignmentId).trim())}`;
  }

  normalizeStatus(rawStatus) {
    if (!rawStatus) return SHIPMENT_STATUS.PENDING;
    const s = String(rawStatus).toLowerCase().trim();

    if (s.includes('deliver') || s.includes('payment_invoice')) return SHIPMENT_STATUS.DELIVERED;
    if (s.includes('cancel')) return SHIPMENT_STATUS.CANCELLED;
    if (s.includes('hold')) return SHIPMENT_STATUS.HOLD;
    if (s.includes('return')) return SHIPMENT_STATUS.RETURNED;
    if (s.includes('out_for_delivery') || s.includes('rider')) return SHIPMENT_STATUS.OUT_FOR_DELIVERY;
    if (s.includes('transit')) return SHIPMENT_STATUS.IN_TRANSIT;
    if (s.includes('picked') || s.includes('assigned_for_pickup')) return SHIPMENT_STATUS.DISPATCHED;
    if (s.includes('order_placed') || s.includes('pending')) return SHIPMENT_STATUS.PENDING;

    return SHIPMENT_STATUS.IN_TRANSIT;
  }

  /**
   * Acquire or reuse OAuth access token
   */
  async getAccessToken() {
    const now = Date.now();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry - 60000) {
      return this.token;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Pathao Client ID and Client Secret are required.');
    }

    const authBody = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'password'
    };

    if (this.username && this.password) {
      authBody.username = this.username;
      authBody.password = this.password;
    } else {
      authBody.grant_type = 'client_credentials';
    }

    try {
      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(authBody)
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && data.access_token) {
        this.token = data.access_token;
        const expiresIn = Number(data.expires_in || 3600);
        this.tokenExpiry = now + (expiresIn * 1000);
        return this.token;
      }

      const errMessage = data?.message || data?.error_description || `HTTP ${response.status}`;
      throw new Error(`Pathao token generation failed: ${errMessage}`);
    } catch (err) {
      throw new Error(`Pathao authentication error: ${err.message}`);
    }
  }

  /**
   * Test connection by authenticating and requesting store / city list
   */
  async testConnection() {
    if (!this.clientId || !this.clientSecret) {
      return {
        success: false,
        message: 'Pathao Client ID and Client Secret are required.'
      };
    }

    try {
      const token = await this.getAccessToken();

      // Check stores or cities
      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/countries/1/city-list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        return {
          success: true,
          message: `Connection successful. Authenticated with Pathao Logistics (${this.testMode ? 'Sandbox' : 'Live'}).`,
          details: { environment: this.testMode ? 'Sandbox' : 'Production' }
        };
      }

      return {
        success: false,
        message: data?.message || `Pathao API returned status ${response.status}`,
        details: data
      };
    } catch (err) {
      return {
        success: false,
        message: `Pathao connection failed: ${err.message}`
      };
    }
  }

  /**
   * Create shipment order
   */
  async createShipment(order, options = {}) {
    const token = await this.getAccessToken();

    const isPaid = order.paymentStatus === 'paid';
    const codAmount = isPaid ? 0 : Math.round(Number(order.total || order.total_amount || 0));

    const recipientAddress = [
      order.deliveryAddress || order.shippingAddress || '',
      order.deliveryCity || order.customer?.district || ''
    ].filter(Boolean).join(', ');

    const itemsSummary = Array.isArray(order.items)
      ? order.items.map(i => `${i.quantity || 1}x ${i.name || i.product?.name || 'Item'}`).join(', ')
      : 'Security Hardware';

    const payload = {
      store_id: this.storeId ? Number(this.storeId) : undefined,
      merchant_order_id: order.orderNumber,
      recipient_name: order.customerName || order.customer?.name || 'Customer',
      recipient_phone: order.customerPhone || order.customer?.phone || '',
      recipient_address: recipientAddress || 'Dhaka, Bangladesh',
      recipient_city: options.cityId || 1, // Default Dhaka
      recipient_zone: options.zoneId || 1,
      delivery_type: 48, // Standard 48-hour delivery
      item_type: 2,      // Parcel
      special_instruction: options.specialInstruction || `CamneX Ref: ${order.orderNumber}. Electronic items.`,
      item_quantity: Array.isArray(order.items) ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1,
      item_weight: options.weight || 1.0,
      amount_to_collect: codAmount,
      item_description: itemsSummary.slice(0, 150)
    };

    try {
      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && (data.type === 'success' || data.data?.consignment_id)) {
        const consignment = data.data || {};
        const consignmentId = String(consignment.consignment_id || data.consignment_id || order.orderNumber);
        const trackingUrl = this.getTrackingUrl(consignmentId);

        return {
          success: true,
          consignmentId: consignmentId,
          trackingCode: consignmentId,
          trackingUrl: trackingUrl,
          status: this.normalizeStatus(consignment.order_status || 'Order_Placed'),
          rawStatus: consignment.order_status || 'Order_Placed',
          raw: data
        };
      }

      const errMsg = data?.message || (data?.errors ? JSON.stringify(data.errors) : `HTTP ${response.status}`);
      throw new Error(`Pathao dispatch failed: ${errMsg}`);
    } catch (err) {
      throw new Error(`Pathao shipment creation error: ${err.message}`);
    }
  }

  /**
   * Fetch tracking status
   */
  async getTracking(consignmentId) {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && data.data) {
        const orderInfo = data.data;
        const rawStatus = orderInfo.order_status || 'unknown';
        const trackingUrl = this.getTrackingUrl(consignmentId);

        return {
          success: true,
          status: this.normalizeStatus(rawStatus),
          rawStatus: rawStatus,
          trackingUrl: trackingUrl,
          raw: data
        };
      }

      return {
        success: false,
        rawStatus: 'unknown',
        status: SHIPMENT_STATUS.IN_TRANSIT,
        trackingUrl: this.getTrackingUrl(consignmentId),
        message: data?.message || `HTTP ${response.status}`,
        raw: data
      };
    } catch (err) {
      return {
        success: false,
        rawStatus: 'error',
        status: SHIPMENT_STATUS.IN_TRANSIT,
        trackingUrl: this.getTrackingUrl(consignmentId),
        message: err.message
      };
    }
  }
}

module.exports = PathaoAdapter;

