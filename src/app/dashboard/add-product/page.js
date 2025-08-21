'use client'

import { useState, useTransition, useRef } from "react";
import { addProduct } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Add a New Product</h1>
        <form ref={formRef} action={handleSubmit}>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="name">Product Name</Label>
            <Input type="text" id="name" name="name" required />
          </div>
          <div className="grid gap-2 mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required />
          </div>
          <div className="grid gap-2 mb-6">
            <Label htmlFor="price">Price</Label>
            <Input type="number" id="price" name="price" step="0.01" required />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add Product'}
          </Button>
        </form>
        {message?.error && <p className="mt-4 text-red-500">{message.error}</p>}
        {message?.success && <p className="mt-4 text-green-500">{message.success}</p>}
      </div>
    </div>
  );
}