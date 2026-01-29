import { NextRequest, NextResponse } from "next/server";
import { getAuthedSession, getDb, ok, badRequest } from "@/lib/api";
import { ObjectId } from "mongodb";

interface IssueBody {
  category?: string;
  subject?: string;
  description?: string;
}

interface OrderDocument {
  _id: ObjectId;
  orderNumber: string;
  userId: string;
}

interface OrderIssueDocument {
  _id: ObjectId;
  orderId: ObjectId;
  orderNumber: string;
  userId: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  messages: Array<{ by: string; text: string; at: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  let order: OrderDocument | null;
  try {
    order = await db
      .collection<OrderDocument>("orders")
      .findOne({ _id: new ObjectId(id) });
  } catch {
    return badRequest("Invalid order id");
  }
  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Allow owner or non-customer roles to read
  if (
    order.userId !== session!.user.email &&
    (session!.user.role || "customer") === "customer"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const issues = await db
    .collection<OrderIssueDocument>("order_issues")
    .find({ orderId: order._id })
    .sort({ createdAt: -1 })
    .toArray();
  const mapped = issues.map((i) => ({
    ...i,
    _id: i._id.toString(),
    orderId: i.orderId.toString(),
  }));
  return ok({ issues: mapped });
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { id } = await params;
  const db = await getDb();
  const email = session!.user.email as string;
  let order: OrderDocument | null;
  try {
    order = await db
      .collection<OrderDocument>("orders")
      .findOne({ _id: new ObjectId(id), userId: email });
  } catch {
    return badRequest("Invalid order id");
  }
  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body: IssueBody = await request.json();
  const category = (body?.category || "").toString().slice(0, 50) || "other";
  const subject =
    (body?.subject || "").toString().slice(0, 120) || "Order issue";
  const description = (body?.description || "").toString().slice(0, 2000);
  if (!description) return badRequest("Description is required");

  // Prevent duplicate open issues per order
  const existingOpen = await db.collection<OrderIssueDocument>("order_issues").findOne({
    orderId: order._id,
    status: { $in: ["open", "in_progress"] },
  });
  if (existingOpen) {
    return ok({ ok: true, id: existingOpen._id.toString(), duplicate: true });
  }

  const now = new Date();
  const issue = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    userId: session!.user.email,
    category,
    subject,
    description,
    status: "open",
    messages: [{ by: "customer", text: description, at: now }],
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection("order_issues").insertOne(issue);

  // Optional: append to order history
  try {
    await db.collection("orders").updateOne(
      { _id: order._id },
      {
        $push: {
          history: { code: "issue-opened", label: "Issue reported", at: now },
        } as any,
        $set: { updatedAt: now },
      }
    );
  } catch {}

  return ok({ ok: true, id: result.insertedId.toString() });
}
