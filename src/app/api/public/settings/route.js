import getDb from "@/lib/mongodb";

export const revalidate = 60; // cache for 1 minute

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('settings').findOne({ _id: 'platform' });
    const safe = {
      siteName: doc?.siteName || 'Roboshop',
      navigation: doc?.navigation || { headerLinks: [{ label: 'Products', href: '/products' }], footerLinks: [] },
      branding: { logoUrl: doc?.branding?.logoUrl || '' },
      theme: doc?.theme || null,
    };
    return new Response(JSON.stringify(safe), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ siteName: 'Roboshop' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
