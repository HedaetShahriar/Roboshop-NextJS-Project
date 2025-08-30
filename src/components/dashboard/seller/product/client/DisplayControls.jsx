import Link from "next/link";
import SavedViews from "./SavedViews";

export default function DisplayControls({ basePath, allCols, visibleCols, query }) {
  // Recreate Set on the client from a serializable array
  const visibleSet = new Set(visibleCols || []);

  const mkQS = (overrides = {}) => {
    const params = new URLSearchParams();
    // seed with base query
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    // apply overrides
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <div>
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="text-[11px] font-medium text-muted-foreground">Columns</div>
          <div className="text-[11px] text-muted-foreground">Visible {visibleSet.size}/{allCols.length}</div>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-auto px-1">
          {allCols.map((c) => {
            const nextCols = (() => { const set = new Set(visibleSet); if (set.has(c)) set.delete(c); else set.add(c); return Array.from(set).join(','); })();
            return (
              <li key={c}>
                <Link href={`${basePath}${mkQS({ cols: nextCols, page: 1 })}`} replace scroll={false} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50">
                  <input type="checkbox" readOnly checked={visibleSet.has(c)} className="h-4 w-4" />
                  <span className="capitalize text-sm">{c}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
          {(() => {
            const preset = (colsArr) => `${basePath}${mkQS({ cols: colsArr.join(','), page: 1 })}`;
            const compactCols = ['no','info','price','stock','actions'];
            const pricingCols = ['no','info','price','rating','actions'];
            const inventoryCols = ['no','info','category','stock','actions'];
            return (
              <>
                <Link href={preset(compactCols)} replace scroll={false} className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50">Compact</Link>
                <Link href={preset(pricingCols)} replace scroll={false} className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50">Pricing</Link>
                <Link href={preset(inventoryCols)} replace scroll={false} className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50">Inventory</Link>
                <span className="mx-1 text-zinc-200">|</span>
                <Link href={`${basePath}${mkQS({ cols: allCols.join(','), page: 1 })}`} replace scroll={false} className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50">Full</Link>
                <Link href={`${basePath}${mkQS({ cols: '', page: 1 })}`} replace scroll={false} className="h-7 px-2 rounded border text-[11px] bg-white hover:bg-zinc-50">None</Link>
              </>
            );
          })()}
        </div>
      </div>
      <div className="my-2 h-px bg-zinc-100" />
      <div className="space-y-2">
        <div className="text-[11px] font-medium text-muted-foreground px-1">Saved views</div>
        <div className="flex flex-col gap-2">
          <SavedViews />
        </div>
      </div>
    </div>
  );
}
