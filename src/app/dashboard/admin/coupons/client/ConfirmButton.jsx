'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function ConfirmButton({ children = 'Delete', message = 'Are you sure?', className = '', formId, formAction, hiddenFields = [] }) {
  const [open, setOpen] = useState(false);

  const submit = useCallback(() => {
    if (formId) {
      const form = document.getElementById(formId);
      if (form) {
        // Apply/override provided hidden fields into the form before submitting
        if (Array.isArray(hiddenFields) && hiddenFields.length > 0) {
          hiddenFields.forEach(({ name, value }) => {
            if (!name) return;
            const el = form.elements.namedItem(String(name));
            if (el && 'value' in el) {
              try { el.value = String(value); } catch {}
            } else {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = String(name);
              input.value = String(value);
              form.appendChild(input);
            }
          });
        }
        form.requestSubmit();
        return;
      }
    }
    const form = document.createElement('form');
    form.method = 'post';
    if (formAction) form.action = formAction;
    hiddenFields.forEach(({ name, value }) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = String(name);
      input.value = String(value);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }, [formAction, formId, hiddenFields]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="h-8 px-3 rounded border" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="h-8 px-3 rounded bg-zinc-900 text-white" onClick={() => { setOpen(false); submit(); }}>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
