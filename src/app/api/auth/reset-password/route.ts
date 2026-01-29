import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import getDb from "@/lib/mongodb";

interface ResetPasswordBody {
  token?: string;
  password?: string;
}

interface PasswordResetDocument {
  _id: ObjectId;
  token: string;
  userId: ObjectId | string;
  email: string;
  expiresAt?: Date;
  used: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ResetPasswordBody = await request.json();
    const { token, password } = body;
    if (!token || !password)
      return NextResponse.json(
        { error: "Token and password required" },
        { status: 400 }
      );
    if (String(password).length < 6)
      return NextResponse.json(
        { error: "Password too short" },
        { status: 400 }
      );

    const db = await getDb();
    const tokens = db.collection<PasswordResetDocument>("passwordResets");
    const users = db.collection("users");

    const reset = await tokens.findOne({ token, used: false });
    if (!reset)
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    if (reset.expiresAt && new Date(reset.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.updateOne(
      { _id: new ObjectId(reset.userId) },
      { $set: { hashedPassword, updatedAt: new Date() } }
    );
    await tokens.updateOne(
      { _id: reset._id },
      { $set: { used: true, usedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
