const bcrypt = require('bcryptjs');
const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

class CustomersService {
  register({ name, phone, password, email }) {
    const existing = db.prepare('SELECT id FROM customers WHERE phone = ? OR (email != "" AND email = ?)').get(phone, email || '');
    if (existing) {
      const err = new Error('An account already exists with this phone number or email address.');
      err.statusCode = 409;
      throw err;
    }

    const id = `cust-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO customers (id, name, phone, email, password_hash, created_at, is_archived)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(id, name, phone, email || '', passwordHash, createdAt);

    emitDomainEvent('customer.registered', { customerId: id, name, phone });
    return { id, name, phone, email };
  }

  login({ identifier, password }) {
    const customer = db.prepare(`
      SELECT * FROM customers WHERE (phone = ? OR email = ?) AND (is_archived IS NULL OR is_archived = 0)
    `).get(identifier, identifier);

    if (!customer || !bcrypt.compareSync(password, customer.password_hash)) {
      const err = new Error('Invalid login credentials.');
      err.statusCode = 401;
      throw err;
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      role: 'customer'
    };
  }

  getCustomerOrders(customerId) {
    const cust = db.prepare('SELECT phone, email FROM customers WHERE id = ?').get(customerId);
    if (!cust) return [];

    const rows = db.prepare(`
      SELECT data_json FROM orders
      WHERE customer_phone = ? OR (customer_email != '' AND customer_email = ?)
      ORDER BY created_at DESC
    `).all(cust.phone, cust.email || '');

    return rows.map(r => JSON.parse(r.data_json));
  }

  getWishlist(customerId) {
    const rows = db.prepare(`
      SELECT p.data_json
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.customer_id = ?
    `).all(customerId);
    return rows.map(r => JSON.parse(r.data_json));
  }

  addToWishlist(customerId, productId) {
    db.prepare(`
      INSERT OR IGNORE INTO wishlists (customer_id, product_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(customerId, productId);
    return true;
  }

  removeFromWishlist(customerId, productId) {
    db.prepare(`
      DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?
    `).run(customerId, productId);
    return true;
  }

  mergeWishlist(customerId, productIds) {
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO wishlists (customer_id, product_id, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    const tx = db.transaction(() => {
      for (const pid of productIds) {
        insertStmt.run(customerId, pid);
      }
    });
    tx();
    return true;
  }

  listCustomers(includeArchived = false) {
    let sql = 'SELECT id, name, phone, email, created_at, is_archived FROM customers WHERE 1=1';
    if (!includeArchived) {
      sql += ' AND (is_archived IS NULL OR is_archived = 0)';
    }
    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all();
  }

  getCustomerById(id) {
    const row = db.prepare('SELECT id, name, phone, email, created_at, is_archived FROM customers WHERE id = ?').get(id);
    return row || null;
  }

  archiveCustomer(id, actor = null) {
    db.prepare('UPDATE customers SET is_archived = 1, archived_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    logAudit({
      entity: 'customer',
      entityId: id,
      action: 'archive',
      actorId: actor?.id,
      actorName: actor?.name
    });
    return true;
  }

  restoreCustomer(id, actor = null) {
    db.prepare('UPDATE customers SET is_archived = 0, archived_at = NULL WHERE id = ?').run(id);
    logAudit({
      entity: 'customer',
      entityId: id,
      action: 'restore',
      actorId: actor?.id,
      actorName: actor?.name
    });
    return true;
  }

  deleteCustomer(id, actor = null) {
    const cust = db.prepare('SELECT phone, email FROM customers WHERE id = ?').get(id);
    if (cust) {
      const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_phone = ? OR (customer_email != "" AND customer_email = ?)').get(cust.phone, cust.email || '');
      if (orderCount && orderCount.count > 0) {
        const err = new Error(`Cannot delete customer because ${orderCount.count} orders exist. Please archive instead.`);
        err.statusCode = 409;
        throw err;
      }
    }
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    logAudit({
      entity: 'customer',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name
    });
    return true;
  }
}

module.exports = new CustomersService();

