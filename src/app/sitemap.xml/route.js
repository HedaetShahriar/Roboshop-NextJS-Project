import { NextResponse } from 'next/server';
import getDb from '@/lib/mongodb';

function xml(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    items.map(u => `<url><loc>${u}</loc></url>`).join('') +
    `</urlset>`;
}

export async function GET() {
  const db = await getDb();
  const doc = await db.collection('settings').findOne({ _id: 'platform' });
  const seo = doc?.seo || {};
  if (!seo.generateSitemap) {
    return new NextResponse('Sitemap disabled', { status: 404 });
  }
  const base = (seo.canonicalBaseUrl || '').trim().replace(/\/$/, '');
  if (!base) return new NextResponse('Missing canonical base URL', { status: 400 });
  // Minimal sitemap; extend with DB-backed URLs as needed
  const urls = [
    '/',
    '/products',
  ].map(p => `${base}${p}`);
  return new NextResponse(xml(urls), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
