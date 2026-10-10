const { z } = require('zod');

const mediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

module.exports = {
  mediaQuerySchema
};

