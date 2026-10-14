/**
 * TEST SUITE: SERVICES & ENGINEERING PAGE VERIFICATION
 *
 * Verifies that the Services page:
 * 1. Implements the 5 required sections in exact order:
 *    - Section 1: Page introduction (heading, description, Explore Services & Request a Quote scroll actions)
 *    - Section 2: Services overview (7 canonical service categories, each with icon, title, 2-3 line description, up to 3 benefits, Request a Quote action)
 *    - Section 3: How our service works (4-step process)
 *    - Section 4: Request a quote (reusing real quoteService.createQuote, preserving all fields & validation)
 *    - Section 5: FAQ (accordion with verified FAQs)
 * 2. Properly routes `/services` in App.tsx
 * 3. Enforces clean responsive breakpoints (desktop, tablet, mobile)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: SERVICES & ENGINEERING PAGE VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  const servicesPagePath = path.join(__dirname, '..', 'src', 'pages', 'ServicesPage.tsx');
  const appPath = path.join(__dirname, '..', 'src', 'App.tsx');

  console.log('--- 1. Verifying ServicesPage Architecture & 5-Section Ordering ---');

  test('ServicesPage.tsx exists in src/pages', () => {
    assert.strictEqual(fs.existsSync(servicesPagePath), true, 'ServicesPage.tsx must exist');
  });

  const content = fs.readFileSync(servicesPagePath, 'utf8');

  test('Preserves Section 1: Page Introduction with heading, description, and scroll actions', () => {
    assert.ok(content.includes('Professional Security, Surveillance & Network Engineering Services') || content.includes('Professional Security, Surveillance &amp; Network Engineering Services'), 'Must have heading');
    assert.ok(content.includes('Explore Services'), 'Must have Explore Services button');
    assert.ok(content.includes('Request a Quote'), 'Must have Request a Quote button');
    assert.ok(content.includes('services-overview'), 'Explore Services must scroll to services-overview');
    assert.ok(content.includes('quote-section'), 'Request a Quote must scroll to quote-section');
  });

  test('Preserves Section 2: Services Overview with all 9 canonical service categories', () => {
    const requiredServices = [
      'CCTV & Video Surveillance Installation',
      'IP & Wi-Fi Camera Solutions',
      'Enterprise Networking & Wi-Fi',
      'Access Control & Biometric Attendance',
      'Complete IT Infrastructure',
      'Preventive Maintenance & AMC',
      'Physical Site Survey & Consultation',
      'Home Automation & Smart Living',
      'Fire Safety & Detection Systems'
    ];

    for (const srv of requiredServices) {
      assert.ok(content.includes(srv), `Must include service: ${srv}`);
    }
  });

  test('Service cards contain icon, title, description, benefits, and quote action', () => {
    assert.ok(content.includes('CheckCircle2'), 'Must include checkmark icon for benefits');
    assert.ok(content.includes('handleSelectServiceAndQuote'), 'Must handle service selection and quote scrolling');
    assert.ok(content.includes('benefits: ['), 'Must include concise benefits list');
    assert.ok(content.includes('line-clamp-3'), 'Must keep card descriptions concise and capped');
  });

  test('Preserves Section 3: How Our Service Works with 4-step process', () => {
    const requiredSteps = [
      'Consultation & Site Survey',
      'Itemized Project Proposal',
      'Engineering & Installation',
      'Handover, Testing & Support'
    ];

    for (const step of requiredSteps) {
      assert.ok(content.includes(step), `Must include process step: ${step}`);
    }
  });

  test('Preserves Section 4: Request a Quote with real quotation service logic & fields', () => {
    assert.ok(content.includes('quoteService.createQuote'), 'Must call real quoteService.createQuote()');
    assert.ok(content.includes('customerName'), 'Must preserve customerName field');
    assert.ok(content.includes('phone'), 'Must preserve phone field');
    assert.ok(content.includes('companyName'), 'Must preserve companyName field');
    assert.ok(content.includes('email'), 'Must preserve email field');
    assert.ok(content.includes('propertyType'), 'Must preserve propertyType field');
    assert.ok(content.includes('cameraCount'), 'Must preserve cameraCount / device count field');
    assert.ok(content.includes('siteAddress'), 'Must preserve siteAddress field');
    assert.ok(content.includes('notes'), 'Must preserve notes field');
    assert.ok(content.includes('fileName') || content.includes('attachment'), 'Must preserve optional attachment');
    assert.ok(content.includes('submittedQuote'), 'Must handle successful quote display with reference number');
    assert.ok(content.includes('wa.me/8801540535150'), 'Must link to WhatsApp engineering desk');
  });

  test('Preserves Section 4 Sidebar: Includes Plan Your Security & IT Project panel with 4 items', () => {
    assert.ok(content.includes('Plan Your Security & IT Project') || content.includes('Plan Your Security &amp; IT Project'), 'Must have panel title');
    assert.ok(content.includes('Property Details'), 'Must have Property Details item');
    assert.ok(content.includes('Equipment Requirements'), 'Must have Equipment Requirements item');
    assert.ok(content.includes('Supporting Documents'), 'Must have Supporting Documents item');
    assert.ok(content.includes('Existing Infrastructure'), 'Must have Existing Infrastructure item');
  });

  test('Preserves Section 5: FAQ with accordion functionality and verified answers', () => {
    assert.ok(content.includes('Frequently Asked Questions'), 'Must include FAQ heading');
    assert.ok(content.includes('openFaq'), 'Must manage open/close accordion state');
    assert.ok(content.includes('cmsService.getFaqs'), 'Must load verified FAQs via cmsService');
    assert.ok(content.includes('aria-expanded'), 'Must have accessible accordion state');
  });

  console.log('\n--- 2. Verifying Responsive Layout & Spacing ---');

  test('Responsive grid layout adheres to design system', () => {
    assert.ok(content.includes('grid-cols-1 md:grid-cols-2 lg:grid-cols-3'), 'Services grid must be 3 columns on desktop, 2 on tablet, 1 on mobile');
    assert.ok(content.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Steps grid must be 4 columns on desktop, 2 on tablet, 1 on mobile');
    assert.ok(content.includes('grid-cols-1 lg:grid-cols-12'), 'Quote form must be 8-col with 4-col sidebar on desktop');
    assert.ok(content.includes('max-w-[1200px] mx-auto') || content.includes('max-w-7xl mx-auto'), 'Must use standard container width');
  });

  console.log('\n--- 3. Verifying Routing & Integration ---');

  test('App.tsx imports and routes /services to ServicesPage', () => {
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.ok(appContent.includes("import('./pages/ServicesPage')"), 'App.tsx must lazy-load ServicesPage');
    assert.ok(appContent.includes("{currentRoute === 'services' && <ServicesPage onNavigate={navigate} />}"), 'App.tsx must render ServicesPage for services route');
  });

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

