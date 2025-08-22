import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Truck, ShieldCheck, Headphones, BadgeCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-900 text-white">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/hero2.png"
          alt="hero background"
          fill='true'
          sizes="80vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="relative container mx-auto px-6 py-16 md:py-24 text-center">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs tracking-wide ring-1 ring-white/20 mb-4">
          Your robotics parts partner
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Build smarter with quality robotics components
        </h1>
        <p className="mt-4 text-lg text-zinc-300 max-w-2xl mx-auto">
          Sensors, batteries, microcontrollers, and more—curated for makers, students, and pros.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-white text-zinc-900 hover:bg-white/90">
            <Link href="/products?filter=deals">Browse Deals</Link>
          </Button>
        </div>
        <div className="mt-6 text-sm text-zinc-300">
          Popular: <Link className="underline hover:text-white" href="/products">Sensors</Link> ·
          {" "}
          <Link className="underline hover:text-white" href="/products">Arduino</Link> ·
          {" "}
          <Link className="underline hover:text-white" href="/products">Batteries</Link>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <Truck className="size-5 text-blue-400" />
            <span className="text-sm">Fast Shipping</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <ShieldCheck className="size-5 text-blue-400" />
            <span className="text-sm">Trusted Quality</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <Headphones className="size-5 text-blue-400" />
            <span className="text-sm">Expert Support</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <BadgeCheck className="size-5 text-blue-400" />
            <span className="text-sm">Great Value</span>
          </div>
        </div>
      </div>
    </section>
  );
}
