import { notFound } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function ProductDetailPage({ params }) {
  const { id } =await params;
  const client = await clientPromise;
  const db = client.db("roboshop");
  
  let productData;
  try {
    productData = await db.collection("products").findOne({ _id: new ObjectId(id) });
  } catch (error) {
    notFound();
  }

  if (!productData) {
    notFound();
  }

  const product = { ...productData, _id: productData._id.toString() };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
        <p className="text-2xl font-semibold text-blue-600 mb-6">${product.price.toFixed(2)}</p>
        <p className="text-gray-700 text-lg mb-4">{product.description}</p>
        <div className="text-md text-gray-500 mt-6 border-t pt-4">
          <p><strong>Product ID:</strong> {product._id}</p>
          <p><strong>Added On:</strong> {new Date(product.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}