const { z } = require('zod');

const companyProfileSchema = z.object({
  legal_name: z.string().optional().nullable(),
  brand_name: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  short_bio: z.string().optional().nullable(),
  year_established: z.coerce.number().int().optional().nullable(),
  business_type: z.string().optional().nullable(),
  trade_license_no: z.string().optional().nullable(),
  tin_no: z.string().optional().nullable(),
  bin_no: z.string().optional().nullable(),
  registered_address: z.string().optional().nullable(),
  operational_address: z.string().optional().nullable(),
  official_email: z.string().email().optional().nullable().or(z.literal('')),
  official_phone: z.string().optional().nullable(),
  hotline: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  show_statistics: z.boolean().optional(),
  projects_completed: z.coerce.number().int().optional().nullable(),
  active_clients: z.coerce.number().int().optional().nullable(),
  corporate_clients: z.coerce.number().int().optional().nullable(),
  years_in_business: z.coerce.number().int().optional().nullable(),
  show_corporate_payment: z.boolean().optional(),
  bank_name: z.string().optional().nullable(),
  bank_branch: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_routing_number: z.string().optional().nullable(),
  leadership_json: z.any().optional(),
  pdf_url: z.string().optional().nullable(),
  pdf_size_bytes: z.coerce.number().int().optional().nullable()
}).passthrough();

module.exports = {
  companyProfileSchema
};

