export function formatDateTime(input) {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d)) return '';
  // Friendly format: 30 Aug 2025, 2:05 PM
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12; // 12-hour clock
  const datePart = year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
  return `${datePart}, ${hours}:${minutes} ${ampm}`;
}

// Format a date (no time) for chips/labels
// Accepts 'YYYY-MM-DD' string or Date. Returns '' for invalid.
export function formatDate(input) {
  if (!input) return '';
  let d;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, day] = input.split('-').map(Number);
    d = new Date(y, (m || 1) - 1, day || 1);
  } else {
    d = new Date(input);
  }
  if (isNaN(d)) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();
  return year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
}
