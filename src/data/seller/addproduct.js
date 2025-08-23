'use server'

import { revalidatePath } from "next/cache";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export async function addProduct(formData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'You must be logged in to add a product.' };
  }

  // Gather and validate product fields (align with src/data/product.json)
  const name = (formData.get('name') || '').toString().trim();
  const image = (formData.get('image') || '').toString().trim();
  const price = parseFloat(formData.get('price'));
  const hasDiscountRaw = formData.get('has_discount_price');
  const discountPrice = parseFloat(formData.get('discount_price') || '0');
  const currentStock = parseInt(formData.get('current_stock') || '0', 10);

  if (!name || name.length < 3) {
    return { error: "Product name must be at least 3 characters" };
  }
  if (!image || !/^https?:\/\//i.test(image)) {
    return { error: "Please provide a valid product image URL (http or https)." };
  }
  if (isNaN(price) || price <= 0) {
    return { error: "Price must be a number greater than zero" };
  }
  const hasDiscount = hasDiscountRaw === 'on' || hasDiscountRaw === 'true' || hasDiscountRaw === true;
  if (hasDiscount) {
    if (isNaN(discountPrice) || discountPrice <= 0) {
      return { error: "Discount price must be a positive number when discount is enabled" };
    }
    if (discountPrice >= price) {
      return { error: "Discount price must be less than the regular price" };
    }
  }
  if (isNaN(currentStock) || currentStock < 0) {
    return { error: "Current stock must be a non-negative integer" };
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  try {
    const db = await getDb();
    await db.collection("products").insertOne({
      name,
      slug,
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
    });

    revalidatePath('/products');
    return { success: 'Product added successfully!' };

  } catch (error) {
    console.error(error);
    return { error: 'Failed to add product.' };
  }
}