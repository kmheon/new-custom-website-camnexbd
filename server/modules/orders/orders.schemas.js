const { z } = require('zod');

const orderSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required').max(80, 'Customer name cannot exceed 80 characters'),
  customerPhone: z.string().min(11, 'Valid phone number is required'),
  deliveryAddress: z.string().min(3, 'Delivery address is required'),
  items: z.array(z.any()).min(1, 'Order must contain at least one item')
}).passthrough();

const orderStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  note: z.string().optional(),
  title: z.string().optional()
});

const orderPaymentSchema = z.object({
  paymentStatus: z.string().optional(),
  paymentDetails: z.any().optional()
});

module.exports = {
  orderSchema,
  orderStatusSchema,
  orderPaymentSchema
};

