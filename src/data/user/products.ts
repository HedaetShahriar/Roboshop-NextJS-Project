import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { Product } from "@/types";

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  const productsData = await db
    .collection("products")
    .find({
      $or: [{ is_hidden: { $exists: false } }, { is_hidden: false }],
    })
    .toArray();
  const products = productsData.map((p) => ({
    ...p,
    _id: p._id.toString(),
  })) as Product[];
  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDb();
  let doc = null;
  try {
    doc = await db.collection("products").findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
  if (!doc) return null;
  if (doc.is_hidden === true) return null;
  return { ...doc, _id: doc._id.toString() } as Product;
}
