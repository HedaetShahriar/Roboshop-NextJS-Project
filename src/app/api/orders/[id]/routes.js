import { NextResponse } from "next/server";
import { getAuthedSession, getDb, badRequest, ok } from "@/lib/api";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  let order;
  try {
    order = await db.collection("orders").findOne({ _id: new ObjectId(id), userId: session.user.email });
  } catch {
    return badRequest("Invalid order id");
  }
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow cancel while processing (not packed/assigned/shipped/delivered)
  if (order.status !== 'processing') {
    return NextResponse.json({ error: "Order cannot be cancelled at this stage" }, { status: 400 });
  }

  await db.collection("orders").updateOne(
    { _id: order._id },
    { $set: { status: 'cancelled', updatedAt: new Date() }, $push: { history: { code: 'cancelled', label: 'Order cancelled', at: new Date() } } }
  );

  return ok({ ok: true });
}