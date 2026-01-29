import { NextRequest, NextResponse } from "next/server";
import { getAuthedSession, ok } from "@/lib/api";
import { getProfile, updateProfile } from "@/data/user/profile";

interface ProfileBody {
  name?: string;
  phone?: string;
}

export async function GET(): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const email = session!.user.email!;
  const profile = await getProfile(email, { name: session!.user.name || "" });
  return ok({ profile });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body: ProfileBody = await request.json();
  const { name = "", phone = "" } = body || {};
  const email = session!.user.email!;
  await updateProfile(email, { name, phone });
  return ok({ ok: true });
}
