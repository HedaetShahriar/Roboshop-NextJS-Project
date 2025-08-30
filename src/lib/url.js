// Build query string from base params and overrides. Removes empty values.
// Returns a string starting with '?' or '' if empty.
export function buildQuery(base = {}, overrides = {}) {
  const params = new URLSearchParams();
  const put = (k, v) => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  };
  const entries = { ...base, ...overrides };
  // Normalize q -> search
  if (entries.q && !entries.search) entries.search = entries.q;
  const keys = [
    'search','from','to','sort','page','pageSize','inStock','hasDiscount',
    'minPrice','maxPrice','lowStock','cols','category','subcategory'
  ];
  for (const k of keys) put(k, entries[k]);
  const s = params.toString();
  return s ? `?${s}` : '';
}
