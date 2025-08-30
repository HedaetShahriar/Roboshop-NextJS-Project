"use client";

import { useActionState, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { CATEGORY_LIST, CATEGORY_MAP } from "@/data/categories";
import { formatBDT } from "@/lib/currency";
// Removed Card wrappers for a cleaner, compact surface
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import KeyValueEditor from "@/components/dashboard/KeyValueEditor";
import MarkdownEditor from "@/components/dashboard/MarkdownEditor";
import GalleryEditor from "@/components/dashboard/GalleryEditor";
import VariantsEditor from "@/components/dashboard/VariantsEditor";
import MarketsPricingEditor from "@/components/dashboard/MarketsPricingEditor";

export default function ClientEditForm({ product, action }) {
  const [result, formAction, pending] = useActionState(action, null);
  const [category, setCategory] = useState(product.category || "");
  const [subcategory, setSubcategory] = useState(product.subcategory || "");
  const [name, setName] = useState(product.name || "");
  const [slug, setSlug] = useState(product.slug || "");
  const [autoSlug, setAutoSlug] = useState(!(product.slug && product.slug.length > 0));
  const [imageUrl, setImageUrl] = useState(product.image || "");
  const [hasDiscount, setHasDiscount] = useState(!!product.has_discount_price);
  const [visibility, setVisibility] = useState(product.is_hidden ? '1' : '0');
  const [isDirty, setIsDirty] = useState(false);
  const initialRender = useRef(true);
  const [pricePreview, setPricePreview] = useState(formatBDT(Number(product.price || 0)));
  const [discountPreview, setDiscountPreview] = useState(product.has_discount_price && Number(product.discount_price) > 0 ? formatBDT(Number(product.discount_price)) : '—');
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true });
  const slugCheckTimeout = useRef(null);
  const priceRef = useRef(null);
  const discountRef = useRef(null);
  const [priceNum, setPriceNum] = useState(Number(product.price || 0));
  const [stock, setStock] = useState(Number(product.current_stock || 0));
  const [tab, setTab] = useState('basic');

  useEffect(() => {
    if (result == null) return;
    if (result?.ok) toast.success("Saved");
    else toast.error(result?.message || "Save failed");
  }, [result]);

  const categories = CATEGORY_LIST;
  const subs = useMemo(() => CATEGORY_MAP[category] || [], [category]);
  const subOptions = useMemo(() => {
    // Ensure current subcategory stays selectable if it isn't in the map
    if (!subcategory) return subs;
    return subs.includes(subcategory) ? subs : [subcategory, ...subs];
  }, [subs, subcategory]);

  const onCategoryChange = useCallback((e) => {
    const next = e.target.value;
    setCategory(next);
    // Reset subcategory when category changes
    setSubcategory("");
  }, []);

  const onSubcategoryChange = useCallback((e) => {
    setSubcategory(e.target.value);
  }, []);

  const handleSubmit = useCallback((e) => {
    // Client validation: if hasDiscount is checked, discount must be > 0 and < price
    const form = e.currentTarget;
    const hasDisc = form.hasDiscount?.checked;
    const price = Number(form.price?.value || 0);
    const discount = Number(form.discountPrice?.value || 0);
    if (hasDisc) {
      if (!(discount > 0) || !(price > 0) || discount >= price) {
        e.preventDefault();
        toast.error("Discount must be greater than 0 and less than price");
        return;
      }
    }
    // Allow submit: prevent unload prompt
    setIsDirty(false);
  }, []);

  // Mark dirty on any change (first render excluded)
  const onAnyChange = useCallback(() => {
    if (initialRender.current) return;
    setIsDirty(true);
  }, []);

  useEffect(() => {
    // Flip false after first paint so changes mark dirty
    initialRender.current = false;
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Slug generation from name when autoSlug
  const slugify = (s) => {
    return (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const onNameChange = useCallback((e) => {
    const v = e.target.value;
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  }, [autoSlug]);

  const onSlugChange = useCallback((e) => {
    const val = slugify(e.target.value);
    setSlug(val);
  }, []);

  const onToggleAutoSlug = useCallback(() => {
    setAutoSlug((prev) => {
      const next = !prev;
      if (next) setSlug(slugify(name));
      return next;
    });
  }, [name]);

  const onImageChange = useCallback((e) => {
    setImageUrl(e.target.value);
  }, []);

  const onHasDiscountChange = useCallback((e) => {
    setHasDiscount(e.target.checked);
  }, []);

  // Debounced slug uniqueness check
  useEffect(() => {
    if (!slug) {
      setSlugStatus({ checking: false, available: true });
      return;
    }
    setSlugStatus((s) => ({ ...s, checking: true }));
    if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
    slugCheckTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/seller/products/check-slug?slug=${encodeURIComponent(slug)}&excludeId=${encodeURIComponent(product._id)}`);
        const data = await res.json();
        setSlugStatus({ checking: false, available: !!data?.available });
      } catch {
        setSlugStatus({ checking: false, available: true });
      }
    }, 350);
    return () => {
      if (slugCheckTimeout.current) clearTimeout(slugCheckTimeout.current);
    };
  }, [slug, product._id]);

  // Inline price previews
  const onPriceInput = useCallback((e) => {
    const n = Number(e.target.value || 0);
    setPricePreview(formatBDT(n));
    setPriceNum(n);
  }, []);
  const onDiscountInput = useCallback((e) => {
    const n = Number(e.target.value || 0);
    setDiscountPreview(n > 0 ? formatBDT(n) : '—');
  }, []);

  // Quick discount presets
  const applyPercent = useCallback((pct) => {
    const price = priceRef.current ? Number(priceRef.current.value || 0) : priceNum;
    if (!(price > 0)) {
      toast.error('Enter a valid price first');
      return;
    }
    const factor = (100 - pct) / 100;
    const discounted = Math.max(0.01, Math.round((price * factor) * 100) / 100);
    if (discounted >= price) {
      toast.error('Discount must be less than price');
      return;
    }
    if (discountRef.current) {
      discountRef.current.value = String(discounted);
    }
    setHasDiscount(true);
    setDiscountPreview(formatBDT(discounted));
    setIsDirty(true);
  }, [priceNum]);
  const clearDiscountQuick = useCallback(() => {
    if (discountRef.current) discountRef.current.value = '0';
    setHasDiscount(false);
    setDiscountPreview('—');
    setIsDirty(true);
  }, []);
  const applyFixed = useCallback((value) => {
    const price = priceRef.current ? Number(priceRef.current.value || 0) : priceNum;
    const discounted = Number(value);
    if (!(price > 0)) {
      toast.error('Enter a valid price first');
      return;
    }
    if (!(discounted > 0) || discounted >= price) {
      toast.error('Discount must be greater than 0 and less than price');
      return;
    }
    if (discountRef.current) {
      discountRef.current.value = String(discounted);
    }
    setHasDiscount(true);
    setDiscountPreview(formatBDT(discounted));
    setIsDirty(true);
  }, [priceNum]);

  // Reset controlled state to initial product values
  const onReset = useCallback(() => {
    setCategory(product.category || "");
    setSubcategory(product.subcategory || "");
    setName(product.name || "");
    setSlug(product.slug || "");
    setAutoSlug(!(product.slug && product.slug.length > 0));
    setImageUrl(product.image || "");
    setHasDiscount(!!product.has_discount_price);
    setVisibility(product.is_hidden ? '1' : '0');
    const p = Number(product.price || 0);
    const d = Number(product.discount_price || 0);
    setPriceNum(p);
    setPricePreview(formatBDT(p));
    setDiscountPreview(!!product.has_discount_price && d > 0 ? formatBDT(d) : '—');
    if (priceRef.current) priceRef.current.value = String(p || 0);
    if (discountRef.current) discountRef.current.value = String(d || 0);
    setIsDirty(false);
  }, [product]);

  return (
  <form action={formAction} onSubmit={handleSubmit} onChange={onAnyChange} className="space-y-3 pb-16">
      <input type="hidden" name="id" value={product._id} />
      {/* Header: summary + actions */}
      <div className="rounded-md border bg-white p-3 md:p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-zinc-600">Editing product</div>
          <div className="text-sm font-medium truncate">{name || 'Product name'}</div>
          <div className="text-xs text-muted-foreground truncate">/{slug || 'slug'}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground hidden sm:block">{isDirty ? 'Unsaved changes' : 'Up to date'}</div>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={onReset}>Reset</Button>
          <Link href={`/dashboard/seller/products/${product._id}`}>
            <Button variant="outline" size="sm" className="h-8">Cancel</Button>
          </Link>
          <Button type="submit" size="sm" className="h-8" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-md border bg-white p-2">
        <div className="flex flex-wrap gap-1">
          {[
            ['basic','Basic'],
            ['pricing','Pricing'],
            ['media','Media'],
            ['details','Details'],
            ['variants','Variants'],
            ['markets','Markets']
          ].map(([id,label]) => (
            <button key={id} type="button" onClick={()=>setTab(id)} className={`${tab===id? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700'} h-8 px-3 rounded border text-xs`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'basic' && (
        <div className="rounded-md border bg-white p-3 md:p-4 space-y-3">
          {/* Preview */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-1 items-start">
            <div className="text-sm">
              <div className="font-medium truncate">{name || 'Product name'}</div>
              <div className="text-muted-foreground text-xs">/{slug || 'slug'}</div>
              <div className="mt-2 text-sm flex items-baseline gap-2">
                {hasDiscount && discountRef.current && Number(discountRef.current.value || 0) > 0 ? (
                  <>
                    <span className="text-rose-700 font-medium">{discountPreview}</span>
                    <span className="text-muted-foreground line-through">{pricePreview}</span>
                  </>
                ) : (
                  <span className="font-medium">{pricePreview}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{category || '—'}{subcategory ? ` • ${subcategory}` : ''}</div>
              <div className="text-xs mt-1">
                {visibility === '1' ? (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">Hidden</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Visible</span>
                )}
              </div>
              <div className="pt-2 flex items-center justify-between">
                <Link href={slug ? `/products/${slug}` : '#'} className="text-xs underline aria-disabled:opacity-50" aria-disabled={!slug}>
                  Open product page
                </Link>
                <span className="text-xs text-muted-foreground">Stock: {Number.isFinite(stock) ? stock : 0}</span>
              </div>
            </div>
            <div className="rounded border bg-zinc-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-24 object-cover rounded" onError={(e) => (e.currentTarget.style.opacity = '0.3')} />
              ) : (
                <div className="h-24 grid place-items-center text-muted-foreground text-xs">No image</div>
              )}
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="name" className="text-xs font-medium text-zinc-700">Name</Label>
              <Input id="name" name="name" value={name} onChange={onNameChange} required placeholder="e.g. IC 7410" className="h-8 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="sku" className="text-xs font-medium text-zinc-700">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku || ''} placeholder="Optional" className="h-8 text-sm" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label htmlFor="slug" className="text-xs font-medium text-zinc-700">Slug</Label>
              <div className="flex items-center gap-2">
                <Input id="slug" name="slug" value={slug} onChange={onSlugChange} placeholder="auto-generated from name" className="h-8 text-sm" />
                <Button type="button" onClick={onToggleAutoSlug} variant={autoSlug ? 'default' : 'outline'} size="sm" className="h-8 px-2 text-xs" aria-pressed={autoSlug} aria-label={autoSlug ? 'Auto-slug on' : 'Auto-slug off'}>
                  {autoSlug ? 'Auto' : 'Manual'}
                </Button>
              </div>
              <div className="text-[11px] mt-1" aria-live="polite">
                {slugStatus.checking ? (
                  <span className="text-muted-foreground">Checking…</span>
                ) : slug ? (
                  slugStatus.available ? <span className="text-emerald-700">Available</span> : <span className="text-rose-700">Already taken</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="border-t border-zinc-100 pt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="category" className="text-xs font-medium text-zinc-700">Category</Label>
              <select id="category" name="category" value={category} onChange={onCategoryChange} className="h-8 text-sm px-2 rounded border bg-white">
                <option value="">—</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="subcategory" className="text-xs font-medium text-zinc-700">Subcategory</Label>
              <select
                id="subcategory"
                name="subcategory"
                value={subcategory}
                onChange={onSubcategoryChange}
                disabled={!category}
                className="h-8 text-sm px-2 rounded border bg-white disabled:bg-zinc-50 disabled:text-muted-foreground"
              >
                <option value="">{category ? 'Select subcategory' : 'Select a category first'}</option>
                {subOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Inventory & Visibility */}
          <div className="border-t border-zinc-100 pt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="current_stock" className="text-xs font-medium text-zinc-700">Stock</Label>
              <Input id="current_stock" type="number" min="0" step="1" name="current_stock" value={stock} onChange={(e)=>setStock(Number(e.target.value || 0))} className="h-8 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="is_hidden" className="text-xs font-medium text-zinc-700">Visibility</Label>
              <select id="is_hidden" name="is_hidden" value={visibility} onChange={(e)=>setVisibility(e.target.value)} className="h-8 text-sm px-2 rounded border bg-white">
                <option value="0">Visible</option>
                <option value="1">Hidden</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'pricing' && (
        <div className="rounded-md border bg-white p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="price" className="text-xs font-medium text-zinc-700">Price</Label>
              <Input id="price" ref={priceRef} type="number" min="0.01" step="0.01" name="price" defaultValue={Number(product.price || 0)} onInput={onPriceInput} required className="h-8 text-sm" />
              <div className="text-[11px] text-muted-foreground">{pricePreview}</div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="discountPrice" className="text-xs font-medium text-zinc-700">Discount price</Label>
              <Input id="discountPrice" ref={discountRef} type="number" min="0" step="0.01" name="discountPrice" defaultValue={Number(product.discount_price || 0)} onInput={onDiscountInput} disabled={!hasDiscount} aria-disabled={!hasDiscount} className="h-8 text-sm disabled:opacity-60" />
              <div className="text-[11px] text-muted-foreground">{discountPreview}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                <span className="text-muted-foreground">Quick:</span>
                {[5,10,20,30].map((pct) => (
                  <Button key={pct} type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => applyPercent(pct)} aria-label={`Apply ${pct}% off`}>
                    {pct}%
                  </Button>
                ))}
                <span className="mx-1 text-muted-foreground">|</span>
                {[99,199,299,499].map((v) => (
                  <Button key={v} type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => applyFixed(v)} aria-label={`Set discount price to ${formatBDT(v)}`} title={`Set ${formatBDT(v)}`}>
                    {formatBDT(v)}
                  </Button>
                ))}
                <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px] text-rose-700" onClick={clearDiscountQuick} aria-label="Clear discount">Clear</Button>
              </div>
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="hasDiscount" checked={hasDiscount} onChange={onHasDiscountChange} />
              <span className="text-sm">Has discount</span>
            </label>
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div className="rounded-md border bg-white p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-1 items-start">
            <div className="flex flex-col gap-1">
              <Label htmlFor="image" className="text-xs font-medium text-zinc-700">Image URL</Label>
              <Input id="image" name="image" value={imageUrl} onChange={onImageChange} placeholder="https://…" className="h-8 text-sm" />
            </div>
            <div className="rounded border bg-zinc-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-24 object-cover rounded" onError={(e)=> (e.currentTarget.style.opacity='0.3')} />
              ) : (
                <div className="h-24 grid place-items-center text-muted-foreground text-xs">No image</div>
              )}
            </div>
          </div>
          <div className="mt-1">
            <GalleryEditor name="gallery" initial={product.gallery || []} />
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div className="rounded-md border bg-white p-3 md:p-4 space-y-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">Description</div>
            <div className="mt-1">
              <MarkdownEditor name="description" initial={product.description || ''} />
            </div>
          </div>
          <div className="border-t border-zinc-100 pt-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">Specifications</div>
            <div className="mt-1">
              <KeyValueEditor name="specs" initial={product.specs || []} label="Key/Value pairs" />
            </div>
          </div>
        </div>
      )}

      {tab === 'variants' && (
        <div className="rounded-md border bg-white p-3 md:p-4">
          <VariantsEditor name="variants" initial={product.variants || []} />
        </div>
      )}

      {tab === 'markets' && (
        <div className="rounded-md border bg-white p-3 md:p-4">
          <MarketsPricingEditor name="markets" initial={product.markets || []} />
        </div>
      )}
    </form>
  );
}
