"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

function fmt(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function QuickRanges({ className = "" }) {
  const router = useRouter();
  const sp = useSearchParams();

  const apply = useCallback((range) => {
    const now = new Date();
    let from, to;
    if (range === 'today') {
      from = fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      to = from;
    } else if (range === '7d') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      from = fmt(start); to = fmt(now);
    } else if (range === '30d') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      from = fmt(start); to = fmt(now);
    } else {
      from = ''; to = '';
    }
    const p = new URLSearchParams(sp?.toString() || '');
    if (from) p.set('from', from); else p.delete('from');
    if (to) p.set('to', to); else p.delete('to');
    p.delete('page');
    router.push(`/dashboard/seller/orders?${p.toString()}`);
  }, [router, sp]);

  return (
    <div className={"hidden sm:flex items-center gap-1 " + className}>
      {[
        { k: 'today', label: 'Today' },
        { k: '7d', label: '7d' },
        { k: '30d', label: '30d' },
        { k: 'clear', label: 'Clear' },
      ].map(({ k, label }) => (
        <button key={k} type="button" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 text-[11px]" onClick={() => apply(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}
