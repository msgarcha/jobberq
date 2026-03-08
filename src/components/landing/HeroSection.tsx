import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Star } from "lucide-react";

const heroImages = [
  { src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=500&fit=crop&crop=faces", label: "Landscaping", name: "Marcus T." },
  { src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=500&fit=crop&crop=faces", label: "Plumbing", name: "Sarah K." },
  { src: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=500&fit=crop&crop=faces", label: "Electrical", name: "James R." },
  { src: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=500&fit=crop&crop=faces", label: "Painting", name: "David L." },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=500&fit=crop&crop=faces", label: "Cleaning", name: "Maria G." },
  { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=500&fit=crop&crop=faces", label: "Roofing", name: "Chris W." },
];

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden" style={{ background: "hsl(195 55% 10%)" }}>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(hsl(170 50% 55%) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left – Copy */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium border" style={{ borderColor: "hsl(170 50% 55% / 0.3)", color: "hsl(170 50% 55%)", background: "hsl(170 50% 55% / 0.08)" }}>
              <Star className="h-3 w-3 fill-current" /> Rated 4.9/5 by 2,000+ service pros
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight leading-[1.08] font-display" style={{ color: "hsl(40 23% 96%)" }}>
              Your craft deserves{" "}
              <span style={{ color: "hsl(170 50% 55%)" }}>better than paperwork</span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0" style={{ color: "hsl(195 15% 65%)" }}>
              Quotes, invoices, scheduling, and payments — beautifully simple. Built for every trade, from landscapers to electricians.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button size="lg" onClick={() => navigate("/login")} className="text-base px-8 gap-2 h-12 rounded-xl">
                Start Your Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="text-base px-8 h-12 rounded-xl border-white/20 hover:bg-white/5"
                style={{ color: "hsl(195 15% 75%)" }}
              >
                See How It Works
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 text-xs" style={{ color: "hsl(195 15% 55%)" }}>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                No credit card required
              </span>
            </div>
          </div>

          {/* Right – Photo mosaic */}
          <div className="hidden lg:grid grid-cols-3 grid-rows-2 gap-3 h-[420px]">
            {heroImages.map((img, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden group"
                style={{ transform: i % 2 === 0 ? "translateY(8px)" : "translateY(-8px)" }}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={i < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-xs font-semibold">{img.name}</p>
                  <p className="text-white/70 text-[10px]">{img.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
