"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical } from "lucide-react";

export default function GalleryEditor({ name = "gallery", initial = [] }) {
  const [items, setItems] = useState(Array.isArray(initial) ? initial : []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const add = useCallback(() => setItems((r)=>[...r, { url: "", alt: "" }]), []);
  const remove = useCallback((idx) => setItems((r)=> r.filter((_,i)=>i!==idx)), []);
  const update = useCallback((idx, field, val) => setItems((r)=> r.map((it,i)=> i===idx? { ...it, [field]: val }: it)), []);
  const move = useCallback((idx, dir) => setItems((r)=>{
    const next = r.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return r;
    const t = next[idx]; next[idx] = next[j]; next[j] = t;
    return next;
  }), []);

  const doUpload = async (file) => {
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data?.ok && data.url) {
        setItems((r)=>[...r, { url: data.url, alt: '' }]);
      }
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    for (const f of files) await doUpload(f);
  }, []);

  const onPaste = useCallback(async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    for (const it of items) {
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) await doUpload(f);
      }
    }
  }, []);

  const onFilePicker = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await doUpload(f);
    e.target.value = '';
  };

  // DnD reorder
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
    setItems((r) => {
      const next = r.slice();
      const [moved] = next.splice(dragging, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    setDragging(overIdx);
  };
  const onDragEndRow = () => setDragging(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Images</div>
        <Button type="button" variant="outline" size="sm" onClick={add}>Add image</Button>
      </div>
      <div className="space-y-3" onDrop={onDrop} onDragOver={(e)=>e.preventDefault()} onPaste={onPaste}>
        {items.length === 0 && <div className="text-xs text-muted-foreground">No images.</div>}
        <div className="rounded-md border bg-zinc-50 p-3 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">Drag & drop images here, paste, or</div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFilePicker} />
            <Button type="button" variant="outline" size="sm" onClick={()=>fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : 'Choose files'}</Button>
          </div>
        </div>
        {items.map((it, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-2 items-start rounded ${dragging===idx ? 'bg-zinc-50' : ''}`}
            draggable
            onDragStart={(e)=>onDragStartRow(e, idx)}
            onDragEnter={(e)=>onDragEnterRow(e, idx)}
            onDragEnd={onDragEndRow}
          >
            <div className="h-full flex items-center justify-center md:justify-start pt-2 md:pt-0">
              <button type="button" data-drag-handle className="cursor-grab active:cursor-grabbing rounded p-1 text-zinc-500 hover:text-zinc-700" aria-label="Drag to reorder">
                <GripVertical className="size-4" />
              </button>
            </div>
            <div className="space-y-1">
              <Input placeholder="Image URL" value={it.url} onChange={(e)=>update(idx,'url',e.target.value)} />
              {it.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.url} alt={it.alt||''} className="h-28 w-full object-cover rounded border" onError={(e)=> (e.currentTarget.style.opacity='0.3')} />
              ) : null}
            </div>
            <Input placeholder="Alt text" value={it.alt} onChange={(e)=>update(idx,'alt',e.target.value)} />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={()=>move(idx,-1)} disabled={idx===0}>Up</Button>
              <Button type="button" variant="outline" size="sm" onClick={()=>move(idx,1)} disabled={idx===items.length-1}>Down</Button>
              <Button type="button" variant="outline" size="sm" onClick={()=>remove(idx)}>Remove</Button>
            </div>
            <input type="hidden" name={`${name}[${idx}][url]`} value={it.url} />
            <input type="hidden" name={`${name}[${idx}][alt]`} value={it.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
