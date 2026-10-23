const path = require('path');
const fs = require('fs');

/**
 * Parses a key-value file line-by-line supporting:
 * - KEY=VALUE
 * - export KEY=VALUE
 * - Quotes: KEY="VALUE", KEY='VALUE'
 * - Inline comments: KEY=VALUE # comment
 * - Empty lines and comment lines starting with #
 */
function parseEnvLines(content) {
  const result = {};
  if (!content || typeof content !== 'string') return result;
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let val = match[2].trim();
      // Remove enclosing quotes
      if (val.startsWith('"')) {
        const endQuote = val.indexOf('"', 1);
        val = endQuote !== -1 ? val.slice(1, endQuote) : val.slice(1);
      } else if (val.startsWith("'")) {
        const endQuote = val.indexOf("'", 1);
        val = endQuote !== -1 ? val.slice(1, endQuote) : val.slice(1);
      } else {
        // Strip unquoted inline comment
        const commentIdx = val.indexOf('#');
        if (commentIdx !== -1) {
          val = val.slice(0, commentIdx).trim();
        }
      }
      result[key] = val.trim();
    }
  }
  return result;
}

/**
 * Returns candidate file paths where environment variables may reside on production/cPanel.
 */
function getCandidateEnvPaths() {
  const homeDir = process.env.HOME || '/home/camnexbd';
  const cwd = process.cwd();
  const rootDir = path.resolve(__dirname, '../../');

  return [
    path.join(rootDir, '.env'),
    path.join(cwd, '.env'),
    '/home/camnexbd/camnex/.env',
    path.join(homeDir, '.env'),
    '/home/camnexbd/.env',
    path.join(rootDir, 'server/.env'),
    path.join(rootDir, 'server/auth/.env'),
    '/home/camnexbd/nodevenv/camnex/22/bin/activate',
    path.join(homeDir, '.bashrc'),
    '/home/camnexbd/.bashrc',
    path.join(homeDir, '.bash_profile'),
    path.join(homeDir, '.profile')
  ];
}

/**
 * Normalizes SMS provider identifiers to canonical lowercase names.
 */
function normalizeSmsProvider(rawProvider) {
  if (!rawProvider || typeof rawProvider !== 'string') return null;
  const cleaned = rawProvider
    .trim()
    .toLowerCase()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/[\-_]/g, '')
    .trim();

  if (!cleaned) return null;
  if (['disabled', 'none', 'off', 'false', '0'].includes(cleaned)) {
    return 'disabled';
  }
  if (['bulksmsbd', 'bulksms', 'bulksmsbdnet', 'bulksmsbd.net'].includes(cleaned)) {
    return 'bulksmsbd';
  }
  if (['greenweb', 'greenwebbd'].includes(cleaned)) {
    return 'greenweb';
  }
  if (cleaned === 'mimsms') {
    return 'mimsms';
  }
  if (cleaned === 'twilio') {
    return 'twilio';
  }
  return cleaned;
}

/**
 * Reads a single key from process.env or disk candidate files.
 */
