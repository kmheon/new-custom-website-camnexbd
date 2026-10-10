const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class ServicesService {
  // SERVICE REQUESTS (Inbox)
  listRequests() {
    const rows = db.prepare('SELECT data_json FROM service_requests ORDER BY created_at DESC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  createRequest(data, actor = null) {
    const id = `sr-${Date.now()}`;
    const createdAt = new Date().toISOString();

    // Look up service offering snapshot if available
    let serviceTitleSnapshot = data.serviceType || '';
    if (data.serviceId) {
      const offering = db.prepare('SELECT title FROM service_offerings WHERE id = ?').get(data.serviceId);
      if (offering) serviceTitleSnapshot = offering.title;
    }

    const fullReq = {
      ...data,
      id,
      serviceTitleSnapshot,
      createdAt,
      status: 'pending'
    };

    db.prepare(`
      INSERT INTO service_requests (id, customer_name, phone, service_type, status, data_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      fullReq.customerName || '',
      fullReq.phone || '',
      fullReq.serviceType || '',
      fullReq.status,
      JSON.stringify(fullReq),
      createdAt
    );

    logAudit({
      entity: 'service_request',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name || fullReq.customerName,
      after: { customerName: fullReq.customerName, serviceType: fullReq.serviceType }
    });

    emitDomainEvent('service.requested', { requestId: id, serviceType: fullReq.serviceType });
    return fullReq;
  }

  // SERVICE OFFERINGS (Dynamic Homepage / Admin CRUD)
  listOfferings(includeDisabled = false) {
    let sql = 'SELECT * FROM service_offerings WHERE 1=1';
    if (!includeDisabled) {
      sql += ' AND enabled = 1';
    }
    sql += ' ORDER BY sort_order ASC, title ASC';
    const rows = db.prepare(sql).all();
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      shortLabel: r.short_label,
      description: r.description,
      icon: r.icon,
      enabled: Boolean(r.enabled),
      sortOrder: r.sort_order,
      solutionLink: r.solution_link
    }));
  }

  createOffering(data, actor = null) {
    const id = data.id || `svc-${Date.now()}`;
    db.prepare(`
      INSERT INTO service_offerings (id, title, short_label, description, icon, enabled, sort_order, solution_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.title,
      data.shortLabel || data.title,
      data.description || '',
      data.icon || 'cctv',
      data.enabled !== false ? 1 : 0,
      data.sortOrder || 0,
      data.solutionLink || ''
    );

    const created = { id, ...data };
    logAudit({
      entity: 'service_offering',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name,
      after: created
    });

    emitDomainEvent('service.updated', { serviceId: id });
    return created;
  }

  updateOffering(id, data, actor = null) {
    const existing = db.prepare('SELECT * FROM service_offerings WHERE id = ?').get(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE service_offerings SET
        title = ?, short_label = ?, description = ?, icon = ?,
        enabled = ?, sort_order = ?, solution_link = ?
      WHERE id = ?
    `).run(
      data.title ?? existing.title,
      data.shortLabel ?? existing.short_label,
      data.description ?? existing.description,
      data.icon ?? existing.icon,
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : existing.enabled,
      data.sortOrder ?? existing.sort_order,
      data.solutionLink ?? existing.solution_link,
      id
    );

    const updated = { ...existing, ...data, id };
    logAudit({
      entity: 'service_offering',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing,
      after: updated
    });

    emitDomainEvent('service.updated', { serviceId: id });
    return updated;
  }

  deleteOffering(id, actor = null) {
    const existing = db.prepare('SELECT * FROM service_offerings WHERE id = ?').get(id);
    db.prepare('DELETE FROM service_offerings WHERE id = ?').run(id);

    logAudit({
      entity: 'service_offering',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name,
      before: existing
    });

    emitDomainEvent('service.updated', { serviceId: id });
    return true;
  }
}

module.exports = new ServicesService();

