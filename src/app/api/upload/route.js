import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ ok: false, message: 'No file' }, { status: 400 });
    if (typeof file === 'string') return NextResponse.json({ ok: false, message: 'Invalid file' }, { status: 400 });

    const type = file.type || '';
    if (!type.startsWith('image/')) return NextResponse.json({ ok: false, message: 'Only images allowed' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 10);
    const extGuess = (() => {
      const fromName = (file.name || '').split('.').pop();
      if (fromName && fromName.length <= 5) return `.${fromName}`;
      const m = type.split('/')[1];
      return m ? `.${m}` : '.png';
    })();

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try { await fs.mkdir(uploadsDir, { recursive: true }); } catch {}

    const fileName = `${Date.now()}_${hash}${extGuess}`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);
    const url = `/uploads/${fileName}`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ ok: false, message: 'Upload failed' }, { status: 500 });
  }
}
