const express = require('express');
const router = express.Router();
const cmsService = require('./cms.service');
const {
  settingsSchema,
  heroSlideSchema,
  blogPostSchema,
  projectSchema,
  cmsPageSchema,
  testimonialSchema,
  faqItemSchema,
  redirectSchema,
  packageSeriesSchema
} = require('./cms.schemas');
const {
  requireAdmin,
  validateBody
} = require('../../middleware/auth');

// SETTINGS
router.get(['/settings', '/cms/settings'], (req, res) => {
  try {
    const settings = cmsService.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', requireAdmin, validateBody(settingsSchema), (req, res) => {
  try {
    const updated = cmsService.updateSettings(req.body, req.user);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HERO SLIDES
router.get('/cms/hero-slides', (req, res) => {
  try {
    const slides = cmsService.listHeroSlides();
    res.json(slides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cms/hero-slides', requireAdmin, validateBody(heroSlideSchema), (req, res) => {
  try {
    const created = cmsService.createHeroSlide(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cms/hero-slides/:id', requireAdmin, (req, res) => {
  try {
    cmsService.deleteHeroSlide(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cms/hero-slides/reorder', requireAdmin, (req, res) => {
  try {
    cmsService.reorderHeroSlides(req.body.orderedIds || [], req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SECTIONS
router.get('/cms/sections', (req, res) => {
  try {
    const sections = cmsService.getSections();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cms/sections', requireAdmin, (req, res) => {
  try {
    const updated = cmsService.updateSections(req.body.sections || req.body, req.user);
    res.json({ success: true, sections: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BLOG POSTS
router.get('/cms/blog', (req, res) => {
  try {
    const posts = cmsService.listBlogPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cms/blog/:slug', (req, res) => {
  try {
    const post = cmsService.getBlogPost(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cms/blog', requireAdmin, validateBody(blogPostSchema), (req, res) => {
  try {
    const created = cmsService.createBlogPost(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cms/blog/:id', requireAdmin, validateBody(blogPostSchema), (req, res) => {
  try {
    const updated = cmsService.updateBlogPost(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Blog post not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cms/blog/:id', requireAdmin, (req, res) => {
  try {
    cmsService.deleteBlogPost(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROJECTS
router.get(['/projects', '/cms/projects'], (req, res) => {
  try {
    const projects = cmsService.listProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(['/projects/:id', '/cms/projects/:id'], (req, res) => {
  try {
    const project = cmsService.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/projects', '/cms/projects', '/admin/projects'], requireAdmin, validateBody(projectSchema), (req, res) => {
  try {
    const created = cmsService.createProject(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(['/projects/:id', '/cms/projects/:id', '/admin/projects/:id'], requireAdmin, validateBody(projectSchema), (req, res) => {
  try {
    const updated = cmsService.updateProject(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(['/projects/:id', '/cms/projects/:id', '/admin/projects/:id'], requireAdmin, (req, res) => {
  try {
    cmsService.deleteProject(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PAGES
router.get(['/pages', '/cms/pages'], (req, res) => {
  try {
    const pages = cmsService.listPages();
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(['/pages/:slug', '/cms/pages/:slug'], (req, res) => {
  try {
    const page = cmsService.getPage(req.params.slug);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/pages', '/cms/pages', '/admin/pages'], requireAdmin, validateBody(cmsPageSchema), (req, res) => {
  try {
    const created = cmsService.createPage(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(['/pages/:id', '/cms/pages/:id', '/admin/pages/:id'], requireAdmin, validateBody(cmsPageSchema), (req, res) => {
  try {
    const updated = cmsService.updatePage(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Page not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(['/pages/:id', '/cms/pages/:id', '/admin/pages/:id'], requireAdmin, (req, res) => {
  try {
    cmsService.deletePage(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TESTIMONIALS
router.get(['/testimonials', '/cms/testimonials', '/admin/testimonials'], (req, res) => {
  try {
    const testimonials = cmsService.listTestimonials();
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(['/testimonials', '/cms/testimonials', '/admin/testimonials'], requireAdmin, validateBody(testimonialSchema), (req, res) => {
  try {
    const created = cmsService.createTestimonial(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(['/testimonials/:id', '/cms/testimonials/:id', '/admin/testimonials/:id'], requireAdmin, validateBody(testimonialSchema), (req, res) => {
  try {
    const updated = cmsService.updateTestimonial(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Testimonial not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete(['/testimonials/:id', '/cms/testimonials/:id', '/admin/testimonials/:id'], requireAdmin, (req, res) => {
  try {
    cmsService.deleteTestimonial(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FAQS
router.get('/cms/faqs', (req, res) => {
  try {
    const faqs = cmsService.listFaqs();
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cms/faqs', requireAdmin, validateBody(faqItemSchema), (req, res) => {
  try {
    const created = cmsService.createFaq(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cms/faqs/:id', requireAdmin, validateBody(faqItemSchema), (req, res) => {
  try {
    const updated = cmsService.updateFaq(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'FAQ not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cms/faqs/:id', requireAdmin, (req, res) => {
  try {
    cmsService.deleteFaq(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REDIRECTS
router.get('/admin/redirects', requireAdmin, (req, res) => {
  try {
    const list = cmsService.listRedirects();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/redirects', requireAdmin, validateBody(redirectSchema), (req, res) => {
  try {
    const created = cmsService.createRedirect(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/redirects/:id', requireAdmin, (req, res) => {
  try {
    cmsService.deleteRedirect(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PACKAGE SERIES
router.get('/package-series', (req, res) => {
  try {
    const list = cmsService.listPackageSeries();
    res.json(list.filter(s => s.enabled));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/package-series', requireAdmin, (req, res) => {
  try {
    const list = cmsService.listPackageSeries();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/package-series', requireAdmin, validateBody(packageSeriesSchema), (req, res) => {
  try {
    const created = cmsService.createPackageSeries(req.body, req.user);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/package-series/:id', requireAdmin, validateBody(packageSeriesSchema), (req, res) => {
  try {
    const updated = cmsService.updatePackageSeries(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ error: 'Package series not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/package-series/:id', requireAdmin, (req, res) => {
  try {
    cmsService.deletePackageSeries(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

