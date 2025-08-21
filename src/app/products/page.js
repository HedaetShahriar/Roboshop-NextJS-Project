import Link from "next/link";
import products from "./products.json";

export default function ProductsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-8">Products</h2>
      <ul className="space-y-6">
        {products.map((product) => (
          <li key={product.id} className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="mb-2">{product.description}</p>
            <p className="mb-4"><strong>Price:</strong> ${product.price}</p>
            <Link href={`/products/${product.id}`}>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Details</button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
