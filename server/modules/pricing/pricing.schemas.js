const { z } = require('zod');

const calculatePriceSchema = z.object({
  packageId: z.string().optional(),
  cameraCount: z.coerce.number().int().min(1).default(4),
  formFactor: z.string().optional().default('bullet')
});

module.exports = {
  calculatePriceSchema
};

