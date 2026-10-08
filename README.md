# CamneX Bangladesh — E-Commerce Storefront & Business Platform (Phase 1)

Welcome to the new **CamneX Bangladesh** business platform. Built from scratch with React, TypeScript, Vite/esbuild, Tailwind CSS, and a strongly-typed service architecture.

CamneX Bangladesh is an authorized **Hikvision Authorized Partner** and **ZKTeco Authorized Installer** delivering professional security, video surveillance, enterprise networking, and IT infrastructure hardware with Dhaka on-site installation and support.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 STOREFRONT FRONTEND (SPA)                  │
│  React + TypeScript + Tailwind CSS + Lucide Icons + Zustand │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          TYPED SERVICE LAYER INTERFACE (src/api/*)          │
│  IProductService, ICategoryService, IPackageService, etc.   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     PHASE 1 MOCK ADAPTER     │ │   PHASE 2 CENTRAL API (REST) │
│ localStorage-persisted store │ │ Node.js / Go microservices   │
│ with verifiable sample seeds │ │ with PostgreSQL / Redis      │
└──────────────────────────────┘ └──────────────┬───────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────┐
                               │     CENTRAL BUSINESS DATA      │
                               │  Single source of truth for:   │
                               │  • Storefront eCommerce        │
                               │  • POS Counter Terminals       │
                               │  • Inventory & Serial Tracking │
                               │  • Field Service Engineering   │
                               └────────────────────────────────┘
```

### Decoupled Business Service Layer
All UI components strictly interact with typed interfaces defined in `src/api/contracts.ts` (e.g. `productService`, `cartService`, `packageService`, `orderService`). No UI component directly touches storage or raw databases. The implementation can swap from the local storage adapter to a live REST/GraphQL backend by updating `src/services/index.ts` without modifying a single UI component.

---

## 2. Independent Deployment Plan

The platform is engineered so that components can be scaled and hosted across separate servers or microservices:

1. **Public Storefront (Static / CDN)**:
   - Hosted on Cloudflare Pages, Vercel, or Nginx on an edge CDN.
   - Zero POS/ERP runtime dependency: if the physical warehouse POS or accounting server is offline, the storefront remains 100% operational for product browsing, pricing, and orders.
2. **Core Business API**:
   - Node.js (Express / Fastify) or Go running in containerized Kubernetes or Cloud Run.
   - Handles orders, checkout validation, quote requests, and authentication.
3. **Database (Primary & Read Replicas)**:
   - Managed PostgreSQL (or SQLite/Better-SQLite3 in single-node setup).
   - Read replicas for catalog searches; primary node for transactions and inventory commits.
4. **Search & Cache Layer**:
   - MeiliSearch / Elasticsearch for instant faceted multi-attribute lookups.
   - Redis for session cart persistence and product detail caching.
5. **Background Job Workers**:
   - Independent worker pool executing the `JobQueue` abstraction for manufacturer datasheet research, invoice PDF generation, SMS notifications, and webhook dispatches.

---

## 3. Single Source of Truth Strategy

- **Products & Stock Availability**:
  - The Central Business Data layer acts as the absolute master.
  - Public storefront and in-store POS query the same inventory service (`available` = `on_hand` - `reserved`).
  - Stock decrements occur in a two-phase commit: reserved on order placement, deducted upon warehouse dispatch.
- **Dynamic Specification Templates**:
  - Categories own their specification templates (`SpecTemplate`).
  - When a product is assigned a category, its technical fields are validated against the template, ensuring high-fidelity comparison tables and search filters.
- **Turnkey CCTV Packages**:
  - Packages are rules-based assemblies of real catalog SKUs (cameras + DVR + storage HDD + Cat6 cable).
  - Package pricing is calculated directly from component catalog prices. If a component lacks a price, it displays "Request quotation".

---

## 4. Migration Plan from Old WordPress Site

1. **Catalog & Taxonomy Migration**:
   - Export old posts/products to CSV/JSON.
   - Map legacy categories into CamneX's structured specification templates.
   - Normalize model numbers (e.g., standardizing Hikvision `DS-2CE...` SKUs).
2. **Media Asset Migration**:
   - Mirror product images into an S3/Cloud Storage bucket with immutable URLs.
   - Generate WebP versions at 800px and 400px thumbnail resolutions.
3. **SEO URLs & 301 Redirect Strategy**:
   - Map old WordPress URLs (`/product/hikvision-ds-2ce...`) to clean canonical URLs (`/product/:id`).
   - Configure 301 permanent redirect rules in Nginx / Cloudflare to preserve search equity.
4. **Customer Data**:
   - Import legacy customer records with phone numbers as primary keys.

---

## 5. Backup & Recovery Notes

- **Database Snapshots**: Hourly WAL archiving with daily full database snapshots retained for 30 days.
- **Disaster Recovery**: Automated container restart and read-replica failover with RTO < 5 minutes and RPO < 1 hour.
- **Client Fallback**: The mock localStorage adapter provides instant self-contained demonstration capabilities and testing without requiring external credentials.

---

## 6. Decision Log (Resolutions for Ambiguous Requirements)

1. **Credentials & Partnerships**: Strictly restricted to the two verified credentials: **Hikvision Authorized Partner** and **ZKTeco Authorized Installer**. No invented certifications or statistics are rendered.
2. **Night Vision Infrared Rule**: IRPF series cameras use pure infrared night vision up to 20m. We strictly avoid adding false ColorVu or audio capabilities to standard night vision packages.
3. **Unpriced Products**: Products without an entered price display "Request quotation" and provide a 1-click quotation inquiry trigger rather than displaying `0.00` or arbitrary estimates.
4. **Sample Data Handling**: Seed data is clearly badged with a "Sample item" label and an admin banner with a 1-click "Clear Sample Data" button to ensure zero clutter when entering production records.
5. **Single-Page Checkout**: Cash on Delivery (COD) is active as the primary payment method for Bangladesh with placeholder stubs for digital gateways without hardcoding fake credentials.
