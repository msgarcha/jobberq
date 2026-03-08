import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    desc: "For solo operators getting started.",
    features: ["Up to 50 clients", "Unlimited quotes & invoices", "Job scheduling", "Online payments", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    desc: "For growing service businesses.",
    features: ["Unlimited clients", "Team members (up to 5)", "Recurring invoices", "Custom branding", "Priority support", "Reports & analytics"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    price: "$149",
    period: "/mo",
    desc: "For agencies managing multiple crews.",
    features: ["Everything in Pro", "Unlimited team members", "Client portal", "API access", "Dedicated account manager", "Custom integrations"],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();
  const { ref, inView } = useInView();

  return (
    <section id="pricing" ref={ref} className="py-20 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-2">Start free for 14 days. Upgrade when you're ready.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {tiers.map((tier, i) => (
            <Card
              key={tier.name}
              className={`relative shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 ${
                tier.popular ? "border-primary ring-2 ring-primary/20" : "border-border/50"
              } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6 pt-8 space-y-5">
                <div>
                  <h3 className="font-semibold text-lg font-display">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-display">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
                <ul className="space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={tier.popular ? "default" : "outline"} onClick={() => navigate("/login")}>
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
