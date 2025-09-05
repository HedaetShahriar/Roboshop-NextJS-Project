'use client';

import { useEffect, useState } from 'react';

export default function BrandingPreview({
  logoInputId,
  footerLogoInputId,
  faviconInputId,
  initialLogo = '',
  initialFooterLogo = '',
  initialFavicon = '',
}) {
  const [logo, setLogo] = useState(initialLogo);
  const [footerLogo, setFooterLogo] = useState(initialFooterLogo);
  const [favicon, setFavicon] = useState(initialFavicon);

  useEffect(() => {
    const logoEl = document.getElementById(logoInputId);
    const footEl = document.getElementById(footerLogoInputId);
    const favEl = document.getElementById(faviconInputId);

    function onLogo() { setLogo(logoEl?.value || ''); }
    function onFoot() { setFooterLogo(footEl?.value || ''); }
    function onFav() { setFavicon(favEl?.value || ''); }

    logoEl?.addEventListener('input', onLogo);
    footEl?.addEventListener('input', onFoot);
    favEl?.addEventListener('input', onFav);
    return () => {
      logoEl?.removeEventListener('input', onLogo);
      footEl?.removeEventListener('input', onFoot);
      favEl?.removeEventListener('input', onFav);
    };
  }, [logoInputId, footerLogoInputId, faviconInputId]);

  return (
    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded p-3 bg-white">
        <div className="text-xs text-muted-foreground mb-2">Navbar Logo preview</div>
        <div className="flex items-center justify-center h-20 border rounded bg-zinc-50">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Logo preview" className="max-h-16 w-auto" />
          ) : (
            <span className="text-xs text-zinc-500">No logo</span>
          )}
        </div>
      </div>
      <div className="border rounded p-3 bg-white">
        <div className="text-xs text-muted-foreground mb-2">Footer Logo preview</div>
        <div className="flex items-center justify-center h-20 border rounded bg-zinc-50">
          {footerLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={footerLogo} alt="Footer logo preview" className="max-h-16 w-auto" />
          ) : (
            <span className="text-xs text-zinc-500">No footer logo</span>
          )}
        </div>
      </div>
      <div className="border rounded p-3 bg-white">
        <div className="text-xs text-muted-foreground mb-2">Favicon preview</div>
        <div className="flex items-center justify-center h-20 border rounded bg-zinc-50">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={favicon} alt="Favicon preview" className="h-8 w-8" />
          ) : (
            <span className="text-xs text-zinc-500">No favicon</span>
          )}
        </div>
      </div>
    </div>
  );
}
