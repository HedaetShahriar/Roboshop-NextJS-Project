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
  const email = session.user.email;
  const before = await users.findOne({ email });
  // Audit only when there is a change
  const nextName = String(name || "");
  const nextPhone = String(phone || "");
  const changed = (before?.name || "") !== nextName || (before?.phone || "") !== nextPhone;
  if (changed) {
    try {
      await db.collection("profileAudits").insertOne({
        email,
        before: { name: before?.name || "", phone: before?.phone || "" },
        after: { name: nextName, phone: nextPhone },
        updatedBy: email,
        updatedAt: new Date(),
      });
    } catch {}
  }
  await users.updateOne(
    { email },
    { $set: { name: nextName, phone: nextPhone, updatedAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
