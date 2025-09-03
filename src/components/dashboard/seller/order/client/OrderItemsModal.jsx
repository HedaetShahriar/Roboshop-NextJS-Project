"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatBDT } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

const currencyFmt = { format: (n) => formatBDT(n) };

export default function OrderItemsModal({ order }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(order?.items) ? order.items : [];
  const amounts = order?.amounts || {};
  const discountAmount = typeof amounts?.discount === 'number'
    ? Number(amounts.discount)
    : Number(amounts?.discount?.amount || amounts?.discount?.value || 0);
  const discountPercent = typeof amounts?.discount === 'object' && amounts?.discount?.type === 'percent'
    ? Number(amounts.discount.value)
    : null;
  const shippingFee = Number(amounts?.shipping ?? order?.shipping?.fee ?? 0);
  const ordNo = order?.orderNumber || String(order?._id || '').slice(-6);
  const title = `Order #${ordNo}`;
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "Roboshop";
  const shopLogo = process.env.NEXT_PUBLIC_SHOP_LOGO_URL || "";
  const shop = {
    name: shopName,
    address1: process.env.NEXT_PUBLIC_SHOP_ADDRESS1 || "",
    city: process.env.NEXT_PUBLIC_SHOP_CITY || "",
    state: process.env.NEXT_PUBLIC_SHOP_STATE || "",
    postalCode: process.env.NEXT_PUBLIC_SHOP_POSTAL || "",
    country: process.env.NEXT_PUBLIC_SHOP_COUNTRY || "",
    phone: process.env.NEXT_PUBLIC_SHOP_PHONE || "",
    email: process.env.NEXT_PUBLIC_SHOP_EMAIL || "",
  };
  const invoiceDate = order?.createdAt ? formatDateTime(order.createdAt) : new Date().toLocaleString();
  const billing = order?.billingAddress && Object.keys(order.billingAddress).length > 0
    ? order.billingAddress
    : {
        fullName: order?.contact?.fullName,
        email: order?.contact?.email,
        phone: order?.contact?.phone,
        address1: order?.shippingAddress?.address1,
        city: order?.shippingAddress?.city,
        state: order?.shippingAddress?.state,
        postalCode: order?.shippingAddress?.postalCode,
        country: order?.shippingAddress?.country,
      };
  const shipping = order?.shippingAddress || {};
  const payLabel = [order?.payment?.method, order?.payment?.status].filter(Boolean).join(" • ");
  const accountLabel = order?.contact?.email || order?.userId || "N/A";
  const dueDate = (() => {
    try {
      const base = order?.createdAt ? new Date(order.createdAt) : new Date();
      base.setDate(base.getDate() + 7);
      return formatDateTime(base);
    } catch { return ""; }
  })();

  const vatPercent = Number(process.env.NEXT_PUBLIC_INVOICE_VAT_PERCENT || 0);
  const subtotal = Number(amounts?.subtotal ?? items.reduce((s, it) => s + Number(it?.price || it?.unitPrice || 0) * Number(it?.qty || it?.quantity || 1), 0));
  const baseTotal = isFinite(Number(amounts?.total))
    ? Number(amounts.total)
    : Math.max(0, subtotal - Math.max(0, discountAmount) + Math.max(0, shippingFee));
  const vatAmount = Math.max(0, Math.round((subtotal * vatPercent) / 100));
  const displayedTotal = baseTotal + (vatPercent > 0 ? vatAmount : 0);

  const addrLine = (a) => [a?.address1, a?.city, a?.state, a?.postalCode, a?.country].filter(Boolean).join(", ");

  const buildInvoiceHtml = () => {
    const rows = items.map((it) => {
      const qty = Number(it?.qty || it?.quantity || 1);
      const unit = Number(it?.price || it?.unitPrice || 0);
      const line = qty * unit;
      const name = it?.name || it?.title || 'Item';
      const variant = it?.variant ? ` (${String(it.variant)})` : '';
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(name)}${variant}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(currencyFmt.format(unit))}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(currencyFmt.format(line))}</td>
      </tr>`;
    }).join('');
    const discountHtml = (discountAmount > 0)
      ? `<tr><td class=\"right\" style=\"color:#047857\">Discount${discountPercent!=null?` (${discountPercent}%)`:''}</td><td class=\"right\" style=\"color:#047857\">- ${escapeHtml(currencyFmt.format(discountAmount))}</td></tr>`
      : '';
    const shippingHtml = (shippingFee > 0)
      ? `<tr><td class=\"right muted\">Shipping</td><td class=\"right\">${escapeHtml(currencyFmt.format(shippingFee))}</td></tr>`
      : '';
    return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(`${shopName} — Invoice ${ordNo}`)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>
        :root{--fg:#0a0a0a;--muted:#666;--border:#e5e7eb}
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:28px;color:var(--fg)}
        h1{font-size:28px;letter-spacing:1px;margin:0 0 12px}
        h2{font-size:14px;margin:16px 0 6px}
        .muted{color:var(--muted);font-size:12px}
        .meta{font-size:12px;color:#111}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .grid3{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .card{border:1px solid var(--border);border-radius:8px;padding:10px;background:#fafafa}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border-bottom:1px solid var(--border)}
        th{font-size:12px;text-align:left;padding:8px;background:#f8fafc}
        td{padding:8px;font-size:13px}
        tfoot td{font-weight:600;border-bottom:none}
        .totals td{padding:6px}
        .right{text-align:right}
        .hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
        .shop{font-weight:700;font-size:18px}
        .badge{display:inline-block;border:1px solid var(--border);border-radius:999px;padding:2px 8px;font-size:11px}
        .metaTable{width:auto;border-collapse:collapse}
        .metaTable td{border:none;padding:3px 0 3px 12px;font-size:12px}
        .metaTable td:first-child{color:#111;padding-left:0}
      </style>
    </head><body>
      <div class="hdr">
        <h1>INVOICE</h1>
        ${shopLogo ? `<img src="${escapeHtml(shopLogo)}" alt="Logo" style="max-height:42px;object-fit:contain"/>` : `<div class="shop">${escapeHtml(shopName)}</div>`}
      </div>
      <div class="grid2" style="margin-bottom:8px">
        <div>
          <div style="font-weight:700">From</div>
          <div style="font-weight:600">${escapeHtml(shop.name)}</div>
          ${shop.address1 ? `<div>${escapeHtml(shop.address1)}</div>` : ''}
          ${shop.city || shop.state || shop.postalCode ? `<div>${escapeHtml([shop.city, shop.state, shop.postalCode].filter(Boolean).join(', '))}</div>` : ''}
          ${shop.country ? `<div>${escapeHtml(shop.country)}</div>` : ''}
          ${shop.phone ? `<div>Phone: ${escapeHtml(shop.phone)}</div>` : ''}
          ${shop.email ? `<div>Email: ${escapeHtml(shop.email)}</div>` : ''}
        </div>
        <div class="right">
          <table class="metaTable" style="margin-left:auto">
            <tr><td><strong>Invoice #</strong></td><td>${escapeHtml(ordNo)}</td></tr>
            <tr><td>Account</td><td>${escapeHtml(accountLabel)}</td></tr>
            <tr><td>Order ID</td><td>#${escapeHtml(ordNo)}</td></tr>
            <tr><td>Invoice Date</td><td>${escapeHtml(invoiceDate)}</td></tr>
            ${dueDate ? `<tr><td>Due Date</td><td>${escapeHtml(dueDate)}</td></tr>` : ''}
          </table>
        </div>
      </div>
      <div class="grid2">
        <div>
          <div style="font-weight:700">Bill To</div>
          <div style="font-weight:600">${escapeHtml(billing?.fullName || '—')}</div>
          ${billing?.address1 || billing?.city ? `<div class="muted">${escapeHtml(addrLine(billing)) || '—'}</div>` : ''}
          ${billing?.phone ? `<div class="muted">Phone: ${escapeHtml(billing.phone)}</div>` : ''}
          ${billing?.email ? `<div class="muted">Email: ${escapeHtml(billing.email)}</div>` : ''}
        </div>
        <div></div>
      </div>
      <table>
        <thead><tr><th style="text-align:left;padding:8px">PRODUCT</th><th style="text-align:right;padding:8px">QTY</th><th style="text-align:right;padding:8px">UNIT PRICE</th><th style="text-align:right;padding:8px">AMOUNT</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    <table class="mt16">
        <tbody class="totals">
      <tr><td class="right" style="width:80%">Subtotal</td><td class="right" style="width:20%">${escapeHtml(currencyFmt.format(subtotal))}</td></tr>
      ${discountHtml}
      ${shippingHtml}
      ${vatPercent > 0 ? `<tr><td class=\"right\">VAT (${vatPercent}%)</td><td class=\"right\">${escapeHtml(currencyFmt.format(vatAmount))}</td></tr>` : ''}
      <tr><td class="right">TOTAL</td><td class="right">${escapeHtml(currencyFmt.format(displayedTotal))}</td></tr>
        </tbody>
      </table>
      <script>window.addEventListener('load',()=>{setTimeout(()=>{window.focus();window.print();},100)});</script>
    </body></html>`;
  };

  const openInvoiceWindow = () => {
    try {
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(buildInvoiceHtml());
      w.document.close();
    } catch {}
  };

  const printInvoice = () => openInvoiceWindow();
  const downloadPdf = () => openInvoiceWindow();
  return (
    <>
      <button type="button" className="text-[11px] text-zinc-700 hover:text-zinc-900 underline underline-offset-2" onClick={() => setOpen(true)}>View items</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice • {shopName}</span>
              <span className="text-xs text-muted-foreground">#{ordNo}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Date: {invoiceDate}{payLabel ? ` • Payment: ${payLabel}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="text-2xl font-semibold tracking-wide">INVOICE</div>
              {shopLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shopLogo} alt="Logo" className="h-10 object-contain" />
              ) : (
                <div className="text-sm font-semibold">{shopName}</div>
              )}
            </div>
            {/* From + Meta */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold mb-1">From</div>
                <div className="text-sm font-medium">{shop.name}</div>
                {shop.address1 ? <div className="text-xs text-muted-foreground">{shop.address1}</div> : null}
                {(shop.city || shop.state || shop.postalCode) ? (
                  <div className="text-xs text-muted-foreground">{[shop.city, shop.state, shop.postalCode].filter(Boolean).join(', ')}</div>
                ) : null}
                {shop.country ? <div className="text-xs text-muted-foreground">{shop.country}</div> : null}
                {shop.phone ? <div className="text-xs text-muted-foreground">Phone: {shop.phone}</div> : null}
                {shop.email ? <div className="text-xs text-muted-foreground">Email: {shop.email}</div> : null}
              </div>
              <div className="sm:text-right text-xs">
                <div className="font-semibold">Invoice # {ordNo}</div>
                <div className="mt-1">Account: {accountLabel}</div>
                <div>Order ID: #{ordNo}</div>
                <div>Invoice Date: {invoiceDate}</div>
                {dueDate ? <div>Due Date: {dueDate}</div> : null}
              </div>
            </div>
            {/* Bill To */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold mb-1">Bill To</div>
                <div className="text-sm font-medium">{billing?.fullName || '—'}</div>
                <div className="text-xs text-muted-foreground">{addrLine(billing) || '—'}</div>
                {billing?.phone ? <div className="text-xs text-muted-foreground">Phone: {billing.phone}</div> : null}
                {billing?.email ? <div className="text-xs text-muted-foreground">Email: {billing.email}</div> : null}
              </div>
            </div>
            {/* Billing/Shipping blocks */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded border p-3 bg-zinc-50">
                <div className="text-xs font-semibold mb-1">Bill To</div>
                <div className="text-sm font-medium">{billing?.fullName || '—'}</div>
                {billing?.email ? <div className="text-xs text-muted-foreground">{billing.email}</div> : null}
                {billing?.phone ? <div className="text-xs text-muted-foreground">{billing.phone}</div> : null}
                <div className="text-xs text-muted-foreground mt-1">{addrLine(billing) || '—'}</div>
              </div>
              <div className="rounded border p-3 bg-zinc-50">
                <div className="text-xs font-semibold mb-1">Ship To</div>
                <div className="text-sm font-medium">{order?.contact?.fullName || '—'}</div>
                {order?.contact?.email ? <div className="text-xs text-muted-foreground">{order.contact.email}</div> : null}
                {order?.contact?.phone ? <div className="text-xs text-muted-foreground">{order.contact.phone}</div> : null}
                <div className="text-xs text-muted-foreground mt-1">{addrLine(shipping) || '—'}</div>
              </div>
            </div>

            {/* Items */}
    <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
      <th className="px-2 py-2">Product</th>
      <th className="px-2 py-2">Qty</th>
      <th className="px-2 py-2 text-right">Unit Price</th>
      <th className="px-2 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const qty = Number(it?.qty || it?.quantity || 1);
                  const unit = Number(it?.price || it?.unitPrice || 0);
                  const line = qty * unit;
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="px-2 py-2">
                        <div className="font-medium">{it?.name || it?.title || 'Item'}</div>
                        {it?.variant ? <div className="text-[11px] text-muted-foreground">{it.variant}</div> : null}
                      </td>
                      <td className="px-2 py-2">{qty}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{currencyFmt.format(unit)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{currencyFmt.format(line)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="text-right text-muted-foreground">Subtotal</div>
            <div className="text-right tabular-nums">{currencyFmt.format(Number(amounts?.subtotal ?? 0))}</div>
            {vatPercent > 0 && (
              <>
                <div className="text-right text-muted-foreground">VAT ({vatPercent}%)</div>
                <div className="text-right tabular-nums">{currencyFmt.format(vatAmount)}</div>
              </>
            )}
            {Number(amounts?.discount || 0) > 0 && (
              <>
                <div className="text-right text-emerald-700">Discount</div>
                <div className="text-right tabular-nums text-emerald-700">- {currencyFmt.format(Number(amounts?.discount || 0))}</div>
              </>
            )}
            {Number(amounts?.shipping || 0) > 0 && (
              <>
                <div className="text-right text-muted-foreground">Shipping</div>
                <div className="text-right tabular-nums">{currencyFmt.format(Number(amounts?.shipping || 0))}</div>
              </>
            )}
            <div className="text-right font-semibold">TOTAL</div>
            <div className="text-right tabular-nums font-semibold">{currencyFmt.format(displayedTotal)}</div>
          </div>
          <DialogFooter>
            <button type="button" className="h-9 px-3 rounded border bg-white hover:bg-zinc-50 text-sm" onClick={printInvoice}>Print invoice</button>
            <button type="button" className="h-9 px-3 rounded border bg-zinc-900 text-white hover:bg-zinc-800 text-sm" onClick={downloadPdf}>Download Invoice</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function escapeHtml(s) {
  try {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  } catch { return ''; }
}
