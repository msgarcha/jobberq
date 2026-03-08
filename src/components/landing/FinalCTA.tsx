import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1400&h=600&fit=crop&crop=faces"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsl(195 55% 10% / 0.88), hsl(195 55% 10% / 0.95))" }} />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(hsl(170 50% 55%) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

      <div className="relative max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight" style={{ color: "hsl(40 23% 96%)" }}>
          Your clients are waiting.{" "}
          <span className="block" style={{ color: "hsl(170 50% 55%)" }}>Your paperwork shouldn't be.</span>
        </h2>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "hsl(195 15% 65%)" }}>
          Join thousands of service professionals who switched to ServicePro and never looked back.
        </p>
        <Button size="lg" onClick={() => navigate("/login")} className="text-base px-10 h-12 rounded-xl gap-2">
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
