'use client';

import { useState } from 'react';

export default function SelectAllOnPage() {
  const [checked, setChecked] = useState(false);
  const toggle = () => {
    const next = !checked;
    setChecked(next);
    const inputs = document.querySelectorAll('input[type="checkbox"][name="ids"]');
    inputs.forEach((el) => { el.checked = next; });
  };
  return (
    <button type="button" onClick={toggle} className="h-6 w-6 rounded border bg-white hover:bg-zinc-50" title={checked ? 'Unselect all' : 'Select all'} aria-pressed={checked}>
      {checked ? '–' : '✓'}
    </button>
  );
}
