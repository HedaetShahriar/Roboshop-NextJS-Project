import getDb from "./mongodb";

export async function addProductAudit({ userEmail, action, scope = 'single', ids = [], filters = {}, params = {} }) {
  try {
    const db = await getDb();
    const doc = {
      type: 'products',
      userEmail,
      action,
      scope,
      ids: Array.isArray(ids) ? ids.slice(0, 50) : [], // cap to avoid huge docs
      idsCount: Array.isArray(ids) ? ids.length : 0,
      filters,
      params,
      createdAt: new Date(),
    };
    await db.collection('audit_logs').insertOne(doc);
  } catch {
    // best effort; ignore failures
  }
}
