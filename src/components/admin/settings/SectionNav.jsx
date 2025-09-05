'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SectionNav({ sections }) {
  const [active, setActive] = useState(sections?.[0]?.id || 'platform');

  useEffect(() => {
    const ids = sections.map(s => s.id);
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      // Pick the top-most visible section
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-64px 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-20 rounded-xl border bg-white p-3 shadow-sm">
      <ul className="space-y-1 text-sm">
        {sections.map(s => (
          <li key={s.id}>
            <Link
              href={`#${s.id}`}
              className={`flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-50 ${active === s.id ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-700'}`}
            >
              {s.icon ? <s.icon className="size-4" /> : null}
              <span>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
