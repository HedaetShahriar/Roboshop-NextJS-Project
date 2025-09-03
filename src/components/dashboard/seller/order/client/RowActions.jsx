"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Eye, PenLine, PackageCheck, Truck, CheckCircle2, Undo2, XCircle, Copy, Percent, CircleDollarSign, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateOrderDiscount, clearOrderDiscount, updateOrderShipping, clearOrderShipping } from "../server/actions";

export default function RowActions({ id, currentStatus, contact, shipping, tracking, shippingFee: initialShippingFee }) {
  const formId = `orderStatus-${id}`;
  const [actionsOpen, setActionsOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [mode, setMode] = useState('amount');
  const [value, setValue] = useState('');
  const [pending, start] = useTransition();
  const [shippingOpen, setShippingOpen] = useState(false);
  const [shippingFee, setShippingFee] = useState(initialShippingFee != null ? String(initialShippingFee) : '');

  const submitStatus = useCallback((next) => {
    const form = document.getElementById(formId);
    if (!form) return;
    const input = form.querySelector('input[name="status"]');
    if (!input) return;
    if (next === 'cancelled') {
      if (!window.confirm('Cancel this order?')) return;
    }
    input.value = next;
    form.requestSubmit();
  }, [formId]);

  const openBulkWith = useCallback((nextAction, nextScope = 'selected') => {
    // Ensure the current row is selected if scope is selected
    if (nextScope === 'selected') {
      const checkbox = document.querySelector(`input[type="checkbox"][name="ids"][value="${id}"]`);
      if (checkbox && !checkbox.checked) checkbox.click();
    }
    // Set hidden inputs pre-emptively so the bulk panel can read initial state
    const form = document.getElementById('bulkOrdersForm');
    if (form) {
      const setHidden = (name, val) => {
        let el = form.querySelector(`input[type="hidden"][name="${name}"]`);
        if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
        el.value = val;
      };
      if (nextAction) setHidden('bulkAction', nextAction);
      if (nextScope) setHidden('scope', nextScope);
    }
    // Notify listeners to update their local state
    window.dispatchEvent(new CustomEvent('orders:setBulkAction', { detail: { action: nextAction, scope: nextScope } }));
    // Open the bulk UI (dropdown or dialog) via trigger if present
    const trigger = document.getElementById('orders-bulk-trigger');
    if (trigger) trigger.click();
  }, [id]);

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-[12px] inline-flex items-center gap-1" onClick={() => setActionsOpen(true)}>
        <MoreHorizontal size={14} />
        Actions
      </Button>

      {/* Actions modal */}
      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent className="w-[min(92vw,460px)]">
          <DialogHeader>
            <DialogTitle className="text-sm">Order actions</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5 text-[13px]">
            <div className="text-[11px] text-muted-foreground px-1">Navigate</div>
            <div className="grid">
              <Link href={`/dashboard/seller/orders/${id}`} className="rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2"><Eye size={14} /> View</Link>
              <Link href={`/dashboard/seller/orders/${id}/edit`} className="rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2"><PenLine size={14} /> Edit</Link>
            </div>
            <div className="h-px bg-zinc-200 my-1" />

            <div className="text-[11px] text-muted-foreground px-1">Copy</div>
            <div className="grid">
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={async () => { try { await navigator.clipboard?.writeText(contact?.phone || ''); toast.success('Phone copied'); } catch { toast.error('Failed to copy'); } }}><Copy size={14} /> Copy phone</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={async () => { try { await navigator.clipboard?.writeText([shipping?.address1, shipping?.city, shipping?.postalCode].filter(Boolean).join(', ')); toast.success('Address copied'); } catch { toast.error('Failed to copy'); } }}><Copy size={14} /> Copy address</button>
              {tracking?.awb ? (
                <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={async () => { try { await navigator.clipboard?.writeText(tracking.awb); toast.success('AWB copied'); } catch { toast.error('Failed to copy'); } }}><Copy size={14} /> Copy AWB</button>
              ) : null}
            </div>
            <div className="h-px bg-zinc-200 my-1" />

            <div className="text-[11px] text-muted-foreground px-1">Amounts</div>
            <div className="grid">
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); setTimeout(() => setDiscountOpen(true), 0); }}><CircleDollarSign size={14} /> Add discount</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); setTimeout(() => setShippingOpen(true), 0); }}><Ship size={14} /> Set shipping fee</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { if (!window.confirm('Clear discount for this order?')) return; start(async () => { const fd = new FormData(); fd.set('id', id); const res = await clearOrderDiscount(fd); res?.ok ? toast.success(res.message) : toast.error(res.message || 'Failed to clear'); }); }}><XCircle size={14} /> Clear discount</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { if (!window.confirm('Clear shipping fee for this order?')) return; start(async () => { const fd = new FormData(); fd.set('id', id); const res = await clearOrderShipping(fd); res?.ok ? toast.success(res.message) : toast.error(res.message || 'Failed to clear'); }); }}><XCircle size={14} /> Clear shipping</button>
            </div>
            <div className="h-px bg-zinc-200 my-1" />

            <div className="text-[11px] text-muted-foreground px-1">Status</div>
            <div className="grid">
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); submitStatus('packed'); }}><PackageCheck size={14} /> Mark packed</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); submitStatus('shipped'); }}><Truck size={14} /> Mark shipped</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); submitStatus('delivered'); }}><CheckCircle2 size={14} /> Mark delivered</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); submitStatus('processing'); }}><Undo2 size={14} /> Revert to processing</button>
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-rose-50 inline-flex items-center gap-2 text-rose-700" onClick={() => { setActionsOpen(false); submitStatus('cancelled'); }}><XCircle size={14} /> Cancel</button>
            </div>

            <div className="h-px bg-zinc-200 my-1" />
            <div className="text-[11px] text-muted-foreground px-1">Bulk</div>
            <div className="grid">
              <button type="button" className="text-left rounded px-2 py-2 hover:bg-zinc-50 inline-flex items-center gap-2" onClick={() => { setActionsOpen(false); openBulkWith('assign'); }}><PenLine size={14} /> Assign rider (bulk)</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount modal */}
      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add discount</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <div className="inline-flex rounded border p-1 text-xs">
              <button type="button" onClick={() => setMode('amount')} className={`h-8 px-3 rounded ${mode==='amount' ? 'bg-zinc-900 text-white' : ''}`}>Amount</button>
              <button type="button" onClick={() => setMode('percent')} className={`h-8 px-3 rounded ${mode==='percent' ? 'bg-zinc-900 text-white' : ''}`}>Percent</button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input value={value} onChange={(e)=>setValue(e.target.value)} placeholder={mode==='percent'? 'e.g. 10 for 10%' : 'e.g. 100.00'} className="h-9 rounded border px-3" inputMode="decimal" />
              {mode==='percent' ? <Percent size={16} className="text-muted-foreground" /> : <CircleDollarSign size={16} className="text-muted-foreground" />}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={()=>setDiscountOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" disabled={pending || !value} onClick={() => {
              const num = Number(value);
              if (!isFinite(num) || num < 0) { toast.error('Enter a valid number'); return; }
              start(async () => {
                const fd = new FormData();
                fd.set('id', id);
                fd.set('mode', mode);
                fd.set('value', String(num));
                const res = await updateOrderDiscount(fd);
                if (res?.ok) {
                  toast.success(res.message);
                  setDiscountOpen(false);
                  setValue('');
                } else {
                  toast.error(res?.message || 'Failed to apply discount');
                }
              });
            }}>{pending ? 'Applying…' : 'Apply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Shipping modal */}
      <Dialog open={shippingOpen} onOpenChange={setShippingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set shipping fee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <input value={shippingFee} onChange={(e)=>setShippingFee(e.target.value)} placeholder="e.g. 80.00" className="h-9 rounded border px-3" inputMode="decimal" />
            <div className="flex gap-2">
              {[60,80,120].map(v => (
                <button key={v} type="button" className="h-8 px-2 rounded border text-xs" onClick={()=>setShippingFee(String(v))}>{v}</button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={()=>setShippingOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" disabled={pending || !shippingFee} onClick={() => {
              const num = Number(shippingFee);
              if (!isFinite(num) || num < 0) { toast.error('Enter a valid fee'); return; }
              start(async () => {
                const fd = new FormData();
                fd.set('id', id);
                fd.set('fee', String(num));
                const res = await updateOrderShipping(fd);
                if (res?.ok) {
                  toast.success(res.message);
                  setShippingOpen(false);
                  setShippingFee('');
                } else {
                  toast.error(res?.message || 'Failed to update fee');
                }
              });
            }}>{pending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
