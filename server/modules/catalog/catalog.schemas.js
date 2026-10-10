const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  modelNumber: z.string().min(1, 'Model number is required'),
  sku: z.string().min(1, 'SKU is required')
}).passthrough();

const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required')
}).passthrough();

const brandSchema = z.object({
  name: z.string().min(2, 'Brand name is required'),
  slug: z.string().min(1, 'Slug is required')
}).passthrough();

const specTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  categorySlug: z.string().min(1, 'Category slug is required')
}).passthrough();

const packageSchema = z.object({
  name: z.string().min(2, 'Package name is required'),
  slug: z.string().min(1, 'Slug is required')
}).passthrough();

module.exports = {
  productSchema,
  categorySchema,
  brandSchema,
  specTemplateSchema,
  packageSchema
};

