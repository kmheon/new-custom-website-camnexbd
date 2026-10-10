const { z } = require('zod');

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantityChange: z.number().int().refine(val => val !== 0, 'Quantity change cannot be zero'),
  movementType: z.enum(['adjustment', 'sale', 'return', 'receipt', 'transfer']).default('adjustment'),
  reason: z.string().min(2, 'Reason is required'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional()
});

module.exports = {
  stockAdjustmentSchema
};

