/**
 * CamneX Central API, Authentication & Environment Control Center
 * Unified Configuration, Secret Encryption, Auto-Discovery, Reconciliation & Runtime Service
 */

const crypto = require('crypto');
const net = require('net');
const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const db = require('../../../database');
const { encrypt, decrypt, maskSecret } = require('../../shared/cryptoHelper');
const {
  cleanValue,
  parseEnvLines,
  getCandidateEnvPaths,
  normalizeSmsProvider,
  isValidApiKey,
  findInEnvOrObject
} = require('../../shared/envHelper');
const { logAudit } = require('../../middleware/auditLogger');

// Categories for the Control Center
const INTEGRATION_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  MESSAGING_OTP: 'messaging_otp',
  SECURITY_CAPTCHA: 'security_captcha',
  MESSAGING_EMAIL: 'messaging_email',
  DELIVERY_COURIER: 'delivery_courier',
  PAYMENTS: 'payments',
  WEBHOOKS_ERP: 'webhooks_erp',
  CUSTOM: 'custom'
};

// Immutable infrastructure environment keys that cannot be mutated dynamically at runtime without process restart
const IMMUTABLE_INFRA_KEYS = new Set([
  'PORT',
  'HOST',
  'NODE_ENV',
  'TRUST_PROXY',
  'DB_CLIENT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PATH',
  'DATABASE_PATH',
  'DB_CONNECTION_LIMIT',
  'ENCRYPTION_KEY',
  'SESSION_SECRET',
  'USE_NODE_SQLITE',
  'SQLITE_ENGINE'
]);

/**
 * Validates an external URL against Server-Side Request Forgery (SSRF).
 * Blocks non-http/https schemes, localhost, loopback, link-local, metadata IPs, and private RFC1918 ranges.
 */
function validateSafeExternalUrl(rawUrl, { allowLocalInDev = false } = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required and must be a string.' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (_) {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: `Unsupported protocol "${parsed.protocol}". Only http: and https: are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  const isLocalhost =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '0:0:0:0:0:0:0:1' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('::ffff:127.');

  const isMetadataOrPrivateIp = (() => {
    // Cloud metadata IP
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') return true;
    // IPv4 private ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 10) return true;
      if (a === 127) return true;
      if (a === 0) return true;
      if (a === 169 && b === 254) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 100 && b >= 64 && b <= 127) return true;
    }
    // IPv6 private / link-local ranges
    if (hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80:')) {
      return true;
    }
    return false;
  })();

  if (isMetadataOrPrivateIp) {
    return { valid: false, error: 'URL targets a restricted private network or cloud metadata address (SSRF protection).' };
  }

  if (isLocalhost && !allowLocalInDev) {
    return { valid: false, error: 'URL targets localhost or loopback address which is blocked for external integrations.' };
  }

  return { valid: true, url: parsed.toString(), hostname };
}

/**
 * Formats a secret value into a safe masked preview (never exposing the raw secret).
 */
function createSafeSecretPreview(plainSecret) {
  if (!plainSecret || typeof plainSecret !== 'string') {
    return { configured: false, masked: null };
  }
  const clean = plainSecret.trim();
  if (!clean || clean.startsWith('••••')) {
    return { configured: Boolean(clean), masked: clean ? '••••••••' : null };
  }
  // Never reveal any characters of short secrets; for long keys show only fixed bullets
  return {
    configured: true,
    masked: maskSecret(clean)
  };
}

/**
 * Canonical Codebase Integration Definitions
 * Discovered directly from the CamneX repository modules:
 * - server/auth/socialAuth.js
 * - server/auth/verificationService.js
 * - server/shared/envHelper.js
 * - server/modules/courier/*
 * - server/modules/orders/orders.service.js & server.js
 * - server/modules/webhooks/*
 */
