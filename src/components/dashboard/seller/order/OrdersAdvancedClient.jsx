"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddressModalButton from "./AddressModalButton";
import EditAddressModalButton from "./EditAddressModalButton";
import PageSizeSelect from "../../shared/PageSizeSelect";
import useSearchFilters from "@/hooks/useSearchFilters";

const STATUS_CLASS = {
  processing: "bg-amber-100 text-amber-800",
  packed: "bg-sky-100 text-sky-800",
  assigned: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};
const currencyFmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function OrdersAdvancedClient({
  orders = [],
  total = 0,
  page = 1,
  pageSize = 20,
  sortKey = "newest",
  advanceAction,
  updateBillingAddressAction,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const { setFilters } = useSearchFilters();
  const [visible, setVisible] = useState({
    order: true,
    date: true,
    status: true,
    billing: true,
    total: true,
    rider: true,
    actions: true,
  });
  const [selected, setSelected] = useState(() => new Set());
  const [isPending, startTransition] = useTransition();

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(total, (page - 1) * pageSize + orders.length);

  const allSelected = selected.size > 0 && orders.length > 0 && selected.size === orders.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o._id.toString())));
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const headers = [
      visible.order && "Order #",
      visible.status && "Status",
      visible.total && "Total",
      visible.date && "Date",
      visible.rider && "Rider",
    ].filter(Boolean);
    const rows = orders.map((o) => [
      visible.order ? `#${o.orderNumber}` : null,
      visible.status ? (o.status || "") : null,
      visible.total ? (o?.amounts?.total ?? 0) : null,
      visible.date ? (o.createdAt ? new Date(o.createdAt).toLocaleString() : "") : null,
      visible.rider ? (o?.rider?.name || "") : null,
    ].filter((v) => v !== null));
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const bulkAdvance = (action, riderName) => {
    if (!selected.size || !advanceAction) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      for (const id of ids) {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("action", action);
        if (riderName) fd.set("riderName", riderName);
        await advanceAction(fd);
      }
      setSelected(new Set());
    });
  };

  const onSortDate = () => setFilters({ sort: sortKey === "oldest" ? "newest" : "oldest" });
  const onSortStatus = () => setFilters({ sort: sortKey === "status-asc" ? "status-desc" : "status-asc" });
  const onSortAmount = () => setFilters({ sort: sortKey === "amount-high" ? "amount-low" : "amount-high" });

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted-foreground">Columns:</div>
          {Object.entries(visible).map(([k, v]) => (
            <label key={k} className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={v} onChange={() => setVisible((s) => ({ ...s, [k]: !s[k] }))} />
              {k}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}>Export CSV</Button>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Bulk:</span>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => bulkAdvance("pack")}>Pack</Button>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => bulkAdvance("ship")}>Ship</Button>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => bulkAdvance("deliver")}>Deliver</Button>
              <Button size="sm" variant="ghost" disabled={isPending} onClick={() => bulkAdvance("revert")}>Revert</Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile cards view */}
      <div className="sm:hidden space-y-2">
        {orders.map((o) => {
          const id = o._id.toString();
          const billingAddr = o.billingAddress || {
            fullName: o.contact?.fullName,
            email: o.contact?.email,
            phone: o.contact?.phone,
            ...o.shippingAddress,
          };
          return (
            <div key={id} className="rounded-md border bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">#{o.orderNumber}</div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] capitalize shrink-0 ${STATUS_CLASS[o.status] || 'bg-zinc-100 text-zinc-800'}`}>{o.status}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground truncate">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
                <div className="text-sm font-semibold">{currencyFmt.format(Number(o?.amounts?.total || 0))}</div>
              </div>
              {o?.rider?.name && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] text-zinc-700 bg-zinc-50">
                    Rider: <span className="ml-1 font-medium">{o.rider.name}</span>
                  </span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <AddressModalButton address={billingAddr} />
                <EditAddressModalButton orderId={id} initialAddress={billingAddr} action={updateBillingAddressAction} label="Edit" disabled={["delivered","cancelled"].includes(o.status)} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {o.status === 'processing' && (
                  <Button size="sm" variant="outline" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','pack'); advanceAction(fd); }}>Pack</Button>
                )}
                {(['processing','packed'].includes(o.status)) && (
                  <form className="flex items-center gap-2 w-full" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.set('id', id); fd.set('action','assign'); advanceAction(fd); e.currentTarget.reset(); }}>
                    <Input name="riderName" placeholder="Rider name" className="h-9 flex-1" />
                    <Button type="submit" size="sm" className="shrink-0">Assign</Button>
                  </form>
                )}
                {(['assigned','packed'].includes(o.status)) && (
                  <Button size="sm" variant="outline" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','ship'); advanceAction(fd); }}>Ship</Button>
                )}
                {o.status === 'shipped' && (
                  <Button size="sm" variant="outline" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','deliver'); advanceAction(fd); }}>Deliver</Button>
                )}
                {(!['delivered','cancelled'].includes(o.status)) && (
                  <Button size="sm" variant="ghost" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','revert'); advanceAction(fd); }}>Revert</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-auto rounded border bg-white max-h-[65vh]">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
            <tr className="text-left">
              <th className="px-2 py-2"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
              {visible.order && <th className="px-2 sm:px-3 py-2 font-medium">Order #</th>}
              {visible.date && (
                <th className="px-3 py-2 font-medium">
                  <button className="inline-flex items-center gap-1" onClick={onSortDate}>
                    Date <span className="text-xs text-muted-foreground">{sortKey === 'oldest' ? '▲' : sortKey === 'newest' ? '▼' : ''}</span>
                  </button>
                </th>
              )}
              {visible.status && (
                <th className="px-2 sm:px-3 py-2 font-medium">
                  <button className="inline-flex items-center gap-1" onClick={onSortStatus}>
                    Status <span className="text-xs text-muted-foreground">{sortKey?.startsWith('status-') ? (sortKey === 'status-asc' ? '▲' : '▼') : ''}</span>
                  </button>
                </th>
              )}
              {visible.billing && <th className="px-2 sm:px-3 py-2 font-medium">Billing address</th>}
              {visible.total && (
                <th className="px-3 py-2 font-medium">
                  <button className="inline-flex items-center gap-1" onClick={onSortAmount}>
                    Total <span className="text-xs text-muted-foreground">{sortKey?.startsWith('amount-') ? (sortKey === 'amount-high' ? '▼' : '▲') : ''}</span>
                  </button>
                </th>
              )}
              {visible.rider && <th className="px-2 sm:px-3 py-2 font-medium">Rider</th>}
              {visible.actions && <th className="px-2 sm:px-3 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const id = o._id.toString();
              const billingAddr = o.billingAddress || {
                fullName: o.contact?.fullName,
                email: o.contact?.email,
                phone: o.contact?.phone,
                ...o.shippingAddress,
              };
              const checked = selected.has(id);
              return (
                <tr key={id} className="border-t">
                  <td className="px-2 py-2"><input type="checkbox" checked={checked} onChange={() => toggleOne(id)} aria-label={`Select ${o.orderNumber}`} /></td>
                  {visible.order && <td className="px-2 sm:px-3 py-2 font-medium">#{o.orderNumber}</td>}
                  {visible.date && <td className="px-3 py-2 text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</td>}
                  {visible.status && <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs capitalize ${STATUS_CLASS[o.status] || 'bg-zinc-100 text-zinc-800'}`}>{o.status}</span></td>}
                  {visible.billing && (
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <AddressModalButton address={billingAddr} />
                        <EditAddressModalButton orderId={id} initialAddress={billingAddr} action={updateBillingAddressAction} label="Edit" disabled={["delivered","cancelled"].includes(o.status)} />
                      </div>
                    </td>
                  )}
                  {visible.total && <td className="px-2 sm:px-3 py-2">{currencyFmt.format(Number(o?.amounts?.total || 0))}</td>}
                  {visible.rider && <td className="px-2 sm:px-3 py-2">{o?.rider?.name ? (
                    <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs text-zinc-700 bg-zinc-50">Rider: <span className="ml-1 font-medium">{o.rider.name}</span></span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>}
                  {visible.actions && (
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {o.status === 'processing' && (
                          <Button size="sm" variant="outline" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','pack'); advanceAction(fd); }}>Pack</Button>
                        )}
                        {(['processing','packed'].includes(o.status)) && (
                          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.set('id', id); fd.set('action','assign'); advanceAction(fd); e.currentTarget.reset(); }}>
                            <Input name="riderName" placeholder="Rider" className="h-9 w-[120px]" />
                            <Button type="submit" size="sm">Assign</Button>
                          </form>
                        )}
                        {(['assigned','packed'].includes(o.status)) && (
                          <Button size="sm" variant="outline" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','ship'); advanceAction(fd); }}>Ship</Button>
                        )}
                        {o.status === 'shipped' && (
                          <Button size="sm" variant="outline" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','deliver'); advanceAction(fd); }}>Deliver</Button>
                        )}
                        {(!['delivered','cancelled'].includes(o.status)) && (
                          <Button size="sm" variant="ghost" onClick={() => { const fd = new FormData(); fd.set('id', id); fd.set('action','revert'); advanceAction(fd); }}>Revert</Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <div className="text-xs sm:text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm">Rows:</span>
          <PageSizeSelect value={pageSize} />
          <Button size="sm" variant="outline" disabled={page <= 1 || isPending} onClick={() => setFilters({ page: Math.max(1, page - 1) })}>Prev</Button>
          <div className="text-xs sm:text-sm">Page {page} / {totalPages}</div>
          <Button size="sm" variant="outline" disabled={page >= totalPages || isPending} onClick={() => setFilters({ page: Math.min(totalPages, page + 1) })}>Next</Button>
        </div>
      </div>
    </div>
  );
}
