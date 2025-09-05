'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Upload } from "lucide-react";
import { addProduct } from "@/data/seller/addproduct";
import { CATEGORY_MAP, CATEGORY_LIST } from "@/data/categories";
import { formatBDT } from "@/lib/currency";

export default function AddProductPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(null);
  const formRef = useRef(null);

  // Local UI state
  const [imgPreview, setImgPreview] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState(CATEGORY_LIST[0] || 'Accessories');
  const [subcategory, setSubcategory] = useState((CATEGORY_MAP[category] || [])[0] || '');
  const [name, setName] = useState('');
  const [slugInfo, setSlugInfo] = useState({ checking: false, available: null });

  useEffect(() => {
    const next = CATEGORY_MAP[category] || [];
    setSubcategory(next[0] || '');
  }, [category]);

  const discountPct = useMemo(() => {
    const p = parseFloat(price);
    const d = parseFloat(discountPrice);
    if (!hasDiscount || isNaN(p) || isNaN(d) || p <= 0 || d <= 0 || d >= p) return null;
    return Math.round(((p - d) / p) * 100);
  }, [hasDiscount, price, discountPrice]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json?.ok && json.url) {
        const input = formRef.current?.querySelector('#image');
        if (input) input.value = json.url;
        setImgPreview(json.url);
      }
    } catch {}
  };

  const handleImageUrlChange = (e) => setImgPreview(e.target.value);

  const handleSubmit = (formData) => {
    startTransition(async () => {
      const result = await addProduct(formData);
      setMessage(result);
      if (result?.success) {
        formRef.current?.reset();
        setImgPreview('');
        setHasDiscount(false);
        setPrice('');
        setDiscountPrice('');
        setName('');
        setSlugInfo({ checking: false, available: null });
      }
    });
  };

  // Debounced slug check
  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      const trimmed = name.trim();
      if (trimmed.length < 3) { setSlugInfo({ checking: false, available: null }); return; }
      const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setSlugInfo(s => ({ ...s, checking: true }));
      try {
        const res = await fetch(`/api/seller/products/check-slug?slug=${encodeURIComponent(slug)}`, { signal: controller.signal });
        const json = await res.json();
        if (json?.ok) setSlugInfo({ checking: false, available: !!json.available });
        else setSlugInfo({ checking: false, available: null });
      } catch {
        setSlugInfo({ checking: false, available: null });
      }
    }, 400);
    return () => { clearTimeout(id); controller.abort(); };
  }, [name]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add product</h1>
          <p className="text-sm text-muted-foreground mt-1">Create a new product with clear details, pricing, and inventory.</p>
        </div>
        <Link href="/dashboard/seller/import-products" className="inline-flex">
          <Button type="button" variant="default" className="gap-2">
            <Upload className="h-4 w-4" />
            Go to Import
          </Button>
        </Link>
      </div>

      <form ref={formRef} action={handleSubmit} className="grid md:grid-cols-3 gap-5 items-start">
        <div className="md:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Basic information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Product Name</Label>
                <Input type="text" id="name" name="name" required placeholder="e.g. Arduino Uno R3" value={name} onChange={(e)=>setName(e.target.value)} />
                {name && (
                  <p className="text-xs mt-1">
                    {slugInfo.checking && <span className="text-muted-foreground">Checking slug…</span>}
                    {!slugInfo.checking && slugInfo.available === true && <span className="text-green-600">Slug available</span>}
                    {!slugInfo.checking && slugInfo.available === false && <span className="text-red-600">A product with this slug already exists</span>}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sku">SKU (optional)</Label>
                <Input type="text" id="sku" name="sku" placeholder="e.g. ARD-UNO-R3" />
              </div>
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v)=>setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_LIST.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="category" value={category} />
              </div>
              <div className="grid gap-1.5">
                <Label>Subcategory</Label>
                <Select value={subcategory} onValueChange={(v)=>setSubcategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(CATEGORY_MAP[category] || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="subcategory" value={subcategory} />
              </div>
              <div className="md:col-span-2 grid gap-1.5">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" name="description" placeholder="Short description..." rows={3} />
                <p className="text-xs text-muted-foreground">Keep it short and descriptive. You can edit details later.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="grid gap-1.5">
                  <Label htmlFor="price">Price</Label>
                  <Input type="number" id="price" name="price" step="0.01" min="0" required value={price} onChange={(e)=>setPrice(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 mt-6 md:mt-0">
                  <input id="has_discount_price" name="has_discount_price" type="checkbox" checked={hasDiscount} onChange={(e)=>setHasDiscount(e.target.checked)} />
                  <Label htmlFor="has_discount_price" className="!m-0">Has discount</Label>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="discount_price">Discount price</Label>
                  <Input type="number" id="discount_price" name="discount_price" step="0.01" min="0" placeholder="0.00" value={discountPrice} onChange={(e)=>setDiscountPrice(e.target.value)} disabled={!hasDiscount} />
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {price ? (
                  <>
                    <span>Final price: <strong>{formatBDT(hasDiscount && discountPrice ? Number(discountPrice) : Number(price))}</strong></span>
                    {discountPct !== null && <span className="ml-2 text-green-700">({discountPct}% off)</span>}
                  </>
                ) : <span>Enter a price to preview</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Inventory</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="current_stock">Current stock</Label>
                <Input type="number" id="current_stock" name="current_stock" min="0" step="1" required />
              </div>
            </CardContent>
          </Card>
        </div>

  <div className="space-y-5 md:sticky md:top-[72px]">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Media</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input type="url" id="image" name="image" placeholder="https://example.com/image.jpg" required onChange={handleImageUrlChange} />
              <div className="flex items-center gap-2">
                <input id="imageFile" type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
                <Label htmlFor="imageFile" className="cursor-pointer">
                  <Button type="button" variant="secondary">Upload image</Button>
                </Label>
                <span className="text-xs text-muted-foreground">or paste an image URL</span>
              </div>
              {imgPreview ? (
                <div className="mt-2 relative w-full aspect-video overflow-hidden rounded border">
                  <Image src={imgPreview} alt="Preview" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex-col items-stretch">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Adding…' : 'Add Product'}
              </Button>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground">Make sure your image is clear and under 2MB.</div>
            </CardFooter>
          </Card>

          {/* Import moved to its own page */}

          {message?.error && <p className="text-red-600 text-sm" role="alert">{message.error}</p>}
          {message?.success && <p className="text-green-600 text-sm" role="status">{message.success}</p>}
        </div>
      </form>
    </div>
  );
}