"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(0); // ms since epoch

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
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("roboshop:cart", JSON.stringify(items));
      localStorage.setItem("roboshop:cartUpdatedAt", String(updatedAt || 0));
    } catch {}
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
    } catch {}
  }, [items, updatedAt]);

  const addItem = useCallback((product, qty = 1) => {
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

  const removeItem = useCallback((id) => {
  setItems((prev) => prev.filter((it) => it.id !== id));
  setUpdatedAt(Date.now());
  }, []);

  const updateQty = useCallback((id, qty) => {
  setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)));
  setUpdatedAt(Date.now());
  }, []);

  const clear = useCallback(() => { setItems([]); setUpdatedAt(Date.now()); }, []);

  // Replace entire cart from an external source (e.g., DB)
  const replaceCart = useCallback((newItems) => {
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
      // ignore
    }
  setUpdatedAt(Date.now());
  }, []);

  // Merge external cart into current cart by id (sum quantities)
  const mergeCart = useCallback((incomingItems) => {
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
        const map = new Map();
        // start with current items
        for (const it of prev) {
          if (!it?.id) continue;
          map.set(it.id, { ...it, qty: Math.max(1, Number(it.qty || 1)) });
        }
        // merge incoming
        for (const inc of normalizedIncoming) {
          if (!inc?.id) continue;
          if (map.has(inc.id)) {
            const existing = map.get(inc.id);
            map.set(inc.id, {
              id: existing.id,
              name: existing.name || inc.name,
              price: Number(existing.price ?? inc.price ?? 0),
              image: existing.image || inc.image || null,
              qty: Math.max(1, Number(existing.qty || 1)) + Math.max(1, Number(inc.qty || 1)),
            });
          } else {
            map.set(inc.id, { ...inc });
          }
        }
        return Array.from(map.values());
      });
    } catch {
      // ignore
    }
    setUpdatedAt(Date.now());
  }, []);

  // Set items and timestamp from server snapshot
  const setCartFromServer = useCallback((serverItems, serverTs) => {
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
      const ts = typeof serverTs === 'string' ? Date.parse(serverTs) : Number(serverTs || 0);
      setUpdatedAt(!Number.isNaN(ts) && ts > 0 ? ts : Date.now());
    } catch {
      // ignore
    }
  }, []);

  const count = useMemo(() => items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0), [items]);

  const value = useMemo(
    () => ({ items, updatedAt, addItem, removeItem, updateQty, clear, replaceCart, mergeCart, setCartFromServer, count, subtotal }),
    [items, updatedAt, addItem, removeItem, updateQty, clear, replaceCart, mergeCart, setCartFromServer, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
