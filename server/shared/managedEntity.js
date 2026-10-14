/**
 * Managed Entity Helper
 * Provides soft archive, restore, optimistic version concurrency,
 * before/after audit logging, domain event outbox emission,
 * and storefront cache revalidation headers.
 */

const db = require('../../database');
const { logAudit } = require('../middleware/auditLogger');
const { emitDomainEvent } = require('../middleware/events');

class ManagedEntityService {
  /**
   * Helper to retrieve an entity row and parse its stored JSON or columns
   */
  getEntity(tableName, id) {
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
    if (!row) return null;
    let data = {};
    if (row.data_json) {
      try { data = JSON.parse(row.data_json); } catch (_) {}
    } else {
      data = { ...row };
    }
    data.id = row.id;
    data.is_archived = !!row.is_archived;
    data.archived_at = row.archived_at || null;
    data.archived_by = row.archived_by || null;
    data.version = row.version || 1;
    return { row, data };
  }

  /**
   * Check references to prevent hard deletion of referenced records
   */
  checkReferences(tableName, id) {
    const refs = [];
    try {
      if (tableName === 'packages') {
        const orderCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE data_json LIKE ?`).get(`%${id}%`);
        if (orderCount && orderCount.count > 0) refs.push(`${orderCount.count} orders`);
        const quoteCount = db.prepare(`SELECT COUNT(*) as count FROM quotes WHERE data_json LIKE ?`).get(`%${id}%`);
        if (quoteCount && quoteCount.count > 0) refs.push(`${quoteCount.count} quotes`);
      } else if (tableName === 'spec_templates') {
        const catCount = db.prepare(`SELECT COUNT(*) as count FROM categories WHERE spec_template_id = ?`).get(id);
        if (catCount && catCount.count > 0) refs.push(`${catCount.count} categories`);
      } else if (tableName === 'quotes') {
        const orderCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE data_json LIKE ?`).get(`%${id}%`);
        if (orderCount && orderCount.count > 0) refs.push(`${orderCount.count} converted orders`);
      }
    } catch (_) {}
    return refs;
  }

  /**
   * Soft archive an entity
   */
  archive(tableName, id, actor = null, reason = 'Administrative archival') {
    const item = this.getEntity(tableName, id);
    if (!item) {
      const err = new Error(`Entity not found in ${tableName} with id ${id}`);
      err.statusCode = 404;
      throw err;
    }

    const beforeData = item.data;
    const actorId = actor?.id || 'admin';
    const actorName = actor?.name || actor?.email || 'Administrator';

    const info = db.prepare(`
      UPDATE ${tableName}
      SET is_archived = 1,
          archived_at = CURRENT_TIMESTAMP,
          archived_by = ?,
          version = COALESCE(version, 1) + 1
      WHERE id = ?
    `).run(actorId, id);

    if (info.changes === 0) {
      const err = new Error(`Failed to archive record in ${tableName}`);
      err.statusCode = 500;
      throw err;
    }

    const updatedItem = this.getEntity(tableName, id);
    const afterData = updatedItem ? updatedItem.data : { ...beforeData, is_archived: true };

    logAudit({
      entity: tableName,
      entityId: id,
      action: 'archive',
      actorId,
      actorName,
      before: beforeData,
      after: afterData
    });

    emitDomainEvent(`${tableName}.archived`, { id, tableName, reason, archivedBy: actorId });

    return {
      success: true,
      archived: true,
      id,
      version: afterData.version
    };
  }

  /**
   * Restore a soft-archived entity
   */
  restore(tableName, id, actor = null) {
    const item = this.getEntity(tableName, id);
    if (!item) {
      const err = new Error(`Entity not found in ${tableName} with id ${id}`);
      err.statusCode = 404;
      throw err;
    }

    const beforeData = item.data;
    const actorId = actor?.id || 'admin';
    const actorName = actor?.name || actor?.email || 'Administrator';

    const info = db.prepare(`
      UPDATE ${tableName}
      SET is_archived = 0,
          archived_at = NULL,
          archived_by = NULL,
          version = COALESCE(version, 1) + 1
      WHERE id = ?
    `).run(id);

    if (info.changes === 0) {
      const err = new Error(`Failed to restore record in ${tableName}`);
      err.statusCode = 500;
      throw err;
    }

    const updatedItem = this.getEntity(tableName, id);
    const afterData = updatedItem ? updatedItem.data : { ...beforeData, is_archived: false };

    logAudit({
      entity: tableName,
      entityId: id,
      action: 'restore',
      actorId,
      actorName,
      before: beforeData,
      after: afterData
    });

    emitDomainEvent(`${tableName}.restored`, { id, tableName, restoredBy: actorId });

    return {
      success: true,
      restored: true,
      id,
      version: afterData.version
    };
  }

  /**
   * Update entity with optimistic version check
   */
  updateWithVersion(tableName, id, expectedVersion, updateFields = {}, actor = null) {
    const item = this.getEntity(tableName, id);
    if (!item) {
      const err = new Error(`Entity not found in ${tableName} with id ${id}`);
      err.statusCode = 404;
      throw err;
    }

    const currentVersion = item.data.version || 1;
    if (expectedVersion !== undefined && expectedVersion !== null && Number(expectedVersion) !== currentVersion) {
      const err = new Error(`Conflict: Entity in ${tableName} was modified by another operation (expected version ${expectedVersion}, currently ${currentVersion}).`);
      err.statusCode = 409;
      throw err;
    }

    const beforeData = item.data;
    const newVersion = currentVersion + 1;
    const actorId = actor?.id || 'admin';
    const actorName = actor?.name || actor?.email || 'Administrator';

    // Merge if table stores data_json
    if (item.row.data_json) {
      const merged = { ...beforeData, ...updateFields, version: newVersion };
      db.prepare(`
        UPDATE ${tableName}
        SET data_json = ?, version = ?
        WHERE id = ?
      `).run(JSON.stringify(merged), newVersion, id);
    } else {
      // Direct column update
      const setClauses = ['version = ?'];
      const params = [newVersion];
      for (const [k, v] of Object.entries(updateFields)) {
        setClauses.push(`${k} = ?`);
        params.push(v);
      }
      params.push(id);
      db.prepare(`UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedItem = this.getEntity(tableName, id);
    const afterData = updatedItem ? updatedItem.data : { ...beforeData, ...updateFields, version: newVersion };

    logAudit({
      entity: tableName,
      entityId: id,
      action: 'update',
      actorId,
      actorName,
      before: beforeData,
      after: afterData
    });

    emitDomainEvent(`${tableName}.updated`, { id, tableName, version: newVersion });

    return afterData;
  }

  /**
   * Hard delete only for unreferenced records
   */
  delete(tableName, id, actor = null) {
    const item = this.getEntity(tableName, id);
    if (!item) {
      const err = new Error(`Entity not found in ${tableName} with id ${id}`);
      err.statusCode = 404;
      throw err;
    }

    const refs = this.checkReferences(tableName, id);
    if (refs.length > 0) {
      const err = new Error(`Cannot delete ${tableName} item because it is referenced in: ${refs.join(', ')}. Please archive instead.`);
      err.statusCode = 409;
      throw err;
    }

    const beforeData = item.data;
    const actorId = actor?.id || 'admin';
    const actorName = actor?.name || actor?.email || 'Administrator';

    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);

    logAudit({
      entity: tableName,
      entityId: id,
      action: 'delete',
      actorId,
      actorName,
      before: beforeData,
      after: null
    });

    emitDomainEvent(`${tableName}.deleted`, { id, tableName });

    return { success: true, deleted: true, id };
  }
}

module.exports = new ManagedEntityService();

