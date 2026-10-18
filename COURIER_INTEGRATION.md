# CamneX Bangladesh - Extensible Courier Integration Guide

This guide documents the extensible courier logistics architecture in CamneX Bangladesh, detailing how existing providers (Steadfast and Pathao) operate and providing step-by-step instructions for adding new courier adapters (e.g., RedX, Paperfly, eCourier, Sundarban, custom freight).

---

## 1. Architecture Overview

The courier subsystem decouples courier API interactions from CamneX internal order data models:

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin CMS UI                           │
│  - SettingsModule (Configure, Test Connection, Add Provider)│
│  - OrderDetailModal (Book Dispatch, Sync Tracking Status)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│             server/modules/courier/courier.router.js        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│            server/modules/courier/courier.service.js        │
│  - Decrypts AES-256-GCM secrets                             │
│  - Idempotency & duplicate dispatch protection              │
│  - Updates `shipments` table & orders `timeline`            │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│           server/modules/courier/courier.registry.js        │
│  - Active adapter lookup (`isIntegrated`)                   │
│  - Full provider catalog (Integrated vs Dev Required)       │
│  - Unified tracking URL resolver                            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼─────────────┐ ┌──────────────▼─────────────┐
│  steadfast.adapter.js      │ │   pathao.adapter.js         │
│  (Steadfast Courier API)   │ │   (Pathao Aladdin API)     │
└────────────────────────────┘ └────────────────────────────┘
               │
┌──────────────▼─────────────┐
│  <future>.adapter.js       │
│  (RedX, Paperfly, etc.)    │
└────────────────────────────┘
```

### Key Modules:
- **`server/modules/courier/courier.types.js`**: Enums for providers, integration status (`integrated` vs `development_required`), standard shipment statuses, and capabilities.
- **`server/modules/courier/base.adapter.js`**: Abstract base class (`BaseCourierAdapter`) defining the provider contract.
- **`server/modules/courier/adapters/steadfast.adapter.js`**: Production-ready adapter for Steadfast Courier.
- **`server/modules/courier/adapters/pathao.adapter.js`**: Production-ready adapter for Pathao Logistics.
- **`server/modules/courier/courier.registry.js`**: Central registry maintaining active adapters and provider catalog metadata.
- **`server/modules/courier/courier.service.js`**: Business logic, secret decryption, duplicate booking protection, and shipment persistence.
- **`server/modules/courier/courier.router.js`**: Admin endpoints for testing connections, dispatching orders, and querying live tracking.

---

## 2. Standard Normalized Status Enum

All raw provider statuses are mapped to the unified CamneX `SHIPMENT_STATUS`:

| Internal Status | Meaning | Steadfast Mapping | Pathao Mapping |
| :--- | :--- | :--- | :--- |
| `pending` | Order created / awaiting pickup | `pending`, `in_review` | `Order_Placed`, `Assigned_For_Pickup` |
| `dispatched` | Handed over to courier hub | `picked`, `dispatched` | `Picked` |
| `in_transit` | Moving between logistics hubs | `in_transit` | `In_Transit` |
| `out_for_delivery` | Assigned to local delivery rider | `out_for_delivery` | `Out_For_Delivery` |
| `delivered` | Successfully delivered to customer | `delivered`, `delivered_approval` | `Delivered`, `Payment_Invoice` |
| `returned` | Returned to merchant | `return`, `returned` | `Returned` |
| `cancelled` | Consignment cancelled | `cancelled`, `cancelled_approval` | `Cancelled` |
| `hold` | Delivery delayed or on hold | `hold` | `Hold` |

---

## 3. Step-by-Step: Adding a New Courier Adapter

### Step 1: Create the Adapter File
Create a new file in `server/modules/courier/adapters/<provider>.adapter.js`:

```javascript
// server/modules/courier/adapters/redx.adapter.js
const BaseCourierAdapter = require('../base.adapter');
const { COURIER_PROVIDERS, SHIPMENT_STATUS, COURIER_CAPABILITIES } = require('../courier.types');

class RedxAdapter extends BaseCourierAdapter {
  constructor(config = {}) {
    super({ ...config, provider: 'redx' });
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || (this.testMode
      ? 'https://sandbox.redx.com.bd/v1.0.0-beta'
      : 'https://openapi.redx.com.bd/v1.0.0-beta');
  }

