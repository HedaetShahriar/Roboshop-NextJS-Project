"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MarketsPricingEditor({ name = "markets", initial = [] }) {
  const [rows, setRows] = useState(Array.isArray(initial) ? initial : []);
  const add = useCallback(() => setRows((r)=>[...r, { market: "BD", price: 0, taxIncluded: true }]), []);
  const remove = useCallback((idx) => setRows((r)=> r.filter((_,i)=>i!==idx)), []);
  const update = useCallback((idx, field, val) => setRows((r)=> r.map((it,i)=> i===idx? { ...it, [field]: val }: it)), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Per-market pricing</div>
        <Button type="button" variant="outline" size="sm" onClick={add}>Add market</Button>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="text-xs text-muted-foreground">No markets configured.</div>}
        {rows.map((it, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-[120px_1fr_160px_auto] gap-2 items-center">
            <Input placeholder="Market (e.g. BD)" value={it.market} onChange={(e)=>update(idx,'market',e.target.value)} />
            <Input type="number" placeholder="Price" value={it.price} onChange={(e)=>update(idx,'price', Number(e.target.value))} />
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!it.taxIncluded} onChange={(e)=>update(idx,'taxIncluded', e.target.checked)} /> Tax included</label>
            <Button type="button" variant="outline" size="sm" onClick={()=>remove(idx)}>Remove</Button>
            <input type="hidden" name={`${name}[${idx}][market]`} value={it.market} />
            <input type="hidden" name={`${name}[${idx}][price]`} value={it.price} />
            <input type="hidden" name={`${name}[${idx}][taxIncluded]`} value={it.taxIncluded ? '1' : '0'} />
          </div>
        ))}
      </div>
    </div>
  );
}
