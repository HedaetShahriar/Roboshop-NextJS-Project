'use client';

export default function SubmitFormButton({ formId, sourceId, targetName, className = '', disabled = false, children = 'Submit' }) {
  function handleClick() {
    if (disabled) return;
    try {
      const form = document.getElementById(formId);
      if (!form) return;
      if (sourceId && targetName) {
        const src = document.getElementById(sourceId);
        if (src) {
          let input = form.querySelector(`input[name="${targetName}"]`);
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = String(targetName);
            form.appendChild(input);
          }
          input.value = String(src.value ?? '');
        }
      }
      form.requestSubmit();
    } catch {
      // no-op
    }
  }
  return (
    <button type="button" className={className} onClick={handleClick} disabled={disabled} aria-disabled={disabled}>
      {children}
    </button>
  );
}
