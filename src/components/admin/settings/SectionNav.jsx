'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function SectionNav({ sections = [] }) {
  const [active, setActive] = useState(sections?.[0]?.id || 'platform');
  const scrollerRef = useRef(null);

  // Observe sections to update the active pill while scrolling
  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        // account for sticky headers; tweak as needed
        rootMargin: '-96px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 1],
      }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Ensure the active pill is visible in the horizontal scroller
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const el = scroller.querySelector(`[data-id="${CSS.escape(active)}"]`);
    if (el) {
      const elLeft = el.offsetLeft;
      const elRight = elLeft + el.offsetWidth;
      const viewLeft = scroller.scrollLeft;
      const viewRight = viewLeft + scroller.clientWidth;
      if (elLeft < viewLeft) scroller.scrollTo({ left: elLeft - 16, behavior: 'smooth' });
      else if (elRight > viewRight) scroller.scrollTo({ left: elRight - scroller.clientWidth + 16, behavior: 'smooth' });
    }
  }, [active]);

  const onPillClick = useCallback((e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    // Prefer scrollIntoView with a temporary scroll-margin-top for reliable offset
    const prevMargin = el.style.scrollMarginTop;
    el.style.scrollMarginTop = '96px';
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // Fallback to manual calculation
      const offset = 96;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
    // restore after the scroll starts
    setTimeout(() => { el.style.scrollMarginTop = prevMargin; }, 400);
    // Reflect hash without causing default jump
    try { window.history.replaceState(null, '', `#${id}`); } catch {}
    setActive(id);
  }, []);

  return (
  <nav aria-label="Settings sections" className="relative bg-white">
      {/* Gradient edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />

      {/* Horizontal pill nav */}
      <div
        ref={scrollerRef}
  className="no-scrollbar overflow-x-auto scroll-smooth"
        role="tablist"
      >
  <ul className="flex gap-2 py-2 pr-8 text-sm">
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => onPillClick(e, s.id)}
                  data-id={s.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')}
                >
                  {s.icon ? <s.icon className="size-4" /> : null}
                  <span>{s.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
