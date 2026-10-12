/**
 * Short display names for package components.
 *
 * Rule: an admin-set `shortName` always wins. Otherwise the full name is reduced by
 * stripping brand names, model numbers, technical spec tokens and marketing filler,
 * keeping the leading quantity ("4x", "80m"), and limited to MAX_SHORT_NAME_LENGTH
 * characters at a word boundary. A short name never ends with "..." – words are
 * dropped whole instead.
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

const SPEC_TOKEN = /^(\d+(\.\d+)?(mp|k|v|a|w|p|mm|x))$|^(irpf|ir|hd|fhd|uhd|ip67|ip66|h\.265\+?)$/i;
// Model numbers: mixed letters+digits with a hyphen or 6+ chars, e.g. DS-2CE16D0T-IRPF, C6N
const MODEL_TOKEN = /^(?=.*[a-z])(?=.*\d)[a-z0-9]+(-[a-z0-9]+)+$|^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,}$/i;
// Tokens worth keeping although they contain digits (capacities, channel counts, port counts, lengths)
const KEEP_TOKEN = /^\d+(\.\d+)?(tb|gb)$|^\d+-(channel|port|ch)$|^\d+m$|^\d+x$/i;

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

  const tokens = text.split(/\s+/).filter(Boolean).filter((tok, idx) => {
    if (KEEP_TOKEN.test(tok)) return true;
    if (idx === 0 && /^\d+x$/i.test(tok)) return true;
    if (SPEC_TOKEN.test(tok)) return false;
    if (MODEL_TOKEN.test(tok)) return false;
    return true;
  });

  // Drop orphan connectors at the edges ("&", "and", "with")
  while (tokens.length && /^(&|and|with|\+)$/i.test(tokens[tokens.length - 1])) tokens.pop();

  let result = '';
  for (const tok of tokens) {
    const next = result ? `${result} ${tok}` : tok;
    if (next.length > MAX_SHORT_NAME_LENGTH) break;
    result = next;
  }
  while (/\s(&|and|with|\+)$/i.test(result)) result = result.replace(/\s(&|and|with|\+)$/i, '');

  // If stripping removed everything meaningful, fall back to whole words of the original
  if (!result || /^\d+(x|m)?$/i.test(result)) {
    result = '';
    for (const tok of original.split(/\s+/)) {
      const next = result ? `${result} ${tok}` : tok;
      if (next.length > MAX_SHORT_NAME_LENGTH) break;
      result = next;
    }
  }
  return result;
}
