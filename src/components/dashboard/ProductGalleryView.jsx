"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Lightbox from "@/components/ui/Lightbox";
import { ExternalLink } from "lucide-react";

export default function ProductGalleryView({ images = [], name = "", slug = "" }) {
  const BLUR = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  const list = useMemo(() => {
    const uniq = Array.from(new Set(images.filter(Boolean)));
    const score = (u) => {
      if (!u) return -1;
      if (u.startsWith('https://') || u.startsWith('/')) return 2;
      if (u.startsWith('http://')) return 1;
      return 0;
    };
    return uniq.sort((a,b)=> score(b)-score(a));
  }, [images]);
  const hero = list[0];
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(0);
  const needsUnoptimized = (url) => !!url && url.startsWith('http://');
  const [heroNoOpt, setHeroNoOpt] = useState(needsUnoptimized(hero));
  const [thumbNoOpt, setThumbNoOpt] = useState(() => new Set());
  const markThumbNoOpt = (i) => setThumbNoOpt((s)=>{ const n=new Set(s); n.add(i); return n; });

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-white p-2">
        {hero ? (
          <button
            type="button"
            className="relative h-64 w-full group"
            onClick={()=>{ setStart(0); setOpen(true); }}
            aria-label="Open image"
          >
            <Image
              src={hero}
              alt={name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover rounded"
              placeholder="blur"
              blurDataURL={BLUR}
              priority
              unoptimized={heroNoOpt}
              onError={() => setHeroNoOpt(true)}
            />
            <span className="pointer-events-none absolute inset-0 rounded border-2 border-transparent group-hover:border-white/70 transition-colors" aria-hidden="true" />
          </button>
        ) : (
          <div className="h-64 grid place-items-center text-muted-foreground text-sm">No image</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {list.slice(0,5).map((url, i) => (
          <button key={url} type="button" className="w-16 h-16 rounded-md border overflow-hidden" onClick={()=>{ setStart(i); setOpen(true); }} aria-label={`Open image ${i+1}`}>
            <Image src={url} alt="thumb" width={64} height={64} className="w-full h-full object-cover" placeholder="blur" blurDataURL={BLUR} unoptimized={thumbNoOpt.has(i) || needsUnoptimized(url)} onError={()=>markThumbNoOpt(i)} />
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        <Link href={slug ? `/products/${slug}` : '#'} className="inline-flex items-center gap-1 underline aria-disabled:opacity-50" aria-disabled={!slug}>
          View public page <ExternalLink size={12} />
        </Link>
      </div>
      {open && (
        <Lightbox images={list} startIndex={start} onClose={()=>setOpen(false)} />
      )}
    </div>
  );
}
