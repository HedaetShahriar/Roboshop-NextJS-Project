import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { image } = body || {};
  if (typeof image !== "string") return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  await db.collection("users").updateOne({ email: session.user.email }, { $set: { image } }, { upsert: true });
  return NextResponse.json({ ok: true });
}
