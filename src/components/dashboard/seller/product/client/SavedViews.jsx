"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Pencil, Save, RefreshCw, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "productsSavedViews";

export default function SavedViews() {
  const [views, setViews] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [renameId, setRenameId] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setViews(JSON.parse(raw));
    } catch {}
  }, []);

  const saveCurrent = () => {
    const name = nameInput.trim();
    if (!name) return;
    const qs = window.location.search || '';
    const next = [{ id: Date.now(), name, qs }, ...views].slice(0, 20);
    setViews(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setNameInput("");
  };

  const overwriteView = (id) => {
    const qs = window.location.search || '';
    const next = views.map((v) => v.id === id ? { ...v, qs } : v);
    setViews(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const renameView = (id) => {
    const found = views.find(v => v.id === id);
    if (!found) return;
    setRenameId(id);
    setRenameInput(found.name || "");
  };

  const commitRename = () => {
    const name = renameInput.trim();
    if (!name || !renameId) { setRenameId(null); return; }
    const next = views.map(v => v.id === renameId ? { ...v, name } : v);
    setViews(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    setRenameId(null);
    setRenameInput("");
  };

  const applyView = (v) => {
    const base = '/dashboard/seller/products';
    window.location.href = base + (v.qs || '');
  };

  const removeView = (id) => {
    const next = views.filter(v => v.id !== id);
    setViews(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const clearAll = () => {
    setConfirmClear(true);
  };
  const confirmClearAll = () => {
    setViews([]);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([])); } catch {}
    setConfirmClear(false);
  };
  const cancelClearAll = () => setConfirmClear(false);

  const getPreviewChips = (qs) => {
    if (!qs) return [];
    const params = new URLSearchParams(qs.startsWith('?') ? qs.slice(1) : qs);
    const chips = [];
    const q = params.get('search') || params.get('q');
    if (q) chips.push(`q:${q}`);
    const cat = params.get('category');
    if (cat) chips.push(`cat:${cat}`);
    const sub = params.get('subcategory');
    if (sub) chips.push(`sub:${sub}`);
    const inStock = params.get('inStock');
    if (inStock) chips.push('stock');
    const hasDiscount = params.get('hasDiscount');
    if (hasDiscount) chips.push('discount');
    const minP = params.get('minPrice');
    const maxP = params.get('maxPrice');
    if (minP || maxP) chips.push(`৳ ${minP || 0}-${maxP || '∞'}`);
    const from = params.get('from');
    const to = params.get('to');
    if (from || to) chips.push(`${from?.slice(0,10) || '..'}→${to?.slice(0,10) || '..'}`);
    const sort = params.get('sort');
    if (sort && sort !== 'newest') chips.push(`sort:${sort}`);
    return chips.slice(0, 5);
  };

  if (!useMemo(() => true, [])) return null; // ensure client

  return (
    <div>
      {/* Add new view */}
      <div className="flex items-center gap-2 px-1">
        <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="View name" className="h-7 px-2 text-[12px]" />
        <button type="button" className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50 inline-flex items-center gap-1" onClick={saveCurrent}><Save size={12} /> Save</button>
      </div>
      <ul className="mt-2 max-h-56 overflow-auto text-sm divide-y rounded">
        {views.length === 0 ? (
          <li className="px-2 py-2 text-xs text-muted-foreground">No saved views yet</li>
        ) : (
          views.map((v, i) => (
            <li key={v.id} className="px-2 py-2 hover:bg-zinc-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-5 shrink-0">{i+1}.</span>
                {renameId === v.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="h-7 px-2 text-[12px]" />
                    <button type="button" className="h-7 w-7 rounded border inline-flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700" aria-label="Save name" onClick={commitRename}><Check size={14} /></button>
                    <button type="button" className="h-7 w-7 rounded border inline-flex items-center justify-center bg-white hover:bg-zinc-50" aria-label="Cancel" onClick={() => setRenameId(null)}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <button type="button" className="text-left truncate flex-1" title={v.name} onClick={() => applyView(v)}>{v.name}</button>
                    <button type="button" className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50 inline-flex items-center gap-1" onClick={() => overwriteView(v.id)}><RefreshCw size={12} /> Overwrite</button>
                    <button type="button" className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50 inline-flex items-center gap-1" onClick={() => renameView(v.id)}><Pencil size={12} /> Rename</button>
                    <button type="button" className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50 inline-flex items-center gap-1 text-rose-600" onClick={() => removeView(v.id)}><Trash2 size={12} /> Delete</button>
                  </>
                )}
              </div>
              {/* Preview chips */}
              {(() => {
                const chips = getPreviewChips(v.qs);
                if (chips.length === 0) return null;
                return (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {chips.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground bg-zinc-50">{c}</span>
                    ))}
                  </div>
                );
              })()}
            </li>
          ))
        )}
      </ul>
      <div className="mt-2 flex items-center justify-end px-1 gap-2">
        {confirmClear ? (
          <>
            <span className="text-[11px] text-muted-foreground">Clear all views?</span>
            <button type="button" className="h-7 px-2 rounded border text-[11px] bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center gap-1" onClick={confirmClearAll}><Trash2 size={12} /> Confirm</button>
            <button type="button" className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50 inline-flex items-center gap-1" onClick={cancelClearAll}><X size={12} /> Cancel</button>
          </>
        ) : (
          <button type="button" className="text-[11px] text-rose-600 hover:underline inline-flex items-center gap-1" onClick={clearAll}><Trash2 size={12} /> Clear all</button>
        )}
      </div>
    </div>
  );
}