function readEnvValue(keyName, fallbackKeys = []) {
  const allKeys = [keyName, ...fallbackKeys];
  for (const k of allKeys) {
    const val = (process.env[k] || '').trim();
    if (val && val !== 'disabled' && val !== 'your_sms_gateway_api_key_or_token') {
      return val;
    }
  }

  const candidatePaths = getCandidateEnvPaths();
  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = parseEnvLines(fs.readFileSync(filePath, 'utf8'));
        for (const k of allKeys) {
          const val = (parsed[k] || '').trim();
          if (val && val !== 'disabled' && val !== 'your_sms_gateway_api_key_or_token') {
            return val;
          }
        }
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Resolves SMS Gateway configuration safely.
 * Never leaks the API key to callers expecting public status.
 */
function getSmsGatewayConfig() {
  const providerKeys = ['SMS_GATEWAY_PROVIDER', 'SMS_PROVIDER', 'SMS_GATEWAY'];
  const apiKeyKeys = ['SMS_API_KEY', 'BULKSMSBD_API_KEY', 'SMS_KEY', 'SMS_GATEWAY_KEY'];
  const senderIdKeys = ['SMS_SENDER_ID', 'BULKSMSBD_SENDER_ID', 'SMS_SENDER'];

  let resolvedProvider = null;
  let resolvedApiKey = null;
  let resolvedSenderId = null;

  // 1. Check process.env for non-placeholder, non-disabled values
  for (const k of providerKeys) {
    const val = (process.env[k] || '').trim();
    if (val && !['disabled', 'none', 'off', 'false'].includes(val.toLowerCase())) {
      resolvedProvider = val;
      break;
    }
  }

  for (const k of apiKeyKeys) {
    const val = (process.env[k] || '').trim();
    if (val && val !== 'your_sms_gateway_api_key_or_token' && val.length > 5) {
      resolvedApiKey = val;
      break;
    }
  }

  for (const k of senderIdKeys) {
    const val = (process.env[k] || '').trim();
    if (val) {
      resolvedSenderId = val;
      break;
    }
  }

  // 2. If provider or apiKey not resolved from active process.env, inspect candidate files on disk
  if (!resolvedProvider || !resolvedApiKey) {
    const candidatePaths = getCandidateEnvPaths();
    for (const filePath of candidatePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const parsed = parseEnvLines(fs.readFileSync(filePath, 'utf8'));

          if (!resolvedProvider) {
            for (const k of providerKeys) {
              const val = (parsed[k] || '').trim();
              if (val && !['disabled', 'none', 'off', 'false'].includes(val.toLowerCase())) {
                resolvedProvider = val;
                process.env.SMS_GATEWAY_PROVIDER = val;
                break;
              }
            }
          }

          if (!resolvedApiKey) {
            for (const k of apiKeyKeys) {
              const val = (parsed[k] || '').trim();
              if (val && val !== 'your_sms_gateway_api_key_or_token' && val.length > 5) {
                resolvedApiKey = val;
                process.env.SMS_API_KEY = val;
                break;
              }
            }
          }

          if (!resolvedSenderId) {
            for (const k of senderIdKeys) {
              const val = (parsed[k] || '').trim();
              if (val) {
                resolvedSenderId = val;
                process.env.SMS_SENDER_ID = val;
                break;
              }
            }
          }

          if (resolvedProvider && resolvedApiKey) break;
        }
      } catch (_) {}
    }
  }

  // 3. Fallback check: if provider was explicitly set to 'disabled' and no valid provider was found on disk
  if (!resolvedProvider) {
    for (const k of providerKeys) {
      const val = (process.env[k] || '').trim().toLowerCase();
      if (val === 'disabled') {
        resolvedProvider = 'disabled';
        break;
      }
    }
  }

  const normalizedProvider = normalizeSmsProvider(resolvedProvider);
  const isProviderActive = normalizedProvider && normalizedProvider !== 'disabled';
  const isKeyActive = Boolean(resolvedApiKey && resolvedApiKey !== 'your_sms_gateway_api_key_or_token' && resolvedApiKey.length > 5);
  const configured = Boolean(isProviderActive && isKeyActive);

  // Sync back into process.env so dependent modules access synchronized state
  if (configured) {
    process.env.SMS_GATEWAY_PROVIDER = normalizedProvider;
    if (resolvedApiKey) process.env.SMS_API_KEY = resolvedApiKey;
    if (resolvedSenderId) process.env.SMS_SENDER_ID = resolvedSenderId;
  }

  return {
    provider: configured ? normalizedProvider : null,
    rawProvider: resolvedProvider || null,
    apiKey: resolvedApiKey || null,
    senderId: resolvedSenderId || '8809648909250',
    configured
  };
}

/**
 * Loads and sanitizes runtime environment variables at server boot.
 */
function loadAndSanitizeEnvironment() {
  const candidatePaths = getCandidateEnvPaths();
  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = parseEnvLines(fs.readFileSync(filePath, 'utf8'));
        for (const [key, val] of Object.entries(parsed)) {
          // Do not overwrite existing non-empty env vars unless it's a known placeholder/disabled
          const curVal = process.env[key];
          const isPlaceholder = curVal === 'disabled' || curVal === 'your_sms_gateway_api_key_or_token';
          if (curVal === undefined || curVal === '' || isPlaceholder) {
            process.env[key] = val;
          }
        }
      }
    } catch (_) {}
  }

  // Sanitize SMS configuration
  const smsCfg = getSmsGatewayConfig();
  if (smsCfg.configured) {
    process.env.SMS_GATEWAY_PROVIDER = smsCfg.provider;
    process.env.SMS_API_KEY = smsCfg.apiKey;
    process.env.SMS_SENDER_ID = smsCfg.senderId;
  }

  // Sanitize Cloudflare Turnstile environment variables if inverted or misassigned
  const rawSiteKey = (process.env.TURNSTILE_SITE_KEY || process.env.CLOUDFLARE_TURNSTILE_SITE_KEY || '').trim();
  const rawSecretKey = (process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '').trim();
  if (rawSiteKey && rawSiteKey.length >= 30 && rawSecretKey && rawSecretKey.length < 30) {
    process.env.TURNSTILE_SITE_KEY = rawSecretKey;
    process.env.TURNSTILE_SECRET_KEY = rawSiteKey;
  } else if (rawSiteKey && rawSiteKey.length >= 30) {
    process.env.TURNSTILE_SECRET_KEY = rawSiteKey;
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT';
  }
}

module.exports = {
  parseEnvLines,
  getCandidateEnvPaths,
  normalizeSmsProvider,
  readEnvValue,
  getSmsGatewayConfig,
  loadAndSanitizeEnvironment
};
