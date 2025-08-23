import { NextResponse } from "next/server";
import { getAuthedSession, parseSearchParams } from "@/lib/api";
import { getOrdersAndTotal } from "@/lib/ordersService";

export async function GET(request) {
  const { error } = await getAuthedSession({ requireSeller: true });
  if (error) return error;

  const sp = parseSearchParams(request);
  const { orders, total, page, pageSize } = await getOrdersAndTotal({
    q: sp.q,
    status: sp.status,
    from: sp.from,
    to: sp.to,
    sort: sp.sort,
    page: sp.page,
    pageSize: sp.pageSize,
  });
  const mapped = orders.map(o => ({ ...o, _id: o._id.toString() }));
  return NextResponse.json({ orders: mapped, total, page, pageSize });
}
