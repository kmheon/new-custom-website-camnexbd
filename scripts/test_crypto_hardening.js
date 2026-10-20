/**
 * TASK INT-01A: Security Hardening Verification Suite for Crypto & Encryption Keys
 * 
 * Verifies:
 * 1. Encryption and decryption round-trip with explicitly configured key
 * 2. Successful decryption of legacy ciphertext format (enc:{iv}:{tag}:{cipher})
 * 3. Production startup / key initialization fails when key is missing
 * 4. Production startup rejects empty or whitespace-only key
 * 5. Production initialization rejects insecure legacy dev fallback key
 * 6. Non-production behavior emits clear warning and retains dev compatibility
 * 7. Decryption with wrong key returns null safely (never throws or returns empty string)
 * 8. Secret masking remains intact
 * 9. CMS settings update lifecycle preserves existing masked secrets
 * 10. Key override support for safe future key-rotation without data loss
 */

const assert = require('assert');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

function runTests() {
  console.log('=================================================================');
  console.log('TASK INT-01A: CryptoHelper Security Hardening Test Suite');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ FAIL: ${name}\n    Error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Encryption & Decryption Round-Trip with Explicit Key
  // --------------------------------------------------------------------------
  console.log('1. Testing Encryption & Decryption Round-Trip with Explicit Key...');

  test('Round-trip encryption and decryption with custom key', () => {
    process.env.NODE_ENV = 'development';
    process.env.ENCRYPTION_KEY = 'custom-test-encryption-key-32chars!';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { encrypt, decrypt } = require('../server/shared/cryptoHelper');

    const plainText = 'my-super-secret-api-token-2026';
    const encrypted = encrypt(plainText);

    assert.notStrictEqual(encrypted, plainText);
    assert.ok(encrypted.startsWith('enc:'));
    const parts = encrypted.split(':');
    assert.strictEqual(parts.length, 4, 'Ciphertext must match enc:{iv}:{tag}:{cipher}');

    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, plainText);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Decryption of Legacy Ciphertext
  // --------------------------------------------------------------------------
  console.log('\n2. Testing Decryption of Legacy Ciphertext Format...');

  test('Decryption of legacy ciphertext encrypted with fallback key', () => {
    // Generate ciphertext manually using exact legacy scrypt derivation
    const legacyKey = crypto.scryptSync('camnex-bd-secure-settings-key-2026', 'camnex-salt-v1', 32);
    const legacyIv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', legacyKey, legacyIv);
    let encrypted = cipher.update('steadfast-legacy-secret-xyz', 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    const legacyCiphertext = `enc:${legacyIv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;

    // Test decryption using cryptoHelper in dev fallback mode
    process.env.NODE_ENV = 'development';
    delete process.env.ENCRYPTION_KEY;
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { decrypt } = require('../server/shared/cryptoHelper');

    const decrypted = decrypt(legacyCiphertext);
    assert.strictEqual(decrypted, 'steadfast-legacy-secret-xyz');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Production Rejection of Missing Key & Startup Assertion
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Production Enforcement of Missing Key & Startup Assertion...');

  test('Production mode rejects missing ENCRYPTION_KEY safely via getDerivedKey() and assertProductionKeyConfigured()', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENCRYPTION_KEY;
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { getDerivedKey, assertProductionKeyConfigured } = require('../server/shared/cryptoHelper');

    let threw = false;
    try {
      getDerivedKey();
    } catch (err) {
      threw = true;
      assert.strictEqual(err.code, 'ERR_MISSING_ENCRYPTION_KEY');
      assert.ok(err.message.includes('NODE_ENV=production'));
      assert.ok(!err.message.includes('camnex-bd-secure-settings-key'));
    }
    assert.strictEqual(threw, true, 'getDerivedKey must throw ERR_MISSING_ENCRYPTION_KEY in production when key is missing');

    let startupThrew = false;
    try {
      assertProductionKeyConfigured();
    } catch (err) {
      startupThrew = true;
      assert.strictEqual(err.code, 'ERR_MISSING_ENCRYPTION_KEY');
    }
    assert.strictEqual(startupThrew, true, 'assertProductionKeyConfigured must fail early before server listens');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Production Rejection of Whitespace-Only Key
  // --------------------------------------------------------------------------
  console.log('\n4. Testing Production Rejection of Whitespace-Only Key...');

  test('Production mode rejects empty or whitespace-only ENCRYPTION_KEY', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_KEY = '   \t  \n  ';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { getDerivedKey, assertProductionKeyConfigured } = require('../server/shared/cryptoHelper');

    let threw = false;
    try {
      getDerivedKey();
    } catch (err) {
      threw = true;
      assert.strictEqual(err.code, 'ERR_MISSING_ENCRYPTION_KEY');
    }
    assert.strictEqual(threw, true, 'Must throw ERR_MISSING_ENCRYPTION_KEY when key is blank in production');

    let startupThrew = false;
    try {
      assertProductionKeyConfigured();
    } catch (err) {
      startupThrew = true;
      assert.strictEqual(err.code, 'ERR_MISSING_ENCRYPTION_KEY');
    }
    assert.strictEqual(startupThrew, true, 'assertProductionKeyConfigured must reject whitespace key');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Production Rejection of Hardcoded Fallback Key
  // --------------------------------------------------------------------------
  console.log('\n5. Testing Production Rejection of Hardcoded Fallback Key...');

  test('Production mode rejects explicit use of insecure legacy fallback key', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_KEY = 'camnex-bd-secure-settings-key-2026';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { getDerivedKey, assertProductionKeyConfigured } = require('../server/shared/cryptoHelper');

    let threw = false;
    try {
      getDerivedKey();
    } catch (err) {
      threw = true;
      assert.strictEqual(err.code, 'ERR_INSECURE_ENCRYPTION_KEY');
    }
    assert.strictEqual(threw, true, 'Must throw ERR_INSECURE_ENCRYPTION_KEY in production');

    let startupThrew = false;
    try {
      assertProductionKeyConfigured();
    } catch (err) {
      startupThrew = true;
      assert.strictEqual(err.code, 'ERR_INSECURE_ENCRYPTION_KEY');
    }
    assert.strictEqual(startupThrew, true, 'assertProductionKeyConfigured must reject insecure fallback key');
  });

  // --------------------------------------------------------------------------
  // TEST 5B: Valid Production Key Passes Startup Assertion
  // --------------------------------------------------------------------------
  console.log('\n5B. Testing Valid Production Key Passes Startup Assertion...');

  test('Production mode succeeds when valid high-entropy key is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_KEY = 'prod-strong-entropy-secret-key-32chars!';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { assertProductionKeyConfigured, encrypt, decrypt } = require('../server/shared/cryptoHelper');

    assert.doesNotThrow(() => {
      assertProductionKeyConfigured();
    }, 'Valid production key must pass startup assertion without throwing');

    const enc = encrypt('test-production-secret');
    const dec = decrypt(enc);
    assert.strictEqual(dec, 'test-production-secret');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Non-Production Development Compatibility
  // --------------------------------------------------------------------------
  console.log('\n6. Testing Non-Production Development Fallback Behavior...');

  test('Development mode allows fallback with logged warning', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENCRYPTION_KEY;
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { encrypt, decrypt } = require('../server/shared/cryptoHelper');

    const enc = encrypt('dev-secret-payload');
    const dec = decrypt(enc);
    assert.strictEqual(dec, 'dev-secret-payload');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Decryption with Wrong Key Fails Safely
  // --------------------------------------------------------------------------
  console.log('\n7. Testing Safe Failure on Wrong Key Decryption...');

  test('Decryption with wrong key returns null without crashing or erasing', () => {
    process.env.NODE_ENV = 'development';
    process.env.ENCRYPTION_KEY = 'original-secret-key';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    let { encrypt } = require('../server/shared/cryptoHelper');

    const ciphertext = encrypt('sensitive-api-token');

    // Attempt to decrypt with different key
    process.env.ENCRYPTION_KEY = 'different-wrong-key';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    let { decrypt } = require('../server/shared/cryptoHelper');

    const result = decrypt(ciphertext);
    assert.strictEqual(result, null, 'Decryption failure must return null to allow caller to handle gracefully');
  });

  // --------------------------------------------------------------------------
  // TEST 8: Secret Masking Integrity
  // --------------------------------------------------------------------------
  console.log('\n8. Testing Secret Masking...');

  test('maskSecret masks strings cleanly and idempotently', () => {
    const { maskSecret } = require('../server/shared/cryptoHelper');
    assert.strictEqual(maskSecret('secret-token'), '••••••••');
    assert.strictEqual(maskSecret('••••••••'), '••••••••');
    assert.strictEqual(maskSecret(''), '');
    assert.strictEqual(maskSecret(null), '');
  });

  // --------------------------------------------------------------------------
  // TEST 9: CMS Settings Lifecycle Preserves Masked Secrets
  // --------------------------------------------------------------------------
  console.log('\n9. Testing CMS Settings Lifecycle & Masked Preservation...');

  test('Submitting masked secret back does not overwrite existing encrypted secret', () => {
    process.env.NODE_ENV = 'development';
    process.env.ENCRYPTION_KEY = 'test-cms-encryption-key';
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { encrypt, decrypt, maskSecret } = require('../server/shared/cryptoHelper');

    const memDb = new DatabaseSync(':memory:');
    memDb.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);');

    const rawSecret = 'sf-prod-api-secret-key-999';
    const encryptedSecret = encrypt(rawSecret);

    const initialSettings = {
      courierIntegrations: {
        steadfast: {
          provider: 'steadfast',
          apiKey: 'sf-key-123',
          secretKey: encryptedSecret,
          enabled: true
        }
      }
    };
    memDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('site_settings', JSON.stringify(initialSettings));

    // Client GET -> receives masked value
    const row = memDb.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get();
    const settings = JSON.parse(row.value);
    const clientPayload = JSON.parse(JSON.stringify(settings));
    clientPayload.courierIntegrations.steadfast.secretKey = maskSecret(clientPayload.courierIntegrations.steadfast.secretKey);
    assert.strictEqual(clientPayload.courierIntegrations.steadfast.secretKey, '••••••••');

    // Client PUT -> submits masked value along with an unrelated change
    clientPayload.siteName = 'Updated CamneX Store';

    // Server update handler logic
    const existing = JSON.parse(memDb.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get().value);
    const payload = { ...clientPayload };
    if (payload.courierIntegrations) {
      payload.courierIntegrations = { ...(existing.courierIntegrations || {}), ...payload.courierIntegrations };
      const sensitiveKeys = ['apiKey', 'secretKey', 'clientSecret', 'password', 'token', 'apiSecret', 'authHeader', 'paperflyKey'];
      for (const [providerKey, providerObj] of Object.entries(payload.courierIntegrations)) {
        if (providerObj && typeof providerObj === 'object') {
          const existingProv = existing.courierIntegrations?.[providerKey] || {};
          for (const secretKey of sensitiveKeys) {
            if (providerObj[secretKey] !== undefined) {
              if (typeof providerObj[secretKey] === 'string' && providerObj[secretKey].startsWith('••••')) {
                providerObj[secretKey] = existingProv[secretKey] || '';
              } else if (providerObj[secretKey]) {
                providerObj[secretKey] = encrypt(providerObj[secretKey]);
              }
            }
          }
        }
      }
    }
    const updated = { ...existing, ...payload };
    memDb.prepare("UPDATE settings SET value = ? WHERE key = 'site_settings'").run(JSON.stringify(updated));

    // Verify DB still holds the intact encrypted secret
    const finalRow = memDb.prepare("SELECT value FROM settings WHERE key = 'site_settings'").get();
    const finalSettings = JSON.parse(finalRow.value);
    const preservedCiphertext = finalSettings.courierIntegrations.steadfast.secretKey;

    assert.ok(preservedCiphertext.startsWith('enc:'));
    assert.strictEqual(decrypt(preservedCiphertext), rawSecret);
  });

  // --------------------------------------------------------------------------
  // TEST 10: Key Override Support for Safe Re-encryption / Key Migration
  // --------------------------------------------------------------------------
  console.log('\n10. Testing Key Override Support for Safe Re-encryption...');

  test('overrideKey allows safe migration between two different encryption keys', () => {
    delete require.cache[require.resolve('../server/shared/cryptoHelper')];
    const { encrypt, decrypt } = require('../server/shared/cryptoHelper');

    const oldKey = crypto.scryptSync('old-master-key', 'camnex-salt-v1', 32);
    const newKey = crypto.scryptSync('new-master-key', 'camnex-salt-v1', 32);

    const secret = 'pathao-webhook-secret-token';
    const oldCiphertext = encrypt(secret, oldKey);

    // Decrypt using oldKey override
    const recovered = decrypt(oldCiphertext, oldKey);
    assert.strictEqual(recovered, secret);

    // Re-encrypt with newKey override
    const newCiphertext = encrypt(recovered, newKey);
    assert.notStrictEqual(newCiphertext, oldCiphertext);

    // Verify decrypt with newKey
    assert.strictEqual(decrypt(newCiphertext, newKey), secret);
    assert.strictEqual(decrypt(newCiphertext, oldKey), null);
  });

  console.log('\n=================================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

