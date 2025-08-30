"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function KeyValueEditor({ name, initial = [], label = "Specifications" }) {
  const [rows, setRows] = useState(() => Array.isArray(initial) ? initial : []);

  const add = useCallback(() => setRows((r) => [...r, { key: "", value: "" }]), []);
  const remove = useCallback((idx) => setRows((r) => r.filter((_, i) => i !== idx)), []);
  const update = useCallback((idx, field, val) => setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: val } : row))), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="text-xs text-muted-foreground">No items. Click Add to insert rows.</div>
        )}
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
            <Input placeholder="Key (e.g. Brand)" value={row.key} onChange={(e)=>update(idx,'key',e.target.value)} />
            <Input placeholder="Value (e.g. ACME)" value={row.value} onChange={(e)=>update(idx,'value',e.target.value)} />
            <Button type="button" variant="outline" size="sm" onClick={()=>remove(idx)}>Remove</Button>
            <input type="hidden" name={`${name}[${idx}][key]`} value={row.key} />
            <input type="hidden" name={`${name}[${idx}][value]`} value={row.value} />
          </div>
        ))}
      </div>
    </div>
  );
}
