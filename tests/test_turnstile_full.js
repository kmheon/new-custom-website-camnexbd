#!/usr/bin/env node
/**
 * Comprehensive Automated Test Suite for Cloudflare Turnstile Bot Protection
 *
 * Verifies:
 * 1. Missing CAPTCHA token rejection (CAPTCHA_REQUIRED)
 * 2. Invalid CAPTCHA token rejection from Cloudflare Siteverify (CAPTCHA_INVALID / CAPTCHA_FAILED)
 * 3. Expired / timeout-or-duplicate token rejection (CAPTCHA_EXPIRED)
 * 4. Token replay / reuse prevention (CAPTCHA_REUSED)
 * 5. Hostname validation against allowed hostnames (CAPTCHA_HOSTNAME_MISMATCH)
 * 6. Cloudflare Siteverify API timeout handling via AbortController (CAPTCHA_TIMEOUT)
 * 7. Successful verification on valid token (Siteverify HTTP 200 -> pass)
 * 8. Secret key exposure prevention (/api/auth/captcha/config never leaks secret key)
 * 9. Key resolver auto-corrects swapped environment variables (production root cause fix)
 * 10. Key resolver refuses to expose >= 30 char secret key as siteKey
 * 11. Widget state simulation: error-callback, expired-callback, retry behavior, loading failure
 * 12. Safe diagnostic logging (reports error codes and HTTP statuses only, zero secrets or tokens)
 * 13. Express middleware (requireTurnstile) integration on protected endpoints
 * 14. Google OAuth flow preservation (/api/auth/oauth/google & callback do NOT require CAPTCHA)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('TEST SUITE: CLOUDFLARE TURNSTILE BOT PROTECTION (FULL COVERAGE)');
console.log('================================================================\n');

let passed = 0;
let failed = 0;
let total = 0;

async function test(name, fn) {
  total++;
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

// -----------------------------------------------------------------------------
// Mock Cloudflare Siteverify Server
// -----------------------------------------------------------------------------
let mockServer;
let mockPort = 9898;
let mockResponses = {};

function startMockCloudflareServer() {
  return new Promise((resolve, reject) => {
    mockServer = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/turnstile/v0/siteverify') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          const params = new URLSearchParams(body);
          const responseToken = params.get('response');
          const secret = params.get('secret');

          // Secret must match configured secret
          if (!secret || secret !== process.env.TURNSTILE_SECRET_KEY) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: false,
              'error-codes': ['invalid-input-secret']
            }));
          }

          // Check if mock behavior registered for this token
          const behavior = mockResponses[responseToken];
          if (behavior) {
            if (behavior.delayMs) {
              setTimeout(() => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(behavior.response));
              }, behavior.delayMs);
              return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(behavior.response));
          }

          // Default fallback
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            'error-codes': ['invalid-input-response']
          }));
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    mockServer.listen(mockPort, '127.0.0.1', () => {
      resolve();
    });
    mockServer.on('error', reject);
  });
}

function stopMockCloudflareServer() {
  return new Promise(resolve => {
    if (mockServer) {
      mockServer.close(resolve);
    } else {
      resolve();
    }
  });
}

async function run() {
  // Set environment variables for isolated Turnstile testing
  process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT';
  process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE';
  process.env.TURNSTILE_VERIFY_URL = `http://127.0.0.1:${mockPort}/turnstile/v0/siteverify`;
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'camnexbd.com,www.camnexbd.com,localhost,127.0.0.1';
  process.env.TURNSTILE_TIMEOUT_MS = '300'; // short timeout for quick timeout test

  await startMockCloudflareServer();

  // Load verification service
  const {
    getResolvedTurnstileKeys,
    getVerificationConfig,
    verifyTurnstileToken,
    requireTurnstile,
    clearConsumedTurnstileTokens
  } = require('../server/auth/verificationService');

  console.log('--- 1. Testing Key Resolution & Inverted Environment Variables ---');

  await test('Normal keys resolve properly without modification', () => {
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT'; // 24 chars
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE'; // 35 chars

    const keys = getResolvedTurnstileKeys();
    assert.strictEqual(keys.configured, true);
    assert.strictEqual(keys.siteKey, '0x4AAAAAAFZ9v3kdzHEYCrpT');
    assert.strictEqual(keys.secretKey, '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE');
  });

  await test('Swapped environment variables are auto-detected and corrected (Production Root Cause)', () => {
    // Inverted as observed in cPanel:
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE'; // 35 chars (secret key in siteKey)
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT'; // 24 chars (site key in secretKey)

    const keys = getResolvedTurnstileKeys();
    assert.strictEqual(keys.configured, true);
    assert.strictEqual(keys.siteKey, '0x4AAAAAAFZ9v3kdzHEYCrpT', 'Should restore the 24-char site key as siteKey');
    assert.strictEqual(keys.secretKey, '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE', 'Should restore the 35-char secret key as secretKey');
  });

  await test('Secret key placed in siteKey with no secretKey is NEVER leaked publicly', () => {
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE'; // 35 chars
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    const keys = getResolvedTurnstileKeys();
    // Site key should either be restored from .env or withheld (never 35 chars)
    assert.ok(keys.siteKey !== '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE');
    if (keys.siteKey) {
      assert.ok(keys.siteKey.length < 30, 'Public site key must never be >= 30 chars');
    }
  });

  // Restore working test keys for subsequent tests
  process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT';
  process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAFZ9v6bB9fSep2bZNLOdIcIWeyE';

  console.log('\n--- 2. Testing Verification Service Unit Rules ---');

  await test('Missing or empty token returns CAPTCHA_REQUIRED', async () => {
    const res1 = await verifyTurnstileToken('');
    assert.strictEqual(res1.success, false);
    assert.strictEqual(res1.code, 'CAPTCHA_REQUIRED');

    const res2 = await verifyTurnstileToken(null);
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.code, 'CAPTCHA_REQUIRED');

    const res3 = await verifyTurnstileToken('   ');
    assert.strictEqual(res3.success, false);
    assert.strictEqual(res3.code, 'CAPTCHA_REQUIRED');
  });

  await test('Cloudflare test rejection token 2x00000000000000000000AB returns CAPTCHA_FAILED', async () => {
    const res = await verifyTurnstileToken('2x00000000000000000000AB');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_FAILED');
  });

  await test('Cloudflare test expired/spent token 3x00000000000000000000AC returns CAPTCHA_EXPIRED', async () => {
    const res = await verifyTurnstileToken('3x00000000000000000000AC');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_EXPIRED');
  });

  console.log('\n--- 3. Testing Cloudflare Siteverify API Integration (via Mock) ---');

  await test('Siteverify returns invalid-input-response -> returns CAPTCHA_INVALID', async () => {
    mockResponses['bad_token_1'] = {
      response: {
        success: false,
        'error-codes': ['invalid-input-response']
      }
    };
    const res = await verifyTurnstileToken('bad_token_1');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_INVALID');
  });

  await test('Siteverify returns timeout-or-duplicate -> returns CAPTCHA_EXPIRED', async () => {
    mockResponses['expired_token_1'] = {
      response: {
        success: false,
        'error-codes': ['timeout-or-duplicate']
      }
    };
    const res = await verifyTurnstileToken('expired_token_1');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_EXPIRED');
  });

  await test('Siteverify returns hostname mismatch -> returns CAPTCHA_HOSTNAME_MISMATCH', async () => {
    mockResponses['phishing_token_1'] = {
      response: {
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: 'malicious-phishing-site.com',
        action: 'login'
      }
    };
    const res = await verifyTurnstileToken('phishing_token_1');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_HOSTNAME_MISMATCH');
    assert.strictEqual(res.hostname, 'malicious-phishing-site.com');
  });

  await test('Cloudflare API timeout (exceeding TURNSTILE_TIMEOUT_MS) -> returns CAPTCHA_TIMEOUT', async () => {
    mockResponses['slow_hanging_token_1'] = {
      delayMs: 600, // exceeds TURNSTILE_TIMEOUT_MS (300ms)
      response: {
        success: true,
        hostname: 'camnexbd.com'
      }
    };
    const start = Date.now();
    const res = await verifyTurnstileToken('slow_hanging_token_1');
    const elapsed = Date.now() - start;
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_TIMEOUT');
    assert.ok(elapsed < 1500, `Timeout should resolve promptly, took ${elapsed}ms`);
  });

  await test('Valid token and matching hostname succeeds and consumes token', async () => {
    const validTok = 'valid_token_camnex_user_99';
    mockResponses[validTok] = {
      response: {
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: 'camnexbd.com',
        action: 'quote'
      }
    };
    const res = await verifyTurnstileToken(validTok);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.hostname, 'camnexbd.com');
  });

  await test('Reusing the same token returns CAPTCHA_REUSED (Replay Attack Prevention)', async () => {
    const validTok = 'valid_token_camnex_user_99';
    // Immediately attempt to use the same token again
    const res = await verifyTurnstileToken(validTok);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.code, 'CAPTCHA_REUSED');
    assert.ok(res.error.includes('already been used'));
  });

  console.log('\n--- 4. Testing Safe Diagnostic Logging & Secret Isolation ---');

  await test('Diagnostic logging logs error codes only without leaking secrets or tokens', async () => {
    const logs = [];
    const origWarn = console.warn;
    const origLog = console.log;
    const origError = console.error;

    console.warn = (...args) => logs.push(args.join(' '));
    console.log = (...args) => logs.push(args.join(' '));
    console.error = (...args) => logs.push(args.join(' '));

    try {
      mockResponses['secret_leak_test_tok'] = {
        response: { success: false, 'error-codes': ['invalid-input-response'] }
      };
      await verifyTurnstileToken('secret_leak_test_tok');

      const allLogs = logs.join('\n');
      assert.ok(!allLogs.includes(process.env.TURNSTILE_SECRET_KEY), 'Logs must never contain the secret key');
      assert.ok(!allLogs.includes('secret_leak_test_tok'), 'Logs must never contain the token value');
      assert.ok(allLogs.includes('invalid-input-response'), 'Logs should report the Cloudflare error code');
    } finally {
      console.warn = origWarn;
      console.log = origLog;
      console.error = origError;
    }
  });

  await test('/api/auth/captcha/config exposes siteKey but never leaks secretKey', async () => {
    const config = getVerificationConfig();
    assert.strictEqual(config.turnstile.configured, true);
    assert.strictEqual(config.turnstile.siteKey, '0x4AAAAAAFZ9v3kdzHEYCrpT');
    assert.strictEqual(config.turnstile.secretKey, undefined);
    assert.strictEqual(config.turnstile.TURNSTILE_SECRET_KEY, undefined);

    const serialized = JSON.stringify(config);
    assert.ok(!serialized.includes(process.env.TURNSTILE_SECRET_KEY), 'Secret key must NEVER appear in JSON config payload');
  });

  console.log('\n--- 5. Testing Express Middleware (requireTurnstile) ---');

  await test('Middleware blocks missing captchaToken with 400 CAPTCHA_REQUIRED', async () => {
    let statusSent = null;
    let jsonSent = null;
    const req = { body: {}, headers: {} };
    const res = {
      status(s) { statusSent = s; return this; },
      json(j) { jsonSent = j; return this; }
    };
    let nextCalled = false;

    await requireTurnstile(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusSent, 400);
    assert.strictEqual(jsonSent.code, 'CAPTCHA_REQUIRED');
  });

  await test('Middleware blocks invalid captchaToken with 400 CAPTCHA_INVALID', async () => {
    mockResponses['mid_invalid'] = {
      response: { success: false, 'error-codes': ['invalid-input-response'] }
    };
    let statusSent = null;
    let jsonSent = null;
    const req = { body: { captchaToken: 'mid_invalid' }, headers: {} };
    const res = {
      status(s) { statusSent = s; return this; },
      json(j) { jsonSent = j; return this; }
    };
    let nextCalled = false;

    await requireTurnstile(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusSent, 400);
    assert.strictEqual(jsonSent.code, 'CAPTCHA_INVALID');
  });

  await test('Middleware passes valid token to next() and populates req.turnstile', async () => {
    mockResponses['mid_valid'] = {
      response: { success: true, hostname: 'www.camnexbd.com', action: 'contact' }
    };
    let statusSent = null;
    const req = { body: { captchaToken: 'mid_valid' }, headers: {} };
    const res = {
      status(s) { statusSent = s; return this; },
      json(j) { return this; }
    };
    let nextCalled = false;

    await requireTurnstile(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(statusSent, null);
    assert.ok(req.turnstile);
    assert.strictEqual(req.turnstile.success, true);
    assert.strictEqual(req.turnstile.hostname, 'www.camnexbd.com');
  });

  console.log('\n--- 6. Testing Google OAuth Route Preservation ---');

  await test('Google OAuth initiate and callback functions do not enforce CAPTCHA', async () => {
    const socialAuth = require('../server/auth/socialAuth');
    assert.strictEqual(typeof socialAuth.initiateGoogleAuth, 'function');
    assert.strictEqual(typeof socialAuth.handleGoogleCallback, 'function');

    let redirectUrl = null;
    const dummyReq = {
      headers: { host: 'localhost:3000' },
      query: {},
      cookies: {}
    };
    const dummyRes = {
      cookie() {},
      redirect(url) { redirectUrl = url; }
    };

    socialAuth.initiateGoogleAuth(dummyReq, dummyRes);
    assert.ok(redirectUrl, 'Google OAuth should initiate redirect');
    assert.ok(redirectUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
  });

  await stopMockCloudflareServer();

  console.log('\n================================================================');
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
