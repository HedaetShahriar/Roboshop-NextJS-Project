'use client';

import { useState } from 'react';

export default function BulkActionsPanel({ defaultScope = 'selected', pageCount = 0, total = 0, formId, compact = true }) {
  const [action, setAction] = useState('stockInc');

  if (compact) {
    return (
      <div className="rounded-md border bg-white p-2">
        <div className="flex flex-wrap items-center gap-2">
          <select name="bulkAction" className="h-8 rounded border px-2 text-[12px]" value={action} onChange={(e)=>setAction(e.target.value)} form={formId}>
            <optgroup label="Stock">
              <option value="stockInc">Increase by…</option>
              <option value="stockDec">Decrease by…</option>
              <option value="stockSet">Set stock…</option>
            </optgroup>
            <optgroup label="Discount">
              <option value="setDiscount">Discount $…</option>
              <option value="discountPercent">% off…</option>
              <option value="clearDiscount">Clear discount</option>
            </optgroup>
            <optgroup label="Pricing">
              <option value="priceSet">Set price…</option>
              <option value="priceRound99">Round to .99</option>
              <option value="priceRoundWhole">Round to whole</option>
            </optgroup>
            <optgroup label="Danger">
              <option value="deleteProducts">Delete</option>
            </optgroup>
          </select>
          <select name="scope" defaultValue={defaultScope} className="h-8 rounded border px-2 text-[12px]" form={formId}>
            <option value="selected">Selected</option>
            <option value="page">Page ({pageCount})</option>
            <option value="filtered">Filtered ({total})</option>
          </select>
          {(action === 'stockInc' || action === 'stockDec') && (
            <input name="bulkStockDelta" type="number" step="1" min="0" placeholder="Δ qty" className="h-8 px-2 rounded border text-[12px] w-20" form={formId} />
          )}
          {action === 'stockSet' && (
            <input name="bulkStockSet" type="number" step="1" min="0" placeholder="Set" className="h-8 px-2 rounded border text-[12px] w-20" form={formId} />
          )}
          {action === 'setDiscount' && (
            <input name="bulkDiscountPrice" type="number" step="0.01" min="0" placeholder="$ off" className="h-8 px-2 rounded border text-[12px] w-24" form={formId} />
          )}
          {action === 'discountPercent' && (
            <input name="bulkDiscountPercent" type="number" step="1" min="1" max="99" placeholder="% off" className="h-8 px-2 rounded border text-[12px] w-20" form={formId} />
          )}
          {action === 'priceSet' && (
            <input name="bulkPriceSet" type="number" step="0.01" min="0.01" placeholder="New $" className="h-8 px-2 rounded border text-[12px] w-24" form={formId} />
          )}
          {action === 'priceRound99' && (
            <span className="text-[10px] text-muted-foreground">e.g., 12 → 11.99</span>
          )}
          {action === 'priceRoundWhole' && (
            <span className="text-[10px] text-muted-foreground">e.g., 12.30 → 12</span>
          )}
          {action === 'deleteProducts' && (
            <input name="confirmDelete" placeholder="Type DELETE" className="h-8 px-2 rounded border text-[12px] w-36" form={formId} />
          )}
          <label className="inline-flex items-center gap-1 text-[11px] ml-auto">
            <input type="checkbox" name="dryRun" value="1" form={formId} /> Dry run
          </label>
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
