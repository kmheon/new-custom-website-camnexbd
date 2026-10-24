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
 * Returns candidate .env and virtualenv activation paths where application configuration resides.
 */
function getCandidateEnvPaths() {
  const homeDir = process.env.HOME || '/home/camnexbd';
  const cwd = process.cwd();
  const rootDir = path.resolve(__dirname, '../../');
  const venvActivate = path.join(path.dirname(process.execPath), 'activate');

  return [
    path.join(rootDir, '.env'),
    '/home/camnexbd/camnex/.env',
    path.join(cwd, '.env'),
    venvActivate,
    '/home/camnexbd/nodevenv/camnex/22/bin/activate',
    path.join(homeDir, 'nodevenv/camnex/22/bin/activate'),
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
 * Resolves a key from an object using exact match first, then case-insensitive and trimmed key match.
 */
function findInEnvOrObject(sourceObj, candidateKeys) {
  if (!sourceObj || typeof sourceObj !== 'object') return null;

  // 1. Exact match pass
  for (const k of candidateKeys) {
    if (sourceObj[k] !== undefined) {
      const val = cleanValue(sourceObj[k]);
      if (val) return { key: k, value: val };
    }
  }

  // 2. Case-insensitive and trimmed match pass (handles 'sms_gateway_provider' or 'SMS_GATEWAY_PROVIDER ')
  const normalizedCandidates = candidateKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const [actualKey, rawVal] of Object.entries(sourceObj)) {
    const cleanK = actualKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedCandidates.includes(cleanK)) {
      const val = cleanValue(rawVal);
      if (val) return { key: actualKey.trim(), value: val };
    }
  }

  return null;
}

/**
 * Resolves SMS Gateway configuration and generates safe diagnostic info.
 * NEVER leaks or logs the API key.
 */
