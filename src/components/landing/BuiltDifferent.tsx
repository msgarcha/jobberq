import { Users, Brain, Star } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const cards = [
  {
    icon: Users,
    title: "No per-user fees. Ever.",
    description:
      "Add your entire crew without watching your bill climb. Most platforms charge $15–30 per team member. We don't.",
    accent: "from-primary/10 to-primary/5",
  },
  {
    icon: Brain,
    title: "AI-powered smart scheduling",
    description:
      "Our scheduler learns from your job history — optimizing routes, predicting durations, and reducing windshield time automatically.",
    accent: "from-warm-gold/10 to-warm-gold/5",
  },
  {
    icon: Star,
    title: "One-click review collection",
    description:
      "Automatically send review requests after completed jobs. Smart gating routes happy clients to Google, keeps feedback private otherwise.",
    accent: "from-status-success/10 to-status-success/5",
  },
];

export default function BuiltDifferent() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">
            Built different
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display">
            Features they charge extra for?{" "}
            <span className="text-primary">We include them.</span>
          </h2>
        </div>

        <div className="space-y-6">
          {cards.map((card, i) => (
            <div
              key={card.title}
              className={`flex flex-col sm:flex-row items-start gap-6 sm:gap-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${card.accent} border border-border/40 shadow-warm transition-all duration-700 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="h-14 w-14 rounded-xl bg-card shadow-warm-md flex items-center justify-center shrink-0">
                <card.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold font-display">
                  {card.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
