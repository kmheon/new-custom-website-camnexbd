# CamneX Platform Architecture Specification

## 1. High-Level System Architecture

The CamneX platform is engineered on a single SQLite database and a unified **Business API (`/api/v1`)** powering three decoupled client surfaces:

```
                          ┌──────────────────────────┐
                          │   SQLite WAL Database    │
                          │      (camnex.db)         │
                          └────────────┬─────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │   Node.js Business API    │
                         │        (/api/v1)          │
                         └─────────────┬─────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
 ┌──────▼───────────────┐   ┌──────────▼───────────┐   ┌──────────────▼────────┐
 │   Public Storefront  │   │   Website Manager    │   │       Staff App       │
 │         (/)          │   │       (/admin)       │   │        (/staff)       │
 │   - Public Catalog   │   │   - CMS & Pages      │   │   - Staff & Roles     │
 │   - CCTV Packages    │   │   - Catalog Display  │   │   - Audit Logs        │
 │   - Checkout         │   │   - Settings & SEO   │   │   - Operations Hub    │
 │   - Company Profile  │   │   - Media Library    │   │   - Phase 2 POS/ERP   │
 └──────────────────────┘   └──────────────────────┘   └───────────────────────┘
```

### Key Architectural Tenets:
- **Zero Duplication**: No data is copied or synchronized across apps. All surfaces read and write the exact same database records via domain services.
- **Surface Isolation**: Three distinct entry bundles (`bundle.main.*.js`, `bundle.admin.*.js`, `bundle.staff.*.js`). Storefront code does not import Staff app code and functions independently if the Staff app is disabled.
- **Dedicated Session Cookies**:
  - Storefront/Customer: `camnex_session`
  - Website Manager: `camnex_admin_session`
  - Staff App: `camnex_staff_session`
  - CSRF Token: `camnex_csrf` (SameSite=Strict) + `X-CSRF-Token` header.
- **Separable Deployments**: Driven by environment variables (`PUBLIC_SITE_URL`, `ADMIN_URL`, `STAFF_APP_URL`, `API_URL`) and an automated CORS allowlist middleware.

---

## 2. Server Domain Modules (`server/modules/`)

The server is organized into 12 domain modules. Each module maintains strict separation of concerns:
- `*.schemas.js`: Request validation contracts via Zod.
- `*.service.js`: Domain business logic, database transactions, audit logging, and domain event triggers.
- `*.router.js`: Thin HTTP endpoints parsing parameters and delegating to services. Routers contain no business logic.

| Module | Description | Endpoints Handled |
| :--- | :--- | :--- |
| **catalog** | Products, categories, brands, spec templates, CCTV packages | `/products`, `/categories`, `/brands`, `/spec-templates`, `/packages` |
| **pricing** | Dynamic BOM calculations & component pricing | `/packages/calculate-price`, `/pricing/calculate-package` |
| **inventory** | Stock movements ledger & stock adjustments | `/inventory/movements`, `/inventory/adjust` |
| **orders** | Commercial order lifecycle, customer tracking & verification | `/orders`, `/orders/:id/status`, `/orders/:id/payment` |
| **customers** | Customer identity, registration, orders, and persistent wishlists | `/auth/customer/*`, `/customer/orders`, `/wishlist`, `/customers` |
| **quotes** | Engineering quotation requests & status workflows | `/quotes`, `/quotes/:id/status` |
| **services** | Service offerings (dynamic admin CRUD) & requests inbox | `/services`, `/service-requests`, `/service-offerings` |
| **cms** | Hero slider, sections layout, blog, projects, pages, testimonials, FAQs | `/settings`, `/cms/*`, `/projects`, `/pages`, `/testimonials` |
| **media** | Secure file uploads, sharp optimization, usage verification | `/media`, `/media/upload` |
| **company** | Legal profile, business credentials, PDF brochure, JSON-LD schemas | `/company-profile`, `/company/profile` |
| **staff** | Staff accounts, authentication, rate limits/lockouts, RBAC roles & permissions | `/auth/staff/*`, `/staff/users`, `/staff/roles`, `/staff/permissions` |
| **audit** | Immutable audit log queries and change diffs | `/audit-logs` |

---

## 3. Identity, Roles & Permissions (RBAC)

The system enforces server-side role-based access control on every endpoint via `requirePermission(permissionKey)`.

### System Roles & Seeded Permissions
1. **Super Admin**: Holds all permissions without restriction.
2. **Website Manager**: `website.access`, `website.content.write`, `website.seo.write`, `website.redirects.write`, `website.settings.write`, `media.write`, `catalog.read`, `catalog.write`, `catalog.archive`, `quotes.manage`, `services.manage`, `audit.read`.
3. **Content Editor**: `website.access`, `website.content.write`, `media.write`, `catalog.read`.
4. **Catalog Manager**: `website.access`, `staff.access`, `catalog.read`, `catalog.write`, `catalog.archive`, `pricing.write`, `pricing.cost.read`, `inventory.read`, `media.write`.
5. **Sales Staff**: `staff.access`, `catalog.read`, `orders.read`, `orders.update`, `customers.read`, `customers.write`, `quotes.manage`.
6. **Support Staff**: `staff.access`, `catalog.read`, `orders.read`, `services.manage`, `customers.read`.

