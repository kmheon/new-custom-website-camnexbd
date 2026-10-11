const crypto = require('crypto');
const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class InventoryService {
  recordMovement({
    productId,
    quantityChange,
    movementType = 'adjustment',
    referenceType = null,
    referenceId = null,
    reason = '',
    actor = null
  }) {
    const product = db.prepare('SELECT id, name, stock_quantity, data_json FROM products WHERE id = ?').get(productId);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    const currentQty = product.stock_quantity || 0;
    const newQty = Math.max(0, currentQty + quantityChange);
    const movementId = `sm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Update product stock in database
    let productData = {};
    try {
      productData = JSON.parse(product.data_json || '{}');
    } catch (_) {}

    if (!productData.inventory) productData.inventory = {};
    productData.inventory.available = newQty;

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO stock_movements (
          id, product_id, movement_type, quantity_change, balance_after,
          reference_id, reason, user_id, user_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementId,
        productId,
        movementType,
        quantityChange,
        newQty,
        referenceId,
        reason || 'adjustment',
        actor?.id || null,
        actor?.name || null
      );

      db.prepare(`
        UPDATE products
        SET stock_quantity = ?, data_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newQty, JSON.stringify(productData), productId);
    });

    tx();

    logAudit({
      entity: 'inventory',
      entityId: movementId,
      action: 'stock_movement',
      actorId: actor?.id,
      actorName: actor?.name,
      before: { stockQuantity: currentQty },
      after: { stockQuantity: newQty, quantityChange, movementType, reason }
    });

    emitDomainEvent('inventory.adjusted', {
      productId,
      previousStock: currentQty,
      newStock: newQty,
      quantityChange,
      movementType,
      reason
    });
    emitDomainEvent('stock.changed', {
      productId,
      previousStock: currentQty,
      newStock: newQty,
      quantityChange
    });

    return {
      movementId,
      productId,
      previousStock: currentQty,
      newStock: newQty,
      quantityChange,
      movementType,
      reason
    };
  }

  listMovements(query = {}) {
    const { productId, limit = 50, page = 1 } = query;
    let sql = 'SELECT * FROM stock_movements WHERE 1=1';
    const params = [];

    if (productId) {
      sql += ' AND product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY created_at DESC';
    const l = Math.max(1, parseInt(limit));
    const p = Math.max(1, parseInt(page));
    sql += ` LIMIT ${l} OFFSET ${(p - 1) * l}`;

    const rows = db.prepare(sql).all(...params);
    return rows;
  }
}

module.exports = new InventoryService();


