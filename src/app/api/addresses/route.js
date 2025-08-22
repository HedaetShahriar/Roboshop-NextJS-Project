import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  const docs = await db
    .collection("addresses")
    .find({ userId: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  const addresses = docs.map((d) => ({ ...d, _id: d._id.toString() }));
  return NextResponse.json({ addresses });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { label = "Home", country = "", city = "", area = "", address1 = "", address2 = "", postalCode = "" } = body || {};
  const client = await clientPromise;
  const db = client.db("roboshop");
  const doc = {
    userId: session.user.email,
    label: String(label || "Home"),
    country: String(country || ""),
    city: String(city || ""),
    area: String(area || ""),
    address1: String(address1 || ""),
    address2: String(address2 || ""),
    postalCode: String(postalCode || ""),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection("addresses").insertOne(doc);
  return NextResponse.json({ ok: true, id: result.insertedId.toString() });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...update } = body || {};
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  await db.collection("addresses").updateOne({ _id: new ObjectId(id), userId: session.user.email }, { $set: { ...update, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  await db.collection("addresses").deleteOne({ _id: new ObjectId(id), userId: session.user.email });
  return NextResponse.json({ ok: true });
}
