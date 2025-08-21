import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProductsPage() {
  const client = await clientPromise;
  const db = client.db("roboshop");
  const productsData = await db.collection("products").find({}).toArray();
  const products = productsData.map(product => ({
    ...product,
    _id: product._id.toString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10">Our Products</h1>
      {products.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p>No products found. Please check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product._id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>${product.price.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>{product.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/products/${product._id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}