'use client'

import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface HistoryEntry {
  startedAt: string;
  status: 'success' | 'error';
  inserted?: number;
  updated?: number;
  error?: string;
  file: string;
}

interface PreviewRow {
  idx: number;
  values: Record<string, unknown>;
  valid: boolean;
  errors: string[];
  doc: ProductDoc;
}

interface PreviewCounts {
  total: number;
  valid: number;
  invalid: number;
}

interface Preview {
  rows: PreviewRow[];
  counts: PreviewCounts;
}

interface ProductDoc {
  name: string;
  slug: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  image: string;
  price: number;
  has_discount_price: boolean;
  discount_price: number;
  current_stock: number;
  product_rating: number;
  product_max_rating: number;
  product_rating_count: number;
  promotions: unknown[];
  createdAt: Date;
}

interface RawRow {
  name?: unknown;
  image?: unknown;
  price?: unknown;
  has_discount_price?: unknown;
  discount_price?: unknown;
  current_stock?: unknown;
  sku?: unknown;
  category?: unknown;
  subcategory?: unknown;
  description?: unknown;
}

export default function ImportProductsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<Message | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('productsImportHistory');
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const saveHistory = (entry: HistoryEntry) => {
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    try { localStorage.setItem('productsImportHistory', JSON.stringify(next)); } catch {}
  };

  const validateAndShape = (r: RawRow): { valid: boolean; errors: string[]; doc: ProductDoc } => {
    const errors: string[] = [];
    const name = String(r.name || '').trim();
    const image = String(r.image || '').trim();
    const price = Number(r.price);
    const hasDiscount = r.has_discount_price === true || r.has_discount_price === 'true' || r.has_discount_price === 'on' || r.has_discount_price === 1;
    const discountPrice = Number(r.discount_price || 0);
    const currentStock = Number.isFinite(Number(r.current_stock)) ? Number(r.current_stock) : 0;
    const sku = String(r.sku || '').trim();
    const category = String(r.category || '').trim();
    const subcategory = String(r.subcategory || '').trim();
    const description = String(r.description || '').trim();

    if (!name || name.length < 3) errors.push('name is required (>= 3 chars)');
    if (!image || !/^https?:\/\//i.test(image)) errors.push('image must be an http(s) URL');
    if (!Number.isFinite(price) || price <= 0) errors.push('price must be > 0');
    if (hasDiscount) {
      if (!Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= price) {
        errors.push('discount_price must be > 0 and < price');
      }
    }
    if (!Number.isInteger(currentStock) || currentStock < 0) errors.push('current_stock must be a non-negative integer');

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const doc: ProductDoc = {
      name,
      slug,
      sku: sku || undefined,
      category: category || undefined,
      subcategory: subcategory || undefined,
      description: description || undefined,
      image,
      price,
      has_discount_price: !!hasDiscount,
      discount_price: hasDiscount ? discountPrice : 0,
      current_stock: currentStock,
      product_rating: 0,
      product_max_rating: 5,
      product_rating_count: 0,
      promotions: [],
      createdAt: new Date(),
    };

    return { valid: errors.length === 0, errors, doc };
  };

  const handleSelectFile = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setMsg(null);
    setParsing(true);
    setPreview(null);
    try {
      const XLSX = await import('xlsx/xlsx.mjs');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as RawRow[];
      const shaped = rows.map((r, idx) => {
        const { valid, errors, doc } = validateAndShape(r);
        return { idx: idx + 2, values: r as Record<string, unknown>, valid, errors, doc };
      });
      const counts: PreviewCounts = {
        total: shaped.length,
        valid: shaped.filter((r) => r.valid).length,
        invalid: shaped.filter((r) => !r.valid).length,
      };
      setPreview({ rows: shaped, counts });
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: 'Failed to parse file for preview' });
    } finally {
      setParsing(false);
    }
  };

  const handleImportFile = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    setImporting(true);
    setMsg(null);
    const startedAt = new Date().toISOString();
    try {
      const res = await fetch('/api/seller/products/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (json?.ok) {
        const entry: HistoryEntry = { startedAt, status: 'success', inserted: json.inserted, updated: json.updated, file: file.name };
        saveHistory(entry);
        setMsg({ type: 'success', text: `Imported ${json.inserted} and updated ${json.updated}.` });
        setPreview(null);
        setSelectedFile(null);
      } else {
        const entry: HistoryEntry = { startedAt, status: 'error', error: json?.error || 'Import failed', file: file.name };
        saveHistory(entry);
        setMsg({ type: 'error', text: json?.error || 'Import failed' });
      }
    } catch {
      const entry: HistoryEntry = { startedAt, status: 'error', error: 'Import failed', file: file.name };
      saveHistory(entry);
      setMsg({ type: 'error', text: 'Import failed' });
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Import products</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload an Excel (.xlsx) file to bulk-create products. Large files may take a moment.</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3"><CardTitle className="text-base">Upload</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-2">
            <a href="/api/seller/products/import" className="inline-flex">
              <Button type="button" variant="outline">Download template</Button>
            </a>
            <input
              ref={inputRef}
              id="productsXlsx"
              type="file"
              accept=".xlsx"
              className="sr-only"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) handleSelectFile(f);
              }}
            />
            <Button type="button" disabled={importing || parsing} onClick={() => inputRef.current?.click()}>
              {parsing ? 'Parsing…' : (selectedFile ? 'Choose different' : 'Upload .xlsx')}
            </Button>
          </div>
          {msg?.text && (
            <p className={msg.type === 'error' ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
              {msg.text}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Expected columns: name, sku, category, subcategory, description, image, price, has_discount_price, discount_price, current_stock</p>
          {preview && (
            <div className="mt-3 border rounded">
              <div className="flex items-center justify-between p-3">
                <div className="text-sm">
                  <span className="font-medium">Preview:</span>
                  <span className="ml-2">{preview.counts.total} rows</span>
                  <span className="ml-2 text-green-700">{preview.counts.valid} valid</span>
                  <span className="ml-2 text-red-700">{preview.counts.invalid} invalid</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => { setPreview(null); setSelectedFile(null); if (inputRef.current) inputRef.current.value=''; }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={importing || preview.counts.valid === 0}
                    onClick={() => selectedFile && handleImportFile(selectedFile)}
                  >
                    {importing ? 'Importing…' : `Confirm import (${preview.counts.valid} valid)`}
                  </Button>
                </div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Row</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Stock</th>
                      <th className="text-left p-2">Slug</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className={r.valid ? '' : 'bg-red-50'}>
                        <td className="p-2 align-top">{r.idx}</td>
                        <td className="p-2 align-top">{String(r.values.name ?? '')}</td>
                        <td className="p-2 align-top">{String(r.values.price ?? '')}</td>
                        <td className="p-2 align-top">{String(r.values.current_stock ?? '')}</td>
                        <td className="p-2 align-top text-muted-foreground">{r.doc.slug}</td>
                        <td className="p-2 align-top">
                          {r.valid ? (
                            <span className="text-green-700">Valid</span>
                          ) : (
                            <div className="text-red-700 space-y-1">
                              {r.errors.map((e, j) => (
                                <div key={j}>• {e}</div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 50 && (
                  <div className="p-2 text-xs text-muted-foreground">Showing first 50 rows.</div>
                )}
              </div>
              {preview.counts.invalid > 0 && (
                <div className="p-3 text-xs text-muted-foreground border-t">Note: The server will skip invalid rows; final inserted count may be lower.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent imports</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imports yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between border rounded px-3 py-2">
                  <div>
                    <div className="font-medium">{h.file} <span className="text-xs text-muted-foreground">({new Date(h.startedAt).toLocaleString()})</span></div>
                    {h.status === 'success' ? (
                      <div className="text-green-600">Inserted {h.inserted}{typeof h.updated === 'number' ? `, Updated ${h.updated}` : ''}</div>
                    ) : (
                      <div className="text-red-600">{h.error || 'Failed'}</div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.status}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
