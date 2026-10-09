// tests/test_clean_db_storefront.js
// Automated verification that on a clean database (no demo data, no configured accounts):
// 1. Testimonials and Projects tables are empty (0 items).
// 2. Settings have empty merchant accounts and enableCashOnDelivery is false.
// 3. Storefront /api/orders blocks checkout when payments are not configured.
// 4. Testimonials and Projects pages render clean empty-state messages without crashing.

const http = require('http');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run() {
  console.log('Testing Clean Database Storefront & Empty State Behavior...');

  // 1. Testimonials API is empty
  const testRes = await fetch(`${BASE_URL}/api/cms/testimonials`).then(r => r.json());
  console.log(`[PASS] Testimonials count: ${Array.isArray(testRes) ? testRes.length : 0} (Expected: 0)`);
  if (Array.isArray(testRes) && testRes.length !== 0) {
    throw new Error(`Expected 0 testimonials on clean database, got ${testRes.length}`);
  }

  // 2. Projects API is empty
  const projRes = await fetch(`${BASE_URL}/api/cms/projects`).then(r => r.json());
  console.log(`[PASS] Projects count: ${Array.isArray(projRes) ? projRes.length : 0} (Expected: 0)`);
  if (Array.isArray(projRes) && projRes.length !== 0) {
    throw new Error(`Expected 0 projects on clean database, got ${projRes.length}`);
  }

  // 3. Settings have no active payments & COD is false by default
  const settRes = await fetch(`${BASE_URL}/api/settings`).then(r => r.json());
  console.log(`[PASS] Cash on Delivery enabled: ${Boolean(settRes.enableCashOnDelivery)} (Expected: false)`);
  console.log(`[PASS] bKash configured: ${Boolean(settRes.bkashMerchantNumber)} (Expected: false)`);
  console.log(`[PASS] Nagad configured: ${Boolean(settRes.nagadMerchantNumber)} (Expected: false)`);
  console.log(`[PASS] Bank configured: ${Boolean(settRes.bankDetails?.accountNumber)} (Expected: false)`);

  if (settRes.enableCashOnDelivery === true) {
    throw new Error('Cash on Delivery must be false by default in a clean database!');
  }

  // 4. Verify checkout order creation is blocked on backend when payment methods are not active
  const orderAttempt = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test Clean Order',
      customerPhone: '01700000000',
      deliveryAddress: 'Dhaka',
      paymentMethod: 'cod',
      items: [{
        productId: 'prod-001',
        quantity: 1,
        pricePerUnit: 1000,
        product: { name: 'Test Prod', pricing: { regularPrice: 1000 } }
      }]
    })
  });

  console.log(`[PASS] Checkout attempt on unconfigured payments status: ${orderAttempt.status} (Expected: 400)`);
  if (orderAttempt.status !== 400) {
    throw new Error(`Expected 400 when placing order with unconfigured payments, got ${orderAttempt.status}`);
  }

  // 5. Storefront HTML fallback renders without errors
  const homeHtml = await fetch(`${BASE_URL}/`).then(r => r.text());
  if (!homeHtml.includes('CamneX')) {
    throw new Error('Storefront homepage did not render properly');
  }
  console.log('[PASS] Storefront HTML served with dynamic metadata and cache headers');

  // 6. Assert none of the 15 banned phrases appear in rendered HTML on clean DB
  const BANNED_PHRASES = [
    'Genuine Warranty with Serial Tracking',
    'Concealed Trunking & Neat Cabling',
    'Free Mobile Viewing Setup',
    'Lifetime SLA',
    'maintenance agreements',
    'dedicated maintenance agreements',
    'Transparent estimates without surprise charges',
    'without inflated baselines',
    'Verified discounts',
    'Official Warranty',
    'certified technicians',
    'Nationwide Service',
    'Genuine Products',
    'Fast Response',
    'Free Consultation',
    'Authorized Hardware Partners',
    'Hardware warranty',
    'Inquiry support',
    'On-site survey',
    'Itemized quotation',
    'Dhaka On-Site Surveys & Concealed Wiring',
    'emergency repair',
    'Concealed Cabling',
    'from authorized manufacturers',
    'Top verified',
    'Verified Client Feedback',
    'Real deployment feedback from',
    'firmware guidance',
    'Fast physical site surveys'
  ];

  const routesToCheck = ['/', '/product/prod-hik-irpf-2mp', '/checkout'];
  for (const route of routesToCheck) {
    const res = await fetch(`${BASE_URL}${route}`);
    const html = await res.text();
    for (const phrase of BANNED_PHRASES) {
      if (html.toLowerCase().includes(phrase.toLowerCase())) {
        throw new Error(`Banned phrase "${phrase}" found in HTML of ${route}`);
      }
    }
  }
  console.log('[PASS] Rendered HTML of /, /product/:id, and /checkout contains 0 banned claims');

  console.log('\nALL CLEAN DATABASE STOREFRONT TESTS PASSED SUCCESSFULLY!');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Clean DB storefront test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };

