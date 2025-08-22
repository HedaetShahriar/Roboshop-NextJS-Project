import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = await clientPromise;
  const db = client.db("roboshop");
  const users = db.collection("users");
  const email = session.user.email;
  const user = await users.findOne({ email });
  const profile = {
    name: user?.name || session.user.name || "",
    email,
    phone: user?.phone || "",
  };
  return NextResponse.json({ profile });
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { name = "", phone = "" } = body || {};
  const client = await clientPromise;
  const db = client.db("roboshop");
  const users = db.collection("users");
  await users.updateOne(
    { email: session.user.email },
    { $set: { name: String(name || ""), phone: String(phone || "") } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
