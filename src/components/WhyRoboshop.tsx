import {
  Award,
  Headphones,
  Shield,
  Truck,
  CheckCircle2,
  Cpu,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Lightning Fast Shipping",
    description:
      "Get your components delivered quickly with real-time tracking. Most orders ship within 24 hours.",
    highlights: ["24-48h delivery", "Live tracking", "Secure packaging"],
    color: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgGlow: "bg-cyan-500/10",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description:
      "Every component is tested and comes with warranty. We source only from trusted manufacturers.",
    highlights: ["Genuine parts", "Full warranty", "Quality tested"],
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgGlow: "bg-emerald-500/10",
  },
  {
    icon: Headphones,
    title: "Expert Tech Support",
    description:
      "Our electronics experts are here to help with component selection, compatibility, and project guidance.",
    highlights: ["Technical help", "Fast response", "Project guidance"],
    color: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgGlow: "bg-violet-500/10",
  },
  {
    icon: Award,
    title: "Best Value Pricing",
    description:
      "Competitive prices with regular flash deals. Get the best value for your maker projects.",
    highlights: ["Best prices", "Flash deals", "Bulk discounts"],
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgGlow: "bg-amber-500/10",
  },
];

export default function WhyRoboshop() {
  return (
    <section className="py-20 bg-[#0d1321] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-sm font-mono text-cyan-400 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <Cpu className="size-4" />
            <span>WHY_ROBOSHOP</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Built for <span className="text-cyan-400">Makers</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg">
            We understand what makers need. Quality parts, fast delivery, and
            support when you need it.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group relative rounded-2xl bg-slate-900/50 border ${feature.borderColor} p-8 hover:border-opacity-70 transition-all duration-300 backdrop-blur-sm overflow-hidden`}
              >
                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity blur-2xl`}
                />

                {/* Corner decoration */}
                <div className="absolute top-0 right-0 w-20 h-20">
                  <div
                    className={`absolute top-4 right-4 w-12 h-px ${feature.color.replace("text-", "bg-")} opacity-30`}
                  />
                  <div
                    className={`absolute top-4 right-4 w-px h-12 ${feature.color.replace("text-", "bg-")} opacity-30`}
                  />
                </div>

                <div className="relative">
                  {/* Icon */}
                  <div
                    className={`size-14 rounded-xl ${feature.bgGlow} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border ${feature.borderColor}`}
                  >
                    <Icon className="size-7" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div
                          className={`size-5 rounded-md ${feature.bgGlow} flex items-center justify-center`}
                        >
                          <CheckCircle2
                            className={`size-3.5 ${feature.color}`}
                          />
                        </div>
                        <span className="text-slate-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Index number */}
                  <div
                    className={`absolute bottom-0 right-0 text-6xl font-bold ${feature.color} opacity-5 font-mono`}
                  >
                    0{idx + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <Zap className="size-4 text-amber-400" />
            <span>
              Ready to start building? Explore our collection of 2,500+
              components.
            </span>
          </div>
        </div>
      </div>

      {/* Border lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-700 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-700 to-transparent" />
    </section>
  );
}
