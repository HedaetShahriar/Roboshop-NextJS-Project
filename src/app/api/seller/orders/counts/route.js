import { NextResponse } from "next/server";
import { getOrdersQuickCounts } from "@/lib/ordersService";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sp = Object.fromEntries(searchParams.entries());
    const counts = await getOrdersQuickCounts(sp);
    return NextResponse.json(counts, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
