"use client";

import { useActionState, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { CATEGORY_LIST, CATEGORY_MAP } from "@/data/categories";
import { formatBDT } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import KeyValueEditor from "@/components/dashboard/KeyValueEditor";
import MarkdownEditor from "@/components/dashboard/MarkdownEditor";
import GalleryEditor from "@/components/dashboard/GalleryEditor";
import VariantsEditor from "@/components/dashboard/VariantsEditor";
import MarketsPricingEditor from "@/components/dashboard/MarketsPricingEditor";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";

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
  const [pricePreview, setPricePreview] = useState(formatBDT(Number(product.price || 0)));
  const [discountPreview, setDiscountPreview] = useState(product.has_discount_price && Number(product.discount_price) > 0 ? formatBDT(Number(product.discount_price)) : '—');
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true });
  const slugCheckTimeout = useRef(null);
  const priceRef = useRef(null);
  const discountRef = useRef(null);
  const [priceNum, setPriceNum] = useState(Number(product.price || 0));
  const [stock, setStock] = useState(Number(product.current_stock || 0));
  const [tab, setTab] = useState('basic');
  const [discountMode, setDiscountMode] = useState(product.has_discount_price ? 'price' : 'none');
  const [percentVal, setPercentVal] = useState(10);
  const [variantSummary, setVariantSummary] = useState({ totalStock: 0, dupSkus: [] });

  useEffect(() => {
    if (result == null) return;
    if (result?.ok) toast.success("Saved");
    else toast.error(result?.message || "Save failed");
  }, [result]);

  const categories = CATEGORY_LIST;
  const subOptions = useMemo(() => CATEGORY_MAP[category] || [], [category]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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

  const onAnyChange = useCallback(() => setIsDirty(true), []);

  const onNameChange = useCallback((e) => {
    const v = e.target.value;
    setName(v);
    if (autoSlug) setSlug(slugify(v));
    setIsDirty(true);
  }, [autoSlug]);

  const onSlugChange = useCallback((e) => {
    setSlug(e.target.value);
    setAutoSlug(false);
    setIsDirty(true);
  }, []);

  const onToggleAutoSlug = useCallback(() => {
    setAutoSlug((prev) => {
      const next = !prev;
      if (next) setSlug(slugify(name));
      return next;
    });
  }, [name]);

  const onCategoryChange = useCallback((e) => {
    setCategory(e.target.value);
    setSubcategory("");
    setIsDirty(true);
  }, []);

  const onSubcategoryChange = useCallback((e) => {
    setSubcategory(e.target.value);
    setIsDirty(true);
  }, []);

  const onImageChange = useCallback((e) => {
    setImageUrl(e.target.value);
    setIsDirty(true);
  }, []);

  const onHasDiscountChange = useCallback((e) => {
    setHasDiscount(e.target.checked);
    setIsDirty(true);
  }, []);

  useEffect(() => {
    setHasDiscount(discountMode !== 'none');
    const price = priceRef.current ? Number(priceRef.current.value || 0) : priceNum;
    if (discountMode === 'none') {
      if (discountRef.current) discountRef.current.value = '0';
      setDiscountPreview('—');
    }
    if (discountMode === 'percent') {
      const pct = Number(percentVal) || 0;
      const factor = (100 - pct) / 100;
      const discounted = price > 0 ? Math.max(0.01, Math.round(price * factor * 100) / 100) : 0;
      if (discountRef.current) discountRef.current.value = String(discounted || 0);
      setDiscountPreview(discounted > 0 ? formatBDT(discounted) : '—');
    }
  }, [discountMode, percentVal, priceNum]);

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

  const onPriceInput = useCallback((e) => {
    const n = Number(e.target.value || 0);
    setPricePreview(formatBDT(n));
    setPriceNum(n);
  }, []);
  const onDiscountInput = useCallback((e) => {
    const n = Number(e.target.value || 0);
    setDiscountPreview(n > 0 ? formatBDT(n) : '—');
  }, []);

  const applyPercent = useCallback((pct) => {
    const price = priceRef.current ? Number(priceRef.current.value || 0) : priceNum;
    if (!(price > 0)) {
      toast.error('Enter a valid price first');
      return;
    }
    const factor = (100 - pct) / 100;
    const discounted = Math.max(0.01, Math.round((price * factor) * 100) / 100);
    if (discountRef.current) {
      discountRef.current.value = String(discounted);
    }
    setDiscountMode('percent');
    setPercentVal(pct);
    setDiscountPreview(formatBDT(discounted));
    setIsDirty(true);
  }, [priceNum]);

  const clearDiscountQuick = useCallback(() => {
    setDiscountMode('none');
    setHasDiscount(false);
    if (discountRef.current) discountRef.current.value = '0';
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
    setDiscountMode('price');
    setDiscountPreview(formatBDT(discounted));
    setIsDirty(true);
  }, [priceNum]);

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

  const handleSubmit = useCallback(() => {
    const price = priceRef.current ? Number(priceRef.current.value || 0) : priceNum;
    if (discountMode === 'percent') {
      const pct = Number(percentVal) || 0;
      const factor = (100 - pct) / 100;
      const discounted = price > 0 ? Math.max(0.01, Math.round(price * factor * 100) / 100) : 0;
      if (discountRef.current) discountRef.current.value = String(discounted || 0);
    }
    if (discountMode === 'none') {
      if (discountRef.current) discountRef.current.value = '0';
    }
    setIsDirty(false);
  }, [priceNum, discountMode, percentVal]);

  const TABS = useMemo(() => ([
    ['basic','Basic'],
    ['media','Media'],
    ['details','Details'],
    ['variants','Variants'],
    ['markets','Markets']
  ]), []);

  const onTabKeyDown = useCallback((e, idx) => {
    const key = e.key;
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(key)) return;
    e.preventDefault();
    const len = TABS.length;
    if (key === 'Home') { setTab(TABS[0][0]); return; }
    if (key === 'End') { setTab(TABS[len-1][0]); return; }
    const delta = key === 'ArrowRight' ? 1 : -1;
    const next = (idx + delta + len) % len;
    setTab(TABS[next][0]);
  }, [TABS]);

  // Header price/discount computed preview
  const headerPrice = priceRef.current ? Number(priceRef.current.value || 0) : priceNum;
  const headerDisc = discountRef.current ? Number(discountRef.current.value || 0) : 0;
  const headerPct = headerDisc > 0 && headerPrice > 0 ? Math.round((1 - headerDisc / headerPrice) * 100) : null;

  const BLUR = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  return (
    <form action={formAction} onSubmit={handleSubmit} onChange={onAnyChange} className="space-y-2 pb-6" aria-busy={pending}>
      <input type="hidden" name="id" value={product._id} />
      <div className="rounded-md border bg-white p-2 md:p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-zinc-600">Editing product</div>
          <div className="text-[13px] font-medium truncate">{name || 'Product name'}</div>
          <div className="text-[11px] text-muted-foreground truncate">/{slug || 'slug'}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <div className="text-[10px] text-muted-foreground" aria-live="polite">{isDirty ? 'Unsaved' : 'Saved'}</div>
            <div className="text-[10px] text-muted-foreground" aria-live="polite">
              {headerPct !== null ? (
                <span>-{headerPct}% → {formatBDT(headerDisc)} (was {formatBDT(headerPrice)})</span>
              ) : (
                <span>Price: {formatBDT(headerPrice)}</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground" aria-live="polite">
              Stock (variants): <span className="text-zinc-900 font-medium">{variantSummary.totalStock}</span>
              {variantSummary.dupSkus?.length ? (
                <span className="ml-2 text-rose-700">Duplicates: {variantSummary.dupSkus.length}</span>
              ) : null}
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={onReset}>Reset</Button>
          <Link href={`/dashboard/seller/products/${product._id}`}>
            <Button variant="outline" size="sm" className="h-7 px-2">Cancel</Button>
          </Link>
          <Button type="submit" size="sm" className="h-7 px-3" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      <div className="rounded-md border bg-white p-1" role="tablist" aria-label="Edit sections">
        <div className="flex flex-wrap gap-1">
          {TABS.map(([id,label], idx) => (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab===id}
              aria-controls={`panel-${id}`}
              tabIndex={tab===id? 0 : -1}
              onKeyDown={(e)=>onTabKeyDown(e, idx)}
              onClick={()=>setTab(id)}
              className={`${tab===id? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700'} h-7 px-2 rounded border text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1`}
            >{label}</button>
          ))}
        </div>
      </div>

      {tab === 'basic' && (
        <div id="panel-basic" role="tabpanel" aria-labelledby="tab-basic" className="rounded-md border bg-white p-2 md:p-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div>
              <Accordion type="single" collapsible defaultValue="image">
                <AccordionItem value="image" className="border-none">
                  <AccordionTrigger>Product Image</AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-md border bg-zinc-50 p-2">
                      {imageUrl ? (
                        <div className="relative h-40 md:h-44 w-full">
                          <Image src={imageUrl} alt="Preview" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover rounded" placeholder="blur" blurDataURL={BLUR} />
                        </div>
                      ) : (
                        <div className="h-40 md:h-44 grid place-items-center text-muted-foreground text-xs">No image</div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {Array.from(new Set([imageUrl, ...((product.gallery||[]).filter(Boolean))]))
                        .filter(Boolean)
                        .slice(0,4)
                        .map((url)=> (
                        <button key={url} type="button" className={`w-14 h-14 rounded-md border overflow-hidden ${imageUrl===url? 'ring-2 ring-zinc-900' : ''}`} onClick={()=>setImageUrl(url)} aria-label="Set as thumbnail">
                          <Image src={url} alt="thumb" width={56} height={56} className="w-full h-full object-cover" placeholder="blur" blurDataURL={BLUR} />
                        </button>
                      ))}
                      <button type="button" onClick={()=>setTab('media')} className="w-14 h-14 rounded-md border border-dashed text-xl text-zinc-400 grid place-items-center hover:text-zinc-600" aria-label="Manage gallery">+</button>
                    </div>
                    <div className="mt-2 flex flex-col gap-1">
                      <Label htmlFor="image" className="text-xs font-medium text-zinc-700">Image URL</Label>
                      <Input id="image" name="image" value={imageUrl} onChange={onImageChange} placeholder="https://…" className="h-8 text-sm" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="space-y-2">
              <Accordion type="multiple" defaultValue={["detail","pricing"]}>
                <AccordionItem value="detail">
                  <AccordionTrigger>Product Detail</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <Label htmlFor="name" className="text-xs font-medium text-zinc-700">Product Name</Label>
                        <Input id="name" name="name" value={name} onChange={onNameChange} required placeholder="e.g. IC 7410" className="h-8 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <Label htmlFor="slug" className="text-xs font-medium text-zinc-700">Slug</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="slug"
                            name="slug"
                            value={slug}
                            onChange={onSlugChange}
                            placeholder="auto-generated from name"
                            className="h-8 text-sm"
                            aria-invalid={!slugStatus.checking && !!slug && !slugStatus.available ? true : undefined}
                            aria-describedby="slugHelp"
                          />
                          <Button type="button" onClick={onToggleAutoSlug} variant={autoSlug ? 'default' : 'outline'} size="sm" className="h-7 px-2 text-[11px]" aria-pressed={autoSlug} aria-label={autoSlug ? 'Auto-slug on' : 'Auto-slug off'}>
                            {autoSlug ? 'Auto' : 'Manual'}
                          </Button>
                        </div>
                        <div id="slugHelp" className="text-[11px] mt-1" aria-live="polite">
                          {slugStatus.checking ? (
                            <span className="text-muted-foreground">Checking…</span>
                          ) : slug ? (
                            slugStatus.available ? <span className="text-emerald-700">Available</span> : <span className="text-rose-700">Already taken</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="sku" className="text-xs font-medium text-zinc-700">SKU</Label>
                        <Input id="sku" name="sku" defaultValue={product.sku || ''} placeholder="Optional" className="h-8 text-sm" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="category">
                  <AccordionTrigger>Category</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pricing">
                  <AccordionTrigger>Price & Discount</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="price" className="text-xs font-medium text-zinc-700">Base price</Label>
                        <Input id="price" ref={priceRef} type="number" min="0.01" step="0.01" name="price" defaultValue={Number(product.price || 0)} onInput={onPriceInput} required className="h-8 text-sm" />
                        <div className="text-[11px] text-muted-foreground">{pricePreview}</div>
                        {discountMode === 'percent' && priceNum > 0 && (
                          <div className="text-[11px] text-emerald-700">-{percentVal}% =&gt; {discountPreview}</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs font-medium text-zinc-700">Price & Discount</Label>
                        <div className="grid grid-cols-3 gap-1" role="tablist" aria-label="Discount mode">
                          <button type="button" role="tab" aria-selected={discountMode==='none'} onClick={()=>setDiscountMode('none')} className={`h-7 rounded border text-[11px] ${discountMode==='none'?'bg-zinc-900 text-white':'bg-white text-zinc-700'}`}>No discount</button>
                          <button type="button" role="tab" aria-selected={discountMode==='percent'} onClick={()=>setDiscountMode('percent')} className={`h-7 rounded border text-[11px] ${discountMode==='percent'?'bg-zinc-900 text-white':'bg-white text-zinc-700'}`}>Percentage %</button>
                          <button type="button" role="tab" aria-selected={discountMode==='price'} onClick={()=>setDiscountMode('price')} className={`h-7 rounded border text-[11px] ${discountMode==='price'?'bg-zinc-900 text-white':'bg-white text-zinc-700'}`}>Discount price</button>
                        </div>
                        <input type="checkbox" name="hasDiscount" className="hidden" checked={hasDiscount} onChange={onHasDiscountChange} readOnly />
                        {discountMode === 'percent' && (
                          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="percentVal" className="text-xs font-medium text-zinc-700">Percent off</Label>
                              <Input id="percentVal" type="number" min="1" max="95" step="1" value={percentVal} onChange={(e)=>setPercentVal(Number(e.target.value||0))} className="h-8 text-sm" />
                              <div className="text-[11px] text-muted-foreground">Discounted: {discountPreview}</div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[5,10,20,30].map(p => (
                                <Button key={p} type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={()=>setPercentVal(p)}>{p}%</Button>
                              ))}
                            </div>
                            <input type="hidden" name="discountPrice" ref={discountRef} defaultValue={Number(product.discount_price || 0)} />
                          </div>
                        )}
                        {discountMode === 'price' && (
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="discountPrice" className="text-xs font-medium text-zinc-700">Discount price</Label>
                            <Input id="discountPrice" ref={discountRef} type="number" min="0" step="0.01" name="discountPrice" defaultValue={Number(product.discount_price || 0)} onInput={onDiscountInput} className="h-8 text-sm" />
                            <div className="text-[11px] text-muted-foreground">{discountPreview}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                              {[199,299,499].map((v) => (
                                <Button key={v} type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => applyFixed(v)} title={`Set ${formatBDT(v)}`}>{formatBDT(v)}</Button>
                              ))}
                              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px] text-rose-700" onClick={clearDiscountQuick}>Clear</Button>
                            </div>
                          </div>
                        )}
                        {discountMode === 'none' && (
                          <div className="text-[11px] text-muted-foreground">No discount; customers see the base price.</div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="inventory">
                  <AccordionTrigger>Inventory & Status</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="current_stock" className="text-xs font-medium text-zinc-700">Stock</Label>
                        <Input id="current_stock" type="number" min="0" step="1" name="current_stock" value={stock} onChange={(e)=>setStock(Number(e.target.value || 0))} className="h-8 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="is_hidden" className="text-xs font-medium text-zinc-700">Status</Label>
                        <select id="is_hidden" name="is_hidden" value={visibility} onChange={(e)=>setVisibility(e.target.value)} className="h-8 text-sm px-2 rounded border bg-white">
                          <option value="0">Published</option>
                          <option value="1">Hidden</option>
                        </select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <Link href={slug ? `/products/${slug}` : '#'} className="underline aria-disabled:opacity-50" aria-disabled={!slug}>Open product page</Link>
                <span className="text-muted-foreground">Preview: {hasDiscount && discountRef.current && Number(discountRef.current.value || 0) > 0 ? `${discountPreview} (was ${pricePreview})` : pricePreview}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div id="panel-media" role="tabpanel" aria-labelledby="tab-media" className="rounded-md border bg-white p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-1 items-start">
            <div className="flex flex-col gap-1">
              <Label htmlFor="image" className="text-xs font-medium text-zinc-700">Image URL</Label>
              <Input id="image" name="image" value={imageUrl} onChange={onImageChange} placeholder="https://…" className="h-8 text-sm" />
            </div>
            <div className="rounded border bg-zinc-50 p-2">
              {imageUrl ? (
                <div className="relative h-24 w-full">
                  <Image src={imageUrl} alt="Preview" fill sizes="200px" className="object-cover rounded" placeholder="blur" blurDataURL={BLUR} />
                </div>
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
        <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" className="rounded-md border bg-white p-3 md:p-4 space-y-3">
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
        <div id="panel-variants" role="tabpanel" aria-labelledby="tab-variants" className="rounded-md border bg-white p-3 md:p-4">
          <VariantsEditor name="variants" initial={product.variants || []} onSummaryChange={setVariantSummary} />
        </div>
      )}

      {tab === 'markets' && (
        <div id="panel-markets" role="tabpanel" aria-labelledby="tab-markets" className="rounded-md border bg-white p-3 md:p-4">
          <MarketsPricingEditor name="markets" initial={product.markets || []} />
        </div>
      )}
    </form>
  );
}
