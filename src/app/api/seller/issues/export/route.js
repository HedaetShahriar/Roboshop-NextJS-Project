import getDb from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addIssuesAudit } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'customer';
    if (!session?.user?.email || (role !== 'seller' && role !== 'admin')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sp = Object.fromEntries(searchParams.entries());
    const search = (sp.search || sp.q || '').toString().trim();
    const status = (sp.status || '').toString().trim();
  const limitParam = Number(sp.limit ?? 20000);
    const limit = Math.min(20000, Math.max(100, isNaN(limitParam) ? 20000 : limitParam));
    const batchSize = 1000;
  const includeMessages = (sp.includeMessages === '1' || sp.includeMessages === 'true');
  const maxMsgs = 5; // cap number of messages per issue for export safety
  const maxMsgLen = 300; // truncate long messages

    const where = {};
    if (status && ['open','in_progress','resolved'].includes(status)) where.status = status;
    if (search) {
      where.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const db = await getDb();
    const projection = includeMessages
      ? { subject:1, orderNumber:1, status:1, category:1, createdAt:1, updatedAt:1, messages: { $slice: maxMsgs } }
      : { subject:1, orderNumber:1, status:1, category:1, createdAt:1, updatedAt:1 };

    const cursor = db.collection('order_issues')
      .find(where, { projection })
      .sort({ createdAt: -1 })
      .limit(limit)
      .batchSize(batchSize);

    const encoder = new TextEncoder();
    const headersRow = includeMessages
      ? ['Subject','OrderNumber','Status','Category','CreatedAt','UpdatedAt','Messages']
      : ['Subject','OrderNumber','Status','Category','CreatedAt','UpdatedAt'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(headersRow.map(esc).join(',') + "\r\n"));
          for await (const i of cursor) {
            const vals = [
              i.subject || '',
              i.orderNumber || '',
              i.status || '',
              i.category || '',
              i.createdAt ? new Date(i.createdAt).toISOString() : '',
              i.updatedAt ? new Date(i.updatedAt).toISOString() : '',
            ];
            if (includeMessages) {
              const joined = Array.isArray(i.messages) ? i.messages
                .slice(0, maxMsgs)
                .map(m => {
                  const who = (m?.by ?? '').toString().slice(0, 20);
                  const at = m?.at ? new Date(m.at).toISOString() : '';
                  const text = (m?.text ?? '').toString().slice(0, maxMsgLen).replace(/\s+/g, ' ').trim();
                  return `${who}: ${text} (${at})`;
                })
                .join(' | ') : '';
              vals.push(joined);
            }
            controller.enqueue(encoder.encode(vals.map(esc).join(',') + "\r\n"));
          }
        } catch (err) {
          try { await cursor.close(); } catch {}
          controller.error(err);
          return;
        }
        try { await cursor.close(); } catch {}
        controller.close();
      }
    });

    // Audit log (best effort)
    addIssuesAudit({
      userEmail: session.user.email,
      action: 'export',
      scope: 'filtered',
      filters: { search, status },
      params: { limit, includeMessages },
    }).catch(() => {});

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="order-issues.csv"',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    return new Response('Failed to export', { status: 500 });
  }
}
