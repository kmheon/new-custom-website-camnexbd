const express = require('express');
const router = express.Router();
const pricingService = require('./pricing.service');
const { calculatePriceSchema } = require('./pricing.schemas');
const { validateBody } = require('../../middleware/auth');

router.post(['/packages/calculate-price', '/pricing/calculate-package'], validateBody(calculatePriceSchema), (req, res) => {
  try {
    const { packageId, cameraCount, formFactor } = req.body;
    const result = pricingService.calculateDynamicPackagePrice(packageId, cameraCount, formFactor);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

