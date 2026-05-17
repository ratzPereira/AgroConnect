import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyCompact } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats integers with pt-PT EUR style', () => {
    expect(formatCurrency(120)).toMatch(/120,00/);
    expect(formatCurrency(120)).toContain('€');
  });

  it('formats decimals with two-digit precision', () => {
    expect(formatCurrency(99.5)).toMatch(/99,50/);
  });

  it('rounds half-up to 2 decimals', () => {
    expect(formatCurrency(99.999)).toMatch(/100,00/);
  });

  it('accepts numeric strings', () => {
    expect(formatCurrency('42.5')).toMatch(/42,50/);
  });

  it('uses thousand separators', () => {
    const out = formatCurrency(12345.67);
    // pt-PT Intl uses a thin/regular space as group separator in Node — accept either
    expect(out).toMatch(/12[.\s\u00A0\u202F]345,67/);
  });

  it('returns em-dash for null/undefined/empty', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
    expect(formatCurrency('')).toBe('—');
  });

  it('returns em-dash for NaN and non-finite values', () => {
    expect(formatCurrency('not-a-number')).toBe('—');
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toMatch(/0,00/);
  });
});

describe('formatCurrencyCompact', () => {
  it('omits decimal places', () => {
    expect(formatCurrencyCompact(120)).toMatch(/120\s?€|€\s?120/);
    expect(formatCurrencyCompact(120)).not.toContain(',00');
  });

  it('returns em-dash for null/undefined', () => {
    expect(formatCurrencyCompact(null)).toBe('—');
    expect(formatCurrencyCompact(undefined)).toBe('—');
  });
});
