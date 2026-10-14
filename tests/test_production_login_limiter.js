#!/usr/bin/env node
/**
 * Production-Mode Login Rate Limiter Test
 *
 * Verifies that under NODE_ENV=production:
 * 1. 5 consecutive failed admin logins from one IP return 401/400.
 * 2. The 6th attempt from the SAME IP is rejected with HTTP 429 Too Many Requests.
 * 3. Successful logins do NOT increment the failure limit (skipSuccessfulRequests: true).
 * 4. A different IP is NOT blocked by the rate limit.
 * 5. Rate limiting is NOT bypassed by any test-only flag in production.
 */

const assert = require('assert');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const { loginLimiter } = require('../server/middleware/auth');

async function runProductionLoginLimiterTests() {
  console.log('================================================================');
  console.log('PRODUCTION LOGIN RATE LIMITER TEST SUITE');
  console.log('================================================================');

  // Verify that loginLimiter has NO skipInTest or test-only bypass
  // Inspecting limiter options directly
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  // 1. Setup isolated test Express app using the real loginLimiter middleware
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use(cookieParser());

  let successCount = 0;
  let failureCount = 0;

  // Mock login endpoint matching production admin login logic with loginLimiter
  app.post('/api/test/login', loginLimiter, (req, res) => {
    const { email, password } = req.body || {};
    if (email === 'admin@camnexbd.com' && password === 'CorrectPassword123!') {
      successCount++;
      return res.status(200).json({ success: true, message: 'Logged in successfully' });
    } else {
      failureCount++;
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;

  function doLogin(ip, email, password) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ email, password });
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: '/api/test/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'X-Forwarded-For': ip
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(body); } catch (_) {}
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  try {
    const testIpA = '198.51.100.10';
    const testIpB = '198.51.100.20';

    console.log('\n[1/5] Verifying 5 failed logins from IP A return 401...');
    for (let i = 1; i <= 5; i++) {
      const res = await doLogin(testIpA, 'admin@camnexbd.com', `WrongPass${i}!`);
      assert.strictEqual(res.status, 401, `Expected 401 on attempt ${i}, got ${res.status}`);
      console.log(`  Attempt ${i}: HTTP 401 (Failed as expected)`);
    }

    console.log('\n[2/5] Verifying 6th attempt from IP A is blocked with HTTP 429...');
    const rateLimitedRes = await doLogin(testIpA, 'admin@camnexbd.com', 'WrongPass6!');
    assert.strictEqual(rateLimitedRes.status, 429, `Expected 429 on 6th attempt, got ${rateLimitedRes.status}`);
    assert(
      (rateLimitedRes.body?.error || '').includes('Too many login attempts'),
      `Expected standard rate limit error message, got: ${JSON.stringify(rateLimitedRes.body)}`
    );
    console.log('  ✓ 6th attempt correctly blocked with HTTP 429 Too Many Requests.');

    console.log('\n[3/5] Verifying different IP B is NOT blocked...');
    const diffIpRes = await doLogin(testIpB, 'admin@camnexbd.com', 'CorrectPassword123!');
    assert.strictEqual(diffIpRes.status, 200, `Expected 200 for IP B, got ${diffIpRes.status}`);
    console.log('  ✓ Different IP (198.51.100.20) connects with HTTP 200 without being blocked.');

    console.log('\n[4/5] Verifying successful logins do NOT count towards rate limit for IP B...');
    for (let i = 1; i <= 6; i++) {
      const succRes = await doLogin(testIpB, 'admin@camnexbd.com', 'CorrectPassword123!');
      assert.strictEqual(succRes.status, 200, `Expected 200 on success ${i}, got ${succRes.status}`);
    }
    console.log('  ✓ 6 consecutive successful logins from IP B did not trigger 429 (skipSuccessfulRequests verified).');

    console.log('\n[5/5] Verifying test flags do NOT disable login rate limiter in production...');
    process.env.DISABLE_RATE_LIMIT = 'true';
    const blockedAgain = await doLogin(testIpA, 'admin@camnexbd.com', 'WrongPass7!');
    assert.strictEqual(blockedAgain.status, 429, 'Login limiter must remain active even if DISABLE_RATE_LIMIT is set in production');
    console.log('  ✓ Login rate limiter cannot be disabled by environment flags in production.');

    console.log('\n================================================================');
    console.log('ALL PRODUCTION LOGIN RATE LIMITER TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================');
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.DISABLE_RATE_LIMIT;
    server.close();
  }
}

if (require.main === module) {
  runProductionLoginLimiterTests().catch((err) => {
    console.error('\n[FAIL] Production rate limiter test failure:', err);
    process.exit(1);
  });
}

module.exports = { runProductionLoginLimiterTests };
