const express = require('express');
const router = express.Router();
const customersService = require('./customers.service');
const { customerRegisterSchema, customerLoginSchema, wishlistMergeSchema } = require('./customers.schemas');
const {
  registerLimiter,
  loginLimiter,
  requireCustomer,
  requireAdmin,
  csrfProtection,
  createSession,
  destroySession,
  validateBody
} = require('../../middleware/auth');

router.post('/auth/customer/register', registerLimiter, validateBody(customerRegisterSchema), (req, res) => {
  try {
    const customer = customersService.register(req.body);
    const session = createSession(customer.id, 'customer', customer.email, customer.name, res, 'storefront');
    res.json({
      success: true,
      user: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, role: 'customer' },
      csrfToken: session.csrfToken
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/customer/login', loginLimiter, validateBody(customerLoginSchema), (req, res) => {
  try {
    const user = customersService.login(req.body);
    const session = createSession(user.id, 'customer', user.email, user.name, res, 'storefront');
    res.json({
      success: true,
      user,
      csrfToken: session.csrfToken
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/customer/orders', requireCustomer, (req, res) => {
  try {
    const orders = customersService.getCustomerOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/wishlist', requireCustomer, (req, res) => {
  try {
    const items = customersService.getWishlist(req.user.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/wishlist/:productId', requireCustomer, csrfProtection, (req, res) => {
  try {
    customersService.addToWishlist(req.user.id, req.params.productId);
    res.json({ success: true, message: 'Item added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/wishlist/:productId', requireCustomer, csrfProtection, (req, res) => {
  try {
    customersService.removeFromWishlist(req.user.id, req.params.productId);
    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/wishlist/merge', requireCustomer, csrfProtection, validateBody(wishlistMergeSchema), (req, res) => {
  try {
    customersService.mergeWishlist(req.user.id, req.body.productIds);
    res.json({ success: true, message: 'Wishlist synced successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(['/customers', '/admin/customers'], requireAdmin, (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const list = customersService.listCustomers(includeArchived);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(['/customers/:id', '/admin/customers/:id'], requireAdmin, (req, res) => {
  try {
    const cust = customersService.getCustomerById(req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/customers/:id/archive', '/admin/customers/:id/archive'], requireAdmin, (req, res) => {
  try {
    customersService.archiveCustomer(req.params.id, req.user);
    res.json({ success: true, archived: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(['/customers/:id', '/admin/customers/:id'], requireAdmin, (req, res) => {
  try {
    customersService.deleteCustomer(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

