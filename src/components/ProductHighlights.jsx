export default function ProductHighlights() {
  return (
    <section className="py-12 bg-white">
      <h2 className="text-2xl font-semibold text-center mb-8">Featured Products</h2>
      <ul className="flex flex-wrap gap-8 justify-center list-none p-0">
        <li className="w-64 bg-gray-50 rounded shadow p-4">
          <strong className="block mb-2">Arduino Uno R3</strong>
          <p>Perfect for prototyping and learning.</p>
        </li>
        <li className="w-64 bg-gray-50 rounded shadow p-4">
          <strong className="block mb-2">HC-SR04 Sensor</strong>
          <p>Reliable distance measurement for robots.</p>
        </li>
        <li className="w-64 bg-gray-50 rounded shadow p-4">
          <strong className="block mb-2">L298N Motor Driver</strong>
          <p>Control your motors with ease.</p>
        </li>
      </ul>
      <Link href="/products">
        <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">See All Products</button>
      </Link>
    </section>
  );
}
