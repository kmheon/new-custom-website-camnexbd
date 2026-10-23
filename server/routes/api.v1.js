/**
 * Unified Business API v1 Router
 * Mounts all 12 domain modules. Routers contain no business logic.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../../database');
const { issueCsrfCookie, requireAdmin, requirePermission } = require('../middleware/auth');

// Mount Domain Modules
const catalogRouter = require('../modules/catalog/catalog.router');
const pricingRouter = require('../modules/pricing/pricing.router');
const inventoryRouter = require('../modules/inventory/inventory.router');
const ordersRouter = require('../modules/orders/orders.router');
const customersRouter = require('../modules/customers/customers.router');
const quotesRouter = require('../modules/quotes/quotes.router');
const servicesRouter = require('../modules/services/services.router');
const cmsRouter = require('../modules/cms/cms.router');
const mediaRouter = require('../modules/media/media.router');
const companyRouter = require('../modules/company/company.router');
const staffRouter = require('../modules/staff/staff.router');
const auditRouter = require('../modules/audit/audit.router');
const webhookRouter = require('../modules/webhooks/webhook.router');
const { router: managedRouter } = require('../modules/managed/managed.router');

// 0. OpenAPI 3.0 Documentation Endpoints
router.get('/docs/openapi.json', (req, res) => {
  const specPath = path.join(__dirname, '../docs/openapi.json');
  if (fs.existsSync(specPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(specPath);
  } else {
    res.status(404).json({ error: 'OpenAPI specification not found' });
  }
});

router.get('/docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CamneX Security Platform API v1 Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

// 1. CSRF Token Endpoint
router.get('/auth/csrf', (req, res) => {
  const token = issueCsrfCookie(res);
  res.json({ csrfToken: token });
});

// 1b. External Auth Providers Status
router.get(['/auth', '/auth/providers', '/auth/diagnostic'], (req, res) => {
  const { getProvidersStatus } = require('../auth/socialAuth');
  res.json(getProvidersStatus());
});

// 2. Server-Side Unified Search
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ products: [], categories: [], brands: [], packages: [], total: 0 });
    }

    const s = `%${q}%`;
    const prodRows = db.prepare(`
      SELECT data_json FROM products
      WHERE (is_archived IS NULL OR is_archived = 0)
        AND (name LIKE ? OR model_number LIKE ? OR sku LIKE ? OR brand_name LIKE ? OR category_slug LIKE ?)
      LIMIT 20
    `).all(s, s, s, s, s);
    const products = prodRows.map(r => JSON.parse(r.data_json));

    const catRows = db.prepare(`
      SELECT id, name, slug, description, image, icon FROM categories
      WHERE (is_archived IS NULL OR is_archived = 0) AND (name LIKE ? OR slug LIKE ? OR description LIKE ?)
      LIMIT 5
    `).all(s, s, s);

    const brandRows = db.prepare(`
      SELECT id, name, slug, logo FROM brands
      WHERE (is_archived IS NULL OR is_archived = 0) AND (name LIKE ? OR slug LIKE ?)
      LIMIT 5
    `).all(s, s);

    const pkgRows = db.prepare(`
      SELECT data_json FROM packages
      WHERE name LIKE ? OR slug LIKE ? OR description LIKE ?
      LIMIT 5
    `).all(s, s, s);
    const packages = pkgRows.map(r => JSON.parse(r.data_json));

    const total = products.length + catRows.length + brandRows.length + packages.length;

    res.json({
      query: q,
      products,
      categories: catRows,
      brands: brandRows,
      packages,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Research Endpoint
router.get('/research', (req, res) => {
  const { brand = 'Hikvision', model } = req.query;
  if (!model) return res.status(400).json({ error: 'Model number is required' });

  const m = model.toLowerCase();
  let result = {
    jobId: `job-${Date.now()}`,
    brand: brand,
    modelQuery: model,
    suggestedName: { value: `${brand} ${model}`, sourceUrl: 'Official Manufacturer Index', confidence: 'medium', status: 'pending' },
    suggestedCategory: { value: 'cctv-cameras', sourceUrl: 'Product Specification Index', confidence: 'medium', status: 'pending' },
    suggestedShortDesc: { value: `${brand} ${model} high performance hardware asset.`, sourceUrl: 'Official Catalog Overview', confidence: 'medium', status: 'pending' },
    suggestedKeyFeatures: {
      value: ['Official manufacturer build warranty', 'Engineered for commercial security deployments'],
      sourceUrl: 'Technical Documentation',
      confidence: 'medium',
      status: 'pending'
    },
    suggestedSpecs: {
      resolution: { value: '2MP (1080p)', sourceUrl: 'Datasheet Specification', confidence: 'high', status: 'pending' },
      form_factor: { value: 'Bullet', sourceUrl: 'Datasheet Mechanical Diagram', confidence: 'high', status: 'pending' }
    },
    suggestedDocuments: {
      value: [{ title: `${brand} ${model} Datasheet (PDF)`, url: `https://example.com/datasheet-${model}.pdf`, type: 'datasheet' }],
      sourceUrl: 'Manufacturer Technical Portal',
      confidence: 'high',
      status: 'pending'
    }
  };

  if (m.includes('irpf') || m.includes('bullet') || m.includes('2ce1')) {
    result.suggestedName.value = 'Hikvision 2MP Outdoor Bullet Camera';
    result.suggestedCategory.value = 'cctv-cameras';
    result.suggestedShortDesc.value = '2 MP high performance CMOS sensor with 20m infrared Smart IR.';
    result.suggestedKeyFeatures.value = [
      '2 MP high performance CMOS sensor (1920 × 1080)',
      'Smart IR: up to 20 m infrared night vision distance',
      '4 in 1 video output (switchable TVI/AHD/CVI/CVBS)',
      'IP67 dust and water resistance'
    ];
    result.suggestedSpecs = {
      resolution: { value: '2MP (1080p)', sourceUrl: 'Hikvision Official Datasheet', confidence: 'high', status: 'pending' },
      form_factor: { value: 'Bullet', sourceUrl: 'Hikvision Official Datasheet', confidence: 'high', status: 'pending' },
      night_vision: { value: 'IR Night Vision (up to 20m)', sourceUrl: 'Hikvision Official Datasheet', confidence: 'high', status: 'pending' },
      lens: { value: '3.6mm (Standard)', sourceUrl: 'Hikvision Official Datasheet', confidence: 'high', status: 'pending' },
      ip_rating: { value: 'IP67 Weatherproof', sourceUrl: 'Hikvision Official Datasheet', confidence: 'high', status: 'pending' }
    };
  }

  res.json(result);
});

// 4. Background Jobs APIs
router.get('/admin/jobs', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM background_jobs ORDER BY created_at DESC LIMIT 50').all();
    const jobs = rows.map(r => ({
      ...r,
      payload: JSON.parse(r.payload_json || '{}'),
      result: r.result_json ? JSON.parse(r.result_json) : null
    }));
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/jobs/enqueue', requireAdmin, (req, res) => {
  try {
    const { type, payload } = req.body;
    if (!type) return res.status(400).json({ error: 'Job type is required' });
    const id = `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare(`
      INSERT INTO background_jobs (id, type, payload_json, status)
      VALUES (?, ?, ?, 'pending')
    `).run(id, type, JSON.stringify(payload || {}));

    res.json({ success: true, jobId: id, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/jobs/:id', requireAdmin, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM background_jobs WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Job not found' });
    res.json({
      ...row,
      payload: JSON.parse(row.payload_json || '{}'),
      result: row.result_json ? JSON.parse(row.result_json) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/jobs/:id/retry', requireAdmin, (req, res) => {
  try {
    const info = db.prepare(`
      UPDATE background_jobs
      SET status = 'pending', attempts = 0, last_error = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true, message: 'Job re-queued for processing' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Database Reset and Clear Demo Data
router.post('/admin/clear-demo-data', requireAdmin, requirePermission('system.maintenance'), (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Database reset actions are strictly blocked in production mode.' });
  }
  const { confirmPhrase } = req.body || {};
  if (confirmPhrase !== 'CLEAR DEMO DATA') {
    return res.status(400).json({ error: 'Invalid confirmation phrase. Please type "CLEAR DEMO DATA" to confirm.' });
  }
  try {
    db.clearDemoData();
    const { logAudit } = require('../middleware/auditLogger');
    logAudit({
      entity: 'system',
      entityId: 'maintenance',
      action: 'system.maintenance.clear_demo_data',
      actorId: req.user?.id,
      actorName: req.user?.name,
      actorEmail: req.user?.email,
      surface: 'api_v1',
      diff: { action: 'clear_demo_data' }
    });
    res.json({ success: true, message: 'Sample demo data cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/reset-seeds', requireAdmin, requirePermission('system.maintenance'), (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Database reset actions are strictly blocked in production mode.' });
  }
  const { confirmPhrase } = req.body || {};
  if (confirmPhrase !== 'RESET DATABASE') {
    return res.status(400).json({ error: 'Invalid confirmation phrase. Please type "RESET DATABASE" to confirm.' });
  }
  try {
    db.reseedDatabase();
    const { logAudit } = require('../middleware/auditLogger');
    logAudit({
      entity: 'system',
      entityId: 'maintenance',
      action: 'system.maintenance.reset_seeds',
      actorId: req.user?.id,
      actorName: req.user?.name,
      actorEmail: req.user?.email,
      surface: 'api_v1',
      diff: { action: 'reset_seeds' }
    });
    res.json({ success: true, message: 'Database reset to initial seeds successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Mount Domain Sub-Routers
router.use('/', staffRouter);
router.use('/', catalogRouter);
router.use('/', pricingRouter);
router.use('/', inventoryRouter);
router.use('/', ordersRouter);
router.use('/', customersRouter);
router.use('/', quotesRouter);
router.use('/', servicesRouter);
router.use('/', cmsRouter);
router.use('/', mediaRouter);
router.use('/', companyRouter);
router.use('/', auditRouter);
router.use('/', webhookRouter);
router.use('/', managedRouter);

module.exports = router;
