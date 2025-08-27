'use client';

import { useState } from 'react';

export default function BulkActionsPanel({ defaultScope = 'selected', pageCount = 0, total = 0 }) {
  const [action, setAction] = useState('stockInc');
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-zinc-50 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Bulk action:</span>
        <select name="bulkAction" className="h-9 rounded border px-2 text-xs" value={action} onChange={(e)=>setAction(e.target.value)}>
          <optgroup label="Stock">
            <option value="stockInc">Increase stock by…</option>
            <option value="stockDec">Decrease stock by…</option>
            <option value="stockSet">Set stock to…</option>
          </optgroup>
          <optgroup label="Discount">
            <option value="setDiscount">Set discount price…</option>
            <option value="discountPercent">Set discount by %…</option>
            <option value="clearDiscount">Clear discount</option>
          </optgroup>
          <optgroup label="Pricing">
            <option value="priceSet">Set price to…</option>
            <option value="priceRound99">Round price to .99</option>
          </optgroup>
          <optgroup label="Danger">
            <option value="deleteProducts">Delete products</option>
          </optgroup>
        </select>
        <span className="text-xs text-muted-foreground">Scope:</span>
        <label className="inline-flex items-center gap-1 text-xs"><input type="radio" name="scope" value="selected" defaultChecked={defaultScope === 'selected'} /> Selected</label>
        <label className="inline-flex items-center gap-1 text-xs"><input type="radio" name="scope" value="page" defaultChecked={defaultScope === 'page'} /> Current page ({pageCount})</label>
        <label className="inline-flex items-center gap-1 text-xs"><input type="radio" name="scope" value="filtered" defaultChecked={defaultScope === 'filtered'} /> All filtered ({total})</label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(action === 'stockInc' || action === 'stockDec') && (
          <input name="bulkStockDelta" type="number" step="1" min="0" placeholder="Qty delta" className="h-9 px-3 rounded border text-xs w-24" />
        )}
        {action === 'stockSet' && (
          <input name="bulkStockSet" type="number" step="1" min="0" placeholder="Stock value" className="h-9 px-3 rounded border text-xs w-28" />
        )}
        {action === 'setDiscount' && (
          <input name="bulkDiscountPrice" type="number" step="0.01" min="0" placeholder="Discount price" className="h-9 px-3 rounded border text-xs w-32" />
        )}
        {action === 'discountPercent' && (
          <input name="bulkDiscountPercent" type="number" step="1" min="1" max="99" placeholder="Discount %" className="h-9 px-3 rounded border text-xs w-28" />
        )}
        {action === 'priceSet' && (
          <input name="bulkPriceSet" type="number" step="0.01" min="0.01" placeholder="New price" className="h-9 px-3 rounded border text-xs w-28" />
        )}
        {action === 'priceRound99' && (
          <span className="text-[11px] text-muted-foreground">Will set prices like 10 → 9.99, 12.30 → 11.99</span>
        )}
        {action === 'deleteProducts' && (
          <input name="confirmDelete" placeholder="Type DELETE to confirm" className="h-9 px-3 rounded border text-xs w-44" />
        )}
        <label className="inline-flex items-center gap-2 text-xs ml-auto">
          <input type="checkbox" name="dryRun" value="1" /> Dry run
        </label>
        <button type="submit" className="h-9 px-3 rounded border text-xs bg-white hover:bg-zinc-50">Apply</button>
      </div>
      <div className="text-[11px] text-muted-foreground" role="note">
        Hints: use Qty delta for increase/decrease; Discount % applies across items; Set price will clear discount if ≥ current discount.
      </div>
      <div className="text-[11px] text-muted-foreground">Counts: page {pageCount}, filtered {total}. Selected count is determined by checked rows.</div>
    </div>
  );
}
