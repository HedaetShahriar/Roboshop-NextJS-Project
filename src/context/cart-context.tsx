"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";

interface ProductInput {
  id: string;
  name: string;
  price: number | string;
  image?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  updatedAt: number;
  addItem: (product: ProductInput, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  replaceCart: (newItems: CartItem[]) => void;
  mergeCart: (incomingItems: CartItem[]) => void;
  setCartFromServer: (
    serverItems: CartItem[],
    serverTs?: string | number,
  ) => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number>(0); // ms since epoch

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("roboshop:cart");
      if (raw) {
        setItems(JSON.parse(raw));
        const ts = Number(localStorage.getItem("roboshop:cartUpdatedAt") || 0);
        if (!Number.isNaN(ts)) setUpdatedAt(ts);
        return;
      }
      // Fallback: load from cookie if present
      const cookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("roboshop_cart="));
      if (cookie) {
        const val = decodeURIComponent(cookie.split("=")[1] || "");
        if (val) setItems(JSON.parse(val));
      }
      const tsCookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("roboshop_cart_updatedAt="));
      if (tsCookie) {
        const v = decodeURIComponent(tsCookie.split("=")[1] || "0");
        const ts = Number(v);
        if (!Number.isNaN(ts)) setUpdatedAt(ts);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("roboshop:cart", JSON.stringify(items));
      localStorage.setItem("roboshop:cartUpdatedAt", String(updatedAt || 0));
    } catch {
      /* ignore */
    }
  }, [items, updatedAt]);

  // Also persist to a cookie for server-side or cross-tab access
  useEffect(() => {
    try {
      const json = JSON.stringify(items);
      const encoded = encodeURIComponent(json);
      // 7 days expiry
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `roboshop_cart=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `roboshop_cart_updatedAt=${encodeURIComponent(String(updatedAt || 0))}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }, [items, updatedAt]);

  const addItem = useCallback((product: ProductInput, qty: number = 1) => {
    if (!product || !product.id) return;
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          image: product.image || null,
          qty: qty || 1,
        },
      ];
    });
    setUpdatedAt(Date.now());
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setUpdatedAt(Date.now());
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)),
    );
    setUpdatedAt(Date.now());
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setUpdatedAt(Date.now());
  }, []);

  // Replace entire cart from an external source (e.g., DB)
  const replaceCart = useCallback((newItems: CartItem[]) => {
    try {
      const normalized = Array.isArray(newItems)
        ? newItems.map((it) => ({
            id: it.id,
            name: it.name,
            price: Number(it.price || 0),
            image: it.image || null,
            qty: Math.max(1, Number(it.qty || 1)),
          }))
        : [];
      setItems(normalized);
    } catch {
      /* ignore */
    }
    setUpdatedAt(Date.now());
  }, []);

  // Merge external cart into current cart by id (sum quantities)
  const mergeCart = useCallback((incomingItems: CartItem[]) => {
    try {
      const normalizedIncoming = Array.isArray(incomingItems)
        ? incomingItems.map((it) => ({
            id: it.id,
            name: it.name,
            price: Number(it.price || 0),
            image: it.image || null,
            qty: Math.max(1, Number(it.qty || 1)),
          }))
        : [];
      setItems((prev) => {
        const map = new Map<string, CartItem>();
        // start with current items
        for (const it of prev) {
          if (!it?.id) continue;
          map.set(it.id, { ...it, qty: Math.max(1, Number(it.qty || 1)) });
        }
        // merge incoming
        for (const inc of normalizedIncoming) {
          if (!inc?.id) continue;
          if (map.has(inc.id)) {
            const existing = map.get(inc.id)!;
            map.set(inc.id, {
              id: existing.id,
              name: existing.name || inc.name,
              price: Number(existing.price ?? inc.price ?? 0),
              image: existing.image || inc.image || null,
              qty:
                Math.max(1, Number(existing.qty || 1)) +
                Math.max(1, Number(inc.qty || 1)),
            });
          } else {
            map.set(inc.id, { ...inc });
          }
        }
        return Array.from(map.values());
      });
    } catch {
      /* ignore */
    }
    setUpdatedAt(Date.now());
  }, []);

  // Set items and timestamp from server snapshot
  const setCartFromServer = useCallback(
    (serverItems: CartItem[], serverTs?: string | number) => {
      try {
        const normalized = Array.isArray(serverItems)
          ? serverItems.map((it) => ({
              id: it.id,
              name: it.name,
              price: Number(it.price || 0),
              image: it.image || null,
              qty: Math.max(1, Number(it.qty || 1)),
            }))
          : [];
        setItems(normalized);
        const ts =
          typeof serverTs === "string"
            ? Date.parse(serverTs)
            : Number(serverTs || 0);
        setUpdatedAt(!Number.isNaN(ts) && ts > 0 ? ts : Date.now());
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const count = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0),
    [items],
  );
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
        0,
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      updatedAt,
      addItem,
      removeItem,
      updateQty,
      clear,
      replaceCart,
      mergeCart,
      setCartFromServer,
      count,
      subtotal,
    }),
    [
      items,
      updatedAt,
      addItem,
      removeItem,
      updateQty,
      clear,
      replaceCart,
      mergeCart,
      setCartFromServer,
      count,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