  getName() {
    return 'RedX Logistics';
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
    return `https://redx.com.bd/track/${encodeURIComponent(String(consignmentId).trim())}`;
  }

  normalizeStatus(rawStatus) {
    const s = String(rawStatus || '').toLowerCase();
    if (s.includes('delivered')) return SHIPMENT_STATUS.DELIVERED;
    if (s.includes('cancel')) return SHIPMENT_STATUS.CANCELLED;
    if (s.includes('pickup_completed')) return SHIPMENT_STATUS.DISPATCHED;
    if (s.includes('in_transit')) return SHIPMENT_STATUS.IN_TRANSIT;
    return SHIPMENT_STATUS.PENDING;
  }

  async testConnection() {
    if (!this.apiKey) {
      return { success: false, message: 'RedX API Key is required.' };
    }
    // Make test API call to RedX ping/profile endpoint...
    return { success: true, message: 'Connected to RedX API successfully.' };
  }

  async createShipment(order, options = {}) {
    // 1. Calculate COD amount (0 if paid, total if COD)
    const isPaid = order.paymentStatus === 'paid';
    const codAmount = isPaid ? 0 : Math.round(Number(order.total || 0));

    // 2. Call RedX POST /parcels endpoint...
    // 3. Return standardized payload:
    return {
      success: true,
      consignmentId: 'RDX-123456',
      trackingCode: 'RDX-123456',
      trackingUrl: this.getTrackingUrl('RDX-123456'),
      status: SHIPMENT_STATUS.PENDING,
      rawStatus: 'ready_for_pickup',
      raw: {}
    };
  }

  async getTracking(consignmentId) {
    // Call RedX GET /parcels/:tracking_id endpoint...
    return {
      success: true,
      status: SHIPMENT_STATUS.IN_TRANSIT,
      rawStatus: 'in_transit',
      trackingUrl: this.getTrackingUrl(consignmentId),
      raw: {}
    };
  }
}

module.exports = RedxAdapter;
```

### Step 2: Register the Adapter in `courier.registry.js`
In `server/modules/courier/courier.registry.js`:

1. Import the new adapter:
   ```javascript
   const RedxAdapter = require('./adapters/redx.adapter');
   ```
2. In `registerActiveAdapters()`:
   ```javascript
   this.adapters.set(COURIER_PROVIDERS.REDX, RedxAdapter);
   ```
3. In `registerCatalogProviders()`, update `status` from:
   ```javascript
   status: INTEGRATION_STATUS.DEVELOPMENT_REQUIRED,
   ```
   to:
   ```javascript
   status: INTEGRATION_STATUS.INTEGRATED,
   ```

### Step 3: Run the Test Suite
Verify that the new adapter complies with all tests:
```bash
node scripts/test_courier_extensibility.js
```

---

## 4. Security & Replay Protection

1. **Zero Secret Exposure**:
   - Sensitive credential keys (`apiKey`, `secretKey`, `clientSecret`, `password`, `token`, `apiSecret`, `authHeader`) are encrypted using AES-256-GCM before saving into the database.
   - When returned via `GET /api/settings` or `GET /api/admin/couriers`, all secret values are masked (`••••••••`).
   - Plaintext credentials never leave the Node.js backend.
2. **Idempotency & Duplicate Booking Protection**:
   - `courierService.dispatchOrder()` checks both the `shipments` table and the order's existing tracking number.
   - If an order has already been booked with a courier partner, subsequent dispatch requests immediately return the existing consignment details rather than booking duplicate consignments.
3. **Storefront & Public Tracking Safety**:
   - Customer-facing tracking endpoints (`/api/orders/:orderNumber`) only expose public fulfillment milestones, normalized status, and external carrier URLs. Internal staff CRM notes and merchant credentials are never exposed.

---

## 5. Summary of Supported APIs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/couriers` | Lists all providers, integration status, and masked configs |
| `POST` | `/api/admin/couriers/:provider/test-connection` | Tests API connection with credentials |
| `POST` | `/api/admin/orders/:id/dispatch-courier` | Books order with courier partner |
| `GET` | `/api/admin/orders/:id/courier-tracking` | Queries live courier status and updates timeline |
| `GET` | `/api/orders/:orderNumber?phone=...` | Public order tracking with carrier links |

