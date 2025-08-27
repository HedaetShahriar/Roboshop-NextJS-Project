'use client';

import { useEffect, useState } from 'react';

export default function SavedViewsServer() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/views', { cache: 'no-store' });
      const json = await res.json();
      setItems(json.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveCurrent = async () => {
    const name = prompt('Save view as:');
    if (!name) return;
    const qs = window.location.search || '';
    await fetch('/api/seller/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, qs })
    });
    load();
  };

  const applyView = (v) => {
    const base = '/dashboard/seller/products';
    window.location.href = base + (v.qs || '');
  };

  return (
    <div className="relative">
      <button type="button" className="h-8 px-3 rounded border text-xs bg-white hover:bg-zinc-50" onClick={() => setOpen(o=>!o)}>
        Server Views ▾
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-64 rounded border bg-white shadow p-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Saved views</div>
            <button type="button" className="text-xs underline" onClick={saveCurrent}>Save current</button>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">{loading ? 'Loading…' : ''}</div>
          <ul className="mt-2 max-h-64 overflow-auto text-sm">
            {items.length === 0 ? (
              <li className="px-2 py-1 text-xs text-muted-foreground">No saved views yet</li>
            ) : (
              items.map(v => (
                <li key={v._id} className="flex items-center justify-between gap-2 px-2 py-1 hover:bg-zinc-50 rounded">
                  <button type="button" className="text-left truncate" title={v.name} onClick={() => applyView(v)}>{v.name}</button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
