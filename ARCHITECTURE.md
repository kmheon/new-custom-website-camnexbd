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

### System Roles
1. **Super Admin**: Unrestricted system-wide access.
2. **Website Manager**: Website CMS, presentation catalog, settings, customer quotes.
3. **Content Editor**: Marketing pages, blog posts, project showcases, testimonials.
4. **Catalog Manager**: Technical specifications, product catalog, pricing, stock levels.
5. **Sales Staff**: Orders, quotes, customer accounts.
6. **Support Staff**: Service requests, order tracking assistance.

---

## 4. Referential Integrity & Deletion Rules

- **Soft Delete / Archival**: Products, categories, brands, and customers cannot be hard-deleted if referenced in orders, packages, or movements. They are soft-deleted with `is_archived = 1` and `archived_at = CURRENT_TIMESTAMP`.
- **Media Safety**: Uploaded media cannot be deleted if referenced across products, categories, hero slides, projects, or company profile. The API rejects deletion with `409 Conflict`.
- **Stock Movement Ledger**: Every stock change creates an immutable row in `stock_movements`.

---

## 5. Domain Events & Outbox Pattern

Domain mutations write an event record to `domain_events` (`status = 'pending'`). A lightweight background worker runs every 3 seconds to publish events to internal subscribers for cache invalidation, sitemap regeneration, and audit trails.

