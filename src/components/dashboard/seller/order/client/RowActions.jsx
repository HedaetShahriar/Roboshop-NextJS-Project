"use client";

import Link from "next/link";
import { useCallback } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Eye, PenLine, PackageCheck, Truck, CheckCircle2, Undo2, XCircle, Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function RowActions({ id, currentStatus, contact, shipping, tracking }) {
  const formId = `orderStatus-${id}`;

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-[12px] inline-flex items-center gap-1">
          <MoreHorizontal size={14} />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl shadow-lg border bg-white text-[13px]">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/seller/orders/${id}`} className="inline-flex items-center gap-2">
            <Eye size={14} /> View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/seller/orders/${id}/edit`} className="inline-flex items-center gap-2">
            <PenLine size={14} /> Edit
          </Link>
        </DropdownMenuItem>
    <DropdownMenuItem onClick={async () => { try { await navigator.clipboard?.writeText(contact?.phone || ''); toast.success('Phone copied'); } catch { toast.error('Failed to copy'); } }} className="inline-flex items-center gap-2">
          <Copy size={14} /> Copy phone
        </DropdownMenuItem>
  <DropdownMenuItem onClick={async () => { try { await navigator.clipboard?.writeText([shipping?.address1, shipping?.city, shipping?.postalCode].filter(Boolean).join(', ')); toast.success('Address copied'); } catch { toast.error('Failed to copy'); } }} className="inline-flex items-center gap-2">
          <Copy size={14} /> Copy address
        </DropdownMenuItem>
    {tracking?.awb ? (
      <DropdownMenuItem onClick={async () => { try { await navigator.clipboard?.writeText(tracking.awb); toast.success('AWB copied'); } catch { toast.error('Failed to copy'); } }} className="inline-flex items-center gap-2">
            <Copy size={14} /> Copy AWB
          </DropdownMenuItem>
        ) : null}
  <div className="my-1 h-px bg-zinc-200" role="separator" />
        <DropdownMenuItem onClick={() => submitStatus('packed')} className="inline-flex items-center gap-2">
          <PackageCheck size={14} /> Mark packed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => submitStatus('shipped')} className="inline-flex items-center gap-2">
          <Truck size={14} /> Mark shipped
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => submitStatus('delivered')} className="inline-flex items-center gap-2">
          <CheckCircle2 size={14} /> Mark delivered
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => submitStatus('processing')} className="inline-flex items-center gap-2">
          <Undo2 size={14} /> Revert to processing
        </DropdownMenuItem>
  <div className="my-1 h-px bg-zinc-200" role="separator" />
        <DropdownMenuItem onClick={() => submitStatus('cancelled')} className="inline-flex items-center gap-2 text-rose-700">
          <XCircle size={14} /> Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
