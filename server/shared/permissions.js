/**
 * Server Permissions & Role Registry (CommonJS)
 * Single Source of Truth for RBAC across the Business API.
 */

const PERMISSIONS = {
  // Website Administration
  WEBSITE_ACCESS: 'website.access',
  WEBSITE_CONTENT_WRITE: 'website.content.write',
  WEBSITE_SEO_WRITE: 'website.seo.write',
  WEBSITE_REDIRECTS_WRITE: 'website.redirects.write',
  WEBSITE_SETTINGS_WRITE: 'website.settings.write',
  MEDIA_WRITE: 'media.write',

  // Catalog & Products
  CATALOG_READ: 'catalog.read',
  CATALOG_WRITE: 'catalog.write',
  CATALOG_ARCHIVE: 'catalog.archive',

  // Pricing & Commercial
  PRICING_WRITE: 'pricing.write',
  PRICING_COST_READ: 'pricing.cost.read',

  // Inventory & Stock
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ADJUST: 'inventory.adjust',

  // Orders & Commercial Operations
  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',

  // Customers & CRM
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_WRITE: 'customers.write',

  // Quotes & Field Services
  QUOTES_MANAGE: 'quotes.manage',
  SERVICES_MANAGE: 'services.manage',

  // Staff & Identity Management
  STAFF_ACCESS: 'staff.access',
  STAFF_MANAGE: 'staff.manage',
  ROLES_MANAGE: 'roles.manage',

  // Audit & System Maintenance
  AUDIT_READ: 'audit.read',
  SYSTEM_MAINTENANCE: 'system.maintenance',

  // Reserved Phase 2 Keys (Registered, but not enforced until Phase 2)
  POS_SELL: 'pos.sell',
  POS_REFUND: 'pos.refund',
  PURCHASING_READ: 'purchasing.read',
  PURCHASING_WRITE: 'purchasing.write',
  PURCHASING_RECEIVE: 'purchasing.receive',
  ACCOUNTING_READ: 'accounting.read',
  ACCOUNTING_WRITE: 'accounting.write',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export'
};

const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Unrestricted full access across all modules, surfaces, and security administration',
    isSystem: 1,
    permissions: Object.values(PERMISSIONS)
  },
  WEBSITE_MANAGER: {
    id: 'role-website-manager',
    name: 'Website Manager',
    description: 'Manages website content, catalog presentation, pricing, orders, and customer inquiries',
    isSystem: 1,
    permissions: [
      PERMISSIONS.WEBSITE_ACCESS,
      PERMISSIONS.WEBSITE_CONTENT_WRITE,
      PERMISSIONS.WEBSITE_SEO_WRITE,
      PERMISSIONS.WEBSITE_REDIRECTS_WRITE,
      PERMISSIONS.WEBSITE_SETTINGS_WRITE,
      PERMISSIONS.MEDIA_WRITE,
      PERMISSIONS.CATALOG_READ,
      PERMISSIONS.CATALOG_WRITE,
      PERMISSIONS.CATALOG_ARCHIVE,
      PERMISSIONS.PRICING_WRITE,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.QUOTES_MANAGE,
      PERMISSIONS.SERVICES_MANAGE
    ]
  },
  CONTENT_EDITOR: {
    id: 'role-content-editor',
    name: 'Content Editor',
    description: 'Manages marketing pages, blog articles, projects showcase, and testimonials',
    isSystem: 1,
    permissions: [
      PERMISSIONS.WEBSITE_ACCESS,
      PERMISSIONS.WEBSITE_CONTENT_WRITE,
      PERMISSIONS.MEDIA_WRITE
    ]
  },
  CATALOG_MANAGER: {
    id: 'role-catalog-manager',
    name: 'Catalog Manager',
    description: 'Manages technical product specifications, commercial catalog, pricing, and stock visibility',
    isSystem: 1,
    permissions: [
      PERMISSIONS.WEBSITE_ACCESS,
      PERMISSIONS.STAFF_ACCESS,
      PERMISSIONS.CATALOG_READ,
      PERMISSIONS.CATALOG_WRITE,
      PERMISSIONS.CATALOG_ARCHIVE,
      PERMISSIONS.PRICING_WRITE,
      PERMISSIONS.PRICING_COST_READ,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.MEDIA_WRITE
    ]
  },
  SALES_STAFF: {
    id: 'role-sales-staff',
    name: 'Sales Staff',
    description: 'Processes sales orders, manages customer requests, quotations, and callback requests',
    isSystem: 1,
    permissions: [
      PERMISSIONS.STAFF_ACCESS,
      PERMISSIONS.CATALOG_READ,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.CUSTOMERS_WRITE,
      PERMISSIONS.QUOTES_MANAGE,
      PERMISSIONS.SERVICES_MANAGE
    ]
  },
  SUPPORT_STAFF: {
    id: 'role-support-staff',
    name: 'Support Staff',
    description: 'Reviews customer order tracking, warranty claims, and field technician dispatch',
    isSystem: 1,
    permissions: [
      PERMISSIONS.STAFF_ACCESS,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.SERVICES_MANAGE
    ]
  }
};

