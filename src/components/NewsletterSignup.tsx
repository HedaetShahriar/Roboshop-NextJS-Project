"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Radio, CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    // Simulate API call - in production, connect to your newsletter service
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubscribed(true);
    setIsSubmitting(false);
    toast.success("Welcome aboard! Check your inbox for a confirmation email.");
  };

  return (
    <section className="relative py-24 overflow-hidden bg-[#0a0f1a]">
      {/* Background effects */}
      <div className="absolute inset-0 circuit-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />

      {/* Animated circuit traces */}
      <div className="absolute top-1/4 left-0 right-0 h-px">
        <div className="h-full bg-linear-to-r from-transparent via-cyan-500/50 to-transparent trace-animate" />
      </div>
      <div className="absolute bottom-1/4 left-0 right-0 h-px">
        <div
          className="h-full bg-linear-to-r from-transparent via-emerald-500/30 to-transparent trace-animate"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Terminal-style card */}
          <div className="relative rounded-2xl bg-slate-900/80 border border-cyan-500/30 overflow-hidden backdrop-blur-sm">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-500 ml-2">
                newsletter://roboshop.subscribe
              </span>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 text-center">
              <div className="inline-flex items-center gap-2 text-sm font-mono text-cyan-400 mb-6 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Radio className="size-4" />
                <span>BROADCAST_CHANNEL</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Join the <span className="text-cyan-400">Maker Network</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg max-w-xl mx-auto">
                Get notified about new components, flash deals, and maker
                tutorials. Join 5,000+ makers who never miss an update.
              </p>

              {isSubscribed ? (
                <div className="flex items-center justify-center gap-3 text-white bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <CheckCircle2 className="size-6 text-emerald-400" />
                  <div className="text-left">
                    <span className="block text-lg font-medium text-emerald-400">
                      Connection Established!
                    </span>
                    <span className="text-sm text-slate-400">
                      Check your inbox for confirmation.
                    </span>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-xl font-mono"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="h-14 px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/25"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Subscribe
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}

              {/* Benefits */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-400" />
                  <span>Flash deal alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>No spam ever</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-cyan-400" />
                  <span>Unsubscribe anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Border lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent" />
    </section>
  );
}
