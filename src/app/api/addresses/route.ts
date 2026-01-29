import { NextRequest, NextResponse } from "next/server";
import { getAuthedSession, badRequest, ok } from "@/lib/api";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/data/user/addresses";

interface AddressBody {
  id?: string;
  label?: string;
  country?: string;
  city?: string;
  area?: string;
  address1?: string;
  postalCode?: string;
}

export async function GET(): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const addresses = await listAddresses(session!.user.email!);
  return ok({ addresses });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body: AddressBody = await request.json();
  const { id } = await createAddress(session!.user.email!, body || {});
  return ok({ ok: true, id });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const body: AddressBody = await request.json();
  const { id, ...update } = body || {};
  if (!id) return badRequest("Missing id");
  await updateAddress(session!.user.email!, id, update);
  return ok({ ok: true });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { error, session } = await getAuthedSession();
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("Missing id");
  await deleteAddress(session!.user.email!, id);
  return ok({ ok: true });
}
