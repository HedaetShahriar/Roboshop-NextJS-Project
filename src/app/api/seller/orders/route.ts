import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  // TODO: Implement orders listing functionality
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
  // TODO: Implement order creation functionality
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
