'use client';

export default function PageSizeSelect({ current, options }) {
  return (
    <select
      className="border rounded-md h-9 px-2 text-sm"
      value={String(current)}
      onChange={(e) => {
        const next = e.target.value;
        const match = options.find(o => String(o.value) === String(next));
        if (match?.href) {
          window.location.assign(match.href);
        }
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={String(o.value)}>{o.label ?? o.value}</option>
      ))}
    </select>
  );
}
