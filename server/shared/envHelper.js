const path = require('path');
const fs = require('fs');

/**
 * Strips surrounding single or double quotes and trims whitespace.
 */
function cleanValue(val) {
  if (!val || typeof val !== 'string') return '';
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

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
      result[key] = cleanValue(val);
    }
  }
  return result;
}

/**
 * Returns candidate .env file paths where application configuration resides.
 */
function getCandidateEnvPaths() {
  const homeDir = process.env.HOME || '/home/camnexbd';
  const cwd = process.cwd();
  const rootDir = path.resolve(__dirname, '../../');

  return [
    path.join(rootDir, '.env'),
    '/home/camnexbd/camnex/.env',
    path.join(cwd, '.env'),
    path.join(homeDir, '.env'),
    '/home/camnexbd/.env'
  ];
}

/**
 * Normalizes SMS provider identifiers to canonical lowercase names.
 */
function normalizeSmsProvider(rawProvider) {
  if (!rawProvider || typeof rawProvider !== 'string') return null;
  const cleaned = cleanValue(rawProvider)
    .toLowerCase()
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

const KNOWN_PLACEHOLDER_KEYS = [
  'your_sms_gateway_api_key_or_token',
  'change_this_to_your_api_key',
  'your_api_key',
  'placeholder'
];

/**
 * Checks whether an API key is a valid non-placeholder value.
 */
function isValidApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const cleaned = cleanValue(key);
  if (cleaned.length < 3) return false;
  if (KNOWN_PLACEHOLDER_KEYS.includes(cleaned.toLowerCase())) return false;
  return true;
}

/**
 * Resolves SMS Gateway configuration and generates safe diagnostic info.
 * NEVER leaks or logs the API key.
 */
