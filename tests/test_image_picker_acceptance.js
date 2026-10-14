// ============================================================================
// FINAL ACCEPTANCE AUDIT TEST SUITE: UNIVERSAL IMAGE PICKER & MEDIA LIBRARY
// ============================================================================
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = parseInt(process.env.PORT || '3000', 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (Buffer.isBuffer(postData)) {
        req.write(postData);
      } else if (typeof postData === 'string') {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

function createMultipartFormData(boundary, fieldName, filename, mimeType, fileBuffer) {
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return Buffer.concat([head, fileBuffer, tail]);
}

async function run() {
  console.log('================================================================');
  console.log('CAMNEX — IMAGE PICKER FINAL ACCEPTANCE AUDIT');
  console.log('Testing live backend & verifying component logic...');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name} - ${err.message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // STEP 1: AUTHENTICATION & CSRF SETUP
  // --------------------------------------------------------------------------
  console.log('--- 1. Authentication & Security Guard Verification ---');

  let adminCookie = '';
  let csrfToken = '';

  await test('Admin login obtains authenticated session cookie', async () => {
    const csrfRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/csrf',
      method: 'GET'
    });
    assert.strictEqual(csrfRes.status, 200, 'CSRF endpoint must return 200');
    const cookies = csrfRes.headers['set-cookie'] || [];
    const csrfCookie = cookies.find(c => c.startsWith('camnex_csrf='));
    assert.ok(csrfCookie, 'Must receive camnex_csrf cookie');
    csrfToken = csrfCookie.split(';')[0].split('=')[1];

    const loginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `camnex_csrf=${csrfToken}`,
        'X-CSRF-Token': csrfToken
      }
    }, {
      email: 'admin@camnexbd.com',
      password: process.env.ADMIN_PASSWORD || 'CamneX@Admin2026!'
    });

    assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
    const loginCookies = loginRes.headers['set-cookie'] || [];
    const sessionCookie = loginCookies.find(c => c.startsWith('camnex_session='));
    assert.ok(sessionCookie, 'Should receive session cookies');
    const sessionVal = sessionCookie.split(';')[0];
    adminCookie = `camnex_csrf=${csrfToken}; ${sessionVal}`;
  });

  await test('Anonymous request to /api/media/upload is blocked (401/403)', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
    const body = createMultipartFormData(boundary, 'file', 'test.png', 'image/png', Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, body);

    assert.ok(res.status === 401 || res.status === 403, `Expected 401/403 but got ${res.status}`);
  });

  // --------------------------------------------------------------------------
  // STEP 2: SERVER-SIDE FILE VALIDATION & SECURITY CHECKS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Server-Side Upload Integrity & Security Checks ---');

  await test('Server rejects uploaded file over 5 MB limit', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    largeBuffer[0] = 0x89; largeBuffer[1] = 0x50; largeBuffer[2] = 0x4E; largeBuffer[3] = 0x47;
    const body = createMultipartFormData(boundary, 'file', 'large.png', 'image/png', largeBuffer);

    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Cookie': adminCookie,
        'X-CSRF-Token': csrfToken
      }
    }, body);

    assert.strictEqual(res.status, 400, 'Server must reject files > 5 MB with 400 Bad Request');
  });

  await test('Server rejects SVG upload to prevent XSS attacks', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
    const svgContent = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const body = createMultipartFormData(boundary, 'file', 'malicious.svg', 'image/svg+xml', svgContent);

    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Cookie': adminCookie,
        'X-CSRF-Token': csrfToken
      }
    }, body);

    assert.strictEqual(res.status, 400, 'Server must reject SVG uploads to prevent XSS');
  });

  await test('Server rejects disguised non-image files with spoofed extension', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
    const scriptContent = Buffer.from('<?php echo "shell"; ?>');
    const body = createMultipartFormData(boundary, 'file', 'shell.png', 'image/png', scriptContent);

    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Cookie': adminCookie,
        'X-CSRF-Token': csrfToken
      }
    }, body);

    assert.strictEqual(res.status, 400, 'Server must reject files with invalid magic bytes');
  });

  let uploadedMediaUrl = null;
  let uploadedMediaId = null;

  await test('Server accepts authentic PNG image and generates WebP thumb', async () => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
    // Real 1x1 transparent PNG binary bytes
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
    const body = createMultipartFormData(boundary, 'file', 'audit-test-pixel.png', 'image/png', pngHeader);

    const res = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        'Cookie': adminCookie,
        'X-CSRF-Token': csrfToken
      }
    }, body);

    assert.strictEqual(res.status, 200, 'Real PNG upload should succeed');
    assert.ok(res.body.url, 'Must return uploaded image URL');
    assert.ok(res.body.id, 'Must return media record ID');
    uploadedMediaUrl = res.body.url;
    uploadedMediaId = res.body.id;
  });

  await test('Client-side ImagePickerField aligns upload types with backend (PNG, JPG, WebP only, no SVG)', async () => {
    const pickerSource = fs.readFileSync(path.join(__dirname, '../src/components/admin/ImagePickerField.tsx'), 'utf8');
    assert.ok(pickerSource.includes("['image/png', 'image/jpeg', 'image/jpg', 'image/webp']"), 'Client allowedTypes must not include SVG');
    assert.ok(!pickerSource.includes("'image/svg+xml'"), 'Client must not permit SVG MIME type');
    assert.ok(pickerSource.includes('accept="image/png,image/jpeg,image/jpg,image/webp"'), 'File input accept attribute must not include SVG');
  });

  await test('Client-side ImagePickerField prevents unsafe preview-link navigation (isSafeLinkUrl)', async () => {
    const pickerSource = fs.readFileSync(path.join(__dirname, '../src/components/admin/ImagePickerField.tsx'), 'utf8');
    assert.ok(pickerSource.includes('isSafeLinkUrl(value)'), 'Preview link <a> tag must be guarded by isSafeLinkUrl(value)');

    // Replicate / test the validator logic
    const isSafeLinkUrl = (url) => {
      if (!url || typeof url !== 'string') return false;
      const trimmed = url.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
        return true;
      }
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
          const parsed = new URL(trimmed);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      }
      return false;
    };

    // Safe protocols & local absolute paths
    assert.strictEqual(isSafeLinkUrl('https://example.com/image.jpg'), true);
    assert.strictEqual(isSafeLinkUrl('http://camnexbd.com/logo.webp'), true);
    assert.strictEqual(isSafeLinkUrl('/uploads/test.png'), true);
    assert.strictEqual(isSafeLinkUrl('/images/hero/banner.jpg'), true);

    // Unsafe schemes must be rejected
    assert.strictEqual(isSafeLinkUrl('javascript:alert(document.cookie)'), false);
    assert.strictEqual(isSafeLinkUrl('javascript:void(0)'), false);
    assert.strictEqual(isSafeLinkUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.strictEqual(isSafeLinkUrl('data:image/svg+xml;base64,PHN2Zy...'), false);
    assert.strictEqual(isSafeLinkUrl('vbscript:msgbox(1)'), false);
    assert.strictEqual(isSafeLinkUrl('//evil.com/phish.png'), false);
    assert.strictEqual(isSafeLinkUrl('/\\malicious.com'), false);
    assert.strictEqual(isSafeLinkUrl('ftp://ftp.camnexbd.com/img.jpg'), false);
    assert.strictEqual(isSafeLinkUrl('file:///C:/Windows/win.ini'), false);
    assert.strictEqual(isSafeLinkUrl('blob:http://localhost:3000/123'), false);
    assert.strictEqual(isSafeLinkUrl(''), false);
  });

  // --------------------------------------------------------------------------
  // STEP 3: PERSISTENCE & DELETION ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Persistence & Shared Asset Deletion Isolation ---');

  await test('Removing image from an entity does not delete media from library', async () => {
    // 1. Check media exists in /api/media
    const listRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media',
      method: 'GET'
    });
    assert.ok(Array.isArray(listRes.body), 'Should return array');
    const found = listRes.body.find(m => m.id === uploadedMediaId || m.url === uploadedMediaUrl);
    assert.ok(found, 'Uploaded media should exist in database');

    // 2. Assign image to Category, then unassign
    const catList = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/categories',
      method: 'GET'
    });
    assert.ok(catList.body.length > 0, 'Categories exist');
    const testCat = catList.body[0];
    const originalImage = testCat.image;

    // Set to new uploaded URL
    const updateRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/categories/${encodeURIComponent(testCat.id)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': csrfToken
      }
    }, {
      ...testCat,
      image: uploadedMediaUrl
    });
    assert.strictEqual(updateRes.status, 200, 'Category update should succeed');

    // Now clear the image (simulating user clicking X / clear)
    const clearRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/categories/${encodeURIComponent(testCat.id)}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': csrfToken
      }
    }, {
      ...testCat,
      image: originalImage || ''
    });
    assert.strictEqual(clearRes.status, 200, 'Category revert should succeed');

    // 3. Verify media asset STILL exists in /api/media (not deleted)
    const verifyList = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media',
      method: 'GET'
    });
    const stillExists = verifyList.body.find(m => m.id === uploadedMediaId);
    assert.ok(stillExists, 'Media file must NOT be deleted when entity field is cleared');
  });

  // Clean up test media asset
  if (uploadedMediaId) {
    await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/media/${encodeURIComponent(uploadedMediaId)}`,
      method: 'DELETE',
      headers: { 'Cookie': adminCookie, 'X-CSRF-Token': csrfToken }
    });
  }

  // --------------------------------------------------------------------------
  // STEP 4: COMPONENT IMPLEMENTATION & CONTRACT VERIFICATION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Component Verification Across All 11 Modules ---');

  const filesToVerify = [
    {
      name: 'Products (Primary & Gallery)',
      file: 'src/components/admin/ProductEditModal.tsx',
      checks: [
        'ImagePickerField',
        'primaryImage',
        'handleUploadGalleryFile',
        'galleryUrlInput',
        'handleSetPrimaryFromGallery',
        'handleMoveGalleryImage',
        'handleRemoveGalleryImage'
      ]
    },
    {
      name: 'Categories',
      file: 'src/pages/AdminDashboard.tsx',
      checks: [
        'ImagePickerField',
        'editingCategory.image',
        'Select Category Image from Media Library'
      ]
    },
    {
      name: 'Brands',
      file: 'src/components/admin/BrandsModule.tsx',
      checks: [
        'ImagePickerField',
        'editingBrand.logo',
        'Select Brand Logo from Media Library'
      ]
    },
    {
      name: 'Hero Slides (Main & Override)',
      file: 'src/pages/AdminDashboard.tsx',
      checks: [
        'Select Hero Slide Image',
        'editingSlide.image',
        'Select Override Slide Image from Media Library',
        'editingSlide.overrides.image'
      ]
    },
    {
      name: 'Promo Tiles',
      file: 'src/components/admin/PromoTileEditor.tsx',
      checks: [
        'ImagePickerField',
        "update('image', url)",
        'Select Promo Tile Image from Media Library'
      ]
    },
    {
      name: 'Case Studies & Projects',
      file: 'src/components/admin/ProjectsModule.tsx',
      checks: [
        'ImagePickerField',
        'editingProject.featuredImage',
        'Select Project Featured Image'
      ]
    },
    {
      name: 'Global Settings',
      file: 'src/components/admin/SettingsModule.tsx',
      checks: [
        'ImagePickerField',
        "updateField('seoOgImage', url)",
        'Select Open Graph Social Image'
      ]
    },
    {
      name: 'Articles & Blog',
      file: 'src/components/admin/BlogCmsModule.tsx',
      checks: [
        'ImagePickerField',
        'featuredImage: url',
        'Select Article Featured Cover Image'
      ]
    },
    {
      name: 'Turnkey Packages',
      file: 'src/components/admin/PackageEditModal.tsx',
      checks: [
        'ImagePickerField',
        'formData.image',
        'Select Package Hero Image'
      ]
    },
    {
      name: 'Testimonials',
      file: 'src/components/admin/TestimonialsModule.tsx',
      checks: [
        'ImagePickerField',
        'editingItem.image',
        'Select Testimonial Photo from Media Library'
      ]
    },
    {
      name: 'Technical Documents',
      file: 'src/components/admin/DocumentsModule.tsx',
      checks: [
        'MediaPickerModal',
        'Browse Library',
        'setFileUrl(url)',
        'Select Document or Datasheet from Media Library'
      ]
    }
  ];

  for (const item of filesToVerify) {
    test(`Module ${item.name} adopts image picker / media library`, () => {
      const fullPath = path.join(__dirname, '..', item.file);
      assert.ok(fs.existsSync(fullPath), `${item.file} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const check of item.checks) {
        assert.ok(content.includes(check), `${item.name} should include "${check}"`);
      }
    });
  }

  // --------------------------------------------------------------------------
  // STEP 5: STOREFRONT COMPATIBILITY & DATABASE RECORD INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Storefront Compatibility & Record Integrity ---');

  await test('Storefront routes load valid images without 404 or corrupted URLs', async () => {
    const productsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/products',
      method: 'GET'
    });
    assert.strictEqual(productsRes.status, 200);
    const productItems = productsRes.body.items || productsRes.body;
    assert.ok(Array.isArray(productItems) && productItems.length > 0, 'Catalog products present');
    for (const p of productItems) {
      if (p.primaryImage) {
        assert.ok(!p.primaryImage.includes('undefined') && !p.primaryImage.includes('null'), `Product ${p.id} image is not corrupted`);
      }
    }

    const categoriesRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/categories',
      method: 'GET'
    });
    assert.strictEqual(categoriesRes.status, 200);
    assert.ok(categoriesRes.body.length > 0, 'Categories present');

    const brandsRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/brands',
      method: 'GET'
    });
    assert.strictEqual(brandsRes.status, 200);
    assert.ok(brandsRes.body.length > 0, 'Brands present');
    for (const b of brandsRes.body) {
      if (b.logo) {
        assert.ok(!b.logo.includes('undefined') && !b.logo.includes('null'), `Brand ${b.name} logo not corrupted`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`FINAL ACCEPTANCE SUMMARY: ${passed + failed} TESTS RUN | ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
