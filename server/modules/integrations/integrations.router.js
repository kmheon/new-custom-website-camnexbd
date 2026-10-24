/**
 * CamneX Central API, Authentication & Environment Control Center Router
 * Mounted at /api/admin/integrations (and /api/v1/admin/integrations)
 */

const express = require('express');
const router = express.Router();
const {
  integrationsControlService,
  INTEGRATION_CATEGORIES,
  IMMUTABLE_INFRA_KEYS
} = require('./integrations.service');
const { requireAdmin, requirePermission } = require('../../middleware/auth');
const { PERMISSIONS } = require('../../shared/permissions');

// All Control Center routes require admin authentication and WEBSITE_SETTINGS_WRITE permission
router.use(requireAdmin);
router.use(requirePermission(PERMISSIONS.WEBSITE_SETTINGS_WRITE));

/**
 * GET /api/admin/integrations
 * List all registered integrations, category summary, and reconciliation status
 */
router.get('/', (req, res) => {
  try {
    const category = req.query.category || null;
    const integrations = integrationsControlService.listIntegrations(category);
    const reconciliation = integrationsControlService.getReconciliationReport();
    const snapshots = integrationsControlService.listSnapshots();

    res.json({
      success: true,
      categories: INTEGRATION_CATEGORIES,
      integrations,
      reconciliationSummary: reconciliation.summary,
      snapshotsCount: snapshots.length
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/integrations/reconciliation
 * Detailed codebase vs database vs runtime reconciliation report
 */
router.get('/reconciliation', (req, res) => {
  try {
    const report = integrationsControlService.getReconciliationReport();
    res.json({
      success: true,
      report
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/integrations/reconcile
 * Execute idempotent auto-discovery, migration & runtime synchronization
 */
router.post('/reconcile', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const report = integrationsControlService.runReconciliationRepair(actor);
    const integrations = integrationsControlService.listIntegrations();
    res.json({
      success: true,
      message: 'Reconciliation and runtime synchronization completed.',
      report,
      integrations
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/integrations/env
 * List categorized runtime & infrastructure environment variables (secrets masked)
 */
router.get('/env', (req, res) => {
  try {
    const variables = integrationsControlService.listEnvironmentVariables();
    res.json({
      success: true,
      variables,
      immutableKeys: Array.from(IMMUTABLE_INFRA_KEYS)
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/integrations/env
 * Update mutable runtime environment variables atomically
 */
router.put('/env', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const updates = req.body?.updates || req.body || {};
    const result = integrationsControlService.updateEnvironmentVariables(updates, actor);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code || 'ENV_UPDATE_FAILED'
    });
  }
});

/**
 * GET /api/admin/integrations/snapshots
 * List last-known-good configuration snapshots for rollback
 */
router.get('/snapshots', (req, res) => {
  try {
    const snapshots = integrationsControlService.listSnapshots();
    res.json({
      success: true,
      snapshots
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/integrations/rollback/:snapshotId
 * Rollback integrations and runtime configuration to a saved snapshot
 */
router.post('/rollback/:snapshotId', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const result = integrationsControlService.rollbackToSnapshot(req.params.snapshotId, actor);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/integrations/:id
 * Get single integration detail
 */
router.get('/:id', (req, res) => {
  try {
    const integration = integrationsControlService.getIntegration(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: `Integration "${req.params.id}" not found.` });
    }
    res.json({
      success: true,
      integration
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/integrations
 * Add a new integration
 */
router.post('/', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const integration = integrationsControlService.createIntegration(req.body, actor);
    res.status(201).json({
      success: true,
      integration
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/integrations/:id
 * Update integration configuration and write-only secrets
 */
router.put('/:id', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const integration = integrationsControlService.updateIntegration(req.params.id, req.body || {}, actor);
    res.json({
      success: true,
      integration
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code || 'UPDATE_FAILED'
    });
  }
});

/**
 * POST /api/admin/integrations/:id/toggle
 * Enable or disable an integration immediately at runtime
 */
router.post('/:id/toggle', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const { enabled, confirmCritical } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Boolean "enabled" field is required.' });
    }
    const integration = integrationsControlService.toggleIntegration(
      req.params.id,
      { enabled, confirmCritical: Boolean(confirmCritical) },
      actor
    );
    res.json({
      success: true,
      integration
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      error: err.message,
      code: err.code || 'TOGGLE_FAILED'
    });
  }
});

/**
 * POST /api/admin/integrations/:id/test
 * Run safe server-side connection / configuration test
 */
router.post('/:id/test', async (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const result = await integrationsControlService.testIntegrationConnection(req.params.id, req.body || {}, actor);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/admin/integrations/:id
 * Delete custom integration or purge & disable built-in integration credentials
 */
router.delete('/:id', (req, res) => {
  try {
    const actor = {
      id: req.user?.id || req.session?.user_id,
      name: req.user?.name || req.session?.name || 'Administrator'
    };
    const confirmDelete = Boolean(req.body?.confirmDelete || req.query?.confirm === 'true');
    const result = integrationsControlService.deleteIntegration(req.params.id, { confirmDelete }, actor);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;

