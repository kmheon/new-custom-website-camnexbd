const db = require('../../../database');

class AuditService {
  listLogs(query = {}) {
    const {
      entity,
      entityId,
      actorId,
      action,
      fromDate,
      toDate,
      page = 1,
      limit = 50
    } = query;

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
    const params = [];
    const countParams = [];

    if (entity) {
      sql += ' AND entity_type = ?';
      countSql += ' AND entity_type = ?';
      params.push(entity);
      countParams.push(entity);
    }

    if (entityId) {
      sql += ' AND entity_id = ?';
      countSql += ' AND entity_id = ?';
      params.push(entityId);
      countParams.push(entityId);
    }

    if (actorId) {
      sql += ' AND user_id = ?';
      countSql += ' AND user_id = ?';
      params.push(actorId);
      countParams.push(actorId);
    }

    if (action) {
      sql += ' AND action = ?';
      countSql += ' AND action = ?';
      params.push(action);
      countParams.push(action);
    }

    if (fromDate) {
      sql += ' AND created_at >= ?';
      countSql += ' AND created_at >= ?';
      params.push(fromDate);
      countParams.push(fromDate);
    }

    if (toDate) {
      sql += ' AND created_at <= ?';
      countSql += ' AND created_at <= ?';
      params.push(toDate);
      countParams.push(toDate);
    }

    const totalRow = db.prepare(countSql).get(...countParams);
    const total = totalRow ? totalRow.total : 0;

    sql += ' ORDER BY created_at DESC';
    const l = Math.max(1, parseInt(limit));
    const p = Math.max(1, parseInt(page));
    sql += ` LIMIT ${l} OFFSET ${(p - 1) * l}`;

    const rows = db.prepare(sql).all(...params);

    const items = rows.map(r => ({
      id: r.id,
      entity: r.entity_type,
      entityId: r.entity_id,
      action: r.action,
      actorId: r.user_id,
      actorName: r.user_name,
      ip: r.ip_address,
      createdAt: r.created_at,
      before: r.before_data ? JSON.parse(r.before_data) : null,
      after: r.after_data ? JSON.parse(r.after_data) : null,
      diff: r.diff ? JSON.parse(r.diff) : null
    }));

    return {
      items,
      total,
      page: p,
      totalPages: Math.ceil(total / l) || 1
    };
  }
}

module.exports = new AuditService();


