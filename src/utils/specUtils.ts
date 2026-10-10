import { SpecFieldDefinition, SpecTemplate } from '../types';

/**
 * Universal formatSpecValue function used by cards, quick view, and hero:
 * - Use the field's "highlightValue" when set.
 * - Booleans show a check icon with the field's short label (and no tile when false).
 * - Numbers append the unit from the spec template (370 becomes "370 W").
 * - Strings longer than 14 characters fall back to the first number plus unit, else are skipped.
 * - Never "..." and never the raw words "true" or "false".
 * - Tile labels use the template's "shortLabel" (max 14 characters) or fallback to label/name.
 */
export interface FormattedSpecResult {
  label: string;
  value: string;
  isBoolean?: boolean;
}

export function formatSpecValue(
  field: SpecFieldDefinition | {
    id?: string;
    key?: string;
    name?: string;
    label?: string;
    shortLabel?: string;
    type?: string;
    unit?: string;
    highlightValue?: string;
  },
  value: any,
  template?: SpecTemplate | null
): FormattedSpecResult | null {
  if (value === undefined || value === null) return null;

  // Find corresponding template field definition if available for unit/shortLabel
  const fieldKey = (field as any).key || (field as any).id;
  const tplField = template?.fields?.find(
    (f) => f.key === fieldKey || f.id === fieldKey || f.name.toLowerCase() === ((field as any).name || '').toLowerCase()
  );

  const unit = (field as any).unit || tplField?.unit || '';
  const labelRaw = (field as any).shortLabel || tplField?.shortLabel || (field as any).label || (field as any).name || tplField?.label || tplField?.name || 'Feature';
  // Tile labels use template's shortLabel (max 14 characters)
  const cleanLabel = String(labelRaw).trim().slice(0, 14);

  // 1. If explicit highlightValue is set
  const explicitHighlight = (field as any).highlightValue;
  if (typeof explicitHighlight === 'string' && explicitHighlight.trim().length > 0) {
    let hlVal = explicitHighlight.trim();
    if (hlVal.length <= 14) {
      return { label: cleanLabel, value: hlVal };
    }
    const numUnitMatch = hlVal.match(/^(\d+(?:\.\d+)?\s*[a-zA-Z]+)/);
    if (numUnitMatch && numUnitMatch[1].length <= 14) {
      return { label: cleanLabel, value: numUnitMatch[1].trim() };
    }
    return null;
  }

  // 2. Booleans: show check icon with the field's short label (and no tile when false)
  // Never raw words "true" or "false"
  if (typeof value === 'boolean' || (field as any).type === 'boolean' || value === 'true' || value === 'false') {
    const isTrue = value === true || value === 'true' || value === 1 || value === '1';
    if (!isTrue) return null;
    return {
      label: cleanLabel,
      value: cleanLabel,
      isBoolean: true
    };
  }

  // 3. Numbers: append unit from spec template (e.g. 370 becomes "370 W")
  if (typeof value === 'number' || (!isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '' && !/[a-zA-Z]/.test(value))) {
    const num = String(value).trim();
    const formatted = unit ? `${num} ${unit}`.trim() : num;
    if (formatted.length <= 14) {
      return { label: cleanLabel, value: formatted };
    }
    return null;
  }

  // 4. Strings: longer than 14 characters fall back to first number plus unit, else are skipped; never "..."
  const strVal = String(value).trim();
  if (strVal.toLowerCase() === 'true' || strVal.toLowerCase() === 'false') {
    if (strVal.toLowerCase() === 'true') {
      return { label: cleanLabel, value: cleanLabel, isBoolean: true };
    }
    return null;
  }

  if (strVal.length <= 14) {
    const finalVal = unit && !strVal.toLowerCase().includes(unit.toLowerCase()) ? `${strVal} ${unit}` : strVal;
    if (finalVal.length <= 14) {
      return { label: cleanLabel, value: finalVal };
    }
    return { label: cleanLabel, value: strVal };
  }

  // Longer than 14 characters: fall back to the first number plus unit
  const numUnitMatch = strVal.match(/(\d+(?:\.\d+)?\s*[a-zA-Z]+)/);
  if (numUnitMatch && numUnitMatch[1].length <= 14) {
    return { label: cleanLabel, value: numUnitMatch[1].trim() };
  }

  // If no number+unit or still > 14 chars, skipped
  return null;
}
