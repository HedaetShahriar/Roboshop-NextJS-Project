interface QueryParams {
  q?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string | number;
  pageSize?: string | number;
  inStock?: boolean | string;
  hasDiscount?: boolean | string;
  minPrice?: string | number;
  maxPrice?: string | number;
  lowStock?: boolean | string;
  cols?: string;
  category?: string;
  subcategory?: string;
  [key: string]: unknown;
}

// Build query string from base params and overrides. Removes empty values.
// Returns a string starting with '?' or '' if empty.
export function buildQuery(
  base: QueryParams = {},
  overrides: QueryParams = {},
): string {
  const params = new URLSearchParams();
  const put = (k: string, v: unknown): void => {
    if (v === undefined || v === null || v === "") return;
    params.set(k, String(v));
  };
  const entries = { ...base, ...overrides };
  // Normalize q -> search
  if (entries.q && !entries.search) entries.search = entries.q;
  const keys = [
    "search",
    "from",
    "to",
    "sort",
    "page",
    "pageSize",
    "inStock",
    "hasDiscount",
    "minPrice",
    "maxPrice",
    "lowStock",
    "cols",
    "category",
    "subcategory",
  ] as const;
  for (const k of keys) put(k, entries[k]);
  const s = params.toString();
  return s ? `?${s}` : "";
}
