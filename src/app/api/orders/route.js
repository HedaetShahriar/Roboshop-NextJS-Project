import { NextResponse } from "next/server";
import { getAuthedSession, getDb, badRequest, ok } from "@/lib/api";

export async function GET() {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const db = await getDb();
  const orders = await db
    .collection("orders")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  const mapped = orders.map((o) => ({ ...o, _id: o._id.toString() }));
  return ok({ orders: mapped });
}

export async function POST(request) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body = await request.json();
  const {
    items = [],
    subtotal = 0,
    discount = 0,
    shipping = 0,
    total = 0,
    promoCode = null,
    form = {},
  } = body || {};

  if (!Array.isArray(items) || items.length === 0) return badRequest("Cart is empty");
  if (!(total >= 0)) return badRequest("Invalid totals");

  // Normalize phone to Bangladeshi E.164 format (+880...)
  const normalizePhone = (rawPhone) => {
    const str = (rawPhone ?? '').toString().trim();
    if (!str) return '';
    const digits = str.replace(/[^0-9]/g, '');
    if (!digits) return '';
    // Remove existing country code if present
    let local = digits.startsWith('880') ? digits.slice(3) : digits;
    // Remove trunk leading zeros
    local = local.replace(/^0+/, '');
    if (!local) return '';
    return `+880${local}`;
  };

  const order = {
    userId: session.user.email,
    items: items.map((it) => ({ id: it.id, name: it.name, price: Number(it.price || 0), qty: Number(it.qty || 1), image: it.image || null })),
    amounts: { subtotal: Number(subtotal || 0), discount: Number(discount || 0), shipping: Number(shipping || 0), total: Number(total || 0) },
    promoCode: promoCode || null,
  contact: { fullName: form.fullName, email: form.email, phone: normalizePhone(form.phone) },
    shippingAddress: {
      country: form.country,
      city: form.city,
      area: form.area,
      address1: form.address1,
      address2: form.address2,
      postalCode: form.postalCode,
      notes: form.notes || "",
    },
    billingAddress: form.billingSameAsShipping
      ? null
      : {
          country: form.billingCountry,
          city: form.billingCity,
          area: form.billingArea,
          address1: form.billingAddress1,
          address2: form.billingAddress2,
          postalCode: form.billingPostalCode,
        },
    payment: {
      method: form.paymentMethod,
      bkashNumber: form.paymentMethod === "bkash" ? form.bkashNumber : undefined,
      bkashTxnId: form.paymentMethod === "bkash" ? form.bkashTxnId : undefined,
      cardLast4:
        form.paymentMethod === "card" && typeof form.cardNumber === "string"
          ? form.cardNumber.replace(/\s+/g, "").slice(-4)
          : undefined,
    },
    status: "processing", // processing -> shipped -> delivered | cancelled
    orderNumber: `RB${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    history: [
      { code: 'placed', label: 'Order placed', at: new Date() },
    ],
  };

  const db = await getDb();
  const result = await db.collection("orders").insertOne(order);
  return ok({ ok: true, id: result.insertedId.toString(), orderNumber: order.orderNumber });
}
