import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const client = await clientPromise;
  const db = client.db("roboshop");
  let order;
  try {
    order = await db.collection("orders").findOne({ _id: new ObjectId(id), userId: session.user.email });
  } catch {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
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

  return NextResponse.json({ ok: true });
}
