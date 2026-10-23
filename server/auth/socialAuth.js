const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../../database');
const { createSession } = require('../../auth');
const { getSmsGatewayConfig, getSmsGatewaySafeDiagnostic, normalizeSmsProvider } = require('../shared/envHelper');

const BUILD_IDENTIFIER = '20261024-sms-v4';

/**
 * Returns configuration status of external authentication providers.
 * Allows frontend to know whether Google, Apple, or SMS OTP are configured on this server.
 */
function getProvidersStatus() {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const appleConfigured = !!(process.env.APPLE_CLIENT_ID && (process.env.APPLE_PRIVATE_KEY || process.env.APPLE_CLIENT_SECRET));
  const smsCfg = getSmsGatewayConfig();

  return {
    buildId: BUILD_IDENTIFIER,
    google: {
      configured: googleConfigured,
      clientId: googleConfigured ? process.env.GOOGLE_CLIENT_ID : null
    },
    apple: {
      configured: appleConfigured,
      clientId: appleConfigured ? process.env.APPLE_CLIENT_ID : null
    },
    smsOtp: {
      configured: smsCfg.configured,
      provider: smsCfg.configured ? smsCfg.provider : null
    }
  };
}

function getBaseUrl(req) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, '');
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

/**
 * Clean & normalize Bangladesh phone number to canonical 11-digit format (01XXXXXXXXX)
 */
function normalizeBdPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^\+8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned.replace(/^\+88/, '');
  }
  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned.replace(/^88/, '');
  }
  return null;
}

// ============================================================================
// 1. GOOGLE OAUTH 2.0 / OPENID CONNECT
// ============================================================================

function initiateGoogleAuth(req, res) {
  const status = getProvidersStatus();
  const wantsJson = req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json'));

  if (!status.google.configured) {
    if (wantsJson) {
      return res.status(503).json({
        success: false,
        configured: false,
        provider: 'Google',
        error: 'Google Sign-In is not configured yet. The site owner must supply GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server environment (.env).'
      });
    }
    return res.redirect('/account?error=google_not_configured&provider=Google');
  }

  const state = crypto.randomBytes(32).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  const redirectUrl = req.query.redirect || '/account';

  // Store state in SQLite with 15-minute expiry to defend against CSRF
  try {
    db.prepare(`
      INSERT INTO oauth_states (state, provider, nonce, redirect_url, expires_at)
      VALUES (?, 'google', ?, ?, datetime('now', '+15 minutes'))
    `).run(state, nonce, redirectUrl);
  } catch (err) {
    console.error('Failed to store OAuth state:', err);
  }

  // Also set HTTP-only cookie for client verification
  res.cookie('camnex_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });

  const redirectUri = `${getBaseUrl(req)}/api/auth/oauth/google/callback`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('prompt', 'select_account');

  res.redirect(authUrl.toString());
}

async function handleGoogleCallback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    if (error === 'access_denied') {
      return res.redirect('/account?error=oauth_cancelled');
    }
    return res.redirect(`/account?error=oauth_failed&detail=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect('/account?error=missing_code_or_state');
  }

  // Validate state from database and cookie
  const cookieState = req.cookies?.camnex_oauth_state;
  res.clearCookie('camnex_oauth_state', { path: '/' });

  const stateRow = db.prepare(`
    SELECT * FROM oauth_states
    WHERE state = ? AND provider = 'google' AND expires_at > datetime('now')
  `).get(state);

  if (!stateRow || (cookieState && cookieState !== state)) {
    return res.redirect('/account?error=oauth_invalid_state');
  }

  // Delete consumed state
  db.prepare(`DELETE FROM oauth_states WHERE state = ?`).run(state);
  const targetRedirect = stateRow.redirect_url || '/account';

  try {
    const redirectUri = `${getBaseUrl(req)}/api/auth/oauth/google/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Google token exchange error:', errBody);
      return res.redirect('/account?error=oauth_token_exchange_failed');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch verified profile from Google UserInfo
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userinfoRes.ok) {
      return res.redirect('/account?error=oauth_userinfo_failed');
    }

    const userinfo = await userinfoRes.json();
    const googleSub = userinfo.sub;
    const email = userinfo.email ? userinfo.email.trim().toLowerCase() : null;
    const emailVerified = userinfo.email_verified === true || userinfo.email_verified === 'true';
    const name = userinfo.name || userinfo.given_name || 'Customer';

    if (!email) {
      return res.redirect('/account?error=oauth_missing_email');
    }

    // Safety rule: Never auto-merge or authenticate unverified emails
    if (!emailVerified) {
      return res.redirect('/account?error=oauth_email_unverified');
    }

    // 3. Process Account Linking & Login
    const customer = linkOrRegisterOAuthCustomer({
      provider: 'google',
      providerUserId: googleSub,
      email,
      name,
      emailVerified: 1,
      rawData: userinfo
    });

    // Issue session
    createSession(customer.id, 'customer', customer.email || '', customer.name, res);

    const separator = targetRedirect.includes('?') ? '&' : '?';
    return res.redirect(`${targetRedirect}${separator}login_success=1`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect('/account?error=oauth_internal_error');
  }
}

