"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

export default function MarkdownEditor({ name = "description", initial = "", label = "Description", onChange }) {
  const [value, setValue] = useState(initial || "");
  const [preview, setPreview] = useState(false);
  const md = useMemo(() => new MarkdownIt({ breaks: true, linkify: true }), []);
  const html = useMemo(() => DOMPurify.sanitize(md.render(value || "")), [md, value]);
  const ref = useRef(null);

  const insert = (before, after = "") => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    setValue(next);
    if (onChange) onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => insert("**", "**")} aria-label="Bold">B</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => insert("_", "_")} aria-label="Italic">I</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => insert("## ")} aria-label="Heading">H2</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => insert("- ")} aria-label="List">•</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreview(p => !p)} aria-pressed={preview}>{preview ? 'Edit' : 'Preview'}</Button>
        </div>
      </div>
      {!preview ? (
        <Textarea ref={ref} name={name} value={value} onChange={(e)=>{ setValue(e.target.value); onChange && onChange(e.target.value); }} placeholder="Write in Markdown…" />
      ) : (
        <div className="prose prose-sm max-w-none border rounded-md p-3 bg-zinc-50" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
