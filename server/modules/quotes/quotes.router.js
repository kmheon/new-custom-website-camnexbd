const express = require('express');
const router = express.Router();
const quotesService = require('./quotes.service');
const { quoteSchema, quoteStatusSchema } = require('./quotes.schemas');
const {
  requireAdmin,
  submissionLimiter,
  validateBody
} = require('../../middleware/auth');
const { requireTurnstile } = require('../../auth/verificationService');

router.get('/quotes', requireAdmin, (req, res) => {
  try {
    const quotes = quotesService.listQuotes();
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quotes', submissionLimiter, requireTurnstile, validateBody(quoteSchema), (req, res) => {
  try {
    const quote = quotesService.createQuote(req.body, req.user);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/quotes/:id/status', requireAdmin, validateBody(quoteStatusSchema), (req, res) => {
  try {
    const quote = quotesService.updateStatus(req.params.id, req.body.status, req.user);
    if (!quote) return res.status(404).json({ error: 'Quote request not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

