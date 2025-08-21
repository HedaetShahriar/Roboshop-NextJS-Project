export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-12 text-center shadow-sm">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Welcome to Roboshop</h1>
      <p className="text-lg text-slate-600 mb-6">Your one-stop shop for robotics equipment: sensors, batteries, microcontrollers, motors, and more.</p>
      <a href="/products" className="inline-block mt-2 px-8 py-3 text-lg rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">Shop Now</a>
    </section>
  );
}
