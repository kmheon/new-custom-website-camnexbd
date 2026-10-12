/**
 * Short display names and component line formatting for package inclusions.
 *
 * Requirements:
 * 1. Format every component line as "{qty} × {short name}"
 *    (uses the × sign \u00D7, space on each side, qty first).
 * 2. Works for both card preview and popover.
 * 3. Never "2x", never "15x" without the product name, never "1× 25x ..." (strips spec words like 25x).
 * 4. Never truncates in the middle of a name with "...".
 * 5. Every line matches /^\d+ × .+/; no line contains "x" as a quantity marker.
 */

export const MAX_SHORT_NAME_LENGTH = 36;

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

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function getShortDisplayName(fullName: string, shortName?: string | null): string {
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
    if (next.length > MAX_SHORT_NAME_LENGTH) break;
    result = next;
  }
  return result.trim() || original.slice(0, MAX_SHORT_NAME_LENGTH).trim();
}

export function formatComponentLine(fullName: string, shortName?: string | null): string {
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
