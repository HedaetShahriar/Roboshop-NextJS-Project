import { NextResponse } from 'next/server';
import getDb from '@/lib/mongodb';
import { CATEGORY_MAP } from '@/data/categories';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function xml(items) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    items.map(it => {
      const loc = esc(it.loc);
      const lastmod = it.lastmod ? `<lastmod>${new Date(it.lastmod).toISOString()}</lastmod>` : '';
      const changefreq = it.changefreq ? `<changefreq>${it.changefreq}</changefreq>` : '';
      const priority = typeof it.priority === 'number' ? `<priority>${it.priority.toFixed(1)}</priority>` : '';
      return `<url><loc>${loc}</loc>${lastmod}${changefreq}${priority}</url>`;
    }).join('') +
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
  // Build URLs: static + categories + products (non-hidden)
  const urls = new Map();
  const add = (loc, meta={}) => { urls.set(loc, { loc, ...meta }); };
  // Home and listing
  add(`${base}/`, { changefreq: 'daily', priority: 1.0 });
  add(`${base}/products`, { changefreq: 'daily', priority: 0.9 });

  // Categories (static source)
  for (const [cat, subs] of Object.entries(CATEGORY_MAP)) {
    const catSlug = encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'));
    add(`${base}/products?category=${catSlug}`, { changefreq: 'daily', priority: 0.7 });
    for (const sub of subs) {
      const subSlug = encodeURIComponent(sub.toLowerCase().replace(/\s+/g, '-'));
      add(`${base}/products?category=${catSlug}&subcategory=${subSlug}`, { changefreq: 'weekly', priority: 0.6 });
    }
  }

  // Products (from DB)
  const products = await db.collection('products').find(
    { $or: [ { is_hidden: { $exists: false } }, { is_hidden: false } ] },
    { projection: { _id: 1, updatedAt: 1, createdAt: 1 } }
  ).toArray();
  for (const p of products) {
    const last = p.updatedAt || p.createdAt || new Date();
    add(`${base}/products/${p._id.toString()}`, { lastmod: last, changefreq: 'weekly', priority: 0.8 });
  }
  const body = xml(Array.from(urls.values()));
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // cache aggressively at the edge; revalidate periodically server-side
      'Cache-Control': 'public, max-age=600, s-maxage=3600',
    },
  });
}

// Incremental revalidation hint for Next caches
export const revalidate = 3600; // seconds
