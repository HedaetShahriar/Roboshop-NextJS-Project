import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  const orders = await db
    .collection("orders")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  const mapped = orders.map((o) => ({ ...o, _id: o._id.toString() }));
  return NextResponse.json({ orders: mapped });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  if (!(total >= 0)) return NextResponse.json({ error: "Invalid totals" }, { status: 400 });

  const order = {
    userId: session.user.email,
    items: items.map((it) => ({ id: it.id, name: it.name, price: Number(it.price || 0), qty: Number(it.qty || 1), image: it.image || null })),
    amounts: { subtotal: Number(subtotal || 0), discount: Number(discount || 0), shipping: Number(shipping || 0), total: Number(total || 0) },
    promoCode: promoCode || null,
    contact: { fullName: form.fullName, email: form.email, phone: form.phone },
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
    status: "processing", // processing -> shipped -> delivered
    orderNumber: `RB${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const client = await clientPromise;
  const db = client.db("roboshop");
  const result = await db.collection("orders").insertOne(order);
  return NextResponse.json({ ok: true, id: result.insertedId.toString(), orderNumber: order.orderNumber });
}
