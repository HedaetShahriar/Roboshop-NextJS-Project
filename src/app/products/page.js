import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/data/user/products";
import ProductsFilters from "@/components/Products/ProductsFilters";

export const revalidate = 60;

export default async function ProductsPage({ searchParams }) {
  const all = await getAllProducts();

  const q = (searchParams?.q || "").toString().trim().toLowerCase();
  const sort = (searchParams?.sort || "relevance").toString();
  const category = (searchParams?.category || "").toString();
  const inStockOnly = ["1", "true", "yes"].includes((searchParams?.inStock || "").toString());

  let products = Array.isArray(all) ? [...all] : [];

  if (q) {
    products = products.filter(p => (p.name || "").toString().toLowerCase().includes(q));
  }
  if (category) {
    products = products.filter(p => {
      const cat = (p.category || p.product_category || "").toString();
      return cat === category;
    });
  }
  if (inStockOnly) {
    products = products.filter(p => Number(p.current_stock ?? 0) > 0);
  }

  if (sort === "price_asc") {
    products.sort((a, b) => Number(a.discount_price || a.price || 0) - Number(b.discount_price || b.price || 0));
  } else if (sort === "price_desc") {
    products.sort((a, b) => Number(b.discount_price || b.price || 0) - Number(a.discount_price || a.price || 0));
  } else if (sort === "rating") {
    products.sort((a, b) => Number(b.product_rating || 0) - Number(a.product_rating || 0));
  } else if (sort === "newest") {
    products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Our Products</h1>
      <ProductsFilters />
      {products.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p>No products found. Try adjusting filters.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id || product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}