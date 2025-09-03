"use client";

import { useId, useState, useTransition } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, Mail, Phone } from "lucide-react";
import { editBillingAddress } from "../server/actions";

export default function BillingDropdown({ order }) {
  const id = order?._id;
  const billing = order?.billingAddress || {};
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const formId = useId();

  const submit = (e) => {
    e.preventDefault();
    const form = e.currentTarget.form || document.getElementById(formId);
    if (!form) return;
    start(async () => {
      try { await editBillingAddress(new FormData(form)); setOpen(false); } catch {}
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="inline-flex items-center gap-1">Billing</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(92vw,380px)] p-3 rounded-xl shadow-lg border bg-white">
        <div className="space-y-3">
          {/* View */}
          <div className="text-[11px] font-medium text-muted-foreground px-1">Current billing</div>
          <div className="rounded border p-2 bg-zinc-50">
            <div className="text-sm font-medium">{billing.fullName || '—'}</div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Mail size={12} /> {billing.email || '—'}</div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Phone size={12} /> {billing.phone || '—'}</div>
            <div className="mt-1 text-xs inline-flex items-start gap-1"><MapPin size={12} className="mt-0.5" /> <span>{[billing.address1, billing.city, billing.state, billing.postalCode, billing.country].filter(Boolean).join(', ') || '—'}</span></div>
          </div>

          {/* Edit */}
          <div className="text-[11px] font-medium text-muted-foreground px-1 inline-flex items-center gap-1"><Pencil size={12} /> Edit billing</div>
          <form id={formId} action={editBillingAddress} className="grid grid-cols-1 gap-2">
            <input type="hidden" name="id" value={id} />
            <div className="grid grid-cols-2 gap-2">
              <input name="fullName" defaultValue={billing.fullName || ''} placeholder="Full name" className="h-8 rounded border px-2" />
              <input name="phone" defaultValue={billing.phone || ''} placeholder="Phone" className="h-8 rounded border px-2" />
            </div>
            <input name="email" defaultValue={billing.email || ''} placeholder="Email" className="h-8 rounded border px-2" />
            <input name="address1" defaultValue={billing.address1 || ''} placeholder="Address line 1" className="h-8 rounded border px-2" />
            <div className="grid grid-cols-2 gap-2">
              <input name="city" defaultValue={billing.city || ''} placeholder="City" className="h-8 rounded border px-2" />
              <input name="state" defaultValue={billing.state || ''} placeholder="State" className="h-8 rounded border px-2" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="postalCode" defaultValue={billing.postalCode || ''} placeholder="Postal code" className="h-8 rounded border px-2" />
              <input name="country" defaultValue={billing.country || ''} placeholder="Country" className="h-8 rounded border px-2" />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" className="h-8 px-2 rounded border bg-white hover:bg-zinc-50 text-xs" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="h-8 px-2 rounded border bg-zinc-900 text-white hover:bg-zinc-800 text-xs disabled:opacity-60" disabled={pending} onClick={submit}>{pending ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
