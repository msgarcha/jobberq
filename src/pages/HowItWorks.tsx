import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Calendar, Receipt, CreditCard, CheckCircle2 } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Create & Send Quotes",
    description: "Build professional quotes in minutes. Add line items from your service catalog, apply deposits and discounts, then send with one click. Clients can approve online — no printing, scanning, or phone tag.",
    highlights: ["Custom branding & logo", "Deposit collection", "Client e-approval", "Convert to invoice instantly"],
  },
  {
    number: "02",
    icon: Calendar,
    title: "Schedule & Manage Jobs",
    description: "Turn approved quotes into scheduled jobs. Track status from pending to complete with your pipeline board. Your whole team sees today's schedule at a glance.",
    highlights: ["Drag-and-drop pipeline", "Team schedule view", "Job notes & addresses", "Status tracking"],
  },
  {
    number: "03",
    icon: Receipt,
    title: "Invoice & Track Payments",
    description: "Generate invoices from completed jobs or create them from scratch. Track sent, viewed, and overdue statuses in real time. Set up recurring invoices for repeat clients.",
    highlights: ["Auto-generate from quotes", "Payment tracking", "Recurring invoices", "Overdue reminders"],
  },
  {
    number: "04",
    icon: CreditCard,
    title: "Get Paid Fast",
    description: "Accept credit cards, ACH, and online payments through Stripe. Clients pay from a branded payment link — no app download needed. Money hits your bank account in days, not weeks.",
    highlights: ["Online payment links", "Stripe integration", "Save cards on file", "Automatic receipts"],
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="relative py-20 sm:py-28 text-center px-4" style={{ background: "hsl(var(--sidebar-background))" }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(hsl(var(--sidebar-primary)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            How <span style={{ color: "#00C9A7" }}>QuickLinq</span> Works
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            From first quote to final payment — four simple steps to run your service business like a pro.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="space-y-16 sm:space-y-24">
          {steps.map((step, i) => (
            <div key={step.number} className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-16 items-center`}>
              {/* Icon / Visual */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
                  </div>
                  <span className="absolute -top-3 -left-3 text-6xl sm:text-7xl font-bold text-primary/10 font-display select-none">{step.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">{step.title}</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">{step.description}</p>
                <ul className="mt-6 grid grid-cols-2 gap-2 max-w-md mx-auto lg:mx-0">
                  {step.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 text-center px-4" style={{ background: "hsl(var(--sidebar-background))" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
            Ready to streamline your business?
          </h2>
          <p className="mt-4 text-white/70 text-lg">Start your 14-day free trial. No credit card required.</p>
          <Button size="lg" onClick={() => navigate("/login")} className="mt-8 text-base px-8 gap-2 h-12 rounded-xl">
            Start Your Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
