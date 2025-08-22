import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import productsStatic from "@/data/product.json";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import Hero from "@/components/Hero";
import WhyRoboshop from "@/components/WhyRoboshop";


export default async function HomePage() {
  // Fetch a handful of products; fallback to static JSON if DB is empty/unavailable
  let highlightedProducts = [];
  let onSaleProducts = [];
  try {
    const client = await clientPromise;
    const db = client.db("roboshop");
    const all = await db.collection("products").find({}).toArray();
    // console.log("Fetched products from DB:", all);
    const products = all.map(p => ({ ...p, _id: p._id.toString() }));
    const discounted = products.filter(p => p.has_discount_price && Number(p.discount_price) > 0);
    highlightedProducts = (discounted.length ? discounted : products).slice(0, 4);
    onSaleProducts = discounted.slice(0, 8);
  } catch (e) {
    // ignore and fallback below
  }
  if (!highlightedProducts.length) {
    const discounted = productsStatic.filter(p => p.has_discount_price && Number(p.discount_price) > 0);
    const source = discounted.length ? discounted : productsStatic;
    highlightedProducts = source.slice(0, 4);
    onSaleProducts = discounted.slice(0, 8);
  }

  return (
    <>
      <Hero />
      <section className="py-12 bg-white px-2">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
      {onSaleProducts.length > 0 && (
        <section className="py-12 bg-zinc-50 px-2">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">On Sale Now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {onSaleProducts.map(product => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="px-2">
        <WhyRoboshop />
      </div>
    </>
  );
}