import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { formatBDT } from "@/lib/currency";
import { ShoppingCart, Eye } from "lucide-react";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const hasDiscount =
    product.has_discount_price && Number(product.discount_price) > 0;
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discount_price || 0);
  const stock = product.current_stock;
  const rating = product.product_rating;
  const maxRating = product.product_max_rating || 5;
  const ratingCount = product.product_rating_count;
  const canNavigate = !!product._id;
  const pid = String(product._id) || product.slug || product.name;

  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const discountAmount = hasDiscount ? price - discountPrice : 0;

  return (
    <div className="group relative flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.image ? (
          <Link href={canNavigate ? `/products/${product._id}` : "/products"}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-4xl">📦</span>
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            - {formatBDT(discountAmount)}
          </div>
        )}

        {/* Stock Badge */}
        {typeof stock !== "undefined" && (
          <div
            className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded ${
              stock > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {stock > 0 ? "In-Stock" : "Out of Stock"}
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Link
              href={canNavigate ? `/products/${product._id}` : "/products"}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition-colors"
            >
              <Eye className="size-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4">
        {/* Product Name */}
        <Link
          href={canNavigate ? `/products/${product._id}` : "/products"}
          className="block"
        >
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors min-h-[40px]">
            {product.name}
          </h3>
        </Link>

        {/* Reference/SKU */}
        {product.slug && (
          <p className="text-xs text-gray-400 mt-1 uppercase">
            REF: {product.slug.slice(0, 12)}
          </p>
        )}

        {/* Rating */}
        {typeof rating !== "undefined" && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {Array.from({ length: maxRating }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-blue-600 hover:underline cursor-pointer">
              {ratingCount || 0} reviews
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="mt-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Price</span>
            <span className="text-lg font-bold text-gray-900">
              {formatBDT(hasDiscount ? discountPrice : price)}
            </span>
          </div>
          {hasDiscount && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500">Regular price</span>
              <span className="text-sm text-gray-400 line-through">
                {formatBDT(price)}
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-auto">
          <AddToCartButton
            id={pid}
            name={product.name}
            price={hasDiscount ? discountPrice : price}
            image={product.image}
            disabled={typeof stock !== "undefined" ? stock <= 0 : false}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
