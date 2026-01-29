import { Package, Users, Star, Truck, Activity } from "lucide-react";

const stats = [
  {
    icon: Package,
    value: "2,500+",
    label: "Components",
    suffix: "SKUs",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    icon: Users,
    value: "10K+",
    label: "Makers",
    suffix: "served",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    icon: Star,
    value: "4.9",
    label: "Rating",
    suffix: "/ 5.0",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    icon: Truck,
    value: "24h",
    label: "Shipping",
    suffix: "avg",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
  },
];

export default function StatsSection() {
  return (
    <section className="py-20 bg-[#060a12] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-sm font-mono text-emerald-400 mb-4 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="size-4" />
            <span>SYSTEM_METRICS</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Trusted by <span className="text-cyan-400">10,000+ Makers</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-lg">
            Real-time stats from Bangladesh&apos;s fastest growing robotics
            store.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`relative group p-6 md:p-8 rounded-2xl bg-slate-900/50 border ${stat.borderColor} hover:border-opacity-60 transition-all duration-300 backdrop-blur-sm`}
              >
                {/* Glow effect on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity blur-xl`}
                />

                <div className="relative">
                  {/* Icon */}
                  <div
                    className={`size-12 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border ${stat.borderColor}`}
                  >
                    <Icon className="size-6" />
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      className={`text-4xl md:text-5xl font-bold font-mono ${stat.color}`}
                    >
                      {stat.value}
                    </span>
                    <span className="text-sm text-slate-500 font-mono">
                      {stat.suffix}
                    </span>
                  </div>

                  {/* Label */}
                  <div className="text-slate-400 font-medium">{stat.label}</div>

                  {/* Animated indicator */}
                  <div className="absolute top-4 right-4">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${stat.color.replace("text-", "bg-")} opacity-75`}
                      ></span>
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${stat.color.replace("text-", "bg-")}`}
                      ></span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-400" />
            <span>All systems operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-cyan-400" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-amber-400" />
            <span>SSL encrypted</span>
          </div>
        </div>
      </div>

      {/* Border lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-700 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-700 to-transparent" />
    </section>
  );
}
