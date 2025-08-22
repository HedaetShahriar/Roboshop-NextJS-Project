// Lightweight, consistent date formatting helper
// Usage: formatDate(dateLike, 'datetime' | 'date' | 'time' | 'datetimeY' | 'dateY' | customOptions)

export function formatDate(input, style = 'datetime', locale) {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d?.getTime?.())) return '';
    let options;
    if (style === 'datetime') {
      // Default: no year (compact)
      options = { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    } else if (style === 'date') {
      // Default: no year (compact)
      options = { month: 'short', day: '2-digit' };
    } else if (style === 'time') {
      options = { hour: '2-digit', minute: '2-digit' };
    } else if (style === 'datetimeY') {
      options = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    } else if (style === 'dateY') {
      options = { year: 'numeric', month: 'short', day: '2-digit' };
    } else if (typeof style === 'object' && style) {
      options = style;
    } else {
      options = { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    }
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return '';
  }
}
