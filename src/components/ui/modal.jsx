'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title = 'Actions', children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-md border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            <button type="button" className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-zinc-100" aria-label="Close" onClick={onClose}>✕</button>
          </div>
          <div className="max-h-[70vh] overflow-auto p-3 text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
