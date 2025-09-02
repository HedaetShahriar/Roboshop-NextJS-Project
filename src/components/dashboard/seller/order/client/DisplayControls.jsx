"use client";

import Link from "next/link";
import SavedViews from "./SavedViews";

export default function DisplayControls({ basePath = "/dashboard/seller/orders", allCols = [], visibleCols = [], query = {} }) {
  const toQS = (overrides = {}) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(query || {})) {
      if (v === undefined || v === null || v === "") continue;
      usp.set(k, String(v));
    }
    for (const [k, v] of Object.entries(overrides || {})) {
      if (v === undefined || v === null || v === "") usp.delete(k);
      else usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `?${s}` : "";
  };

  const toggle = (col) => {
    const set = new Set(visibleCols);
    if (set.has(col)) set.delete(col); else set.add(col);
    const cols = Array.from(set).filter(Boolean).join(",");
    return `${basePath}${toQS({ cols, page: 1 })}`;
  };

  const presets = [
    { name: 'Default', cols: allCols.join(',') },
    { name: 'Compact', cols: ['order','status','created','total','actions'].filter(allCols.includes.bind(allCols)).join(',') },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <div className="text-[11px] font-medium text-muted-foreground px-1">Columns</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {allCols.map((c) => (
            <Link key={c} href={toggle(c)} className={`h-8 px-2 rounded border text-xs inline-flex items-center justify-center ${visibleCols.includes(c) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>{c}</Link>
          ))}
        </div>
        <div className="mt-3 text-[11px] font-medium text-muted-foreground px-1">Presets</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p, i) => (
            <Link key={i} href={`${basePath}${toQS({ cols: p.cols, page: 1 })}`} className="h-8 px-2 rounded border text-xs bg-white hover:bg-zinc-50">{p.name}</Link>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-medium text-muted-foreground px-1">Saved views</div>
        <div className="mt-2">
          <SavedViews />
        </div>
      </div>
    </div>
  );
}
