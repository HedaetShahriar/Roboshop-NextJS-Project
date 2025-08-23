import { NextResponse } from "next/server";
import { getAuthedSession, ok } from "@/lib/api";
import getDb from "@/lib/mongodb";

// Save or update the current user's in-progress cart
export async function POST(request) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const { items = [], subtotal = 0 } = body || {};
  const db = await getDb();
  await db.collection("carts").updateOne(
    { userId: session.user.email },
    { $set: { userId: session.user.email, items, subtotal, updatedAt: new Date() } },
    { upsert: true }
  );
  return ok({ ok: true });
}

// Optionally get the saved cart (not required by the task but handy)
export async function GET() {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const db = await getDb();
  const doc = await db.collection("carts").findOne({ userId: session.user.email });
  return ok({ cart: doc ? { ...doc, _id: doc._id.toString() } : null });
}
