"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("roboshop:cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("roboshop:cart", JSON.stringify(items));
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

  const count = useMemo(() => items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clear, count, subtotal }),
    [items, addItem, removeItem, updateQty, clear, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
