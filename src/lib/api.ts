import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import getDb from "@/lib/mongodb";
import type { Session } from "next-auth";

interface AuthedSessionResult {
  session?: Session;
  error?: NextResponse<{ error: string }>;
}

interface GetAuthedSessionOptions {
  requireSeller?: boolean;
}

export async function getAuthedSession(
  opts: GetAuthedSessionOptions = {},
): Promise<AuthedSessionResult> {
  const { requireSeller = false } = opts;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const role = session.user.role || "customer";
  if (requireSeller && role === "customer") {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session };
}

export function parseSearchParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}

export function ok<T extends object>(
  data: T = {} as T,
  init: ResponseInit = {},
): NextResponse<T> {
  return NextResponse.json(data, { status: 200, ...init });
}

export function badRequest(message: string = "Bad Request"): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function forbidden(message: string = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message: string = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(
  message: string = "Internal Server Error",
): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

// Convenience re-export so API routes can import { getDb } from "@/lib/api"
export { getDb };
