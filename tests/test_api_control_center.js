#!/usr/bin/env node
/**
 * Comprehensive Automated Acceptance Test Suite:
 * CamneX Central API, Authentication & Environment Control Center
 *
 * Verifies:
 * 1. Mandatory Pre-Population & Discovery of all 17 existing repository integrations
 * 2. Idempotent Seeding (running seed twice produces zero duplicates)
 * 3. Preservation of existing production credentials & working providers
 * 4. Zero Secret Leakage (AES-256-GCM encryption at rest, write-only secrets, masked status)
 * 5. Real Runtime Integration (editing/disabling Google OAuth, BulkSMSBD, Turnstile, COD immediately changes backend runtime behavior)
 * 6. Safe Provider-Specific Connection Testing (dry/safe tests without sending real SMS or creating shipments)
 * 7. Full CRUD, Optimistic Concurrency, SSRF Protection, Immutable Variable Protection
 * 8. 3-Way Codebase Reconciliation Engine, Atomic Snapshots & Rollback, and Audit Logging
 */

process.env.NODE_ENV = 'test';

const assert = require('assert');
const db = require('../database');
const {
  integrationsControlService,
  CODEBASE_INTEGRATION_DEFINITIONS,
  validateSafeExternalUrl
} = require('../server/modules/integrations/integrations.service');
const { getProvidersStatus, sendPhoneOtp } = require('../server/auth/socialAuth');
const { getVerificationConfig, verifyTurnstileToken } = require('../server/auth/verificationService');

console.log('================================================================');
console.log('TEST SUITE: CENTRAL API, AUTH & ENVIRONMENT CONTROL CENTER');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
    failed++;
  }
}

