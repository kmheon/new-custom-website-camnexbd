const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');
const { stripCostFields } = require('../../middleware/auth');

class CatalogService {
  // PRODUCTS
  listProducts(query = {}, user = null) {
    const {
      categorySlug,
      category,
      brandSlug,
      brand,
      search,
      minPrice,
      maxPrice,
      sortBy = 'popular',
      specFilters,
      page = 1,
      limit = 24,
      includeArchived = false
    } = query;

    const catTarget = categorySlug || category;
    const brandTarget = brandSlug || brand;

    let sql = 'SELECT data_json, is_archived FROM products WHERE 1=1';
    const params = [];

    if (!includeArchived) {
      sql += ' AND (is_archived IS NULL OR is_archived = 0)';
    }

    if (catTarget) {
      sql += ' AND (category_slug = ? OR category_id = ?)';
      params.push(catTarget, catTarget);
    }

    if (brandTarget) {
      sql += ' AND (brand_id = ? OR brand_name LIKE ?)';
      params.push(brandTarget, `%${brandTarget}%`);
    }

    if (minPrice !== undefined && minPrice !== '') {
      sql += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      sql += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      sql += ' AND (name LIKE ? OR model_number LIKE ? OR sku LIKE ? OR brand_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const rows = db.prepare(sql).all(...params);
    let items = rows.map(r => {
      const parsed = JSON.parse(r.data_json);
      if (r.is_archived !== undefined) parsed.is_archived = !!r.is_archived;
      return parsed;
    });

    if (specFilters) {
      let filters = {};
      try {
        filters = typeof specFilters === 'string' ? JSON.parse(specFilters) : specFilters;
      } catch (e) {
        filters = {};
      }

      if (Object.keys(filters).length > 0) {
        items = items.filter(p => {
          for (const [key, filterVal] of Object.entries(filters)) {
            if (!filterVal) continue;
            const pVal = p.specifications?.[key];
            if (pVal === undefined) return false;
            if (String(pVal).toLowerCase() !== String(filterVal).toLowerCase()) {
              return false;
            }
          }
          return true;
        });
      }
    }

    if (sortBy === 'price_asc') {
      items.sort((a, b) => (a.pricing?.regularPrice ?? 999999) - (b.pricing?.regularPrice ?? 999999));
    } else if (sortBy === 'price_desc') {
      items.sort((a, b) => (b.pricing?.regularPrice ?? 0) - (a.pricing?.regularPrice ?? 0));
    } else if (sortBy === 'name_asc') {
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'popular') {
      items.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    } else if (sortBy === 'newest' || sortBy === 'created_at') {
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const total = items.length;
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / l) || 1;
    const paginatedItems = items.slice((p - 1) * l, p * l);

    return {
      items: stripCostFields(paginatedItems, user),
      total,
      page: p,
      totalPages
    };
  }

  getFeatured(user = null) {
    const rows = db.prepare('SELECT data_json FROM products WHERE (is_archived IS NULL OR is_archived = 0) AND (is_featured = 1 OR is_popular = 1) LIMIT 8').all();
    const items = rows.map(r => JSON.parse(r.data_json));
    return stripCostFields(items, user);
  }

  getSpecFilters(categorySlug) {
    const tplRow = db.prepare('SELECT data_json FROM spec_templates WHERE category_slug = ? OR id = ?').get(categorySlug, categorySlug);
    if (!tplRow) return {};

    const tpl = JSON.parse(tplRow.data_json);
    const prodRows = db.prepare('SELECT data_json FROM products WHERE (is_archived IS NULL OR is_archived = 0) AND (category_slug = ? OR category_id = ?)').all(categorySlug, categorySlug);
    const products = prodRows.map(r => JSON.parse(r.data_json));

    const result = {};
    for (const field of tpl.fields || []) {
      if (field.filterable) {
        const uniqueVals = new Set();
        products.forEach(p => {
          const val = p.specifications?.[field.key];
          if (val !== undefined && val !== null && val !== '') {
            uniqueVals.add(String(val));
          }
        });
        if (uniqueVals.size > 0) {
          result[field.key] = Array.from(uniqueVals);
        }
      }
    }
    return result;
  }

  getProductById(idOrSku, user = null) {
    const row = db.prepare('SELECT data_json, is_archived FROM products WHERE id = ? OR sku = ? OR model_number = ?').get(idOrSku, idOrSku, idOrSku);
    if (!row) return null;
    const item = JSON.parse(row.data_json);
    if (row.is_archived !== undefined) item.is_archived = !!row.is_archived;
    return stripCostFields(item, user);
  }

  getRelated(id, user = null) {
    const current = db.prepare('SELECT category_id, category_slug FROM products WHERE id = ?').get(id);
    if (!current) return [];
    const rows = db.prepare('SELECT data_json FROM products WHERE (is_archived IS NULL OR is_archived = 0) AND (category_id = ? OR category_slug = ?) AND id != ? LIMIT 4')
      .all(current.category_id, current.category_slug, id);
    return stripCostFields(rows.map(r => JSON.parse(r.data_json)), user);
  }

  getAccessories(user = null) {
    const rows = db.prepare("SELECT data_json FROM products WHERE (is_archived IS NULL OR is_archived = 0) AND (category_slug LIKE '%access%' OR category_id LIKE '%access%') LIMIT 4").all();
    return stripCostFields(rows.map(r => JSON.parse(r.data_json)), user);
  }

  createProduct(data, actor = null) {
    const id = data.id || `prod-${Date.now()}`;
    const productData = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO products (
        id, name, model_number, sku, brand_id, brand_name, category_id, category_slug,
        status, price, compare_price, stock_quantity, is_featured, is_popular, is_demo, is_archived, data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      productData.name,
      productData.modelNumber,
      productData.sku,
      productData.brandId || '',
      productData.brand || '',
      productData.categoryId || '',
      productData.category ? productData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      productData.status || 'active',
      productData.pricing?.regularPrice || 0,
      productData.pricing?.salePrice || 0,
      productData.inventory?.available || 10,
      productData.isFeatured ? 1 : 0,
      productData.isPopular ? 1 : 0,
      productData.isDemo ? 1 : 0,
      JSON.stringify(productData)
    );

    logAudit({
      entity: 'product',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: productData
    });

    emitDomainEvent('catalog.product.created', { productId: id, sku: productData.sku });
    emitDomainEvent('product.created', { productId: id, sku: productData.sku });
    return productData;
  }

  updateProduct(id, data, actor = null) {
    const existingRow = db.prepare('SELECT data_json FROM products WHERE id = ?').get(id);
    if (!existingRow) return null;

    const current = JSON.parse(existingRow.data_json);
    const updated = {
      ...current,
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      UPDATE products SET
        name = ?, model_number = ?, sku = ?, brand_id = ?, brand_name = ?,
        category_id = ?, category_slug = ?, status = ?, price = ?, compare_price = ?,
        stock_quantity = ?, is_featured = ?, is_popular = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updated.name,
      updated.modelNumber,
      updated.sku,
      updated.brandId || '',
      updated.brand || '',
      updated.categoryId || '',
      updated.category ? updated.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      updated.status || 'active',
      updated.pricing?.regularPrice || 0,
      updated.pricing?.salePrice || 0,
      updated.inventory?.available || 10,
      updated.isFeatured ? 1 : 0,
      updated.isPopular ? 1 : 0,
      JSON.stringify(updated),
      id
    );

    logAudit({
      entity: 'product',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: current,
      after: updated
    });

    const oldPrice = current.pricing?.regularPrice ?? current.price;
    const newPrice = updated.pricing?.regularPrice ?? updated.price;
    if (oldPrice !== newPrice) {
      emitDomainEvent('pricing.changed', { productId: id, oldPrice, newPrice });
    }

    emitDomainEvent('catalog.product.updated', { productId: id });
    emitDomainEvent('product.updated', { productId: id });
    return updated;
  }

  archiveProduct(id, actor = null) {
    const existing = db.prepare('SELECT data_json FROM products WHERE id = ?').get(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE products SET is_archived = 1, archived_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    logAudit({
      entity: 'product',
      entityId: id,
      action: 'archive',
      actorId: actor?.id,
      actorName: actor?.name
    });

    emitDomainEvent('catalog.product.archived', { productId: id });
    emitDomainEvent('product.archived', { productId: id });
    return true;
  }

  restoreProduct(id, actor = null) {
    const existing = db.prepare('SELECT data_json FROM products WHERE id = ?').get(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE products SET is_archived = 0, archived_at = NULL WHERE id = ?
    `).run(id);

    logAudit({
      entity: 'product',
      entityId: id,
      action: 'restore',
      actorId: actor?.id,
      actorName: actor?.name
    });

    emitDomainEvent('product.restored', { productId: id });
    return true;
  }

  checkProductReferences(id) {
    const references = [];
    try {
      const orderCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE items_json LIKE ?`).get(`%${id}%`);
      if (orderCount && orderCount.count > 0) references.push(`${orderCount.count} orders`);
    } catch (_) {}

    try {
      const pkgCount = db.prepare(`SELECT COUNT(*) as count FROM packages WHERE items_json LIKE ?`).get(`%${id}%`);
      if (pkgCount && pkgCount.count > 0) references.push(`${pkgCount.count} packages`);
    } catch (_) {}

    try {
      const smCount = db.prepare(`SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ?`).get(id);
      if (smCount && smCount.count > 0) references.push(`${smCount.count} stock movements`);
    } catch (_) {}

    return references;
  }

  deleteProduct(id, actor = null) {
    const refs = this.checkProductReferences(id);
    if (refs.length > 0) {
      const err = new Error(`Cannot delete product because it is referenced in: ${refs.join(', ')}. Please archive instead.`);
      err.statusCode = 409;
      err.references = refs;
      throw err;
    }

    const existingRow = db.prepare('SELECT data_json FROM products WHERE id = ?').get(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    logAudit({
      entity: 'product',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existingRow ? JSON.parse(existingRow.data_json) : null
    });

    emitDomainEvent('product.deleted', { productId: id });
    return true;
  }

  // CATEGORIES
  listCategories(includeArchived = false) {
    let sql = 'SELECT * FROM categories WHERE 1=1';
    if (!includeArchived) {
      sql += ' AND (is_archived IS NULL OR is_archived = 0)';
    }
    sql += ' ORDER BY sort_order ASC, name ASC';
    const rows = db.prepare(sql).all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      image: r.image,
      parentId: r.parent_id,
      sortOrder: r.sort_order,
      specTemplateId: r.spec_template_id,
      isArchived: !!r.is_archived
    }));
  }

  getCategoryBySlug(slug) {
    const r = db.prepare('SELECT * FROM categories WHERE slug = ? OR id = ?').get(slug, slug);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      image: r.image,
      parentId: r.parent_id,
      sortOrder: r.sort_order,
      specTemplateId: r.spec_template_id,
      isArchived: !!r.is_archived
    };
  }

  createCategory(data, actor = null) {
    const id = data.id || `cat-${Date.now()}`;
    db.prepare(`
      INSERT INTO categories (id, name, slug, description, icon, image, parent_id, sort_order, spec_template_id, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id,
      data.name,
      data.slug,
      data.description || '',
      data.icon || '',
      data.image || '',
      data.parentId || null,
      data.sortOrder || 0,
      data.specTemplateId || null
    );

    const created = { id, ...data };
    logAudit({
      entity: 'category',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: created
    });
    emitDomainEvent('category.created', { categoryId: id });
    return created;
  }

  updateCategory(id, data, actor = null) {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE categories SET
        name = ?, slug = ?, description = ?, icon = ?, image = ?,
        parent_id = ?, sort_order = ?, spec_template_id = ?
      WHERE id = ?
    `).run(
      data.name ?? existing.name,
      data.slug ?? existing.slug,
      data.description ?? existing.description,
      data.icon ?? existing.icon,
      data.image ?? existing.image,
      data.parentId ?? existing.parent_id,
      data.sortOrder ?? existing.sort_order,
      data.specTemplateId ?? existing.spec_template_id,
      id
    );

    const updated = { ...existing, ...data, id };
    logAudit({
      entity: 'category',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing,
      after: updated
    });
    emitDomainEvent('category.updated', { categoryId: id });
    return updated;
  }

  checkCategoryReferences(id) {
    const cat = db.prepare('SELECT slug FROM categories WHERE id = ?').get(id);
    const slug = cat ? cat.slug : id;
    const prodCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? OR category_slug = ?').get(id, slug);
    if (prodCount && prodCount.count > 0) {
      return [`${prodCount.count} products belong to this category`];
    }
    return [];
  }

  deleteCategory(id, actor = null) {
    const refs = this.checkCategoryReferences(id);
    if (refs.length > 0) {
      const err = new Error(`Cannot delete category because ${refs.join(', ')}. Please reassign products first.`);
      err.statusCode = 409;
      err.references = refs;
      throw err;
    }

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    logAudit({
      entity: 'category',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing
    });
    emitDomainEvent('category.deleted', { categoryId: id });
    return true;
  }

  // BRANDS
  listBrands(includeArchived = false) {
    let sql = 'SELECT * FROM brands WHERE 1=1';
    if (!includeArchived) {
      sql += ' AND (is_archived IS NULL OR is_archived = 0)';
    }
    sql += ' ORDER BY name ASC';
    const rows = db.prepare(sql).all();
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo,
      description: r.description,
      website: r.website,
      isArchived: !!r.is_archived
    }));
  }

  getBrandBySlug(slug) {
    const r = db.prepare('SELECT * FROM brands WHERE slug = ? OR id = ?').get(slug, slug);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo,
      description: r.description,
      website: r.website,
      isArchived: !!r.is_archived
    };
  }

  createBrand(data, actor = null) {
    const id = data.id || `brand-${Date.now()}`;
    db.prepare(`
      INSERT INTO brands (id, name, slug, logo, description, website, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      id,
      data.name,
      data.slug,
      data.logo || '',
      data.description || '',
      data.website || ''
    );

    const created = { id, ...data };
    logAudit({
      entity: 'brand',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: created
    });
    emitDomainEvent('brand.created', { brandId: id });
    return created;
  }

  updateBrand(id, data, actor = null) {
    const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE brands SET
        name = ?, slug = ?, logo = ?, description = ?, website = ?
      WHERE id = ?
    `).run(
      data.name ?? existing.name,
      data.slug ?? existing.slug,
      data.logo ?? existing.logo,
      data.description ?? existing.description,
      data.website ?? existing.website,
      id
    );

    const updated = { ...existing, ...data, id };
    logAudit({
      entity: 'brand',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing,
      after: updated
    });
    emitDomainEvent('brand.updated', { brandId: id });
    return updated;
  }

  checkBrandReferences(id) {
    const brand = db.prepare('SELECT name FROM brands WHERE id = ?').get(id);
    const name = brand ? brand.name : id;
    const prodCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE brand_id = ? OR brand_name = ?').get(id, name);
    if (prodCount && prodCount.count > 0) {
      return [`${prodCount.count} products belong to this brand`];
    }
    return [];
  }

  deleteBrand(id, actor = null) {
    const refs = this.checkBrandReferences(id);
    if (refs.length > 0) {
      const err = new Error(`Cannot delete brand because ${refs.join(', ')}. Please reassign products first.`);
      err.statusCode = 409;
      err.references = refs;
      throw err;
    }

    const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    db.prepare('DELETE FROM brands WHERE id = ?').run(id);

    logAudit({
      entity: 'brand',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing
    });
    emitDomainEvent('brand.deleted', { brandId: id });
    return true;
  }

  // SPEC TEMPLATES
  listSpecTemplates() {
    const rows = db.prepare('SELECT data_json FROM spec_templates').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  getSpecTemplate(idOrCategory) {
    const row = db.prepare('SELECT data_json FROM spec_templates WHERE id = ? OR category_slug = ?').get(idOrCategory, idOrCategory);
    return row ? JSON.parse(row.data_json) : null;
  }

  createSpecTemplate(data, actor = null) {
    const id = data.id || `tpl-${Date.now()}`;
    const tplData = { ...data, id };
    db.prepare(`
      INSERT INTO spec_templates (id, name, category_slug, data_json)
      VALUES (?, ?, ?, ?)
    `).run(id, tplData.name, tplData.categorySlug || '', JSON.stringify(tplData));

    logAudit({
      entity: 'spec_template',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: tplData
    });
    return tplData;
  }

  deleteSpecTemplate(id, actor = null) {
    db.prepare('DELETE FROM spec_templates WHERE id = ?').run(id);
    logAudit({
      entity: 'spec_template',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name
    });
    return true;
  }

  // PACKAGES
  listPackages() {
    const rows = db.prepare('SELECT data_json FROM packages').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  getPackageBySlug(slug) {
    const row = db.prepare('SELECT data_json FROM packages WHERE slug = ? OR id = ?').get(slug, slug);
    return row ? JSON.parse(row.data_json) : null;
  }

  createPackage(data, actor = null) {
    const id = data.id || `pkg-${Date.now()}`;
    const pkgData = { ...data, id };
    db.prepare(`
      INSERT INTO packages (id, name, slug, description, image, base_price, items_json, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      pkgData.name,
      pkgData.slug,
      pkgData.description || '',
      pkgData.image || '',
      pkgData.basePrice || 0,
      JSON.stringify(pkgData.items || []),
      JSON.stringify(pkgData)
    );

    logAudit({
      entity: 'package',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: pkgData
    });
    return pkgData;
  }

  updatePackage(id, data, actor = null) {
    const existing = db.prepare('SELECT data_json FROM packages WHERE id = ?').get(id);
    if (!existing) return null;

    const current = JSON.parse(existing.data_json);
    const updated = { ...current, ...data, id };
    db.prepare(`
      UPDATE packages SET
        name = ?, slug = ?, description = ?, image = ?, base_price = ?,
        items_json = ?, data_json = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.slug,
      updated.description || '',
      updated.image || '',
      updated.basePrice || 0,
      JSON.stringify(updated.items || []),
      JSON.stringify(updated),
      id
    );

    logAudit({
      entity: 'package',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: current,
      after: updated
    });
    return updated;
  }

  deletePackage(id, actor = null) {
    const existing = db.prepare('SELECT data_json FROM packages WHERE id = ?').get(id);
    db.prepare('DELETE FROM packages WHERE id = ?').run(id);

    logAudit({
      entity: 'package',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing ? JSON.parse(existing.data_json) : null
    });
    return true;
  }
}

module.exports = new CatalogService();

