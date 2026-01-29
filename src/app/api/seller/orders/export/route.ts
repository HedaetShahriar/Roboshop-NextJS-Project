import { NextRequest, NextResponse } from "next/server";
import { getOrdersAndTotal } from "@/lib/ordersService";
import type { OrderFilters, Order } from "@/types";

interface OrderContact {
  fullName?: string;
  phone?: string;
  email?: string;
}

interface OrderAmounts {
  total?: number;
}

interface OrderWithDetails extends Order {
  orderNumber?: string;
  contact?: OrderContact;
  amounts?: OrderAmounts;
}

function escapeCSVValue(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const sp: OrderFilters = Object.fromEntries(searchParams.entries());
  const { orders } = await getOrdersAndTotal(sp);

  const headers = [
    "orderNumber",
    "status",
    "customer",
    "phone",
    "email",
    "createdAt",
    "total",
  ];
  const rows: string[] = [headers.join(",")];

  for (const o of orders as OrderWithDetails[]) {
    const vals: (string | number)[] = [
      o.orderNumber ?? "",
      o.status ?? "",
      o?.contact?.fullName ?? "",
      o?.contact?.phone ?? "",
      o?.contact?.email ?? "",
      o.createdAt ? new Date(o.createdAt).toISOString() : "",
      o?.amounts?.total ?? 0,
    ];
    rows.push(vals.map((v) => escapeCSVValue(String(v))).join(","));
  }

  const body = rows.join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
      "Cache-Control": "no-store",
    },
  });
}
