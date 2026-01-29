import { NextRequest, NextResponse } from "next/server";
import { getAuthedSession, getDb, badRequest, ok } from "@/lib/api";
import { ObjectId } from "mongodb";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  const email = session!.user.email as string;
  let order;
  try {
    order = await db
      .collection("orders")
      .findOne({ _id: new ObjectId(id), userId: email });
  } catch {
    return badRequest("Invalid order id");
  }
  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow cancel while processing (not packed/assigned/shipped/delivered)
  if (order.status !== "processing") {
    return NextResponse.json(
      { error: "Order cannot be cancelled at this stage" },
      { status: 400 }
    );
  }

  await db.collection("orders").updateOne(
    { _id: order._id },
    {
      $set: { status: "cancelled", updatedAt: new Date() },
      $push: {
        history: {
          code: "cancelled",
          label: "Order cancelled",
          at: new Date(),
        },
      } as any,
    }
  );

  return ok({ ok: true });
}
