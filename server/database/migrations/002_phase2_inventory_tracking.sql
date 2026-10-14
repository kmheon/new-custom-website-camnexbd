-- Migration 002: Phase 2 Warehouses, Inventory Locations, Serials, Batches & Reservations
-- Prepares normalized multi-location stock tracking for future ERP/POS

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address_line1 TEXT,
  city TEXT DEFAULT 'Dhaka',
  district TEXT DEFAULT 'Dhaka',
  contact_person TEXT,
  contact_phone TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default central warehouse if empty
INSERT OR IGNORE INTO warehouses (id, name, code, city, is_default, is_active)
VALUES ('wh-central', 'CamneX Central Headend Warehouse (Dhaka)', 'WH-CENTRAL', 'Dhaka', 1, 1);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) VIRTUAL,
  reorder_point INTEGER DEFAULT 5,
  bin_location TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE(warehouse_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory_items(warehouse_id, product_id);

CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY,
  warehouse_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  batch_number TEXT NOT NULL,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  quantity_received INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  supplier_invoice_ref TEXT,
  received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches(product_id, batch_number);

CREATE TABLE IF NOT EXISTS inventory_serials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  warehouse_id TEXT NOT NULL,
  batch_id TEXT,
  serial_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'reserved', 'sold', 'rma_repair', 'scrapped')),
  order_id TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_serials_lookup ON inventory_serials(product_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_serials_code ON inventory_serials(serial_number);

CREATE TABLE IF NOT EXISTS stock_reservations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order ON stock_reservations(order_id, status);

