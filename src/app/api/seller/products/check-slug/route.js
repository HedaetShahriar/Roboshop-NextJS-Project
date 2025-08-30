import getDb from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get('slug') || '').toString().trim();
    const excludeId = (searchParams.get('excludeId') || '').toString().trim();
    if (!slug) return new Response(JSON.stringify({ ok: false, message: 'Missing slug' }), { status: 400 });
    const db = await getDb();
    const q = excludeId ? { slug, _id: { $ne: new (await import('mongodb')).ObjectId(excludeId) } } : { slug };
    const existing = await db.collection('products').findOne(q, { projection: { _id: 1 } });
    const available = !existing;
    return new Response(JSON.stringify({ ok: true, available }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}
