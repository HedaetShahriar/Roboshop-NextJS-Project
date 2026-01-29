import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/data/user/products";
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 60;

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ProductData {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  image?: string;
  gallery?: string[];
  category?: string;
  subcategory?: string;
  sku?: string;
  price?: number | string;
  discount_price?: number | string;
  has_discount_price?: boolean;
  current_stock?: number;
  product_rating?: number;
  product_max_rating?: number;
  product_rating_count?: number;
  specifications?: Record<string, string>;
  variants?: Array<{ name: string; price?: number; stock?: number }>;
  markets?: Array<{ name: string; url: string; price?: number }>;
  createdAt?: string | Date;
  [key: string]: unknown;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id) as ProductData | null;
  if (!product) return { title: "Product not found" };
  const title = product.name || "Product";
  const description = product.short_description || product.description || `Buy ${product.name} at RoboShop.`;
  const images = product.image ? [product.image] : [];
  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id) as ProductData | null;
  if (!product) notFound();
  
  const hasDiscount = product.has_discount_price && Number(product.discount_price) > 0;
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discount_price || 0);
  const finalPrice = hasDiscount ? discountPrice : price;
  const discountPercent = hasDiscount && price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const inStock = typeof product.current_stock !== 'undefined' ? product.current_stock > 0 : true;

  // Build gallery from main image + gallery array
  const images: string[] = [];
  if (product.image) images.push(product.image);
  if (product.gallery?.length) {
    product.gallery.forEach(img => {
      if (img && !images.includes(img)) images.push(img);
    });
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav aria-label="Breadcrumb" className="py-3 text-sm">
            <ol className="flex items-center gap-2 text-gray-500">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <Link href="/products" className="hover:text-blue-600 transition-colors">
                  Products
                </Link>
              </li>
              {product.category && (
                <>
                  <li className="text-gray-300">/</li>
                  <li>
                    <Link 
                      href={`/products?category=${encodeURIComponent(product.category)}`} 
                      className="hover:text-blue-600 transition-colors"
                    >
                      {product.category}
                    </Link>
                  </li>
                </>
              )}
              <li className="text-gray-300">/</li>
              <li className="text-gray-900 font-medium truncate max-w-[200px]">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-8">
        <ProductDetailClient 
          product={{
            _id: product._id,
            name: product.name,
            image: product.image,
            images,
            price: finalPrice,
            originalPrice: hasDiscount ? price : undefined,
            discountPercent,
            inStock,
            stock: product.current_stock,
            sku: product.sku,
            category: product.category,
            subcategory: product.subcategory,
            rating: product.product_rating,
            maxRating: product.product_max_rating || 5,
            ratingCount: product.product_rating_count || 0,
            description: product.description,
            shortDescription: product.short_description,
            specifications: product.specifications,
            variants: product.variants,
            markets: product.markets,
            createdAt: product.createdAt,
          }}
        />
      </div>

      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.short_description || product.description,
            image: images.length ? images : undefined,
            sku: product.sku || product._id,
            category: product.category,
            aggregateRating: typeof product.product_rating !== 'undefined' ? {
              "@type": "AggregateRating",
              ratingValue: Number(product.product_rating || 0),
              reviewCount: Number(product.product_rating_count || 0),
              bestRating: Number(product.product_max_rating || 5)
            } : undefined,
            offers: {
              "@type": "Offer",
              priceCurrency: "BDT",
              price: finalPrice,
              availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `/products/${product._id}`,
            }
          })
        }}
      />
    </main>
  );
}
