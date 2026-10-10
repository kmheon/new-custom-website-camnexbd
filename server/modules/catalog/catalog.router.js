const express = require('express');
const router = express.Router();
const catalogService = require('./catalog.service');
const {
  productSchema,
  categorySchema,
  brandSchema,
  specTemplateSchema,
  packageSchema
} = require('./catalog.schemas');
const {
  requireAdmin,
  requirePermission,
  validateBody
} = require('../../middleware/auth');
const { PERMISSIONS } = require('../../shared/permissions');

// PRODUCTS
router.get('/products', (req, res) => {
  try {
    const result = catalogService.listProducts(req.query, req.user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/featured', (req, res) => {
  try {
    const items = catalogService.getFeatured(req.user);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/spec-filters/:categorySlug', (req, res) => {
  try {
    const filters = catalogService.getSpecFilters(req.params.categorySlug);
    res.json(filters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:idOrSku', (req, res) => {
  try {
    const product = catalogService.getProductById(req.params.idOrSku, req.user);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id/related', (req, res) => {
  try {
    const related = catalogService.getRelated(req.params.id, req.user);
    res.json(related);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id/accessories', (req, res) => {
  try {
    const acc = catalogService.getAccessories(req.user);
    res.json(acc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', requireAdmin, validateBody(productSchema), (req, res) => {
  try {
    const created = catalogService.createProduct(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', requireAdmin, validateBody(productSchema), (req, res) => {
  try {
    const updated = catalogService.updateProduct(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/archive', requireAdmin, (req, res) => {
  try {
    const ok = catalogService.archiveProduct(req.params.id, req.user);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, archived: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products/:id/restore', requireAdmin, (req, res) => {
  try {
    const ok = catalogService.restoreProduct(req.params.id, req.user);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, restored: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  try {
    catalogService.deleteProduct(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, references: err.references });
    }
    res.status(500).json({ error: err.message });
  }
});

// CATEGORIES
router.get('/categories', (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const items = catalogService.listCategories(includeArchived);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories/:slug', (req, res) => {
  try {
    const cat = catalogService.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireAdmin, validateBody(categorySchema), (req, res) => {
  try {
    const created = catalogService.createCategory(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', requireAdmin, validateBody(categorySchema), (req, res) => {
  try {
    const updated = catalogService.updateCategory(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', requireAdmin, (req, res) => {
  try {
    catalogService.deleteCategory(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, references: err.references });
    }
    res.status(500).json({ error: err.message });
  }
});

// BRANDS
router.get('/brands', (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const items = catalogService.listBrands(includeArchived);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/brands/:slug', (req, res) => {
  try {
    const brand = catalogService.getBrandBySlug(req.params.slug);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/brands', requireAdmin, validateBody(brandSchema), (req, res) => {
  try {
    const created = catalogService.createBrand(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/brands/:id', requireAdmin, validateBody(brandSchema), (req, res) => {
  try {
    const updated = catalogService.updateBrand(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Brand not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/brands/:id', requireAdmin, (req, res) => {
  try {
    catalogService.deleteBrand(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, references: err.references });
    }
    res.status(500).json({ error: err.message });
  }
});

// SPEC TEMPLATES
router.get(['/spec-templates', '/admin/spec-templates'], (req, res) => {
  try {
    const items = catalogService.listSpecTemplates();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/spec-templates/by-category/:categorySlug', (req, res) => {
  try {
    const tpl = catalogService.getSpecTemplate(req.params.categorySlug);
    res.json(tpl || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/spec-templates/:id', (req, res) => {
  try {
    const tpl = catalogService.getSpecTemplate(req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Spec template not found' });
    res.json(tpl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/spec-templates', '/admin/spec-templates'], requireAdmin, validateBody(specTemplateSchema), (req, res) => {
  try {
    const created = catalogService.createSpecTemplate(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(['/spec-templates/:id', '/admin/spec-templates/:id'], requireAdmin, (req, res) => {
  try {
    catalogService.deleteSpecTemplate(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PACKAGES
router.get('/packages', (req, res) => {
  try {
    const items = catalogService.listPackages();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/packages/:slug', (req, res) => {
  try {
    const pkg = catalogService.getPackageBySlug(req.params.slug);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/packages', requireAdmin, validateBody(packageSchema), (req, res) => {
  try {
    const created = catalogService.createPackage(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/packages/:id', requireAdmin, validateBody(packageSchema), (req, res) => {
  try {
    const updated = catalogService.updatePackage(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Package not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/packages/:id', requireAdmin, (req, res) => {
  try {
    catalogService.deletePackage(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

