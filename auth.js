const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const db = require('./database');

// ============================================================================
// 1. RATE LIMITERS
// ============================================================================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 1 minute before trying again.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please wait 1 minute before trying again.' }
});

const authLimiter = loginLimiter;

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission limit reached. Please wait a moment.' }
});

// ============================================================================
// 2. SESSION MANAGEMENT
// ============================================================================
function createSession(userId, role, email, name, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  db.prepare(`
    INSERT INTO sessions (id, user_id, role, email, name, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(token, userId, role, email, name, expiresAt);

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('camnex_session', token, {
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  // Also issue a CSRF cookie for client-side header inclusion
  const csrfToken = issueCsrfCookie(res);

  return { sessionToken: token, csrfToken };
}

function destroySession(token, res) {
  if (token) {
    try {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    } catch (_) {}
  }
  res.clearCookie('camnex_session', { path: '/' });
  res.clearCookie('camnex_csrf', { path: '/' });
}

function issueCsrfCookie(res) {
  const csrfToken = crypto.randomBytes(16).toString('hex');
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('camnex_csrf', csrfToken, {
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
  return csrfToken;
}

// ============================================================================
// 3. AUTHENTICATION & RBAC MIDDLEWARES
// ============================================================================
function authenticate(req, res, next) {
  const token = req.cookies?.camnex_session;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const session = db.prepare(`
      SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')
    `).get(token);

    if (!session) {
      req.user = null;
      return next();
    }

    req.user = {
      id: session.user_id,
      role: session.role,
      email: session.email,
      name: session.name
    };
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
  }
  next();
}

function requireCustomer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in to continue.' });
  }
  next();
}

// CSRF verification on authenticated state-changing requests
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // If user is authenticated via session cookie, verify matching CSRF token
  if (req.cookies?.camnex_session) {
    const csrfHeader = req.headers['x-csrf-token'];
    const csrfCookie = req.cookies?.camnex_csrf;
    if (csrfCookie && csrfHeader && csrfHeader === csrfCookie) {
      return next();
    }
    return res.status(403).json({ error: 'Security verification failed: Invalid or missing CSRF token.' });
  }
  next();
}

// ============================================================================
// 4. STRICT UPLOAD VALIDATION (MAGIC BYTES / SIGNATURE CHECK)
// ============================================================================
function validateImageMagicBytes(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
    return false;
  } catch (err) {
    return false;
  }
}

// ============================================================================
// 5. ZOD SCHEMAS & VALIDATION HELPER
// ============================================================================
const schemas = {
  adminLogin: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  customerRegister: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(11, 'Phone must be at least 11 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal(''))
  }),

  customerLogin: z.object({
    identifier: z.string().min(3, 'Email or phone number is required'),
    password: z.string().min(1, 'Password is required')
  }),

  product: z.object({
    name: z.string().min(2, 'Product name is required'),
    modelNumber: z.string().min(1, 'Model number is required'),
    sku: z.string().min(1, 'SKU is required')
  }).passthrough(),

  category: z.object({
    name: z.string().min(2, 'Category name is required'),
    slug: z.string().min(1, 'Slug is required')
  }).passthrough(),

  brand: z.object({
    name: z.string().min(2, 'Brand name is required'),
    slug: z.string().min(1, 'Slug is required')
  }).passthrough(),

  specTemplate: z.object({
    name: z.string().min(2, 'Template name is required'),
    categorySlug: z.string().min(1, 'Category slug is required')
  }).passthrough(),

  package: z.object({
    name: z.string().min(2, 'Package name is required'),
    slug: z.string().min(1, 'Slug is required')
  }).passthrough(),

  order: z.object({
    customerName: z.string().min(2, 'Customer name is required'),
    customerPhone: z.string().min(11, 'Valid phone number is required'),
    deliveryAddress: z.string().min(3, 'Delivery address is required'),
    items: z.array(z.any()).min(1, 'Order must contain at least one item')
  }).passthrough(),

  quote: z.object({
    customerName: z.string().min(2, 'Name is required'),
    phone: z.string().min(11, 'Valid phone number is required'),
    serviceType: z.string().min(2, 'Service type is required')
  }).passthrough(),

  serviceRequest: z.object({
    customerName: z.string().min(2, 'Name is required'),
    phone: z.string().min(11, 'Valid phone number is required'),
    serviceType: z.string().min(2, 'Service type is required')
  }).passthrough(),

  heroSlide: z.object({
    title: z.string().min(1, 'Title is required')
  }).passthrough(),

  blogPost: z.object({
    title: z.string().min(2, 'Title is required'),
    slug: z.string().min(1, 'Slug is required')
  }).passthrough(),

  faqItem: z.object({
    question: z.string().min(3, 'Question is required'),
    answer: z.string().min(2, 'Answer is required')
  }).passthrough(),

  project: z.object({
    title: z.string().min(2, 'Project title is required'),
    slug: z.string().min(1, 'Project slug is required')
  }).passthrough(),

  cmsPage: z.object({
    title: z.string().min(2, 'Page title is required'),
    slug: z.string().min(1, 'Page slug is required')
  }).passthrough(),

  testimonial: z.object({
    client_name: z.string().min(2, 'Client name is required'),
    content: z.string().min(5, 'Review content is required')
  }).passthrough(),

  redirect: z.object({
    from_path: z.string().min(1, 'Source path is required'),
    to_path: z.string().min(1, 'Destination path is required')
  }).passthrough(),

  settings: z.record(z.any())
};

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues.map(i => `${i.path.join('.') || 'field'}: ${i.message}`).join(', ');
      return res.status(400).json({ error: `Validation Error: ${msg}` });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  submissionLimiter,
  createSession,
  destroySession,
  issueCsrfCookie,
  authenticate,
  requireAdmin,
  requireCustomer,
  csrfProtection,
  validateImageMagicBytes,
  schemas,
  validateBody
};
