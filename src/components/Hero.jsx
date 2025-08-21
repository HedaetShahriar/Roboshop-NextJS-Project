export default function Hero() {
  return (
    <section className="py-16 text-center bg-blue-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Roboshop</h1>
      <p className="text-lg mb-6">Your one-stop shop for robotics equipment: sensors, batteries, microcontrollers, motors, and more!</p>
      <Link href="/products">
        <button className="mt-4 px-8 py-3 text-lg bg-blue-600 text-white rounded hover:bg-blue-700 transition">Shop Now</button>
      </Link>
    </section>
  );
}
