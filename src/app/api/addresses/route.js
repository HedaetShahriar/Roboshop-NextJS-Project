import { NextResponse } from "next/server";
import { getAuthedSession, badRequest, ok } from "@/lib/api";
import { listAddresses, createAddress, updateAddress, deleteAddress } from "@/data/user/addresses";

export async function GET() {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const addresses = await listAddresses(session.user.email);
  return ok({ addresses });
}

export async function POST(request) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body = await request.json();
  const { id } = await createAddress(session.user.email, body || {});
  return ok({ ok: true, id });
}

export async function PUT(request) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body = await request.json();
  const { id, ...update } = body || {};
  if (!id) return badRequest("Missing id");
  await updateAddress(session.user.email, id, update);
  return ok({ ok: true });
}

export async function DELETE(request) {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("Missing id");
  await deleteAddress(session.user.email, id);
  return ok({ ok: true });
}
