import { NextResponse } from "next/server";
import { getAuthedSession, ok } from "@/lib/api";
import { getProfile, updateProfile } from "@/data/user/profile";

export async function GET() {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const email = session.user.email;
  const profile = await getProfile(email, { name: session.user.name || "" });
  return ok({ profile });
}

export async function PUT(request) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body = await request.json();
  const { name = "", phone = "" } = body || {};
  const email = session.user.email;
  await updateProfile(email, { name, phone });
  return ok({ ok: true });
}
