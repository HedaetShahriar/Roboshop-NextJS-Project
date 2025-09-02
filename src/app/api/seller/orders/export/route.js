import { NextResponse } from "next/server";
import { getOrdersAndTotal } from "@/lib/ordersService";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sp = Object.fromEntries(searchParams.entries());
  const { orders } = await getOrdersAndTotal(sp);
  const headers = ['orderNumber','status','customer','phone','email','createdAt','total'];
  const rows = [headers.join(',')];
  for (const o of orders) {
    const vals = [
      o.orderNumber ?? '',
      o.status ?? '',
      o?.contact?.fullName ?? '',
      o?.contact?.phone ?? '',
      o?.contact?.email ?? '',
      o.createdAt ? new Date(o.createdAt).toISOString() : '',
      (o?.amounts?.total ?? 0),
    ];
    rows.push(vals.map((v) => String(v).replaceAll('"', '""')).map((v)=>/[,"\n]/.test(v)?`"${v}"`:v).join(','));
  }
  const body = rows.join('\n');
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orders.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
