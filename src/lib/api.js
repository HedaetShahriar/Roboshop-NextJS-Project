import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAuthedSession(opts = {}) {
  const { requireSeller = false } = opts;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = session.user.role || "customer";
  if (requireSeller && role === "customer") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export function parseSearchParams(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

export function ok(data = {}, init = {}) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function badRequest(message = "Bad Request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal Server Error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
