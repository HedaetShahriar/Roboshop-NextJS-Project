import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("roboshop");
    const tokens = db.collection("passwordResets");
    const users = db.collection("users");

    const reset = await tokens.findOne({ token, used: false });
    if (!reset) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    if (reset.expiresAt && new Date(reset.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.updateOne({ _id: new ObjectId(reset.userId) }, { $set: { hashedPassword, updatedAt: new Date() } });
    await tokens.updateOne({ _id: reset._id }, { $set: { used: true, usedAt: new Date() } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
