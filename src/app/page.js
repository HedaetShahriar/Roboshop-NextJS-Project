import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import productsStatic from "@/data/product.json";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";


export default async function HomePage() {
  // Fetch a handful of products; fallback to static JSON if DB is empty/unavailable
  let highlightedProducts = [];
  try {
    const client = await clientPromise;
    const db = client.db("roboshop");
    const all = await db.collection("products").find({}).toArray();
    // console.log("Fetched products from DB:", all);
    const products = all.map(p => ({ ...p, _id: p._id.toString() }));
    const discounted = products.filter(p => p.has_discount_price && Number(p.discount_price) > 0);
    highlightedProducts = (discounted.length ? discounted : products).slice(0, 3);
    console.log("Highlighted products:", highlightedProducts);
  } catch (e) {
    // ignore and fallback below
  }
  if (!highlightedProducts.length) {
    const discounted = productsStatic.filter(p => p.has_discount_price && Number(p.discount_price) > 0);
    const source = discounted.length ? discounted : productsStatic;
    highlightedProducts = source.slice(0, 3);
  }

  return (
    <>
      <section className="relative overflow-hidden bg-zinc-900 text-white p-12 text-center">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Welcome to Roboshop</h1>
          <p className="text-lg text-zinc-300 mb-6">Your one-stop shop for sensors, batteries, microcontrollers, and more.</p>
          <Button asChild size="lg">
            <Link href="/products">Shop Now</Link>
          </Button>
        </div>
      </section>
      <section className="py-12 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlightedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="secondary">
              <Link href="/products">Browse all products</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}