const VALID_PERMISSIONS_SET = new Set(Object.values(PERMISSIONS));

const PERMISSION_ALIASES = {
  // Legacy underscore and legacy variations mapped to dotted canonical
  'website_access': PERMISSIONS.WEBSITE_ACCESS,
  'website_content.write': PERMISSIONS.WEBSITE_CONTENT_WRITE,
  'website_content_write': PERMISSIONS.WEBSITE_CONTENT_WRITE,
  'website_seo.write': PERMISSIONS.WEBSITE_SEO_WRITE,
  'website_seo_write': PERMISSIONS.WEBSITE_SEO_WRITE,
  'website_redirects.write': PERMISSIONS.WEBSITE_REDIRECTS_WRITE,
  'website_redirects_write': PERMISSIONS.WEBSITE_REDIRECTS_WRITE,
  'website_settings.write': PERMISSIONS.WEBSITE_SETTINGS_WRITE,
  'website_settings_write': PERMISSIONS.WEBSITE_SETTINGS_WRITE,
  'media_write': PERMISSIONS.MEDIA_WRITE,
  'catalog_read': PERMISSIONS.CATALOG_READ,
  'catalog_write': PERMISSIONS.CATALOG_WRITE,
  'catalog_archive': PERMISSIONS.CATALOG_ARCHIVE,
  'pricing_write': PERMISSIONS.PRICING_WRITE,
  'pricing_cost_read': PERMISSIONS.PRICING_COST_READ,
  'pricing_cost.read': PERMISSIONS.PRICING_COST_READ,
  'inventory_read': PERMISSIONS.INVENTORY_READ,
  'inventory_adjust': PERMISSIONS.INVENTORY_ADJUST,
  'orders_read': PERMISSIONS.ORDERS_READ,
  'orders_update': PERMISSIONS.ORDERS_UPDATE,
  'orders.status.update': PERMISSIONS.ORDERS_UPDATE,
  'orders_status_update': PERMISSIONS.ORDERS_UPDATE,
  'orders.payment.verify': PERMISSIONS.ORDERS_UPDATE,
  'orders_payment_verify': PERMISSIONS.ORDERS_UPDATE,
  'customers_read': PERMISSIONS.CUSTOMERS_READ,
  'customers_write': PERMISSIONS.CUSTOMERS_WRITE,
  'quotes_manage': PERMISSIONS.QUOTES_MANAGE,
  'services_manage': PERMISSIONS.SERVICES_MANAGE,
  'staff_access': PERMISSIONS.STAFF_ACCESS,
  'staff_manage': PERMISSIONS.STAFF_MANAGE,
  'roles_manage': PERMISSIONS.ROLES_MANAGE,
  'audit_read': PERMISSIONS.AUDIT_READ,
  'system_maintenance': PERMISSIONS.SYSTEM_MAINTENANCE,
  'system.jobs.manage': PERMISSIONS.WEBSITE_SETTINGS_WRITE,
  'analytics.read': PERMISSIONS.WEBSITE_ACCESS,
  'analytics_read': PERMISSIONS.WEBSITE_ACCESS
};

function canonicalizePermission(key) {
  if (!key || typeof key !== 'string') return key;
  const trimmed = key.trim();
  if (PERMISSION_ALIASES[trimmed]) return PERMISSION_ALIASES[trimmed];
  return trimmed;
}

function isKnownPermission(key) {
  if (!key || typeof key !== 'string') return false;
  const canonical = canonicalizePermission(key);
  return VALID_PERMISSIONS_SET.has(canonical);
}

function hasPermission(userOrPermissions, required) {
  if (!userOrPermissions) return false;
  const canonicalRequired = canonicalizePermission(required);
  if (!Array.isArray(userOrPermissions)) {
    const u = userOrPermissions;
    if (u.role === 'admin' || u.role === 'super-admin') return true;
    return hasPermission(u.permissions, canonicalRequired);
  }
  if (userOrPermissions.includes('*')) return true;
  return userOrPermissions.some(p => canonicalizePermission(p) === canonicalRequired);
}

module.exports = {
  PERMISSIONS,
  VALID_PERMISSIONS_SET,
  PERMISSION_ALIASES,
  SYSTEM_ROLES,
  canonicalizePermission,
  isKnownPermission,
  hasPermission
};

