import Link from "next/link";
import getDb from "@/lib/mongodb";
import { getPlatformSettings } from "@/lib/settings";
import productsStatic from "@/data/product.json";
import ProductCard from "@/components/ProductCard";
import Hero from "@/components/Hero";
import { ChevronRight, Zap, Clock, Sparkles } from "lucide-react";
import type { Product, PlatformSettings } from "@/types";
import { CATEGORY_MAP, CATEGORY_LIST } from "@/data/categories";

interface HomepageSettings {
  showHero?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaHref?: string;
}

export default async function HomePage() {
  // Fetch a handful of products; fallback to static JSON if DB is empty/unavailable
  let highlightedProducts: Product[] = [];
  let onSaleProducts: Product[] = [];
  let newestProducts: Product[] = [];
  let settings: (PlatformSettings & { homepage?: HomepageSettings }) | null =
    null;
  try {
    const db = await getDb();
    settings = (await getPlatformSettings()) as PlatformSettings & {
      homepage?: HomepageSettings;
    };
    const all = await db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    const products = all.map((p) => ({
      ...p,
      _id: p._id.toString(),
    })) as Product[];
    const discounted = products.filter(
      (p) => p.has_discount_price && Number(p.discount_price) > 0,
    );
    highlightedProducts = (discounted.length ? discounted : products).slice(
      0,
      8,
    );
    onSaleProducts = discounted.slice(0, 8);
    newestProducts = products.slice(0, 8);
  } catch {
    // ignore and fallback below
  }
  if (!highlightedProducts.length) {
    const staticProducts = productsStatic as unknown as Product[];
    const discounted = staticProducts.filter(
      (p) => p.has_discount_price && Number(p.discount_price) > 0,
    );
    const source = discounted.length ? discounted : staticProducts;
    highlightedProducts = source.slice(0, 8);
    onSaleProducts = discounted.slice(0, 8);
    newestProducts = staticProducts.slice(0, 8);
  }
  const homepage = settings?.homepage || null;

  // Featured categories with images
  const featuredCategories = [
    {
      name: "Arduino",
      image:
        "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=300&h=200&fit=crop",
      count: "200+ Products",
    },
    {
      name: "Raspberry Pi",
      image:
        "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=300&h=200&fit=crop",
      count: "150+ Products",
    },
    {
      name: "Sensors",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop",
      count: "300+ Products",
    },
    {
      name: "Motors",
      image:
        "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=300&h=200&fit=crop",
      count: "100+ Products",
    },
    {
      name: "Displays",
      image:
        "https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6?w=300&h=200&fit=crop",
      count: "80+ Products",
    },
    {
      name: "Tools",
      image:
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop",
      count: "120+ Products",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {homepage?.showHero !== false && <Hero />}

      {/* Category Cards */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {category.count}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Featured Products
                </h2>
                <p className="text-sm text-gray-500">
                  Hand-picked components that makers love
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {highlightedProducts.slice(0, 8).map((product) => (
              <ProductCard key={String(product._id)} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Products
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* On Sale Section */}
      {onSaleProducts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Flash Deals
                  </h2>
                  <p className="text-sm text-gray-500">
                    Don&apos;t miss these amazing offers!
                  </p>
                </div>
              </div>
              <Link
                href="/products?has_discount=true"
                className="hidden sm:flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                View All Deals
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {onSaleProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={String(product._id) || product.slug}
                  product={product}
                />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products?has_discount=true"
                className="inline-flex items-center gap-1 px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                View All Deals
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newestProducts.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    New Arrivals
                  </h2>
                  <p className="text-sm text-gray-500">
                    Fresh stock just landed
                  </p>
                </div>
              </div>
              <Link
                href="/products?sort=newest"
                className="hidden sm:flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                See All New
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newestProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={String(product._id) || product.slug}
                  product={product}
                />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/products?sort=newest"
                className="inline-flex items-center gap-1 px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                See All New Arrivals
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-blue-100 mb-8">
              Get updates on new products, special offers, and robotics tips
              delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-12 px-4 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                className="h-12 px-8 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Browse All Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse All Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORY_LIST.slice(0, 18).map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${encodeURIComponent(cat)}`}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Categories
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
