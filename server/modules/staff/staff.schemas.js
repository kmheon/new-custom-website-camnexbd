const { z } = require('zod');

const staffLoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required')
});

const staffCreateUserSchema = z.object({
  email: z.string().email('Valid email address is required'),
  name: z.string().min(2, 'Name is required').max(80),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleIds: z.array(z.string()).min(1, 'At least one role must be assigned'),
  branch_id: z.string().optional().nullable(),
  warehouse_id: z.string().optional().nullable()
});

const staffUpdateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  must_change_password: z.boolean().optional(),
  roleIds: z.array(z.string()).optional(),
  branch_id: z.string().optional().nullable(),
  warehouse_id: z.string().optional().nullable()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const roleSchema = z.object({
  name: z.string().min(2, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Role must have at least one permission')
});

module.exports = {
  staffLoginSchema,
  staffCreateUserSchema,
  staffUpdateUserSchema,
  changePasswordSchema,
  roleSchema
};

