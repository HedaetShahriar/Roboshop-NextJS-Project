import Link from "next/link";
import Image from "next/image";
import clientPromise from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import productsStatic from "@/data/product.json";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ProductCard from "@/components/ProductCard";

export default async function ProductsPage() {
  const client = await clientPromise;
  const db = client.db("roboshop");
  const productsData = await db.collection("products").find({}).toArray();
  let products = productsData.map((p) => ({ ...p, _id: p._id.toString() }));
  // Fallback to static JSON if DB is empty
  if (!products || products.length === 0) {
    products = productsStatic;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10">Our Products</h1>
      {products.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p>No products found. Please check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          {/* {products.map((product) => {
            const hasDiscount = product.has_discount_price && Number(product.discount_price) > 0;
            const price = Number(product.price || 0);
            const discountPrice = Number(product.discount_price || 0);
            const stock = product.current_stock;
            const rating = product.product_rating;
            const maxRating = product.product_max_rating || 5;
            const ratingCount = product.product_rating_count;
            const canNavigate = !!product._id;

            return (
              <Card key={product._id || product.slug} className="flex flex-col overflow-hidden">
                {product.image && (
                  <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>
                    {hasDiscount ? (
                      <span className="flex items-center gap-2">
                        <span className="text-red-600 font-semibold">${discountPrice.toFixed(2)}</span>
                        <span className="line-through text-gray-400">${price.toFixed(2)}</span>
                      </span>
                    ) : (
                      <>${price.toFixed(2)}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow text-sm text-muted-foreground space-y-2">
                  {typeof stock !== 'undefined' && (
                    <p>In stock: <span className="font-medium text-gray-700">{stock}</span></p>
                  )}
                  {typeof rating !== 'undefined' && (
                    <p>Rating: {rating}/{maxRating} ({ratingCount || 0})</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" disabled={!canNavigate}>
                    <Link href={canNavigate ? `/products/${product._id}` : "/products"}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })} */}
        </div>
      )}
    </div>
  )
}