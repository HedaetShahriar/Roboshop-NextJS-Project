"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Lightbox({ images = [], startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const count = images.length;
  const img = images[idx] || {};

  const close = useCallback(() => onClose?.(), [onClose]);
  const prev = useCallback(() => setIdx((i)=> (i-1+count)%count), [count]);
  const next = useCallback(() => setIdx((i)=> (i+1)%count), [count]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, prev, next]);

  if (!count) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] bg-black/80">
      <button aria-label="Close" className="absolute top-3 right-3 p-2 rounded bg-black/60 text-white hover:bg-black/80" onClick={close}>
        <X className="size-5" />
      </button>
      <div className="absolute inset-0 grid place-items-center" onClick={close}>
        <div className="relative w-[90vw] h-[70vh] max-w-5xl" onClick={(e)=>e.stopPropagation()}>
          <Image src={img.url || img} alt={img.alt || ''} fill className="object-contain" sizes="90vw" />
        </div>
      </div>
      {count > 1 && (
        <>
          <button aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded bg-black/60 text-white hover:bg-black/80" onClick={prev}>
            <ChevronLeft className="size-6" />
          </button>
          <button aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded bg-black/60 text-white hover:bg-black/80" onClick={next}>
            <ChevronRight className="size-6" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/80">{idx+1}/{count}</div>
        </>
      )}
    </div>
  );
}
