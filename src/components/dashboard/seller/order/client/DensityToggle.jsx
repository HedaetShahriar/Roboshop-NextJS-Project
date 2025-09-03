"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Rows3, Rows } from "lucide-react";

export default function DensityToggle({ className = "" }) {
  const router = useRouter();
  const sp = useSearchParams();
  const density = (sp?.get('density') === 'compact') ? 'compact' : 'cozy';

  const toggle = () => {
    const p = new URLSearchParams(sp?.toString() || '');
    if (density === 'cozy') p.set('density', 'compact'); else p.delete('density');
    p.delete('page');
    router.push(`/dashboard/seller/orders?${p.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={"h-8 w-8 rounded border bg-white hover:bg-zinc-50 inline-flex items-center justify-center " + className}
      title={density === 'compact' ? 'Cozy rows' : 'Compact rows'}
      aria-label={density === 'compact' ? 'Cozy rows' : 'Compact rows'}
    >
      {density === 'compact' ? <Rows3 size={14} /> : <Rows size={14} />}
      <span className="sr-only">{density === 'compact' ? 'Cozy rows' : 'Compact rows'}</span>
    </button>
  );
}
