const EUR_FORMATTER = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EUR_FORMATTER_COMPACT = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return EUR_FORMATTER.format(n);
}

/**
 * Formats a unit cost (WAC / purchase price) with at least 2 and at most 4
 * decimal places: 22.5 → "22.50", 22.5031 → "22.5031". Costs are stored with
 * scale 4 for accounting precision, but trailing zeros are visual noise.
 */
export function formatUnitCost(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  const stripped = n.toFixed(4).replace(/0+$/, '');
  const [intPart, decPart = ''] = stripped.split('.');
  return `${intPart}.${(decPart + '00').slice(0, Math.max(2, decPart.length))}`;
}

export function formatCurrencyCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  return EUR_FORMATTER_COMPACT.format(n);
}
