const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load environment variables from .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (_) {}

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'camnex.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  // Check if legacy schema without data_json exists
  let needsRebuild = false;
  try {
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const hasDataJson = tableInfo.some(col => col.name === 'data_json');
    if (tableInfo.length > 0 && !hasDataJson) {
      needsRebuild = true;
    }
  } catch (e) {
    // Table doesn't exist yet
  }

  if (needsRebuild) {
    console.log('Migrating SQLite schema to unified domain-entity model with data_json...');
    const dropTables = [
      'products', 'categories', 'brands', 'product_spec_templates', 'spec_templates',
      'packages', 'orders', 'quotes', 'service_requests', 'cms_pages', 'blog_posts',
      'projects', 'settings', 'hero_slides', 'homepage_sections', 'customers', 'media', 'faqs'
    ];
    for (const t of dropTables) {
      try { db.prepare(`DROP TABLE IF EXISTS ${t}`).run(); } catch(err) {}
    }
  }

  // 1. Categories
  db.prepare(`
    CREATE TABLE IF NOT EXISTS categories (
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
    CREATE TABLE IF NOT EXISTS brands (
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
    CREATE TABLE IF NOT EXISTS spec_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      data_json TEXT NOT NULL
    )
  `).run();

  // 4. Products
  db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
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
    CREATE TABLE IF NOT EXISTS packages (
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
    CREATE TABLE IF NOT EXISTS hero_slides (
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
    CREATE TABLE IF NOT EXISTS homepage_sections (
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
    CREATE TABLE IF NOT EXISTS orders (
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
    CREATE TABLE IF NOT EXISTS customers (
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

  // 9b. Customer Wishlists
  db.prepare(`
    CREATE TABLE IF NOT EXISTS wishlists (
      customer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (customer_id, product_id)
    )
  `).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON wishlists(customer_id)`).run();

  // 9c. Newsletter Subscribers
  db.prepare(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      source TEXT DEFAULT 'footer_form',
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at DATETIME
    )
  `).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)`).run();

  // 9d. Customer Notes & CRM Interactions
  db.prepare(`
    CREATE TABLE IF NOT EXISTS customer_notes (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      note_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id)`).run();

  // 10. Quotes
  db.prepare(`
    CREATE TABLE IF NOT EXISTS quotes (
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
    CREATE TABLE IF NOT EXISTS service_requests (
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

  try {
    db.prepare('ALTER TABLE service_requests ADD COLUMN service_id TEXT').run();
  } catch (_) {}

  // 11b. Services (Quick Service Offerings)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS services (
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
    CREATE TABLE IF NOT EXISTS package_series (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      enabled INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1,
      data_json TEXT NOT NULL
    )
  `).run();

  // 11d. Package System Types (IP / Analogue / Wireless)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS package_system_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      display_order INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      data_json TEXT NOT NULL
    )
  `).run();

  // 11e. Plain Language Glossary Terms
  db.prepare(`
    CREATE TABLE IF NOT EXISTS glossary_terms (
      id TEXT PRIMARY KEY,
      term TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_meaning TEXT NOT NULL,
      long_meaning TEXT,
      display_order INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      data_json TEXT NOT NULL
    )
  `).run();

  // 12. CMS Pages
  db.prepare(`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      data_json TEXT NOT NULL
    )
  `).run();

  // 13. Blog Posts
  db.prepare(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      data_json TEXT NOT NULL
    )
  `).run();

  // 14. Projects
  db.prepare(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      data_json TEXT NOT NULL
    )
  `).run();

  // 15. FAQs
  db.prepare(`
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      data_json TEXT NOT NULL
    )
  `).run();

  // 15b. Testimonials
  db.prepare(`
    CREATE TABLE IF NOT EXISTS testimonials (
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
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `).run();

  // 17. Media
  db.prepare(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT,
      url TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      webp_url TEXT,
      thumb_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  try { db.prepare(`ALTER TABLE media ADD COLUMN webp_url TEXT`).run(); } catch (_) {}
  try { db.prepare(`ALTER TABLE media ADD COLUMN thumb_url TEXT`).run(); } catch (_) {}
  try { db.prepare(`ALTER TABLE media ADD COLUMN alt_text TEXT`).run(); } catch (_) {}
  try { db.prepare(`ALTER TABLE media ADD COLUMN folder TEXT DEFAULT 'general'`).run(); } catch (_) {}

  // 17b. Offers & Coupons
  db.prepare(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      scope_type TEXT DEFAULT 'all',
      scope_id TEXT,
      start_date DATETIME,
      end_date DATETIME,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`).run();

  // 17c. Documents (Datasheets, Manuals, Catalogs)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      category_id TEXT,
      product_id TEXT,
      file_url TEXT NOT NULL,
      file_size TEXT,
      mime_type TEXT,
      download_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type)`).run();

  // 18. Users (Admin and Staff)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 19. Sessions
  // 19. Sessions
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
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
    CREATE TABLE IF NOT EXISTS background_jobs (
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
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON background_jobs(status)`).run();

  // 21. URL Redirects Manager
  db.prepare(`
    CREATE TABLE IF NOT EXISTS redirects (
      id TEXT PRIMARY KEY,
      from_path TEXT UNIQUE NOT NULL,
      to_path TEXT NOT NULL,
      status_code INTEGER DEFAULT 301,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_redirects_from ON redirects(from_path)`).run();

  // Indexes for high performance
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`).run();

  migratePlatformTables(db);
  ensureAdminUser();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`).run();

  seedDatabaseIfEmpty();
  ensureComponentProducts();
  ensurePackageSystemTypes();
}

function migratePlatformTables(targetDb) {
  // 1. Roles table
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 2. Role permissions
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_key TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_key)
    )
  `).run();

  // 3. User roles
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id)
    )
  `).run();

  // 4. Stock movements
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS stock_movements (
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
  targetDb.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id)`).run();

  // 5. Audit logs (immutable)
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
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
  targetDb.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id)`).run();
  targetDb.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)`).run();

  targetDb.prepare(`
    CREATE TRIGGER IF NOT EXISTS audit_logs_no_update BEFORE UPDATE ON audit_logs
    BEGIN
      SELECT RAISE(ABORT, 'audit_logs is append-only');
    END;
  `).run();
  targetDb.prepare(`
    CREATE TRIGGER IF NOT EXISTS audit_logs_no_delete BEFORE DELETE ON audit_logs
    BEGIN
      SELECT RAISE(ABORT, 'audit_logs is append-only');
    END;
  `).run();

  // 6. Domain events outbox
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS domain_events (
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
  targetDb.prepare(`CREATE INDEX IF NOT EXISTS idx_events_status ON domain_events(status)`).run();

  // 7. Company profile
  targetDb.prepare(`
    CREATE TABLE IF NOT EXISTS company_profile (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // User columns migration
  const userCols = targetDb.prepare(`PRAGMA table_info(users)`).all().map(c => c.name);
  if (!userCols.includes('status')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`).run(); } catch (_) {}
  }
  if (!userCols.includes('must_change_password')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!userCols.includes('branch_id')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN branch_id TEXT`).run(); } catch (_) {}
  }
  if (!userCols.includes('warehouse_id')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN warehouse_id TEXT`).run(); } catch (_) {}
  }
  if (!userCols.includes('last_login')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN last_login DATETIME`).run(); } catch (_) {}
  }
  if (!userCols.includes('totp_secret')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN totp_secret TEXT`).run(); } catch (_) {}
  }
  if (!userCols.includes('totp_enabled')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!userCols.includes('failed_login_attempts')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!userCols.includes('locked_until')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN locked_until DATETIME`).run(); } catch (_) {}
  }
  if (!userCols.includes('updated_at')) {
    try { targetDb.prepare(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`).run(); } catch (_) {}
  }

  // Sessions app column migration
  const sessionCols = targetDb.prepare(`PRAGMA table_info(sessions)`).all().map(c => c.name);
  if (!sessionCols.includes('app')) {
    try { targetDb.prepare(`ALTER TABLE sessions ADD COLUMN app TEXT DEFAULT 'storefront'`).run(); } catch (_) {}
  }

  // Archiving columns
  const prodCols = targetDb.prepare(`PRAGMA table_info(products)`).all().map(c => c.name);
  if (!prodCols.includes('is_archived')) {
    try { targetDb.prepare(`ALTER TABLE products ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!prodCols.includes('archived_at')) {
    try { targetDb.prepare(`ALTER TABLE products ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
  }

  const catCols = targetDb.prepare(`PRAGMA table_info(categories)`).all().map(c => c.name);
  if (!catCols.includes('is_archived')) {
    try { targetDb.prepare(`ALTER TABLE categories ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!catCols.includes('archived_at')) {
    try { targetDb.prepare(`ALTER TABLE categories ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
  }

  const brandCols = targetDb.prepare(`PRAGMA table_info(brands)`).all().map(c => c.name);
  if (!brandCols.includes('is_archived')) {
    try { targetDb.prepare(`ALTER TABLE brands ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!brandCols.includes('archived_at')) {
    try { targetDb.prepare(`ALTER TABLE brands ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
  }

  const srvCols = targetDb.prepare(`PRAGMA table_info(services)`).all().map(c => c.name);
  if (!srvCols.includes('is_archived')) {
    try { targetDb.prepare(`ALTER TABLE services ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!srvCols.includes('archived_at')) {
    try { targetDb.prepare(`ALTER TABLE services ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
  }

  const custCols = targetDb.prepare(`PRAGMA table_info(customers)`).all().map(c => c.name);
  if (!custCols.includes('is_archived')) {
    try { targetDb.prepare(`ALTER TABLE customers ADD COLUMN is_archived INTEGER DEFAULT 0`).run(); } catch (_) {}
  }
  if (!custCols.includes('archived_at')) {
    try { targetDb.prepare(`ALTER TABLE customers ADD COLUMN archived_at DATETIME`).run(); } catch (_) {}
  }

  // Seed system roles & permissions
  const { SYSTEM_ROLES } = require('./server/shared/permissions');
  const insertRole = targetDb.prepare(`INSERT OR REPLACE INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)`);
  const insertRolePerm = targetDb.prepare(`INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)`);

  for (const role of Object.values(SYSTEM_ROLES)) {
    insertRole.run(role.id, role.name, role.description, 1);
    for (const perm of role.permissions) {
      insertRolePerm.run(role.id, perm);
    }
  }

  // Ensure all existing users with role = 'admin' are mapped to Super Admin
  const adminUsers = targetDb.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
  const insertUserRole = targetDb.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`);
  for (const u of adminUsers) {
    insertUserRole.run(u.id, SYSTEM_ROLES.SUPER_ADMIN.id);
  }
}

function ensureComponentProducts() {
  try {
    const seedsPath = path.join(__dirname, 'serverSeeds.json');
    if (!fs.existsSync(seedsPath)) return;
    const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        id, name, model_number, sku, brand_id, brand_name, category_id, category_slug,
        status, price, compare_price, stock_quantity, is_featured, is_popular, is_demo, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seeds.INITIAL_PRODUCTS || []) {
      insertProduct.run(
        p.id, p.name, p.modelNumber, p.sku, p.brandId, p.brand, p.categoryId,
        p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
        p.status || 'active', p.pricing?.regularPrice || null, p.pricing?.salePrice || null,
        p.inventory?.available || 10, p.isFeatured ? 1 : 0, p.isPopular ? 1 : 0, p.isDemo ? 1 : 0,
        JSON.stringify(p)
      );
    }
  } catch (err) {
    console.error('Failed to sync component products:', err.message);
  }
}

function ensurePackageSystemTypes() {
  try {
    const count = db.prepare('SELECT count(*) as count FROM package_system_types').get();
    if (count.count === 0) {
      const seedsPath = path.join(__dirname, 'serverSeeds.json');
      if (!fs.existsSync(seedsPath)) return;
      const seeds = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
      const insertSysType = db.prepare(`
        INSERT OR REPLACE INTO package_system_types (id, name, slug, description, icon, display_order, enabled, data_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const st of seeds.INITIAL_PACKAGE_SYSTEM_TYPES || []) {
        insertSysType.run(
          st.id,
          st.name,
          st.slug,
          st.description || '',
          st.icon || '',
          st.order || 1,
          st.enabled !== false ? 1 : 0,
          JSON.stringify(st)
        );
      }
      console.log('Seeded package_system_types with default system types.');
    }
  } catch (err) {
    console.error('Failed to ensure package system types:', err.message);
  }
}

function ensureAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@camnexbd.com').toLowerCase().trim();
  const adminPass = process.env.ADMIN_PASSWORD;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) {
    if (adminPass && adminPass.trim()) {
      const hash = bcrypt.hashSync(adminPass.trim(), 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
    }
    return;
  }
  let passwordToUse;
  if (adminPass && adminPass.trim()) {
    passwordToUse = adminPass.trim();
    console.log(`[AUTH] Admin user created from ADMIN_PASSWORD environment variable for ${adminEmail}`);
  } else {
    passwordToUse = crypto.randomBytes(12).toString('base64url');
    console.log('\n================================================================');
    console.log('[SECURITY NOTICE] Initial Admin User Created:');
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${passwordToUse}`);
    console.log('  * IMPORTANT: Set the ADMIN_PASSWORD environment variable to override.');
    console.log('================================================================\n');
  }

  const hash = bcrypt.hashSync(passwordToUse, 10);
  const adminId = `usr-${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'CamneX Administrator', adminEmail, hash, 'admin');
}

function seedDatabaseIfEmpty() {
  if (process.env.SKIP_SEED === '1' || process.env.SKIP_SEED === 'true') return;
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (catCount > 0) return; // Already seeded

  console.log('Seeding SQLite database from serverSeeds.json...');
  let seeds;
  try {
    seeds = JSON.parse(fs.readFileSync(path.join(__dirname, 'serverSeeds.json'), 'utf8'));
  } catch (err) {
    console.error('Failed to read serverSeeds.json:', err);
    return;
  }

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description, image, spec_template_id, display_order, status, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of seeds.INITIAL_CATEGORIES || []) {
    insertCategory.run(c.id, c.name, c.slug, c.description || '', c.image || '', c.specTemplateId || '', c.order || 1, 'active', JSON.stringify(c));
  }

  const insertBrand = db.prepare(`
    INSERT INTO brands (id, name, slug, logo, description, website, featured, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of seeds.INITIAL_BRANDS || []) {
    insertBrand.run(b.id, b.name, b.slug, b.logo || '', b.description || '', b.website || '', b.featured ? 1 : 0, JSON.stringify(b));
  }

  const insertTemplate = db.prepare(`
    INSERT INTO spec_templates (id, name, category_slug, data_json)
    VALUES (?, ?, ?, ?)
  `);
  for (const t of seeds.INITIAL_SPEC_TEMPLATES || []) {
    insertTemplate.run(t.id, t.name, t.categorySlug, JSON.stringify(t));
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, model_number, sku, brand_id, brand_name, category_id, category_slug, status, price, compare_price, stock_quantity, is_featured, is_popular, is_demo, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of seeds.INITIAL_PRODUCTS || []) {
    insertProduct.run(
      p.id, p.name, p.modelNumber, p.sku, p.brandId, p.brand, p.categoryId,
      p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      p.status || 'active', p.pricing?.regularPrice || 0, p.pricing?.salePrice || 0,
      p.inventory?.available || 10, p.isFeatured ? 1 : 0, p.isPopular ? 1 : 0, p.isDemo ? 1 : 0,
      JSON.stringify(p)
    );
  }

  const insertPkg = db.prepare(`
    INSERT INTO packages (id, name, slug, description, camera_count, base_price, is_active, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const pkg of seeds.INITIAL_PACKAGES || []) {
    insertPkg.run(pkg.id, pkg.name, pkg.slug, pkg.description || '', pkg.cameraCount || 4, pkg.basePrice || 0, pkg.isActive !== false ? 1 : 0, JSON.stringify(pkg));
  }

  const insertSlide = db.prepare(`
    INSERT INTO hero_slides (id, title, enabled, display_order, start_date, end_date, source_mode, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of seeds.INITIAL_HERO_SLIDES || []) {
    insertSlide.run(s.id, s.title, s.enabled ? 1 : 0, s.order || 1, s.startDate || null, s.endDate || null, s.sourceMode || 'manual', JSON.stringify(s));
  }

  const insertSection = db.prepare(`
    INSERT INTO homepage_sections (id, section_type, title, enabled, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const sec of seeds.INITIAL_HOMEPAGE_SECTIONS || []) {
    insertSection.run(sec.id, sec.type, sec.title, sec.enabled ? 1 : 0, sec.order || 1, JSON.stringify(sec));
  }

  const insertPost = db.prepare(`
    INSERT INTO blog_posts (id, title, slug, data_json)
    VALUES (?, ?, ?, ?)
  `);
  for (const post of seeds.INITIAL_BLOG_POSTS || []) {
    insertPost.run(post.id, post.title, post.slug, JSON.stringify(post));
  }

  const insertFaq = db.prepare(`
    INSERT INTO faqs (id, question, data_json)
    VALUES (?, ?, ?)
  `);
  for (const faq of seeds.INITIAL_FAQS || []) {
    insertFaq.run(faq.id, faq.question, JSON.stringify(faq));
  }

  const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (id, client_name, company, role, rating, content, image, verified, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of seeds.INITIAL_TESTIMONIALS || []) {
    insertTestimonial.run(t.id, t.author || t.client_name, t.company || '', t.role || '', t.rating || 5, t.content || '', t.avatar || t.image || '', 1, t.order || 1, JSON.stringify(t));
  }

  const insertProject = db.prepare(`
    INSERT INTO projects (id, title, slug, data_json)
    VALUES (?, ?, ?, ?)
  `);
  for (const p of seeds.INITIAL_PROJECTS || []) {
    insertProject.run(p.id, p.title, p.slug || p.id, JSON.stringify(p));
  }

  const insertService = db.prepare(`
    INSERT INTO services (id, title, short_label, enabled, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const s of seeds.INITIAL_SERVICES || []) {
    insertService.run(s.id, s.title, s.shortLabel || s.short_label || s.title, s.enabled !== false ? 1 : 0, s.order || 1, JSON.stringify(s));
  }

  const insertSeries = db.prepare(`
    INSERT INTO package_series (id, name, slug, enabled, display_order, data_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const ps of seeds.INITIAL_PACKAGE_SERIES || []) {
    insertSeries.run(ps.id, ps.name, ps.slug, ps.enabled !== false ? 1 : 0, ps.order || 1, JSON.stringify(ps));
  }

  const insertSysType = db.prepare(`
    INSERT OR REPLACE INTO package_system_types (id, name, slug, description, icon, display_order, enabled, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const st of seeds.INITIAL_PACKAGE_SYSTEM_TYPES || []) {
    insertSysType.run(
      st.id,
      st.name,
      st.slug,
      st.description || '',
      st.icon || '',
      st.order || 1,
      st.enabled !== false ? 1 : 0,
      JSON.stringify(st)
    );
  }

  const insertGlossary = db.prepare(`
    INSERT OR REPLACE INTO glossary_terms (id, term, slug, short_meaning, long_meaning, display_order, is_active, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const g of seeds.INITIAL_GLOSSARY_TERMS || []) {
    insertGlossary.run(g.id, g.term, g.slug, g.shortMeaning, g.longMeaning || '', g.order || 1, 1, JSON.stringify(g));
  }

  if (seeds.INITIAL_SITE_SETTINGS) {
    const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    insertSetting.run('site_settings', JSON.stringify(seeds.INITIAL_SITE_SETTINGS));
  }

  console.log('Database seeded successfully with all collections.');
}

function reseedDatabase() {
  console.log('Reseeding SQLite database from serverSeeds.json...');
  const dropTables = [
    'products', 'categories', 'brands', 'spec_templates',
    'packages', 'orders', 'quotes', 'service_requests', 'blog_posts',
    'projects', 'testimonials', 'settings', 'hero_slides', 'homepage_sections', 'customers', 'media', 'faqs',
    'services', 'package_series', 'package_system_types', 'glossary_terms'
  ];
  for (const t of dropTables) {
    try { db.prepare(`DELETE FROM ${t}`).run(); } catch(err) {}
  }
  seedDatabaseIfEmpty();
}

function clearDemoData() {
  try {
    db.prepare('DELETE FROM products WHERE is_demo = 1 OR data_json LIKE \'%"sample":true%\'').run();
    db.prepare("DELETE FROM packages WHERE data_json LIKE '%\"isDemo\":true%' OR data_json LIKE '%\"sample\":true%'").run();
    db.prepare("DELETE FROM projects WHERE data_json LIKE '%\"isDemo\":true%' OR data_json LIKE '%\"sample\":true%'").run();
    db.prepare("DELETE FROM testimonials WHERE data_json LIKE '%\"sample\":true%'").run();
    
    // Update settings to hide sample data banner
    const row = db.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get();
    if (row) {
      const s = JSON.parse(row.value);
      s.sampleDataBanner = false;
      s.showDemoTags = false;
      db.prepare("UPDATE settings SET value = ? WHERE key = 'site_settings'").run(JSON.stringify(s));
    }
    return true;
  } catch (err) {
    console.error('Error clearing demo data:', err);
    throw err;
  }
}

initDb();

module.exports = db;
module.exports.reseedDatabase = reseedDatabase;
module.exports.clearDemoData = clearDemoData;
module.exports.dbPath = dbPath;
