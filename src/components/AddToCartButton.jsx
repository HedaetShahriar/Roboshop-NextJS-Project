"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

export default function AddToCartButton({ id, name, price, image, qty = 1, className = "", disabled = false }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (disabled || adding) return;
    setAdding(true);
    try {
      addItem({ id, name, price, image }, qty);
    } finally {
      // quick feedback without toasts to keep it lightweight
      setTimeout(() => setAdding(false), 400);
    }
  };

  return (
    <Button onClick={handleAdd} className={className} disabled={disabled || adding} aria-label={`Add ${name} to cart`}>
      {disabled ? "Out of stock" : adding ? "Adding..." : "Add to cart"}
    </Button>
  );
}
