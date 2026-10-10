const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const mediaService = require('./media.service');
const { requireAdmin } = require('../../middleware/auth');

const uploadsDir = path.join(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.svg') {
      return cb(new Error('SVG uploads are not permitted for security reasons.'));
    }
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    if (!allowed.includes(ext)) {
      return cb(new Error('Only PNG, JPG, JPEG, and WebP images are permitted.'));
    }
    cb(null, true);
  }
});

router.get(['/media', '/admin/media'], requireAdmin, (req, res) => {
  try {
    const list = mediaService.listMedia();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/media/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      const result = await mediaService.processUpload(req.file, req.user);
      res.json(result);
    } catch (pErr) {
      res.status(pErr.statusCode || 500).json({ error: pErr.message });
    }
  });
});

router.delete(['/media/:id', '/admin/media/:id'], requireAdmin, (req, res) => {
  try {
    mediaService.deleteMedia(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, references: err.references });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

