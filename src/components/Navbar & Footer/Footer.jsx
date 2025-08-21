export default function Footer() {
  return (
    <footer className="text-center py-6 bg-gray-100 mt-12">
      <p className="mb-2">© 2025 Roboshop. All rights reserved.</p>
      <nav className="space-x-4">
        <Link href="/" className="hover:underline">Home</Link>
        <span>|</span>
        <Link href="/products" className="hover:underline">Products</Link>
        <span>|</span>
        <Link href="/dashboard/add-product" className="hover:underline">Add Product</Link>
      </nav>
    </footer>
  );
}
