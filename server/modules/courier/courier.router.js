/**
 * CamneX Bangladesh - Courier Management Admin Router
 */

const express = require('express');
const { courierService } = require('./courier.service');
const { courierRegistry } = require('./courier.registry');

const router = express.Router();

/**
 * GET /api/admin/couriers
 * Retrieve provider catalog, integration status, and masked configurations
 */
router.get('/', (req, res) => {
  try {
    const catalog = courierService.getCouriersCatalog();
    res.json({
      success: true,
      providers: catalog
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/couriers/:provider/test-connection
 * Test API connection with configured or submitted credentials
 */
router.post('/:provider/test-connection', async (req, res) => {
  const { provider } = req.params;
  const credentials = req.body || null;

  try {
    const result = await courierService.testCourierConnection(provider, credentials);
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/orders/:id/dispatch-courier
 * Dispatch order via selected courier provider
 */
router.post('/orders/:id/dispatch-courier', async (req, res) => {
  const { id } = req.params;
  const { providerId, instructions, weight, itemType, cityId, zoneId } = req.body;

  try {
    const result = await courierService.dispatchOrder(id, {
      providerId,
      instructions,
      weight,
      itemType,
      cityId,
      zoneId
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/orders/:id/courier-tracking
 * Fetch live courier tracking status for an order
 */
router.get('/orders/:id/courier-tracking', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await courierService.getLiveOrderTracking(id);
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

