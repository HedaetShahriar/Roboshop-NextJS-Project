"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical } from "lucide-react";

export default function VariantsEditor({ name = "variants", initial = [] }) {
  const [rows, setRows] = useState(Array.isArray(initial) ? initial : []);
  const add = useCallback(() => setRows((r)=>[...r, { size: "", color: "", sku: "", priceDelta: 0, stock: 0 }]), []);
  const remove = useCallback((idx) => setRows((r)=> r.filter((_,i)=>i!==idx)), []);
  const update = useCallback((idx, field, val) => setRows((r)=> r.map((it,i)=> i===idx? { ...it, [field]: val }: it)), []);
  // DnD
  const [dragging, setDragging] = useState(null);
  const onDragStartRow = (e, idx) => {
    if (!e.target.closest('[data-drag-handle]')) {
      e.preventDefault();
      return;
    }
    setDragging(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };
  const onDragEnterRow = (e, overIdx) => {
    e.preventDefault();
    if (dragging === null || dragging === overIdx) return;
    setRows((r) => {
      const next = r.slice();
      const [moved] = next.splice(dragging, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragging(overIdx);
  };
  const onDragEndRow = () => setDragging(null);

  // Option presets
  const [sizeOptions, setSizeOptions] = useState("S,M,L");
  const [colorOptions, setColorOptions] = useState("Red,Blue,Green");
  const generate = useCallback(() => {
    const sizes = sizeOptions.split(',').map(s=>s.trim()).filter(Boolean);
    const colors = colorOptions.split(',').map(s=>s.trim()).filter(Boolean);
    const combos = [];
    if (sizes.length && colors.length) {
      for (const s of sizes) for (const c of colors) combos.push({ size: s, color: c });
    } else if (sizes.length) {
      for (const s of sizes) combos.push({ size: s, color: '' });
    } else if (colors.length) {
      for (const c of colors) combos.push({ size: '', color: c });
    }
    setRows((r)=>{
      const existing = new Set(r.map(x=>`${x.size}__${x.color}`));
      const toAdd = combos.filter(x=> !existing.has(`${x.size}__${x.color}`)).map(x=> ({ ...x, sku: '', priceDelta: 0, stock: 0 }));
      return [...r, ...toAdd];
    });
  }, [sizeOptions, colorOptions]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Variants</div>
        <Button type="button" variant="outline" size="sm" onClick={add}>Add variant</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end rounded-md border p-3 bg-zinc-50">
        <Input placeholder="Sizes (comma separated)" value={sizeOptions} onChange={(e)=>setSizeOptions(e.target.value)} />
        <Input placeholder="Colors (comma separated)" value={colorOptions} onChange={(e)=>setColorOptions(e.target.value)} />
        <Button type="button" variant="outline" size="sm" onClick={generate}>Generate combinations</Button>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="text-xs text-muted-foreground">No variants.</div>}
        {rows.map((it, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr_120px_120px_auto] gap-2 items-center rounded ${dragging===idx ? 'bg-zinc-50' : ''}`}
            draggable
            onDragStart={(e)=>onDragStartRow(e, idx)}
            onDragEnter={(e)=>onDragEnterRow(e, idx)}
            onDragEnd={onDragEndRow}
          >
            <div className="h-full flex items-center justify-center md:justify-start">
              <button type="button" data-drag-handle className="cursor-grab active:cursor-grabbing rounded p-1 text-zinc-500 hover:text-zinc-700" aria-label="Drag to reorder">
                <GripVertical className="size-4" />
              </button>
            </div>
            <Input placeholder="Size" value={it.size} onChange={(e)=>update(idx,'size',e.target.value)} />
            <Input placeholder="Color" value={it.color} onChange={(e)=>update(idx,'color',e.target.value)} />
            <Input placeholder="SKU" value={it.sku} onChange={(e)=>update(idx,'sku',e.target.value)} />
            <Input type="number" placeholder="Price Δ" value={it.priceDelta} onChange={(e)=>update(idx,'priceDelta', Number(e.target.value))} />
            <Input type="number" placeholder="Stock" value={it.stock} onChange={(e)=>update(idx,'stock', Number(e.target.value))} />
            <Button type="button" variant="outline" size="sm" onClick={()=>remove(idx)}>Remove</Button>
            <input type="hidden" name={`${name}[${idx}][size]`} value={it.size} />
            <input type="hidden" name={`${name}[${idx}][color]`} value={it.color} />
            <input type="hidden" name={`${name}[${idx}][sku]`} value={it.sku} />
            <input type="hidden" name={`${name}[${idx}][priceDelta]`} value={it.priceDelta} />
            <input type="hidden" name={`${name}[${idx}][stock]`} value={it.stock} />
          </div>
        ))}
      </div>
    </div>
  );
}
