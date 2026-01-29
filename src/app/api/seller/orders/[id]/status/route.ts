import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  // TODO: Implement status retrieval for order
  return NextResponse.json(
    { error: "Not implemented", orderId: id },
    { status: 501 }
  );
}

export async function PUT(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  // TODO: Implement status update for order
  return NextResponse.json(
    { error: "Not implemented", orderId: id },
    { status: 501 }
  );
}
