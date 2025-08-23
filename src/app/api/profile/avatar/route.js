import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { image } = body || {};
  if (typeof image !== "string") return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  const db = await getDb();
  const users = db.collection("users");
  const email = session.user.email;
  const before = await users.findOne({ email });
  const prevImage = before?.image || null;
  if (prevImage !== image) {
    try {
      await db.collection("profileAudits").insertOne({
        email,
        before: { image: prevImage },
        after: { image },
        updatedBy: email,
        updatedAt: new Date(),
        type: 'avatar',
      });
    } catch {}
  }
  await users.updateOne({ email }, { $set: { image, updatedAt: new Date() } }, { upsert: true });
  return NextResponse.json({ ok: true });
}
