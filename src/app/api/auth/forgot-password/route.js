import { NextResponse } from "next/server";
import crypto from "crypto";
import getDb from "@/lib/mongodb";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalized = String(email || "").toLowerCase().trim();
    if (!normalized) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const db = await getDb();
    const users = db.collection("users");
    const tokens = db.collection("passwordResets");

    // Find user; respond 200 regardless to prevent enumeration
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await users.findOne({ email: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
      await tokens.createIndex({ token: 1 }, { unique: true });
      await tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await tokens.insertOne({ token, userId: user._id, email: user.email, expiresAt, used: false, createdAt: new Date() });

      // TODO: Send email. For now, we return the reset link in dev mode only or omit entirely for security.
      // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password?token=${token}`;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
