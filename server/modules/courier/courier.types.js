/**
 * CamneX Bangladesh - Extensible Courier Integration Types & Constants
 */

const COURIER_PROVIDERS = {
  STEADFAST: 'steadfast',
  PATHAO: 'pathao',
  REDX: 'redx',
  PAPERFLY: 'paperfly',
  ECOURIER: 'ecourier',
  SUNDARBAN: 'sundarban',
  CUSTOM: 'custom'
};

const INTEGRATION_STATUS = {
  INTEGRATED: 'integrated',                     // Production-ready adapter active in codebase
  DEVELOPMENT_REQUIRED: 'development_required'  // Catalogued provider, requires adapter implementation
};

const SHIPMENT_STATUS = {
  PENDING: 'pending',                     // Consignment created, awaiting merchant dispatch/courier pickup
  DISPATCHED: 'dispatched',               // Handed over to courier
  IN_TRANSIT: 'in_transit',               // In transit between logistics hubs
  OUT_FOR_DELIVERY: 'out_for_delivery',   // Assigned to local delivery rider
  DELIVERED: 'delivered',                 // Successfully delivered to customer
  RETURNED: 'returned',                   // Returned or returning to merchant
  CANCELLED: 'cancelled',                 // Consignment cancelled
  HOLD: 'hold'                            // Delivery postponed or on hold
};

const COURIER_CAPABILITIES = {
  TEST_CONNECTION: 'test_connection',
  CREATE_SHIPMENT: 'create_shipment',
  GET_TRACKING: 'get_tracking',
  CANCEL_SHIPMENT: 'cancel_shipment',
  WEBHOOKS: 'webhooks'
};

module.exports = {
  COURIER_PROVIDERS,
  INTEGRATION_STATUS,
  SHIPMENT_STATUS,
  COURIER_CAPABILITIES
};

