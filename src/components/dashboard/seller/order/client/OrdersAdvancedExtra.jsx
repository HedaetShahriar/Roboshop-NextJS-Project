"use client";

import { useMemo } from "react";
import useSearchFilters from "@/hooks/useSearchFilters";

export default function OrdersAdvancedExtra() {
  const { filters, setFilters } = useSearchFilters();
  const paymentStatus = (filters?.paymentStatus || '').toString();
  const paymentMethod = (filters?.paymentMethod || '').toString();
  const codOnly = Boolean(filters?.codOnly);
  const city = (filters?.city || '').toString();

  const statusOptions = useMemo(() => [
    { value: '', label: 'Any' },
    { value: 'authorized', label: 'Authorized' },
    { value: 'captured', label: 'Captured' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'void', label: 'Void' },
  ], []);
  const methodOptions = useMemo(() => [
    { value: '', label: 'Any' },
    { value: 'COD', label: 'Cash on delivery' },
    { value: 'card', label: 'Card' },
    { value: 'bkash', label: 'bKash' },
  ], []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">Payment status</label>
        <select
          className="h-9 w-full rounded-md border px-2 bg-white"
          value={paymentStatus}
          onChange={(e)=>setFilters({ paymentStatus: e.target.value })}
        >
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">Payment method</label>
        <select
          className="h-9 w-full rounded-md border px-2 bg-white"
          value={paymentMethod}
          onChange={(e)=>setFilters({ paymentMethod: e.target.value })}
        >
          {methodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <label className="inline-flex items-center gap-2 text-xs">
        <input type="checkbox" checked={codOnly} onChange={(e)=>setFilters({ codOnly: e.target.checked ? 1 : '' })} /> COD only
      </label>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-medium">City</label>
        <input
          className="h-9 w-full rounded-md border px-2 bg-white"
          value={city}
          placeholder="e.g., Dhaka"
          onChange={(e)=>setFilters({ city: e.target.value })}
        />
      </div>
    </div>
  );
}