### Permission Registry (`src/shared/permissions.ts`)
- **Website Operations**: `website.access`, `website.content.write`, `website.seo.write`, `website.redirects.write`, `website.settings.write`
- **Media**: `media.write`
- **Catalog & Pricing**: `catalog.read`, `catalog.write`, `catalog.archive`, `pricing.write`, `pricing.cost.read`
- **Inventory**: `inventory.read`, `inventory.adjust`
- **Orders & Quotes**: `orders.read`, `orders.update`, `quotes.manage`, `services.manage`
- **Customers**: `customers.read`, `customers.write`
- **Staff Administration**: `staff.access`, `staff.manage`, `roles.manage`, `audit.read`
- **Reserved Phase 2 Keys**: `pos.sell`, `pos.refund`, `purchasing.*`, `accounting.*`, `reports.*`

### Purchase Cost Redaction
The `purchase_cost` field on products is strictly guarded. Endpoints returning products (`/api/v1/products`, `/api/v1/products/:id`) redact this field for any user lacking `pricing.cost.read`. Product mutations made by users without `pricing.cost.read` leave existing cost records intact without overwriting or clearing them.

### Session Cookie Isolation & Security
- **Independent Session Cookies**:
  - Customer storefront: `camnex_session` (SameSite=Lax, HttpOnly, Path=/)
  - Website Manager: `camnex_admin_session` (SameSite=Lax, HttpOnly, Path=/)
  - Staff App: `camnex_staff_session` (SameSite=Lax, HttpOnly, Path=/)
- **CSRF Defense**: `camnex_csrf` (SameSite=Strict) cookie issued via `/api/v1/auth/csrf`. All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the matching `X-CSRF-Token` header.
- **Login Rate Limiting & Account Lockout**:
  - 5 rapid failed password attempts trigger automated 15-minute account lockout (`locked_until`).
  - Passwords stored using `bcrypt` (work factor 10).

---

## 4. Referential Integrity & Deletion Rules

- **Soft Delete / Archival**: Products, categories, brands, services, and customers cannot be hard-deleted if referenced in orders, packages, service requests, or stock movements. Instead, the server rejects hard deletion with `409 Conflict`. They can be archived using dedicated `/archive` endpoints (`is_archived = 1`, `archived_at = CURRENT_TIMESTAMP`) and restored via `/restore`. Public catalog endpoints filter out archived products unless `includeArchived=true`.
- **Media In-Use Protection**: Uploaded media cannot be deleted if referenced in products, categories, hero slides, projects, or company profile. Deletion attempts return `409 Conflict` with error code `MEDIA_IN_USE`.
- **Stock Movements Ledger**: Stock quantities cannot be directly updated without `inventory.adjust`. Every stock modification appends an immutable record to `stock_movements` capturing `product_id`, `quantity_change`, `reason`, `user_id`, and `created_at`.
- **Audit Log Immutability**: SQLite database triggers `audit_logs_no_update` and `audit_logs_no_delete` reject any `UPDATE` or `DELETE` statements on `audit_logs` using `RAISE(ABORT, 'audit_logs is append-only')`.

---

## 5. Domain Events & Outbox Pattern

All domain mutations persist an event to the `domain_events` table within the same transaction:

```
  Mutation Transaction (Service)
  ├── 1. Apply Entity Mutation (INSERT / UPDATE)
  ├── 2. Record Stock Movement / Audit Log
  └── 3. INSERT INTO domain_events (status = 'pending', attempts = 0)
```

### Outbox Processing & Worker Lifecycle
- An asynchronous worker poll runs every 3 seconds (`server/outbox/worker.js`).
- Pending events are fetched and dispatched to registered in-process subscribers.
- Upon successful handling, the event is marked `status = 'processed'` with `processed_at = CURRENT_TIMESTAMP`.
- On failure, `attempts` is incremented. The event is retried with backoff up to 3 attempts.
- If all 3 attempts fail, the event transitions to `status = 'failed'` with `last_error` recorded.

### Event Catalog
- `catalog.product.created`, `catalog.product.updated`, `catalog.product.archived`
- `pricing.changed`
- `inventory.adjusted`
- `order.placed`, `order.status_changed`, `order.paid`
- `staff.user_created`, `staff.user_disabled`

---

## 6. Shared Admin Framework & Field-Level Translation Readiness

