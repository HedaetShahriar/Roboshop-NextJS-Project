import { NextResponse } from 'next/server';
import getDb from '@/lib/mongodb';

export async function GET() {
  const db = await getDb();
  const doc = await db.collection('settings').findOne({ _id: 'platform' });
  const seo = doc?.seo || {};
  let body = (seo.robotsPolicy || '').trim();
  if (!body) {
    const base = (seo.canonicalBaseUrl || '').trim().replace(/\/$/, '');
    const sitemapLine = seo.generateSitemap && base ? `\nSitemap: ${base}/sitemap.xml` : '';
    body = `User-agent: *\nAllow: /${sitemapLine}`;
  }
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
