"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export default function EditAddressModalButton({ orderId, initialAddress = {}, action, label = "Edit", disabled = false }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    fullName = "",
    address1 = "",
    address2 = "",
    city = "",
    state = "",
    postalCode = "",
    country = "",
    phone = "",
    email = "",
  } = initialAddress || {};

  return (
    <>
  <Button type="button" size="sm" variant="secondary" onClick={() => { if (!disabled) setOpen(true); }} disabled={disabled}>{label}</Button>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium">Edit billing address</div>
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <form
              action={(fd) => {
                // add id so server action can identify order
                fd.set("id", orderId);
                startTransition(async () => {
                  await action(fd);
                  // After server action triggers a revalidate, the page will refresh and this modal will reset
                  setOpen(false);
                });
              }}
            >
              <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Full name</label>
                  <input name="fullName" defaultValue={fullName} className="w-full h-9 px-3 rounded border" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Email</label>
                  <input type="email" name="email" defaultValue={email} className="w-full h-9 px-3 rounded border" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Phone</label>
                  <input name="phone" defaultValue={phone} className="w-full h-9 px-3 rounded border" placeholder="+1 555-1234" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Address line 1</label>
                  <input name="address1" defaultValue={address1} className="w-full h-9 px-3 rounded border" placeholder="123 Main St" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Address line 2</label>
                  <input name="address2" defaultValue={address2} className="w-full h-9 px-3 rounded border" placeholder="Apt, suite, etc." />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">City</label>
                  <input name="city" defaultValue={city} className="w-full h-9 px-3 rounded border" placeholder="City" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">State</label>
                  <input name="state" defaultValue={state} className="w-full h-9 px-3 rounded border" placeholder="State" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Postal code</label>
                  <input name="postalCode" defaultValue={postalCode} className="w-full h-9 px-3 rounded border" placeholder="ZIP / Postal code" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Country</label>
                  <input name="country" defaultValue={country} className="w-full h-9 px-3 rounded border" placeholder="Country" />
                </div>
              </div>
              <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}