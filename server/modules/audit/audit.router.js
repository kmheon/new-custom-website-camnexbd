const express = require('express');
const router = express.Router();
const auditService = require('./audit.service');
const { auditQuerySchema } = require('./audit.schemas');
const { requirePermission, validateBody } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../shared/permissions');

router.get(['/audit-logs', '/admin/audit-logs'], requirePermission(PERMISSIONS.AUDIT_READ), (req, res) => {
  try {
    const logs = auditService.listLogs(req.query);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

