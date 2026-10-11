/**
 * Central server-side permission policy.
 *
 * Every non-public /api endpoint is mapped to a permission key here and enforced by
 * a single middleware (requirePermission) BEFORE the route handlers run. The UI only hides
 * what a user cannot do; this is the enforcement point.
 *
 * Public endpoints (catalog reads, checkout, quote/service submission, auth, customer
 * self-service) are intentionally not listed.
 */

const { requirePermission } = require('./auth');
const { PERMISSIONS: P } = require('../shared/permissions');

const W = ['POST', 'PUT', 'PATCH'];
const ANY = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// [methods, path regex, permission]. First match wins.
const RULES = [
  // Public endpoints under catalog paths
  [['POST'], /^\/packages\/calculate-price$/, null],

  // Catalog
  [['DELETE'], /^\/(products|categories|brands|packages)\/[^/]+$/, P.CATALOG_ARCHIVE],
  [['POST'], /^\/(products|categories|brands)\/[^/]+\/(archive|restore)$/, P.CATALOG_ARCHIVE],
  [W, /^\/(products|categories|brands|packages)(\/|$)/, P.CATALOG_WRITE],
  [['POST', 'DELETE'], /^\/(admin\/)?spec-templates/, P.CATALOG_WRITE],
  [['GET'], /^\/admin\/spec-templates/, P.CATALOG_READ],
  [['PUT'], /^\/admin\/package-series/, P.CATALOG_WRITE],
  [ANY, /^\/admin\/package-series/, P.CATALOG_WRITE],
  [['PUT'], /^\/admin\/package-system-types/, P.CATALOG_WRITE],
  [ANY, /^\/admin\/package-system-types/, P.CATALOG_WRITE],

  // Orders
  [['GET'], /^\/orders$/, P.ORDERS_READ],
  [['PUT'], /^\/orders\/[^/]+\/(status|payment)$/, P.ORDERS_UPDATE],

  // Customers (admin side only)
  [['GET'], /^\/(admin\/)?customers/, P.CUSTOMERS_READ],
  [['POST'], /^\/(admin\/)?customers\/[^/]+\/(archive|restore)$/, P.CUSTOMERS_WRITE],
  [['POST', 'PUT', 'DELETE'], /^\/(admin\/)?customers/, P.CUSTOMERS_WRITE],

  // Quotes and services inbox
  [['GET', 'PUT'], /^\/quotes($|\/)/, P.QUOTES_MANAGE],
  [['GET'], /^\/(service-requests|services)$/, P.SERVICES_MANAGE],
  [['POST'], /^\/(admin\/)?(services|service-offerings)\/[^/]+\/(archive|restore)$/, P.SERVICES_MANAGE],
  [ANY, /^\/admin\/(service-offerings|services)/, P.SERVICES_MANAGE],

  // Website content
  [W.concat('DELETE'), /^\/(cms\/(hero-slides|sections|blog|projects|pages|testimonials|faqs)|projects|pages|testimonials|admin\/(projects|pages|testimonials))(\/|$)/, P.WEBSITE_CONTENT_WRITE],
  [ANY, /^\/admin\/redirects/, P.WEBSITE_REDIRECTS_WRITE],
  [['PUT'], /^\/settings$/, P.WEBSITE_SETTINGS_WRITE],
  [ANY, /^\/admin\/jobs/, P.WEBSITE_SETTINGS_WRITE],
  [['POST'], /^\/admin\/(clear-demo-data|reset-seeds)$/, P.ROLES_MANAGE],

  // Media
  [['POST', 'DELETE'], /^\/media(\/|$)/, P.MEDIA_WRITE],
  [['GET'], /^\/admin\/media/, P.MEDIA_WRITE],

  // Anything else under /admin requires website access
  [ANY, /^\/admin(\/|$)/, P.WEBSITE_ACCESS],
];

function findRequiredPermission(method, path) {
  for (const [methods, re, perm] of RULES) {
    if (methods.includes(method) && re.test(path)) return perm;
  }
  return null;
}

const PASSWORD_CHANGE_ALLOWED = [/^\/staff\/change-password$/, /^\/auth\/me$/, /^\/auth\/(admin\/|staff\/|customer\/)?logout$/, /^\/auth\/csrf$/];

/** Express middleware: enforce the policy table for this request. */
function enforcePolicy(req, res, next) {
  if (req.user && req.user.must_change_password && !PASSWORD_CHANGE_ALLOWED.some(re => re.test(req.path))) {
    return res.status(403).json({ error: 'Password change required before continuing.', code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  const perm = findRequiredPermission(req.method, req.path);
  if (!perm) return next();
  return requirePermission(perm)(req, res, next);
}

module.exports = { RULES, findRequiredPermission, enforcePolicy };
