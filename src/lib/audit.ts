import getDb from "./mongodb";

interface ProductAuditParams {
  userEmail?: string | null;
  action: string;
  scope?: "single" | "bulk" | "page" | "filtered";
  ids?: string[];
  filters?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export async function addProductAudit({
  userEmail,
  action,
  scope = "single",
  ids = [],
  filters = {},
  params = {},
}: ProductAuditParams): Promise<void> {
  try {
    const db = await getDb();
    const doc = {
      type: "products",
      userEmail: userEmail || 'anonymous',
      action,
      scope,
      ids: Array.isArray(ids) ? ids.slice(0, 50) : [], // cap to avoid huge docs
      idsCount: Array.isArray(ids) ? ids.length : 0,
      filters,
      params,
      createdAt: new Date(),
    };
    await db.collection("audit_logs").insertOne(doc);
  } catch {
    // best effort; ignore failures
  }
}

interface OrderAuditParams {
  userEmail?: string | null;
  action: string;
  ids?: string[];
  params?: Record<string, unknown>;
}

export async function addOrderAudit({
  userEmail,
  action,
  ids = [],
  params = {},
}: OrderAuditParams): Promise<void> {
  try {
    const db = await getDb();
    const doc = {
      type: "orders",
      userEmail: userEmail || 'anonymous',
      action,
      scope: "single",
      ids: Array.isArray(ids) ? ids.slice(0, 50) : [],
      idsCount: Array.isArray(ids) ? ids.length : 0,
      params,
      createdAt: new Date(),
    };
    await db.collection("audit_logs").insertOne(doc);
  } catch {
    /* best effort */
  }
}

interface IssueAuditParams {
  userEmail?: string | null;
  action: string;
  ids?: string[];
  params?: Record<string, unknown>;
}

export async function addIssueAudit({
  userEmail,
  action,
  ids = [],
  params = {},
}: IssueAuditParams): Promise<void> {
  try {
    const db = await getDb();
    const doc = {
      type: "issues",
      userEmail: userEmail || 'anonymous',
      action,
      scope: "single",
      ids: Array.isArray(ids) ? ids.slice(0, 50) : [],
      idsCount: Array.isArray(ids) ? ids.length : 0,
      params,
      createdAt: new Date(),
    };
    await db.collection("audit_logs").insertOne(doc);
  } catch {
    /* best effort */
  }
}

interface CouponAuditParams {
  userEmail: string;
  action: string;
  ids?: string[];
  params?: Record<string, unknown>;
}

export async function addCouponAudit({
  userEmail,
  action,
  ids = [],
  params = {},
}: CouponAuditParams): Promise<void> {
  try {
    const db = await getDb();
    const doc = {
      type: "coupons",
      userEmail,
      action,
      scope: "single",
      ids: Array.isArray(ids) ? ids.slice(0, 50) : [],
      idsCount: Array.isArray(ids) ? ids.length : 0,
      params,
      createdAt: new Date(),
    };
    await db.collection("audit_logs").insertOne(doc);
  } catch {
    /* best effort */
  }
}
