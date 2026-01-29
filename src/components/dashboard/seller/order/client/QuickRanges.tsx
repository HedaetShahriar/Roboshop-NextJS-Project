"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

function fmt(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface QuickRangesProps {
  className?: string;
}

type RangeKey = 'today' | '7d' | '30d' | 'clear';

export default function QuickRanges({ className = "" }: QuickRangesProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const apply = useCallback((range: RangeKey) => {
    const now = new Date();
    let from: string, to: string;
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
      {([
        { k: 'today' as RangeKey, label: 'Today' },
        { k: '7d' as RangeKey, label: '7d' },
        { k: '30d' as RangeKey, label: '30d' },
        { k: 'clear' as RangeKey, label: 'Clear' },
      ]).map(({ k, label }) => (
        <button key={k} type="button" className="h-7 px-2 rounded border bg-white hover:bg-zinc-50 text-[11px]" onClick={() => apply(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}
