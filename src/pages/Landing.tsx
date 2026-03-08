import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Receipt,
  Briefcase,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";

const features = [
  { icon: Users, title: "Client Management", desc: "Track contacts, properties, and communication history in one place." },
  { icon: FileText, title: "Quotes & Estimates", desc: "Create professional quotes, send to clients, and convert to jobs with one click." },
  { icon: Receipt, title: "Invoicing & Payments", desc: "Generate invoices, accept online payments via Stripe, and track every dollar." },
  { icon: Briefcase, title: "Job Tracking", desc: "Schedule, assign, and monitor jobs from start to finish." },
  { icon: Calendar, title: "Scheduling", desc: "Visual calendar for your team's daily, weekly, and monthly schedule." },
  { icon: BarChart3, title: "Reports & Insights", desc: "Revenue, outstanding balances, and business health at a glance." },
];

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

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              SP
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              ServicePro
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button size="sm" onClick={() => navigate("/login")} className="gap-1">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="text-xs px-3 py-1 gap-1.5">
            <Zap className="h-3 w-3" /> 14-day free trial — no credit card required
          </Badge>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Run your service business{" "}
            <span className="text-primary">like a pro</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Quotes, invoices, jobs, scheduling, and payments — all in one place.
            Built for contractors, landscapers, cleaners, and every service agency in between.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => navigate("/login")} className="text-base px-8 gap-2">
              Start Your Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8">
              View Pricing
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-2 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure & encrypted</span>
            <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> No credit card needed</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything you need to grow
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              From first client contact to final payment — ServicePro handles the entire workflow.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="shadow-warm hover:shadow-warm-md transition-shadow border-border/50">
                <CardContent className="p-6 space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground mt-2">Start free for 14 days. Upgrade when you're ready.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative shadow-warm hover:shadow-warm-md transition-shadow ${
                  tier.popular ? "border-primary ring-2 ring-primary/20" : "border-border/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8 space-y-5">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.desc}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{tier.price}</span>
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
                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => navigate("/login")}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to streamline your business?
          </h2>
          <p className="text-muted-foreground">
            Join thousands of service professionals using ServicePro to save time and get paid faster.
          </p>
          <Button size="lg" onClick={() => navigate("/login")} className="text-base px-8 gap-2">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">SP</div>
            <span className="font-medium text-foreground">ServicePro</span>
          </div>
          <p>© {new Date().getFullYear()} ServicePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
