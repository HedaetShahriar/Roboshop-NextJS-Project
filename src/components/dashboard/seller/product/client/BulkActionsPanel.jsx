'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatBDT } from '@/lib/currency';
import { Boxes, Tag, Eye, EyeOff, Percent, CircleDollarSign, AlertTriangle, SlidersHorizontal } from 'lucide-react';

export default function BulkActionsPanel({ defaultScope = 'selected', pageCount = 0, total = 0, formId, compact = true }) {
  const [action, setAction] = useState('stockInc');
  const [scope, setScope] = useState(defaultScope);
  const [discountPct, setDiscountPct] = useState('');
  const [stockDelta, setStockDelta] = useState('');
  const [discountVal, setDiscountVal] = useState('');

  // Clear incompatible values when switching actions to avoid stale inputs
  useEffect(() => {
    if (action !== 'discountPercent') setDiscountPct('');
    if (action !== 'stockInc' && action !== 'stockDec') setStockDelta('');
    if (action !== 'setDiscount') setDiscountVal('');
  }, [action]);

  const actionHint = useMemo(() => {
    switch (action) {
      case 'stockInc': return 'Increase stock by Δ for each targeted product.';
      case 'stockDec': return 'Decrease stock by Δ for each targeted product (not below 0).';
      case 'stockSet': return 'Set stock to an exact value for each targeted product.';
      case 'hide': return 'Hide targeted products from customers on the storefront.';
      case 'show': return 'Make targeted products visible to customers.';
      case 'setDiscount': return 'Set an absolute discount price; must be greater than 0 and less than price.';
      case 'discountPercent': return 'Apply a percentage-off discount; discount price will be computed.';
      case 'clearDiscount': return 'Remove discount price from targeted products.';
      case 'priceSet': return 'Set a new price; clears discount when it is not less than the new price.';
      case 'priceRound99': return 'Round price down to end with .99 (e.g., 12 → 11.99).';
      case 'priceRoundWhole': return 'Round price to nearest whole and fix discounts accordingly.';
      case 'deleteProducts': return 'Permanently delete targeted products. This can’t be undone.';
      default: return '';
    }
  }, [action]);

  if (compact) {
    return (
      <div className="rounded-md border bg-white p-2">
        <div className="grid gap-2">
          {/* Action picker */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Boxes size={12} /> Action
            </span>
            <select
              name="bulkAction"
              className="h-8 rounded border px-2 text-[12px]"
              value={action}
              onChange={(e)=>setAction(e.target.value)}
              form={formId}
              aria-label="Bulk action"
            >
              <optgroup label="Stock">
                <option value="stockInc">📈 Increase by…</option>
                <option value="stockDec">📉 Decrease by…</option>
                <option value="stockSet">🎯 Set stock…</option>
              </optgroup>
              <optgroup label="Visibility">
                <option value="hide">🙈 Hide</option>
                <option value="show">👁 Show</option>
              </optgroup>
              <optgroup label="Discount">
                <option value="setDiscount">🏷 Discount $…</option>
                <option value="discountPercent">% Percent off…</option>
                <option value="clearDiscount">✖ Clear discount</option>
              </optgroup>
              <optgroup label="Pricing">
                <option value="priceSet">💲 Set price…</option>
                <option value="priceRound99">🕘 Round to .99</option>
                <option value="priceRoundWhole">🔢 Round to whole</option>
              </optgroup>
              <optgroup label="Danger">
                <option value="deleteProducts">⚠ Delete</option>
              </optgroup>
            </select>
            {/* Contextual hint */}
            <span className="ml-auto hidden sm:inline text-[11px] text-muted-foreground">{actionHint}</span>
          </div>

          {/* Scope segmented control */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <SlidersHorizontal size={12} /> Scope
            </span>
            <div className="flex items-center gap-1">
              <label className="cursor-pointer">
                <input type="radio" name="scope" value="selected" className="sr-only" checked={scope==='selected'} onChange={()=>setScope('selected')} form={formId} />
                <span className={`inline-flex h-8 items-center rounded border px-2 text-[12px] ${scope==='selected' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>Selected</span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="scope" value="page" className="sr-only" checked={scope==='page'} onChange={()=>setScope('page')} form={formId} />
                <span className={`inline-flex h-8 items-center rounded border px-2 text-[12px] ${scope==='page' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>Page ({pageCount})</span>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="scope" value="filtered" className="sr-only" checked={scope==='filtered'} onChange={()=>setScope('filtered')} form={formId} />
                <span className={`inline-flex h-8 items-center rounded border px-2 text-[12px] ${scope==='filtered' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}>Filtered ({total})</span>
              </label>
            </div>
          </div>

          {/* Parameters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
            {(action === 'stockInc' || action === 'stockDec') && (
              <div className="flex items-center gap-2">
                <input
                  name="bulkStockDelta"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Δ qty"
                  className="h-8 px-2 rounded border text-[12px] sm:w-full w-28"
                  form={formId}
                  value={stockDelta}
                  onChange={(e)=>setStockDelta(e.target.value)}
                  required
                />
        <div className="hidden sm:flex items-center gap-1">
                  {[1,5,10,20].map(n => (
                    <button
                      key={n}
                      type="button"
          className="h-8 px-2 rounded border bg-white hover:bg-zinc-50 text-[12px]"
                      onClick={() => { setStockDelta(String(n)); }}
                      aria-label={`Set delta ${n}`}
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {action === 'stockSet' && (
              <input name="bulkStockSet" type="number" step="1" min="0" placeholder="Stock value" className="h-8 px-2 rounded border text-[12px] sm:w-full w-32" form={formId} />
            )}
            {action === 'setDiscount' && (
              <div className="flex items-center gap-2">
                <input
                  name="bulkDiscountPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Discount price"
                  className="h-8 px-2 rounded border text-[12px] sm:w-full w-36"
                  form={formId}
                  value={discountVal}
                  onChange={(e)=>setDiscountVal(e.target.value)}
                  required
                />
        <div className="hidden sm:flex items-center gap-1">
          {[99,199,299,499].map(n => (
                    <button
                      key={n}
                      type="button"
          className="h-8 px-2 rounded border bg-white hover:bg-zinc-50 text-[12px]"
                      onClick={() => { setAction('setDiscount'); setDiscountVal(String(n)); }}
                      aria-label={`Set discount price ${n}`}
                    >
            {formatBDT(n)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {action === 'discountPercent' && (
              <div className="flex items-center gap-2">
                <input
                  name="bulkDiscountPercent"
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  placeholder="Discount %"
                  className="h-8 px-2 rounded border text-[12px] sm:w-full w-32"
                  form={formId}
                  value={discountPct}
                  onChange={(e)=>setDiscountPct(e.target.value)}
                  required
                />
                <div className="hidden sm:flex items-center gap-1">
                  {[5,10,20,30].map(p => (
                    <button
                      key={p}
                      type="button"
                      className="h-8 px-2 rounded border bg-white hover:bg-zinc-50 text-[12px]"
                      onClick={() => { setAction('discountPercent'); setDiscountPct(String(p)); }}
                      aria-label={`Set ${p}% discount`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            )}
            {action === 'priceSet' && (
              <input name="bulkPriceSet" type="number" step="0.01" min="0.01" placeholder="New price" className="h-8 px-2 rounded border text-[12px] sm:w-full w-32" form={formId} required />
            )}
            {action === 'priceRound99' && (
              <span className="text-[10px] text-muted-foreground">e.g., 12 → 11.99</span>
            )}
            {action === 'priceRoundWhole' && (
              <span className="text-[10px] text-muted-foreground">e.g., 12.30 → 12</span>
            )}
            {action === 'deleteProducts' && (
              <input name="confirmDelete" placeholder="Type DELETE" className="h-8 px-2 rounded border text-[12px] sm:w-full w-44" form={formId} required pattern="DELETE" />
            )}
            <div className="sm:col-span-2 flex items-center justify-end">
              <label className="inline-flex items-center gap-1 text-[11px]">
                <input type="checkbox" name="dryRun" value="1" form={formId} /> Dry run
              </label>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {action === 'deleteProducts' ? <AlertTriangle size={12} className="text-rose-600" /> : null}
            <span className="truncate">{actionHint}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: original spacious layout
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-zinc-50 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Bulk action:</span>
        <select name="bulkAction" className="h-9 rounded border px-2 text-xs" value={action} onChange={(e)=>setAction(e.target.value)} form={formId}>
          <optgroup label="Stock">
            <option value="stockInc">Increase stock by…</option>
            <option value="stockDec">Decrease stock by…</option>
            <option value="stockSet">Set stock to…</option>
          </optgroup>
          <optgroup label="Visibility">
            <option value="hide">Hide products</option>
            <option value="show">Show products</option>
          </optgroup>
          <optgroup label="Discount">
            <option value="setDiscount">Set discount price…</option>
            <option value="discountPercent">Set discount by %…</option>
            <option value="clearDiscount">Clear discount</option>
          </optgroup>
          <optgroup label="Pricing">
            <option value="priceSet">Set price to…</option>
            <option value="priceRound99">Round price to .99</option>
            <option value="priceRoundWhole">Round price to whole</option>
          </optgroup>
          <optgroup label="Danger">
            <option value="deleteProducts">Delete products</option>
          </optgroup>
        </select>
        <span className="text-xs text-muted-foreground">Scope:</span>
        <label className="inline-flex items-center gap-1 text-xs"><input type="radio" name="scope" value="selected" defaultChecked={defaultScope === 'selected'} form={formId} /> Selected</label>
        <label className="inline-flex items-center gap-1 text-xs"><input type="radio" name="scope" value="page" defaultChecked={defaultScope === 'page'} form={formId} /> Current page ({pageCount})</label>
        <label className="inline-flex items-center gap-1 text-xs"><input type="radio" name="scope" value="filtered" defaultChecked={defaultScope === 'filtered'} form={formId} /> All filtered ({total})</label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(action === 'stockInc' || action === 'stockDec') && (
          <input name="bulkStockDelta" type="number" step="1" min="0" placeholder="Qty delta" className="h-9 px-3 rounded border text-xs w-24" form={formId} />
        )}
        {action === 'stockSet' && (
          <input name="bulkStockSet" type="number" step="1" min="0" placeholder="Stock value" className="h-9 px-3 rounded border text-xs w-28" form={formId} />
        )}
        {action === 'setDiscount' && (
          <input name="bulkDiscountPrice" type="number" step="0.01" min="0" placeholder="Discount price" className="h-9 px-3 rounded border text-xs w-32" form={formId} />
        )}
        {action === 'discountPercent' && (
          <input name="bulkDiscountPercent" type="number" step="1" min="1" max="99" placeholder="Discount %" className="h-9 px-3 rounded border text-xs w-28" form={formId} />
        )}
        {action === 'priceSet' && (
          <input name="bulkPriceSet" type="number" step="0.01" min="0.01" placeholder="New price" className="h-9 px-3 rounded border text-xs w-28" form={formId} />
        )}
        {action === 'priceRound99' && (
          <span className="text-[11px] text-muted-foreground">Will set prices like 10 → 9.99, 12.30 → 11.99</span>
        )}
        {action === 'priceRoundWhole' && (
          <span className="text-[11px] text-muted-foreground">Will round prices and discounts to nearest whole; clears discount if not less than price</span>
        )}
        {action === 'deleteProducts' && (
          <input name="confirmDelete" placeholder="Type DELETE to confirm" className="h-9 px-3 rounded border text-xs w-44" form={formId} />
        )}
        <label className="inline-flex items-center gap-2 text-xs ml-auto">
          <input type="checkbox" name="dryRun" value="1" form={formId} /> Dry run
        </label>
      </div>
      <div className="text-[11px] text-muted-foreground" role="note">
        Hints: use Qty delta for increase/decrease; Discount % applies across items; Set price will clear discount if ≥ current discount.
      </div>
      <div className="text-[11px] text-muted-foreground">Counts: page {pageCount}, filtered {total}. Selected count is determined by checked rows.</div>
    </div>
  );
}