// ============================================================================
// 2. APPLE SIGN-IN
// ============================================================================

function initiateAppleAuth(req, res) {
  const status = getProvidersStatus();
  const wantsJson = req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json'));

  if (!status.apple.configured) {
    if (wantsJson) {
      return res.status(503).json({
        success: false,
        configured: false,
        provider: 'Apple',
        error: 'Apple Sign-In is not configured yet. The site owner must supply APPLE_CLIENT_ID and Apple credentials in the server environment (.env).'
      });
    }
    return res.redirect('/account?error=apple_not_configured&provider=Apple');
  }

  const state = crypto.randomBytes(32).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  const redirectUrl = req.query.redirect || '/account';

  try {
    db.prepare(`
      INSERT INTO oauth_states (state, provider, nonce, redirect_url, expires_at)
      VALUES (?, 'apple', ?, ?, datetime('now', '+15 minutes'))
    `).run(state, nonce, redirectUrl);
  } catch (err) {
    console.error('Failed to store Apple OAuth state:', err);
  }

  res.cookie('camnex_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });

  const redirectUri = `${getBaseUrl(req)}/api/auth/oauth/apple/callback`;
  const authUrl = new URL('https://appleid.apple.com/auth/authorize');
  authUrl.searchParams.set('client_id', process.env.APPLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code id_token');
  authUrl.searchParams.set('response_mode', 'form_post');
  authUrl.searchParams.set('scope', 'name email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);

  res.redirect(authUrl.toString());
}

async function handleAppleCallback(req, res) {
  const { code, state, id_token, error, user: userJson } = req.body || {};

  if (error) {
    if (error === 'user_cancelled_authorize') {
      return res.redirect('/account?error=oauth_cancelled');
    }
    return res.redirect(`/account?error=apple_auth_failed&detail=${encodeURIComponent(error)}`);
  }

  if (!state || (!code && !id_token)) {
    return res.redirect('/account?error=missing_code_or_state');
  }

  const stateRow = db.prepare(`
    SELECT * FROM oauth_states
    WHERE state = ? AND provider = 'apple' AND expires_at > datetime('now')
  `).get(state);

  if (!stateRow) {
    return res.redirect('/account?error=oauth_invalid_state');
  }

  db.prepare(`DELETE FROM oauth_states WHERE state = ?`).run(state);
  const targetRedirect = stateRow.redirect_url || '/account';

  try {
    // In standard Apple Sign-In with form_post, the id_token JWT contains the verified identity claims.
    if (!id_token) {
      return res.redirect('/account?error=apple_missing_id_token');
    }

    // Decode JWT payload (Apple standard format: header.payload.signature)
    const parts = id_token.split('.');
    if (parts.length < 2) {
      return res.redirect('/account?error=apple_invalid_jwt');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const appleSub = payload.sub;
    const email = payload.email ? payload.email.trim().toLowerCase() : null;
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

    // Parse user name if Apple provided it (sent only on first login)
    let customerName = 'Apple Customer';
    if (userJson) {
      try {
        const u = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
        if (u.name) {
          const parts = [u.name.firstName, u.name.lastName].filter(Boolean);
          if (parts.length > 0) customerName = parts.join(' ');
        }
      } catch (_) {}
    }

    if (!email) {
      return res.redirect('/account?error=apple_missing_email');
    }

    if (!emailVerified) {
      return res.redirect('/account?error=oauth_email_unverified');
    }

    const customer = linkOrRegisterOAuthCustomer({
      provider: 'apple',
      providerUserId: appleSub,
      email,
      name: customerName,
      emailVerified: 1,
      rawData: payload
    });

    createSession(customer.id, 'customer', customer.email || '', customer.name, res);

    const separator = targetRedirect.includes('?') ? '&' : '?';
    return res.redirect(`${targetRedirect}${separator}login_success=1`);
  } catch (err) {
    console.error('Apple OAuth callback error:', err);
    return res.redirect('/account?error=oauth_internal_error');
  }
}

// ============================================================================
// 3. CORE SAFE LINKING & ACCOUNT CREATION LOGIC
// ============================================================================

/**
 * Links a verified social identity to an existing customer with the same verified email,
 * or safely creates a new customer. Prevents duplicate accounts.
 */
function linkOrRegisterOAuthCustomer({ provider, providerUserId, email, name, emailVerified, rawData }) {
  // 1. Check if this social identity is already linked to a customer
  const linkedRow = db.prepare(`
    SELECT oa.customer_id, c.data_json
    FROM oauth_accounts oa
    JOIN customers c ON c.id = oa.customer_id
    WHERE oa.provider = ? AND oa.provider_user_id = ?
  `).get(provider, providerUserId);

  if (linkedRow) {
    return JSON.parse(linkedRow.data_json);
  }

  // 2. Check if an existing customer already has this exact verified email
  const existingCustRow = db.prepare(`
    SELECT * FROM customers
    WHERE email IS NOT NULL AND email != '' AND LOWER(email) = LOWER(?)
  `).get(email);

  if (existingCustRow) {
    // Safely link the social identity to this existing customer account
    const linkId = `oa-${provider}-${Date.now()}`;
    db.prepare(`
      INSERT INTO oauth_accounts (id, customer_id, provider, provider_user_id, email, email_verified, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(linkId, existingCustRow.id, provider, providerUserId, email, emailVerified ? 1 : 0, JSON.stringify(rawData || {}));

    if (emailVerified) {
      db.prepare(`UPDATE customers SET email_verified = 1 WHERE id = ?`).run(existingCustRow.id);
    }

    const parsedData = JSON.parse(existingCustRow.data_json);
    if (emailVerified) {
      parsedData.email_verified = true;
      parsedData.emailVerified = true;
    }
    return parsedData;
  }

  // 3. Create a brand new customer record safely
  const newCustId = `cust-${Date.now()}`;
  const custData = {
    id: newCustId,
    name: name || 'Customer',
    email: email.toLowerCase(),
    phone: undefined,
    customerType: 'individual',
    addresses: [],
    email_verified: emailVerified ? true : false,
    emailVerified: emailVerified ? true : false,
    phone_verified: false,
    phoneVerified: false,
    createdAt: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO customers (id, name, phone, email, customer_type, email_verified, phone_verified, data_json, created_at)
    VALUES (?, ?, NULL, ?, 'individual', ?, 0, ?, ?)
  `).run(newCustId, custData.name, email.toLowerCase(), emailVerified ? 1 : 0, JSON.stringify(custData), custData.createdAt);

  // Link social record
  const linkId = `oa-${provider}-${Date.now()}`;
  db.prepare(`
    INSERT INTO oauth_accounts (id, customer_id, provider, provider_user_id, email, email_verified, data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(linkId, newCustId, provider, providerUserId, email, emailVerified ? 1 : 0, JSON.stringify(rawData || {}));

  return custData;
}

// ============================================================================
// 4. PHONE NUMBER OTP VERIFICATION
// ============================================================================

/**
 * Sends a 6-digit verification code to a Bangladesh phone number via configured SMS gateway.
 * Enforces rate limits and abuse protection.
 */
async function sendPhoneOtp(req, res) {
  const { phone } = req.body || {};
  const cleanPhone = normalizeBdPhone(phone);

  if (!cleanPhone) {
    return res.status(400).json({
      error: 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01711000000).'
    });
  }

  const status = getProvidersStatus();
  if (!status.smsOtp.configured) {
    return res.status(503).json({
      success: false,
      configured: false,
      error: 'SMS OTP service is currently unconfigured. The site owner must supply SMS gateway credentials (e.g. SMS_GATEWAY_PROVIDER and SMS_API_KEY in .env) to enable phone OTP verification.'
    });
  }

  // Rate limiting per phone: max 3 requests per 10 minutes
  const recentCount = db.prepare(`
    SELECT count(*) as count FROM phone_otps
    WHERE phone = ? AND created_at > datetime('now', '-10 minutes')
  `).get(cleanPhone).count;

  if (recentCount >= 3) {
    return res.status(429).json({
      error: 'Too many OTP requests for this phone number. Please wait 10 minutes before requesting a new code.'
    });
  }

  // Generate cryptographically secure 6-digit OTP
  const otpCode = String(crypto.randomInt(100000, 999999));
  const otpHash = crypto.createHash('sha256').update(otpCode + (process.env.SESSION_SECRET || 'camnex_salt')).digest('hex');
  const otpId = `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  // Store hashed OTP with 5-minute expiry
  db.prepare(`
    INSERT INTO phone_otps (id, phone, code_hash, attempts, expires_at)
    VALUES (?, ?, ?, 0, datetime('now', '+5 minutes'))
  `).run(otpId, cleanPhone, otpHash);

  // Dispatch via real provider
  try {
    const smsCfg = getSmsGatewayConfig();
    const provider = smsCfg.provider || (process.env.SMS_GATEWAY_PROVIDER || '').trim().toLowerCase();
    const apiKey = smsCfg.apiKey || (process.env.SMS_API_KEY || '').trim();
    const senderId = smsCfg.senderId || (process.env.SMS_SENDER_ID || '8809648909250').trim();
    const message = `Your CamneX Bangladesh verification code is ${otpCode}. Valid for 5 minutes. Do not share this code.`;

    const timeoutMs = parseInt(process.env.SMS_TIMEOUT_MS || '8000', 10);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (provider === 'bulksmsbd' || provider === 'bulksms' || provider === 'bulksmsbd.net') {
        const apiUrl = process.env.BULKSMSBD_API_URL || process.env.SMS_GATEWAY_URL || 'https://bulksmsbd.net/api/smsapi';
        const formattedNumber = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

        const formData = new URLSearchParams();
        formData.append('api_key', apiKey);
        formData.append('type', 'text');
        formData.append('number', formattedNumber);
        formData.append('senderid', senderId || '8809648909250');
        formData.append('message', message);

        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
          signal: controller.signal
        });

        if (!apiRes.ok) {
          try { db.prepare(`DELETE FROM phone_otps WHERE id = ?`).run(otpId); } catch (_) {}
          console.error(`[SMS GATEWAY] BulkSMSBD returned HTTP status ${apiRes.status}`);
          return res.status(502).json({
            error: 'SMS gateway service returned an error status. Please try again or use password sign-in.'
          });
        }

        const textResponse = await apiRes.text();
        let data = null;
        try {
          data = JSON.parse(textResponse);
        } catch (_) {
          data = { raw: textResponse };
        }

        const responseCode = data?.response_code !== undefined ? String(data.response_code) : null;
        const isSuccess = responseCode === '202' || Boolean(data?.success_message && !data?.error_message);

        if (!isSuccess) {
          try { db.prepare(`DELETE FROM phone_otps WHERE id = ?`).run(otpId); } catch (_) {}
          console.warn(`[SMS GATEWAY REJECTED] BulkSMSBD rejected SMS dispatch. Response code: ${responseCode || 'unknown'}`);
          let clientErrMsg = 'Failed to deliver SMS verification code. Please check your phone number or try password sign-in.';
          if (responseCode === '1002') {
            clientErrMsg = 'SMS gateway configuration error: Sender ID is not approved or inactive.';
          } else if (responseCode === '1006' || responseCode === '1007') {
            clientErrMsg = 'SMS service temporarily unavailable due to gateway balance. Please use password sign-in.';
          } else if (responseCode === '1003' || responseCode === '1011') {
            clientErrMsg = 'SMS gateway authentication failed. Please contact the administrator.';
          }
          return res.status(502).json({
            error: clientErrMsg,
            code: 'SMS_GATEWAY_REJECTED'
          });
        }

        console.log(`[SMS GATEWAY SUCCESS] OTP SMS submitted via BulkSMSBD (Code: ${responseCode || 202})`);
      } else if (provider === 'greenweb') {
        const apiRes = await fetch('https://api.greenweb.com.bd/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: apiKey,
            to: cleanPhone,
            message
          }),
          signal: controller.signal
        });
        if (!apiRes.ok) throw new Error(`Greenweb HTTP ${apiRes.status}`);
      } else if (provider === 'mimsms') {
        const apiRes = await fetch('https://esms.mimsms.com/smsapi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            api_key: apiKey,
            type: 'text',
            contacts: cleanPhone,
            senderid: senderId || 'CamneX',
            msg: message
          }),
          signal: controller.signal
        });
        if (!apiRes.ok) throw new Error(`MimSMS HTTP ${apiRes.status}`);
      } else if (provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = apiKey;
        const fromNumber = senderId;
        const apiRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
          },
          body: new URLSearchParams({
            To: `+88${cleanPhone}`,
            From: fromNumber,
            Body: message
          }),
          signal: controller.signal
        });
        if (!apiRes.ok) throw new Error(`Twilio HTTP ${apiRes.status}`);
      } else {
        return res.status(503).json({
          error: `Configured SMS provider '${provider}' is not supported. Supported providers are bulksmsbd, greenweb, mimsms, twilio.`
        });
      }
    } finally {
      clearTimeout(timer);
    }

    return res.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your mobile phone.'
    });
  } catch (err) {
    try { db.prepare(`DELETE FROM phone_otps WHERE id = ?`).run(otpId); } catch (_) {}
    if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
      console.warn('[SMS GATEWAY TIMEOUT] SMS dispatch request timed out');
      return res.status(504).json({
        error: 'SMS gateway service timed out. Please check your connection and retry.'
      });
    }
    console.error('[SMS GATEWAY ERROR] Failed to dispatch SMS OTP:', err.message);
    return res.status(502).json({
      error: 'Failed to send SMS through the gateway provider. Please try again or use password sign-in.'
    });
  }
}

