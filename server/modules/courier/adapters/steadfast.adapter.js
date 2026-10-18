/**
 * CamneX Bangladesh - Steadfast Courier Adapter
 * Portal: https://portal.steadfast.com.bd/api/v1
 */

const BaseCourierAdapter = require('../base.adapter');
const { COURIER_PROVIDERS, SHIPMENT_STATUS, COURIER_CAPABILITIES } = require('../courier.types');

class SteadfastAdapter extends BaseCourierAdapter {
  constructor(config = {}) {
    super({ ...config, provider: COURIER_PROVIDERS.STEADFAST });
    this.apiKey = config.apiKey || '';
    this.secretKey = config.secretKey || '';
    this.baseUrl = config.baseUrl || 'https://portal.steadfast.com.bd/api/v1';
  }

  getName() {
    return 'Steadfast Courier';
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
    return `https://steadfast.com.bd/t/${encodeURIComponent(String(consignmentId).trim())}`;
  }

  normalizeStatus(rawStatus) {
    if (!rawStatus) return SHIPMENT_STATUS.PENDING;
    const s = String(rawStatus).toLowerCase().trim();

    if (s.includes('delivered')) return SHIPMENT_STATUS.DELIVERED;
    if (s.includes('cancel')) return SHIPMENT_STATUS.CANCELLED;
    if (s.includes('hold')) return SHIPMENT_STATUS.HOLD;
    if (s.includes('return')) return SHIPMENT_STATUS.RETURNED;
    if (s === 'out_for_delivery' || s.includes('rider')) return SHIPMENT_STATUS.OUT_FOR_DELIVERY;
    if (s === 'in_transit' || s.includes('transit') || s.includes('hub')) return SHIPMENT_STATUS.IN_TRANSIT;
    if (s === 'dispatched' || s === 'picked') return SHIPMENT_STATUS.DISPATCHED;
    if (s === 'pending' || s === 'in_review' || s === 'order_created') return SHIPMENT_STATUS.PENDING;

    return SHIPMENT_STATUS.IN_TRANSIT;
  }

  /**
   * Test API connectivity using get_balance endpoint
   */
  async testConnection() {
    if (!this.apiKey || !this.secretKey) {
      return {
        success: false,
        message: 'Steadfast API Key and Secret Key are required.'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/get_balance`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && (data.status === 200 || data.current_balance !== undefined)) {
        return {
          success: true,
          message: `Connection successful. Current Account Balance: ৳${data.current_balance ?? '0.00'}`,
          details: { balance: data.current_balance }
        };
      }

      return {
        success: false,
        message: data?.message || `Steadfast API responded with status ${response.status}`,
        details: data
      };
    } catch (err) {
      return {
        success: false,
        message: `Steadfast connection failed: ${err.message}`
      };
    }
  }

  /**
   * Create shipment consignment
   */
  async createShipment(order, options = {}) {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Steadfast credentials are not configured.');
    }

    // Determine COD amount (0 if paid, order total if unpaid COD)
    const isPaid = order.paymentStatus === 'paid';
    const codAmount = isPaid ? 0 : Math.round(Number(order.total || order.total_amount || 0));

    // Consolidate delivery address
    const recipientAddress = [
      order.deliveryAddress || order.shippingAddress || '',
      order.deliveryCity || order.customer?.district || ''
    ].filter(Boolean).join(', ');

    // Item summary note
    const itemsList = Array.isArray(order.items)
      ? order.items.map(i => `${i.quantity || 1}x ${i.name || i.product?.name || 'Item'}`).join(', ')
      : 'Security Equipment';
    const note = options.note || `Invoice: ${order.orderNumber}. Items: ${itemsList.slice(0, 100)}`;

    const payload = {
      invoice: order.orderNumber,
      recipient_name: order.customerName || order.customer?.name || 'Customer',
      recipient_phone: order.customerPhone || order.customer?.phone || '',
      recipient_address: recipientAddress || 'Dhaka, Bangladesh',
      cod_amount: codAmount,
      note: note
    };

    try {
      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && (data.status === 200 || data.consignment)) {
        const consignment = data.consignment || {};
        const consignmentId = String(consignment.consignment_id || consignment.tracking_code || data.consignment_id || order.orderNumber);
        const trackingCode = consignment.tracking_code || `SF-${consignmentId}`;
        const trackingUrl = this.getTrackingUrl(trackingCode);

        return {
          success: true,
          consignmentId: consignmentId,
          trackingCode: trackingCode,
          trackingUrl: trackingUrl,
          status: this.normalizeStatus(consignment.status || 'pending'),
          rawStatus: consignment.status || 'pending',
          raw: data
        };
      }

      const errMsg = data?.message || (data?.errors ? JSON.stringify(data.errors) : `HTTP ${response.status}`);
      throw new Error(`Steadfast dispatch failed: ${errMsg}`);
    } catch (err) {
      throw new Error(`Steadfast shipment creation error: ${err.message}`);
    }
  }

  /**
   * Fetch tracking status
   */
  async getTracking(consignmentId) {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Steadfast credentials are not configured.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/status_by_cid/${encodeURIComponent(consignmentId)}`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && data.status === 200) {
        const rawStatus = data.delivery_status || 'unknown';
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

module.exports = SteadfastAdapter;

