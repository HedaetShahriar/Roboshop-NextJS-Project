import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/data/user/products";
import ProductsFilters from "@/components/Products/ProductsFilters";
import type { Product } from "@/types";
import Link from "next/link";
import { CATEGORY_LIST } from "@/data/categories";
import { ChevronRight, Package, Truck, Shield, Headphones } from "lucide-react";

export const revalidate = 60;

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const all = await getAllProducts();

  const q = (resolvedParams?.q || "").toString().trim().toLowerCase();
  const sort = (resolvedParams?.sort || "relevance").toString();
  const category = (resolvedParams?.category || "").toString();
  const inStockOnly = ["1", "true", "yes"].includes(
    (resolvedParams?.inStock || "").toString(),
  );

  let products: Product[] = Array.isArray(all) ? [...all] : [];

  if (q) {
    products = products.filter((p) =>
      (p.name || "").toString().toLowerCase().includes(q),
    );
  }
  if (category) {
    products = products.filter((p) => {
      const cat = (p.category || "").toString();
      return cat === category;
    });
  }
  if (inStockOnly) {
    products = products.filter((p) => Number(p.current_stock ?? 0) > 0);
  }

  if (sort === "price_asc") {
    products.sort(
      (a, b) =>
        Number(a.discount_price || a.price || 0) -
        Number(b.discount_price || b.price || 0),
    );
  } else if (sort === "price_desc") {
    products.sort(
      (a, b) =>
        Number(b.discount_price || b.price || 0) -
        Number(a.discount_price || a.price || 0),
    );
  } else if (sort === "rating") {
    products.sort(
      (a, b) => Number(b.product_rating || 0) - Number(a.product_rating || 0),
    );
  } else if (sort === "newest") {
    products.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
  }

  // Get featured categories (first 10)
  const featuredCategories = CATEGORY_LIST.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="size-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Products</span>
            {category && (
              <>
                <ChevronRight className="size-4 text-gray-400" />
                <span className="text-blue-600 font-medium">{category}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-4">
              <div className="bg-blue-600 text-white px-4 py-3">
                <h2 className="font-semibold text-sm uppercase tracking-wide">
                  Menu Categories
                </h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {featuredCategories.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat)}`}
                      className={`block px-4 py-2.5 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 ${
                        category === cat
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/products"
                    className="block px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50"
                  >
                    View All Categories →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Promo Banner */}
            <div className="mt-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white hidden lg:block">
              <h3 className="font-bold mb-1">Free Shipping</h3>
              <p className="text-sm text-blue-100">On orders over ৳5000</p>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {category || "All Products"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {products.length} products found
                    {q && (
                      <span>
                        {" "}
                        for "<strong className="text-gray-700">{q}</strong>"
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <ProductsFilters />

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center mt-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Package className="size-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or search terms.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={String(product._id || product.slug)}
                    product={product}
                  />
                ))}
              </div>
            )}

            {/* Pagination placeholder */}
            {products.length > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-1">
                  <span className="px-4 py-2 text-sm text-gray-500">
                    Showing {products.length} products
                  </span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Truck className="size-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Free Shipping
                </h4>
                <p className="text-xs text-gray-500">Orders over ৳5000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="size-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Quality Products
                </h4>
                <p className="text-xs text-gray-500">Genuine items</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Package className="size-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Good Packaging
                </h4>
                <p className="text-xs text-gray-500">Safe delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Headphones className="size-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  24/7 Support
                </h4>
                <p className="text-xs text-gray-500">Contact anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
