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
      service_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  ensureAdminUser();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)`).run();
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`).run();

  seedDatabaseIfEmpty();
  ensureComponentProducts();
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
    'projects', 'settings', 'hero_slides', 'homepage_sections', 'customers', 'media', 'faqs'
  ];
  for (const t of dropTables) {
    try { db.prepare(`DELETE FROM ${t}`).run(); } catch(err) {}
  }
  seedDatabaseIfEmpty();
}

function clearDemoData() {
  try {
    db.prepare('DELETE FROM products WHERE is_demo = 1').run();
    db.prepare("DELETE FROM packages WHERE data_json LIKE '%\"isDemo\":true%'").run();
    db.prepare("DELETE FROM projects WHERE data_json LIKE '%\"isDemo\":true%'").run();
    
    // Update settings to hide sample data banner
    const row = db.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get();
    if (row) {
      const s = JSON.parse(row.value);
      s.sampleDataBanner = false;
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
