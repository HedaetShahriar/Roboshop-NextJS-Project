import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import getDb from "@/lib/mongodb";

async function getSettings() {
  const db = await getDb();
  const doc = await db.collection('settings').findOne({ _id: 'platform' });
  return doc || { _id: 'platform', siteName: 'Roboshop', supportEmail: 'support@example.com', payments: { provider: 'Stripe', publicKey: '', secretKey: '' }, emails: { orderConfirmation: 'Thank you for your order, {{name}}!', shipmentUpdate: 'Your order {{number}} is on the way!' } };
}

async function savePlatform(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const siteName = String(formData.get('siteName') || '').trim();
  const supportEmail = String(formData.get('supportEmail') || '').trim();
  if (!siteName) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) return;
  const db = await getDb();
  await db.collection('settings').updateOne({ _id: 'platform' }, { $set: { siteName, supportEmail } }, { upsert: true });
  redirect('/dashboard/admin/settings');
}

async function savePayments(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const provider = String(formData.get('provider') || 'Stripe');
  const publicKey = String(formData.get('publicKey') || '');
  const secretKey = String(formData.get('secretKey') || '');
  if (!['Stripe','SSLCOMMERZ','Manual'].includes(provider)) return;
  const db = await getDb();
  await db.collection('settings').updateOne({ _id: 'platform' }, { $set: { payments: { provider, publicKey, secretKey } } }, { upsert: true });
  redirect('/dashboard/admin/settings#payments');
}

async function saveEmails(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const orderConfirmation = String(formData.get('orderConfirmation') || '').trim();
  const shipmentUpdate = String(formData.get('shipmentUpdate') || '').trim();
  if (!orderConfirmation || !shipmentUpdate) return;
  const db = await getDb();
  await db.collection('settings').updateOne({ _id: 'platform' }, { $set: { emails: { orderConfirmation, shipmentUpdate } } }, { upsert: true });
  redirect('/dashboard/admin/settings#emails');
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'customer';
  if (!session?.user?.email || role !== 'admin') return notFound();
  const settings = await getSettings();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-muted-foreground text-sm">Configure platform-wide settings and integrations.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li><a href="#platform" className="text-primary hover:underline">Platform</a></li>
              <li><a href="#payments" className="text-primary hover:underline">Payments</a></li>
              <li><a href="#emails" className="text-primary hover:underline">Email Templates</a></li>
            </ul>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <Card id="platform">
            <CardHeader>
              <CardTitle>Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={savePlatform} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Site name</span>
                    <input name="siteName" className="w-full border rounded px-2 py-1" defaultValue={settings.siteName} required />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Support email</span>
                    <input name="supportEmail" type="email" className="w-full border rounded px-2 py-1" defaultValue={settings.supportEmail} required />
                  </label>
                </div>
                <button type="submit" className="px-3 py-1 rounded bg-zinc-900 text-white">Save</button>
              </form>
            </CardContent>
          </Card>
          <Card id="payments">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={savePayments} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Provider</span>
                  <select name="provider" defaultValue={settings?.payments?.provider || 'Stripe'} className="w-full border rounded px-2 py-1">
                    <option>Stripe</option>
                    <option>SSLCOMMERZ</option>
                    <option>Manual</option>
                  </select>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Public key</span>
                    <input name="publicKey" className="w-full border rounded px-2 py-1" defaultValue={settings?.payments?.publicKey || ''} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Secret key</span>
                    <input name="secretKey" className="w-full border rounded px-2 py-1" type="password" defaultValue={settings?.payments?.secretKey || ''} />
                  </label>
                </div>
                <button type="submit" className="px-3 py-1 rounded bg-zinc-900 text-white">Save</button>
              </form>
            </CardContent>
          </Card>
          <Card id="emails">
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveEmails} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Order confirmation</span>
                  <textarea name="orderConfirmation" className="w-full border rounded px-2 py-1 h-28" defaultValue={settings?.emails?.orderConfirmation || ''} required />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Shipment update</span>
                  <textarea name="shipmentUpdate" className="w-full border rounded px-2 py-1 h-28" defaultValue={settings?.emails?.shipmentUpdate || ''} required />
                </label>
                <button type="submit" className="px-3 py-1 rounded bg-zinc-900 text-white">Save</button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
