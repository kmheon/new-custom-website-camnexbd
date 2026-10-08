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
  if (shouldReplace) {
    console.log('[CLEAN-DB] Removing existing target database (--replace specified)...');
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
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    data_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 20. Background Jobs Queue
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

// 21. URL Redirects
db.prepare(`
  CREATE TABLE redirects (
    id TEXT PRIMARY KEY,
    from_path TEXT UNIQUE NOT NULL,
    to_path TEXT NOT NULL,
    status_code INTEGER DEFAULT 301,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

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
  INSERT INTO users (id, name, email, password_hash, role)
  VALUES (?, ?, ?, ?, ?)
`).run(adminId, 'CamneX Administrator', adminEmail, hash, 'admin');

db.close();

console.log('[CLEAN-DB] Database creation completed successfully. Zero demo data inserted.');

