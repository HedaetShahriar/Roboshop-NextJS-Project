import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

// Save or update the current user's in-progress cart
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { items = [], subtotal = 0 } = body || {};
  const client = await clientPromise;
  const db = client.db("roboshop");
  await db.collection("carts").updateOne(
    { userId: session.user.email },
    { $set: { userId: session.user.email, items, subtotal, updatedAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}

// Optionally get the saved cart (not required by the task but handy)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  const doc = await db.collection("carts").findOne({ userId: session.user.email });
  return NextResponse.json({ cart: doc ? { ...doc, _id: doc._id.toString() } : null });
}
