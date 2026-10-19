/**
 * Authentication, RBAC, and Security Middlewares
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const db = require('../../database');
const { PERMISSIONS, hasPermission, isKnownPermission, canonicalizePermission } = require('../shared/permissions');

// 1. Rate Limiters
const isProd = process.env.NODE_ENV === 'production';
const skipInTest = () => process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT || (isProd ? '600' : '50000'), 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Too many requests, please slow down.' }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => `${req.ip}_${(req.body?.email || '').trim().toLowerCase()}`,
  message: { error: 'Too many login attempts. Please wait 1 minute before trying again.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.REGISTER_RATE_LIMIT || (isProd ? '10' : '1000'), 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Too many registration attempts. Please wait 1 minute before trying again.' }
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.SUBMISSION_RATE_LIMIT || (isProd ? '20' : '1000'), 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Submission limit reached. Please wait a moment.' }
});

const authLimiter = loginLimiter;

// 2. CSRF Cookie Helper
function issueCsrfCookie(res) {
  const csrfToken = crypto.randomBytes(16).toString('hex');
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('camnex_csrf', csrfToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
  return csrfToken;
}

// 3. Session Management
function createSession(userId, role, email, name, res, app = 'storefront') {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    db.prepare(`
      INSERT INTO sessions (id, user_id, role, email, name, app, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(token, userId, role, email, name, app, expiresAt);
  } catch (err) {
    // Fallback if app column somehow missing in older table
    db.prepare(`
      INSERT INTO sessions (id, user_id, role, email, name, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, userId, role, email, name, expiresAt);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };

  if (app === 'admin') {
    res.cookie('camnex_admin_session', token, cookieOpts);
    // Also set camnex_session for legacy tests expecting camnex_session cookie header
    res.cookie('camnex_session', token, cookieOpts);
  } else if (app === 'staff') {
    res.cookie('camnex_staff_session', token, cookieOpts);
  } else {
    res.cookie('camnex_session', token, cookieOpts);
  }

  const csrfToken = issueCsrfCookie(res);
  return { sessionToken: token, csrfToken };
}

function destroySession(token, res, app = 'all') {
  if (token) {
    try {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    } catch (_) {}
  }
  if (app === 'admin' || app === 'all') res.clearCookie('camnex_admin_session', { path: '/' });
  if (app === 'staff' || app === 'all') res.clearCookie('camnex_staff_session', { path: '/' });
  if (app === 'storefront' || app === 'all') res.clearCookie('camnex_session', { path: '/' });
  res.clearCookie('camnex_csrf', { path: '/' });
}

// 4. Authenticate Middleware
async function authenticate(req, res, next) {
  let token = null;

  // Determine token from cookie or Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const url = req.originalUrl || req.url || '';
    if (url.includes('/staff') || url.includes('/api/v1/staff')) {
      token = req.cookies?.camnex_staff_session;
    } else if (url.includes('/admin') || url.includes('/api/v1/admin')) {
      token = req.cookies?.camnex_admin_session || req.cookies?.camnex_session;
    } else {
      token = req.cookies?.camnex_session || req.cookies?.camnex_admin_session || req.cookies?.camnex_staff_session;
    }
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const session = await db.prepare(`
      SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')
    `).get(token);

    if (!session) {
      req.user = null;
      return next();
    }

    if (session.role === 'customer') {
      const customer = await db.prepare(`SELECT * FROM customers WHERE id = ?`).get(session.user_id);
      if (customer && customer.is_archived) {
        req.user = null;
        return next();
      }
      req.user = {
        id: session.user_id,
        role: 'customer',
        email: session.email,
        name: session.name,
        permissions: []
      };
      return next();
    }

    // Staff / User lookup
    const user = await db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.user_id);
    if (!user || user.status === 'disabled') {
      req.user = null;
      return next();
    }

    // Collect effective permissions
    let permissions = [];
    if (user.role === 'admin' || user.role === 'super-admin') {
      permissions = Object.values(PERMISSIONS);
    } else {
      try {
        const userRoles = await db.prepare(`
          SELECT r.id, r.name FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ?
        `).all(user.id);

        const permRows = await db.prepare(`
          SELECT DISTINCT rp.permission_key
          FROM role_permissions rp
          JOIN user_roles ur ON rp.role_id = ur.role_id
          WHERE ur.user_id = ?
        `).all(user.id);

        permissions = permRows.map(p => p.permission_key);
        if (permissions.length === 0 && user.role === 'admin') {
          permissions = Object.values(PERMISSIONS);
        }
      } catch (_) {
        permissions = user.role === 'admin' ? Object.values(PERMISSIONS) : [];
      }
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      permissions,
      status: user.status,
      must_change_password: !!user.must_change_password,
      branch_id: user.branch_id,
      warehouse_id: user.warehouse_id
    };
  } catch (err) {
    req.user = null;
  }
  next();
}

// 5. Permission & Access Checks
function requirePermission(permissionKey) {
  const canonical = canonicalizePermission(permissionKey);
  if (!isKnownPermission(canonical)) {
    throw new Error(`CRITICAL SECURITY CONFIG: Unknown permission key "${permissionKey}" provided to requirePermission()`);
  }
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied: Authentication required.' });
    }
    if (!hasPermission(req.user, canonical)) {
      return res.status(403).json({ 
        error: `Access denied: Missing required permission [${canonical}].` 
      });
    }
    next();
  };
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  if (req.user.role === 'admin' || req.user.role === 'super-admin' || 
      hasPermission(req.user, PERMISSIONS.WEBSITE_ACCESS) ||
      hasPermission(req.user, PERMISSIONS.STAFF_ACCESS)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
}

function requireCustomer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in to continue.' });
  }
  next();
}

function requireWebsiteAccess(req, res, next) {
  if (!req.user || !hasPermission(req.user, PERMISSIONS.WEBSITE_ACCESS)) {
    return res.status(403).json({ error: 'Access denied: Website manager privileges required.' });
  }
  next();
}

function requireStaffAccess(req, res, next) {
  if (!req.user || !hasPermission(req.user, PERMISSIONS.STAFF_ACCESS)) {
    return res.status(403).json({ error: 'Access denied: Staff application privileges required.' });
  }
  next();
}

// 6. CSRF Protection
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const hasSessionCookie = req.cookies?.camnex_session || 
                           req.cookies?.camnex_admin_session || 
                           req.cookies?.camnex_staff_session;

  if (hasSessionCookie) {
    const csrfHeader = req.headers['x-csrf-token'];
    const csrfCookie = req.cookies?.camnex_csrf;
    if (csrfCookie && csrfHeader && csrfHeader === csrfCookie) {
      return next();
    }
    return res.status(403).json({ error: 'Security verification failed: Invalid or missing CSRF token.' });
  }
  next();
}

// 7. Strip Sensitive Cost Fields Helper
function stripCostFields(data, user) {
  if (hasPermission(user, PERMISSIONS.PRICING_COST_READ)) {
    return data;
  }
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => stripCostFields(item, user));
  }
  if (typeof data === 'object') {
    const sanitized = { ...data };
    delete sanitized.cost_price;
    delete sanitized.cost;
    delete sanitized.purchase_cost;
    delete sanitized.supplier_cost;
    delete sanitized.costPrice;
    delete sanitized.purchasePrice;
    delete sanitized.purchaseCost;
    delete sanitized.supplierCost;
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = stripCostFields(sanitized[key], user);
      }
    }
    return sanitized;
  }
  return data;
}

// Response filter: strip purchase-cost fields from every JSON response unless pricing.cost.read is granted
function costFieldFilter(req, res, next) {
  const original = res.json.bind(res);
  res.json = (body) => original(stripCostFields(body, req.user));
  next();
}

// 8. Body Validation
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  submissionLimiter,
  issueCsrfCookie,
  createSession,
  destroySession,
  authenticate,
  requirePermission,
  requireAdmin,
  requireCustomer,
  requireWebsiteAccess,
  requireStaffAccess,
  csrfProtection,
  stripCostFields,
  costFieldFilter,
  validateBody
};

