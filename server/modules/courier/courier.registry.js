/**
 * CamneX Bangladesh - Courier Provider Registry
 * Manages active adapters and the roadmap catalog of courier integrations.
 */

const { COURIER_PROVIDERS, INTEGRATION_STATUS, COURIER_CAPABILITIES } = require('./courier.types');
const SteadfastAdapter = require('./adapters/steadfast.adapter');
const PathaoAdapter = require('./adapters/pathao.adapter');

class CourierRegistry {
  constructor() {
    this.adapters = new Map();
    this.catalog = new Map();

    this.registerActiveAdapters();
    this.registerCatalogProviders();
  }

  registerActiveAdapters() {
    this.adapters.set(COURIER_PROVIDERS.STEADFAST, SteadfastAdapter);
    this.adapters.set(COURIER_PROVIDERS.PATHAO, PathaoAdapter);
  }

  registerCatalogProviders() {
    // 1. Steadfast Courier (Integrated)
    this.catalog.set(COURIER_PROVIDERS.STEADFAST, {
      id: COURIER_PROVIDERS.STEADFAST,
      name: 'Steadfast Courier',
      status: INTEGRATION_STATUS.INTEGRATED,
      description: 'Nationwide next-day parcel delivery and COD across all 64 districts of Bangladesh.',
      website: 'https://steadfast.com.bd',
      portalUrl: 'https://portal.packzy.com',
      trackingUrlPattern: 'https://steadfast.com.bd/t/{consignment_id}',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'text', secret: false, required: true },
        { key: 'secretKey', label: 'Secret Key', type: 'password', secret: true, required: true },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      capabilities: [
        COURIER_CAPABILITIES.TEST_CONNECTION,
        COURIER_CAPABILITIES.CREATE_SHIPMENT,
        COURIER_CAPABILITIES.GET_TRACKING
      ]
    });

