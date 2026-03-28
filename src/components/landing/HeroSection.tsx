import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Star } from "lucide-react";

const columnOneImages = [
  { src: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600&h=800&fit=crop&crop=faces", label: "Landscaping", name: "Marcus T." },
  { src: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&h=800&fit=crop&crop=center", label: "Roofing", name: "Chris W." },
  { src: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=800&fit=crop&crop=faces", label: "Plumbing", name: "Sarah K." },
  { src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=800&fit=crop&crop=faces", label: "Cleaning", name: "Maria G." },
  { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=800&fit=crop&crop=faces", label: "Carpentry", name: "Tom B." },
];

const columnTwoImages = [
  { src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=800&fit=crop&crop=faces", label: "Electrical", name: "James R." },
  { src: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&h=800&fit=crop&crop=faces", label: "Painting", name: "David L." },
  { src: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=800&fit=crop&crop=faces", label: "HVAC", name: "Kevin P." },
  { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=800&fit=crop&crop=faces", label: "Property Mgmt", name: "Lisa H." },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=800&fit=crop&crop=center", label: "Pressure Wash", name: "Ryan S." },
];

function ScrollColumn({ images, direction }: { images: typeof columnOneImages; direction: "up" | "down" }) {
  const animClass = direction === "up" ? "animate-scroll-up" : "animate-scroll-down";
  const doubled = [...images, ...images];

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl">
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-16 z-10" style={{ background: "linear-gradient(to bottom, hsl(195 55% 10%), transparent)" }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-10" style={{ background: "linear-gradient(to top, hsl(195 55% 10%), transparent)" }} />

      <div className={`flex flex-col gap-4 ${animClass} ticker-pause`}>
        {doubled.map((img, i) => (
          <div key={i} className="relative w-full h-[320px] rounded-2xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
            <img
              src={img.src}
              alt={img.label}
              className="w-full h-full object-cover"
              loading={i < 3 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm font-semibold">{img.name}</p>
              <p className="text-white/80 text-xs">{img.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden" style={{ background: "hsl(var(--sidebar-background))" }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(hsl(var(--sidebar-primary)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left – Copy */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium border border-sidebar-primary/40 bg-sidebar-primary/15" style={{ color: "hsl(var(--sidebar-primary))" }}>
              <Star className="h-3 w-3 fill-current" /> Rated 4.9/5 by 2,000+ service pros
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] xl:text-[4.25rem] font-bold tracking-tight leading-[1.08] text-white">
              Your craft deserves{" "}
              <span style={{ color: "#00C9A7" }}>better than paperwork</span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 text-white/75">
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
                className="text-base px-8 h-12 rounded-xl border-white/20 hover:bg-white/5 text-white/90"
              >
                See How It Works
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                No credit card required
              </span>
            </div>
          </div>

          {/* Right – Scrolling Mosaic (desktop) */}
          <div className="hidden lg:block relative">
            {/* Teal glow behind columns */}
            <div className="absolute -inset-4 rounded-3xl" style={{ background: "radial-gradient(ellipse at center, hsl(170 50% 55% / 0.12), transparent 70%)" }} />
            <div className="relative grid grid-cols-2 gap-4">
              <ScrollColumn images={columnOneImages} direction="up" />
              <ScrollColumn images={columnTwoImages} direction="down" />
            </div>
          </div>

          {/* Mobile horizontal scroll */}
          <div className="flex lg:hidden gap-3 overflow-hidden">
            <div className="flex gap-3 animate-scroll-horizontal ticker-pause">
              {[...columnOneImages, ...columnTwoImages, ...columnOneImages, ...columnTwoImages].map((img, i) => (
                <div key={i} className="relative flex-shrink-0 w-[200px] h-[260px] rounded-2xl overflow-hidden ring-1 ring-white/10">
                  <img src={img.src} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-semibold">{img.name}</p>
                    <p className="text-white/80 text-[10px]">{img.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
