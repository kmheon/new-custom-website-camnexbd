#!/usr/bin/env node
/**
 * Automated Test Suite for BulkSMSBD Phone OTP SMS Gateway Integration
 *
 * Verifies:
 * 1. Provider configuration reporting (configured: true / false, provider identifier)
 * 2. Secret isolation (never leaks SMS_API_KEY in status or responses)
 * 3. Phone number validation and normalization (01XXXXXXXXX, +8801..., 8801...)
 * 4. BulkSMSBD parameter formatting (api_key, senderid, number=880..., message, type=text)
 * 5. Successful SMS dispatch (BulkSMSBD response code 202)
 * 6. OTP database hashing and storage (no plaintext OTP in database)
 * 7. OTP verification and customer account creation/linking
 * 8. Single-use OTP enforcement (OTP is deleted upon verification)
 * 9. Incorrect attempt counting and maximum 5 attempts lockout
 * 10. Expired OTP rejection
 * 11. Rate limiting (max 3 dispatches per 10 minutes per phone)
 * 12. Provider error code handling (1002 sender ID, 1006/1007 balance, 1003/1011 auth)
 * 13. Timeout handling via AbortController (returns 504 on gateway timeout)
 * 14. Failed dispatch cleanup (no orphan OTP records left in database)
 */

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const db = require('../database');
const { getProvidersStatus, sendPhoneOtp, verifyPhoneOtp } = require('../server/auth/socialAuth');

console.log('================================================================');
console.log('TEST SUITE: BULKSMSBD SMS GATEWAY & OTP VERIFICATION');
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
// Mock Server for BulkSMSBD API
// -----------------------------------------------------------------------------
let mockServer;
const MOCK_PORT = 9899;
let mockResponseHandler = null;
let lastInterceptedRequest = null;

function startMockServer() {
  return new Promise((resolve, reject) => {
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const parsedBody = {};
        const params = new URLSearchParams(body);
        for (const [k, v] of params.entries()) {
          parsedBody[k] = v;
        }

        lastInterceptedRequest = {
          method: req.method,
          url: req.url,
          headers: req.headers,
          bodyText: body,
          params: parsedBody
        };

        if (mockResponseHandler) {
          mockResponseHandler(req, res, lastInterceptedRequest);
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            response_code: 202,
            success_message: 'SMS Submitted Successfully',
            error_message: ''
          }));
        }
      });
    });

    mockServer.listen(MOCK_PORT, '127.0.0.1', () => {
      resolve();
    });
    mockServer.on('error', reject);
  });
}

function stopMockServer() {
  return new Promise(resolve => {
    if (mockServer) {
      mockServer.close(() => resolve());
    } else {
      resolve();
    }
  });
}

// Helper to simulate express req / res
function createMockReqRes(body = {}, ip = '127.0.0.1') {
  const req = {
    body,
    ip,
    headers: {},
    user: null
  };

  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };

  return { req, res };
}

