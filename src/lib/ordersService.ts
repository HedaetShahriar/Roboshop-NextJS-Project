import getDb from "./mongodb";
import { buildOrdersWhere, getOrdersSort } from "./ordersQuery";
import type { OrderFilters, Order } from "@/types";
import type { Document } from "mongodb";

export function getPageAndSize(sp: OrderFilters = {}): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, Number(sp?.page || "1"));
  const rawSize = Number(sp?.pageSize || "10");
  const pageSize = Math.min(100, Math.max(5, isNaN(rawSize) ? 10 : rawSize));
  return { page, pageSize };
}

function buildProjection(): Record<string, 1 | { $cond: unknown[] }> {
  // Minimal fields the dashboard table needs
  return {
    _id: 1,
    orderNumber: 1,
    status: 1,
    contact: 1,
    shippingAddress: 1,
    billingAddress: 1,
    payment: 1,
    amounts: 1,
    createdAt: 1,
    updatedAt: 1,
    // Include items for row expand mini-list
    items: 1,
    itemsCount: { $cond: [{ $isArray: "$items" }, { $size: "$items" }, 0] },
  };
}

interface OrdersResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getOrdersAndTotal(
  sp: OrderFilters = {},
): Promise<OrdersResult> {
  const db = await getDb();
  const where = buildOrdersWhere(sp);
  const sort = getOrdersSort((sp?.sort || "newest").toString());
  const { page, pageSize } = getPageAndSize(sp);
  const skip = (page - 1) * pageSize;
  const projection = buildProjection();

  const [total, list] = await Promise.all([
    db.collection("orders").countDocuments(where),
    db
      .collection("orders")
      .aggregate([
        { $match: where },
        {
          $addFields: {
            itemsCount: {
              $cond: [{ $isArray: "$items" }, { $size: "$items" }, 0],
            },
          },
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: pageSize },
        { $project: projection },
      ])
      .toArray(),
  ]);

  const orders = list.map((o: Document) => ({
    ...o,
    _id: o._id.toString(),
  })) as Order[];
  return { orders, total, page, pageSize };
}

// Simple in-memory cache for quick counts (best-effort; TTL 15s)
const _countsCache = new Map<
  string,
  { v: Record<string, number>; t: number }
>();
const COUNTS_TTL_MS = 15000;

interface QuickCounts {
  all: number;
  processing: number;
  packed: number;
  assigned: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  [key: string]: number;
}

export async function getOrdersQuickCounts(
  sp: OrderFilters = {},
): Promise<QuickCounts> {
  const base = buildOrdersWhere({ ...sp, status: "" });
  const key = JSON.stringify(base);
  const now = Date.now();
  const hit = _countsCache.get(key);
  if (hit && now - hit.t < COUNTS_TTL_MS) return hit.v as QuickCounts;

  const db = await getDb();
  const statuses = [
    "processing",
    "packed",
    "assigned",
    "shipped",
    "delivered",
    "cancelled",
  ] as const;
  const counts = await Promise.all([
    db.collection("orders").countDocuments(base),
    ...statuses.map((s) =>
      db.collection("orders").countDocuments({ ...base, status: s }),
    ),
  ]);
  const [all, ...rest] = counts;
  const obj: QuickCounts = {
    all,
    processing: 0,
    packed: 0,
    assigned: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  statuses.forEach((s, i) => {
    obj[s] = rest[i] || 0;
  });
  _countsCache.set(key, { v: obj, t: now });
  // GC occasionally
  if (_countsCache.size > 200) {
    for (const [k, val] of _countsCache) {
      if (now - val.t >= COUNTS_TTL_MS) _countsCache.delete(k);
    }
  }
  return obj;
}
