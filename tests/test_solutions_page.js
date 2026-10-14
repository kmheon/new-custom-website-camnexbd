// ============================================================================
// AUTOMATED TEST SUITE: SOLUTIONS & ENGINEERING PAGE (CAMNEX BANGLADESH)
// ============================================================================
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.TEST_PORT || process.env.PORT || '3000', 10);
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run() {
  console.log('================================================================');
  console.log('TEST SUITE: SOLUTIONS & ENGINEERING (SCENARIOS) VERIFICATION');
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
  // 1. Static Architecture Audit: SolutionsPage Component Implementation
  // --------------------------------------------------------------------------
  console.log('--- 1. Verifying SolutionsPage Component Architecture ---');

  const solutionsPagePath = path.join(__dirname, '../src/pages/SolutionsPage.tsx');
  test('SolutionsPage.tsx exists in src/pages', () => {
    assert.ok(fs.existsSync(solutionsPagePath), 'SolutionsPage.tsx should exist');
  });

  const content = fs.readFileSync(solutionsPagePath, 'utf8');

  test('Preserves page title "Deployment Solutions by Scenario"', () => {
    assert.ok(content.includes('Deployment Solutions by Scenario'), 'Must include exact canonical heading');
  });

  test('Preserves introduction regarding turnkey hardware & cabling standards across Dhaka', () => {
    assert.ok(
      content.includes('CamneX delivers turnkey hardware and structured installation across Dhaka') &&
      content.includes('power budgets, and cabling and installation standards'),
      'Must preserve exact page introduction'
    );
  });

  test('Maintains the five canonical scenario categories with exact titles and slugs', () => {
    const requiredScenarios = [
      { title: 'Home & Residential', slug: 'home-residence' },
      { title: 'Corporate Office', slug: 'corporate-office' },
      { title: 'Shop & Retail Store', slug: 'shop-retail' },
      { title: 'Factory & Warehouse', slug: 'factory-warehouse' },
      { title: 'School & Institute', slug: 'school-institute' }
    ];

    for (const req of requiredScenarios) {
      assert.ok(content.includes(req.title), `Must contain title "${req.title}"`);
      assert.ok(content.includes(req.slug), `Must contain slug "${req.slug}"`);
    }
  });

  test('Scenario cards implement accessible keyboard navigation and focus rings', () => {
    assert.ok(content.includes('role="button"'), 'Must have semantic role="button"');
    assert.ok(content.includes('tabIndex={0}'), 'Must have tabIndex={0} for keyboard users');
    assert.ok(content.includes('focus:ring-[#F15A24]'), 'Must have visible orange focus ring');
    assert.ok(content.includes("e.key === 'Enter' || e.key === ' '"), 'Must handle Enter and Space key activation');
    assert.ok(content.includes('aria-label='), 'Must provide accessible aria-label');
  });

  test('Responsive grid provides 3 columns on desktop, 2 on tablet, and 1 on mobile', () => {
    assert.ok(
      content.includes('grid-cols-1') &&
      content.includes('md:grid-cols-2') &&
      content.includes('lg:grid-cols-3'),
      'Grid must configure 1 col mobile, 2 cols tablet, 3 cols desktop'
    );
  });

  test('Scenario cards provide "Explore Setup" text and arrow icon', () => {
    assert.ok(content.includes('Explore Setup'), 'Must display "Explore Setup" action');
    assert.ok(content.includes('ArrowRight'), 'Must display ArrowRight icon');
  });

  // --------------------------------------------------------------------------
  // 2. Scenario Detail Page Architecture
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Verifying Scenario Detail Page Architecture ---');

  test('Scenario detail view renders deployment requirements, suitable products, and installation considerations', () => {
    assert.ok(content.includes('Key Deployment Requirements'), 'Must section deployment requirements');
    assert.ok(content.includes('Suitable Hardware Components') || content.includes('Recommended Hardware'), 'Must section suitable hardware');
    assert.ok(content.includes('Recommended CCTV & Security Packages') || content.includes('Packages'), 'Must section recommended packages');
    assert.ok(content.includes('Installation Considerations & Quality Checklist') || content.includes('Installation Considerations'), 'Must section installation considerations');
  });

  test('Scenario detail view provides clear quote and contact actions', () => {
    assert.ok(content.includes('Get Quote for this Scenario'), 'Must have primary quote action');
    assert.ok(content.includes('Request Site Survey & Quote'), 'Must have site survey request action');
    assert.ok(content.includes('WhatsApp Engineer') || content.includes('Call / WhatsApp'), 'Must provide WhatsApp contact action');
    assert.ok(content.includes('+880 1540-535150') || content.includes('8801540535150'), 'Must link to official CamneX WhatsApp');
  });

  test('Scenario detail view provides back navigation to all scenarios and other scenario links', () => {
    assert.ok(content.includes('All Scenarios'), 'Must have "All Scenarios" return button');
    assert.ok(content.includes('Explore Other Deployment Scenarios'), 'Must list other scenarios');
  });

  test('Reuses existing ProductCard and PackageCard components without independent catalog duplication', () => {
    assert.ok(content.includes('<ProductCard'), 'Must reuse existing ProductCard');
    assert.ok(content.includes('<PackageCard'), 'Must reuse existing PackageCard');
    assert.ok(content.includes('productService.getProducts'), 'Must pull from real productService');
    assert.ok(content.includes('packageService.getPackages'), 'Must pull from real packageService');
  });

  // --------------------------------------------------------------------------
  // 3. Routing & Integration Audit
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Verifying Routing & Integration ---');

  const appPath = path.join(__dirname, '../src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  test('App.tsx routes /solutions and /solutions/:slug properly', () => {
    assert.ok(appContent.includes("path === '/solutions' || path.startsWith('/solutions/')"), 'Must handle /solutions and child routes');
    assert.ok(appContent.includes("setRouteParam(path.replace('/solutions/', ''))"), 'Must extract scenario slug as routeParam');
    assert.ok(appContent.includes("{currentRoute === 'solutions' &&"), 'Must render solutions route');
  });

  const contentPagesPath = path.join(__dirname, '../src/pages/ContentPages.tsx');
  const contentPagesSource = fs.readFileSync(contentPagesPath, 'utf8');

  test('ContentPages.tsx delegates type === "solutions" to SolutionsPage', () => {
    assert.ok(contentPagesSource.includes("import { SolutionsPage } from './SolutionsPage'"), 'Must import SolutionsPage');
    assert.ok(contentPagesSource.includes("<SolutionsPage param={param} onNavigate={onNavigate} />"), 'Must render SolutionsPage');
  });

  const seedDataPath = path.join(__dirname, '../src/services/seedData.ts');
  const seedDataSource = fs.readFileSync(seedDataPath, 'utf8');

  test('DEFAULT_SCENARIOS contains 5 canonical scenarios with real package and product recommendations', () => {
    assert.ok(seedDataSource.includes("'home-residence'"), 'home-residence in seed data');
    assert.ok(seedDataSource.includes("'corporate-office'"), 'corporate-office in seed data');
    assert.ok(seedDataSource.includes("'shop-retail'"), 'shop-retail in seed data');
    assert.ok(seedDataSource.includes("'factory-warehouse'"), 'factory-warehouse in seed data');
    assert.ok(seedDataSource.includes("'school-institute'"), 'school-institute in seed data');
    assert.ok(seedDataSource.includes('2-camera-night-vision-package'), 'Uses real package slug');
    assert.ok(seedDataSource.includes('prod-hik-irpf-2mp'), 'Uses real product ID');
  });

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

run().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});

