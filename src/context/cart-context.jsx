"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("roboshop:cart");
      if (raw) {
        setItems(JSON.parse(raw));
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
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("roboshop:cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  // Also persist to a cookie for server-side or cross-tab access
  useEffect(() => {
    try {
      const json = JSON.stringify(items);
      const encoded = encodeURIComponent(json);
      // 7 days expiry
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `roboshop_cart=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch {}
  }, [items]);

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
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

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
  }, []);

  const count = useMemo(() => items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clear, replaceCart, count, subtotal }),
    [items, addItem, removeItem, updateQty, clear, replaceCart, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
