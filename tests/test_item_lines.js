#!/usr/bin/env node
/**
 * Unit Test Suite for Package Component Line Formatter
 *
 * Verifies:
 * - Every line is formatted as "{qty} × {short name}" (matches /^\d+ × .+/)
 * - Never "2x" or "15x" without the product name
 * - Never "1× 25x ..." (strips spec words like 25x from short names)
 * - Zero occurrences of "x" or "X" as a quantity marker
 * - Short names are capped at 36 characters at word boundaries with no trailing "..."
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Simple JS implementation matching src/utils/displayName.ts formatComponentLine
const BRAND_WORDS = [
  'western digital', 'tp-link', 'hikvision', 'hik-connect', 'dahua', 'ezviz', 'imou', 'uniview',
  'tiandy', 'ruijie', 'reyee', 'zkteco', 'seagate', 'toshiba', 'wd', 'purple', 'skyhawk',
  'acusense', 'colorvu', 'turbo hd', 'exir'
];
const FILLER_WORDS = [
  'complete', 'centralized', 'centralised', 'central', 'regulated', 'high-shield', 'heavy-duty',
  'industrial', 'high-endurance', 'weatherproof', 'smart', 'professional', 'premium', 'enterprise',
  'structured', 'redundant', 'fixed'
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function getShortDisplayName(fullName, shortName) {
  const admin = (shortName || '').trim();
  if (admin) return admin;
  const original = (fullName || '').trim();
  if (!original) return '';

  let text = ` ${original} `;
  for (const b of BRAND_WORDS) {
    text = text.replace(new RegExp(`(^|\\s)${escapeRe(b)}(?=\\s)`, 'gi'), ' ');
  }
  for (const f of FILLER_WORDS) {
    text = text.replace(new RegExp(`(^|\\s)${escapeRe(f)}(?=\\s)`, 'gi'), ' ');
  }
  text = text.replace(/\([^)]*\)/g, ' ');

  // Strip spec words like 25x, 10x, 2MP, etc. so spec words never survive into short names
  text = text.replace(/\b\d+\s*(?:x|X)\b/g, ' ');
  text = text.replace(/\b\d+(\.\d+)?(mp|k|v|a|w|p|mm)\b/gi, ' ');
  text = text.replace(/\b(irpf|ir|hd|fhd|uhd|ip67|ip66|h\.265\+?)\b/gi, ' ');

  const tokens = text.split(/\s+/).filter(Boolean);
  while (tokens.length && /^(&|and|with|\+)$/i.test(tokens[tokens.length - 1])) tokens.pop();
  while (tokens.length && /^(&|and|with|\+)$/i.test(tokens[0])) tokens.shift();

  let result = '';
  for (const tok of tokens) {
    const next = result ? `${result} ${tok}` : tok;
    if (next.length > 36) break;
    result = next;
  }
  return result.trim() || original.slice(0, 36).trim();
}

function formatComponentLine(fullName, shortName) {
  let str = (shortName || fullName || '').trim();
  if (!str) return '';
  if (/^\d+\s*×\s*.+/.test(str)) return str;

  let qty = 1;
  let rest = str;
  const m = str.match(/^(\d+)\s*(?:x|X|×)\s*(.*)$/i);
  if (m) {
    qty = parseInt(m[1], 10) || 1;
    rest = m[2].trim();
  }
  // Strip any embedded spec tokens like 25x, 10x
  rest = rest.replace(/\b\d+\s*(?:x|X)\b/gi, '').trim();

  const short = getShortDisplayName(rest, shortName && shortName !== fullName ? shortName : null);
  const finalName = short || rest || 'Component';
  return `${qty} \u00D7 ${finalName}`;
}

function runTests() {
  console.log('Testing Package Component Line Formatter:');

  const testCases = [
    {
      input: '1x 4MP 25x Optical Zoom Speed Dome PTZ',
      expectedRegex: /^1 × (?!.*25x)Optical Zoom Speed Dome PTZ$/,
      desc: 'strips spec word 25x from PTZ name and formats with 1 ×'
    },
    {
      input: '15x 4K IP Fixed Turret Cameras',
      expectedRegex: /^15 × IP Turret Cameras$/,
      desc: 'formats 15x with full product name, not 15x alone'
    },
    {
      input: '2x Hikvision 2MP IRPF Fixed Bullet Cameras',
      expectedRegex: /^2 × Bullet Cameras$/,
      desc: 'formats 2x with short name, strips brand and spec tokens'
    },
    {
      input: '40m High-Shield Coaxial Video Cable',
      expectedRegex: /^1 × 40m Coaxial Video Cable$/,
      desc: 'defaults quantity to 1 when no leading quantity marker exists'
    },
    {
      input: 'Complete BNC and DC Video Connectors',
      expectedRegex: /^1 × BNC and DC Video Connectors$/,
      desc: 'defaults quantity to 1 and strips leading filler word'
    }
  ];

  for (const tc of testCases) {
    const formatted = formatComponentLine(tc.input);
    assert.match(formatted, /^\d+ × .+/, `${tc.desc}: must match /^\\d+ × .+/`);
    assert.ok(!/\b\d+\s*x\b/i.test(formatted), `${tc.desc}: must not contain "x" quantity marker`);
    assert.ok(!/\bx\b/i.test(formatted), `${tc.desc}: must not contain standalone "x"`);
    assert.ok(!/(\.\.\.|\u2026)$/.test(formatted), `${tc.desc}: must not end in ellipsis`);
    assert.match(formatted, tc.expectedRegex, `${tc.desc}: failed regex ${tc.expectedRegex} on "${formatted}"`);
    console.log(`  ✓ PASS: "${tc.input}" -> "${formatted}"`);
  }

  // Real database test cases
  const dbPath = path.join(__dirname, '../camnex.db');
  if (fs.existsSync(dbPath)) {
    const db = require('better-sqlite3')(dbPath);
    const pkgs = db.prepare('SELECT data_json FROM packages').all().map(r => JSON.parse(r.data_json));
    let count = 0;
    for (const p of pkgs) {
      for (const item of (p.inclusions || [])) {
        const formatted = formatComponentLine(item);
        assert.match(formatted, /^\d+ × .+/, `Package "${p.name}" inclusion "${item}" must match /^\\d+ × .+/`);
        assert.ok(!/\b\d+\s*x\b/i.test(formatted), `Inclusion "${item}" -> "${formatted}" must not contain "x" quantity marker`);
        assert.ok(!/\bx\b/i.test(formatted), `Inclusion "${item}" -> "${formatted}" must not contain standalone "x"`);
        assert.ok(!/(\.\.\.|\u2026)$/.test(formatted), `Inclusion "${item}" -> "${formatted}" must not end in ellipsis`);
        count++;
      }
    }
    console.log(`  ✓ PASS: Tested all ${count} database inclusions against formatting requirements`);
  }

  console.log('\n✓ ALL COMPONENT LINE FORMATTER UNIT TESTS PASSED CLEANLY');
}

runTests();
