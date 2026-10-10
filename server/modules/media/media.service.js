const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const db = require('../../../database');
const { logAudit } = require('../../middleware/auditLogger');
const { emitDomainEvent } = require('../../middleware/events');

function validateImageMagicBytes(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    // WebP: RIFF ... WEBP
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
    return false;
  } catch (err) {
    return false;
  }
}

class MediaService {
  listMedia() {
    return db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
  }

  checkUsage(filename) {
    const references = [];
    const searchStr = filename;

    try {
      const prodCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE data_json LIKE ?').get(`%${searchStr}%`);
      if (prodCount && prodCount.count > 0) references.push(`${prodCount.count} product(s)`);
    } catch (_) {}

    try {
      const catCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE image LIKE ?').get(`%${searchStr}%`);
      if (catCount && catCount.count > 0) references.push(`${catCount.count} category(ies)`);
    } catch (_) {}

    try {
      const slideCount = db.prepare('SELECT COUNT(*) as count FROM hero_slides WHERE data_json LIKE ?').get(`%${searchStr}%`);
      if (slideCount && slideCount.count > 0) references.push(`${slideCount.count} hero slide(s)`);
    } catch (_) {}

    try {
      const projCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE data_json LIKE ?').get(`%${searchStr}%`);
      if (projCount && projCount.count > 0) references.push(`${projCount.count} project(s)`);
    } catch (_) {}

    try {
      const blogCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts WHERE image LIKE ? OR content LIKE ?').get(`%${searchStr}%`, `%${searchStr}%`);
      if (blogCount && blogCount.count > 0) references.push(`${blogCount.count} blog post(s)`);
    } catch (_) {}

    try {
      const cpCount = db.prepare('SELECT COUNT(*) as count FROM company_profile WHERE pdf_url LIKE ?').get(`%${searchStr}%`);
      if (cpCount && cpCount.count > 0) references.push(`company profile`);
    } catch (_) {}

    return references;
  }

  async processUpload(file, actor = null) {
    if (!file) {
      const err = new Error('No file uploaded');
      err.statusCode = 400;
      throw err;
    }

    const detectedType = validateImageMagicBytes(file.path);
    if (!detectedType) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      const err = new Error('Invalid image file format. Only PNG, JPEG, and WebP images are allowed.');
      err.statusCode = 400;
      throw err;
    }

    const uploadsDir = path.join(__dirname, '../../../public/uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const baseName = path.parse(file.filename).name;
    const thumbFilename = `${baseName}-thumb.webp`;
    const webpFilename = `${baseName}.webp`;

    const thumbPath = path.join(uploadsDir, thumbFilename);
    const webpPath = path.join(uploadsDir, webpFilename);

    try {
      await sharp(file.path).resize(300, 300, { fit: 'inside' }).webp({ quality: 80 }).toFile(thumbPath);
      await sharp(file.path).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(webpPath);
    } catch (sErr) {
      // Continue even if sharp fails on edge files
    }

    const mediaId = `med-${Date.now()}`;
    const url = `/uploads/${file.filename}`;

    db.prepare(`
      INSERT INTO media (id, filename, original_name, mime_type, size, url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(mediaId, file.filename, file.originalname, detectedType, file.size, url);

    const mediaRecord = {
      id: mediaId,
      filename: file.filename,
      original_name: file.originalname,
      mime_type: detectedType,
      size: file.size,
      url,
      thumbnailUrl: `/uploads/${thumbFilename}`,
      webpUrl: `/uploads/${webpFilename}`
    };

    logAudit({
      entity: 'media',
      entityId: mediaId,
      action: 'upload',
      actorId: actor?.id,
      actorName: actor?.name,
      after: { filename: file.filename, size: file.size }
    });

    emitDomainEvent('media.uploaded', { mediaId, url });
    return mediaRecord;
  }

  deleteMedia(id, actor = null) {
    const row = db.prepare('SELECT filename FROM media WHERE id = ?').get(id);
    if (!row) return true;

    if (row.filename) {
      const usage = this.checkUsage(row.filename);
      if (usage.length > 0) {
        const err = new Error(`Cannot delete image because it is referenced in: ${usage.join(', ')}.`);
        err.statusCode = 409;
        err.references = usage;
        throw err;
      }

      const uploadsDir = path.join(__dirname, '../../../public/uploads');
      const filePath = path.join(uploadsDir, row.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
      const baseName = path.parse(row.filename).name;
      const thumbPath = path.join(uploadsDir, `${baseName}-thumb.webp`);
      const webpPath = path.join(uploadsDir, `${baseName}.webp`);
      if (fs.existsSync(thumbPath)) try { fs.unlinkSync(thumbPath); } catch (_) {}
      if (fs.existsSync(webpPath)) try { fs.unlinkSync(webpPath); } catch (_) {}
    }

    db.prepare('DELETE FROM media WHERE id = ?').run(id);

    logAudit({
      entity: 'media',
      entityId: id,
      action: 'delete',
      actorId: actor?.id,
      actorName: actor?.name,
      before: { filename: row.filename }
    });

    emitDomainEvent('media.deleted', { mediaId: id });
    return true;
  }
}

module.exports = new MediaService();

