import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("roboshop");
    const users = db.collection("users");
    // Ensure unique index for email (best-effort)
    try { await users.createIndex({ email: 1 }, { unique: true }); } catch {}

    // Case-insensitive exact match
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await users.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const doc = {
      name,
      email,
      image: null,
      hashedPassword,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      oauthProvider: null,
  role: 'customer',
    };
    const result = await users.insertOne(doc);
    return NextResponse.json({ ok: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
