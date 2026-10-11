const { z } = require('zod');

const settingsSchema = z.object({
  specialOfferSlider: z.object({
    enabled: z.boolean().optional(),
    interval: z.coerce.number().int().min(1).max(60).optional(),
    maxOffers: z.coerce.number().int().min(1).max(50).optional()
  }).optional()
}).passthrough();

const heroSlideSchema = z.object({
  title: z.string().min(1, 'Title is required')
}).passthrough();

const blogPostSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(1, 'Slug is required')
}).passthrough();

const projectSchema = z.object({
  title: z.string().min(2, 'Project title is required').max(100, 'Project title cannot exceed 100 characters'),
  slug: z.string().min(1, 'Project slug is required')
}).passthrough();

const cmsPageSchema = z.object({
  title: z.string().min(2, 'Page title is required'),
  slug: z.string().min(1, 'Page slug is required')
}).passthrough();

const testimonialSchema = z.object({
  client_name: z.string().min(2, 'Client name is required').max(80, 'Client name cannot exceed 80 characters'),
  content: z.string().min(5, 'Review content is required').max(300, 'Testimonial quote cannot exceed 300 characters')
}).passthrough();

const faqItemSchema = z.object({
  question: z.string().min(3, 'Question is required'),
  answer: z.string().min(2, 'Answer is required')
}).passthrough();

const redirectSchema = z.object({
  from_path: z.string().min(1, 'Source path is required'),
  to_path: z.string().min(1, 'Destination path is required')
}).passthrough();

const packageSeriesSchema = z.object({
  name: z.string().min(2, 'Name is required')
}).passthrough();

const packageSystemTypeSchema = z.object({
  name: z.string().min(2, 'Name is required')
}).passthrough();

module.exports = {
  settingsSchema,
  heroSlideSchema,
  blogPostSchema,
  projectSchema,
  cmsPageSchema,
  testimonialSchema,
  faqItemSchema,
  redirectSchema,
  packageSeriesSchema,
  packageSystemTypeSchema
};

