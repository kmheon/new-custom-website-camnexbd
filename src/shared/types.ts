/**
 * CamneX Platform Shared Types
 * Used across Public Storefront, Website Manager (/admin), and Staff App (/staff)
 */

import { PermissionKey } from './permissions';

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'disabled';
  mustChangePassword?: boolean;
  branchId?: string | null;
  warehouseId?: string | null;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roles: Role[];
  permissions: PermissionKey[];
  hasMfa?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionKey[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  quantityChange: number;
  balanceAfter: number;
  movementType: 'manual_adjustment' | 'purchase_received' | 'order_fulfilled' | 'order_returned' | 'initial_count';
  reason: string;
  referenceId?: string | null;
  userId: string;
  userName?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  surface: 'storefront' | 'admin' | 'staff' | 'system';
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'archive' | 'restore' | 'delete' | 'login' | 'failed_login' | 'permission_change' | 'password_change' | 'stock_adjust';
  beforeData?: any;
  afterData?: any;
  diff?: Record<string, { before: any; after: any }> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DomainEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  status: 'pending' | 'processed' | 'failed';
  attempts: number;
  lastError?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
}

export interface CompanyProfile {
  businessName: string;
  tagline: string;
  aboutText: string;
  establishedYear?: string;
  officeAddress: string;
  googleMapUrl?: string;
  businessHours: string;
  phone: string;
  email: string;
  credentials: Array<{
    id: string;
    title: string;
    issuingBody: string;
    documentUrl?: string;
    verifiedYear?: string;
  }>;
  teamMembers?: Array<{
    id: string;
    name: string;
    role: string;
    bio?: string;
    photoUrl?: string;
  }>;
  pdfUrl?: string;
  pdfSize?: number;
  pdfUpdatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  sectionOrder?: string[];
  enabledSections?: Record<string, boolean>;
}

