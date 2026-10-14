-- Migration 004: Shared Managed Entity Lifecycle Columns
-- Adds soft archive (is_archived, archived_at, archived_by) and optimistic version check (version)
-- To support managed entity lifecycle for partial CMS modules

-- spec_templates
ALTER TABLE spec_templates ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE spec_templates ADD COLUMN archived_at DATETIME;
ALTER TABLE spec_templates ADD COLUMN archived_by TEXT;
ALTER TABLE spec_templates ADD COLUMN version INTEGER DEFAULT 1;

-- glossary_terms
ALTER TABLE glossary_terms ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE glossary_terms ADD COLUMN archived_at DATETIME;
ALTER TABLE glossary_terms ADD COLUMN archived_by TEXT;
ALTER TABLE glossary_terms ADD COLUMN version INTEGER DEFAULT 1;

-- packages
ALTER TABLE packages ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE packages ADD COLUMN archived_at DATETIME;
ALTER TABLE packages ADD COLUMN archived_by TEXT;
ALTER TABLE packages ADD COLUMN version INTEGER DEFAULT 1;

-- quotes
ALTER TABLE quotes ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE quotes ADD COLUMN archived_at DATETIME;
ALTER TABLE quotes ADD COLUMN archived_by TEXT;
ALTER TABLE quotes ADD COLUMN version INTEGER DEFAULT 1;

-- hero_slides
ALTER TABLE hero_slides ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE hero_slides ADD COLUMN archived_at DATETIME;
ALTER TABLE hero_slides ADD COLUMN archived_by TEXT;
ALTER TABLE hero_slides ADD COLUMN version INTEGER DEFAULT 1;

-- homepage_sections
ALTER TABLE homepage_sections ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE homepage_sections ADD COLUMN archived_at DATETIME;
ALTER TABLE homepage_sections ADD COLUMN archived_by TEXT;
ALTER TABLE homepage_sections ADD COLUMN version INTEGER DEFAULT 1;

-- projects
ALTER TABLE projects ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN archived_at DATETIME;
ALTER TABLE projects ADD COLUMN archived_by TEXT;
ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1;

-- cms_pages
ALTER TABLE cms_pages ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE cms_pages ADD COLUMN archived_at DATETIME;
ALTER TABLE cms_pages ADD COLUMN archived_by TEXT;
ALTER TABLE cms_pages ADD COLUMN version INTEGER DEFAULT 1;

-- testimonials
ALTER TABLE testimonials ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE testimonials ADD COLUMN archived_at DATETIME;
ALTER TABLE testimonials ADD COLUMN archived_by TEXT;
ALTER TABLE testimonials ADD COLUMN version INTEGER DEFAULT 1;

-- redirects
ALTER TABLE redirects ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE redirects ADD COLUMN archived_at DATETIME;
ALTER TABLE redirects ADD COLUMN archived_by TEXT;
ALTER TABLE redirects ADD COLUMN version INTEGER DEFAULT 1;

-- blog_posts
ALTER TABLE blog_posts ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN archived_at DATETIME;
ALTER TABLE blog_posts ADD COLUMN archived_by TEXT;
ALTER TABLE blog_posts ADD COLUMN version INTEGER DEFAULT 1;

-- faqs
ALTER TABLE faqs ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE faqs ADD COLUMN archived_at DATETIME;
ALTER TABLE faqs ADD COLUMN archived_by TEXT;
ALTER TABLE faqs ADD COLUMN version INTEGER DEFAULT 1;

-- newsletter_subscribers
ALTER TABLE newsletter_subscribers ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE newsletter_subscribers ADD COLUMN archived_at DATETIME;
ALTER TABLE newsletter_subscribers ADD COLUMN archived_by TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN version INTEGER DEFAULT 1;

-- coupons
ALTER TABLE coupons ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE coupons ADD COLUMN archived_at DATETIME;
ALTER TABLE coupons ADD COLUMN archived_by TEXT;
ALTER TABLE coupons ADD COLUMN version INTEGER DEFAULT 1;

-- documents
ALTER TABLE documents ADD COLUMN is_archived INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN archived_at DATETIME;
ALTER TABLE documents ADD COLUMN archived_by TEXT;
ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1;

