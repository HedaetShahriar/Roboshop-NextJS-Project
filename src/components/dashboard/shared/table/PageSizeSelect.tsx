'use client';

import type { ChangeEvent } from 'react';

interface PageSizeOption {
  value: number | string;
  label?: string;
  href?: string;
}

interface PageSizeSelectProps {
  current: number | string;
  options: PageSizeOption[];
}

export default function PageSizeSelect({ current, options }: PageSizeSelectProps): React.ReactElement {
  return (
    <select
      className="border rounded-md h-9 px-2 text-sm"
      value={String(current)}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value;
        const match = options.find(o => String(o.value) === String(next));
        if (match?.href) {
          // Replace history entry to avoid polluting back stack for a simple size change
          window.location.replace(match.href);
        }
      }}
    >
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>{o.label ?? o.value}</option>
      ))}
    </select>
  );
}
