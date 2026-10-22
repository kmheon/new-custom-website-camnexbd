const express = require('express');
const router = express.Router();
const servicesService = require('./services.service');
const { serviceRequestSchema, serviceOfferingSchema } = require('./services.schemas');
const {
  requireAdmin,
  submissionLimiter,
  validateBody
} = require('../../middleware/auth');
const { requireTurnstile } = require('../../auth/verificationService');

router.get('/service-requests', requireAdmin, (req, res) => {
  try {
    const requests = servicesService.listRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy /api/services GET returned service requests for admin inbox
router.get('/services', requireAdmin, (req, res) => {
  try {
    const requests = servicesService.listRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/services', '/service-requests'], submissionLimiter, requireTurnstile, validateBody(serviceRequestSchema), (req, res) => {
  try {
    const request = servicesService.createRequest(req.body, req.user);
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Service Offerings
router.get(['/service-offerings', '/services/offerings'], (req, res) => {
  try {
    const offerings = servicesService.listOfferings(false);
    res.json(offerings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(['/admin/service-offerings', '/admin/services'], requireAdmin, (req, res) => {
  try {
    const offerings = servicesService.listOfferings(true);
    res.json(offerings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/admin/service-offerings', '/admin/services'], requireAdmin, validateBody(serviceOfferingSchema), (req, res) => {
  try {
    const created = servicesService.createOffering(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(['/admin/service-offerings/:id', '/admin/services/:id'], requireAdmin, validateBody(serviceOfferingSchema), (req, res) => {
  try {
    const updated = servicesService.updateOffering(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Service offering not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(['/admin/service-offerings/:id', '/admin/services/:id'], requireAdmin, (req, res) => {
  try {
    servicesService.deleteOffering(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

