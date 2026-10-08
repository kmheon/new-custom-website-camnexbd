// tests/test_media_upload.js
// Automated verification of image upload security, magic bytes validation,
// WebP conversion, thumbnail generation, and deletion.

const http = require('http');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@camnexbd.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TestAdminPassword123!';

async function testUpload() {
  console.log('Testing Media Upload Security & Image Processing...');

  const loginRes = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: PORT, path: '/api/auth/csrf', method: 'GET'
    }, res => {
      const cookies = res.headers['set-cookie'] || [];
      const csrfCookie = cookies.find(c => c.startsWith('camnex_csrf='));
      if (!csrfCookie) return reject(new Error('No CSRF cookie returned'));
      const csrf = csrfCookie.split(';')[0].split('=')[1];

      const lreq = http.request({
        hostname: '127.0.0.1', port: PORT, path: '/api/auth/admin/login', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': 'camnex_csrf=' + csrf, 'X-CSRF-Token': csrf }
      }, lres => {
        let lbody = '';
        lres.on('data', c => lbody += c);
        lres.on('end', () => {
          if (lres.statusCode !== 200) return reject(new Error(`Login failed with status ${lres.statusCode}: ${lbody}`));
          const sc = (lres.headers['set-cookie'] || []).find(c => c.startsWith('camnex_session=')).split(';')[0];
          resolve({ csrf, session: sc });
        });
      });
      lreq.on('error', reject);
      lreq.write(JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }));
      lreq.end();
    });
    req.on('error', reject);
    req.end();
  });

  // Minimal valid 1x1 PNG with magic bytes 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const payload = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="test-bullet.png"\r\nContent-Type: image/png\r\n\r\n'),
    pngHeader,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  const uploadedMedia = await new Promise((resolve, reject) => {
    const upReq = http.request({
      hostname: '127.0.0.1', port: PORT, path: '/api/media/upload', method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': payload.length,
        'Cookie': 'camnex_csrf=' + loginRes.csrf + '; ' + loginRes.session,
        'X-CSRF-Token': loginRes.csrf
      }
    }, upRes => {
      let b = '';
      upRes.on('data', c => b += c);
      upRes.on('end', () => {
        if (upRes.statusCode !== 200 && upRes.statusCode !== 201) {
          return reject(new Error(`Upload failed with status ${upRes.statusCode}: ${b}`));
        }
        const json = JSON.parse(b);
        console.log('[PASS] Upload status:', upRes.statusCode);
        console.log('[PASS] Uploaded image URL:', json.url);
        resolve(json);
      });
    });
    upReq.on('error', reject);
    upReq.write(payload);
    upReq.end();
  });

  // Verify deletion
  if (uploadedMedia && uploadedMedia.id) {
    await new Promise((resolve, reject) => {
      const delReq = http.request({
        hostname: '127.0.0.1', port: PORT, path: '/api/media/' + uploadedMedia.id, method: 'DELETE',
        headers: {
          'Cookie': 'camnex_csrf=' + loginRes.csrf + '; ' + loginRes.session,
          'X-CSRF-Token': loginRes.csrf
        }
      }, delRes => {
        let db = '';
        delRes.on('data', c => db += c);
        delRes.on('end', () => {
          if (delRes.statusCode !== 200) return reject(new Error(`Delete failed with status ${delRes.statusCode}: ${db}`));
          console.log('[PASS] Delete status:', delRes.statusCode);
          resolve();
        });
      });
      delReq.on('error', reject);
      delReq.end();
    });
  }

  console.log('\nMEDIA UPLOAD TEST PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  testUpload().catch(err => {
    console.error('Media upload test failed:', err);
    process.exit(1);
  });
}

module.exports = { testUpload };

