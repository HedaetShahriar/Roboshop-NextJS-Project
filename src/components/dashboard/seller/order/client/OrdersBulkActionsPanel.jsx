"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, SlidersHorizontal, User } from "lucide-react";

export default function OrdersBulkActionsPanel({ formId = "bulkOrdersForm", defaultScope = 'selected', pageCount = 0, total = 0 }) {
  const [action, setAction] = useState('pack');
  const [scope, setScope] = useState(defaultScope);
  const [rider, setRider] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);

  // Clear rider unless assign is selected
  useEffect(() => {
    if (action !== 'assign') setRider('');
  }, [action]);

  // Track selected checkboxes on the page
  useEffect(() => {
    const update = () => {
      const inputs = document.querySelectorAll('input[type="checkbox"][name="ids"]:checked');
      setSelectedCount(inputs.length);
    };
    update();
    document.addEventListener('change', update, true);
    return () => document.removeEventListener('change', update, true);
  }, []);

  const hint = useMemo(() => {
    switch (action) {
      case 'pack': return 'Move orders from processing → packed (if applicable).';
      case 'assign': return 'Set status to assigned and optionally set rider name.';
      case 'ship': return 'Move assigned/packed → shipped.';
      case 'deliver': return 'Mark shipped → delivered.';
      case 'revert': return 'Revert non-final orders back to processing.';
      case 'cancel': return 'Cancel orders. This is destructive.';
      default: return '';
    }
  }, [action]);

  // Intercept submit to confirm for risky changes
  const onSubmitClick = (e) => {
    const risky = action === 'cancel' || scope === 'filtered';
    if (risky) {
      const msg = action === 'cancel'
        ? `Are you sure you want to CANCEL the targeted ${scope === 'selected' ? 'selected' : scope} orders?`
        : `Apply ${action} to all FILTERED orders?`;
      if (!window.confirm(msg)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
    return true;
  };

  return (
    <div className="rounded-md border bg-white p-2">
      <div className="grid gap-1.5">
        {/* Action picker */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Boxes size={12} /> Action
          </span>
          <select name="bulkAction" className="h-7 rounded border px-2 text-[12px]" value={action} onChange={(e)=>setAction(e.target.value)} form={formId}>
            <option value="pack">📦 Mark packed</option>
            <option value="assign">🚴 Assign rider…</option>
            <option value="ship">🚚 Mark shipped</option>
            <option value="deliver">✅ Mark delivered</option>
            <option value="revert">↩ Revert to processing</option>
            <option value="cancel">⛔ Cancel</option>
          </select>
          <span className="ml-auto hidden sm:inline text-[11px] text-muted-foreground">{hint}</span>
        </div>

        {/* Assign rider field */}
        {action === 'assign' && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><User size={12} /> Rider</span>
            <input name="bulkRiderName" placeholder="Rider name" className="h-7 px-2 rounded border text-[12px] sm:w-full w-40" form={formId} value={rider} onChange={(e)=>setRider(e.target.value)} />
          </div>
        )}

  {/* Scope */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <SlidersHorizontal size={12} /> Scope
          </span>
          <div className="flex items-center gap-1">
            <label className="cursor-pointer">
              <input type="radio" name="scope" value="selected" className="sr-only" checked={scope==='selected'} onChange={()=>setScope('selected')} form={formId} />
              <span className={`inline-flex h-7 items-center rounded border px-2 text-[12px] ${scope==='selected' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>Selected</span>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="scope" value="page" className="sr-only" checked={scope==='page'} onChange={()=>setScope('page')} form={formId} />
              <span className={`inline-flex h-7 items-center rounded border px-2 text-[12px] ${scope==='page' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>Page ({pageCount})</span>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="scope" value="filtered" className="sr-only" checked={scope==='filtered'} onChange={()=>setScope('filtered')} form={formId} />
              <span className={`inline-flex h-7 items-center rounded border px-2 text-[12px] ${scope==='filtered' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>Filtered ({total})</span>
            </label>
          </div>
          <span className="ml-auto text-[11px] text-muted-foreground">Selected: {selectedCount}</span>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <button type="submit" form={formId} onClick={onSubmitClick} className="h-7 px-2.5 rounded border text-[12px] bg-zinc-900 text-white hover:bg-zinc-800">Apply</button>
        </div>
      </div>
    </div>
  );
}
