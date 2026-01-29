"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Star, 
  StarHalf, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Check, 
  Truck, 
  Shield, 
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { formatBDT } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { toast } from "sonner";

interface ProductVariant {
  name: string;
  price?: number;
  stock?: number;
}

interface ProductMarket {
  name: string;
  url: string;
  price?: number;
}

interface ProductProps {
  _id: string;
  name: string;
  image?: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discountPercent: number;
  inStock: boolean;
  stock?: number;
  sku?: string;
  category?: string;
  subcategory?: string;
  rating?: number;
  maxRating: number;
  ratingCount: number;
  description?: string;
  shortDescription?: string;
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
  markets?: ProductMarket[];
  createdAt?: string | Date;
}

interface Props {
  product: ProductProps;
}

function StarRating({ rating, maxRating = 5, size = 16 }: { rating: number; maxRating?: number; size?: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={i} className="fill-yellow-400 text-yellow-400" style={{ width: size, height: size }} />);
  }
  if (hasHalf) {
    stars.push(<StarHalf key="half" className="fill-yellow-400 text-yellow-400" style={{ width: size, height: size }} />);
  }
  while (stars.length < maxRating) {
    stars.push(<Star key={stars.length} className="text-gray-300" style={{ width: size, height: size }} />);
  }
  
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export default function ProductDetailClient({ product }: Props) {
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  const currentPrice = selectedVariant !== null && product.variants?.[selectedVariant]?.price 
    ? product.variants[selectedVariant].price 
    : product.price;

  const handleAddToCart = () => {
    if (!product.inStock || isAdding) return;
    setIsAdding(true);
    
    const variantName = selectedVariant !== null && product.variants?.[selectedVariant] 
      ? ` - ${product.variants[selectedVariant].name}` 
      : '';
    
    addItem({
      id: product._id + (selectedVariant !== null ? `-${selectedVariant}` : ''),
      name: product.name + variantName,
      price: currentPrice!,
      image: product.image,
    }, quantity);
    
    toast.success("Added to cart!", {
      description: `${quantity}x ${product.name}${variantName}`,
    });
    
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="p-6 lg:p-8 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200">
          {/* Main Image */}
          <div className="relative aspect-square bg-white rounded-xl overflow-hidden mb-4 group">
            {product.images.length > 0 ? (
              <>
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-4"
                  priority
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
            
            {/* Discount Badge */}
            {product.discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{product.discountPercent}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImage 
                      ? "border-blue-600 ring-2 ring-blue-100" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - Image ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 lg:p-8">
          {/* Category & SKU */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            {product.category && (
              <Link 
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="hover:text-blue-600 transition-colors"
              >
                {product.category}
              </Link>
            )}
            {product.category && product.subcategory && <span>•</span>}
            {product.subcategory && (
              <Link 
                href={`/products?category=${encodeURIComponent(product.category || '')}&subcategory=${encodeURIComponent(product.subcategory)}`}
                className="hover:text-blue-600 transition-colors"
              >
                {product.subcategory}
              </Link>
            )}
            {product.sku && (
              <>
                <span className="ml-auto text-gray-400">SKU:</span>
                <span className="font-mono text-gray-600">{product.sku}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          {typeof product.rating !== 'undefined' && (
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating} maxRating={product.maxRating} />
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)} ({product.ratingCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-blue-600">
              {formatBDT(currentPrice!)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatBDT(product.originalPrice)}
                </span>
                <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">
                  Save {formatBDT(product.originalPrice - currentPrice!)}
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 mb-6">
            {product.inStock ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">In Stock</span>
                {typeof product.stock !== 'undefined' && product.stock <= 10 && (
                  <span className="text-orange-500 text-sm">
                    (Only {product.stock} left)
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-500 text-xs">✕</span>
                </div>
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Variant
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(selectedVariant === idx ? null : idx)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedVariant === idx
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {variant.name}
                    {variant.price && <span className="ml-1 text-gray-500">({formatBDT(variant.price)})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                disabled={typeof product.stock !== 'undefined' && quantity >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdding}
              className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isAdding ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>

            <button
              onClick={() => {
                setIsWishlisted(!isWishlisted);
                toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
              }}
              className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${
                isWishlisted
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "border-gray-300 hover:border-gray-400 text-gray-600"
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
            </button>

            <button
              onClick={handleShare}
              className="w-12 h-12 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center justify-center text-gray-600 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                <p className="text-xs text-gray-500">Orders over ৳5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Warranty</p>
                <p className="text-xs text-gray-500">Quality guarantee</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                <p className="text-xs text-gray-500">7-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Secure</p>
                <p className="text-xs text-gray-500">100% Original</p>
              </div>
            </div>
          </div>

          {/* Buy from other markets */}
          {product.markets && product.markets.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Also available on:
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.markets.map((market, idx) => (
                  <a
                    key={idx}
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    {market.name}
                    {market.price && <span className="text-gray-500">({formatBDT(market.price)})</span>}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Specifications Tabs */}
      {(product.description || (product.specifications && Object.keys(product.specifications).length > 0)) && (
        <div className="border-t border-gray-200">
          <div className="p-6 lg:p-8">
            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <div 
                  className="prose prose-gray max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value], idx) => (
                        <tr 
                          key={key} 
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 w-1/3 border-b border-gray-100">
                            {key}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Meta */}
            {product.createdAt && (
              <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                <p>Product ID: <span className="font-mono">{product._id}</span></p>
                <p>Added: {formatDate(product.createdAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
