const express = require('express');
const router = express.Router();
const inventoryService = require('./inventory.service');
const { stockAdjustmentSchema } = require('./inventory.schemas');
const { requirePermission, validateBody } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../shared/permissions');

router.get('/inventory/movements', requirePermission(PERMISSIONS.INVENTORY_READ), (req, res) => {
  try {
    const movements = inventoryService.listMovements(req.query);
    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/adjust', requirePermission(PERMISSIONS.INVENTORY_ADJUST), validateBody(stockAdjustmentSchema), (req, res) => {
  try {
    const result = inventoryService.recordMovement({
      ...req.body,
      actor: req.user
    });
    res.json(result);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