    // 2. Pathao Logistics (Integrated)
    this.catalog.set(COURIER_PROVIDERS.PATHAO, {
      id: COURIER_PROVIDERS.PATHAO,
      name: 'Pathao Logistics',
      status: INTEGRATION_STATUS.INTEGRATED,
      description: 'Express door-to-door deliveries, fast intra-Dhaka transit, and automated consignment tracking.',
      website: 'https://merchant.pathao.com',
      portalUrl: 'https://merchant.pathao.com',
      trackingUrlPattern: 'https://merchant.pathao.com/tracking?consignment_id={consignment_id}',
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', secret: false, required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', secret: true, required: true },
        { key: 'storeId', label: 'Store ID', type: 'text', secret: false, required: false },
        { key: 'username', label: 'Merchant Email / Username', type: 'text', secret: false, required: false },
        { key: 'password', label: 'Merchant Password', type: 'password', secret: true, required: false },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      capabilities: [
        COURIER_CAPABILITIES.TEST_CONNECTION,
        COURIER_CAPABILITIES.CREATE_SHIPMENT,
        COURIER_CAPABILITIES.GET_TRACKING
      ]
    });

    // 3. RedX Delivery (Catalog / Development Required)
    this.catalog.set(COURIER_PROVIDERS.REDX, {
      id: COURIER_PROVIDERS.REDX,
      name: 'RedX Logistics',
      status: INTEGRATION_STATUS.DEVELOPMENT_REQUIRED,
      description: 'Doorstep parcel pickup, sub-district coverage, and reverse logistics in Bangladesh.',
      website: 'https://redx.com.bd',
      portalUrl: 'https://redx.com.bd/enterprise',
      trackingUrlPattern: 'https://redx.com.bd/track/{consignment_id}',
      fields: [
        { key: 'apiKey', label: 'API Token', type: 'password', secret: true, required: true },
        { key: 'storeId', label: 'Pickup Store ID', type: 'text', secret: false, required: false },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      capabilities: [
        COURIER_CAPABILITIES.CREATE_SHIPMENT,
        COURIER_CAPABILITIES.GET_TRACKING
      ],
      devNotes: 'Requires implementing server/modules/courier/adapters/redx.adapter.js using RedX Open API v1.0.0.'
    });

    // 4. Paperfly (Catalog / Development Required)
    this.catalog.set(COURIER_PROVIDERS.PAPERFLY, {
      id: COURIER_PROVIDERS.PAPERFLY,
      name: 'Paperfly Delivery Network',
      status: INTEGRATION_STATUS.DEVELOPMENT_REQUIRED,
      description: 'Extensive doorstep delivery network with coverage for non-metropolitan thand and upazilas.',
      website: 'https://paperfly.com.bd',
      portalUrl: 'https://wings.paperfly.com.bd',
      trackingUrlPattern: 'https://paperfly.com.bd/tracking?tracking_id={consignment_id}',
      fields: [
        { key: 'username', label: 'API Username', type: 'text', secret: false, required: true },
        { key: 'password', label: 'API Password', type: 'password', secret: true, required: true },
        { key: 'paperflyKey', label: 'Paperfly Key', type: 'password', secret: true, required: true },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      capabilities: [
        COURIER_CAPABILITIES.CREATE_SHIPMENT,
        COURIER_CAPABILITIES.GET_TRACKING
      ],
      devNotes: 'Requires implementing server/modules/courier/adapters/paperfly.adapter.js using Wings API.'
    });

    // 5. eCourier (Catalog / Development Required)
    this.catalog.set(COURIER_PROVIDERS.ECOURIER, {
      id: COURIER_PROVIDERS.ECOURIER,
      name: 'eCourier',
      status: INTEGRATION_STATUS.DEVELOPMENT_REQUIRED,
      description: 'Full-service logistics provider with tech-enabled tracking and air/surface options.',
      website: 'https://ecourier.com.bd',
      portalUrl: 'https://ecourier.com.bd',
      trackingUrlPattern: 'https://ecourier.com.bd/tracking/?tracking_id={consignment_id}',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'text', secret: false, required: true },
        { key: 'apiSecret', label: 'API Secret', type: 'password', secret: true, required: true },
        { key: 'userId', label: 'User ID', type: 'text', secret: false, required: true },
        { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', defaultValue: true }
      ],
      capabilities: [
        COURIER_CAPABILITIES.CREATE_SHIPMENT,
        COURIER_CAPABILITIES.GET_TRACKING
      ],
      devNotes: 'Requires implementing server/modules/courier/adapters/ecourier.adapter.js.'
    });

    // 6. Sundarban Courier (Catalog / Development Required)
    this.catalog.set(COURIER_PROVIDERS.SUNDARBAN, {
      id: COURIER_PROVIDERS.SUNDARBAN,
      name: 'Sundarban Courier Service',
      status: INTEGRATION_STATUS.DEVELOPMENT_REQUIRED,
      description: 'Largest traditional courier network in Bangladesh with extensive regional branch offices.',
      website: 'https://sundarbancourierltd.com',
      portalUrl: 'https://sundarbancourierltd.com',
      trackingUrlPattern: 'https://sundarbancourierltd.com/track/{consignment_id}',
      fields: [
        { key: 'corporateCode', label: 'Corporate Client Code', type: 'text', secret: false, required: true },
        { key: 'apiKey', label: 'Branch / API Key', type: 'password', secret: true, required: true }
      ],
      capabilities: [
        COURIER_CAPABILITIES.CREATE_SHIPMENT
      ],
      devNotes: 'Requires implementing Sundarban corporate dispatch adapter.'
    });

    // 7. Custom API / Webhook Integration
    this.catalog.set(COURIER_PROVIDERS.CUSTOM, {
      id: COURIER_PROVIDERS.CUSTOM,
      name: 'Custom Logistics / Dedicated Fleet',
      status: INTEGRATION_STATUS.DEVELOPMENT_REQUIRED,
      description: 'Connect internal delivery vans or third-party freight API via customized webhook endpoint.',
      website: '',
      portalUrl: '',
      trackingUrlPattern: '',
      fields: [
        { key: 'webhookUrl', label: 'Webhook / Dispatch URL', type: 'text', secret: false, required: true },
        { key: 'authHeader', label: 'Authorization Header', type: 'password', secret: true, required: false }
      ],
      capabilities: [
        COURIER_CAPABILITIES.CREATE_SHIPMENT
      ],
      devNotes: 'Custom fleet adapter can be configured to push dispatch webhooks to internal fleet tracking.'
    });
  }

  /**
   * Return full catalog with integration status
   */
  getProviderCatalog() {
    return Array.from(this.catalog.values());
  }

  /**
   * Check if provider has active adapter code
   */
  isIntegrated(providerId) {
    return this.adapters.has(providerId);
  }

  /**
   * Get metadata for a specific provider
   */
  getProviderMetadata(providerId) {
    return this.catalog.get(providerId) || null;
  }

  /**
   * Instantiate adapter for configured provider
   */
  createAdapter(providerId, config = {}) {
    const AdapterClass = this.adapters.get(providerId);
    if (!AdapterClass) {
      throw new Error(`No adapter implementation found for courier provider "${providerId}". Provider is currently catalogued as "development_required".`);
    }
    return new AdapterClass(config);
  }

  /**
   * Resolve customer-facing tracking URL from provider and tracking code
   */
  getTrackingUrl(providerOrCourierName, trackingNumber) {
    if (!trackingNumber) return null;
    const cleanNum = String(trackingNumber).trim();
    if (!cleanNum) return null;

    const term = String(providerOrCourierName || '').toLowerCase().trim();

    // 1. Check exact catalog ID match
    const metadata = this.catalog.get(term);
    if (metadata?.trackingUrlPattern) {
      return metadata.trackingUrlPattern.replace('{consignment_id}', encodeURIComponent(cleanNum));
    }

    // 2. Fuzzy name matching
    if (term.includes('steadfast')) {
      return `https://steadfast.com.bd/t/${encodeURIComponent(cleanNum)}`;
    }
    if (term.includes('pathao')) {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(cleanNum)}`;
    }
    if (term.includes('redx')) {
      return `https://redx.com.bd/track/${encodeURIComponent(cleanNum)}`;
    }
    if (term.includes('paperfly')) {
      return `https://paperfly.com.bd/tracking?tracking_id=${encodeURIComponent(cleanNum)}`;
    }
    if (term.includes('ecourier')) {
      return `https://ecourier.com.bd/tracking/?tracking_id=${encodeURIComponent(cleanNum)}`;
    }
    if (term.includes('sundarban')) {
      return `https://sundarbancourierltd.com/track/${encodeURIComponent(cleanNum)}`;
    }

    return null;
  }
}

// Singleton instance
const courierRegistry = new CourierRegistry();

module.exports = {
  CourierRegistry,
  courierRegistry
};

