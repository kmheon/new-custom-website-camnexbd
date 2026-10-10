const { z } = require('zod');

const quoteSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(80, 'Customer name cannot exceed 80 characters'),
  phone: z.string().min(11, 'Valid phone number is required'),
  serviceType: z.string().min(2, 'Service type is required')
}).passthrough();

const quoteStatusSchema = z.object({
  status: z.string().min(1, 'Status is required')
});

module.exports = {
  quoteSchema,
  quoteStatusSchema
};

