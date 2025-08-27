'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'productsSavedViews';

export default function SavedViews() {
  const [views, setViews] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setViews(JSON.parse(raw));
    } catch {}
  }, []);

  const saveCurrent = () => {
    const name = prompt('Save view as:');
    if (!name) return;
    const qs = window.location.search || '';
    const next = [{ id: Date.now(), name, qs }, ...views].slice(0, 20);
    setViews(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
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

  if (!useMemo(() => true, [])) return null; // ensure client

  return (
    <div className="relative">
      <button type="button" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50" onClick={() => setOpen(o=>!o)}>
        Views ▾
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded border bg-white shadow p-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Saved views</div>
            <button type="button" className="text-xs underline" onClick={saveCurrent}>Save current</button>
          </div>
          <ul className="mt-2 max-h-64 overflow-auto text-sm">
            {views.length === 0 ? (
              <li className="px-2 py-1 text-xs text-muted-foreground">No saved views yet</li>
            ) : (
              views.map(v => (
                <li key={v.id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-zinc-50 rounded">
                  <button type="button" className="text-left truncate" title={v.name} onClick={() => applyView(v)}>{v.name}</button>
                  <button type="button" className="text-[11px] text-rose-600" onClick={() => removeView(v.id)}>Delete</button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
