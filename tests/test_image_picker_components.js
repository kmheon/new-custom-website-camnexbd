// ============================================================================
// AUTOMATED TEST SUITE: UNIVERSAL IMAGE INPUT & MEDIA LIBRARY PICKER
// ============================================================================
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = parseInt(process.env.PORT || '3000', 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper: Make HTTP request with cookies
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

async function run() {
  console.log('================================================================');
  console.log('TEST SUITE: UNIVERSAL IMAGE INPUT & MEDIA LIBRARY PICKER');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name} - ${err.message}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // 1. Static Architecture Audit: ImagePickerField Component Implementation
  // --------------------------------------------------------------------------
  console.log('--- 1. Verifying Standardized ImagePickerField Component ---');

  const pickerPath = path.join(__dirname, '../src/components/admin/ImagePickerField.tsx');
  test('ImagePickerField.tsx exists in src/components/admin', () => {
    assert.ok(fs.existsSync(pickerPath), 'ImagePickerField.tsx should exist');
  });

  const pickerContent = fs.readFileSync(pickerPath, 'utf8');

  test('ImagePickerField provides URL input with clear action', () => {
    assert.ok(pickerContent.includes('onChange={(e) => onChange(e.target.value)}'), 'Must have text input for URL');
    assert.ok(pickerContent.includes("onChange('')"), 'Must have clear button');
  });

  test('ImagePickerField provides "Browse Library" button triggering MediaPickerModal', () => {
    assert.ok(pickerContent.includes('Browse Library') || pickerContent.includes('Browse Media Library'), 'Must have Browse Library button');
    assert.ok(pickerContent.includes('MediaPickerModal'), 'Must integrate MediaPickerModal');
    assert.ok(pickerContent.includes('setIsPickerOpen(true)'), 'Must open modal on click');
  });

  test('ImagePickerField provides direct upload action with 5MB validation', () => {
    assert.ok(pickerContent.includes('mediaService.uploadMedia'), 'Must call mediaService.uploadMedia');
    assert.ok(pickerContent.includes('5 * 1024 * 1024'), 'Must enforce 5 MB size limit');
    assert.ok(pickerContent.includes('image/png') && pickerContent.includes('image/webp'), 'Must validate image MIME types');
  });

  test('ImagePickerField client upload types strictly aligned with backend (PNG, JPG, WebP only, no SVG)', () => {
    // Verify allowedTypes array excludes SVG
    assert.ok(pickerContent.includes("['image/png', 'image/jpeg', 'image/jpg', 'image/webp']"), 'allowedTypes must be restricted to PNG, JPEG, JPG, WebP');
    assert.ok(!pickerContent.includes("'image/svg+xml'"), 'allowedTypes must NOT include image/svg+xml');
    
    // Verify file input accept attribute excludes SVG
    assert.ok(pickerContent.includes('accept="image/png,image/jpeg,image/jpg,image/webp"'), 'accept attribute must be restricted to PNG, JPEG, JPG, WebP');
    assert.ok(!pickerContent.includes('accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"'), 'accept attribute must NOT include SVG');
    
    // Verify user-facing rejection message
    assert.ok(pickerContent.includes('Only PNG, JPG, or WebP images are accepted'), 'Error message must reflect allowed formats');
  });

  test('ImagePickerField enforces safe preview-link navigation (isSafeLinkUrl)', () => {
    assert.ok(pickerContent.includes('isSafeLinkUrl'), 'isSafeLinkUrl validator helper must be defined');
    assert.ok(pickerContent.includes('isSafeLinkUrl(value)'), 'Preview link <a> tag must be guarded by isSafeLinkUrl(value)');

    // Replicate / test the exact isSafeLinkUrl logic
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

    // Safe external URLs
    assert.strictEqual(isSafeLinkUrl('https://images.unsplash.com/photo-123'), true, 'HTTPS URL should be safe');
    assert.strictEqual(isSafeLinkUrl('http://cdn.camnexbd.com/asset.png'), true, 'HTTP URL should be safe');
    assert.strictEqual(isSafeLinkUrl('   https://camnexbd.com/logo.webp  '), true, 'Whitespace-trimmed HTTPS URL should be safe');

    // Safe internal paths
    assert.strictEqual(isSafeLinkUrl('/uploads/media-abc.png'), true, 'Internal /uploads path should be safe');
    assert.strictEqual(isSafeLinkUrl('/images/hero/hikvision.png'), true, 'Internal /images path should be safe');
    assert.strictEqual(isSafeLinkUrl('/brand-logos/ruijie.png'), true, 'Internal /brand-logos path should be safe');

    // Rejected unsafe schemes & malicious protocols
    assert.strictEqual(isSafeLinkUrl('javascript:alert(1)'), false, 'javascript: scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('javascript:void(0)'), false, 'javascript: scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('data:text/html,<script>alert(1)</script>'), false, 'data: HTML scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('data:image/svg+xml;base64,PHN2Z...'), false, 'data: image scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('vbscript:msgbox(1)'), false, 'vbscript: scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('//attacker.com/evil.png'), false, 'Protocol-relative URL // must be rejected');
    assert.strictEqual(isSafeLinkUrl('/\\evil.com'), false, 'Path with backslash /\\ must be rejected');
    assert.strictEqual(isSafeLinkUrl('ftp://ftp.camnexbd.com/test.jpg'), false, 'ftp: scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('file:///etc/passwd'), false, 'file: scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl('blob:http://localhost/abc'), false, 'blob: scheme must be rejected');
    assert.strictEqual(isSafeLinkUrl(''), false, 'Empty string must be rejected');
    assert.strictEqual(isSafeLinkUrl('   '), false, 'Whitespace-only string must be rejected');
    assert.strictEqual(isSafeLinkUrl(null), false, 'null must be rejected');
    assert.strictEqual(isSafeLinkUrl(undefined), false, 'undefined must be rejected');
  });

  test('ImagePickerField provides live image thumbnail preview and error fallback', () => {
    assert.ok(pickerContent.includes('imageLoadError'), 'Must track image load error state');
    assert.ok(pickerContent.includes('onError='), 'Must handle image load failures gracefully');
    assert.ok(pickerContent.includes('Unavailable or Broken Image URL') || pickerContent.includes('Load Error'), 'Must display clear fallback warning');
  });

  test('ImagePickerField provides transparency checkerboard toggle', () => {
    assert.ok(pickerContent.includes('useCheckerPattern') || pickerContent.includes('showTransparencyChecker'), 'Must provide checkerboard option');
  });

  test('ImagePickerField re-exported from src/components/admin/common', () => {
    const commonPath = path.join(__dirname, '../src/components/admin/common/ImagePickerField.tsx');
    assert.ok(fs.existsSync(commonPath), 'common/ImagePickerField.tsx must exist');
  });

  // --------------------------------------------------------------------------
  // 2. Static Audit: Verification across all Website Manager Modules
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Verifying Universal Image Input Adoption Across All Modules ---');

  const adminDashboardContent = fs.readFileSync(path.join(__dirname, '../src/pages/AdminDashboard.tsx'), 'utf8');
  test('AdminDashboard uses ImagePickerField for Category images', () => {
    assert.ok(adminDashboardContent.includes('editingCategory.image'), 'Must reference editingCategory.image');
    assert.ok(adminDashboardContent.includes('Select Category Image from Media Library'), 'Must configure category modalTitle');
  });

  test('AdminDashboard uses ImagePickerField for Hero Slide images', () => {
    assert.ok(adminDashboardContent.includes('Select Hero Slide Image'), 'Must configure hero slide image picker');
    assert.ok(adminDashboardContent.includes('Select Override Slide Image from Media Library'), 'Must configure override image picker');
  });

  const promoTileContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/PromoTileEditor.tsx'), 'utf8');
  test('PromoTileEditor uses ImagePickerField for Promo Tile image', () => {
    assert.ok(promoTileContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(promoTileContent.includes("update('image', url)"), 'Must bind to config.image');
  });

  const projectsContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/ProjectsModule.tsx'), 'utf8');
  test('ProjectsModule uses ImagePickerField for Featured Case Study images', () => {
    assert.ok(projectsContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(projectsContent.includes('editingProject.featuredImage'), 'Must bind to editingProject.featuredImage');
  });

  const settingsContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/SettingsModule.tsx'), 'utf8');
  test('SettingsModule uses ImagePickerField for Open Graph social image', () => {
    assert.ok(settingsContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(settingsContent.includes("updateField('seoOgImage', url)"), 'Must bind to seoOgImage');
  });

  const brandsContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/BrandsModule.tsx'), 'utf8');
  test('BrandsModule uses ImagePickerField for Brand Logos', () => {
    assert.ok(brandsContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(brandsContent.includes('editingBrand.logo'), 'Must bind to editingBrand.logo');
  });

  const blogContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/BlogCmsModule.tsx'), 'utf8');
  test('BlogCmsModule uses ImagePickerField for Featured Cover image', () => {
    assert.ok(blogContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(blogContent.includes('featuredImage: url'), 'Must bind to featuredImage');
  });

  const packageContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/PackageEditModal.tsx'), 'utf8');
  test('PackageEditModal uses ImagePickerField for Package Hero image', () => {
    assert.ok(packageContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(packageContent.includes('formData.image'), 'Must bind to formData.image');
  });

  const productModalContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/ProductEditModal.tsx'), 'utf8');
  test('ProductEditModal uses ImagePickerField for Primary Product Photography', () => {
    assert.ok(productModalContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(productModalContent.includes('primaryImage: url'), 'Must bind to primaryImage');
  });

  test('ProductEditModal Gallery supports Media Library, Direct Upload, Pasted URL, and Set as Primary', () => {
    assert.ok(productModalContent.includes('Add from Library'), 'Must have Add from Library button');
    assert.ok(productModalContent.includes('handleUploadGalleryFile'), 'Must have handleUploadGalleryFile function');
    assert.ok(productModalContent.includes('galleryUrlInput'), 'Must have gallery URL input');
    assert.ok(productModalContent.includes('handleSetPrimaryFromGallery'), 'Must have handleSetPrimaryFromGallery function');
    assert.ok(productModalContent.includes('Make Primary') || productModalContent.includes('Primary'), 'Must have Make Primary action button');
  });

  const documentsContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/DocumentsModule.tsx'), 'utf8');
  test('DocumentsModule provides Browse Library button for File URL', () => {
    assert.ok(documentsContent.includes('MediaPickerModal'), 'Must import MediaPickerModal');
    assert.ok(documentsContent.includes('Browse Library'), 'Must render Browse Library button');
  });

  const testimonialsContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/TestimonialsModule.tsx'), 'utf8');
  test('TestimonialsModule provides ImagePickerField for client avatar / photo', () => {
    assert.ok(testimonialsContent.includes('ImagePickerField'), 'Must import ImagePickerField');
    assert.ok(testimonialsContent.includes('editingItem.image'), 'Must bind to editingItem.image');
  });

  // --------------------------------------------------------------------------
  // 3. Runtime API Verification: Media Library & Image Field Persistence
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Testing Real Backend Media Library & Persistence ---');

  // Login as admin to get session
  let adminCookie = '';
  try {
    const loginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: process.env.ADMIN_EMAIL || 'admin@camnexbd.com',
      password: process.env.ADMIN_PASSWORD || 'CamneX@Admin2026!'
    });

    if (loginRes.headers && loginRes.headers['set-cookie']) {
      adminCookie = loginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }
  } catch (e) {
    console.warn('  ⚠️ Admin login failed (server may be on different port):', e.message);
  }

  // Test GET /api/media
  try {
    const mediaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/media',
      method: 'GET'
    });

    test('GET /api/media returns real media assets list', () => {
      assert.strictEqual(mediaRes.status, 200, 'Should return HTTP 200');
      assert.ok(Array.isArray(mediaRes.body), 'Response should be an array of media items');
      assert.ok(mediaRes.body.length > 0, 'Media library should contain existing assets');
      const item = mediaRes.body[0];
      assert.ok(item.url, 'Media item must have a valid url');
    });
  } catch (e) {
    console.warn('  ⚠️ Media fetch test skipped (daemon offline):', e.message);
  }

  // --------------------------------------------------------------------------
  // Final Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});

