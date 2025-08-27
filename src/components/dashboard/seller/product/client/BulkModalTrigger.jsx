"use client";

import { useState } from "react";
import Modal from "@/components/ui/modal";
import BulkActionsPanel from "./BulkActionsPanel";

export default function BulkModalTrigger({ formId, scope, pageCount, total }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50" onClick={() => setOpen(true)}>
        Bulk
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Bulk actions">
        <div className="space-y-2">
          <BulkActionsPanel compact formId={formId} defaultScope={scope} pageCount={pageCount} total={total} />
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50" onClick={() => setOpen(false)}>Close</button>
            <button type="submit" form={formId} className="h-8 px-3 rounded border text-xs bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => setOpen(false)}>Apply</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