function getSmsGatewayConfig() {
  const providerKeys = ['SMS_GATEWAY_PROVIDER', 'SMS_PROVIDER', 'SMS_GATEWAY', 'SMS_SERVICE_PROVIDER'];
  const apiKeyKeys = ['SMS_API_KEY', 'BULKSMSBD_API_KEY', 'SMS_KEY', 'SMS_GATEWAY_KEY', 'SMS_TOKEN'];
  const senderIdKeys = ['SMS_SENDER_ID', 'BULKSMSBD_SENDER_ID', 'SMS_SENDER', 'SMS_SENDER_NAME'];

  const diagnostic = {
    processEnv: {
      hasProvider: false,
      providerKey: null,
      rawProvider: null,
      hasApiKey: false,
      apiKeyKey: null,
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
      hasSenderId: false,
      senderId: null
    },
    selectedSource: 'none',
    normalizedProvider: null,
    reason: ''
  };

  // 0. Check if explicitly disabled at runtime via Central API Control Center
  if (process.env.SMS_OTP_ADMIN_DISABLED === '1') {
    diagnostic.selectedSource = 'control_center_disabled';
    diagnostic.normalizedProvider = 'disabled';
    diagnostic.reason = 'SMS OTP Gateway is disabled by administrator in Central API Control Center.';
    return {
      provider: null,
      rawProvider: 'disabled',
      apiKey: null,
      senderId: process.env.SMS_SENDER_ID || '8809648909250',
      configured: false,
      diagnostic
    };
  }

  // 1. Inspect process.env using exact and case-insensitive matching
  let procProvider = null;
  let procApiKey = null;
  let procSenderId = null;

  const foundProcProvider = findInEnvOrObject(process.env, providerKeys);
  if (foundProcProvider) {
    diagnostic.processEnv.hasProvider = true;
    diagnostic.processEnv.providerKey = foundProcProvider.key;
    diagnostic.processEnv.rawProvider = foundProcProvider.value;
    if (!['disabled', 'none', 'off', 'false', '0'].includes(foundProcProvider.value.toLowerCase())) {
      procProvider = foundProcProvider.value;
    }
  }

  const foundProcApiKey = findInEnvOrObject(process.env, apiKeyKeys);
  if (foundProcApiKey) {
    diagnostic.processEnv.hasApiKey = true;
    diagnostic.processEnv.apiKeyKey = foundProcApiKey.key;
    if (isValidApiKey(foundProcApiKey.value)) {
      procApiKey = foundProcApiKey.value;
    }
  }

  const foundProcSenderId = findInEnvOrObject(process.env, senderIdKeys);
  if (foundProcSenderId) {
    diagnostic.processEnv.hasSenderId = true;
    diagnostic.processEnv.senderId = foundProcSenderId.value;
    procSenderId = foundProcSenderId.value;
  }

  // 2. Inspect candidate .env files and virtualenv activate scripts on disk
  let fileProvider = null;
  let fileApiKey = null;
  let fileSenderId = null;
  let foundFilePath = null;

  const candidatePaths = getCandidateEnvPaths();
  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = parseEnvLines(fileContent);

        const foundFileProv = findInEnvOrObject(parsed, providerKeys);
        const foundFileKey = findInEnvOrObject(parsed, apiKeyKeys);
        const foundFileSender = findInEnvOrObject(parsed, senderIdKeys);

        if (!diagnostic.dotEnv.checkedPath) {
          diagnostic.dotEnv.checkedPath = filePath;
          diagnostic.dotEnv.exists = true;
          diagnostic.dotEnv.allKeysFound = Object.keys(parsed);
        }

        if (foundFileProv && !fileProvider) {
          diagnostic.dotEnv.hasProvider = true;
          diagnostic.dotEnv.providerKey = foundFileProv.key;
          diagnostic.dotEnv.rawProvider = foundFileProv.value;
          if (!['disabled', 'none', 'off', 'false', '0'].includes(foundFileProv.value.toLowerCase())) {
            fileProvider = foundFileProv.value;
            foundFilePath = foundFilePath || filePath;
          }
        }

        if (foundFileKey && !fileApiKey) {
          diagnostic.dotEnv.hasApiKey = true;
          diagnostic.dotEnv.apiKeyKey = foundFileKey.key;
          if (isValidApiKey(foundFileKey.value)) {
            fileApiKey = foundFileKey.value;
            foundFilePath = foundFilePath || filePath;
          }
        }

        if (foundFileSender && !fileSenderId) {
          diagnostic.dotEnv.hasSenderId = true;
          diagnostic.dotEnv.senderId = foundFileSender.value;
          fileSenderId = foundFileSender.value;
        }

        // If we found both provider and apiKey on disk, we have satisfied disk resolution
        if (fileProvider && fileApiKey) {
          break;
        }
      }
    } catch (_) {}
  }

  // 3. Selection hierarchy:
  // Prefer process.env if both provider and valid API key exist in process.env
  // Otherwise fall back to disk values (.env or virtualenv activate script)
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
    selectedSource = 'hybrid (process.env provider + file key)';
  } else if (fileProvider && procApiKey) {
    resolvedProvider = fileProvider;
    resolvedApiKey = procApiKey;
    resolvedSenderId = procSenderId || fileSenderId || '8809648909250';
    selectedSource = 'hybrid (file provider + process.env key)';
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
    diagnostic.reason = 'Neither SMS_GATEWAY_PROVIDER nor SMS_API_KEY were found with active values in process.env or candidate files.';
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
      diagnostic.reason = 'SMS_API_KEY is missing in both process.env and disk candidate files.';
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
 * Returns safe diagnostic info reporting only boolean presence flags and normalized provider.
 * NEVER exposes or logs the API key, its value, or its length.
 */
function getSmsGatewaySafeDiagnostic() {
  const cfg = getSmsGatewayConfig();
  const d = cfg.diagnostic;
  return {
    startupFile: path.basename(process.argv[1] || 'server.js'),
    hasProcessProvider: Boolean(d.processEnv.hasProvider),
    hasProcessApiKey: Boolean(d.processEnv.hasApiKey),
    hasProcessSenderId: Boolean(d.processEnv.hasSenderId),
    hasFileProvider: Boolean(d.dotEnv.hasProvider),
    hasFileApiKey: Boolean(d.dotEnv.hasApiKey),
    hasFileSenderId: Boolean(d.dotEnv.hasSenderId),
    resolvedSource: d.selectedSource,
    normalizedProvider: d.normalizedProvider,
    configured: cfg.configured
  };
}

/**
 * Loads and sanitizes runtime environment variables at server boot across all candidate files.
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
  findInEnvOrObject,
  getSmsGatewayConfig,
  getSmsGatewaySafeDiagnostic,
  loadAndSanitizeEnvironment
};
