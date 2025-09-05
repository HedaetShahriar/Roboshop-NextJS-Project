'use client';

import { useCallback } from 'react';

export default function SelectAllCheckbox({ formId, name = 'ids', className = '' }) {
  const onChange = useCallback((e) => {
    const form = document.getElementById(formId);
    if (!form) return;
    const checked = e.currentTarget.checked;
    const boxes = form.querySelectorAll(`input[name="${name}"]`);
    boxes.forEach((el) => { if (el instanceof HTMLInputElement) el.checked = checked; });
  }, [formId, name]);

  return (
    <input type="checkbox" aria-label="Select all" className={className} onChange={onChange} />
  );
}
