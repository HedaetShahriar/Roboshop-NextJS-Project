"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AddressModalButton({ address, label = 'View' }) {
  const [open, setOpen] = useState(false);
  if (!address) {
    return <span className="text-xs text-muted-foreground">N/A</span>;
  }

  const {
    fullName,
    address1,
    address2,
    city,
    state,
    postalCode,
    country,
    phone,
    email,
  } = address || {};

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>{label}</Button>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white shadow-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium">Billing address</div>
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="px-4 py-3 text-sm">
              <div className="grid gap-1">
                {fullName && <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{fullName}</span></div>}
                {email && <div><span className="text-muted-foreground">Email: </span>{email}</div>}
                {phone && <div><span className="text-muted-foreground">Phone: </span>{phone}</div>}
                {address1 && <div className="pt-1"><span className="text-muted-foreground">Address: </span>{address1}</div>}
                {address2 && <div>{address2}</div>}
                {(city || state || postalCode) && (
                  <div>{[city, state, postalCode].filter(Boolean).join(', ')}</div>
                )}
                {country && <div>{country}</div>}
              </div>
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
