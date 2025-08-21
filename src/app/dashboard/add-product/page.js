export default async function AddProductPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  async function addProduct(formData) {
    "use server";
    // In a real app, save to DB. Here, just log.
    console.log("New product:", Object.fromEntries(formData));
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
      <form action={addProduct} className="space-y-4">
        <input name="name" placeholder="Product Name" required className="w-full border rounded px-3 py-2" />
        <textarea name="description" placeholder="Description" required className="w-full border rounded px-3 py-2" />
        <input name="price" type="number" step="0.01" placeholder="Price" required className="w-full border rounded px-3 py-2" />
        <input name="category" placeholder="Category" required className="w-full border rounded px-3 py-2" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Add Product</button>
      </form>
    </div>
  );
}
