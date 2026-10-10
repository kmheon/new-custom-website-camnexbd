#!/usr/bin/env node
/**
 * CamneX Platform - Clean Database Generator
 * Creates an empty SQLite database with all schemas, indexes, and only the admin user.
 * Zero demo/sample data included.
 *
 * Usage:
 *   node scripts/create_clean_db.js [--output=./camnex_clean.db] [--replace]
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load environment variables if present
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const args = process.argv.slice(2);
const shouldReplace = args.includes('--replace');
const outputArg = args.find(a => a.startsWith('--output='));
let targetPath = outputArg 
  ? path.resolve(process.cwd(), outputArg.split('=')[1])
  : (shouldReplace ? path.join(__dirname, '../camnex.db') : path.join(__dirname, '../camnex_clean.db'));

console.log(`[CLEAN-DB] Initializing clean SQLite database at: ${targetPath}`);

if (fs.existsSync(targetPath)) {
  if (shouldReplace || targetPath.endsWith('camnex_clean.db')) {
    console.log('[CLEAN-DB] Removing existing clean target database...');
    try {
      fs.unlinkSync(targetPath);
      if (fs.existsSync(targetPath + '-wal')) fs.unlinkSync(targetPath + '-wal');
      if (fs.existsSync(targetPath + '-shm')) fs.unlinkSync(targetPath + '-shm');
    } catch (e) {
      console.warn('[CLEAN-DB] Warning during unlink:', e.message);
    }
  } else {
    console.log(`[CLEAN-DB] Target file exists. To overwrite, pass --replace or remove it manually.`);
    process.exit(1);
  }
}

const db = new Database(targetPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 1. Categories
db.prepare(`
  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    parent_id TEXT,
    spec_template_id TEXT,
    display_order INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    data_json TEXT NOT NULL
  )
`).run();

// 2. Brands
db.prepare(`
  CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    description TEXT,
    website TEXT,
    featured INTEGER DEFAULT 0,
    data_json TEXT NOT NULL
  )
`).run();

// 3. Spec Templates
db.prepare(`
  CREATE TABLE spec_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    data_json TEXT NOT NULL
  )
`).run();

// 4. Products
db.prepare(`
  CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model_number TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    brand_id TEXT,
    brand_name TEXT,
    category_id TEXT,
    category_slug TEXT,
    status TEXT DEFAULT 'active',
    price REAL,
    compare_price REAL,
    stock_quantity INTEGER DEFAULT 10,
    is_featured INTEGER DEFAULT 0,
    is_popular INTEGER DEFAULT 0,
    is_demo INTEGER DEFAULT 0,
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 5. Packages
db.prepare(`
  CREATE TABLE packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    camera_count INTEGER NOT NULL,
    base_price REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    data_json TEXT NOT NULL
  )
`).run();

// 6. Hero Slides
db.prepare(`
  CREATE TABLE hero_slides (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    start_date TEXT,
    end_date TEXT,
    source_mode TEXT DEFAULT 'manual',
    data_json TEXT NOT NULL
  )
`).run();

// 7. Homepage Sections
db.prepare(`
  CREATE TABLE homepage_sections (
    id TEXT PRIMARY KEY,
    section_type TEXT NOT NULL,
    title TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    data_json TEXT NOT NULL
  )
`).run();

// 8. Orders
db.prepare(`
  CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    total_amount REAL NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'pending',
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 9. Customers
db.prepare(`
  CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    company_name TEXT,
    customer_type TEXT DEFAULT 'individual',
    password_hash TEXT,
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 10. Quotes
db.prepare(`
  CREATE TABLE quotes (
    id TEXT PRIMARY KEY,
    reference_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 11. Service Requests
db.prepare(`
  CREATE TABLE service_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service_id TEXT,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 11b. Services (Quick Service Offerings)
db.prepare(`
  CREATE TABLE services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_label TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    data_json TEXT NOT NULL
  )
`).run();

// 11c. Package Series
db.prepare(`
  CREATE TABLE package_series (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    enabled INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    data_json TEXT NOT NULL
  )
`).run();

// 12. CMS Pages
db.prepare(`
  CREATE TABLE cms_pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    data_json TEXT NOT NULL
  )
`).run();

// 13. Blog Posts
db.prepare(`
  CREATE TABLE blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    data_json TEXT NOT NULL
  )
`).run();

// 14. Projects
db.prepare(`
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    data_json TEXT NOT NULL
  )
`).run();

// 15. FAQs
db.prepare(`
  CREATE TABLE faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    data_json TEXT NOT NULL
  )
`).run();

// 15b. Testimonials
db.prepare(`
  CREATE TABLE testimonials (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    rating INTEGER DEFAULT 5,
    content TEXT NOT NULL,
    image TEXT,
    verified INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 16. Settings
db.prepare(`
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`).run();

const cleanSiteSettings = {
  companyName: 'CamneX Bangladesh',
  phone: process.env.SITE_PHONE || '+880 1540-535150',
  email: process.env.SITE_EMAIL || 'contact@camnexbd.com',
  secondaryEmail: 'camnexbd@gmail.com',
  website: 'https://camnexbd.com',
  facebookUrl: 'https://facebook.com/camnexbd',
  whatsappNumber: '8801540535150',
  address: 'Block A, Chandrima Model Town, Shop 01, 1st Floor, House 22, Road 06 Main Rd, Dhaka 1207',
  credentials: ['Hikvision Authorized Partner', 'ZKTeco Authorized Installer'],
  services: ['CCTV/video surveillance', 'Networking', 'Access control', 'Installation'],
  businessHours: 'Sat-Thu 9:30 AM - 7:30 PM, Friday on-call',
  enableStockBadges: true,
  sampleDataBanner: false,
  showSampleContent: false,
  specialOfferSlider: {
    enabled: true,
    interval: 5,
    maxOffers: 5
  },
  enableCashOnDelivery: false, // Explicitly OFF by default in clean DB
  reassurances: [], // Explicitly empty in clean DB
  bkashMerchantNumber: '',
  nagadMerchantNumber: '',
  bankDetails: null,
  deliveryFeeInsideDhaka: null,
  deliveryFeeOutsideDhaka: null,
  installationBaseFee: null
};
db.prepare("INSERT INTO settings (key, value) VALUES ('site_settings', ?)").run(JSON.stringify(cleanSiteSettings));

// 17. Media
db.prepare(`
  CREATE TABLE media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT,
    url TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 18. Users (Admin and Staff)
db.prepare(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    status TEXT DEFAULT 'active',
    must_change_password INTEGER DEFAULT 0,
    branch_id TEXT,
    warehouse_id TEXT,
    last_login DATETIME,
    totp_secret TEXT,
    totp_enabled INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 19. Sessions
db.prepare(`
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    app TEXT DEFAULT 'storefront',
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 20. Roles, Role Permissions, User Roles
db.prepare(`
  CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE role_permissions (
    role_id TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_key)
  )
`).run();

db.prepare(`
  CREATE TABLE user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    PRIMARY KEY (user_id, role_id)
  )
`).run();

// 21. Stock Movements
db.prepare(`
  CREATE TABLE stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    quantity_change REAL NOT NULL,
    balance_after REAL NOT NULL,
    movement_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT,
    user_id TEXT,
    user_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
db.prepare(`CREATE INDEX idx_stock_movements_prod ON stock_movements(product_id)`).run();

// 22. Audit Logs (Immutable)
db.prepare(`
  CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    surface TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    before_data TEXT,
    after_data TEXT,
    diff TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
db.prepare(`CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id)`).run();
db.prepare(`CREATE INDEX idx_audit_user ON audit_logs(user_id)`).run();

// 23. Domain Events Outbox
db.prepare(`
  CREATE TABLE domain_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
  )
`).run();
db.prepare(`CREATE INDEX idx_events_status ON domain_events(status)`).run();

// 24. Company Profile
db.prepare(`
  CREATE TABLE company_profile (
    id TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 25. Background Jobs Queue
db.prepare(`
  CREATE TABLE background_jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    result_json TEXT,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  )
`).run();

// 26. URL Redirects
db.prepare(`
  CREATE TABLE redirects (
    id TEXT PRIMARY KEY,
    from_path TEXT UNIQUE NOT NULL,
    to_path TEXT NOT NULL,
    status_code INTEGER DEFAULT 301,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 27. Wishlists (Customer Wishlist Items)
db.prepare(`
  CREATE TABLE wishlists (
    customer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, product_id)
  )
`).run();

// Archiving columns on main entities
try { db.prepare(`ALTER TABLE products ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE products ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE categories ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE categories ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE brands ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE brands ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE services ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE services ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE customers ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
try { db.prepare(`ALTER TABLE customers ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}

// Indexes
db.prepare(`CREATE INDEX idx_jobs_status ON background_jobs(status)`).run();
db.prepare(`CREATE INDEX idx_products_category ON products(category_slug)`).run();
db.prepare(`CREATE INDEX idx_products_brand ON products(brand_id)`).run();
db.prepare(`CREATE INDEX idx_products_status ON products(status)`).run();
db.prepare(`CREATE INDEX idx_orders_phone ON orders(customer_phone)`).run();
db.prepare(`CREATE INDEX idx_orders_number ON orders(order_number)`).run();
db.prepare(`CREATE INDEX idx_customers_phone ON customers(phone)`).run();
db.prepare(`CREATE INDEX idx_sessions_expires ON sessions(expires_at)`).run();
db.prepare(`CREATE INDEX idx_redirects_from ON redirects(from_path)`).run();
db.prepare(`CREATE INDEX idx_wishlists_customer ON wishlists(customer_id)`).run();

// Seed system roles
const { SYSTEM_ROLES } = require('../server/shared/permissions');
const insertRole = db.prepare(`INSERT OR REPLACE INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)`);
const insertRolePerm = db.prepare(`INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)`);

for (const role of Object.values(SYSTEM_ROLES)) {
  insertRole.run(role.id, role.name, role.description, 1);
  for (const perm of role.permissions) {
    insertRolePerm.run(role.id, perm);
  }
}

// Create initial Administrator User from environment variable
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@camnexbd.com').toLowerCase().trim();
const adminPass = process.env.ADMIN_PASSWORD;

let passToHash = adminPass;
if (!passToHash || !passToHash.trim()) {
  passToHash = crypto.randomBytes(12).toString('base64url');
  console.log('\n[SECURITY NOTICE] No ADMIN_PASSWORD set in .env. Generated temporary administrator password:');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${passToHash}`);
  console.log('  * Configure ADMIN_PASSWORD in your production .env file.\n');
} else {
  console.log(`[CLEAN-DB] Initial administrator created for ${adminEmail} using ADMIN_PASSWORD from environment.`);
}

const hash = bcrypt.hashSync(passToHash.trim(), 10);
const adminId = `usr-${Date.now()}`;
db.prepare(`
  INSERT INTO users (id, name, email, password_hash, role, status)
  VALUES (?, ?, ?, ?, ?, 'active')
`).run(adminId, 'CamneX Administrator', adminEmail, hash, 'admin');

// Assign Super Admin role to initial administrator
db.prepare(`
  INSERT INTO user_roles (user_id, role_id)
  VALUES (?, ?)
`).run(adminId, SYSTEM_ROLES.SUPER_ADMIN.id);

db.close();

console.log('[CLEAN-DB] Database creation completed successfully. Zero demo data inserted.');

