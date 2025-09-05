import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import getDb from "@/lib/mongodb";
import BrandingPreview from "@/components/admin/settings/BrandingPreview";
import SectionNav from "@/components/admin/settings/SectionNav";
import NavigationEditorSection from "@/components/admin/settings/NavigationEditorSection";
import SectionJumpSelect from "@/components/admin/settings/SectionJumpSelect";
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
  robotsPolicy: '',
  canonicalBaseUrl: '',
  verification: { google: '', bing: '' },
  generateSitemap: true,
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
    performance: {
      prefetch: 'auto', // auto | viewport | off
      imageDomains: [],
    },
    security: {
      csp: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https:",
      corsOrigins: [],
    },
    commerce: {
      shippingFlatFee: 0,
      freeShippingThreshold: 0,
      taxRatePercent: 0,
      currencyCode: 'BDT',
      allowGuestCheckout: true,
      inventoryTracking: true,
      backorders: 'off', // off | allow | allow-with-warning
      orderPrefix: 'RS-',
      minOrderAmount: 0,
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
  shipmentUpdate: 'Your order {{number}} is on the way!',
  smtp: { host: '', port: 587, user: '', pass: '', from: '' },
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

async function saveSEOAdvanced(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const robotsPolicy = String(formData.get('robotsPolicy') || '');
  const canonicalBaseUrl = String(formData.get('canonicalBaseUrl') || '').trim();
  const google = String(formData.get('googleVerification') || '').trim();
  const bing = String(formData.get('bingVerification') || '').trim();
  const generateSitemap = formData.get('generateSitemap') === 'on' || formData.get('generateSitemap') === 'true';
  const prev = await getSettings();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { seo: { ...(prev?.seo || {}), robotsPolicy, canonicalBaseUrl, verification: { ...(prev?.seo?.verification || {}), google, bing }, generateSitemap } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#advanced-seo');
}

async function savePerformance(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const prefetch = String(formData.get('prefetch') || 'auto');
  const imageDomains = parseJsonArray(String(formData.get('imageDomains') || '[]')).map(String);
  const prev = await getSettings();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { performance: { ...(prev?.performance || {}), prefetch, imageDomains } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#performance');
}

async function saveSecurity(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const csp = String(formData.get('csp') || '');
  const corsOrigins = parseJsonArray(String(formData.get('corsOrigins') || '[]')).map(String);
  const prev = await getSettings();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { security: { ...(prev?.security || {}), csp, corsOrigins } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#security');
}

async function saveCheckoutAdvanced(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const allowGuestCheckout = formData.get('allowGuestCheckout') === 'on' || formData.get('allowGuestCheckout') === 'true';
  const inventoryTracking = formData.get('inventoryTracking') === 'on' || formData.get('inventoryTracking') === 'true';
  const backorders = String(formData.get('backorders') || 'off');
  const orderPrefix = String(formData.get('orderPrefix') || '').trim();
  const minOrderAmount = Math.max(0, parseFloat(String(formData.get('minOrderAmount') || '0')) || 0);
  const prev = await getSettings();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { commerce: { ...(prev?.commerce || {}), allowGuestCheckout, inventoryTracking, backorders, orderPrefix, minOrderAmount } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#checkout-advanced');
}

async function saveSMTP(formData) {
  'use server';
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') return;
  const host = String(formData.get('smtpHost') || '');
  const port = Math.max(1, parseInt(String(formData.get('smtpPort') || '587'), 10) || 587);
  const user = String(formData.get('smtpUser') || '');
  const pass = String(formData.get('smtpPass') || '');
  const from = String(formData.get('smtpFrom') || '');
  const prev = await getSettings();
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: 'platform' },
    { $set: { emails: { ...(prev?.emails || {}), smtp: { host, port, user, pass, from } } } },
    { upsert: true }
  );
  redirect('/dashboard/admin/settings#smtp');
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
  <SectionJumpSelect className="lg:hidden rounded-xl border bg-white p-3 shadow-sm" ids={["platform","branding","theme","homepage","seo","advanced-seo","navigation","payments","emails","smtp","analytics","performance","security","commerce","checkout-advanced","features"]} />
        <div className="hidden lg:block">
          <SectionNav sections={[
            { id: 'platform', label: 'Platform' },
            { id: 'branding', label: 'Branding' },
            { id: 'theme', label: 'Theme' },
            { id: 'homepage', label: 'Homepage' },
            { id: 'seo', label: 'SEO' },
            { id: 'advanced-seo', label: 'Advanced SEO' },
            { id: 'navigation', label: 'Navigation & Footer' },
            { id: 'payments', label: 'Payments' },
            { id: 'emails', label: 'Email Templates' },
            { id: 'smtp', label: 'SMTP' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'performance', label: 'Performance' },
            { id: 'security', label: 'Security' },
            { id: 'commerce', label: 'Shipping & Tax' },
            { id: 'checkout-advanced', label: 'Checkout & Orders' },
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
          <Card id="advanced-seo">
            <CardHeader>
              <CardTitle>Advanced SEO</CardTitle>
              <CardDescription>Robots, canonical base, verification and sitemap generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveSEOAdvanced} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="canonicalBaseUrl">Canonical base URL</Label>
                    <Input id="canonicalBaseUrl" name="canonicalBaseUrl" placeholder="https://www.example.com" defaultValue={settings?.seo?.canonicalBaseUrl || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="generateSitemap">Generate sitemap.xml</Label>
                    <div className="flex items-center gap-2"><input id="generateSitemap" name="generateSitemap" type="checkbox" defaultChecked={!!settings?.seo?.generateSitemap} /><span className="text-xs text-muted-foreground">Enable sitemap generation</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="googleVerification">Google verification</Label>
                    <Input id="googleVerification" name="googleVerification" defaultValue={settings?.seo?.verification?.google || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="bingVerification">Bing verification</Label>
                    <Input id="bingVerification" name="bingVerification" defaultValue={settings?.seo?.verification?.bing || ''} />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="robotsPolicy">robots.txt content</Label>
                  <textarea id="robotsPolicy" name="robotsPolicy" className="w-full border rounded px-3 py-2 h-36" placeholder="# Example
User-agent: *
Allow: /
Sitemap: https://www.example.com/sitemap.xml" defaultValue={settings?.seo?.robotsPolicy || ''} />
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
              <NavigationEditorSection
                action={saveNavigation}
                defaultHeader={settings?.navigation?.headerLinks || []}
                defaultFooter={settings?.navigation?.footerLinks || []}
                defaultSocial={settings?.navigation?.socialLinks || []}
              />
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
          <Card id="smtp">
            <CardHeader>
              <CardTitle>SMTP</CardTitle>
              <CardDescription>Transactional email provider settings (sensitive).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveSMTP} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="smtpHost">Host</Label>
                    <Input id="smtpHost" name="smtpHost" defaultValue={settings?.emails?.smtp?.host || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input id="smtpPort" name="smtpPort" type="number" min="1" defaultValue={settings?.emails?.smtp?.port ?? 587} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="smtpUser">User</Label>
                    <Input id="smtpUser" name="smtpUser" defaultValue={settings?.emails?.smtp?.user || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="smtpPass">Password</Label>
                    <Input id="smtpPass" name="smtpPass" type="password" defaultValue={settings?.emails?.smtp?.pass || ''} />
                  </div>
                  <div className="grid gap-1 md:col-span-2">
                    <Label htmlFor="smtpFrom">From address</Label>
                    <Input id="smtpFrom" name="smtpFrom" placeholder="Roboshop <no-reply@example.com>" defaultValue={settings?.emails?.smtp?.from || ''} />
                  </div>
                </div>
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
          <Card id="performance">
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Prefetch behavior and image domains (informational).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={savePerformance} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="prefetch">Link prefetch</Label>
                    <select id="prefetch" name="prefetch" className="w-full border rounded px-2 py-1" defaultValue={settings?.performance?.prefetch || 'auto'}>
                      <option value="auto">Auto</option>
                      <option value="viewport">Viewport</option>
                      <option value="off">Off</option>
                    </select>
                    <div className="text-xs text-muted-foreground">Controls default intent; wire to Link as needed.</div>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="imageDomains">Image domains (JSON array)</Label>
                    <textarea id="imageDomains" name="imageDomains" className="w-full border rounded px-3 py-2 h-24" defaultValue={JSON.stringify(settings?.performance?.imageDomains || [], null, 2)} />
                    <div className="text-xs text-muted-foreground">Changing domains requires next.config update on build.</div>
                  </div>
                </div>
                <Button type="submit">Save</Button>
              </form>
            </CardContent>
          </Card>
          <Card id="security">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>CSP header and CORS allow-list (stored only; wire via middleware to enforce).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveSecurity} className="space-y-3">
                <div className="grid gap-1">
                  <Label htmlFor="csp">Content-Security-Policy</Label>
                  <textarea id="csp" name="csp" className="w-full border rounded px-3 py-2 h-28" defaultValue={settings?.security?.csp || ''} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="corsOrigins">CORS origins (JSON array)</Label>
                  <textarea id="corsOrigins" name="corsOrigins" className="w-full border rounded px-3 py-2 h-24" defaultValue={JSON.stringify(settings?.security?.corsOrigins || [], null, 2)} />
                </div>
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
          <Card id="checkout-advanced">
            <CardHeader>
              <CardTitle>Checkout & Orders</CardTitle>
              <CardDescription>Guest checkout, inventory and order constraints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <form action={saveCheckoutAdvanced} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="allowGuestCheckout" defaultChecked={!!settings?.commerce?.allowGuestCheckout} />
                    <span>Allow guest checkout</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="inventoryTracking" defaultChecked={!!settings?.commerce?.inventoryTracking} />
                    <span>Enable inventory tracking</span>
                  </label>
                  <div className="grid gap-1">
                    <Label htmlFor="backorders">Backorders</Label>
                    <select id="backorders" name="backorders" className="w-full border rounded px-2 py-1" defaultValue={settings?.commerce?.backorders || 'off'}>
                      <option value="off">Off</option>
                      <option value="allow">Allow</option>
                      <option value="allow-with-warning">Allow with warning</option>
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="orderPrefix">Order number prefix</Label>
                    <Input id="orderPrefix" name="orderPrefix" defaultValue={settings?.commerce?.orderPrefix || ''} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="minOrderAmount">Minimum order amount</Label>
                    <Input id="minOrderAmount" name="minOrderAmount" type="number" min="0" step="0.01" defaultValue={settings?.commerce?.minOrderAmount ?? 0} />
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
