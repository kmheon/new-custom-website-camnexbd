const express = require('express');
const router = express.Router();
const managedEntityService = require('../../shared/managedEntity');
const { requireAdmin } = require('../../middleware/auth');
const db = require('../../../database');

// Supported managed entity tables
const MANAGED_TABLES = {
  'spec-templates': 'spec_templates',
  'glossary': 'glossary_terms',
  'packages': 'packages',
  'quotes': 'quotes',
  'hero-slides': 'hero_slides',
  'sections': 'homepage_sections',
  'projects': 'projects',
  'pages': 'cms_pages',
  'testimonials': 'testimonials',
  'redirects': 'redirects',
  'blog': 'blog_posts',
  'faqs': 'faqs',
  'newsletter': 'newsletter_subscribers',
  'coupons': 'coupons',
  'documents': 'documents'
};

// Generic Archive Route: POST /api/managed/:entityType/:id/archive
router.post('/managed/:entityType/:id/archive', requireAdmin, (req, res) => {
  try {
    const tableName = MANAGED_TABLES[req.params.entityType];
    if (!tableName) {
      return res.status(400).json({ error: `Unsupported managed entity: ${req.params.entityType}` });
    }
    const result = managedEntityService.archive(tableName, req.params.id, req.user, req.body?.reason);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Generic Restore Route: POST /api/managed/:entityType/:id/restore
router.post('/managed/:entityType/:id/restore', requireAdmin, (req, res) => {
  try {
    const tableName = MANAGED_TABLES[req.params.entityType];
    if (!tableName) {
      return res.status(400).json({ error: `Unsupported managed entity: ${req.params.entityType}` });
    }
    const result = managedEntityService.restore(tableName, req.params.id, req.user);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Generic Update with Version check: PUT /api/managed/:entityType/:id
router.put('/managed/:entityType/:id', requireAdmin, (req, res) => {
  try {
    const tableName = MANAGED_TABLES[req.params.entityType];
    if (!tableName) {
      return res.status(400).json({ error: `Unsupported managed entity: ${req.params.entityType}` });
    }
    const { version, ...updateFields } = req.body || {};
    const updated = managedEntityService.updateWithVersion(tableName, req.params.id, version, updateFields, req.user);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(updated);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Generic Delete with Reference guard: DELETE /api/managed/:entityType/:id
router.delete('/managed/:entityType/:id', requireAdmin, (req, res) => {
  try {
    const tableName = MANAGED_TABLES[req.params.entityType];
    if (!tableName) {
      return res.status(400).json({ error: `Unsupported managed entity: ${req.params.entityType}` });
    }
    const result = managedEntityService.delete(tableName, req.params.id, req.user);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = { router, MANAGED_TABLES };

