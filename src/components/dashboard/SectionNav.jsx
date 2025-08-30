"use client";

import Link from "next/link";

export default function SectionNav({ sections = [] }) {
  if (!Array.isArray(sections) || sections.length === 0) return null;
  return (
    <nav className="sticky top-4 rounded-md border bg-white p-2 text-sm">
      <div className="px-2 py-1 text-xs text-muted-foreground">Sections</div>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <Link href={`#${s.id}`} className="block rounded px-2 py-1 hover:bg-zinc-50">
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
