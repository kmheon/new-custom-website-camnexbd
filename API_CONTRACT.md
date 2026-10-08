# CamneX Business Platform — API Contract Specification

This document specifies the RESTful API endpoints and data contracts connecting the CamneX Storefront and Admin Dashboard to the future Node.js/Go backend and Central Business Data layer (Phase 2 POS/ERP).

---

## 1. Catalog & Products

### `GET /api/v1/products`
Query parameters:
- `category` (string, slug)
- `brand` (string, slug)
- `search` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `sortBy` (`price_asc` | `price_desc` | `name_asc` | `popular` | `newest`)
- `specFilters` (JSON object of key-value spec criteria)
- `page` (number, default: 1)
- `limit` (number, default: 12)

Response `200 OK`:
```json
{
  "items": [
    {
      "id": "prod-hik-irpf-2mp",
      "name": "Hikvision 2MP Outdoor Bullet Camera",
      "brand": "Hikvision",
      "brandId": "b-hikvision",
      "modelNumber": "DS-2CE1AD0T-IRPF",
      "sku": "HIK-CAM-IRPF-2MP",
      "category": "CCTV Cameras",
      "categoryId": "cat-cctv",
      "productType": "physical",
      "status": "active",
      "websiteVisible": true,
      "posAvailable": true,
      "images": ["https://..."],
      "primaryImage": "https://...",
      "shortDescription": "1080p Full HD Smart IR bullet camera.",
      "description": "...",
      "keyFeatures": ["2MP CMOS", "Smart IR 20m", "IP67"],
      "specifications": {
        "resolution": "2MP (1080p)",
        "form_factor": "Bullet",
        "night_vision": "IR Night Vision (up to 20m)"
      },
      "pricing": {
        "regularPrice": 2450,
        "salePrice": 2350,
        "currency": "BDT"
      },
      "inventory": {
        "available": 48,
        "status": "in_stock"
      },
      "unit": "Piece",
      "warrantyMonths": 12,
      "warrantyText": "1-Year Official Warranty",
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 48,
  "page": 1,
  "totalPages": 4
}
```

### `GET /api/v1/products/:idOrSku`
Response `200 OK`: Single `Product` object with related products and download documents.

### `POST /api/v1/products` (Admin / POS)
Request body: `Product` payload.

---

## 2. Dynamic Specification Templates

### `GET /api/v1/spec-templates`
Response `200 OK`: Array of category-owned spec templates.

### `GET /api/v1/spec-templates/by-category/:categorySlug`
Response `200 OK`:
```json
{
  "id": "tpl-cctv",
  "name": "CCTV Camera",
  "categorySlug": "cctv-cameras",
  "fields": [
    {
      "id": "f-res",
      "name": "Resolution",
      "key": "resolution",
      "type": "enum",
      "options": ["2MP (1080p)", "4MP (2K)", "5MP Super HD", "8MP (4K)"],
      "filterable": true,
      "comparable": true,
      "order": 1
    }
  ]
}
```

---

## 3. Configurable Turnkey Packages

### `GET /api/v1/packages`
Returns all active packages with rule formulas (HDD capacity by camera count, cable meters formula).

### `POST /api/v1/packages/calculate`
Request body:
```json
{
  "packageId": "pkg-cctv-night-vision",
  "cameraCount": 8,
  "formFactor": "bullet"
}
```
Response `200 OK`:
```json
{
  "totalPrice": 27500,
  "components": [
    { "name": "Hikvision 2MP IRPF BULLET Camera", "model": "DS-2CE1AD0T-IRPF", "qty": 8, "unitPrice": 2450 },
    { "name": "Hikvision Turbo HD DVR", "model": "DS-7104HQHI-K1", "qty": 1, "unitPrice": 5800 },
    { "name": "WD Purple 1TB Surveillance HDD", "model": "1TB HDD", "qty": 1, "unitPrice": 4500 },
    { "name": "Cat6 100% Pure Copper Cable", "model": "Cat6 UTP", "qty": 80, "unitPrice": 50 }
  ]
}
```

---

## 4. Cart, Checkout & Orders

### `POST /api/v1/orders`
Request body:
```json
{
  "customerName": "Tanvir Ahmed",
  "customerPhone": "01712345678",
  "customerEmail": "tanvir@gmail.com",
  "deliveryAddress": "House 14, Road 5, Banani, Dhaka",
  "deliveryCity": "Dhaka",
  "deliveryMethod": "inside_dhaka",
  "deliveryFee": 100,
  "installation": {
    "requested": true,
    "preferredDate": "2026-10-15",
    "estimatedFee": 2000,
    "siteNotes": "Duplex residence"
  },
  "paymentMethod": "cod",
  "items": [
    {
      "productId": "prod-hik-irpf-2mp",
      "name": "Hikvision 2MP Outdoor Bullet Camera",
      "model": "DS-2CE1AD0T-IRPF",
      "quantity": 4,
      "unitPrice": 2450,
      "totalPrice": 9800
    }
  ],
  "subtotal": 9800,
  "tax": 0,
  "total": 11900
}
```
Response `201 Created`:
```json
{
  "orderNumber": "CNX-ORD-20261007-4894",
  "status": "pending",
  "timeline": [
    { "status": "pending", "title": "Order Placed", "timestamp": "2026-10-07T09:00:00Z" }
  ]
}
```

### `GET /api/v1/orders/:orderNumber`
Returns full order details with status timeline.

---

## 5. Quotation & On-Site Survey Inquiries

### `POST /api/v1/quotes`
Request body:
```json
{
  "customerName": "Nafis Chowdhury",
  "companyName": "Apex Textiles",
  "phone": "01912345678",
  "email": "nafis@apex.com",
  "serviceType": "cctv_installation",
  "propertyType": "office",
  "siteAddress": "Road 11, Banani, Dhaka",
  "cameraCount": 16,
  "notes": "Need concealed ceiling conduits"
}
```
Response `201 Created`:
```json
{
  "quoteNumber": "CNX-QTE-202610-8214",
  "status": "pending"
}
```

---

## 6. Site Settings & CMS

### `GET /api/v1/settings`
Returns phone, email, address, official credentials (`Hikvision Authorized Partner`, `ZKTeco Authorized Installer`).

### `PUT /api/v1/settings` (Admin)
Updates site parameters.