/**
 * Verifies a 6-digit OTP code and logs in or creates the customer account.
 */
function verifyPhoneOtp(req, res) {
  const { phone, code } = req.body || {};
  const cleanPhone = normalizeBdPhone(phone);
  const cleanCode = (code || '').trim();

  if (!cleanPhone || !/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({ error: 'Please enter a valid phone number and 6-digit OTP code.' });
  }

  // Find latest active OTP for this phone
  const otpRow = db.prepare(`
    SELECT * FROM phone_otps
    WHERE phone = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(cleanPhone);

  if (!otpRow) {
    return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
  }

  if (otpRow.attempts >= 5) {
    db.prepare(`DELETE FROM phone_otps WHERE id = ?`).run(otpRow.id);
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
  }

  // Verify hash
  const expectedHash = crypto.createHash('sha256').update(cleanCode + (process.env.SESSION_SECRET || 'camnex_salt')).digest('hex');
  if (otpRow.code_hash !== expectedHash) {
    db.prepare(`UPDATE phone_otps SET attempts = attempts + 1 WHERE id = ?`).run(otpRow.id);
    return res.status(400).json({ error: 'Invalid verification code. Please check your SMS and try again.' });
  }

  // Code verified! Invalidate used OTP
  db.prepare(`DELETE FROM phone_otps WHERE phone = ?`).run(cleanPhone);

  // If an authenticated customer is performing phone verification
  const loggedInCustId = req.user?.id;

  // Find existing customer by phone or create new one
  let customerRow = db.prepare(`SELECT * FROM customers WHERE phone = ?`).get(cleanPhone);
  if (!customerRow && loggedInCustId) {
    customerRow = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(loggedInCustId);
  }

  let customer;

  if (customerRow) {
    db.prepare(`
      UPDATE customers
      SET phone_verified = 1,
          phone = COALESCE(phone, ?)
      WHERE id = ?
    `).run(cleanPhone, customerRow.id);

    customer = JSON.parse(customerRow.data_json);
    customer.phone_verified = true;
    customer.phoneVerified = true;
    customer.phone = customer.phone || cleanPhone;
    customer.email_verified = customerRow.email_verified === 1;
    customer.emailVerified = customerRow.email_verified === 1;

    db.prepare(`UPDATE customers SET data_json = ? WHERE id = ?`).run(JSON.stringify(customer), customerRow.id);
  } else {
    // Create customer with verified phone
    const newId = `cust-${Date.now()}`;
    customer = {
      id: newId,
      name: `Customer (${cleanPhone.slice(-4)})`,
      phone: cleanPhone,
      email: undefined,
      customerType: 'individual',
      addresses: [],
      phone_verified: true,
      phoneVerified: true,
      email_verified: false,
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO customers (id, name, phone, email, customer_type, phone_verified, email_verified, data_json, created_at)
      VALUES (?, ?, ?, NULL, 'individual', 1, 0, ?, ?)
    `).run(newId, customer.name, cleanPhone, JSON.stringify(customer), customer.createdAt);
  }

  const { csrfToken } = createSession(customer.id, 'customer', customer.email || '', customer.name, res);

  res.json({
    success: true,
    customer,
    csrfToken
  });
}

module.exports = {
  getProvidersStatus,
  getSmsGatewaySafeDiagnostic,
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateAppleAuth,
  handleAppleCallback,
  sendPhoneOtp,
  verifyPhoneOtp,
  linkOrRegisterOAuthCustomer
};

