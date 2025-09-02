'use client'

import { useState, useTransition, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addProduct } from "@/data/seller/addproduct";

export default function AddProductPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(null);
  const formRef = useRef(null);

  const handleSubmit = (formData) => {
    startTransition(async () => {
      const result = await addProduct(formData);
      setMessage(result);
      if (result?.success) {
        formRef.current?.reset();
      }
    });
  };

  return (

    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Add a New Product</h1>
      <form ref={formRef} action={handleSubmit}>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="name">Product Name</Label>
          <Input type="text" id="name" name="name" required />
        </div>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="image">Image URL</Label>
          <Input type="url" id="image" name="image" placeholder="https://example.com/image.jpg" required />
        </div>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="has_discount_price">Has Discount Price?</Label>
          <div className="flex items-center gap-2">
            <input id="has_discount_price" name="has_discount_price" type="checkbox" />
            <Label htmlFor="has_discount_price" className="!m-0">Yes</Label>
          </div>
        </div>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="price">Price</Label>
          <Input type="number" id="price" name="price" step="0.01" required />
        </div>
        <div className="grid gap-2 mb-4">
          <Label htmlFor="discount_price">Discount Price</Label>
          <Input type="number" id="discount_price" name="discount_price" step="0.01" placeholder="0.00" />
        </div>
        <div className="grid gap-2 mb-6">
          <Label htmlFor="current_stock">Current Stock</Label>
          <Input type="number" id="current_stock" name="current_stock" min="0" step="1" required />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Product'}
        </Button>
      </form>
      {message?.error && <p className="mt-4 text-red-500">{message.error}</p>}
      {message?.success && <p className="mt-4 text-green-500">{message.success}</p>}
    </div>
  );
}