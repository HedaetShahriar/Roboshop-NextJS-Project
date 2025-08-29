// Core formatter; we prefer narrowSymbol but will enforce the Taka sign explicitly
export const BDT = new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2, currencyDisplay: 'narrowSymbol' });

export function formatBDT(n) {
  const num = Number(n || 0);
  try {
    // Ensure we always show the Taka symbol (৳) even if the runtime falls back to "BDT"
  const parts = BDT.formatToParts(num);
  return parts.map(p => (p.type === 'currency' ? '৳ ' : p.value)).join('');
  } catch {
    // Fallback if formatToParts is unavailable
    const base = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(num);
  return `৳ ${base}`;
  }
}

export function formatBDTCompact(n) {
  const num = Number(n || 0);
  // e.g., ৳ 1.2K
  return new Intl.NumberFormat('en-BD', { notation: 'compact', maximumFractionDigits: 1 }).format(num).replace(/^/, '৳ ');
}
