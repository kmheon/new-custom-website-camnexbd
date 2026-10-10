const { z } = require('zod');

const customerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name cannot exceed 80 characters'),
  phone: z.string().min(11, 'Phone must be at least 11 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal(''))
});

const customerLoginSchema = z.object({
  identifier: z.string().min(3, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required')
});

const wishlistMergeSchema = z.object({
  productIds: z.array(z.string().min(1)).max(100)
});

module.exports = {
  customerRegisterSchema,
  customerLoginSchema,
  wishlistMergeSchema
};

