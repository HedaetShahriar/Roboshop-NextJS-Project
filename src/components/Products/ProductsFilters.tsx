"use client";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORY_LIST } from "@/data/categories";
import { Search, X, ChevronDown, LayoutGrid, List } from "lucide-react";

function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
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
  const [inStock, setInStock] = useState(
    ["1", "true", "yes"].includes((params.get("inStock") || "").toLowerCase()),
  );
  const [sort, setSort] = useState(params.get("sort") || "relevance");

  const debouncedQ = useDebouncedValue(q, 400);

  const updateUrl = (next: Record<string, string | boolean | undefined>) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "" || v === false) {
        sp.delete(k);
      } else {
        sp.set(k, String(v));
      }
    });
    sp.delete("page");
    router.replace(`${pathname}?${sp.toString()}`);
  };

  useEffect(() => {
    setQ(params.get("q") || "");
    setCategory(params.get("category") || "");
    setInStock(
      ["1", "true", "yes"].includes(
        (params.get("inStock") || "").toLowerCase(),
      ),
    );
    setSort(params.get("sort") || "relevance");
  }, [params.toString()]);

  useEffect(() => {
    if ((params.get("q") || "") !== debouncedQ) {
      updateUrl({ q: debouncedQ || undefined });
    }
  }, [debouncedQ]);

  const onClear = () => {
    setQ("");
    setCategory("");
    setInStock(false);
    setSort("relevance");
    router.replace(pathname);
  };

  const hasFilters = q || category || inStock || sort !== "relevance";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="pl-10 h-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            {q && (
              <button
                onClick={() => {
                  setQ("");
                  updateUrl({ q: undefined });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Select - Hidden on mobile since we have sidebar */}
        <div className="hidden md:block">
          <div className="relative">
            <select
              className="h-10 w-48 rounded-md border border-gray-200 px-3 bg-gray-50 text-gray-700 appearance-none cursor-pointer focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              value={category}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const v = e.target.value;
                setCategory(v);
                updateUrl({ category: v || undefined });
              }}
            >
              <option value="">All Categories</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort Select */}
        <div className="relative">
          <select
            className="h-10 w-full md:w-48 rounded-md border border-gray-200 px-3 bg-gray-50 text-gray-700 appearance-none cursor-pointer focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            value={sort}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              const v = e.target.value;
              setSort(v);
              updateUrl({ sort: v });
            }}
          >
            <option value="relevance">Sort by: Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest First</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        </div>

        {/* In Stock Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={inStock}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const v = e.target.checked;
              setInStock(v);
              updateUrl({ inStock: v ? "1" : undefined });
            }}
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            In Stock Only
          </span>
        </label>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700 border-gray-200 hover:bg-gray-50"
          >
            <X className="size-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Tags */}
      {hasFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Active filters:</span>
          {q && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs">
              Search: "{q}"
              <button
                onClick={() => {
                  setQ("");
                  updateUrl({ q: undefined });
                }}
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs">
              {category}
              <button
                onClick={() => {
                  setCategory("");
                  updateUrl({ category: undefined });
                }}
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {inStock && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs">
              In Stock
              <button
                onClick={() => {
                  setInStock(false);
                  updateUrl({ inStock: undefined });
                }}
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {sort !== "relevance" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs">
              {sort.replace("_", " → ")}
              <button
                onClick={() => {
                  setSort("relevance");
                  updateUrl({ sort: "relevance" });
                }}
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
