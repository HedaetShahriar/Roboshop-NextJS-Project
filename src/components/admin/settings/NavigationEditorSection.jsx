'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

function validateJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]');
    return Array.isArray(v);
  } catch {
    return false;
  }
}

export default function NavigationEditorSection({ defaultHeader = [], defaultFooter = [], defaultSocial = [], action }) {
  const [header, setHeader] = useState(() => JSON.stringify(defaultHeader, null, 2));
  const [footer, setFooter] = useState(() => JSON.stringify(defaultFooter, null, 2));
  const [social, setSocial] = useState(() => JSON.stringify(defaultSocial, null, 2));

  const headerOk = useMemo(() => validateJsonArray(header), [header]);
  const footerOk = useMemo(() => validateJsonArray(footer), [footer]);
  const socialOk = useMemo(() => validateJsonArray(social), [social]);
  const allOk = headerOk && footerOk && socialOk;

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Header links (JSON: [{'{'}label, href{'}'}])</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setHeader(JSON.stringify([{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }], null, 2))}>Sample</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setHeader(JSON.stringify(JSON.parse(header || '[]'), null, 2))} disabled={!headerOk}>Beautify</Button>
          </div>
        </div>
        <textarea name="headerLinks" className={`w-full border rounded px-2 py-1 h-24 ${headerOk ? '' : 'border-red-500'}`} value={header} onChange={(e) => setHeader(e.target.value)} />
        {!headerOk && <div className="text-red-600 text-xs mt-1">Invalid JSON array.</div>}
      </label>
      <label className="block">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Footer links (JSON: [{'{'}label, href{'}'}])</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setFooter(JSON.stringify([{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }], null, 2))}>Sample</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setFooter(JSON.stringify(JSON.parse(footer || '[]'), null, 2))} disabled={!footerOk}>Beautify</Button>
          </div>
        </div>
        <textarea name="footerLinks" className={`w-full border rounded px-2 py-1 h-24 ${footerOk ? '' : 'border-red-500'}`} value={footer} onChange={(e) => setFooter(e.target.value)} />
        {!footerOk && <div className="text-red-600 text-xs mt-1">Invalid JSON array.</div>}
      </label>
      <label className="block">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Social links (JSON: [{'{'}label, href, icon{'}'}])</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSocial(JSON.stringify([{ label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' }], null, 2))}>Sample</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setSocial(JSON.stringify(JSON.parse(social || '[]'), null, 2))} disabled={!socialOk}>Beautify</Button>
          </div>
        </div>
        <textarea name="socialLinks" className={`w-full border rounded px-2 py-1 h-24 ${socialOk ? '' : 'border-red-500'}`} value={social} onChange={(e) => setSocial(e.target.value)} />
        {!socialOk && <div className="text-red-600 text-xs mt-1">Invalid JSON array.</div>}
      </label>
      <Button type="submit" disabled={!allOk}>Save</Button>
    </form>
  );
}
