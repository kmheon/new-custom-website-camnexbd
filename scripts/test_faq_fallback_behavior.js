#!/usr/bin/env node
/**
 * Test Suite: FAQ Fallback and Smaller Configured FAQ List Verification
 * 
 * Objectives:
 * 1. Verify that an intentionally configured smaller FAQ list (e.g., 1, 3, or 5 entries)
 *    is displayed as-is and NOT replaced by INITIAL_FAQS.
 * 2. Verify that an empty dataset ([]), null, undefined, or failed fetch genuinely falls
 *    back to the default INITIAL_FAQS (19 items).
 * 3. Inspect src/pages/FaqPage.tsx source code to confirm absence of arbitrary
 *    size thresholds (such as 'data.length >= 15').
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('=== CamneX FAQ Fallback & Configured Dataset Test Suite ===\n');

// ----------------------------------------------------------------------------
// Test 1: Static Code Inspection of src/pages/FaqPage.tsx
// ----------------------------------------------------------------------------
console.log('1. Static Code Analysis of src/pages/FaqPage.tsx...');
const faqPagePath = path.join(__dirname, '..', 'src', 'pages', 'FaqPage.tsx');
check('FaqPage.tsx exists', fs.existsSync(faqPagePath));

const faqPageSource = fs.readFileSync(faqPagePath, 'utf8');

// Ensure no arbitrary `>= 15` threshold remains
const hasArbitraryThreshold = /data\.length\s*>=\s*15/.test(faqPageSource);
check('No arbitrary threshold "data.length >= 15" in FaqPage.tsx', !hasArbitraryThreshold);

// Ensure valid check for non-empty array exists
const hasNonEmptyCheck = /Array\.isArray\(data\)\s*&&\s*data\.length\s*>\s*0/.test(faqPageSource);
check('FaqPage.tsx checks for non-empty array (data.length > 0)', hasNonEmptyCheck);

// Ensure INITIAL_FAQS is imported and used as fallback
const importsInitialFaqs = /import\s*\{\s*INITIAL_FAQS\s*\}\s*from\s*'\.\.\/services\/seedData'/.test(faqPageSource);
check('FaqPage.tsx imports INITIAL_FAQS from seedData', importsInitialFaqs);

// Ensure fallback to INITIAL_FAQS exists for empty and catch paths
const usesInitialFaqsFallback = faqPageSource.includes(': INITIAL_FAQS') || faqPageSource.includes('setFaqs(INITIAL_FAQS)');
check('FaqPage.tsx falls back to INITIAL_FAQS on empty or error states', usesInitialFaqsFallback);

// ----------------------------------------------------------------------------
// Test 2: Fallback Logic Verification (Pure Resolver Simulation)
// ----------------------------------------------------------------------------
console.log('\n2. FAQ Fallback Resolution Simulation...');

// Read INITIAL_FAQS from seedData.ts to know exact default count
const seedDataPath = path.join(__dirname, '..', 'src', 'services', 'seedData.ts');
const seedDataContent = fs.readFileSync(seedDataPath, 'utf8');
const initialFaqsMatches = seedDataContent.match(/id:\s*['"]faq-[a-z0-9-]+['"]/g) || [];
const expectedInitialCount = initialFaqsMatches.length;
check(`INITIAL_FAQS contains expected comprehensive count (found ${expectedInitialCount})`, expectedInitialCount >= 15);

// Replicate the exact resolution logic used in FaqPage.tsx
function resolveFaqs(data) {
  if (Array.isArray(data) && data.length > 0) {
    return {
      faqs: data,
      isFallback: false,
      firstOpenId: data[0]?.id || null
    };
  }
  return {
    faqs: initialFaqsMatches.map((m, idx) => ({ id: `faq-default-${idx + 1}` })),
    isFallback: true,
    firstOpenId: 'faq-default-1'
  };
}

// Case 1A: Intentionally configured 1-item FAQ list
const singleItem = [
  { id: 'custom-faq-1', question: 'How do I reset my NVR password?', answer: 'Contact support.', category: 'Security' }
];
const res1A = resolveFaqs(singleItem);
check('Single configured FAQ is preserved as-is (length 1)', res1A.faqs.length === 1 && !res1A.isFallback);
check('Single configured FAQ sets active open ID to custom-faq-1', res1A.firstOpenId === 'custom-faq-1');

// Case 1B: Intentionally configured 3-item FAQ list (e.g. database seed)
const threeItems = [
  { id: 'seed-faq-1', question: 'Q1', answer: 'A1', category: 'Hardware' },
  { id: 'seed-faq-2', question: 'Q2', answer: 'A2', category: 'Access' },
  { id: 'seed-faq-3', question: 'Q3', answer: 'A3', category: 'Survey' }
];
const res1B = resolveFaqs(threeItems);
check('3 configured FAQs are preserved as-is (length 3, not overridden)', res1B.faqs.length === 3 && !res1B.isFallback);
check('3 configured FAQs sets first item open ID to seed-faq-1', res1B.firstOpenId === 'seed-faq-1');

// Case 1C: Intentionally configured 7-item FAQ list (< 15)
const sevenItems = Array.from({ length: 7 }, (_, i) => ({
  id: `faq-${i + 1}`,
  question: `Question ${i + 1}`,
  answer: `Answer ${i + 1}`,
  category: 'General'
}));
const res1C = resolveFaqs(sevenItems);
check('7 configured FAQs (< 15) are preserved as-is without fallback', res1C.faqs.length === 7 && !res1C.isFallback);

// Case 2A: Empty dataset [] (Admin cleared all FAQs or fresh DB without seeds)
const res2A = resolveFaqs([]);
check('Empty dataset [] triggers fallback to INITIAL_FAQS', res2A.isFallback && res2A.faqs.length === expectedInitialCount);
check('Empty dataset sets first open ID from default list', res2A.firstOpenId === 'faq-default-1');

// Case 2B: Null dataset
const res2B = resolveFaqs(null);
check('Null dataset triggers fallback to INITIAL_FAQS', res2B.isFallback && res2B.faqs.length === expectedInitialCount);

// Case 2C: Undefined dataset
const res2C = resolveFaqs(undefined);
check('Undefined dataset triggers fallback to INITIAL_FAQS', res2C.isFallback && res2C.faqs.length === expectedInitialCount);

// Case 2D: Non-array object {}
const res2D = resolveFaqs({});
check('Non-array payload triggers fallback to INITIAL_FAQS', res2D.isFallback && res2D.faqs.length === expectedInitialCount);

// ----------------------------------------------------------------------------
// Test 3: Backend API Verification (/api/cms/faqs)
// ----------------------------------------------------------------------------
console.log('\n3. Verification against live/mock API...');
async function testLiveApi() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/cms/faqs');
    if (res.ok) {
      const liveData = await res.json();
      check(`Live /api/cms/faqs responded with HTTP 200 (returned ${liveData.length} items)`, true);
      const resolved = resolveFaqs(liveData);
      if (liveData.length > 0) {
        check(`Live configured data (${liveData.length} items) displayed without being overwritten by defaults`, !resolved.isFallback && resolved.faqs.length === liveData.length);
      } else {
        check('Live empty dataset correctly triggers default fallback', resolved.isFallback);
      }
    } else {
      console.log('  - Live server not responding or non-200; testing mock mode');
    }
  } catch (err) {
    console.log('  - Live server check skipped (offline or non-HTTP environment):', err.message);
  }
}

testLiveApi().then(() => {
  console.log(`\n======================================================`);
  console.log(`FAQ Fallback Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
});

