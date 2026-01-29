"use client";

import Link from "next/link";
import {
  Cpu,
  Radio,
  Gauge,
  Monitor,
  Wrench,
  Microchip,
  Cog,
  Package,
  type LucideIcon,
  ChevronRight,
  Terminal,
} from "lucide-react";

interface CategoryItem {
  name: string;
  icon: LucideIcon;
  href: string;
  accentColor: string;
  glowColor: string;
  description: string;
  itemCount: string;
}

const categories: CategoryItem[] = [
  {
    name: "Development Boards",
    icon: Cpu,
    href: "/products?category=Development+Board",
    accentColor: "text-cyan-400 border-cyan-500/30 hover:border-cyan-400/60",
    glowColor: "group-hover:shadow-cyan-500/20",
    description: "Arduino, ESP32, Raspberry Pi",
    itemCount: "250+",
  },
  {
    name: "Sensors",
    icon: Gauge,
    href: "/products?category=Sensor",
    accentColor:
      "text-emerald-400 border-emerald-500/30 hover:border-emerald-400/60",
    glowColor: "group-hover:shadow-emerald-500/20",
    description: "Temperature, Motion, Light",
    itemCount: "400+",
  },
  {
    name: "Robotics",
    icon: Cog,
    href: "/products?category=Robotics",
    accentColor:
      "text-orange-400 border-orange-500/30 hover:border-orange-400/60",
    glowColor: "group-hover:shadow-orange-500/20",
    description: "Motors, Drivers, Controllers",
    itemCount: "350+",
  },
  {
    name: "Displays",
    icon: Monitor,
    href: "/products?category=Display",
    accentColor:
      "text-violet-400 border-violet-500/30 hover:border-violet-400/60",
    glowColor: "group-hover:shadow-violet-500/20",
    description: "LCD, OLED, LED Panels",
    itemCount: "180+",
  },
  {
    name: "Wireless",
    icon: Radio,
    href: "/products?category=Wireless",
    accentColor: "text-blue-400 border-blue-500/30 hover:border-blue-400/60",
    glowColor: "group-hover:shadow-blue-500/20",
    description: "WiFi, Bluetooth, RF Modules",
    itemCount: "200+",
  },
  {
    name: "Microcontrollers",
    icon: Microchip,
    href: "/products?category=Microcontroller",
    accentColor: "text-rose-400 border-rose-500/30 hover:border-rose-400/60",
    glowColor: "group-hover:shadow-rose-500/20",
    description: "AVR, PIC, ARM MCUs",
    itemCount: "150+",
  },
  {
    name: "Basic Components",
    icon: Wrench,
    href: "/products?category=Basic+Component",
    accentColor: "text-amber-400 border-amber-500/30 hover:border-amber-400/60",
    glowColor: "group-hover:shadow-amber-500/20",
    description: "Resistors, Capacitors, LEDs",
    itemCount: "500+",
  },
  {
    name: "Kits",
    icon: Package,
    href: "/products?category=Kits",
    accentColor: "text-pink-400 border-pink-500/30 hover:border-pink-400/60",
    glowColor: "group-hover:shadow-pink-500/20",
    description: "Starter, Robotic, Science",
    itemCount: "80+",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="py-20 bg-[#0a0f1a] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 circuit-pattern opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-sm font-mono text-cyan-400 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Terminal className="size-4" />
            <span>COMPONENT_CATEGORIES</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Browse Our <span className="text-cyan-400">Tech Arsenal</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg">
            From basic components to advanced development boards — everything
            you need to bring your projects to life.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={category.href}
                className={`group relative flex flex-col p-6 rounded-xl bg-slate-800/50 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl backdrop-blur-sm ${category.accentColor} ${category.glowColor}`}
              >
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div
                    className={`absolute top-0 right-0 w-px h-8 ${category.accentColor.split(" ")[0].replace("text-", "bg-")} opacity-50`}
                  />
                  <div
                    className={`absolute top-0 right-0 w-8 h-px ${category.accentColor.split(" ")[0].replace("text-", "bg-")} opacity-50`}
                  />
                </div>

                {/* Icon */}
                <div
                  className={`size-14 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${category.accentColor.split(" ")[0]}`}
                >
                  <Icon className="size-7" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  {category.description}
                </p>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between">
                  <span
                    className={`text-xs font-mono ${category.accentColor.split(" ")[0]}`}
                  >
                    {category.itemCount} items
                  </span>
                  <ChevronRight className="size-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Browse All Link */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span className="font-mono">{">"}</span>
            View all 2,500+ components
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />
    </section>
  );
}
