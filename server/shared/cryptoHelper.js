const crypto = require('crypto');

const RAW_KEY = process.env.ENCRYPTION_KEY || 'camnex-bd-secure-settings-key-2026';
const KEY = crypto.scryptSync(RAW_KEY, 'camnex-salt-v1', 32);

/**
 * Encrypt sensitive string data (e.g. courier API secret or private webhook token)
 * Returns hex formatted string with IV and auth tag: enc:iv:tag:cipher
 */
function encrypt(plainText) {
  if (!plainText || typeof plainText !== 'string') return plainText;
  if (plainText.startsWith('enc:') || plainText.startsWith('••••')) return plainText; // already encrypted or masked
  
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[CryptoHelper] Encryption failed:', err.message);
    return plainText;
  }
}

/**
 * Decrypt string previously encrypted with encrypt()
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('enc:')) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[CryptoHelper] Decryption failed:', err.message);
    return '';
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

module.exports = {
  encrypt,
  decrypt,
  maskSecret
};

