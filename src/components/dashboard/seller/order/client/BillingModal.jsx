"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Pencil } from "lucide-react";
import { editBillingAddress } from "../server/actions";

export default function BillingModal({ order, label = "Billing" }) {
  const id = order?._id;
  const billing = order?.billingAddress || {};
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const formId = useId();

  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    start(async () => {
      try {
        await editBillingAddress(new FormData(form));
        toast.success('Billing updated');
        setOpen(false);
      } catch {
        toast.error('Failed to update billing');
      }
    });
  };

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="inline-flex items-center gap-1" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Billing address</DialogTitle>
            <DialogDescription>View and edit the customer billing details.</DialogDescription>
          </DialogHeader>

          {/* Current snapshot */}
          <div className="rounded border p-3 bg-zinc-50 text-sm">
            <div className="font-medium">{billing.fullName || '—'}</div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Mail size={12} /> {billing.email || '—'}</div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Phone size={12} /> {billing.phone || '—'}</div>
            <div className="mt-1 text-xs inline-flex items-start gap-1"><MapPin size={12} className="mt-0.5" /> <span>{[billing.address1, billing.city, billing.state, billing.postalCode, billing.country].filter(Boolean).join(', ') || '—'}</span></div>
          </div>

          {/* Edit form */}
          <form id={formId} onSubmit={onSubmit} className="grid grid-cols-1 gap-2 mt-3" data-form="billing">
            <input type="hidden" name="id" value={id} />
            <div className="grid grid-cols-2 gap-2">
              <input name="fullName" defaultValue={billing.fullName || ''} placeholder="Full name" className="h-9 rounded border px-3 text-sm" />
              <input name="phone" defaultValue={billing.phone || ''} placeholder="Phone" className="h-9 rounded border px-3 text-sm" />
            </div>
            <input type="email" name="email" defaultValue={billing.email || ''} placeholder="Email" className="h-9 rounded border px-3 text-sm" />
            <input name="address1" defaultValue={billing.address1 || ''} placeholder="Address line 1" className="h-9 rounded border px-3 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="city" defaultValue={billing.city || ''} placeholder="City" className="h-9 rounded border px-3 text-sm" />
              <input name="state" defaultValue={billing.state || ''} placeholder="State" className="h-9 rounded border px-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="postalCode" defaultValue={billing.postalCode || ''} placeholder="Postal code" className="h-9 rounded border px-3 text-sm" />
              <input name="country" defaultValue={billing.country || ''} placeholder="Country" className="h-9 rounded border px-3 text-sm" />
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
              <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