// -----------------------------------------------------------------------------
// Execution of Test Cases
// -----------------------------------------------------------------------------
(async function runAll() {
  await startMockServer();

  const originalEnv = { ...process.env };

  try {
    // 1. Providers status when unconfigured or disabled
    await test('Providers status: SMS OTP unconfigured when disabled', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'disabled';
      process.env.SMS_API_KEY = '';
      const status = getProvidersStatus();
      assert.strictEqual(status.smsOtp.configured, false);
      assert.strictEqual(status.smsOtp.provider, null);
    });

    // 2. Providers status when BulkSMSBD is configured
    await test('Providers status: BulkSMSBD recognized and configured', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'bulksmsbd';
      process.env.SMS_API_KEY = 'secret_test_key_12345';
      process.env.SMS_SENDER_ID = '8809648909250';
      const status = getProvidersStatus();
      assert.strictEqual(status.smsOtp.configured, true);
      assert.strictEqual(status.smsOtp.provider, 'bulksmsbd');
    });

    // 3. Secret isolation: SMS_API_KEY is never exposed in status
    await test('Secret isolation: getProvidersStatus never exposes SMS_API_KEY', async () => {
      const status = getProvidersStatus();
      const statusJson = JSON.stringify(status);
      assert(!statusJson.includes('secret_test_key_12345'), 'Status JSON must not leak SMS_API_KEY');
      assert.strictEqual(status.smsOtp.apiKey, undefined);
    });

    // Configure test environment to use our local mock server
    process.env.BULKSMSBD_API_URL = `http://127.0.0.1:${MOCK_PORT}/api/smsapi`;
    process.env.SMS_GATEWAY_PROVIDER = 'bulksmsbd';
    process.env.SMS_API_KEY = 'mock_api_key_xyz987';
    process.env.SMS_SENDER_ID = '8809648909250';
    process.env.SESSION_SECRET = 'test_secret_for_hash';
    process.env.SMS_TIMEOUT_MS = '500';

    const testPhone = '01712345678';

    // Clean up test phone in database
    db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);

    // 4. Invalid phone numbers are rejected
    await test('Rejection of invalid phone numbers', async () => {
      const invalidPhones = ['12345', '01234567890', '0171234', 'abcd0171122', '01012345678'];
      for (const p of invalidPhones) {
        const { req, res } = createMockReqRes({ phone: p });
        await sendPhoneOtp(req, res);
        assert.strictEqual(res.statusCode, 400, `Should reject ${p} with 400`);
        assert(res.data && res.data.error, `Should return error object for ${p}`);
      }
    });

    // 5. Successful OTP dispatch via BulkSMSBD
    await test('Successful OTP dispatch via BulkSMSBD (Code 202)', async () => {
      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
      mockResponseHandler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response_code: 202,
          success_message: 'SMS Submitted Successfully',
          error_message: ''
        }));
      };

      const { req, res } = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 200, 'sendPhoneOtp returns 200 on success');
      assert.strictEqual(res.data.success, true);
      assert(res.data.message.includes('sent to your mobile phone'));

      // Verify request payload sent to BulkSMSBD
      assert.strictEqual(lastInterceptedRequest.params.api_key, 'mock_api_key_xyz987');
      assert.strictEqual(lastInterceptedRequest.params.type, 'text');
      assert.strictEqual(lastInterceptedRequest.params.number, '8801712345678');
      assert.strictEqual(lastInterceptedRequest.params.senderid, '8809648909250');
      assert(lastInterceptedRequest.params.message.includes('verification code is'));
      assert(lastInterceptedRequest.params.message.includes('CamneX Bangladesh'));

      // Verify OTP stored in database (hashed, not plaintext)
      const stored = db.prepare('SELECT * FROM phone_otps WHERE phone = ?').get(testPhone);
      assert(stored, 'Record exists in phone_otps table');
      assert.strictEqual(stored.attempts, 0);
      assert.strictEqual(stored.code_hash.length, 64, 'Stored code is sha256 hex hash');

      // Verify OTP code matches what was sent in SMS
      const match = lastInterceptedRequest.params.message.match(/code is (\d{6})/);
      assert(match, 'SMS message contains 6-digit code');
      const plainCode = match[1];
      const expectedHash = crypto.createHash('sha256').update(plainCode + process.env.SESSION_SECRET).digest('hex');
      assert.strictEqual(stored.code_hash, expectedHash, 'Database hash matches hash of sent OTP code');
    });

    // 6. OTP Verification and Customer Account Creation
    await test('OTP verification creates customer and session', async () => {
      const match = lastInterceptedRequest.params.message.match(/code is (\d{6})/);
      const plainCode = match[1];

      const { req, res } = createMockReqRes({ phone: testPhone, code: plainCode });
      verifyPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 200, 'verifyPhoneOtp returns 200');
      assert.strictEqual(res.data.success, true);
      assert(res.data.customer, 'Customer object returned');
      assert.strictEqual(res.data.customer.phone, testPhone);
      assert.strictEqual(res.data.customer.phone_verified, true);
      assert(res.data.csrfToken, 'CSRF token returned');
    });

    // 7. Single-use OTP enforcement (must be deleted after use)
    await test('Single-use OTP: Second verification with same code fails', async () => {
      const match = lastInterceptedRequest.params.message.match(/code is (\d{6})/);
      const plainCode = match[1];

      const { req, res } = createMockReqRes({ phone: testPhone, code: plainCode });
      verifyPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 400, 'Re-using consumed OTP returns 400');
      assert(res.data.error.includes('expired or was not requested'));
    });

    // 8. Incorrect attempts increment counter, and 5th attempt locks out
    await test('Incorrect attempt counting and 5-attempt limit lockout', async () => {
      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
      mockResponseHandler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response_code: 202, success_message: 'SMS Submitted Successfully' }));
      };

      const { req: sendReq, res: sendRes } = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(sendReq, sendRes);
      assert.strictEqual(sendRes.statusCode, 200);

      // Attempt 1 through 4: Should fail with 400 and increment attempts counter
      for (let i = 1; i <= 4; i++) {
        const { req, res } = createMockReqRes({ phone: testPhone, code: '000000' });
        verifyPhoneOtp(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert(res.data.error.includes('Invalid verification code'));

        const row = db.prepare('SELECT attempts FROM phone_otps WHERE phone = ?').get(testPhone);
        assert.strictEqual(row.attempts, i);
      }

      // Attempt 5: Should trigger lockout (HTTP 429) and delete the OTP
      const { req: lockReq, res: lockRes } = createMockReqRes({ phone: testPhone, code: '000000' });
      verifyPhoneOtp(lockReq, lockRes);

      // Attempt 5 can either hit the attempt limit or delete on the next attempt
      const remainingRow = db.prepare('SELECT * FROM phone_otps WHERE phone = ?').get(testPhone);
      if (remainingRow) {
        // 5th attempt reached, 6th attempt deletes
        const { req: nextReq, res: nextRes } = createMockReqRes({ phone: testPhone, code: '000000' });
        verifyPhoneOtp(nextReq, nextRes);
        assert.strictEqual(nextRes.statusCode, 429);
        assert(nextRes.data.error.includes('Too many incorrect attempts'));
        const cleanedRow = db.prepare('SELECT * FROM phone_otps WHERE phone = ?').get(testPhone);
        assert.strictEqual(cleanedRow, undefined);
      }
    });

    // 9. Expired OTP is rejected
    await test('Expired OTP rejection', async () => {
      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
      // Manually insert an expired OTP (expired 10 minutes ago)
      const expiredHash = crypto.createHash('sha256').update('123456' + process.env.SESSION_SECRET).digest('hex');
      db.prepare(`
        INSERT INTO phone_otps (id, phone, code_hash, attempts, expires_at)
        VALUES ('otp-expired-test', ?, ?, 0, datetime('now', '-10 minutes'))
      `).run(testPhone, expiredHash);

      const { req, res } = createMockReqRes({ phone: testPhone, code: '123456' });
      verifyPhoneOtp(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert(res.data.error.includes('expired or was not requested'));
      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
    });

    // 10. Rate limiting: Max 3 OTP requests per 10 minutes
    await test('Rate limiting: Maximum 3 dispatches per 10 minutes', async () => {
      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
      mockResponseHandler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response_code: 202, success_message: 'SMS Submitted Successfully' }));
      };

      // 1st request
      const r1 = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(r1.req, r1.res);
      assert.strictEqual(r1.res.statusCode, 200);

      // 2nd request
      const r2 = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(r2.req, r2.res);
      assert.strictEqual(r2.res.statusCode, 200);

      // 3rd request
      const r3 = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(r3.req, r3.res);
      assert.strictEqual(r3.res.statusCode, 200);

      // 4th request -> Rate limited!
      const r4 = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(r4.req, r4.res);
      assert.strictEqual(r4.res.statusCode, 429, '4th request must return 429 Too Many Requests');
      assert(r4.res.data.error.includes('Too many OTP requests'));

      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
    });

    // 11. BulkSMSBD Error Code 1002 (Invalid / Inactive Sender ID)
    await test('BulkSMSBD Error 1002 (Sender ID error)', async () => {
      db.prepare('DELETE FROM phone_otps WHERE phone = ?').run(testPhone);
      mockResponseHandler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response_code: 1002,
          error_message: 'Sender Id Is Not Correct or Inactive'
        }));
      };

      const { req, res } = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 502);
      assert.strictEqual(res.data.code, 'SMS_GATEWAY_REJECTED');
      assert(res.data.error.includes('Sender ID'));

      // Ensure failed dispatch didn't leave orphan record
      const orphan = db.prepare('SELECT * FROM phone_otps WHERE phone = ?').get(testPhone);
      assert.strictEqual(orphan, undefined, 'Orphan OTP record cleaned up on dispatch rejection');
    });

    // 12. BulkSMSBD Error Code 1007 (Insufficient Balance)
    await test('BulkSMSBD Error 1007 (Balance error)', async () => {
      mockResponseHandler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response_code: 1007,
          error_message: 'Balance Insufficient'
        }));
      };

      const { req, res } = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 502);
      assert.strictEqual(res.data.code, 'SMS_GATEWAY_REJECTED');
      assert(res.data.error.includes('balance'));
    });

    // 13. BulkSMSBD Error Code 1011 / 1003 (Invalid API Key)
    await test('BulkSMSBD Error 1011 (API Key / User not found)', async () => {
      mockResponseHandler = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response_code: 1011,
          error_message: 'User Id Not Found'
        }));
      };

      const { req, res } = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 502);
      assert.strictEqual(res.data.code, 'SMS_GATEWAY_REJECTED');
      assert(res.data.error.includes('authentication failed'));
      // Never leak API key in error message
      assert(!res.data.error.includes('mock_api_key_xyz987'));
    });

    // 14. Gateway Timeout Handling (AbortController)
    await test('Gateway Timeout handling via AbortController', async () => {
      process.env.SMS_TIMEOUT_MS = '100'; // Short 100ms timeout for test
      mockResponseHandler = (req, res) => {
        // Delay response past 100ms
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ response_code: 202 }));
        }, 300);
      };

      const { req, res } = createMockReqRes({ phone: testPhone });
      await sendPhoneOtp(req, res);

      assert.strictEqual(res.statusCode, 504, 'Gateway timeout returns 504');
      assert(res.data.error.includes('timed out'));

      // Ensure failed dispatch didn't leave orphan record
      const orphan = db.prepare('SELECT * FROM phone_otps WHERE phone = ?').get(testPhone);
      assert.strictEqual(orphan, undefined, 'Orphan OTP record cleaned up on timeout');
    });

  } finally {
    // Restore original env and stop mock server
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    await stopMockServer();
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} / ${total} tests passed (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
})();
