const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class CmsService {
  // SETTINGS
  getSettings() {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get();
    return row ? JSON.parse(row.value) : {};
  }

  updateSettings(data, actor = null) {
    const current = this.getSettings();
    const updated = { ...current, ...data };
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('site_settings', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(JSON.stringify(updated));

    logAudit({
      entity: 'settings',
      entityId: 'site_settings',
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: current,
      after: updated
    });

    emitDomainEvent('settings.updated', { updatedKeys: Object.keys(data) });
    return updated;
  }

  // HERO SLIDES
  listHeroSlides() {
    const rows = db.prepare('SELECT data_json FROM hero_slides ORDER BY sort_order ASC, created_at ASC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  createHeroSlide(data, actor = null) {
    const id = data.id || `slide-${Date.now()}`;
    const slideData = { ...data, id, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO hero_slides (id, title, sort_order, is_active, data_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, slideData.title, slideData.sortOrder || 0, slideData.isActive !== false ? 1 : 0, JSON.stringify(slideData));

    logAudit({ entity: 'hero_slide', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: slideData });
    emitDomainEvent('hero.updated', { slideId: id });
    return slideData;
  }

  deleteHeroSlide(id, actor = null) {
    db.prepare('DELETE FROM hero_slides WHERE id = ?').run(id);
    logAudit({ entity: 'hero_slide', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('hero.updated', { slideId: id });
    return true;
  }

  reorderHeroSlides(orderedIds, actor = null) {
    const updateStmt = db.prepare('UPDATE hero_slides SET sort_order = ? WHERE id = ?');
    const tx = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        updateStmt.run(index, id);
      });
    });
    tx();
    logAudit({ entity: 'hero_slide', entityId: 'all', action: 'reorder', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('hero.updated', { reordered: true });
    return true;
  }

  // SECTIONS
  getSections() {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'homepage_sections'").get();
    return row ? JSON.parse(row.value) : [];
  }

  updateSections(sections, actor = null) {
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('homepage_sections', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(JSON.stringify(sections));

    logAudit({ entity: 'sections', entityId: 'homepage_sections', action: 'update', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('sections.updated', {});
    return sections;
  }

  // BLOG POSTS
  listBlogPosts() {
    const rows = db.prepare('SELECT data_json FROM blog_posts ORDER BY created_at DESC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  getBlogPost(slug) {
    const row = db.prepare('SELECT data_json FROM blog_posts WHERE slug = ? OR id = ?').get(slug, slug);
    return row ? JSON.parse(row.data_json) : null;
  }

  createBlogPost(data, actor = null) {
    const id = data.id || `post-${Date.now()}`;
    const postData = { ...data, id, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO blog_posts (id, title, slug, excerpt, content, image, author, is_published, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, postData.title, postData.slug, postData.excerpt || '', postData.content || '',
      postData.image || '', postData.author || '', postData.isPublished !== false ? 1 : 0,
      JSON.stringify(postData)
    );

    logAudit({ entity: 'blog_post', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: postData });
    emitDomainEvent('blog.updated', { postId: id });
    return postData;
  }

  updateBlogPost(id, data, actor = null) {
    const existing = db.prepare('SELECT data_json FROM blog_posts WHERE id = ?').get(id);
    if (!existing) return null;
    const current = JSON.parse(existing.data_json);
    const updated = { ...current, ...data, id, updatedAt: new Date().toISOString() };

    db.prepare(`
      UPDATE blog_posts SET
        title = ?, slug = ?, excerpt = ?, content = ?, image = ?,
        author = ?, is_published = ?, data_json = ?
      WHERE id = ?
    `).run(
      updated.title, updated.slug, updated.excerpt || '', updated.content || '',
      updated.image || '', updated.author || '', updated.isPublished !== false ? 1 : 0,
      JSON.stringify(updated), id
    );

    logAudit({ entity: 'blog_post', entityId: id, action: 'update', actorId: actor?.id, actorName: actor?.name, before: current, after: updated });
    emitDomainEvent('blog.updated', { postId: id });
    return updated;
  }

  deleteBlogPost(id, actor = null) {
    db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
    logAudit({ entity: 'blog_post', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('blog.updated', { postId: id });
    return true;
  }

  // PROJECTS
  listProjects() {
    const rows = db.prepare('SELECT data_json FROM projects ORDER BY created_at DESC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  getProject(idOrSlug) {
    const row = db.prepare('SELECT data_json FROM projects WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug);
    return row ? JSON.parse(row.data_json) : null;
  }

  createProject(data, actor = null) {
    const id = data.id || `proj-${Date.now()}`;
    const projectData = { ...data, id, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO projects (id, title, slug, client_name, location, completion_date, camera_count, equipment_used, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, projectData.title, projectData.slug, projectData.clientName || '', projectData.location || '',
      projectData.completionDate || '', projectData.cameraCount || 0,
      JSON.stringify(projectData.equipmentUsed || []), JSON.stringify(projectData)
    );

    logAudit({ entity: 'project', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: projectData });
    emitDomainEvent('project.updated', { projectId: id });
    return projectData;
  }

  updateProject(id, data, actor = null) {
    const existing = db.prepare('SELECT data_json FROM projects WHERE id = ?').get(id);
    if (!existing) return null;
    const current = JSON.parse(existing.data_json);
    const updated = { ...current, ...data, id };

    db.prepare(`
      UPDATE projects SET
        title = ?, slug = ?, client_name = ?, location = ?, completion_date = ?,
        camera_count = ?, equipment_used = ?, data_json = ?
      WHERE id = ?
    `).run(
      updated.title, updated.slug, updated.clientName || '', updated.location || '',
      updated.completionDate || '', updated.cameraCount || 0,
      JSON.stringify(updated.equipmentUsed || []), JSON.stringify(updated), id
    );

    logAudit({ entity: 'project', entityId: id, action: 'update', actorId: actor?.id, actorName: actor?.name, before: current, after: updated });
    emitDomainEvent('project.updated', { projectId: id });
    return updated;
  }

  deleteProject(id, actor = null) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    logAudit({ entity: 'project', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('project.updated', { projectId: id });
    return true;
  }

  // PAGES
  listPages() {
    const rows = db.prepare('SELECT data_json FROM pages ORDER BY title ASC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  getPage(slug) {
    const row = db.prepare('SELECT data_json FROM pages WHERE slug = ? OR id = ?').get(slug, slug);
    return row ? JSON.parse(row.data_json) : null;
  }

  createPage(data, actor = null) {
    const id = data.id || `page-${Date.now()}`;
    const pageData = { ...data, id, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO pages (id, title, slug, content, is_published, data_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, pageData.title, pageData.slug, pageData.content || '', pageData.isPublished !== false ? 1 : 0, JSON.stringify(pageData));

    logAudit({ entity: 'page', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: pageData });
    emitDomainEvent('page.updated', { pageId: id });
    return pageData;
  }

  updatePage(id, data, actor = null) {
    const existing = db.prepare('SELECT data_json FROM pages WHERE id = ?').get(id);
    if (!existing) return null;
    const current = JSON.parse(existing.data_json);
    const updated = { ...current, ...data, id };

    db.prepare(`
      UPDATE pages SET
        title = ?, slug = ?, content = ?, is_published = ?, data_json = ?
      WHERE id = ?
    `).run(updated.title, updated.slug, updated.content || '', updated.isPublished !== false ? 1 : 0, JSON.stringify(updated), id);

    logAudit({ entity: 'page', entityId: id, action: 'update', actorId: actor?.id, actorName: actor?.name, before: current, after: updated });
    emitDomainEvent('page.updated', { pageId: id });
    return updated;
  }

  deletePage(id, actor = null) {
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);
    logAudit({ entity: 'page', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('page.updated', { pageId: id });
    return true;
  }

  // TESTIMONIALS
  listTestimonials() {
    const rows = db.prepare('SELECT data_json FROM testimonials ORDER BY created_at DESC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  createTestimonial(data, actor = null) {
    const id = data.id || `testi-${Date.now()}`;
    const item = { ...data, id, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO testimonials (id, client_name, client_role, company, rating, content, is_featured, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, item.client_name, item.client_role || '', item.company || '', item.rating || 5, item.content, item.is_featured ? 1 : 0, JSON.stringify(item));

    logAudit({ entity: 'testimonial', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: item });
    emitDomainEvent('testimonial.updated', { testimonialId: id });
    return item;
  }

  updateTestimonial(id, data, actor = null) {
    const existing = db.prepare('SELECT data_json FROM testimonials WHERE id = ?').get(id);
    if (!existing) return null;
    const current = JSON.parse(existing.data_json);
    const updated = { ...current, ...data, id };

    db.prepare(`
      UPDATE testimonials SET
        client_name = ?, client_role = ?, company = ?, rating = ?,
        content = ?, is_featured = ?, data_json = ?
      WHERE id = ?
    `).run(updated.client_name, updated.client_role || '', updated.company || '', updated.rating || 5, updated.content, updated.is_featured ? 1 : 0, JSON.stringify(updated), id);

    logAudit({ entity: 'testimonial', entityId: id, action: 'update', actorId: actor?.id, actorName: actor?.name, before: current, after: updated });
    emitDomainEvent('testimonial.updated', { testimonialId: id });
    return updated;
  }

  deleteTestimonial(id, actor = null) {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    logAudit({ entity: 'testimonial', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    emitDomainEvent('testimonial.updated', { testimonialId: id });
    return true;
  }

  // FAQS
  listFaqs() {
    const rows = db.prepare('SELECT data_json FROM faqs ORDER BY sort_order ASC, created_at ASC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  createFaq(data, actor = null) {
    const id = data.id || `faq-${Date.now()}`;
    const item = { ...data, id, createdAt: new Date().toISOString() };
    db.prepare(`
      INSERT INTO faqs (id, question, answer, category, sort_order, data_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, item.question, item.answer, item.category || 'General', item.sortOrder || 0, JSON.stringify(item));

    logAudit({ entity: 'faq', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: item });
    return item;
  }

  updateFaq(id, data, actor = null) {
    const existing = db.prepare('SELECT data_json FROM faqs WHERE id = ?').get(id);
    if (!existing) return null;
    const current = JSON.parse(existing.data_json);
    const updated = { ...current, ...data, id };

    db.prepare(`
      UPDATE faqs SET
        question = ?, answer = ?, category = ?, sort_order = ?, data_json = ?
      WHERE id = ?
    `).run(updated.question, updated.answer, updated.category || 'General', updated.sortOrder || 0, JSON.stringify(updated), id);

    logAudit({ entity: 'faq', entityId: id, action: 'update', actorId: actor?.id, actorName: actor?.name, before: current, after: updated });
    return updated;
  }

  deleteFaq(id, actor = null) {
    db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    logAudit({ entity: 'faq', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    return true;
  }

  // REDIRECTS
  listRedirects() {
    return db.prepare('SELECT * FROM redirects ORDER BY created_at DESC').all();
  }

  createRedirect(data, actor = null) {
    const id = data.id || `redir-${Date.now()}`;
    db.prepare(`
      INSERT INTO redirects (id, from_path, to_path, status_code, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, data.from_path, data.to_path, data.status_code || 301);

    const item = { id, ...data };
    logAudit({ entity: 'redirect', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: item });
    return item;
  }

  deleteRedirect(id, actor = null) {
    db.prepare('DELETE FROM redirects WHERE id = ?').run(id);
    logAudit({ entity: 'redirect', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    return true;
  }

  // PACKAGE SERIES
  listPackageSeries() {
    return db.prepare('SELECT * FROM package_series ORDER BY sort_order ASC, name ASC').all();
  }

  createPackageSeries(data, actor = null) {
    const id = data.id || `series-${Date.now()}`;
    db.prepare(`
      INSERT INTO package_series (id, name, slug, description, sort_order, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), data.description || '', data.sortOrder || 0, data.enabled !== false ? 1 : 0);

    const item = { id, ...data };
    logAudit({ entity: 'package_series', entityId: id, action: 'create', actorId: actor?.id, actorName: actor?.name, after: item });
    return item;
  }

  updatePackageSeries(id, data, actor = null) {
    const existing = db.prepare('SELECT * FROM package_series WHERE id = ?').get(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE package_series SET
        name = ?, slug = ?, description = ?, sort_order = ?, enabled = ?
      WHERE id = ?
    `).run(data.name ?? existing.name, data.slug ?? existing.slug, data.description ?? existing.description, data.sortOrder ?? existing.sort_order, data.enabled !== undefined ? (data.enabled ? 1 : 0) : existing.enabled, id);

    const updated = { ...existing, ...data, id };
    logAudit({ entity: 'package_series', entityId: id, action: 'update', actorId: actor?.id, actorName: actor?.name, before: existing, after: updated });
    return updated;
  }

  deletePackageSeries(id, actor = null) {
    db.prepare('DELETE FROM package_series WHERE id = ?').run(id);
    logAudit({ entity: 'package_series', entityId: id, action: 'delete', actorId: actor?.id, actorName: actor?.name });
    return true;
  }
}

module.exports = new CmsService();