### Shared Admin Framework (`src/components/admin/framework/`)
All admin modules adhere to a unified framework preventing ad-hoc, inconsistent screens:
- `DataTable`: Server-side & client-side search, multi-facet filtering, sorting, pagination, column chooser, saved column sets, bulk actions, and CSV export.
- `FormShell`: Form container enforcing Zod validation, inline error highlighting, unsaved-changes protection with browser `beforeunload` warning, and submit/cancel action bars.
- `ConfirmDialog`: High-security modal requiring typed confirmation phrases (e.g. `"DELETE"`, `"RESET DATABASE"`, `"CLEAR DEMO DATA"`) before executing destructive actions.
- `EmptyState`: Clean empty states with action triggers.
- `ErrorState`: Error boundary display with retry triggers and expandable error trace details.
- `Skeletons`: Loading row and card animations matching exact container heights to eliminate layout shifts.
- `Toasts`: Stacked notifications for operational feedback.
- `Breadcrumbs`: Standardized admin navigation hierarchy.

### Field-Level Translation & Content Overrides
- Translatable customer-facing strings are stored with `{ en, bn }` mapping in `src/content/strings.ts`.
- The translation function `t(path, locale, overrides)` looks up text using the path, checks for database-backed admin overrides (`SiteSettings.contentOverrides`), checks requested locale (`bn`), and falls back to plain English.
- The storefront top bar language switcher is controlled by `SiteSettings.languageSwitcherEnabled` (disabled by default in clean installations).
- Business text is completely separated from developer code; any user-facing label or banner can be updated dynamically via `SiteSettings.contentOverrides`.

---

## 7. System Maintenance & Dashboard Operations

### Destructive Action Guardrails
- **Permission Requirement**: `system.maintenance` (`PERMISSIONS.SYSTEM_MAINTENANCE`), accessible only to super admin and explicitly authorized roles.
- **Production Mode Lockout**: The endpoints `/api/admin/clear-demo-data` and `/api/admin/reset-seeds` strictly check `process.env.NODE_ENV === 'production'`. When running in production, requests are rejected immediately with `403 Forbidden` (`MAINTENANCE_BLOCKED_IN_PRODUCTION`).
- **Confirmation Phrases**: Destructive operations require exact typed confirmation phrases in `<ConfirmDialog>` modals:
  - Clear Demo Data requires `"CLEAR DEMO DATA"`.
  - Reset Seeds requires `"RESET DATABASE"`.
- **Audit Logging**: Every maintenance execution creates an immutable entry in `audit_logs` with actor details, action name, and timestamp.
- **Relocation**: Destructive buttons have been removed from the visible sidebar and housed safely under `Settings > System & Database Maintenance`.

### Operational Dashboard Integrity
- **Test Data Contamination Filtering**: Automated test suites create transient test orders, quotes, and products (e.g. `isTest: true`, phone `+8801700000000`, SKU `TEST-*`). A persistent "Hide Test Records" toggle on the overview header filters these out so operational metrics reflect genuine business volume.
- **Action Center Deduplication**: An order that is both `pending` (needs confirmation) and `unverified` (needs manual payment check) is deduplicated in the aggregate work queue task counter, preventing double-counting while preserving both actions.
- **Operational Attention Bar**: Highlights critical operational bottlenecks (orders pending > 24 hours, unverified manual payments, pending quotations, and catalog products lacking studio photography).
- **Catalog Priority Fixes**: Dynamically ranks products needing immediate metadata completion (missing image, missing SKU/model, or missing technical specifications) with direct 1-click modal editing.

---

## 8. Catalog Product Management & Phase 2 Data Contract

### Unified Product Schema
- **Identifier Stability**: Stable UUID/slug IDs, unique SKU enforcement across both active and archived products.
- **Slug Management**: Automatic slug synthesis from title and model number with manual override and live URL preview (`/product/:slug`).
- **PNG Alpha Transparency Checker**: Multi-mode visual preview (Checkerboard, Light, Dark) in the image picker, ensuring hardware photography has true alpha transparency before publication.
- **Gallery & Documents**: Multi-image gallery with ordering controls, accessibility alt text, and technical document attachments (datasheets, user manuals, warranty cards).
- **Specs & Highlighting**: Dynamic category template attribute fields combined with ad-hoc specifications, card highlight flags, and compact shortLabel controls.
- **Commercial Merchandising**: Status lifecycle (`active`, `draft`, `archived` with archive reason), merchandising flags (`isNew`, `isPopular`, `isHot`, `isFeatured`, `isAccessory`, `showOnHomepage`), promotional pricing schedules (`saleStartDate`, `saleEndDate`).
- **Phase 2 ERP/POS Readiness**:
  - Barcode standards (`EAN-13`, `UPC-A`, `Code 128`, `QR Code`) with preview verification.
  - Inventory tracking flags: `lowStockThreshold`, `allowBackorder`, `warehouseId`.
  - Serial tracking flag (`serialTracking`) and Batch/Lot tracking flag (`batchTracking`).
  - Purchase cost field (`costPrice`) strictly guarded by `pricing.cost.read` permission.
  - CCTV Turnkey package eligibility rules: `packageEligible` and role assignments (`camera`, `recorder`, `storage`, `cable`, `power`, `connectors`, `accessory`).
  - Referential integrity guard: 409 Conflict rejection if products are in stock or referenced by historical orders, quotes, or turnkey packages.



