import { NextRequest, NextResponse } from "next/server";
import { getOrdersQuickCounts } from "@/lib/ordersService";
import type { OrderFilters } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sp: OrderFilters = Object.fromEntries(searchParams.entries());
    const counts = await getOrdersQuickCounts(sp);
    return NextResponse.json(counts, { status: 200 });
  } catch (e) {
    console.error("Error fetching order counts:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
