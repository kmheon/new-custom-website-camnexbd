const { z } = require('zod');

const serviceRequestSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(80, 'Customer name cannot exceed 80 characters'),
  phone: z.string().min(11, 'Valid phone number is required'),
  serviceType: z.string().min(2, 'Service type is required')
}).passthrough();

const serviceOfferingSchema = z.object({
  title: z.string().min(2, 'Title is required')
}).passthrough();

module.exports = {
  serviceRequestSchema,
  serviceOfferingSchema
};