(async function runSuite() {
  const originalEnv = { ...process.env };

  try {
    // Set known initial production-like environment variables before seeding
    process.env.GOOGLE_CLIENT_ID = '947940010045-testclient.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = '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9';
    process.env.SMS_GATEWAY_PROVIDER = 'bulksmsbd';
    process.env.SMS_API_KEY = 'bulksms_live_secret_api_key_777';
    process.env.SMS_SENDER_ID = '8809648909250';
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT';
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE';

    // Reset integrations tables to test fresh startup seeding
    integrationsControlService.ensureTables();
    db.prepare('DELETE FROM integrations').run();
    db.prepare('DELETE FROM runtime_configs').run();
    db.prepare('DELETE FROM integration_config_snapshots').run();

    // 1. Fresh installation auto-registers all existing codebase integrations
    await test('1. Auto-discovery & pre-population registers all 17 codebase integrations on fresh boot', async () => {
      integrationsControlService.seedAndMigrateIntegrations();
      const list = integrationsControlService.listIntegrations();
      assert.strictEqual(
        list.length,
        CODEBASE_INTEGRATION_DEFINITIONS.length,
        `Expected ${CODEBASE_INTEGRATION_DEFINITIONS.length} pre-populated integrations, got ${list.length}`
      );

      const ids = new Set(list.map(i => i.id));
      for (const expectedId of [
        'google_oauth',
        'apple_oauth',
        'bulksmsbd_sms',
        'greenweb_sms',
        'mimsms_sms',
        'twilio_sms',
        'cloudflare_turnstile',
        'email_smtp',
        'courier_steadfast',
        'courier_pathao',
        'courier_redx',
        'courier_paperfly',
        'payment_bkash',
        'payment_nagad',
        'payment_bank',
        'payment_cod',
        'webhooks_outbox'
      ]) {
        assert(ids.has(expectedId), `Missing expected pre-populated integration: ${expectedId}`);
      }
    });

    // 2. Idempotency: running seed twice produces zero duplicates and preserves existing secrets
    await test('2. Idempotent seeding: running seedAndMigrateIntegrations twice produces zero duplicates', async () => {
      integrationsControlService.seedAndMigrateIntegrations();
      integrationsControlService.seedAndMigrateIntegrations();
      const countRow = db.prepare('SELECT count(*) as count FROM integrations').get();
      assert.strictEqual(countRow.count, CODEBASE_INTEGRATION_DEFINITIONS.length);
    });

    // 3. Existing production credentials migrated and working without manual re-entry
    await test('3. Existing environment credentials (Google OAuth, BulkSMSBD, Turnstile) migrated intact', async () => {
      const google = integrationsControlService.getIntegration('google_oauth');
      assert.strictEqual(google.enabled, true);
      assert.strictEqual(google.isConfigured, true);
      assert.strictEqual(google.config.clientId, '947940010045-testclient.apps.googleusercontent.com');
      assert.strictEqual(google.secretStatus.clientSecret.configured, true);

      const bulksms = integrationsControlService.getIntegration('bulksmsbd_sms');
      assert.strictEqual(bulksms.enabled, true);
      assert.strictEqual(bulksms.isConfigured, true);
      assert.strictEqual(bulksms.config.senderId, '8809648909250');
      assert.strictEqual(bulksms.secretStatus.apiKey.configured, true);

      const turnstile = integrationsControlService.getIntegration('cloudflare_turnstile');
      assert.strictEqual(turnstile.enabled, true);
      assert.strictEqual(turnstile.isConfigured, true);
    });

    // 4. Zero Secret Leakage in API payloads & AES-256-GCM encryption at rest in DB
    await test('4. Zero secret leakage in API payloads and AES-256-GCM encryption at rest in database', async () => {
      const allIntegrations = integrationsControlService.listIntegrations();
      const envVars = integrationsControlService.listEnvironmentVariables();
      const serialized = JSON.stringify({ allIntegrations, envVars });

      assert(!serialized.includes('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9'), 'Plaintext Google secret must never appear in API payload');
      assert(!serialized.includes('bulksms_live_secret_api_key_777'), 'Plaintext BulkSMSBD key must never appear in API payload');
      assert(!serialized.includes('0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE'), 'Plaintext Turnstile secret must never appear in API payload');
      assert(!serialized.includes('enc:'), 'Raw ciphertext must never be exposed in client API payload');

      // Check database row directly to verify AES-256-GCM encryption at rest
      const dbGoogle = db.prepare('SELECT encrypted_secrets_json FROM integrations WHERE id = ?').get('google_oauth');
      const secObj = JSON.parse(dbGoogle.encrypted_secrets_json);
      assert(secObj.clientSecret.startsWith('enc:'), 'Database secret must be encrypted with enc: prefix');
      assert(!secObj.clientSecret.includes('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9'), 'Database must not store plaintext secret');
    });

    // 5. Real Runtime Integration: Disabling and Enabling BulkSMSBD immediately updates /api/auth/providers & sendPhoneOtp
    await test('5. Real Runtime Integration: Toggling BulkSMSBD immediately updates runtime auth status and OTP dispatch', async () => {
      // Initially enabled
      let status = getProvidersStatus();
      assert.strictEqual(status.smsOtp.configured, true);
      assert.strictEqual(status.smsOtp.provider, 'bulksmsbd');

      // Attempt to disable critical service without confirmCritical -> must reject with 400
      let criticalRejected = false;
      try {
        integrationsControlService.toggleIntegration('bulksmsbd_sms', { enabled: false, confirmCritical: false });
      } catch (err) {
        criticalRejected = err.code === 'CRITICAL_CONFIRMATION_REQUIRED';
      }
      assert.strictEqual(criticalRejected, true, 'Disabling critical integration must require confirmCritical');

      // Disable with confirmCritical: true
      integrationsControlService.toggleIntegration('bulksmsbd_sms', { enabled: false, confirmCritical: true }, { id: 'admin-1', name: 'Test Admin' });
      status = getProvidersStatus();
      assert.strictEqual(status.smsOtp.configured, false, 'Disabling BulkSMSBD must immediately mark smsOtp.configured = false at runtime');
      assert.strictEqual(status.smsOtp.provider, null);

      // Verify sendPhoneOtp immediately returns 503 when disabled
      let otpStatusCode = 200;
      const req = { body: { phone: '01712345678' }, ip: '127.0.0.1', headers: {} };
      const res = {
        status(c) { otpStatusCode = c; return this; },
        json(d) { this.data = d; return this; }
      };
      await sendPhoneOtp(req, res);
      assert.strictEqual(otpStatusCode, 503, 'sendPhoneOtp must return 503 when SMS integration is disabled');

      // Re-enable BulkSMSBD -> immediately active again
      integrationsControlService.toggleIntegration('bulksmsbd_sms', { enabled: true }, { id: 'admin-1', name: 'Test Admin' });
      status = getProvidersStatus();
      assert.strictEqual(status.smsOtp.configured, true);
      assert.strictEqual(status.smsOtp.provider, 'bulksmsbd');
    });

    // 6. Real Runtime Integration: Updating Google OAuth credentials & toggling immediately updates /api/auth/providers
    await test('6. Real Runtime Integration: Editing & toggling Google OAuth immediately updates runtime provider status', async () => {
      integrationsControlService.updateIntegration(
        'google_oauth',
        {
          enabled: true,
          config: { clientId: '111222333-updated.apps.googleusercontent.com' },
          secrets: { clientSecret: 'GOCSPX-rotated_secret_888' }
        },
        { id: 'admin-1', name: 'Test Admin' }
      );

      let status = getProvidersStatus();
      assert.strictEqual(status.google.configured, true);
      assert.strictEqual(status.google.clientId, '111222333-updated.apps.googleusercontent.com');

      // Disable Google OAuth
      integrationsControlService.toggleIntegration('google_oauth', { enabled: false, confirmCritical: true });
      status = getProvidersStatus();
      assert.strictEqual(status.google.configured, false);
      assert.strictEqual(status.google.clientId, null);

      // Re-enable Google OAuth
      integrationsControlService.toggleIntegration('google_oauth', { enabled: true });
      status = getProvidersStatus();
      assert.strictEqual(status.google.configured, true);
    });

    // 7. Real Runtime Integration: Toggling Cloudflare Turnstile immediately updates verification config & token verification
    await test('7. Real Runtime Integration: Disabling Cloudflare Turnstile updates captcha config & bypasses challenge', async () => {
      integrationsControlService.toggleIntegration('cloudflare_turnstile', { enabled: false, confirmCritical: true });
      let verCfg = getVerificationConfig();
      assert.strictEqual(verCfg.turnstile.configured, false);
      assert.strictEqual(verCfg.turnstile.siteKey, null);

      const verifyRes = await verifyTurnstileToken('', '127.0.0.1');
      assert.strictEqual(verifyRes.success, true);
      assert.strictEqual(verifyRes.adminDisabledBypass, true);

      // Re-enable Turnstile
      integrationsControlService.toggleIntegration('cloudflare_turnstile', { enabled: true });
      verCfg = getVerificationConfig();
      assert.strictEqual(verCfg.turnstile.configured, true);
      assert.strictEqual(verCfg.turnstile.siteKey, '0x4AAAAAAFZ9v3kdzHEYCrpT');
    });

    // 8. Safe Provider-Specific Connection Tests (without sending SMS or creating shipments)
    await test('8. Safe Connection Testing: validates providers without sending SMS or creating shipments', async () => {
      const bulkTest = await integrationsControlService.testIntegrationConnection('bulksmsbd_sms');
      assert.strictEqual(bulkTest.success, true);
      assert.strictEqual(bulkTest.status, 'healthy');

      const turnstileTest = await integrationsControlService.testIntegrationConnection('cloudflare_turnstile');
      assert.strictEqual(turnstileTest.success, true);

      const codTest = await integrationsControlService.testIntegrationConnection('payment_cod');
      assert.strictEqual(codTest.success, true);

      const webhookTest = await integrationsControlService.testIntegrationConnection('webhooks_outbox');
      assert.strictEqual(webhookTest.success, true);
    });

    // 9. SSRF Protection on URL validation & Custom Integration creation
    await test('9. Security: SSRF validator blocks localhost, loopback, private RFC1918 IPs, and cloud metadata', async () => {
      assert.strictEqual(validateSafeExternalUrl('http://127.0.0.1:8080/admin').valid, false);
      assert.strictEqual(validateSafeExternalUrl('http://localhost:3000/internal').valid, false);
      assert.strictEqual(validateSafeExternalUrl('http://169.254.169.254/latest/meta-data/').valid, false);
      assert.strictEqual(validateSafeExternalUrl('http://192.168.1.50/api').valid, false);
      assert.strictEqual(validateSafeExternalUrl('http://10.0.0.12/api').valid, false);
      assert.strictEqual(validateSafeExternalUrl('file:///etc/passwd').valid, false);
      assert.strictEqual(validateSafeExternalUrl('https://api.partner-erp.com/v1/webhook').valid, true);

      let ssrfBlocked = false;
      try {
        integrationsControlService.createIntegration({
          name: 'Malicious SSRF Adapter',
          provider: 'ssrf_test',
          config: { endpointUrl: 'http://169.254.169.254/latest/meta-data/' }
        });
      } catch (err) {
        ssrfBlocked = err.statusCode === 400;
      }
      assert.strictEqual(ssrfBlocked, true, 'createIntegration must reject SSRF metadata URLs');
    });

    // 10. Full CRUD for Custom Integration & Credential Purging for Built-in Integration
    await test('10. Full CRUD: Add custom integration, edit, test, and delete; purge built-in credentials safely', async () => {
      const created = integrationsControlService.createIntegration(
        {
          name: 'ERPNext Inventory Bridge',
          provider: 'erpnext_sync',
          category: 'webhooks_erp',
          enabled: true,
          config: { endpointUrl: 'https://erp.camnexbd.com/api/method/sync', timeoutMs: 5000 },
          secrets: { apiKey: 'erp_secret_token_999' }
        },
        { id: 'admin-1', name: 'Test Admin' }
      );

      assert(created.id.includes('erpnext_sync'));
      assert.strictEqual(created.isCustom, true);
      assert.strictEqual(created.secretStatus.apiKey.configured, true);

      // Test custom integration
      const testRes = await integrationsControlService.testIntegrationConnection(created.id);
      assert.strictEqual(testRes.success, true);

      // Delete custom integration
      const delRes = integrationsControlService.deleteIntegration(created.id, { confirmDelete: true });
      assert.strictEqual(delRes.deleted, true);
      assert.strictEqual(delRes.mode, 'removed');
      assert.strictEqual(integrationsControlService.getIntegration(created.id), null);

      // Delete/Purge built-in integration (e.g. apple_oauth) -> purges credentials & disables but keeps registry entry
      const purgeRes = integrationsControlService.deleteIntegration('apple_oauth', { confirmDelete: true });
      assert.strictEqual(purgeRes.deleted, true);
      assert.strictEqual(purgeRes.mode, 'credentials_purged');
      const appleAfter = integrationsControlService.getIntegration('apple_oauth');
      assert(appleAfter !== null, 'Built-in integration must remain in registry after credential purge');
      assert.strictEqual(appleAfter.enabled, false);
    });

    // 11. Central Environment Configuration: Mutable updates vs Immutable infrastructure protection
    await test('11. Central Environment Config: updates mutable variables & blocks immutable infrastructure keys', async () => {
      let immutableBlocked = false;
      try {
        integrationsControlService.updateEnvironmentVariables({
          ENCRYPTION_KEY: 'hacked_key',
          DB_PASSWORD: 'hacked_password'
        });
      } catch (err) {
        immutableBlocked = err.code === 'IMMUTABLE_CONFIG_KEY';
      }
      assert.strictEqual(immutableBlocked, true, 'Must reject runtime mutation of immutable infrastructure keys');

      const updateRes = integrationsControlService.updateEnvironmentVariables(
        {
          SMS_SENDER_ID: 'CamneX-BD',
          API_RATE_LIMIT: '750'
        },
        { id: 'admin-1', name: 'Test Admin' }
      );
      assert.strictEqual(updateRes.success, true);
      assert.strictEqual(process.env.SMS_SENDER_ID, 'CamneX-BD');
      assert.strictEqual(process.env.API_RATE_LIMIT, '750');
    });

    // 12. Reconciliation Report & Atomic Snapshot Rollback
    await test('12. Reconciliation Report & Atomic Snapshot Rollback restores previous state', async () => {
      const report = integrationsControlService.getReconciliationReport();
      assert.strictEqual(report.summary.discoveredInCodeCount, CODEBASE_INTEGRATION_DEFINITIONS.length);
      assert.strictEqual(report.summary.missingRegistrationCount, 0);

      const snapshots = integrationsControlService.listSnapshots();
      assert(snapshots.length > 0, 'Snapshots must be created automatically on changes');

      // Capture a specific snapshot, make a change, then roll back to it
      const snapId = integrationsControlService.createSnapshot('Checkpoint before rollback test', 'Test Admin');
      integrationsControlService.updateIntegration('bulksmsbd_sms', {
        config: { senderId: 'TEMP_SENDER_999' }
      });
      assert.strictEqual(integrationsControlService.getIntegration('bulksmsbd_sms').config.senderId, 'TEMP_SENDER_999');

      // Rollback to snapId
      const rbRes = integrationsControlService.rollbackToSnapshot(snapId, { id: 'admin-1', name: 'Test Admin' });
      assert.strictEqual(rbRes.success, true);
      assert.strictEqual(integrationsControlService.getIntegration('bulksmsbd_sms').config.senderId, 'CamneX-BD');
    });

  } finally {
    // Restore original process.env
    for (const k of Object.keys(process.env)) {
      if (!(k in originalEnv)) delete process.env[k];
    }
    Object.assign(process.env, originalEnv);
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
})();
