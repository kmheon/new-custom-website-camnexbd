/**
 * CamneX Bangladesh - Base Courier Adapter Interface
 * All courier providers (Steadfast, Pathao, RedX, etc.) extend this class.
 */

const { COURIER_CAPABILITIES, SHIPMENT_STATUS } = require('./courier.types');

class BaseCourierAdapter {
  /**
   * @param {Object} config - Decrypted provider configuration
   * @param {string} config.provider - Provider key (e.g. 'steadfast', 'pathao')
   * @param {boolean} config.enabled - Whether integration is enabled
   * @param {boolean} config.testMode - Whether sandbox/test mode is active
   */
  constructor(config = {}) {
    this.config = config;
    this.provider = config.provider || 'unknown';
    this.testMode = config.testMode !== false;
  }

  /**
   * Unique identifier for the provider (e.g. 'steadfast', 'pathao')
   */
  getId() {
    return this.provider;
  }

  /**
   * Human-readable provider display name
   */
  getName() {
    return 'Courier Provider';
  }

  /**
   * Return supported capabilities array
   * @returns {string[]} List from COURIER_CAPABILITIES
   */
  getCapabilities() {
    return [
      COURIER_CAPABILITIES.TEST_CONNECTION,
      COURIER_CAPABILITIES.CREATE_SHIPMENT,
      COURIER_CAPABILITIES.GET_TRACKING
    ];
  }

  /**
   * Test API connectivity with configured credentials
   * @returns {Promise<{ success: boolean, message: string, details?: any }>}
   */
  async testConnection() {
    throw new Error(`testConnection() not implemented for ${this.getName()}`);
  }

  /**
   * Create shipment consignment for an order
   * @param {Object} order - Full CamneX order record
   * @param {Object} options - Dispatch options (note, package weight, etc.)
   * @returns {Promise<{
   *   success: boolean,
   *   consignmentId: string,
   *   trackingCode: string,
   *   trackingUrl: string,
   *   status: string,
   *   raw: any
   * }>}
   */
  async createShipment(order, options = {}) {
    throw new Error(`createShipment() not implemented for ${this.getName()}`);
  }

  /**
   * Fetch latest tracking status from courier
   * @param {string} consignmentId - Provider consignment or tracking ID
   * @returns {Promise<{
   *   success: boolean,
   *   status: string,
   *   rawStatus: string,
   *   trackingUrl: string,
   *   timeline?: Array<{ status: string, message: string, timestamp: string }>,
   *   raw: any
   * }>}
   */
  async getTracking(consignmentId) {
    throw new Error(`getTracking() not implemented for ${this.getName()}`);
  }

  /**
   * Cancel consignment if supported by courier API
   * @param {string} consignmentId
   * @param {string} reason
   * @returns {Promise<{ success: boolean, message: string, raw?: any }>}
   */
  async cancelShipment(consignmentId, reason = '') {
    throw new Error(`cancelShipment() is not supported by ${this.getName()}`);
  }

  /**
   * Build customer-facing external tracking URL
   * @param {string} consignmentId
   * @returns {string|null}
   */
  getTrackingUrl(consignmentId) {
    return null;
  }

  /**
   * Helper to normalize raw courier status to CamneX unified SHIPMENT_STATUS
   * @param {string} rawStatus
   * @returns {string} Standard SHIPMENT_STATUS
   */
  normalizeStatus(rawStatus) {
    return SHIPMENT_STATUS.IN_TRANSIT;
  }
}

module.exports = BaseCourierAdapter;

