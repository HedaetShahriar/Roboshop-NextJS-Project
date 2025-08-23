import getDb from "@/lib/mongodb";
import { ObjectId } from "mongodb";
// import productsStatic from "@/data/product.json";

export async function getAllProducts() {
  const db = await getDb();
  const productsData = await db.collection("products").find({}).toArray();
  let products = productsData.map((p) => ({ ...p, _id: p._id.toString() }));
  // if (!products || products.length === 0) {
  //   products = productsStatic;
  // }
  return products;
}

export async function getProductById(id) {
  const db = await getDb();
  let doc = null;
  try {
    doc = await db.collection("products").findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() };
}
