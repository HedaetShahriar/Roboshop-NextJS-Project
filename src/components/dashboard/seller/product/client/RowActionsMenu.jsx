'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';

export default function RowActionsMenu({ children, title = 'Product actions' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-xs">
      <button type="button" className="inline-flex items-center rounded border px-2 py-1 bg-white hover:bg-zinc-50" onClick={()=>setOpen(true)} aria-expanded={open}>
        Actions <span className="ml-1">▾</span>
      </button>
      <Modal open={open} onClose={()=>setOpen(false)} title={title}>
        <div className="space-y-2">
          {children}
        </div>
      </Modal>
    </div>
  );
}
