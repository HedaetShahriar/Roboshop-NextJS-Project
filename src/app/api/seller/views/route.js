import { getAuthedSession, ok, badRequest } from "@/lib/api";
import getDb from "@/lib/mongodb";

export async function GET() {
  const { error, session } = await getAuthedSession({ requireSeller: true });
  if (error) return error;
  const db = await getDb();
  const items = await db.collection('saved_views')
    .find({ userEmail: session.user.email, type: 'products' })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return ok({ items });
}

export async function POST(request) {
  const { error, session } = await getAuthedSession({ requireSeller: true });
  if (error) return error;
  const db = await getDb();
  const body = await request.json().catch(()=>({}));
  const name = (body?.name || '').toString().trim();
  const qs = (body?.qs || '').toString();
  if (!name) return badRequest('Name is required');
  const doc = { userEmail: session.user.email, type: 'products', name, qs, createdAt: new Date() };
  await db.collection('saved_views').insertOne(doc);
  return ok({ item: doc });
}