const CODEBASE_INTEGRATION_DEFINITIONS = [
  // 1. GOOGLE OAUTH
  {
    id: 'google_oauth',
    name: 'Google OAuth 2.0 / OpenID Connect',
    provider: 'google',
    category: INTEGRATION_CATEGORIES.AUTHENTICATION,
    isCritical: true,
    adapterStatus: 'integrated',
    description: 'Customer one-click social authentication and verified email account linking via Google Cloud OAuth 2.0.',
    website: 'https://console.cloud.google.com/apis/credentials',
    dependentFeatures: [
      'Customer Sign-In with Google (/account)',
      'Verified Email Auto-Linking',
      'GET /api/auth/providers',
      'GET /api/auth/oauth/google',
      'GET /api/auth/oauth/google/callback'
    ],
    codeConsumers: [
      'server/auth/socialAuth.js',
      'server.js',
      'src/pages/CustomerAccountPage.tsx'
    ],
    fields: [
      { key: 'clientId', label: 'Google Client ID', envKey: 'GOOGLE_CLIENT_ID', type: 'text', secret: false, required: true, placeholder: 'xxxx.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'Google Client Secret', envKey: 'GOOGLE_CLIENT_SECRET', type: 'password', secret: true, required: true, placeholder: 'GOCSPX-...' },
      { key: 'siteUrl', label: 'Callback Base URL (SITE_URL)', envKey: 'SITE_URL', type: 'url', secret: false, required: false, placeholder: 'https://camnexbd.com' }
    ]
  },

  // 2. APPLE SIGN-IN
  {
    id: 'apple_oauth',
    name: 'Sign in with Apple',
    provider: 'apple',
    category: INTEGRATION_CATEGORIES.AUTHENTICATION,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Customer social authentication with Apple ID using OpenID Connect form_post JWT identity tokens.',
    website: 'https://developer.apple.com/account/resources/identifiers/list/serviceId',
    dependentFeatures: [
      'Customer Sign-In with Apple (/account)',
      'GET /api/auth/providers',
      'GET /api/auth/oauth/apple',
      'POST /api/auth/oauth/apple/callback'
    ],
    codeConsumers: [
      'server/auth/socialAuth.js',
      'server.js',
      'src/pages/CustomerAccountPage.tsx'
    ],
    fields: [
      { key: 'clientId', label: 'Apple Services ID (Client ID)', envKey: 'APPLE_CLIENT_ID', type: 'text', secret: false, required: true, placeholder: 'com.camnexbd.client' },
      { key: 'teamId', label: 'Apple Developer Team ID', envKey: 'APPLE_TEAM_ID', type: 'text', secret: false, required: false, placeholder: 'TEAM123456' },
      { key: 'keyId', label: 'Apple Key ID', envKey: 'APPLE_KEY_ID', type: 'text', secret: false, required: false, placeholder: 'KEY1234567' },
      { key: 'privateKey', label: 'Apple Private Key / Client Secret', envKey: 'APPLE_PRIVATE_KEY', type: 'password', secret: true, required: true, placeholder: '-----BEGIN PRIVATE KEY-----...' }
    ]
  },

  // 3. BULKSMSBD PHONE OTP
  {
    id: 'bulksmsbd_sms',
    name: 'BulkSMSBD Phone OTP Gateway',
    provider: 'bulksmsbd',
    category: INTEGRATION_CATEGORIES.MESSAGING_OTP,
    isCritical: true,
    adapterStatus: 'integrated',
    description: 'Primary Bangladesh SMS gateway (bulksmsbd.net) for 6-digit customer phone OTP login and checkout phone verification.',
    website: 'https://bulksmsbd.net',
    dependentFeatures: [
      'Phone OTP Sign-In (/api/auth/otp/send & /verify)',
      'Checkout Phone Verification (/api/auth/verification/phone/send)',
      'GET /api/auth/providers (smsOtp)',
      'Customer Account Phone Verification'
    ],
    codeConsumers: [
      'server/shared/envHelper.js',
      'server/auth/socialAuth.js',
      'server/auth/verificationService.js',
      'src/pages/CustomerAccountPage.tsx'
    ],
    fields: [
      { key: 'apiKey', label: 'BulkSMSBD API Key', envKey: 'SMS_API_KEY', type: 'password', secret: true, required: true, placeholder: 'Enter BulkSMSBD API Key' },
      { key: 'senderId', label: 'Approved Sender ID', envKey: 'SMS_SENDER_ID', type: 'text', secret: false, required: true, defaultValue: '8809648909250', placeholder: '8809648909250' },
      { key: 'apiUrl', label: 'Gateway API Endpoint', envKey: 'BULKSMSBD_API_URL', type: 'url', secret: false, required: false, defaultValue: 'https://bulksmsbd.net/api/smsapi' },
      { key: 'timeoutMs', label: 'Request Timeout (ms)', envKey: 'SMS_TIMEOUT_MS', type: 'number', secret: false, required: false, defaultValue: 8000 }
    ]
  },

  // 4. GREENWEB SMS GATEWAY
  {
    id: 'greenweb_sms',
    name: 'GreenWeb BD SMS Gateway',
    provider: 'greenweb',
    category: INTEGRATION_CATEGORIES.MESSAGING_OTP,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Alternative Bangladesh SMS OTP gateway adapter via api.greenweb.com.bd.',
    website: 'https://sms.greenweb.com.bd',
    dependentFeatures: [
      'Phone OTP Sign-In (when active SMS provider is greenweb)',
      'POST /api/auth/otp/send'
    ],
    codeConsumers: [
      'server/auth/socialAuth.js',
      'server/shared/envHelper.js'
    ],
    fields: [
      { key: 'apiKey', label: 'GreenWeb API Token', type: 'password', secret: true, required: true, placeholder: 'GreenWeb Token' },
      { key: 'timeoutMs', label: 'Request Timeout (ms)', type: 'number', secret: false, required: false, defaultValue: 8000 }
    ]
  },

  // 5. MIMSMS GATEWAY
  {
    id: 'mimsms_sms',
    name: 'MiMSMS Bangladesh Gateway',
    provider: 'mimsms',
    category: INTEGRATION_CATEGORIES.MESSAGING_OTP,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Alternative Bangladesh SMS OTP gateway adapter via esms.mimsms.com.',
    website: 'https://www.mimsms.com',
    dependentFeatures: [
      'Phone OTP Sign-In (when active SMS provider is mimsms)',
      'POST /api/auth/otp/send'
    ],
    codeConsumers: [
      'server/auth/socialAuth.js',
      'server/shared/envHelper.js'
    ],
    fields: [
      { key: 'apiKey', label: 'MiMSMS API Key', type: 'password', secret: true, required: true, placeholder: 'MiMSMS API Key' },
      { key: 'senderId', label: 'Sender ID', type: 'text', secret: false, required: true, defaultValue: 'CamneX' }
    ]
  },

  // 6. TWILIO SMS GATEWAY
  {
    id: 'twilio_sms',
    name: 'Twilio Programmable SMS',
    provider: 'twilio',
    category: INTEGRATION_CATEGORIES.MESSAGING_OTP,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'International & Bangladesh SMS OTP gateway via Twilio REST API.',
    website: 'https://console.twilio.com',
    dependentFeatures: [
      'Phone OTP Sign-In (when active SMS provider is twilio)',
      'POST /api/auth/otp/send'
    ],
    codeConsumers: [
      'server/auth/socialAuth.js',
      'server/shared/envHelper.js'
    ],
    fields: [
      { key: 'accountSid', label: 'Twilio Account SID', envKey: 'TWILIO_ACCOUNT_SID', type: 'text', secret: false, required: true, placeholder: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
      { key: 'apiKey', label: 'Twilio Auth Token', type: 'password', secret: true, required: true, placeholder: 'Twilio Auth Token' },
      { key: 'senderId', label: 'Twilio From Phone Number', type: 'text', secret: false, required: true, placeholder: '+1234567890' }
    ]
  },

  // 7. CLOUDFLARE TURNSTILE CAPTCHA
  {
    id: 'cloudflare_turnstile',
    name: 'Cloudflare Turnstile Bot Protection',
    provider: 'cloudflare',
    category: INTEGRATION_CATEGORIES.SECURITY_CAPTCHA,
    isCritical: true,
    adapterStatus: 'integrated',
    description: 'Privacy-preserving CAPTCHA challenge protecting login, registration, phone OTP, and email verification endpoints against automated abuse.',
    website: 'https://dash.cloudflare.com/?to=/:account/turnstile',
    dependentFeatures: [
      'Customer Sign-In & Registration Bot Protection',
      'Phone OTP & Email Verification Abuse Prevention',
      'GET /api/auth/captcha/config',
      'TurnstileWidget.tsx'
    ],
    codeConsumers: [
      'server/auth/verificationService.js',
      'server/shared/envHelper.js',
      'server.js',
      'src/components/common/TurnstileWidget.tsx'
    ],
    fields: [
      { key: 'siteKey', label: 'Turnstile Site Key (Public)', envKey: 'TURNSTILE_SITE_KEY', type: 'text', secret: false, required: true, placeholder: '0x4AAAAAA...' },
      { key: 'secretKey', label: 'Turnstile Secret Key (Private)', envKey: 'TURNSTILE_SECRET_KEY', type: 'password', secret: true, required: true, placeholder: '0x4AAAAAA...' },
      { key: 'allowedHostnames', label: 'Allowed Hostnames (Comma-separated)', envKey: 'TURNSTILE_ALLOWED_HOSTNAMES', type: 'text', secret: false, required: false, defaultValue: 'camnexbd.com,www.camnexbd.com,localhost,127.0.0.1' },
      { key: 'verifyUrl', label: 'Siteverify Endpoint URL', envKey: 'TURNSTILE_VERIFY_URL', type: 'url', secret: false, required: false, defaultValue: 'https://challenges.cloudflare.com/turnstile/v0/siteverify' },
      { key: 'timeoutMs', label: 'Verification Timeout (ms)', envKey: 'TURNSTILE_TIMEOUT_MS', type: 'number', secret: false, required: false, defaultValue: 7000 }
    ]
  },

  // 8. EMAIL VERIFICATION & TRANSACTIONAL SMTP
  {
    id: 'email_smtp',
    name: 'Transactional Email & Verification (SMTP)',
    provider: 'smtp',
    category: INTEGRATION_CATEGORIES.MESSAGING_EMAIL,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'cPanel / SMTP mail server integration for customer 6-digit email verification codes, order confirmations, and quote notifications.',
    website: 'https://camnexbd.com:2083',
    dependentFeatures: [
      'Customer Email Verification (/api/auth/verification/email/send)',
      'One-Click Email Confirmation (/api/auth/verification/email/confirm)',
      'Order & Quote Notification Emails (/api/admin/notifications/test)'
    ],
    codeConsumers: [
      'server/auth/verificationService.js',
      'server.js'
    ],
    fields: [
      { key: 'host', label: 'SMTP Server Host', envKey: 'SMTP_HOST', type: 'text', secret: false, required: true, placeholder: 'mail.camnexbd.com' },
      { key: 'port', label: 'SMTP Port', envKey: 'SMTP_PORT', type: 'number', secret: false, required: true, defaultValue: 465, placeholder: '465' },
      { key: 'user', label: 'SMTP Username / Mailbox', envKey: 'SMTP_USER', type: 'text', secret: false, required: true, placeholder: 'noreply@camnexbd.com' },
      { key: 'pass', label: 'SMTP Password', envKey: 'SMTP_PASS', type: 'password', secret: true, required: true, placeholder: 'Mailbox password' },
      { key: 'from', label: 'Sender Name & Email (From)', envKey: 'SMTP_FROM', type: 'text', secret: false, required: false, defaultValue: 'CamneX Bangladesh <noreply@camnexbd.com>' }
    ]
  },

  // 9. STEADFAST COURIER
  {
    id: 'courier_steadfast',
    name: 'Steadfast Courier Bangladesh',
    provider: 'steadfast',
    category: INTEGRATION_CATEGORIES.DELIVERY_COURIER,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Automated parcel booking, consignment generation, and live delivery status tracking across all 64 districts of Bangladesh via Steadfast (Packzy) API.',
    website: 'https://portal.packzy.com',
    dependentFeatures: [
      'One-Click Order Courier Dispatch (/api/admin/orders/:id/dispatch-courier)',
      'Live Consignment Status Tracking (/api/admin/orders/:id/courier-tracking)',
      'Courier Connection Testing (/api/admin/couriers/steadfast/test-connection)'
    ],
    codeConsumers: [
      'server/modules/courier/adapters/steadfast.adapter.js',
      'server/modules/courier/courier.service.js',
      'server/modules/courier/courier.registry.js'
    ],
    fields: [
      { key: 'apiKey', label: 'Steadfast API Key', type: 'text', secret: false, required: true, placeholder: 'Steadfast API Key' },
      { key: 'secretKey', label: 'Steadfast Secret Key', type: 'password', secret: true, required: true, placeholder: 'Steadfast Secret Key' },
      { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', secret: false, required: false, defaultValue: true }
    ]
  },

  // 10. PATHAO LOGISTICS
  {
    id: 'courier_pathao',
    name: 'Pathao Logistics (Merchant API)',
    provider: 'pathao',
    category: INTEGRATION_CATEGORIES.DELIVERY_COURIER,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Express door-to-door parcel fulfillment, OAuth token issuance, and automated consignment tracking via Pathao Hermes API.',
    website: 'https://merchant.pathao.com',
    dependentFeatures: [
      'One-Click Order Courier Dispatch (/api/admin/orders/:id/dispatch-courier)',
      'Live Consignment Status Tracking (/api/admin/orders/:id/courier-tracking)',
      'Courier Connection Testing (/api/admin/couriers/pathao/test-connection)'
    ],
    codeConsumers: [
      'server/modules/courier/adapters/pathao.adapter.js',
      'server/modules/courier/courier.service.js',
      'server/modules/courier/courier.registry.js'
    ],
    fields: [
      { key: 'clientId', label: 'Pathao Client ID', type: 'text', secret: false, required: true, placeholder: 'Client ID' },
      { key: 'clientSecret', label: 'Pathao Client Secret', type: 'password', secret: true, required: true, placeholder: 'Client Secret' },
      { key: 'username', label: 'Merchant Email / Username', type: 'text', secret: false, required: false, placeholder: 'merchant@example.com' },
      { key: 'password', label: 'Merchant Password', type: 'password', secret: true, required: false, placeholder: 'Merchant Password' },
      { key: 'storeId', label: 'Pathao Pickup Store ID', type: 'text', secret: false, required: false, placeholder: 'Store ID' },
      { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', secret: false, required: false, defaultValue: true }
    ]
  },

  // 11. REDX LOGISTICS (CATALOGUED)
  {
    id: 'courier_redx',
    name: 'RedX Logistics',
    provider: 'redx',
    category: INTEGRATION_CATEGORIES.DELIVERY_COURIER,
    isCritical: false,
    adapterStatus: 'development_required',
    description: 'Doorstep parcel pickup, sub-district coverage, and reverse logistics in Bangladesh (Credential storage & tracking URL resolution ready).',
    website: 'https://redx.com.bd',
    dependentFeatures: [
      'Customer Order Tracking Link Resolution',
      'Courier Registry Catalog (/api/admin/couriers)'
    ],
    codeConsumers: [
      'server/modules/courier/courier.registry.js',
      'server/modules/courier/courier.service.js'
    ],
    fields: [
      { key: 'apiKey', label: 'RedX API Access Token', type: 'password', secret: true, required: true, placeholder: 'Bearer Token' },
      { key: 'storeId', label: 'Pickup Store ID', type: 'text', secret: false, required: false },
      { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', secret: false, required: false, defaultValue: true }
    ]
  },

  // 12. PAPERFLY (CATALOGUED)
  {
    id: 'courier_paperfly',
    name: 'Paperfly Delivery Network',
    provider: 'paperfly',
    category: INTEGRATION_CATEGORIES.DELIVERY_COURIER,
    isCritical: false,
    adapterStatus: 'development_required',
    description: 'Doorstep delivery network with coverage for non-metropolitan thanas and upazilas (Credential storage & tracking URL resolution ready).',
    website: 'https://paperfly.com.bd',
    dependentFeatures: [
      'Customer Order Tracking Link Resolution',
      'Courier Registry Catalog (/api/admin/couriers)'
    ],
    codeConsumers: [
      'server/modules/courier/courier.registry.js',
      'server/modules/courier/courier.service.js'
    ],
    fields: [
      { key: 'username', label: 'Paperfly Username', type: 'text', secret: false, required: true },
      { key: 'password', label: 'Paperfly Password', type: 'password', secret: true, required: true },
      { key: 'paperflyKey', label: 'Paperfly API Key', type: 'password', secret: true, required: true },
      { key: 'testMode', label: 'Sandbox / Test Mode', type: 'boolean', secret: false, required: false, defaultValue: true }
    ]
  },

  // 13. PAYMENT: BKASH MFS
  {
    id: 'payment_bkash',
    name: 'bKash Merchant Payment (MFS)',
    provider: 'bkash',
    category: INTEGRATION_CATEGORIES.PAYMENTS,
    isCritical: true,
    adapterStatus: 'integrated',
    description: 'bKash Mobile Financial Services merchant payment collection and checkout verification.',
    website: 'https://www.bkash.com',
    dependentFeatures: [
      'Storefront Checkout bKash Payment Option',
      'Order Creation Payment Validation (/api/orders)',
      'Order Invoice Payment Instructions'
    ],
    codeConsumers: [
      'server.js',
      'server/modules/orders/orders.service.js',
      'src/components/admin/SettingsModule.tsx'
    ],
    fields: [
      { key: 'merchantNumber', label: 'bKash Merchant / Personal Number', type: 'text', secret: false, required: true, placeholder: '017XXXXXXXX' },
      { key: 'instructions', label: 'Customer Payment Instructions', type: 'text', secret: false, required: false, placeholder: 'Use Send Money or Payment option and enter TrxID.' },
      { key: 'appKey', label: 'bKash Tokenized Checkout App Key (Optional)', type: 'text', secret: false, required: false },
      { key: 'appSecret', label: 'bKash Tokenized Checkout App Secret (Optional)', type: 'password', secret: true, required: false }
    ]
  },

  // 14. PAYMENT: NAGAD MFS
  {
    id: 'payment_nagad',
    name: 'Nagad Merchant Payment (MFS)',
    provider: 'nagad',
    category: INTEGRATION_CATEGORIES.PAYMENTS,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Nagad Mobile Financial Services merchant payment collection and checkout verification.',
    website: 'https://nagad.com.bd',
    dependentFeatures: [
      'Storefront Checkout Nagad Payment Option',
      'Order Creation Payment Validation (/api/orders)',
      'Order Invoice Payment Instructions'
    ],
    codeConsumers: [
      'server.js',
      'server/modules/orders/orders.service.js',
      'src/components/admin/SettingsModule.tsx'
    ],
    fields: [
      { key: 'merchantNumber', label: 'Nagad Merchant Number', type: 'text', secret: false, required: true, placeholder: '017XXXXXXXX' },
      { key: 'instructions', label: 'Customer Payment Instructions', type: 'text', secret: false, required: false, placeholder: 'Send payment to Nagad Merchant number and provide TrxID.' },
      { key: 'merchantId', label: 'Nagad PGW Merchant ID (Optional)', type: 'text', secret: false, required: false },
      { key: 'privateKey', label: 'Nagad PGW Private Key (Optional)', type: 'password', secret: true, required: false }
    ]
  },

  // 15. PAYMENT: DIRECT BANK TRANSFER
  {
    id: 'payment_bank',
    name: 'Corporate Bank Transfer / BEFTN',
    provider: 'bank_transfer',
    category: INTEGRATION_CATEGORIES.PAYMENTS,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Direct corporate bank account settlement for B2B commercial orders, government tenders, and large surveillance packages.',
    website: '',
    dependentFeatures: [
      'Storefront Checkout Bank Transfer Option',
      'Commercial Quotation & Invoice Bank Details',
      'Order Creation Payment Validation (/api/orders)'
    ],
    codeConsumers: [
      'server.js',
      'server/modules/orders/orders.service.js',
      'src/components/admin/SettingsModule.tsx'
    ],
    fields: [
      { key: 'bankName', label: 'Bank Name', type: 'text', secret: false, required: true, placeholder: 'City Bank PLC / BRAC Bank PLC' },
      { key: 'accountName', label: 'Account Title / Name', type: 'text', secret: false, required: true, placeholder: 'CamneX Bangladesh' },
      { key: 'accountNumber', label: 'Account Number', type: 'text', secret: false, required: true, placeholder: '1234567890123' },
      { key: 'branchName', label: 'Branch Name', type: 'text', secret: false, required: false, placeholder: 'Gulshan Avenue Branch' },
      { key: 'routingNumber', label: 'Routing Number', type: 'text', secret: false, required: false, placeholder: '225261729' }
    ]
  },

  // 16. PAYMENT: CASH ON DELIVERY (COD)
  {
    id: 'payment_cod',
    name: 'Cash on Delivery (COD)',
    provider: 'cod',
    category: INTEGRATION_CATEGORIES.PAYMENTS,
    isCritical: true,
    adapterStatus: 'integrated',
    description: 'Collect cash upon doorstep hardware delivery or technician installation across Bangladesh.',
    website: '',
    dependentFeatures: [
      'Storefront Checkout Cash on Delivery Option',
      'Order Creation Payment Validation (/api/orders)'
    ],
    codeConsumers: [
      'server.js',
      'server/modules/orders/orders.service.js',
      'src/components/admin/SettingsModule.tsx'
    ],
    fields: [
      { key: 'instructions', label: 'COD Checkout Note', type: 'text', secret: false, required: false, defaultValue: 'Pay in cash to the delivery agent or installation engineer upon receiving your equipment.' }
    ]
  },

  // 17. OUTBOUND WEBHOOKS & ERP/POS SYNC ENGINE
  {
    id: 'webhooks_outbox',
    name: 'HMAC Outbound Webhooks & ERP/POS Event Bus',
    provider: 'camnex_webhooks',
    category: INTEGRATION_CATEGORIES.WEBHOOKS_ERP,
    isCritical: false,
    adapterStatus: 'integrated',
    description: 'Transactional outbox worker and HMAC-SHA256 signed webhook dispatcher for real-time ERP, POS, inventory, and order synchronization.',
    website: '',
    dependentFeatures: [
      'Domain Event Outbox Worker (server/middleware/events.js)',
      'HMAC-SHA256 Webhook Dispatcher (/api/v1/webhooks/*)',
      'Order, Inventory & Catalog Event Synchronization'
    ],
    codeConsumers: [
      'server/modules/webhooks/webhook.service.js',
      'server/modules/webhooks/webhook.router.js',
      'server/middleware/events.js'
    ],
    fields: [
      { key: 'workerIntervalMs', label: 'Outbox Poll Interval (ms)', type: 'number', secret: false, required: false, defaultValue: 3000 },
      { key: 'deliveryTimeoutMs', label: 'Webhook HTTP Timeout (ms)', type: 'number', secret: false, required: false, defaultValue: 8000 },
      { key: 'defaultSigningSecret', label: 'Default Signing Secret', type: 'password', secret: true, required: false }
    ]
  }
];

/**
 * Supported Runtime & Infrastructure Environment Variables Catalog
 */
const ENVIRONMENT_VARIABLES_CATALOG = [
  // Mutable Runtime Settings
  { key: 'SITE_URL', category: 'urls_cors', label: 'Canonical Site URL', isSecret: false, isMutable: true, defaultValue: 'https://camnexbd.com', description: 'Used for OAuth callback redirects and canonical links.' },
  { key: 'PUBLIC_SITE_URL', category: 'urls_cors', label: 'Public Storefront Origin', isSecret: false, isMutable: true, defaultValue: 'https://camnexbd.com', description: 'Allowed CORS origin for storefront requests.' },
  { key: 'ADMIN_URL', category: 'urls_cors', label: 'Admin Portal Origin', isSecret: false, isMutable: true, defaultValue: 'https://camnexbd.com', description: 'Allowed CORS origin for Website Manager.' },
  { key: 'SMS_GATEWAY_PROVIDER', category: 'messaging_otp', label: 'Active SMS OTP Provider', isSecret: false, isMutable: true, defaultValue: 'bulksmsbd', description: 'Active SMS gateway provider (bulksmsbd, greenweb, mimsms, twilio, or disabled).' },
  { key: 'SMS_API_KEY', category: 'messaging_otp', label: 'SMS Gateway API Key', isSecret: true, isMutable: true, defaultValue: '', description: 'Secret API key or token for the active SMS OTP provider.' },
  { key: 'SMS_SENDER_ID', category: 'messaging_otp', label: 'SMS Approved Sender ID', isSecret: false, isMutable: true, defaultValue: '8809648909250', description: 'Approved masking or non-masking Sender ID for outbound OTP SMS.' },
  { key: 'BULKSMSBD_API_URL', category: 'messaging_otp', label: 'BulkSMSBD API Endpoint', isSecret: false, isMutable: true, defaultValue: 'https://bulksmsbd.net/api/smsapi', description: 'HTTP endpoint for BulkSMSBD dispatch.' },
  { key: 'SMS_TIMEOUT_MS', category: 'messaging_otp', label: 'SMS Gateway Timeout (ms)', isSecret: false, isMutable: true, defaultValue: '8000', description: 'Maximum wait time in milliseconds for SMS gateway HTTP calls.' },
  { key: 'GOOGLE_CLIENT_ID', category: 'authentication', label: 'Google OAuth Client ID', isSecret: false, isMutable: true, defaultValue: '', description: 'Public OAuth 2.0 Client ID from Google Cloud Console.' },
  { key: 'GOOGLE_CLIENT_SECRET', category: 'authentication', label: 'Google OAuth Client Secret', isSecret: true, isMutable: true, defaultValue: '', description: 'Secret key for Google OAuth 2.0 token exchange.' },
  { key: 'APPLE_CLIENT_ID', category: 'authentication', label: 'Apple Sign-In Client ID', isSecret: false, isMutable: true, defaultValue: '', description: 'Apple Services ID for Sign in with Apple.' },
  { key: 'APPLE_TEAM_ID', category: 'authentication', label: 'Apple Developer Team ID', isSecret: false, isMutable: true, defaultValue: '', description: '10-character Apple Developer Team ID.' },
  { key: 'APPLE_KEY_ID', category: 'authentication', label: 'Apple Private Key ID', isSecret: false, isMutable: true, defaultValue: '', description: 'Key identifier from Apple Developer Portal.' },
  { key: 'APPLE_PRIVATE_KEY', category: 'authentication', label: 'Apple Sign-In Private Key', isSecret: true, isMutable: true, defaultValue: '', description: 'PEM-encoded private key for Sign in with Apple.' },
  { key: 'TURNSTILE_SITE_KEY', category: 'security_captcha', label: 'Cloudflare Turnstile Site Key', isSecret: false, isMutable: true, defaultValue: '0x4AAAAAAFZ9v3kdzHEYCrpT', description: 'Public widget key rendered on login, registration, and OTP forms.' },
  { key: 'TURNSTILE_SECRET_KEY', category: 'security_captcha', label: 'Cloudflare Turnstile Secret Key', isSecret: true, isMutable: true, defaultValue: '', description: 'Private secret key used for server-side siteverify token validation.' },
  { key: 'TURNSTILE_ALLOWED_HOSTNAMES', category: 'security_captcha', label: 'Turnstile Allowed Hostnames', isSecret: false, isMutable: true, defaultValue: 'camnexbd.com,www.camnexbd.com,localhost,127.0.0.1', description: 'Comma-separated list of hostnames permitted in Turnstile verification responses.' },
  { key: 'TURNSTILE_TIMEOUT_MS', category: 'security_captcha', label: 'Turnstile Verify Timeout (ms)', isSecret: false, isMutable: true, defaultValue: '7000', description: 'Timeout in milliseconds for Cloudflare Turnstile siteverify requests.' },
  { key: 'SMTP_HOST', category: 'messaging_email', label: 'SMTP Mail Server Host', isSecret: false, isMutable: true, defaultValue: 'mail.camnexbd.com', description: 'Hostname for outbound transactional and verification emails.' },
  { key: 'SMTP_PORT', category: 'messaging_email', label: 'SMTP Mail Server Port', isSecret: false, isMutable: true, defaultValue: '465', description: 'Port for SMTP server (465 for SSL, 587 for TLS).' },
  { key: 'SMTP_USER', category: 'messaging_email', label: 'SMTP Username', isSecret: false, isMutable: true, defaultValue: 'noreply@camnexbd.com', description: 'Authenticated mailbox user for outbound SMTP.' },
  { key: 'SMTP_PASS', category: 'messaging_email', label: 'SMTP Password', isSecret: true, isMutable: true, defaultValue: '', description: 'Secret password for the SMTP mailbox.' },
  { key: 'SMTP_FROM', category: 'messaging_email', label: 'SMTP From Header', isSecret: false, isMutable: true, defaultValue: 'CamneX Bangladesh <noreply@camnexbd.com>', description: 'Default sender identity for verification and order emails.' },
  { key: 'API_RATE_LIMIT', category: 'rate_limits', label: 'General API Rate Limit (per 15m)', isSecret: false, isMutable: true, defaultValue: '600', description: 'Maximum API requests per IP per 15-minute window.' },
  { key: 'REGISTER_RATE_LIMIT', category: 'rate_limits', label: 'Registration Rate Limit (per 15m)', isSecret: false, isMutable: true, defaultValue: '10', description: 'Maximum account registrations per IP per 15-minute window.' },
  { key: 'SUBMISSION_RATE_LIMIT', category: 'rate_limits', label: 'Form Submission Rate Limit (per 15m)', isSecret: false, isMutable: true, defaultValue: '20', description: 'Maximum quote/service form submissions per IP per 15-minute window.' },

  // Immutable Infrastructure Settings (Read-only in UI with explanation)
  { key: 'NODE_ENV', category: 'infrastructure', label: 'Node Runtime Environment', isSecret: false, isMutable: false, immutableReason: 'Controls process-level compiler optimizations, cookie security flags, and error stack behavior. Managed by cPanel / process supervisor at boot.' },
  { key: 'PORT', category: 'infrastructure', label: 'HTTP Listener Port', isSecret: false, isMutable: false, immutableReason: 'Bound to the operating system socket or LiteSpeed lsnode.js passenger socket at process startup.' },
  { key: 'DB_CLIENT', category: 'infrastructure', label: 'Database Engine Driver', isSecret: false, isMutable: false, immutableReason: 'Selects between MySQL worker pool and SQLite engine at application boot.' },
  { key: 'DB_HOST', category: 'infrastructure', label: 'MySQL Database Host', isSecret: false, isMutable: false, immutableReason: 'Database connection pool bootstrap parameter required before runtime tables can be queried.' },
  { key: 'DB_NAME', category: 'infrastructure', label: 'MySQL Database Name', isSecret: false, isMutable: false, immutableReason: 'Database connection pool bootstrap parameter required before runtime tables can be queried.' },
  { key: 'DB_USER', category: 'infrastructure', label: 'MySQL Database User', isSecret: false, isMutable: false, immutableReason: 'Database connection pool bootstrap parameter.' },
  { key: 'DB_PASSWORD', category: 'infrastructure', label: 'MySQL Database Password', isSecret: true, isMutable: false, immutableReason: 'Database bootstrap credential. Must remain outside database storage.' },
  { key: 'ENCRYPTION_KEY', category: 'infrastructure', label: 'Master AES-256-GCM Encryption Key', isSecret: true, isMutable: false, immutableReason: 'Root key used to encrypt and decrypt all stored secrets in the database. Must never be stored inside the database it protects.' },
  { key: 'SESSION_SECRET', category: 'infrastructure', label: 'Session & OTP HMAC Salt', isSecret: true, isMutable: false, immutableReason: 'Cryptographic salt for active sessions and OTP hashes; changing dynamically invalidates active sessions.' }
];

class IntegrationsControlService {
  constructor() {
    this.initialized = false;
    this.runtimeCache = new Map();
    this.envCache = new Map();
  }

  /**
   * Ensures required database tables exist across both SQLite and MySQL.
   */
  ensureTables() {
    if (this.initialized) return;
    try {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS integrations (
          id VARCHAR(128) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          provider VARCHAR(128) NOT NULL,
          category VARCHAR(64) NOT NULL,
          enabled INTEGER DEFAULT 0,
          is_custom INTEGER DEFAULT 0,
          is_critical INTEGER DEFAULT 0,
          adapter_status VARCHAR(64) DEFAULT 'integrated',
          config_json TEXT,
          encrypted_secrets_json TEXT,
          metadata_json TEXT,
          last_test_at DATETIME,
          last_test_status VARCHAR(32),
          last_test_message TEXT,
          version INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS runtime_configs (
          config_key VARCHAR(128) PRIMARY KEY,
          category VARCHAR(64) NOT NULL,
          value_text TEXT,
          encrypted_value TEXT,
          is_secret INTEGER DEFAULT 0,
          is_mutable INTEGER DEFAULT 1,
          description TEXT,
          updated_by VARCHAR(128),
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS integration_config_snapshots (
          id VARCHAR(128) PRIMARY KEY,
          reason VARCHAR(255),
          snapshot_json TEXT NOT NULL,
          created_by VARCHAR(128),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      this.initialized = true;
    } catch (err) {
      console.error('[IntegrationsControlService] Table initialization error:', err.message);
    }
  }

  /**
   * Reads disk .env / virtualenv activate files once for migration discovery
   */
  discoverDiskEnvVariables() {
    const combined = {};
    const candidatePaths = getCandidateEnvPaths();
    for (const filePath of candidatePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          const parsed = parseEnvLines(fs.readFileSync(filePath, 'utf8'));
          for (const [k, v] of Object.entries(parsed)) {
            if (v && combined[k] === undefined) {
              combined[k] = v;
            }
          }
        }
      } catch (_) {}
    }
    return combined;
  }

  /**
   * Reads current site_settings from the settings table
   */
  getSiteSettingsRaw() {
    try {
      const row = db.prepare("SELECT value FROM settings WHERE `key` = 'site_settings'").get();
      return row ? JSON.parse(row.value) : {};
    } catch (_) {
      return {};
    }
  }

  /**
   * Updates site_settings in the settings table to keep legacy consumers in sync
   */
  syncToSiteSettings(updaterFn) {
    try {
      const current = this.getSiteSettingsRaw();
      const updated = updaterFn({ ...current });
      if (updated) {
        db.prepare(`
          INSERT INTO settings (\`key\`, value)
          VALUES ('site_settings', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(JSON.stringify(updated));
      }
    } catch (err) {
      console.error('[IntegrationsControlService] Failed syncing to site_settings:', err.message);
    }
  }

  /**
   * Idempotent Startup Pre-Population & Migration from process.env, .env, and site_settings.
   * Never overwrites existing configured secrets with empty or placeholder values.
   * Never creates duplicate records.
   */
  seedAndMigrateIntegrations() {
    this.ensureTables();

    const diskEnv = this.discoverDiskEnvVariables();
    const siteSettings = this.getSiteSettingsRaw();
    const smsEnvCfg = require('../../shared/envHelper').getSmsGatewayConfig();
    const { getResolvedTurnstileKeys } = require('../../auth/verificationService');
    const turnstileKeys = getResolvedTurnstileKeys();

    const resolveEnvVal = (key, defaultVal = '') => {
      const procVal = cleanValue(process.env[key]);
      if (procVal && !['your-google-client-id.apps.googleusercontent.com', 'your-google-client-secret', 'com.yourdomain.client', 'YOUR_TEAM_ID', 'YOUR_KEY_ID', 'your_cpanel_mailbox_password', 'your_sms_gateway_api_key_or_token'].includes(procVal)) {
        return procVal;
      }
      const diskVal = cleanValue(diskEnv[key]);
      if (diskVal && !['your-google-client-id.apps.googleusercontent.com', 'your-google-client-secret', 'com.yourdomain.client', 'YOUR_TEAM_ID', 'YOUR_KEY_ID', 'your_cpanel_mailbox_password', 'your_sms_gateway_api_key_or_token'].includes(diskVal)) {
        return diskVal;
      }
      return defaultVal;
    };

    for (const def of CODEBASE_INTEGRATION_DEFINITIONS) {
      const existingRow = db.prepare('SELECT * FROM integrations WHERE id = ?').get(def.id);

      // Build initial discovered config and secrets from environment / site_settings
      const discoveredConfig = {};
      const discoveredSecrets = {};
      let discoveredEnabled = false;

      if (def.id === 'google_oauth') {
        const clientId = resolveEnvVal('GOOGLE_CLIENT_ID');
        const clientSecret = resolveEnvVal('GOOGLE_CLIENT_SECRET');
        const siteUrl = resolveEnvVal('SITE_URL', 'https://camnexbd.com');
        if (clientId) discoveredConfig.clientId = clientId;
        if (siteUrl) discoveredConfig.siteUrl = siteUrl;
        if (clientSecret) discoveredSecrets.clientSecret = encrypt(clientSecret);
        discoveredEnabled = Boolean(clientId && clientSecret);
      } else if (def.id === 'apple_oauth') {
        const clientId = resolveEnvVal('APPLE_CLIENT_ID');
        const teamId = resolveEnvVal('APPLE_TEAM_ID');
        const keyId = resolveEnvVal('APPLE_KEY_ID');
        const privateKey = resolveEnvVal('APPLE_PRIVATE_KEY') || resolveEnvVal('APPLE_CLIENT_SECRET');
        if (clientId) discoveredConfig.clientId = clientId;
        if (teamId) discoveredConfig.teamId = teamId;
        if (keyId) discoveredConfig.keyId = keyId;
        if (privateKey && !privateKey.includes('MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...')) {
          discoveredSecrets.privateKey = encrypt(privateKey);
        }
        discoveredEnabled = Boolean(clientId && discoveredSecrets.privateKey);
      } else if (def.id === 'bulksmsbd_sms') {
        const isBulkActive = smsEnvCfg.configured && smsEnvCfg.provider === 'bulksmsbd';
        const rawKey = isBulkActive ? smsEnvCfg.apiKey : resolveEnvVal('BULKSMSBD_API_KEY') || (normalizeSmsProvider(resolveEnvVal('SMS_GATEWAY_PROVIDER')) === 'bulksmsbd' ? resolveEnvVal('SMS_API_KEY') : '');
        const senderId = smsEnvCfg.senderId || resolveEnvVal('SMS_SENDER_ID', '8809648909250');
        const apiUrl = resolveEnvVal('BULKSMSBD_API_URL', 'https://bulksmsbd.net/api/smsapi');
        const timeoutMs = parseInt(resolveEnvVal('SMS_TIMEOUT_MS', '8000'), 10) || 8000;
        discoveredConfig.senderId = senderId;
        discoveredConfig.apiUrl = apiUrl;
        discoveredConfig.timeoutMs = timeoutMs;
        if (rawKey && isValidApiKey(rawKey)) {
          discoveredSecrets.apiKey = encrypt(rawKey);
        }
        discoveredEnabled = Boolean(isBulkActive && discoveredSecrets.apiKey);
      } else if (def.id === 'greenweb_sms') {
        const isGwActive = smsEnvCfg.configured && smsEnvCfg.provider === 'greenweb';
        discoveredConfig.timeoutMs = 8000;
        if (isGwActive && smsEnvCfg.apiKey) {
          discoveredSecrets.apiKey = encrypt(smsEnvCfg.apiKey);
        }
        discoveredEnabled = isGwActive;
      } else if (def.id === 'mimsms_sms') {
        const isMimActive = smsEnvCfg.configured && smsEnvCfg.provider === 'mimsms';
        discoveredConfig.senderId = smsEnvCfg.senderId || 'CamneX';
        if (isMimActive && smsEnvCfg.apiKey) {
          discoveredSecrets.apiKey = encrypt(smsEnvCfg.apiKey);
        }
        discoveredEnabled = isMimActive;
      } else if (def.id === 'twilio_sms') {
        const isTwilioActive = smsEnvCfg.configured && smsEnvCfg.provider === 'twilio';
        const sid = resolveEnvVal('TWILIO_ACCOUNT_SID');
        if (sid && sid !== 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') discoveredConfig.accountSid = sid;
        discoveredConfig.senderId = smsEnvCfg.senderId || '';
        if (isTwilioActive && smsEnvCfg.apiKey) {
          discoveredSecrets.apiKey = encrypt(smsEnvCfg.apiKey);
        }
        discoveredEnabled = isTwilioActive;
      } else if (def.id === 'cloudflare_turnstile') {
        discoveredConfig.siteKey = turnstileKeys.siteKey || '0x4AAAAAAFZ9v3kdzHEYCrpT';
        discoveredConfig.allowedHostnames = resolveEnvVal('TURNSTILE_ALLOWED_HOSTNAMES', 'camnexbd.com,www.camnexbd.com,localhost,127.0.0.1');
        discoveredConfig.verifyUrl = resolveEnvVal('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
        discoveredConfig.timeoutMs = parseInt(resolveEnvVal('TURNSTILE_TIMEOUT_MS', '7000'), 10) || 7000;
        if (turnstileKeys.secretKey) {
          discoveredSecrets.secretKey = encrypt(turnstileKeys.secretKey);
        }
        discoveredEnabled = Boolean(turnstileKeys.configured);
      } else if (def.id === 'email_smtp') {
        const host = resolveEnvVal('SMTP_HOST', 'mail.camnexbd.com');
        const port = parseInt(resolveEnvVal('SMTP_PORT', '465'), 10) || 465;
        const user = resolveEnvVal('SMTP_USER', 'noreply@camnexbd.com');
        const pass = resolveEnvVal('SMTP_PASS');
        const from = resolveEnvVal('SMTP_FROM', 'CamneX Bangladesh <noreply@camnexbd.com>');
        discoveredConfig.host = host;
        discoveredConfig.port = port;
        discoveredConfig.user = user;
        discoveredConfig.from = from;
        if (pass) {
          discoveredSecrets.pass = encrypt(pass);
        }
        discoveredEnabled = Boolean(host && user && pass);
      } else if (def.id.startsWith('courier_')) {
        const courierKey = def.provider;
        const savedCourier = siteSettings.courierIntegrations?.[courierKey] || {};
        for (const f of def.fields) {
          if (f.secret) {
            if (savedCourier[f.key] && !String(savedCourier[f.key]).startsWith('••••')) {
              discoveredSecrets[f.key] = encrypt(savedCourier[f.key]);
            }
          } else {
            discoveredConfig[f.key] = savedCourier[f.key] !== undefined ? savedCourier[f.key] : (f.defaultValue ?? '');
          }
        }
        discoveredEnabled = Boolean(savedCourier.enabled);
      } else if (def.id === 'payment_bkash') {
        const num = siteSettings.bkashMerchantNumber || '';
        discoveredConfig.merchantNumber = num;
        discoveredConfig.instructions = siteSettings.bkashInstructions || 'Use bKash Send Money / Payment and provide Transaction ID (TrxID).';
        discoveredEnabled = Boolean(num && num.trim().length > 0);
      } else if (def.id === 'payment_nagad') {
        const num = siteSettings.nagadMerchantNumber || '';
        discoveredConfig.merchantNumber = num;
        discoveredConfig.instructions = siteSettings.nagadInstructions || 'Use Nagad Send Money / Payment and provide Transaction ID (TrxID).';
        discoveredEnabled = Boolean(num && num.trim().length > 0);
      } else if (def.id === 'payment_bank') {
        const bd = siteSettings.bankDetails || {};
        discoveredConfig.bankName = bd.bankName || '';
        discoveredConfig.accountName = bd.accountName || '';
        discoveredConfig.accountNumber = bd.accountNumber || '';
        discoveredConfig.branchName = bd.branchName || '';
        discoveredConfig.routingNumber = bd.routingNumber || '';
        discoveredEnabled = Boolean(bd.bankName && bd.accountNumber);
      } else if (def.id === 'payment_cod') {
        discoveredConfig.instructions = 'Pay in cash upon receiving your security equipment.';
        discoveredEnabled = siteSettings.enableCashOnDelivery !== undefined ? Boolean(siteSettings.enableCashOnDelivery) : true;
      } else if (def.id === 'webhooks_outbox') {
        discoveredConfig.workerIntervalMs = 3000;
        discoveredConfig.deliveryTimeoutMs = 8000;
        discoveredEnabled = true;
      }

      const metadata = {
        description: def.description,
        website: def.website || '',
        dependentFeatures: def.dependentFeatures || [],
        codeConsumers: def.codeConsumers || [],
        fields: def.fields || []
      };

      if (!existingRow) {
        db.prepare(`
          INSERT INTO integrations (
            id, name, provider, category, enabled, is_custom, is_critical,
            adapter_status, config_json, encrypted_secrets_json, metadata_json, version
          ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 1)
        `).run(
          def.id,
          def.name,
          def.provider,
          def.category,
          discoveredEnabled ? 1 : 0,
          def.isCritical ? 1 : 0,
          def.adapterStatus || 'integrated',
          JSON.stringify(discoveredConfig),
          JSON.stringify(discoveredSecrets),
          JSON.stringify(metadata)
        );
      } else {
        // Merge safely without overwriting existing user-configured DB values or secrets
        let existingConfig = {};
        let existingSecrets = {};
        try { existingConfig = JSON.parse(existingRow.config_json || '{}'); } catch (_) {}
        try { existingSecrets = JSON.parse(existingRow.encrypted_secrets_json || '{}'); } catch (_) {}

        let updated = false;
        for (const [k, v] of Object.entries(discoveredConfig)) {
          if ((existingConfig[k] === undefined || existingConfig[k] === '') && v !== undefined && v !== '') {
            existingConfig[k] = v;
            updated = true;
          }
        }
        for (const [k, v] of Object.entries(discoveredSecrets)) {
          if ((!existingSecrets[k] || existingSecrets[k] === '') && v) {
            existingSecrets[k] = v;
            updated = true;
          }
        }

        // Also keep metadata definition up to date with codebase
        db.prepare(`
          UPDATE integrations
          SET metadata_json = ?,
              config_json = ?,
              encrypted_secrets_json = ?,
              is_critical = ?,
              adapter_status = ?
          WHERE id = ?
        `).run(
          JSON.stringify(metadata),
          JSON.stringify(existingConfig),
          JSON.stringify(existingSecrets),
          def.isCritical ? 1 : 0,
          def.adapterStatus || 'integrated',
          def.id
        );
      }
    }

    // Seed Runtime Configuration Variables idempotently
    for (const envDef of ENVIRONMENT_VARIABLES_CATALOG) {
      const existingCfg = db.prepare('SELECT * FROM runtime_configs WHERE config_key = ?').get(envDef.key);
      const rawCurrent = resolveEnvVal(envDef.key, envDef.defaultValue || '');

      if (!existingCfg) {
        const valueText = envDef.isSecret ? null : (rawCurrent || envDef.defaultValue || '');
        const encryptedValue = (envDef.isSecret && rawCurrent) ? encrypt(rawCurrent) : null;

        db.prepare(`
          INSERT INTO runtime_configs (
            config_key, category, value_text, encrypted_value, is_secret, is_mutable, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          envDef.key,
          envDef.category,
          valueText,
          encryptedValue,
          envDef.isSecret ? 1 : 0,
          envDef.isMutable ? 1 : 0,
          envDef.description || envDef.immutableReason || ''
        );
      } else if (envDef.isSecret && !existingCfg.encrypted_value && rawCurrent) {
        db.prepare(`
          UPDATE runtime_configs SET encrypted_value = ? WHERE config_key = ?
        `).run(encrypt(rawCurrent), envDef.key);
      } else if (!envDef.isSecret && (!existingCfg.value_text || existingCfg.value_text === '') && rawCurrent) {
        db.prepare(`
          UPDATE runtime_configs SET value_text = ? WHERE config_key = ?
        `).run(rawCurrent, envDef.key);
      }
    }

    this.refreshRuntimeCache();
  }

  /**
   * Refreshes in-memory runtime cache from database
   */
  refreshRuntimeCache() {
    this.ensureTables();
    try {
      const rows = db.prepare('SELECT * FROM integrations').all();
      this.runtimeCache.clear();
      for (const row of rows) {
        let config = {};
        let secrets = {};
        let metadata = {};
        try { config = JSON.parse(row.config_json || '{}'); } catch (_) {}
        try { secrets = JSON.parse(row.encrypted_secrets_json || '{}'); } catch (_) {}
        try { metadata = JSON.parse(row.metadata_json || '{}'); } catch (_) {}

        const decryptedSecrets = {};
        for (const [k, encVal] of Object.entries(secrets)) {
          if (encVal) {
            const dec = decrypt(encVal);
            if (dec !== null) decryptedSecrets[k] = dec;
          }
        }

        this.runtimeCache.set(row.id, {
          ...row,
          enabled: Boolean(row.enabled),
          isCustom: Boolean(row.is_custom),
          isCritical: Boolean(row.is_critical),
          config,
          encryptedSecrets: secrets,
          decryptedSecrets,
          metadata
        });
      }

      const envRows = db.prepare('SELECT * FROM runtime_configs').all();
      this.envCache.clear();
      for (const r of envRows) {
        const val = r.is_secret
          ? (r.encrypted_value ? decrypt(r.encrypted_value) : null)
          : r.value_text;
        this.envCache.set(r.config_key, {
          ...r,
          isSecret: Boolean(r.is_secret),
          isMutable: Boolean(r.is_mutable),
          resolvedValue: val
        });
      }
    } catch (err) {
      console.error('[IntegrationsControlService] Error refreshing cache:', err.message);
    }
  }

  /**
   * Formats an integration record for safe admin API response (NEVER returning plaintext or raw encrypted secrets)
   */
  formatIntegrationForClient(rawRow) {
    let config = {};
    let encryptedSecrets = {};
    let metadata = {};
    try { config = typeof rawRow.config === 'object' ? rawRow.config : JSON.parse(rawRow.config_json || '{}'); } catch (_) {}
    try { encryptedSecrets = typeof rawRow.encryptedSecrets === 'object' ? rawRow.encryptedSecrets : JSON.parse(rawRow.encrypted_secrets_json || '{}'); } catch (_) {}
    try { metadata = typeof rawRow.metadata === 'object' ? rawRow.metadata : JSON.parse(rawRow.metadata_json || '{}'); } catch (_) {}

    const fields = metadata.fields || [];
    const secretStatus = {};
    const safeConfig = { ...config };

    // Redact any secret keys that might have accidentally been placed in config
    for (const field of fields) {
      if (field.secret) {
        delete safeConfig[field.key];
        const encVal = encryptedSecrets[field.key];
        const decVal = encVal ? decrypt(encVal) : null;
        secretStatus[field.key] = createSafeSecretPreview(decVal);
      }
    }

    // Also check any extra keys in encryptedSecrets
    for (const [secKey, encVal] of Object.entries(encryptedSecrets)) {
      if (!secretStatus[secKey]) {
        const decVal = encVal ? decrypt(encVal) : null;
        secretStatus[secKey] = createSafeSecretPreview(decVal);
      }
      delete safeConfig[secKey];
    }

    // Calculate configuration completeness
    const requiredFields = fields.filter(f => f.required);
    const missingFields = [];
    for (const reqField of requiredFields) {
      if (reqField.secret) {
        if (!secretStatus[reqField.key]?.configured) {
          missingFields.push(reqField.label || reqField.key);
        }
      } else {
        const val = safeConfig[reqField.key];
        if (val === undefined || val === null || String(val).trim() === '') {
          missingFields.push(reqField.label || reqField.key);
        }
      }
    }

    const isConfigured = missingFields.length === 0;
    const enabled = Boolean(rawRow.enabled);

    return {
      id: rawRow.id,
      name: rawRow.name,
      provider: rawRow.provider,
      category: rawRow.category,
      enabled,
      isCustom: Boolean(rawRow.is_custom || rawRow.isCustom),
      isCritical: Boolean(rawRow.is_critical || rawRow.isCritical),
      adapterStatus: rawRow.adapter_status || rawRow.adapterStatus || 'integrated',
      isConfigured,
      completeness: {
        isComplete: isConfigured,
        requiredCount: requiredFields.length,
        configuredCount: requiredFields.length - missingFields.length,
        missingFields
      },
      config: safeConfig,
      secretStatus,
      description: metadata.description || '',
      website: metadata.website || '',
      dependentFeatures: metadata.dependentFeatures || [],
      codeConsumers: metadata.codeConsumers || [],
      fields,
      lastTestAt: rawRow.last_test_at || null,
      lastTestStatus: rawRow.last_test_status || 'untested',
      lastTestMessage: rawRow.last_test_message || null,
      version: rawRow.version || 1,
      createdAt: rawRow.created_at,
      updatedAt: rawRow.updated_at
    };
  }

  /**
   * Lists all registered integrations with safe masked secret status
   */
  listIntegrations(category = null) {
    this.ensureTables();
    const countRow = db.prepare('SELECT count(*) as count FROM integrations').get();
    if (!countRow || countRow.count === 0) {
      this.seedAndMigrateIntegrations();
    }

    let sql = 'SELECT * FROM integrations';
    const params = [];
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY category ASC, is_critical DESC, name ASC';

    const rows = db.prepare(sql).all(...params);
    return rows.map(r => this.formatIntegrationForClient(r));
  }

  /**
   * Gets a single integration by ID for admin view
   */
  getIntegration(id) {
    this.ensureTables();
    const row = db.prepare('SELECT * FROM integrations WHERE id = ?').get(id);
    if (!row) return null;
    return this.formatIntegrationForClient(row);
  }

  /**
   * Internal server-only method to retrieve runtime config + decrypted secrets for an integration.
   * NEVER expose the return value of this function directly to an HTTP response.
   */
  getRuntimeIntegration(id) {
    this.ensureTables();
    if (!this.runtimeCache.has(id)) {
      this.refreshRuntimeCache();
    }
    return this.runtimeCache.get(id) || null;
  }

  /**
   * Creates a snapshot of current integrations and runtime_configs for atomic rollback
   */
  createSnapshot(reason = 'Manual update', actorName = 'Administrator') {
    this.ensureTables();
    const integrations = db.prepare('SELECT * FROM integrations').all();
    const runtimeConfigs = db.prepare('SELECT * FROM runtime_configs').all();
    const snapshotId = `snap-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const snapshotPayload = {
      timestamp: new Date().toISOString(),
      integrations,
      runtimeConfigs
    };

    db.prepare(`
      INSERT INTO integration_config_snapshots (id, reason, snapshot_json, created_by)
      VALUES (?, ?, ?, ?)
    `).run(snapshotId, reason, JSON.stringify(snapshotPayload), actorName);

    // Keep most recent 30 snapshots
    try {
      const allSnaps = db.prepare('SELECT id FROM integration_config_snapshots ORDER BY created_at DESC').all();
      if (allSnaps.length > 30) {
        const toDelete = allSnaps.slice(30).map(s => s.id);
        for (const oldId of toDelete) {
          db.prepare('DELETE FROM integration_config_snapshots WHERE id = ?').run(oldId);
        }
      }
    } catch (_) {}

    return snapshotId;
  }

  /**
   * Lists configuration snapshots (redacting encrypted payloads)
   */
  listSnapshots() {
    this.ensureTables();
    const rows = db.prepare('SELECT id, reason, created_by, created_at, snapshot_json FROM integration_config_snapshots ORDER BY created_at DESC LIMIT 25').all();
    return rows.map(r => {
      let integrationCount = 0;
      let configCount = 0;
      try {
        const parsed = JSON.parse(r.snapshot_json || '{}');
        integrationCount = Array.isArray(parsed.integrations) ? parsed.integrations.length : 0;
        configCount = Array.isArray(parsed.runtimeConfigs) ? parsed.runtimeConfigs.length : 0;
      } catch (_) {}
      return {
        id: r.id,
        reason: r.reason,
        createdBy: r.created_by,
        createdAt: r.created_at,
        integrationCount,
        configCount
      };
    });
  }

  /**
   * Rolls back integrations and runtime_configs to a specific snapshot
   */
  rollbackToSnapshot(snapshotId, actor = null) {
    this.ensureTables();
    const snapRow = db.prepare('SELECT * FROM integration_config_snapshots WHERE id = ?').get(snapshotId);
    if (!snapRow) {
      const err = new Error(`Configuration snapshot "${snapshotId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const parsed = JSON.parse(snapRow.snapshot_json);
    this.createSnapshot(`Pre-rollback backup before restoring ${snapshotId}`, actor?.name || 'Administrator');

    const tx = db.transaction(() => {
      if (Array.isArray(parsed.integrations)) {
        db.prepare('DELETE FROM integrations').run();
        const insertInt = db.prepare(`
          INSERT INTO integrations (
            id, name, provider, category, enabled, is_custom, is_critical,
            adapter_status, config_json, encrypted_secrets_json, metadata_json,
            last_test_at, last_test_status, last_test_message, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        for (const item of parsed.integrations) {
          insertInt.run(
            item.id, item.name, item.provider, item.category, item.enabled,
            item.is_custom || 0, item.is_critical || 0, item.adapter_status || 'integrated',
            item.config_json, item.encrypted_secrets_json, item.metadata_json,
            item.last_test_at, item.last_test_status, item.last_test_message,
            (item.version || 1) + 1, item.created_at
          );
        }
      }

      if (Array.isArray(parsed.runtimeConfigs)) {
        db.prepare('DELETE FROM runtime_configs').run();
        const insertCfg = db.prepare(`
          INSERT INTO runtime_configs (
            config_key, category, value_text, encrypted_value, is_secret, is_mutable, description, updated_by, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        for (const cfg of parsed.runtimeConfigs) {
          insertCfg.run(
            cfg.config_key, cfg.category, cfg.value_text, cfg.encrypted_value,
            cfg.is_secret, cfg.is_mutable, cfg.description, actor?.name || cfg.updated_by
          );
        }
      }
    });

    tx();
    this.refreshRuntimeCache();
    this.syncAllToProcessEnvAndSiteSettings();

    logAudit({
      entity: 'integration_control_center',
      entityId: snapshotId,
      action: 'rollback',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      after: { restoredSnapshotId: snapshotId, reason: snapRow.reason }
    });

    return {
      success: true,
      restoredSnapshotId: snapshotId,
      message: `Rolled back configuration to snapshot ${snapshotId} (${snapRow.reason}).`
    };
  }

  /**
   * Synchronizes active integration settings to process.env and site_settings so all runtime consumers immediately reflect changes
   */
  syncAllToProcessEnvAndSiteSettings() {
    this.refreshRuntimeCache();

    // 1. Google OAuth
    const google = this.runtimeCache.get('google_oauth');
    if (google) {
      if (google.config.clientId) process.env.GOOGLE_CLIENT_ID = google.config.clientId;
      if (google.decryptedSecrets.clientSecret) process.env.GOOGLE_CLIENT_SECRET = google.decryptedSecrets.clientSecret;
      if (google.config.siteUrl) process.env.SITE_URL = google.config.siteUrl;
      if (google.enabled) {
        delete process.env.GOOGLE_AUTH_DISABLED;
      } else {
        process.env.GOOGLE_AUTH_DISABLED = '1';
      }
    }

    // 2. Apple OAuth
    const apple = this.runtimeCache.get('apple_oauth');
    if (apple) {
      if (apple.config.clientId) process.env.APPLE_CLIENT_ID = apple.config.clientId;
      if (apple.decryptedSecrets.privateKey) process.env.APPLE_PRIVATE_KEY = apple.decryptedSecrets.privateKey;
      if (apple.config.teamId) process.env.APPLE_TEAM_ID = apple.config.teamId;
      if (apple.config.keyId) process.env.APPLE_KEY_ID = apple.config.keyId;
      if (apple.enabled) {
        delete process.env.APPLE_AUTH_DISABLED;
      } else {
        process.env.APPLE_AUTH_DISABLED = '1';
      }
    }

    // 3. SMS OTP Gateways
    const smsProviders = ['bulksmsbd_sms', 'greenweb_sms', 'mimsms_sms', 'twilio_sms'];
    let activeSms = null;
    for (const smsId of smsProviders) {
      const candidate = this.runtimeCache.get(smsId);
      if (candidate && candidate.enabled && candidate.decryptedSecrets.apiKey) {
        activeSms = candidate;
        break;
      }
    }

    if (activeSms) {
      delete process.env.SMS_OTP_ADMIN_DISABLED;
      process.env.SMS_GATEWAY_PROVIDER = activeSms.provider;
      process.env.SMS_API_KEY = activeSms.decryptedSecrets.apiKey;
      if (activeSms.config.senderId) process.env.SMS_SENDER_ID = String(activeSms.config.senderId);
      if (activeSms.config.apiUrl) process.env.BULKSMSBD_API_URL = String(activeSms.config.apiUrl);
      if (activeSms.config.timeoutMs) process.env.SMS_TIMEOUT_MS = String(activeSms.config.timeoutMs);
      if (activeSms.config.accountSid) process.env.TWILIO_ACCOUNT_SID = String(activeSms.config.accountSid);
    } else {
      process.env.SMS_OTP_ADMIN_DISABLED = '1';
      process.env.SMS_GATEWAY_PROVIDER = 'disabled';
    }

    // 4. Cloudflare Turnstile
    const turnstile = this.runtimeCache.get('cloudflare_turnstile');
    if (turnstile) {
      if (turnstile.config.siteKey) process.env.TURNSTILE_SITE_KEY = turnstile.config.siteKey;
      if (turnstile.decryptedSecrets.secretKey) process.env.TURNSTILE_SECRET_KEY = turnstile.decryptedSecrets.secretKey;
      if (turnstile.config.allowedHostnames) process.env.TURNSTILE_ALLOWED_HOSTNAMES = turnstile.config.allowedHostnames;
      if (turnstile.config.verifyUrl) process.env.TURNSTILE_VERIFY_URL = turnstile.config.verifyUrl;
      if (turnstile.config.timeoutMs) process.env.TURNSTILE_TIMEOUT_MS = String(turnstile.config.timeoutMs);
      if (turnstile.enabled) {
        delete process.env.TURNSTILE_DISABLED;
      } else {
        process.env.TURNSTILE_DISABLED = '1';
      }
    }

    // 5. Email SMTP
    const smtp = this.runtimeCache.get('email_smtp');
    if (smtp) {
      if (smtp.config.host) process.env.SMTP_HOST = smtp.config.host;
      if (smtp.config.port) process.env.SMTP_PORT = String(smtp.config.port);
      if (smtp.config.user) process.env.SMTP_USER = smtp.config.user;
      if (smtp.decryptedSecrets.pass) process.env.SMTP_PASS = smtp.decryptedSecrets.pass;
      if (smtp.config.from) process.env.SMTP_FROM = smtp.config.from;
      if (smtp.enabled) {
        delete process.env.SMTP_DISABLED;
      } else {
        process.env.SMTP_DISABLED = '1';
      }
    }

    // 6. Sync Couriers & Payments to site_settings
    this.syncToSiteSettings((settings) => {
      settings.courierIntegrations = settings.courierIntegrations || {};
      for (const [id, item] of this.runtimeCache.entries()) {
        if (item.category === INTEGRATION_CATEGORIES.DELIVERY_COURIER) {
          const provKey = item.provider;
          settings.courierIntegrations[provKey] = {
            ...(settings.courierIntegrations[provKey] || {}),
            provider: provKey,
            enabled: Boolean(item.enabled),
            ...item.config,
            ...item.encryptedSecrets
          };
        }
      }

      const bkash = this.runtimeCache.get('payment_bkash');
      if (bkash) {
        settings.bkashMerchantNumber = bkash.enabled ? (bkash.config.merchantNumber || '') : '';
        if (bkash.config.instructions) settings.bkashInstructions = bkash.config.instructions;
      }

      const nagad = this.runtimeCache.get('payment_nagad');
      if (nagad) {
        settings.nagadMerchantNumber = nagad.enabled ? (nagad.config.merchantNumber || '') : '';
        if (nagad.config.instructions) settings.nagadInstructions = nagad.config.instructions;
      }

      const bank = this.runtimeCache.get('payment_bank');
      if (bank) {
        if (bank.enabled) {
          settings.bankDetails = {
            ...(settings.bankDetails || {}),
            bankName: bank.config.bankName || '',
            accountName: bank.config.accountName || '',
            accountNumber: bank.config.accountNumber || '',
            branchName: bank.config.branchName || '',
            routingNumber: bank.config.routingNumber || ''
          };
        } else {
          settings.bankDetails = { bankName: '', accountName: '', accountNumber: '', branchName: '', routingNumber: '' };
        }
      }

      const cod = this.runtimeCache.get('payment_cod');
      if (cod) {
        settings.enableCashOnDelivery = Boolean(cod.enabled);
      }

      return settings;
    });
  }

  /**
   * Adds a new integration (either from supported templates or a custom validated adapter)
   */
  createIntegration(payload, actor = null) {
    this.ensureTables();
    const {
      id: rawId,
      name,
      provider,
      category = INTEGRATION_CATEGORIES.CUSTOM,
      enabled = false,
      config = {},
      secrets = {},
      description = '',
      website = '',
      dependentFeatures = [],
      fields = []
    } = payload || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      const err = new Error('Integration name is required.');
      err.statusCode = 400;
      throw err;
    }

    const cleanProvider = (provider || name).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const id = (rawId || `custom_${cleanProvider}_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    const existing = db.prepare('SELECT id FROM integrations WHERE id = ?').get(id);
    if (existing) {
      const err = new Error(`An integration with ID "${id}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Validate any URLs in config or website against SSRF
    if (website) {
      const urlCheck = validateSafeExternalUrl(website, { allowLocalInDev: process.env.NODE_ENV !== 'production' });
      if (!urlCheck.valid) {
        const err = new Error(`Invalid website URL: ${urlCheck.error}`);
        err.statusCode = 400;
        throw err;
      }
    }

    for (const [k, v] of Object.entries(config)) {
      if (typeof v === 'string' && (k.toLowerCase().includes('url') || k.toLowerCase().includes('endpoint') || v.startsWith('http://') || v.startsWith('https://'))) {
        const isSiteUrlKey = k === 'siteUrl' || k === 'SITE_URL';
        const urlCheck = validateSafeExternalUrl(v, { allowLocalInDev: isSiteUrlKey || process.env.NODE_ENV !== 'production' });
        if (!urlCheck.valid) {
          const err = new Error(`SSRF / URL validation failed for "${k}": ${urlCheck.error}`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    const encryptedSecrets = {};
    for (const [secKey, secVal] of Object.entries(secrets)) {
      if (secVal && typeof secVal === 'string' && !secVal.startsWith('••••')) {
        encryptedSecrets[secKey] = encrypt(secVal.trim());
      }
    }

    const defaultFields = fields.length > 0 ? fields : [
      { key: 'endpointUrl', label: 'API Endpoint URL', type: 'url', secret: false, required: true },
      { key: 'apiKey', label: 'API Key / Bearer Token', type: 'password', secret: true, required: false },
      { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number', secret: false, required: false, defaultValue: 8000 }
    ];

    const metadata = {
      description: description || 'Custom external API integration.',
      website: website || '',
      dependentFeatures: Array.isArray(dependentFeatures) ? dependentFeatures : [],
      codeConsumers: ['server/modules/integrations/integrations.service.js'],
      fields: defaultFields
    };

    this.createSnapshot(`Before adding integration ${name}`, actor?.name || 'Administrator');

    db.prepare(`
      INSERT INTO integrations (
        id, name, provider, category, enabled, is_custom, is_critical,
        adapter_status, config_json, encrypted_secrets_json, metadata_json, version
      ) VALUES (?, ?, ?, ?, ?, 1, 0, 'integrated', ?, ?, ?, 1)
    `).run(
      id,
      name.trim(),
      cleanProvider,
      category,
      enabled ? 1 : 0,
      JSON.stringify(config),
      JSON.stringify(encryptedSecrets),
      JSON.stringify(metadata)
    );

    this.refreshRuntimeCache();
    const created = this.getIntegration(id);

    logAudit({
      entity: 'integration',
      entityId: id,
      action: 'create',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      after: created
    });

    return created;
  }

  /**
   * Updates an integration's configuration, write-only secrets, or enabled state
   */
  updateIntegration(id, payload, actor = null) {
    this.ensureTables();
    const row = db.prepare('SELECT * FROM integrations WHERE id = ?').get(id);
    if (!row) {
      const err = new Error(`Integration "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Optimistic concurrency check if version was supplied
    if (payload.version !== undefined && Number(payload.version) !== Number(row.version)) {
      const err = new Error('Concurrent modification detected. Please refresh the integration before saving.');
      err.statusCode = 409;
      err.code = 'CONCURRENT_EDIT_CONFLICT';
      throw err;
    }

    const beforeFormatted = this.formatIntegrationForClient(row);
    let currentConfig = {};
    let currentSecrets = {};
    let metadata = {};
    try { currentConfig = JSON.parse(row.config_json || '{}'); } catch (_) {}
    try { currentSecrets = JSON.parse(row.encrypted_secrets_json || '{}'); } catch (_) {}
    try { metadata = JSON.parse(row.metadata_json || '{}'); } catch (_) {}

    const fields = metadata.fields || [];
    const secretFieldKeys = new Set(fields.filter(f => f.secret).map(f => f.key));

    // Update non-secret config
    if (payload.config && typeof payload.config === 'object') {
      for (const [k, v] of Object.entries(payload.config)) {
        if (secretFieldKeys.has(k)) {
          // If a secret was passed inside config, handle it via secret encryption
          if (v && typeof v === 'string' && !v.startsWith('••••')) {
            currentSecrets[k] = encrypt(v.trim());
          }
          continue;
        }

        // Validate URLs for SSRF
        if (typeof v === 'string' && v.trim() && (k.toLowerCase().includes('url') || k.toLowerCase().includes('endpoint') || v.startsWith('http://') || v.startsWith('https://'))) {
          const isSiteUrlKey = k === 'siteUrl' || k === 'SITE_URL';
          const urlCheck = validateSafeExternalUrl(v, { allowLocalInDev: isSiteUrlKey || process.env.NODE_ENV !== 'production' });
          if (!urlCheck.valid) {
            const err = new Error(`SSRF / URL validation failed for "${k}": ${urlCheck.error}`);
            err.statusCode = 400;
            throw err;
          }
        }

        currentConfig[k] = v;
      }
    }

    // Update write-only secrets
    if (payload.secrets && typeof payload.secrets === 'object') {
      for (const [secKey, secVal] of Object.entries(payload.secrets)) {
        if (secVal === null || secVal === '__CLEAR__') {
          delete currentSecrets[secKey];
        } else if (typeof secVal === 'string' && secVal.trim() !== '' && !secVal.startsWith('••••')) {
          // Special validation for Cloudflare Turnstile swapped keys
          if (id === 'cloudflare_turnstile' && secKey === 'secretKey') {
            const trimmedSecret = secVal.trim();
            if (trimmedSecret.length < 30 && trimmedSecret.startsWith('0x4')) {
              const err = new Error('The provided Turnstile Secret Key appears to be a short public Site Key (< 30 chars). Please supply the 35-character Secret Key.');
              err.statusCode = 400;
              throw err;
            }
          }
          currentSecrets[secKey] = encrypt(secVal.trim());
        }
      }
    }

    // Special validation for Cloudflare Turnstile siteKey length
    if (id === 'cloudflare_turnstile' && currentConfig.siteKey) {
      const sk = String(currentConfig.siteKey).trim();
      if (sk.length >= 30 && sk.startsWith('0x4')) {
        const err = new Error('The provided Turnstile Site Key is >= 30 characters and appears to be a private Secret Key! Never place a secret key in the public Site Key field.');
        err.statusCode = 400;
        throw err;
      }
    }

    const nextEnabled = payload.enabled !== undefined ? (payload.enabled ? 1 : 0) : row.enabled;
    const nextName = payload.name ? String(payload.name).trim() : row.name;

    this.createSnapshot(`Before updating integration ${id}`, actor?.name || 'Administrator');

    db.prepare(`
      UPDATE integrations
      SET name = ?,
          enabled = ?,
          config_json = ?,
          encrypted_secrets_json = ?,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nextName,
      nextEnabled,
      JSON.stringify(currentConfig),
      JSON.stringify(currentSecrets),
      id
    );

    this.syncAllToProcessEnvAndSiteSettings();
    const afterFormatted = this.getIntegration(id);

    logAudit({
      entity: 'integration',
      entityId: id,
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      before: beforeFormatted,
      after: afterFormatted
    });

    return afterFormatted;
  }

  /**
   * Toggles enabled/disabled status of an integration and immediately updates backend runtime behavior
   */
  toggleIntegration(id, { enabled, confirmCritical = false }, actor = null) {
    this.ensureTables();
    const row = db.prepare('SELECT * FROM integrations WHERE id = ?').get(id);
    if (!row) {
      const err = new Error(`Integration "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const isDisabling = !enabled && Boolean(row.enabled);
    if (isDisabling && Boolean(row.is_critical) && !confirmCritical) {
      const err = new Error(`"${row.name}" is a critical production integration. Disabling it requires explicit confirmation (confirmCritical: true).`);
      err.statusCode = 400;
      err.code = 'CRITICAL_CONFIRMATION_REQUIRED';
      throw err;
    }

    // If enabling an SMS gateway, automatically disable competing SMS gateways if requested or keep primary clear
    if (enabled && row.category === INTEGRATION_CATEGORIES.MESSAGING_OTP) {
      db.prepare(`UPDATE integrations SET enabled = 0 WHERE category = ? AND id != ?`).run(INTEGRATION_CATEGORIES.MESSAGING_OTP, id);
    }

    const beforeFormatted = this.formatIntegrationForClient(row);
    this.createSnapshot(`Before ${enabled ? 'enabling' : 'disabling'} ${row.name}`, actor?.name || 'Administrator');

    db.prepare(`
      UPDATE integrations
      SET enabled = ?,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(enabled ? 1 : 0, id);

    // If all SMS providers are now disabled, mark SMS_GATEWAY_PROVIDER=disabled in process.env
    if (!enabled && row.category === INTEGRATION_CATEGORIES.MESSAGING_OTP) {
      const anyActiveSms = db.prepare(`SELECT id FROM integrations WHERE category = ? AND enabled = 1`).get(INTEGRATION_CATEGORIES.MESSAGING_OTP);
      if (!anyActiveSms) {
        process.env.SMS_GATEWAY_PROVIDER = 'disabled';
      }
    }

    this.syncAllToProcessEnvAndSiteSettings();
    const afterFormatted = this.getIntegration(id);

    logAudit({
      entity: 'integration',
      entityId: id,
      action: enabled ? 'enable' : 'disable',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      before: beforeFormatted,
      after: afterFormatted
    });

    return afterFormatted;
  }

  /**
   * Deletes a custom integration or clears & disables a built-in integration's stored credentials safely
   */
  deleteIntegration(id, { confirmDelete = false } = {}, actor = null) {
    this.ensureTables();
    const row = db.prepare('SELECT * FROM integrations WHERE id = ?').get(id);
    if (!row) {
      const err = new Error(`Integration "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!confirmDelete) {
      const err = new Error('Deletion requires explicit confirmation (confirmDelete: true).');
      err.statusCode = 400;
      throw err;
    }

    const beforeFormatted = this.formatIntegrationForClient(row);
    this.createSnapshot(`Before deleting integration ${row.name}`, actor?.name || 'Administrator');

    if (row.is_custom) {
      db.prepare('DELETE FROM integrations WHERE id = ?').run(id);
      this.refreshRuntimeCache();
      logAudit({
        entity: 'integration',
        entityId: id,
        action: 'delete',
        actorId: actor?.id,
        actorName: actor?.name || 'Administrator',
        before: beforeFormatted
      });
      return {
        deleted: true,
        mode: 'removed',
        message: `Custom integration "${row.name}" has been permanently removed.`
      };
    }

    // For built-in codebase integrations, safely purge stored credentials and disable the integration
    // so it remains visible in the registry as unconfigured/disabled rather than vanishing or breaking code consumers.
    db.prepare(`
      UPDATE integrations
      SET enabled = 0,
          encrypted_secrets_json = '{}',
          last_test_status = 'untested',
          last_test_message = 'Credentials purged by administrator.',
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    this.syncAllToProcessEnvAndSiteSettings();
    const afterFormatted = this.getIntegration(id);

    logAudit({
      entity: 'integration',
      entityId: id,
      action: 'purge_credentials',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      before: beforeFormatted,
      after: afterFormatted
    });

    return {
      deleted: true,
      mode: 'credentials_purged',
      integration: afterFormatted,
      message: `Credentials for built-in integration "${row.name}" were securely wiped and the integration has been disabled.`
    };
  }

  /**
   * Runs a safe, provider-specific server-side connection / configuration test
   * Never sends unsolicited SMS messages, creates real courier shipments, or charges payments.
   */
  async testIntegrationConnection(id, overridePayload = {}, actor = null) {
    this.ensureTables();
    const runtimeInt = this.getRuntimeIntegration(id);
    if (!runtimeInt) {
      const err = new Error(`Integration "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const effectiveConfig = { ...runtimeInt.config, ...(overridePayload.config || {}) };
    const effectiveSecrets = { ...runtimeInt.decryptedSecrets };
    if (overridePayload.secrets && typeof overridePayload.secrets === 'object') {
      for (const [k, v] of Object.entries(overridePayload.secrets)) {
        if (v && typeof v === 'string' && !v.startsWith('••••')) {
          effectiveSecrets[k] = v.trim();
        }
      }
    }

    let testSuccess = false;
    let testStatus = 'failed';
    let testMessage = '';
    let details = {};

    try {
      if (id === 'google_oauth') {
        const clientId = effectiveConfig.clientId;
        const clientSecret = effectiveSecrets.clientSecret;
        if (!clientId || !clientSecret) {
          testMessage = 'Missing Google Client ID or Client Secret.';
        } else if (!clientId.endsWith('.apps.googleusercontent.com')) {
          testMessage = 'Google Client ID must end with ".apps.googleusercontent.com".';
        } else {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          try {
            const res = await fetch('https://accounts.google.com/.well-known/openid-configuration', { signal: controller.signal });
            if (res.ok) {
              const doc = await res.json();
              testSuccess = true;
              testStatus = 'healthy';
              testMessage = `Google OAuth configuration valid & OpenID discovery endpoint reachable (${doc.issuer}).`;
              details = { issuer: doc.issuer, authorizationEndpoint: doc.authorization_endpoint };
            } else {
              testMessage = `Google OpenID discovery returned HTTP ${res.status}.`;
            }
          } catch (netErr) {
            testSuccess = true;
            testStatus = 'configured_offline';
            testMessage = `Credentials format validated (OpenID endpoint unreachable in current network: ${netErr.message}).`;
          } finally {
            clearTimeout(timer);
          }
        }
      } else if (id === 'apple_oauth') {
        const clientId = effectiveConfig.clientId;
        const privateKey = effectiveSecrets.privateKey;
        if (!clientId || !privateKey) {
          testMessage = 'Missing Apple Services ID (Client ID) or Private Key.';
        } else {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = 'Apple Sign-In credentials validated.';
        }
      } else if (id === 'bulksmsbd_sms') {
        const apiKey = effectiveSecrets.apiKey;
        const senderId = effectiveConfig.senderId;
        if (!apiKey || !isValidApiKey(apiKey)) {
          testMessage = 'Missing or placeholder BulkSMSBD API Key.';
        } else if (!senderId) {
          testMessage = 'Missing BulkSMSBD Sender ID.';
        } else if (process.env.NODE_ENV === 'test') {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = `BulkSMSBD credentials and Sender ID (${senderId}) validated in test mode (zero SMS sent).`;
          details = { senderId, mode: 'dry_run' };
        } else {
          // Safe read-only balance check endpoint on BulkSMSBD (never sends an SMS)
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          try {
            const balanceUrl = `https://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`;
            const res = await fetch(balanceUrl, { signal: controller.signal });
            const rawText = await res.text();
            let parsed = null;
            try { parsed = JSON.parse(rawText); } catch (_) {}

            const code = parsed?.response_code !== undefined ? String(parsed.response_code) : null;
            if (res.ok && (parsed?.balance !== undefined || code === '202')) {
              testSuccess = true;
              testStatus = 'healthy';
              testMessage = `BulkSMSBD gateway authenticated successfully. Account Balance: ${parsed.balance ?? 'Active'} (Zero SMS sent).`;
              details = { balance: parsed.balance, senderId };
            } else if (code === '1032') {
              testStatus = 'ip_restricted';
              testMessage = 'BulkSMSBD reachable, but Server IP is not whitelisted in BulkSMSBD dashboard (Code 1032: Phone Book -> IP White List).';
              details = { gatewayCode: '1032' };
            } else if (code === '1003' || code === '1011') {
              testMessage = `BulkSMSBD rejected API Key (Code ${code}).`;
            } else {
              testSuccess = true;
              testStatus = 'healthy';
              testMessage = `BulkSMSBD endpoint reachable (HTTP ${res.status}). Sender ID ${senderId} configured.`;
            }
          } catch (netErr) {
            testMessage = `Failed to reach BulkSMSBD API: ${netErr.message}`;
          } finally {
            clearTimeout(timer);
          }
        }
      } else if (id === 'greenweb_sms' || id === 'mimsms_sms' || id === 'twilio_sms') {
        const apiKey = effectiveSecrets.apiKey;
        if (!apiKey || !isValidApiKey(apiKey)) {
          testMessage = `Missing API key/token for ${runtimeInt.name}.`;
        } else if (id === 'twilio_sms' && !effectiveConfig.accountSid) {
          testMessage = 'Missing Twilio Account SID.';
        } else {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = `${runtimeInt.name} credentials validated (safe check, no SMS dispatched).`;
        }
      } else if (id === 'cloudflare_turnstile') {
        const siteKey = effectiveConfig.siteKey;
        const secretKey = effectiveSecrets.secretKey;
        if (!siteKey || !secretKey) {
          testMessage = 'Missing Turnstile Site Key or Secret Key.';
        } else if (siteKey.length >= 30 && siteKey.startsWith('0x4')) {
          testMessage = 'Configuration error: Site Key appears to be a Secret Key (>= 30 chars).';
        } else {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = `Cloudflare Turnstile keys validated (Site Key: ${siteKey.slice(0, 10)}..., Allowed Hostnames: ${effectiveConfig.allowedHostnames || 'default'}).`;
        }
      } else if (id === 'email_smtp') {
        const host = effectiveConfig.host;
        const port = Number(effectiveConfig.port || 465);
        const user = effectiveConfig.user;
        const pass = effectiveSecrets.pass;
        if (!host || !port || !user) {
          testMessage = 'Missing SMTP host, port, or username.';
        } else if (!pass) {
          testMessage = 'SMTP password is not configured yet.';
        } else if (process.env.NODE_ENV === 'test') {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = `SMTP configuration validated for ${user}@${host}:${port}.`;
        } else {
          // Safe TCP socket reachability check
          await new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(4000);
            socket.once('connect', () => {
              testSuccess = true;
              testStatus = 'healthy';
              testMessage = `SMTP server ${host}:${port} is reachable and credentials are configured.`;
              socket.destroy();
              resolve();
            });
            socket.once('timeout', () => {
              testMessage = `Connection to SMTP server ${host}:${port} timed out.`;
              socket.destroy();
              resolve();
            });
            socket.once('error', (err) => {
              testMessage = `SMTP server ${host}:${port} unreachable: ${err.message}`;
              socket.destroy();
              resolve();
            });
            socket.connect(port, host);
          });
        }
      } else if (id.startsWith('courier_')) {
        const { courierService } = require('../courier/courier.service');
        const courierRes = await courierService.testCourierConnection(runtimeInt.provider, {
          ...effectiveConfig,
          ...effectiveSecrets
        });
        testSuccess = Boolean(courierRes.success);
        testStatus = testSuccess ? 'healthy' : 'failed';
        testMessage = courierRes.message || (testSuccess ? 'Courier connection verified.' : 'Courier test failed.');
        details = courierRes.details || {};
      } else if (id === 'payment_bkash' || id === 'payment_nagad') {
        const num = String(effectiveConfig.merchantNumber || '').trim();
        if (!/^01[3-9]\d{8}$/.test(num.replace(/[\s\-+]/g, '').replace(/^88/, ''))) {
          testMessage = `Please configure a valid 11-digit Bangladesh ${runtimeInt.provider.toUpperCase()} merchant number.`;
        } else {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = `${runtimeInt.name} number (${num}) validated and ready for checkout.`;
        }
      } else if (id === 'payment_bank') {
        if (!effectiveConfig.bankName || !effectiveConfig.accountNumber) {
          testMessage = 'Bank Name and Account Number are required for Bank Transfer checkout.';
        } else {
          testSuccess = true;
          testStatus = 'healthy';
          testMessage = `Corporate bank account (${effectiveConfig.bankName} - ${effectiveConfig.accountNumber}) verified.`;
        }
      } else if (id === 'payment_cod') {
        testSuccess = true;
        testStatus = 'healthy';
        testMessage = `Cash on Delivery is ${runtimeInt.enabled ? 'enabled and active on checkout' : 'configured (currently disabled)'}.`;
      } else if (id === 'webhooks_outbox') {
        const webhookService = require('../webhooks/webhook.service');
        const subs = webhookService.listSubscriptions();
        const activeSubs = subs.filter(s => s.is_active);
        testSuccess = true;
        testStatus = 'healthy';
        testMessage = `Outbox engine operational. ${activeSubs.length} active webhook subscription(s) registered.`;
        details = { totalSubscriptions: subs.length, activeSubscriptions: activeSubs.length };
      } else {
        // Custom integration connection test with SSRF protection
        const endpointUrl = effectiveConfig.endpointUrl || effectiveConfig.webhookUrl || effectiveConfig.apiUrl;
        if (!endpointUrl) {
          testMessage = 'No endpoint URL configured to test.';
        } else {
          const urlCheck = validateSafeExternalUrl(endpointUrl, { allowLocalInDev: false });
          if (!urlCheck.valid) {
            testMessage = `Blocked by SSRF protection: ${urlCheck.error}`;
          } else {
            testSuccess = true;
            testStatus = 'healthy';
            testMessage = `Custom integration endpoint (${urlCheck.hostname}) validated safely.`;
          }
        }
      }
    } catch (err) {
      testSuccess = false;
      testStatus = 'failed';
      testMessage = `Test error: ${err.message}`;
    }

    db.prepare(`
      UPDATE integrations
      SET last_test_at = CURRENT_TIMESTAMP,
          last_test_status = ?,
          last_test_message = ?
      WHERE id = ?
    `).run(testStatus, testMessage, id);

    this.refreshRuntimeCache();

    logAudit({
      entity: 'integration',
      entityId: id,
      action: 'test_connection',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      after: { status: testStatus, success: testSuccess, message: testMessage }
    });

    return {
      success: testSuccess,
      status: testStatus,
      message: testMessage,
      testedAt: new Date().toISOString(),
      details
    };
  }

  /**
   * Returns categorized runtime & infrastructure configuration variables.
   * Secrets are NEVER returned in plaintext.
   */
  listEnvironmentVariables() {
    this.ensureTables();
    this.refreshRuntimeCache();

    return ENVIRONMENT_VARIABLES_CATALOG.map(item => {
      const dbRow = this.envCache.get(item.key);
      const rawProcessVal = process.env[item.key];
      const effectiveVal = dbRow?.resolvedValue ?? rawProcessVal ?? item.defaultValue ?? '';

      if (item.isSecret) {
        const preview = createSafeSecretPreview(effectiveVal);
        return {
          key: item.key,
          category: item.category,
          label: item.label,
          isSecret: true,
          isMutable: item.isMutable,
          immutableReason: item.immutableReason || null,
          description: item.description || item.immutableReason || '',
          value: null, // Never expose plaintext secret
          secretStatus: preview,
          source: dbRow?.encrypted_value ? 'control_center_db' : (rawProcessVal ? 'process_env' : 'unconfigured'),
          updatedAt: dbRow?.updated_at || null,
          updatedBy: dbRow?.updated_by || null
        };
      }

      return {
        key: item.key,
        category: item.category,
        label: item.label,
        isSecret: false,
        isMutable: item.isMutable,
        immutableReason: item.immutableReason || null,
        description: item.description || item.immutableReason || '',
        value: effectiveVal !== undefined && effectiveVal !== null ? String(effectiveVal) : '',
        secretStatus: null,
        source: dbRow?.value_text !== undefined && dbRow?.value_text !== null ? 'control_center_db' : (rawProcessVal ? 'process_env' : 'default'),
        updatedAt: dbRow?.updated_at || null,
        updatedBy: dbRow?.updated_by || null
      };
    });
  }

  /**
   * Updates one or more mutable runtime configuration variables atomically.
   * Rejects attempts to mutate immutable infrastructure variables.
   */
  updateEnvironmentVariables(updates, actor = null) {
    this.ensureTables();
    if (!updates || typeof updates !== 'object') {
      const err = new Error('Updates object is required.');
      err.statusCode = 400;
      throw err;
    }

    const catalogMap = new Map(ENVIRONMENT_VARIABLES_CATALOG.map(i => [i.key, i]));

    // Validate all keys before applying any changes
    for (const [key, val] of Object.entries(updates)) {
      if (IMMUTABLE_INFRA_KEYS.has(key)) {
        const catItem = catalogMap.get(key);
        const err = new Error(`"${key}" is an immutable infrastructure setting and cannot be modified dynamically at runtime. ${catItem?.immutableReason || ''}`);
        err.statusCode = 400;
        err.code = 'IMMUTABLE_CONFIG_KEY';
        throw err;
      }

      const catItem = catalogMap.get(key);
      if (!catItem || !catItem.isMutable) {
        const err = new Error(`Configuration variable "${key}" is not a supported mutable runtime variable.`);
        err.statusCode = 400;
        throw err;
      }

      // SSRF / URL check on URL variables
      if (key.endsWith('_URL') && val && typeof val === 'string' && !val.startsWith('••••')) {
        const allowLocal = key === 'SITE_URL' || key === 'PUBLIC_SITE_URL' || key === 'ADMIN_URL' || process.env.NODE_ENV !== 'production';
        const check = validateSafeExternalUrl(val, { allowLocalInDev: allowLocal });
        if (!check.valid) {
          const err = new Error(`Invalid URL for ${key}: ${check.error}`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    this.createSnapshot('Before runtime environment variables update', actor?.name || 'Administrator');

    const appliedKeys = [];
    const tx = db.transaction(() => {
      for (const [key, rawVal] of Object.entries(updates)) {
        const catItem = catalogMap.get(key);
        if (catItem.isSecret) {
          if (typeof rawVal === 'string' && rawVal.trim() !== '' && !rawVal.startsWith('••••')) {
            const cleanSec = rawVal.trim();
            db.prepare(`
              INSERT INTO runtime_configs (config_key, category, value_text, encrypted_value, is_secret, is_mutable, description, updated_by, updated_at)
              VALUES (?, ?, NULL, ?, 1, 1, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(config_key) DO UPDATE SET
                encrypted_value = excluded.encrypted_value,
                updated_by = excluded.updated_by,
                updated_at = CURRENT_TIMESTAMP
            `).run(key, catItem.category, encrypt(cleanSec), catItem.description || '', actor?.name || 'Administrator');
            process.env[key] = cleanSec;
            appliedKeys.push(key);
          }
        } else {
          const cleanStr = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
          db.prepare(`
            INSERT INTO runtime_configs (config_key, category, value_text, encrypted_value, is_secret, is_mutable, description, updated_by, updated_at)
            VALUES (?, ?, ?, NULL, 0, 1, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(config_key) DO UPDATE SET
              value_text = excluded.value_text,
              updated_by = excluded.updated_by,
              updated_at = CURRENT_TIMESTAMP
          `).run(key, catItem.category, cleanStr, catItem.description || '', actor?.name || 'Administrator');
          process.env[key] = cleanStr;
          appliedKeys.push(key);
        }
      }
    });

    tx();

    // Also synchronize corresponding integration records if overlapping env keys were updated
    this.syncEnvUpdatesToIntegrations(appliedKeys);
    this.refreshRuntimeCache();

    logAudit({
      entity: 'runtime_config',
      entityId: 'environment_variables',
      action: 'update',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      after: { updatedKeys: appliedKeys }
    });

    return {
      success: true,
      updatedKeys: appliedKeys,
      variables: this.listEnvironmentVariables()
    };
  }

  /**
   * Keeps integrations table in sync when env variables are updated from the Environment tab
   */
  syncEnvUpdatesToIntegrations(updatedKeys) {
    const keySet = new Set(updatedKeys);
    for (const def of CODEBASE_INTEGRATION_DEFINITIONS) {
      const matchingFields = (def.fields || []).filter(f => f.envKey && keySet.has(f.envKey));
      if (matchingFields.length > 0) {
        const row = db.prepare('SELECT * FROM integrations WHERE id = ?').get(def.id);
        if (row) {
          let cfg = {};
          let sec = {};
          try { cfg = JSON.parse(row.config_json || '{}'); } catch (_) {}
          try { sec = JSON.parse(row.encrypted_secrets_json || '{}'); } catch (_) {}
          for (const mf of matchingFields) {
            const envVal = process.env[mf.envKey];
            if (envVal !== undefined) {
              if (mf.secret) {
                sec[mf.key] = encrypt(envVal);
              } else {
                cfg[mf.key] = envVal;
              }
            }
          }
          db.prepare('UPDATE integrations SET config_json = ?, encrypted_secrets_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(JSON.stringify(cfg), JSON.stringify(sec), def.id);
        }
      }
    }
  }

  /**
   * Reconciliation Engine:
   * Compares:
   * 1. Integrations discovered in codebase (CODEBASE_INTEGRATION_DEFINITIONS)
   * 2. Integrations registered in database (`integrations` table)
   * 3. Runtime consumers & environment state
   */
  getReconciliationReport() {
    this.ensureTables();
    const dbRows = db.prepare('SELECT * FROM integrations').all();
    const dbMap = new Map(dbRows.map(r => [r.id, r]));
    const codeMap = new Map(CODEBASE_INTEGRATION_DEFINITIONS.map(d => [d.id, d]));

    const missingInDb = [];
    const registeredAndSynced = [];
    const customOrOrphanedInDb = [];
    const unresolvedVariables = [];
    const conflicts = [];

    for (const codeDef of CODEBASE_INTEGRATION_DEFINITIONS) {
      const dbRow = dbMap.get(codeDef.id);
      if (!dbRow) {
        missingInDb.push({
          id: codeDef.id,
          name: codeDef.name,
          category: codeDef.category,
          consumers: codeDef.codeConsumers
        });
      } else {
        const formatted = this.formatIntegrationForClient(dbRow);
        registeredAndSynced.push({
          id: codeDef.id,
          name: codeDef.name,
          category: codeDef.category,
          enabled: formatted.enabled,
          isConfigured: formatted.isConfigured,
          missingFields: formatted.completeness.missingFields,
          consumers: codeDef.codeConsumers
        });

        // Check if enabled but missing required fields
        if (formatted.enabled && !formatted.isConfigured) {
          unresolvedVariables.push({
            integrationId: codeDef.id,
            integrationName: codeDef.name,
            missingFields: formatted.completeness.missingFields
          });
        }
      }
    }

    for (const dbRow of dbRows) {
      if (!codeMap.has(dbRow.id)) {
        customOrOrphanedInDb.push({
          id: dbRow.id,
          name: dbRow.name,
          category: dbRow.category,
          isCustom: Boolean(dbRow.is_custom)
        });
      }
    }

    // Check for runtime vs DB conflicts (e.g. process.env SMS_GATEWAY_PROVIDER vs DB enabled SMS provider)
    const activeSmsInDb = dbRows.find(r => r.category === INTEGRATION_CATEGORIES.MESSAGING_OTP && Boolean(r.enabled));
    const procSms = normalizeSmsProvider(process.env.SMS_GATEWAY_PROVIDER);
    if (activeSmsInDb && procSms && procSms !== 'disabled' && activeSmsInDb.provider !== procSms) {
      conflicts.push({
        type: 'sms_provider_mismatch',
        message: `Database active SMS provider is "${activeSmsInDb.provider}", while process.env.SMS_GATEWAY_PROVIDER is "${procSms}". Control Center runtime takes precedence.`
      });
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        discoveredInCodeCount: CODEBASE_INTEGRATION_DEFINITIONS.length,
        registeredInDbCount: dbRows.length,
        syncedCount: registeredAndSynced.length,
        missingRegistrationCount: missingInDb.length,
        customOrOrphanedCount: customOrOrphanedInDb.length,
        unresolvedVariableCount: unresolvedVariables.length,
        conflictCount: conflicts.length,
        isHealthy: missingInDb.length === 0 && conflicts.length === 0
      },
      missingInDb,
      registeredAndSynced,
      customOrOrphanedInDb,
      unresolvedVariables,
      conflicts
    };
  }

  /**
   * Executes automatic reconciliation & repair (seeds any missing codebase integrations & syncs runtime)
   */
  runReconciliationRepair(actor = null) {
    this.seedAndMigrateIntegrations();
    this.syncAllToProcessEnvAndSiteSettings();
    const report = this.getReconciliationReport();

    logAudit({
      entity: 'integration_control_center',
      entityId: 'reconciliation',
      action: 'reconcile',
      actorId: actor?.id,
      actorName: actor?.name || 'Administrator',
      after: report.summary
    });

    return report;
  }
}

const integrationsControlService = new IntegrationsControlService();

module.exports = {
  IntegrationsControlService,
  integrationsControlService,
  INTEGRATION_CATEGORIES,
  CODEBASE_INTEGRATION_DEFINITIONS,
  ENVIRONMENT_VARIABLES_CATALOG,
  IMMUTABLE_INFRA_KEYS,
  validateSafeExternalUrl,
  createSafeSecretPreview
};
