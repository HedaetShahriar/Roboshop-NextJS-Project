export default function Navbar() {
    return (
        <nav className="flex justify-between items-center px-6 py-4 bg-blue-700 text-white">
            <div className="font-bold text-2xl">
                <Link href="/">Roboshop</Link>
            </div>
            <div className="flex gap-6">
                <Link href="/products" className="hover:underline">Products</Link>
                <Link href="/dashboard/add-product" className="hover:underline">Add Product</Link>
                <Link href="/login" className="hover:underline">Login</Link>
            </div>
        </nav>
    );
}