function getSmsGatewayConfig() {
  const providerKeys = ['SMS_GATEWAY_PROVIDER', 'SMS_PROVIDER', 'SMS_GATEWAY'];
  const apiKeyKeys = ['SMS_API_KEY', 'BULKSMSBD_API_KEY', 'SMS_KEY', 'SMS_GATEWAY_KEY'];
  const senderIdKeys = ['SMS_SENDER_ID', 'BULKSMSBD_SENDER_ID', 'SMS_SENDER'];

  const diagnostic = {
    processEnv: {
      hasProvider: false,
      providerKey: null,
      rawProvider: null,
      hasApiKey: false,
      apiKeyKey: null,
      apiKeyLength: 0,
      hasSenderId: false,
      senderId: null
    },
    dotEnv: {
      checkedPath: null,
      exists: false,
      allKeysFound: [],
      hasProvider: false,
      providerKey: null,
      rawProvider: null,
      hasApiKey: false,
      apiKeyKey: null,
      apiKeyLength: 0,
      hasSenderId: false,
      senderId: null
    },
    selectedSource: 'none',
    normalizedProvider: null,
    reason: ''
  };

  // 1. Inspect process.env
  let procProvider = null;
  let procApiKey = null;
  let procSenderId = null;

  for (const k of providerKeys) {
    const val = cleanValue(process.env[k]);
    if (val) {
      diagnostic.processEnv.hasProvider = true;
      diagnostic.processEnv.providerKey = k;
      diagnostic.processEnv.rawProvider = val;
      if (!['disabled', 'none', 'off', 'false'].includes(val.toLowerCase())) {
        procProvider = val;
      }
      break;
    }
  }

  for (const k of apiKeyKeys) {
    const val = cleanValue(process.env[k]);
    if (val) {
      diagnostic.processEnv.hasApiKey = true;
      diagnostic.processEnv.apiKeyKey = k;
      diagnostic.processEnv.apiKeyLength = val.length;
      if (isValidApiKey(val)) {
        procApiKey = val;
      }
      break;
    }
  }

  for (const k of senderIdKeys) {
    const val = cleanValue(process.env[k]);
    if (val) {
      diagnostic.processEnv.hasSenderId = true;
      diagnostic.processEnv.senderId = val;
      procSenderId = val;
      break;
    }
  }

  // 2. Inspect candidate .env files on disk
  let fileProvider = null;
  let fileApiKey = null;
  let fileSenderId = null;
  let foundFilePath = null;

  const candidatePaths = getCandidateEnvPaths();
  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        foundFilePath = filePath;
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = parseEnvLines(fileContent);
        diagnostic.dotEnv.checkedPath = filePath;
        diagnostic.dotEnv.exists = true;
        diagnostic.dotEnv.allKeysFound = Object.keys(parsed);

        for (const k of providerKeys) {
          const val = cleanValue(parsed[k]);
          if (val) {
            diagnostic.dotEnv.hasProvider = true;
            diagnostic.dotEnv.providerKey = k;
            diagnostic.dotEnv.rawProvider = val;
            if (!['disabled', 'none', 'off', 'false'].includes(val.toLowerCase())) {
              fileProvider = val;
            }
            break;
          }
        }

        for (const k of apiKeyKeys) {
          const val = cleanValue(parsed[k]);
          if (val) {
            diagnostic.dotEnv.hasApiKey = true;
            diagnostic.dotEnv.apiKeyKey = k;
            diagnostic.dotEnv.apiKeyLength = val.length;
            if (isValidApiKey(val)) {
              fileApiKey = val;
            }
            break;
          }
        }

        for (const k of senderIdKeys) {
          const val = cleanValue(parsed[k]);
          if (val) {
            diagnostic.dotEnv.hasSenderId = true;
            diagnostic.dotEnv.senderId = val;
            fileSenderId = val;
            break;
          }
        }

        // If we found any relevant keys in this file, prioritize it
        if (diagnostic.dotEnv.hasProvider || diagnostic.dotEnv.hasApiKey) {
          break;
        }
      }
    } catch (_) {}
  }

  // 3. Selection hierarchy:
  // Prefer process.env if both provider and valid API key exist in process.env
  // Otherwise fall back to disk .env values
  let resolvedProvider = null;
  let resolvedApiKey = null;
  let resolvedSenderId = null;
  let selectedSource = 'none';

  if (procProvider && procApiKey) {
    resolvedProvider = procProvider;
    resolvedApiKey = procApiKey;
    resolvedSenderId = procSenderId || fileSenderId || '8809648909250';
    selectedSource = 'process.env';
  } else if (fileProvider && fileApiKey) {
    resolvedProvider = fileProvider;
    resolvedApiKey = fileApiKey;
    resolvedSenderId = fileSenderId || procSenderId || '8809648909250';
    selectedSource = foundFilePath || '.env';
  } else if (procProvider && fileApiKey) {
    resolvedProvider = procProvider;
    resolvedApiKey = fileApiKey;
    resolvedSenderId = procSenderId || fileSenderId || '8809648909250';
    selectedSource = 'hybrid (process.env provider + .env key)';
  } else if (fileProvider && procApiKey) {
    resolvedProvider = fileProvider;
    resolvedApiKey = procApiKey;
    resolvedSenderId = procSenderId || fileSenderId || '8809648909250';
    selectedSource = 'hybrid (.env provider + process.env key)';
  } else {
    // Unconfigured state determination
    resolvedProvider = procProvider || fileProvider || diagnostic.processEnv.rawProvider || diagnostic.dotEnv.rawProvider || null;
    resolvedApiKey = procApiKey || fileApiKey || null;
    resolvedSenderId = procSenderId || fileSenderId || '8809648909250';
    selectedSource = 'none';
  }

  const normalizedProvider = normalizeSmsProvider(resolvedProvider);
  diagnostic.selectedSource = selectedSource;
  diagnostic.normalizedProvider = normalizedProvider;

  const isProviderValid = Boolean(normalizedProvider && normalizedProvider !== 'disabled');
  const isKeyValid = Boolean(resolvedApiKey && isValidApiKey(resolvedApiKey));
  const configured = Boolean(isProviderValid && isKeyValid);

  if (configured) {
    diagnostic.reason = `SMS OTP configured successfully via ${selectedSource} with provider '${normalizedProvider}'.`;
  } else if (!isProviderValid && !isKeyValid) {
    diagnostic.reason = 'Neither SMS_GATEWAY_PROVIDER nor SMS_API_KEY were found with active values in process.env or .env.';
  } else if (!isProviderValid) {
    if (normalizedProvider === 'disabled') {
      diagnostic.reason = "SMS_GATEWAY_PROVIDER is explicitly set to 'disabled'.";
    } else {
      diagnostic.reason = 'SMS_GATEWAY_PROVIDER is missing or unsupported.';
    }
  } else if (!isKeyValid) {
    if (diagnostic.processEnv.hasApiKey || diagnostic.dotEnv.hasApiKey) {
      diagnostic.reason = 'SMS_API_KEY matches default placeholder value or is too short.';
    } else {
      diagnostic.reason = 'SMS_API_KEY is missing in both process.env and .env.';
    }
  }

  // Populate process.env if resolved from file
  if (configured) {
    process.env.SMS_GATEWAY_PROVIDER = normalizedProvider;
    process.env.SMS_API_KEY = resolvedApiKey;
    process.env.SMS_SENDER_ID = resolvedSenderId;
  }

  return {
    provider: configured ? normalizedProvider : null,
    rawProvider: resolvedProvider || null,
    apiKey: resolvedApiKey || null,
    senderId: resolvedSenderId || '8809648909250',
    configured,
    diagnostic
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
          const curVal = process.env[key];
          const isPlaceholder = curVal === 'disabled' || curVal === 'your_sms_gateway_api_key_or_token';
          if (curVal === undefined || curVal === '' || isPlaceholder) {
            process.env[key] = val;
          }
        }
        break; // Stop at first valid .env file found
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
  const rawSiteKey = cleanValue(process.env.TURNSTILE_SITE_KEY || process.env.CLOUDFLARE_TURNSTILE_SITE_KEY);
  const rawSecretKey = cleanValue(process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY);
  if (rawSiteKey && rawSiteKey.length >= 30 && rawSecretKey && rawSecretKey.length < 30) {
    process.env.TURNSTILE_SITE_KEY = rawSecretKey;
    process.env.TURNSTILE_SECRET_KEY = rawSiteKey;
  } else if (rawSiteKey && rawSiteKey.length >= 30) {
    process.env.TURNSTILE_SECRET_KEY = rawSiteKey;
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAAFZ9v3kdzHEYCrpT';
  }
}

module.exports = {
  cleanValue,
  parseEnvLines,
  getCandidateEnvPaths,
  normalizeSmsProvider,
  isValidApiKey,
  getSmsGatewayConfig,
  loadAndSanitizeEnvironment
};
