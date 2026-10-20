const crypto = require('crypto');

const SALT = 'camnex-salt-v1';
const LEGACY_DEV_FALLBACK_KEY = 'camnex-bd-secure-settings-key-2026';

let cachedRawKey = null;
let cachedDerivedKey = null;

/**
 * Resolves and validates the active master encryption key.
 * In production (NODE_ENV === 'production'):
 *   - ENCRYPTION_KEY must be explicitly set and non-empty.
 *   - Fails safely with a descriptive error if missing or blank.
 * In non-production (development / test):
 *   - Uses ENCRYPTION_KEY if set.
 *   - Emits a one-time clear warning and falls back to LEGACY_DEV_FALLBACK_KEY for local developer convenience.
 */
function getDerivedKey() {
  const envRaw = process.env.ENCRYPTION_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  const trimmed = typeof envRaw === 'string' ? envRaw.trim() : '';

  if (isProduction) {
    if (!trimmed) {
      const err = new Error('[CryptoHelper] FATAL: ENCRYPTION_KEY is required and must not be empty in production mode (NODE_ENV=production). Insecure fallback keys are disabled.');
      err.code = 'ERR_MISSING_ENCRYPTION_KEY';
      throw err;
    }
    if (trimmed === LEGACY_DEV_FALLBACK_KEY) {
      const err = new Error('[CryptoHelper] FATAL: Production cannot run using the insecure legacy development fallback key. Please configure a unique, high-entropy ENCRYPTION_KEY in your environment.');
      err.code = 'ERR_INSECURE_ENCRYPTION_KEY';
      throw err;
    }
  }

  const activeRawKey = trimmed || LEGACY_DEV_FALLBACK_KEY;

  if (!trimmed && !isProduction && !getDerivedKey._warned) {
    console.warn('[CryptoHelper] WARNING: No ENCRYPTION_KEY configured. Running with legacy development fallback key. In production, ENCRYPTION_KEY is strictly required.');
    getDerivedKey._warned = true;
  }

  if (cachedRawKey !== activeRawKey || !cachedDerivedKey) {
    cachedRawKey = activeRawKey;
    cachedDerivedKey = crypto.scryptSync(activeRawKey, SALT, 32);
  }

  return cachedDerivedKey;
}

/**
 * Encrypt sensitive string data (e.g. courier API secret or private webhook token)
 * Returns hex formatted string with IV and auth tag: enc:iv:tag:cipher
 */
function encrypt(plainText, overrideKey = null) {
  if (!plainText || typeof plainText !== 'string') return plainText;
  if (plainText.startsWith('enc:') || plainText.startsWith('••••')) return plainText; // already encrypted or masked
  
  const key = overrideKey || getDerivedKey();
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[CryptoHelper] Encryption failed:', err.message);
    throw err;
  }
}

/**
 * Decrypt string previously encrypted with encrypt()
 * Supports passing an override derived key for safe key-rotation / migration scripts.
 */
function decrypt(cipherText, overrideKey = null) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('enc:')) {
    return cipherText;
  }

  const parts = cipherText.split(':');
  if (parts.length !== 4) return cipherText;

  const key = overrideKey || getDerivedKey();
  try {
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return null to distinguish authentication tag / corrupted key failure from empty string
    return null;
  }
}

/**
 * Mask secret string for safe display to client (e.g. ••••••••)
 */
function maskSecret(str) {
  if (!str) return '';
  if (str.startsWith('••••')) return str;
  return '••••••••';
}

/**
 * Validates that an explicit, secure encryption key is configured for production.
 * Must be invoked early during application boot before opening network listeners.
 */
function assertProductionKeyConfigured() {
  if (process.env.NODE_ENV === 'production') {
    getDerivedKey();
  }
}

module.exports = {
  encrypt,
  decrypt,
  maskSecret,
  getDerivedKey,
  assertProductionKeyConfigured,
  LEGACY_DEV_FALLBACK_KEY
};

