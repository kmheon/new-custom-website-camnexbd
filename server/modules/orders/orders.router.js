const express = require('express');
const router = express.Router();
const ordersService = require('./orders.service');
const { orderSchema, orderStatusSchema, orderPaymentSchema } = require('./orders.schemas');
const {
  requireAdmin,
  submissionLimiter,
  validateBody
} = require('../../middleware/auth');

router.get('/orders', requireAdmin, (req, res) => {
  try {
    const orders = ordersService.listOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:orderNumber', (req, res) => {
  try {
    const result = ordersService.getOrder(req.params.orderNumber, req.user, req.query.phone);
    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/orders', '/cart/checkout'], submissionLimiter, validateBody(orderSchema), (req, res) => {
  try {
    const order = ordersService.createOrder(req.body, req.user);
    res.json(order);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id/status', requireAdmin, validateBody(orderStatusSchema), (req, res) => {
  try {
    const order = ordersService.updateStatus(req.params.id, req.body, req.user);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orders/:id/payment', requireAdmin, validateBody(orderPaymentSchema), (req, res) => {
  try {
    const order = ordersService.updatePayment(req.params.id, req.body, req.user);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

