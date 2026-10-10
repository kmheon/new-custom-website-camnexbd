/**
 * CamneX Permissions & Role Registry
 * Single Source of Truth for RBAC across API, Website Manager, and Staff App.
 */

export const PERMISSIONS = {
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

  // Audit Logs
  AUDIT_READ: 'audit.read',

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
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Website' | 'Catalog' | 'Pricing' | 'Inventory' | 'Sales & Orders' | 'Staff & Security' | 'System' | 'Phase 2 Reserved';
  description: string;
  isPhase2?: boolean;
}

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  // Website
  { key: PERMISSIONS.WEBSITE_ACCESS, label: 'Website Manager Access', category: 'Website', description: 'Log in and navigate the Website Manager interface' },
  { key: PERMISSIONS.WEBSITE_CONTENT_WRITE, label: 'Website Content Write', category: 'Website', description: 'Create and edit pages, blog, heroes, testimonials, and company profile' },
  { key: PERMISSIONS.WEBSITE_SEO_WRITE, label: 'Website SEO Write', category: 'Website', description: 'Manage metadata, JSON-LD schemas, and sitemap configuration' },
  { key: PERMISSIONS.WEBSITE_REDIRECTS_WRITE, label: 'Redirects Write', category: 'Website', description: 'Configure 301 and 302 URL redirects' },
  { key: PERMISSIONS.WEBSITE_SETTINGS_WRITE, label: 'Website Settings Write', category: 'Website', description: 'Modify top bar announcements, contact info, and website parameters' },
  { key: PERMISSIONS.MEDIA_WRITE, label: 'Media Library Write', category: 'Website', description: 'Upload, replace, and delete digital media files' },

  // Catalog
  { key: PERMISSIONS.CATALOG_READ, label: 'Catalog Read', category: 'Catalog', description: 'View products, categories, spec templates, and brands' },
  { key: PERMISSIONS.CATALOG_WRITE, label: 'Catalog Write', category: 'Catalog', description: 'Create and update products, categories, templates, and packages' },
  { key: PERMISSIONS.CATALOG_ARCHIVE, label: 'Catalog Archive', category: 'Catalog', description: 'Soft-delete or restore products, categories, and brands' },

  // Pricing
  { key: PERMISSIONS.PRICING_WRITE, label: 'Pricing Write', category: 'Pricing', description: 'Update selling prices, compare prices, and package tier amounts' },
  { key: PERMISSIONS.PRICING_COST_READ, label: 'Purchase Cost Read', category: 'Pricing', description: 'View internal wholesale purchase cost and gross profit baselines' },

  // Inventory
  { key: PERMISSIONS.INVENTORY_READ, label: 'Inventory Read', category: 'Inventory', description: 'View stock levels, warehouse allocations, and reorder points' },
  { key: PERMISSIONS.INVENTORY_ADJUST, label: 'Inventory Adjust', category: 'Inventory', description: 'Record manual stock receipts, adjustments, and write-offs' },

  // Orders
  { key: PERMISSIONS.ORDERS_READ, label: 'Orders Read', category: 'Sales & Orders', description: 'View storefront orders, customer references, and delivery details' },
  { key: PERMISSIONS.ORDERS_UPDATE, label: 'Orders Update', category: 'Sales & Orders', description: 'Update order lifecycle status, verify payments, and log delivery' },

  // Customers
  { key: PERMISSIONS.CUSTOMERS_READ, label: 'Customers Read', category: 'Sales & Orders', description: 'View registered customer list, corporate accounts, and contact info' },
  { key: PERMISSIONS.CUSTOMERS_WRITE, label: 'Customers Write', category: 'Sales & Orders', description: 'Edit customer records, credit terms, and status' },

  // Quotes & Services
  { key: PERMISSIONS.QUOTES_MANAGE, label: 'Quotes Manage', category: 'Sales & Orders', description: 'Process quotation requests and issue formal bills of materials' },
  { key: PERMISSIONS.SERVICES_MANAGE, label: 'Services Manage', category: 'Sales & Orders', description: 'Schedule engineer callbacks and manage service offerings' },

  // Staff & Security
  { key: PERMISSIONS.STAFF_ACCESS, label: 'Staff App Access', category: 'Staff & Security', description: 'Log in and navigate the Staff (POS/ERP) workspace' },
  { key: PERMISSIONS.STAFF_MANAGE, label: 'Staff Accounts Manage', category: 'Staff & Security', description: 'Create, disable, edit, and reset passwords for staff accounts' },
  { key: PERMISSIONS.ROLES_MANAGE, label: 'Roles & Permissions Manage', category: 'Staff & Security', description: 'Edit custom role permission grants and system role assignments' },

  // Audit
  { key: PERMISSIONS.AUDIT_READ, label: 'Audit Log Read', category: 'System', description: 'View immutable system audit logs, diffs, and security events' },

  // Phase 2 Reserved
  { key: PERMISSIONS.POS_SELL, label: 'POS Terminal Sell', category: 'Phase 2 Reserved', description: 'Operate counter point-of-sale cash registers (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.POS_REFUND, label: 'POS Terminal Refund', category: 'Phase 2 Reserved', description: 'Process customer returns and cash refunds (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.PURCHASING_READ, label: 'Purchasing Read', category: 'Phase 2 Reserved', description: 'View purchase orders and vendor bills (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.PURCHASING_WRITE, label: 'Purchasing Write', category: 'Phase 2 Reserved', description: 'Create and submit vendor purchase orders (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.PURCHASING_RECEIVE, label: 'Purchasing Receive', category: 'Phase 2 Reserved', description: 'Receive vendor stock into warehouses (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.ACCOUNTING_READ, label: 'Accounting Read', category: 'Phase 2 Reserved', description: 'View general ledger and tax balances (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.ACCOUNTING_WRITE, label: 'Accounting Write', category: 'Phase 2 Reserved', description: 'Post manual journal entries (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.REPORTS_VIEW, label: 'Reports View', category: 'Phase 2 Reserved', description: 'View executive management reports and analytics (Phase 2)', isPhase2: true },
  { key: PERMISSIONS.REPORTS_EXPORT, label: 'Reports Export', category: 'Phase 2 Reserved', description: 'Export raw accounting and sales CSV dumps (Phase 2)', isPhase2: true }
];

export interface SystemRoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionKey[];
}

export const SYSTEM_ROLES: Record<string, SystemRoleDefinition> = {
  SUPER_ADMIN: {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Unrestricted full access across all modules, surfaces, and security administration',
    isSystem: true,
    permissions: Object.values(PERMISSIONS)
  },
  WEBSITE_MANAGER: {
    id: 'role-website-manager',
    name: 'Website Manager',
    description: 'Manages website content, catalog presentation, pricing, orders, and customer inquiries',
    isSystem: true,
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
    isSystem: true,
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
    isSystem: true,
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
    isSystem: true,
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
    isSystem: true,
    permissions: [
      PERMISSIONS.STAFF_ACCESS,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.SERVICES_MANAGE
    ]
  }
};

/**
 * Check if a list of user permissions satisfies a required permission key.
 * Super Admin implicitly has all permissions.
 */
export function hasPermission(userPermissions: string[] | undefined | null, required: PermissionKey | string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes('*') || userPermissions.includes(PERMISSIONS.SUPER_ADMIN as any)) return true;
  return userPermissions.includes(required);
}

