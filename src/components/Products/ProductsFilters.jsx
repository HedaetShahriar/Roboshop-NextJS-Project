"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORY_LIST } from "@/data/categories";

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProductsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [inStock, setInStock] = useState(["1", "true", "yes"].includes((params.get("inStock") || "").toLowerCase()));
  const [sort, setSort] = useState(params.get("sort") || "relevance");

  const debouncedQ = useDebouncedValue(q, 400);

  const updateUrl = (next) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "" || v === false) {
        sp.delete(k);
      } else {
        sp.set(k, String(v));
      }
    });
    // reset page on changes (future-proof)
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`);
  };

  useEffect(() => {
    // keep state in sync when user clicks back/forward
    setQ(params.get("q") || "");
    setCategory(params.get("category") || "");
    setInStock(["1", "true", "yes"].includes((params.get("inStock") || "").toLowerCase()));
    setSort(params.get("sort") || "relevance");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => {
    if ((params.get("q") || "") !== debouncedQ) {
      updateUrl({ q: debouncedQ || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const onClear = () => {
    setQ("");
    setCategory("");
    setInStock(false);
    setSort("relevance");
    router.replace(pathname);
  };

  return (
    <div className="bg-white border rounded-md p-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label htmlFor="q">Search</Label>
          <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="h-10 w-full rounded-md border px-3 bg-white"
            value={category}
            onChange={(e) => {
              const v = e.target.value;
              setCategory(v);
              updateUrl({ category: v || undefined });
            }}
          >
            <option value="">All</option>
            {CATEGORY_LIST.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="sort">Sort</Label>
          <select
            id="sort"
            className="h-10 w-full rounded-md border px-3 bg-white"
            value={sort}
            onChange={(e) => {
              const v = e.target.value;
              setSort(v);
              updateUrl({ sort: v });
            }}
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="block">Stock</Label>
          <div className="h-10 flex items-center gap-3">
            <input
              id="inStock"
              type="checkbox"
              className="h-4 w-4"
              checked={inStock}
              onChange={(e) => {
                const v = e.target.checked;
                setInStock(v);
                updateUrl({ inStock: v ? "1" : undefined });
              }}
            />
            <Label htmlFor="inStock">In stock only</Label>
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClear}>Clear</Button>
      </div>
    </div>
  );
}
