import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const ProductCard = ({ product }) => (
  <Card className="flex flex-col">
    <CardHeader>
      <CardTitle>{product.name}</CardTitle>
      <CardDescription>${product.price.toFixed(2)}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-sm text-muted-foreground">{product.description}</p>
    </CardContent>
    <CardFooter>
      <Button asChild className="w-full">
        <Link href={`/products/${product._id}`}>View Details</Link>
      </Button>
    </CardFooter>
  </Card>
);

export default async function HomePage() {
  const client = await clientPromise;
  const db = client.db("roboshop");
  const highlightedProductsData = await db.collection("products").find({}).limit(3).toArray();
  const highlightedProducts = highlightedProductsData.map(p => ({ ...p, _id: p._id.toString() }));

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
        </div>
      </section>
    </>
  );
}