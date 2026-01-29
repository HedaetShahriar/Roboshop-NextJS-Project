'use client';

import { useCallback, ChangeEvent } from 'react';

interface SelectAllCheckboxProps {
  formId: string;
  name?: string;
  className?: string;
}

export default function SelectAllCheckbox({ formId, name = 'ids', className = '' }: SelectAllCheckboxProps) {
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
