import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { getProductById } from "@/data/user/products";
import { formatBDT } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
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
      type: "product",
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  const hasDiscount = product.has_discount_price && Number(product.discount_price) > 0;
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discount_price || 0);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:underline">Home</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/products" className="hover:underline">Products</Link></li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-foreground">{product.name}</li>
        </ol>
      </nav>
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {product.image && (
            <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden rounded-lg">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="text-2xl font-semibold mb-6">
              {hasDiscount ? (
                <span className="flex items-center gap-3">
                  <span className="text-red-600">{formatBDT(discountPrice)}</span>
                  <span className="line-through text-gray-400">{formatBDT(price)}</span>
                </span>
              ) : (
                <>{formatBDT(price)}</>
              )}
            </div>
            <ul className="space-y-2 text-gray-700">
              {typeof product.current_stock !== 'undefined' && (
                <li><strong>In stock:</strong> {product.current_stock}</li>
              )}
              {typeof product.product_rating !== 'undefined' && (
                <li><strong>Rating:</strong> {product.product_rating}/{product.product_max_rating || 5} ({product.product_rating_count || 0})</li>
              )}
            </ul>
            <div className="mt-6">
              <AddToCartButton
                id={product._id}
                name={product.name}
                price={hasDiscount ? discountPrice : price}
                image={product.image}
                disabled={typeof product.current_stock !== 'undefined' ? product.current_stock <= 0 : false}
                className="w-full md:w-auto"
              />
            </div>
            <div className="text-md text-gray-500 mt-6 border-t pt-4">
              <p><strong>Product ID:</strong> {product._id}</p>
              {product.createdAt && <p><strong>Added On:</strong> {formatDate(product.createdAt)}</p>}
            </div>
          </div>
        </div>
      </div>
      {/* Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.image ? [product.image] : undefined,
            sku: product._id,
            aggregateRating: typeof product.product_rating !== 'undefined' ? {
              "@type": "AggregateRating",
              ratingValue: Number(product.product_rating || 0),
              reviewCount: Number(product.product_rating_count || 0),
              bestRating: Number(product.product_max_rating || 5)
            } : undefined,
            offers: {
              "@type": "Offer",
              priceCurrency: "BDT",
              price: hasDiscount ? discountPrice : price,
              availability: (typeof product.current_stock !== 'undefined' ? product.current_stock > 0 : true) ?
                "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `/products/${product._id}`,
            }
          })
        }}
      />
    </div>
  );
}