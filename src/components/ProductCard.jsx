import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
const ProductCard = ({ product }) => {
  const hasDiscount = product.has_discount_price && Number(product.discount_price) > 0;
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discount_price || 0);
  const stock = product.current_stock;
  const rating = product.product_rating;
  const maxRating = product.product_max_rating || 5;
  const ratingCount = product.product_rating_count;
  const canNavigate = !!product._id;

  return (
    <Card className="flex flex-col overflow-hidden">
      {product.image && (
        <div className="relative w-full aspect-[4/3] bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority
          />
          {typeof stock !== 'undefined' && (
            <span className="absolute right-2 top-2 rounded-md bg-black/70 text-white text-xs px-2 py-1">In stock: {stock}</span>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
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
      <CardContent className="flex-grow text-sm text-muted-foreground">
        {typeof rating !== 'undefined' && (
          <div className="flex items-center gap-2">
            <div className="text-yellow-500" aria-label={`Rating ${rating} out of ${maxRating}`}>
              {Array.from({ length: maxRating }).map((_, i) => (
                <span key={i}>{i < rating ? '★' : '☆'}</span>
              ))}
            </div>
            <span className="text-gray-500">({ratingCount || 0})</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" disabled={!canNavigate}>
          <Link href={canNavigate ? `/products/${product._id}` : "/products"}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
export default ProductCard;
