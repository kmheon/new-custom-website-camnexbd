const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');
const inventoryService = require('../inventory/inventory.service');

function generateNumber(prefix = 'CNX-ORD') {
  const d = new Date();
  const dateStr = d.getFullYear().toString().slice(-2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${rand}`;
}

class OrdersService {
  listOrders() {
    const rows = db.prepare('SELECT data_json FROM orders ORDER BY created_at DESC').all();
    return rows.map(r => JSON.parse(r.data_json));
  }

  getOrder(num, user = null, verifyPhone = '') {
    const row = db.prepare('SELECT customer_phone, customer_email, data_json FROM orders WHERE order_number = ? OR id = ?').get(num, num);
    if (!row) return { status: 404, error: 'Order not found' };

    // 1. If staff/admin with orders.read permission
    if (user && (user.role === 'admin' || user.role === 'super-admin' || user.permissions?.includes('orders.read'))) {
      return { status: 200, data: JSON.parse(row.data_json) };
    }

    // 2. If logged-in customer, verify ownership
    if (user && user.role === 'customer') {
      const cust = db.prepare('SELECT phone, email FROM customers WHERE id = ?').get(user.id);
      const isOwner = (cust && cust.phone === row.customer_phone) ||
                      (cust && cust.email && cust.email.toLowerCase() === (row.customer_email || '').toLowerCase());
      if (!isOwner) {
        return { status: 403, error: 'Access denied: You do not have permission to view this order.' };
      }
      return { status: 200, data: JSON.parse(row.data_json) };
    }

    // 3. For public/guest tracking, verify matching phone number
    const cleanVerify = (verifyPhone || '').trim().replace(/[^0-9]/g, '');
    if (!cleanVerify) {
      return { status: 401, error: 'Phone number verification required to view order details.' };
    }
    const cleanOrderPhone = (row.customer_phone || '').replace(/[^0-9]/g, '');
    if (!cleanOrderPhone.endsWith(cleanVerify.slice(-10))) {
      return { status: 403, error: 'Verification failed: Order reference number and phone number do not match.' };
    }

    return { status: 200, data: JSON.parse(row.data_json) };
  }

  createOrder(orderData, actor = null) {
    const settingsRow = db.prepare("SELECT value FROM settings WHERE `key` = 'site_settings'").get();
    const siteSettings = settingsRow ? JSON.parse(settingsRow.value) : {};
    const hasCod = Boolean(siteSettings.enableCashOnDelivery);
    const hasBkash = Boolean(siteSettings.bkashMerchantNumber && siteSettings.bkashMerchantNumber.trim().length > 0);
    const hasNagad = Boolean(siteSettings.nagadMerchantNumber && siteSettings.nagadMerchantNumber.trim().length > 0);
    const hasBank = Boolean(siteSettings.bankDetails && siteSettings.bankDetails.bankName && siteSettings.bankDetails.accountNumber);
    const hasAnyPaymentMethod = hasCod || hasBkash || hasNagad || hasBank;

    if (!hasAnyPaymentMethod) {
      const err = new Error('No payment methods are currently active or configured on this store.');
      err.statusCode = 400;
      throw err;
    }

    if (orderData.paymentMethod === 'cod' && !hasCod) {
      const err = new Error('Cash on Delivery is currently disabled by store administrator.');
      err.statusCode = 400;
      throw err;
    }

    const orderNumber = generateNumber('CNX-ORD');
    const id = `ord-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const fullOrder = {
      ...orderData,
      id,
      orderNumber,
      createdAt,
      status: orderData.status || 'pending',
      paymentStatus: orderData.paymentStatus || 'pending',
      timeline: orderData.timeline || [
        { status: 'pending', title: 'Order Received', timestamp: createdAt, note: 'Order placed successfully by client.' }
      ]
    };

    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_phone, customer_email,
        total_amount, payment_method, payment_status, order_status, data_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orderNumber,
      fullOrder.customerName || '',
      fullOrder.customerPhone || '',
      fullOrder.customerEmail || '',
      fullOrder.total || 0,
      fullOrder.paymentMethod || 'cod',
      fullOrder.paymentStatus,
      fullOrder.status,
      JSON.stringify(fullOrder),
      createdAt
    );

    // Record stock movement for items
    if (Array.isArray(fullOrder.items)) {
      for (const item of fullOrder.items) {
        if (item.productId && item.quantity) {
          try {
            inventoryService.recordMovement({
              productId: item.productId,
              quantityChange: -Math.abs(item.quantity),
              movementType: 'sale',
              referenceType: 'order',
              referenceId: id,
              reason: `Order ${orderNumber}`
            });
          } catch (_) {}
        }
      }
    }

    logAudit({
      entity: 'order',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name || fullOrder.customerName,
      after: { orderNumber, total: fullOrder.total, status: fullOrder.status }
    });

    emitDomainEvent('order.placed', { orderId: id, orderNumber, total: fullOrder.total });
    emitDomainEvent('order.created', { orderId: id, orderNumber, total: fullOrder.total });
    return fullOrder;
  }

  updateStatus(id, { status, note, title }, actor = null) {
    const row = db.prepare('SELECT data_json FROM orders WHERE id = ? OR order_number = ?').get(id, id);
    if (!row) return null;

    const statusTitles = {
      pending: 'Order Received',
      confirmed: 'Order Confirmed',
      processing: 'Hardware Allocation & Testing',
      shipped: 'Dispatched for Delivery',
      scheduled_for_installation: 'Installation Scheduled with Engineer',
      delivered: 'Delivered to Customer',
      installed: 'Installed & Verified on Site',
      completed: 'Order & Warranty Completed',
      cancelled: 'Order Cancelled'
    };
    const eventTitle = title || statusTitles[status] || `Status: ${String(status).toUpperCase()}`;

    const order = JSON.parse(row.data_json);
    const prevStatus = order.status;
    order.status = status;
    order.timeline = order.timeline || [];
    order.timeline.push({
      status,
      title: eventTitle,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`
    });

    db.prepare(`
      UPDATE orders SET order_status = ?, data_json = ? WHERE id = ? OR order_number = ?
    `).run(status, JSON.stringify(order), id, id);

    logAudit({
      entity: 'order',
      entityId: id,
      action: 'status_update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: { status: prevStatus },
      after: { status, note }
    });

    emitDomainEvent('order.status_changed', { orderId: id, previousStatus: prevStatus, newStatus: status });
    emitDomainEvent('order.status_updated', { orderId: id, previousStatus: prevStatus, newStatus: status });
    return order;
  }

  updatePayment(id, { paymentStatus, paymentDetails }, actor = null) {
    const row = db.prepare('SELECT data_json FROM orders WHERE id = ? OR order_number = ?').get(id, id);
    if (!row) return null;

    const order = JSON.parse(row.data_json);
    const prevPayment = order.paymentStatus;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    } else if (paymentDetails?.status) {
      order.paymentStatus = paymentDetails.status;
    }
    if (paymentDetails) {
      order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };
    }

    db.prepare(`
      UPDATE orders SET payment_status = ?, data_json = ? WHERE id = ? OR order_number = ?
    `).run(order.paymentStatus, JSON.stringify(order), id, id);

    logAudit({
      entity: 'order',
      entityId: id,
      action: 'payment_update',
      actorId: actor?.id,
      actorName: actor?.name,
      before: { paymentStatus: prevPayment },
      after: { paymentStatus: order.paymentStatus }
    });

    if (order.paymentStatus === 'paid') {
      emitDomainEvent('order.paid', { orderId: id, paymentStatus: 'paid' });
    }

    return order;
  }
}

module.exports = new OrdersService();

