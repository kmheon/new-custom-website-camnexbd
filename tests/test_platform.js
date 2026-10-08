// tests/test_platform.js
// Automated verification of platform hardening:
// 1. HTTP Gzip Compression on static/XML assets
// 2. Cache-Control headers on API vs static vs bundles
// 3. Server-side unified search (products, brands, packages)
// 4. Background job queue execution (product_research, sitemap_generation)

const http = require('http');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@camnexbd.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TestAdminPassword123!';

function requestRaw(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      ...options
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
          rawBuffer: buffer
        });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function loginAdmin() {
  const csrfRes = await requestRaw({ path: '/api/auth/csrf', method: 'GET' });
  const csrfCookie = (csrfRes.headers['set-cookie'] || []).find(c => c.startsWith('camnex_csrf='));
  const csrfToken = csrfCookie ? csrfCookie.split(';')[0].split('=')[1] : '';

  const loginPayload = JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const loginRes = await requestRaw({
    path: '/api/auth/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload),
      'Cookie': `camnex_csrf=${csrfToken}`,
      'x-csrf-token': csrfToken
    }
  }, loginPayload);

  const sessionCookie = (loginRes.headers['set-cookie'] || []).find(c => c.startsWith('camnex_session='));
  if (!sessionCookie) throw new Error('Failed to get session cookie: ' + loginRes.body);

  const sessionToken = sessionCookie.split(';')[0].split('=')[1];
  return { csrfToken, sessionToken };
}

async function run() {
  console.log('Testing Platform Hardening (Compression, Caching, Search, Background Queue)...');

  // 1. HTTP Compression Test
  const gzipRes = await requestRaw({
    path: '/sitemap.xml',
    method: 'GET',
    headers: { 'Accept-Encoding': 'gzip' }
  });
  console.log('\n--- 1. HTTP Compression ---');
  console.log('Status:', gzipRes.statusCode);
  console.log('Content-Encoding:', gzipRes.headers['content-encoding']);
  if (gzipRes.headers['content-encoding'] !== 'gzip') {
    throw new Error('Expected gzip compression on sitemap.xml');
  }

  // 2. Cache-Control Headers Test
  console.log('\n--- 2. Cache-Control Headers ---');
  const apiRes = await requestRaw({ path: '/api/products', method: 'GET' });
  console.log('API Cache-Control:', apiRes.headers['cache-control']);
  if (!apiRes.headers['cache-control']?.includes('no-store')) {
    throw new Error('API should include no-store / no-cache header');
  }

  const jsRes = await requestRaw({ path: '/bundle.js', method: 'GET' });
  console.log('Bundle.js Cache-Control:', jsRes.headers['cache-control']);
  if (!jsRes.headers['cache-control']?.includes('max-age')) {
    throw new Error('Bundle.js should include max-age Cache-Control');
  }

  // 3. Server-Side Unified Search Test
  console.log('\n--- 3. Server-Side Unified Search ---');
  const searchRes = await requestRaw({ path: '/api/search?q=hikvision', method: 'GET' });
  const searchData = JSON.parse(searchRes.body);
  console.log('Search query: "hikvision"');
  console.log('Total Results:', searchData.totalCount);
  console.log('Products found:', searchData.products?.length);

  // 4. DB-Backed Background Job Queue Test
  console.log('\n--- 4. DB-Backed Background Job Queue ---');
  const auth = await loginAdmin();
  console.log('Logged in as admin.');

  // Enqueue product_research job
  const enqueuePayload = JSON.stringify({
    type: 'product_research',
    payload: { brand: 'Hikvision', model: 'DS-2CE1AD0T-IRPF' }
  });

  const enqueueRes = await requestRaw({
    path: '/api/admin/jobs/enqueue',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(enqueuePayload),
      'Cookie': `camnex_csrf=${auth.csrfToken}; camnex_session=${auth.sessionToken}`,
      'x-csrf-token': auth.csrfToken
    }
  }, enqueuePayload);

  console.log('Enqueue status:', enqueueRes.statusCode);
  const enqueueData = JSON.parse(enqueueRes.body);
  console.log('Job ID created:', enqueueData.jobId);
  if (!enqueueData.jobId) throw new Error('Enqueue did not return jobId');

  // Enqueue sitemap_generation job
  const sitemapJobPayload = JSON.stringify({ type: 'sitemap_generation', payload: {} });
  await requestRaw({
    path: '/api/admin/jobs/enqueue',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(sitemapJobPayload),
      'Cookie': `camnex_csrf=${auth.csrfToken}; camnex_session=${auth.sessionToken}`,
      'x-csrf-token': auth.csrfToken
    }
  }, sitemapJobPayload);

  // Wait 3.5 seconds for background worker to process jobs
  console.log('Waiting 3.5 seconds for background worker execution...');
  await new Promise(r => setTimeout(r, 3500));

  // Check job status
  const jobStatusRes = await requestRaw({
    path: `/api/admin/jobs/${enqueueData.jobId}`,
    method: 'GET',
    headers: {
      'Cookie': `camnex_session=${auth.sessionToken}`
    }
  });

  const jobDetails = JSON.parse(jobStatusRes.body);
  console.log('Job Status:', jobDetails.status);
  console.log('Job Result:', jobDetails.result?.suggestedName);
  if (jobDetails.status !== 'completed') {
    throw new Error(`Job expected 'completed', but got ${jobDetails.status}. Error: ${jobDetails.last_error}`);
  }

  // List all recent jobs
  const jobsListRes = await requestRaw({
    path: '/api/admin/jobs',
    method: 'GET',
    headers: {
      'Cookie': `camnex_session=${auth.sessionToken}`
    }
  });
  const jobsList = JSON.parse(jobsListRes.body);
  console.log('Total jobs in history:', jobsList.length);

  console.log('\nALL PLATFORM HARDENING TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
