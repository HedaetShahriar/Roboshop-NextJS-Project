export default function ProductDetails({ params }) {
  const product = products.find((p) => p.id === params.id);
  if (!product) return <div className="text-center py-16">Product not found.</div>;
  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
      <p className="mb-2">{product.description}</p>
      <p className="mb-2"><strong>Category:</strong> {product.category}</p>
      <p className="mb-2"><strong>Price:</strong> ${product.price}</p>
    </div>
  );
}
