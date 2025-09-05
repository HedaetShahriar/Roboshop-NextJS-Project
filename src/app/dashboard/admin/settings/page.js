import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import getDb from "@/lib/mongodb";
import BrandingPreview from "@/components/admin/settings/BrandingPreview";
import SectionNav from "@/components/admin/settings/SectionNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function getSettings() {
  const db = await getDb();
  const doc = await db.collection('settings').findOne({ _id: 'platform' });
  return doc || {
    _id: 'platform',
    siteName: 'Roboshop',
    supportEmail: 'support@example.com',
    branding: {
      logoUrl: '',
      faviconUrl: '',
      footerLogoUrl: '',
    },
    theme: {
      primaryColor: '#0f172a',
      accentColor: '#22c55e',
      defaultMode: 'system', // light | dark | system
      density: 'comfortable', // compact | comfortable
    },
    homepage: {
      showHero: true,
      heroTitle: 'Your one-stop shop for robotics parts!',
      heroSubtitle: 'Quality components, fast delivery, unbeatable prices.',
      heroCtaText: 'Shop now',
      heroCtaHref: '/products',
      featuredCount: 8,
      onSaleCount: 8,
    },
    seo: {
      title: 'Roboshop',
      description: 'Your one-stop shop for robotics parts!',
      ogImageUrl: '',
      twitterHandle: '',
    },
    navigation: {
      headerLinks: [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ],
      footerLinks: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
      socialLinks: [
        { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
        { label: 'Twitter', href: 'https://x.com', icon: 'twitter' },
      ],
    },
    analytics: {
      provider: 'none', // none | gtag | plausible | umami
      measurementId: '',
    },
    commerce: {
      shippingFlatFee: 0,
      freeShippingThreshold: 0,
      taxRatePercent: 0,
      currencyCode: 'BDT',
    },
    features: {
      enableCoupons: true,
      enableReviews: true,
      enableWishlist: true,
      maintenanceMode: false,
      maintenanceMessage: 'We are performing scheduled maintenance. Please check back soon.',
    },
    payments: { provider: 'Stripe', publicKey: '', secretKey: '' },
    emails: {
      orderConfirmation: 'Thank you for your order, {{name}}!',
      shipmentUpdate: 'Your order {{number}} is on the way!'
    },
  };
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

async function saveBranding(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const logoUrl = String(formData.get('logoUrl') || '').trim();
  const faviconUrl = String(formData.get('faviconUrl') || '').trim();
  const footerLogoUrl = String(formData.get('footerLogoUrl') || '').trim();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { branding: { logoUrl, faviconUrl, footerLogoUrl } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#branding');
}

async function saveTheme(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const primaryColor = String(formData.get('primaryColor') || '#0f172a');
  const accentColor = String(formData.get('accentColor') || '#22c55e');
  const defaultMode = String(formData.get('defaultMode') || 'system');
  const density = String(formData.get('density') || 'comfortable');
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { theme: { primaryColor, accentColor, defaultMode, density } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#theme');
}

async function saveHomepage(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const showHero = formData.get('showHero') === 'on' || formData.get('showHero') === 'true';
  const heroTitle = String(formData.get('heroTitle') || '').trim();
  const heroSubtitle = String(formData.get('heroSubtitle') || '').trim();
  const heroCtaText = String(formData.get('heroCtaText') || '').trim();
  const heroCtaHref = String(formData.get('heroCtaHref') || '').trim();
  const featuredCount = Math.max(0, parseInt(String(formData.get('featuredCount') || '8'), 10) || 0);
  const onSaleCount = Math.max(0, parseInt(String(formData.get('onSaleCount') || '8'), 10) || 0);
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { homepage: { showHero, heroTitle, heroSubtitle, heroCtaText, heroCtaHref, featuredCount, onSaleCount } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#homepage');
}

async function saveSEO(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const ogImageUrl = String(formData.get('ogImageUrl') || '').trim();
  const twitterHandle = String(formData.get('twitterHandle') || '').trim();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { seo: { title, description, ogImageUrl, twitterHandle } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#seo');
}

function parseJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]');
    if (Array.isArray(v)) return v;
  } catch {}
  return [];
}

async function saveNavigation(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const headerLinks = parseJsonArray(String(formData.get('headerLinks') || '[]'));
  const footerLinks = parseJsonArray(String(formData.get('footerLinks') || '[]'));
  const socialLinks = parseJsonArray(String(formData.get('socialLinks') || '[]'));
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { navigation: { headerLinks, footerLinks, socialLinks } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#navigation');
}

async function saveAnalytics(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const provider = String(formData.get('provider') || 'none');
  const measurementId = String(formData.get('measurementId') || '');
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { analytics: { provider, measurementId } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#analytics');
}

async function saveCommerce(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const shippingFlatFee = Math.max(0, parseFloat(String(formData.get('shippingFlatFee') || '0')) || 0);
  const freeShippingThreshold = Math.max(0, parseFloat(String(formData.get('freeShippingThreshold') || '0')) || 0);
  const taxRatePercent = Math.max(0, parseFloat(String(formData.get('taxRatePercent') || '0')) || 0);
  const currencyCode = String(formData.get('currencyCode') || 'BDT').toUpperCase();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { commerce: { shippingFlatFee, freeShippingThreshold, taxRatePercent, currencyCode } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#commerce');
}

async function saveFeatures(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const enableCoupons = formData.get('enableCoupons') === 'on';
  const enableReviews = formData.get('enableReviews') === 'on';
  const enableWishlist = formData.get('enableWishlist') === 'on';
  const maintenanceMode = formData.get('maintenanceMode') === 'on';
  const maintenanceMessage = String(formData.get('maintenanceMessage') || '').trim();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { features: { enableCoupons, enableReviews, enableWishlist, maintenanceMode, maintenanceMessage } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#features');
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">Configure platform-wide settings and integrations.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        <div className="hidden lg:block">
          <SectionNav sections={[
            { id: 'platform', label: 'Platform' },
            { id: 'branding', label: 'Branding' },
            { id: 'theme', label: 'Theme' },
            { id: 'homepage', label: 'Homepage' },
            { id: 'seo', label: 'SEO' },
            { id: 'navigation', label: 'Navigation & Footer' },
            { id: 'payments', label: 'Payments' },
            { id: 'emails', label: 'Email Templates' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'commerce', label: 'Shipping & Tax' },
            { id: 'features', label: 'Features & Maintenance' },
          ]} />
        </div>
        <div className="space-y-6">
          <Card id="platform">
            <CardHeader>
              <CardTitle>Platform</CardTitle>
              <CardDescription>Basic site identity and support contact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={savePlatform} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="siteName">Site name</Label>
                    <Input id="siteName" name="siteName" defaultValue={settings.siteName} required />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="supportEmail">Support email</Label>
                    <Input id="supportEmail" name="supportEmail" type="email" defaultValue={settings.supportEmail} required />
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="branding">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Manage your brand assets used in the header, footer, and browser tab.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveBranding} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="branding-logo-url">Logo URL</Label>
                    <Input id="branding-logo-url" name="logoUrl" defaultValue={settings?.branding?.logoUrl || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="branding-favicon-url">Favicon URL</Label>
                    <Input id="branding-favicon-url" name="faviconUrl" defaultValue={settings?.branding?.faviconUrl || ''} />
                  </div>
                  <div className="grid gap-1 md:col-span-2">
                    <Label htmlFor="branding-footer-logo-url">Footer Logo URL</Label>
                    <Input id="branding-footer-logo-url" name="footerLogoUrl" defaultValue={settings?.branding?.footerLogoUrl || ''} />
                  </div>
                </div>
                <BrandingPreview
                  logoInputId="branding-logo-url"
                  footerLogoInputId="branding-footer-logo-url"
                  faviconInputId="branding-favicon-url"
                  initialLogo={settings?.branding?.logoUrl || ''}
                  initialFooterLogo={settings?.branding?.footerLogoUrl || ''}
                  initialFavicon={settings?.branding?.faviconUrl || ''}
                />
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="theme">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose brand colors and defaults for the UI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveTheme} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="primaryColor">Primary color</Label>
                    <Input id="primaryColor" name="primaryColor" type="color" className="h-10" defaultValue={settings?.theme?.primaryColor || '#0f172a'} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="accentColor">Accent color</Label>
                    <Input id="accentColor" name="accentColor" type="color" className="h-10" defaultValue={settings?.theme?.accentColor || '#22c55e'} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="defaultMode">Default mode</Label>
                    <select id="defaultMode" name="defaultMode" className="w-full border rounded px-2 py-1" defaultValue={settings?.theme?.defaultMode || 'system'}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="density">Density</Label>
                    <select id="density" name="density" className="w-full border rounded px-2 py-1" defaultValue={settings?.theme?.density || 'comfortable'}>
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                    </select>
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="homepage">
            <CardHeader>
              <CardTitle>Homepage</CardTitle>
              <CardDescription>Control the hero and featured sections content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveHomepage} className="space-y-3">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="showHero" defaultChecked={!!settings?.homepage?.showHero} />
                  <span>Show hero section</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1 md:col-span-2">
                    <Label htmlFor="heroTitle">Hero title</Label>
                    <Input id="heroTitle" name="heroTitle" defaultValue={settings?.homepage?.heroTitle || ''} />
                  </div>
                  <div className="grid gap-1 md:col-span-2">
                    <Label htmlFor="heroSubtitle">Hero subtitle</Label>
                    <Input id="heroSubtitle" name="heroSubtitle" defaultValue={settings?.homepage?.heroSubtitle || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="heroCtaText">Hero CTA text</Label>
                    <Input id="heroCtaText" name="heroCtaText" defaultValue={settings?.homepage?.heroCtaText || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="heroCtaHref">Hero CTA href</Label>
                    <Input id="heroCtaHref" name="heroCtaHref" defaultValue={settings?.homepage?.heroCtaHref || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="featuredCount">Featured products count</Label>
                    <Input id="featuredCount" name="featuredCount" type="number" min="0" defaultValue={settings?.homepage?.featuredCount ?? 8} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="onSaleCount">On sale products count</Label>
                    <Input id="onSaleCount" name="onSaleCount" type="number" min="0" defaultValue={settings?.homepage?.onSaleCount ?? 8} />
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="seo">
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Defaults used for pages that don’t override metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveSEO} className="space-y-3">
                <div className="grid gap-1">
                  <Label htmlFor="seoTitle">Default title</Label>
                  <Input id="seoTitle" name="title" defaultValue={settings?.seo?.title || ''} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="seoDescription">Default description</Label>
                  <textarea id="seoDescription" name="description" className="w-full border rounded px-3 py-2 h-24" defaultValue={settings?.seo?.description || ''} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="ogImageUrl">Open Graph (OG) image URL</Label>
                    <Input id="ogImageUrl" name="ogImageUrl" defaultValue={settings?.seo?.ogImageUrl || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="twitterHandle">Twitter handle</Label>
                    <Input id="twitterHandle" name="twitterHandle" defaultValue={settings?.seo?.twitterHandle || ''} />
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="navigation">
            <CardHeader>
              <CardTitle>Navigation & Footer</CardTitle>
              <CardDescription>Edit header, footer and social links using simple JSON arrays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveNavigation} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Header links (JSON: [{`{`}label, href{`}`}])</span>
                  <textarea name="headerLinks" className="w-full border rounded px-2 py-1 h-24" defaultValue={JSON.stringify(settings?.navigation?.headerLinks || [], null, 2)} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Footer links (JSON: [{`{`}label, href{`}`}])</span>
                  <textarea name="footerLinks" className="w-full border rounded px-2 py-1 h-24" defaultValue={JSON.stringify(settings?.navigation?.footerLinks || [], null, 2)} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Social links (JSON: [{`{`}label, href, icon{`}`}])</span>
                  <textarea name="socialLinks" className="w-full border rounded px-2 py-1 h-24" defaultValue={JSON.stringify(settings?.navigation?.socialLinks || [], null, 2)} />
                </label>
                <Button type="submit">Save</Button>
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
                 <Button type="submit">Save</Button>
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
                 <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="analytics">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Configure tracking provider for traffic insights.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveAnalytics} className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Provider</span>
                  <select name="provider" className="w-full border rounded px-2 py-1" defaultValue={settings?.analytics?.provider || 'none'}>
                    <option value="none">None</option>
                    <option value="gtag">Google Analytics (gtag)</option>
                    <option value="plausible">Plausible</option>
                    <option value="umami">Umami</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Measurement ID / Site ID</span>
                  <input name="measurementId" className="w-full border rounded px-2 py-1" defaultValue={settings?.analytics?.measurementId || ''} />
                </label>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="commerce">
            <CardHeader>
              <CardTitle>Shipping & Tax</CardTitle>
              <CardDescription>Set up shipping fees, free shipping threshold and tax rate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveCommerce} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="shippingFlatFee">Flat shipping fee</Label>
                    <Input id="shippingFlatFee" name="shippingFlatFee" type="number" min="0" step="0.01" defaultValue={settings?.commerce?.shippingFlatFee ?? 0} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="freeShippingThreshold">Free shipping threshold</Label>
                    <Input id="freeShippingThreshold" name="freeShippingThreshold" type="number" min="0" step="0.01" defaultValue={settings?.commerce?.freeShippingThreshold ?? 0} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="taxRatePercent">Tax rate (%)</Label>
                    <Input id="taxRatePercent" name="taxRatePercent" type="number" min="0" step="0.01" defaultValue={settings?.commerce?.taxRatePercent ?? 0} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="currencyCode">Currency code</Label>
                    <Input id="currencyCode" name="currencyCode" className="uppercase" defaultValue={settings?.commerce?.currencyCode || 'BDT'} />
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="features">
            <CardHeader>
              <CardTitle>Features & Maintenance</CardTitle>
              <CardDescription>Toggle optional features and set maintenance mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveFeatures} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="enableCoupons" defaultChecked={!!settings?.features?.enableCoupons} />
                    <span>Enable coupons</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="enableReviews" defaultChecked={!!settings?.features?.enableReviews} />
                    <span>Enable reviews</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="enableWishlist" defaultChecked={!!settings?.features?.enableWishlist} />
                    <span>Enable wishlist</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="maintenanceMode" defaultChecked={!!settings?.features?.maintenanceMode} />
                    <span>Maintenance mode</span>
                  </label>
                  <div className="grid gap-1 md:col-span-2">
                    <Label htmlFor="maintenanceMessage">Maintenance message</Label>
                    <Input id="maintenanceMessage" name="maintenanceMessage" defaultValue={settings?.features?.maintenanceMessage || ''} />
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
