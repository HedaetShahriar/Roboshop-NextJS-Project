import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import getDb from '@/lib/mongodb';

// Ensure Node.js runtime (Buffer, etc.)
export const runtime = 'nodejs';

// GET: Provide a simple XLSX template
export async function GET() {
  const XLSX = await import('xlsx/xlsx.mjs');
  const wsData = [[
    'name', 'sku', 'category', 'subcategory', 'description', 'image', 'price', 'has_discount_price', 'discount_price', 'current_stock'
  ], [
    'Arduino Uno R3', 'ARD-UNO-R3', 'Accessories', 'Cable', 'Short description', 'https://example.com/image.jpg', 1000, false, 0, 10
  ]];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="products_template.xlsx"'
    }
  });
}

// POST: Accept an uploaded .xlsx and import rows
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file) return NextResponse.json({ ok: false, error: 'No file uploaded' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const XLSX = await import('xlsx/xlsx.mjs');
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) return NextResponse.json({ ok: false, error: 'No rows found' }, { status: 400 });

    const db = await getDb();
    const docs = [];
    for (const r of rows) {
      const name = String(r.name || '').trim();
      const image = String(r.image || '').trim();
      const price = Number(r.price);
      const hasDiscount = r.has_discount_price === true || r.has_discount_price === 'true' || r.has_discount_price === 'on' || r.has_discount_price === 1;
      const discountPrice = Number(r.discount_price || 0);
      const currentStock = Number.isFinite(Number(r.current_stock)) ? Number(r.current_stock) : 0;
      const sku = String(r.sku || '').trim();
      const category = String(r.category || '').trim();
      const subcategory = String(r.subcategory || '').trim();
      const description = String(r.description || '').trim();

      if (!name || name.length < 3) continue;
      if (!image || !/^https?:\/\//i.test(image)) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      if (hasDiscount) {
        if (!Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= price) continue;
      }
      if (!Number.isInteger(currentStock) || currentStock < 0) continue;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      docs.push({
        name,
        slug,
        sku: sku || undefined,
        category: category || undefined,
        subcategory: subcategory || undefined,
        description: description || undefined,
        image,
        price,
        has_discount_price: !!hasDiscount,
        discount_price: hasDiscount ? discountPrice : 0,
        current_stock: currentStock,
        product_rating: 0,
        product_max_rating: 5,
        product_rating_count: 0,
        promotions: [],
        createdAt: new Date(),
      });
    }

    if (!docs.length) return NextResponse.json({ ok: false, error: 'No valid rows after validation' }, { status: 400 });

    const res = await db.collection('products').insertMany(docs);
    return NextResponse.json({ ok: true, inserted: res.insertedCount ?? docs.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'Failed to parse or import file' }, { status: 500 });
  }
}
