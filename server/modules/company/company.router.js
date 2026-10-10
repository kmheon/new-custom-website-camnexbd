const express = require('express');
const router = express.Router();
const companyService = require('./company.service');
const { companyProfileSchema } = require('./company.schemas');
const { requireAdmin, validateBody } = require('../../middleware/auth');

router.get('/company-profile', (req, res) => {
  try {
    const full = companyService.getFullPublicProfile();
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/company/profile', (req, res) => {
  try {
    const profile = companyService.getProfile();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/company/profile', requireAdmin, validateBody(companyProfileSchema), (req, res) => {
  try {
    const updated = companyService.updateProfile(req.body, req.user);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

