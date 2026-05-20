import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, FileText, Briefcase, Receipt, Star, Sparkles,
  Calendar, CreditCard, Users, LayoutGrid, MessageSquare, ClipboardList,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import Seo from "@/components/Seo";

// --- Per-feature mini "dashboard clip" mockups (styled with semantic tokens) ---
function BrowserChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-warm-lg border border-border/50 bg-card">
      <div className="bg-muted/80 px-4 py-2.5 flex items-center gap-2 border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-warm-gold/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-status-success/60" />
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-background/60 rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center truncate">{url}</div>
        </div>
      </div>
      <div className="bg-background p-3 sm:p-4">{children}</div>
    </div>
  );
}

function PipelineClip() {
  const cols = [
    { name: "New Lead", count: 4, tone: "bg-muted" },
    { name: "Quoted", tone: "bg-primary/15", count: 6 },
    { name: "Scheduled", tone: "bg-warm-gold/20", count: 3 },
    { name: "Complete", tone: "bg-status-success/20", count: 8 },
  ];
  return (
    <BrowserChrome url="app.quicklinq.com/pipeline">
      <div className="grid grid-cols-4 gap-2">
        {cols.map((c) => (
          <div key={c.name} className="space-y-1.5">
            <div className={`${c.tone} rounded-md px-2 py-1 text-[9px] font-semibold text-foreground flex justify-between`}>
              <span>{c.name}</span><span className="opacity-70">{c.count}</span>
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-md p-1.5 space-y-0.5">
                <p className="text-[8px] font-medium text-foreground truncate">Job #{1200 + i}</p>
                <p className="text-[7px] text-muted-foreground truncate">Smith Residence</p>
                <p className="text-[7px] font-semibold text-primary">$1,{(i + 1) * 240}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function ReviewsClip() {
  return (
    <BrowserChrome url="app.quicklinq.com/reviews">
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-card border border-border/50 rounded-lg p-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Average rating</p>
            <p className="text-2xl font-bold font-display text-foreground">4.9</p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-warm-gold text-warm-gold" />
            ))}
          </div>
        </div>
        {[
          { name: "Sarah J.", body: "Quick, professional, and reasonably priced. Highly recommend!", stars: 5 },
          { name: "Mike R.", body: "Showed up on time and finished ahead of schedule.", stars: 5 },
        ].map((r) => (
          <div key={r.name} className="bg-card border border-border/50 rounded-md p-2">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold">{r.name}</p>
              <div className="flex gap-0.5">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-warm-gold text-warm-gold" />
                ))}
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground mt-0.5 leading-snug">{r.body}</p>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function QuotesClip() {
  return (
    <BrowserChrome url="app.quicklinq.com/quotes/Q-1042">
      <div className="space-y-2">
        <div className="flex justify-between items-start border-b border-border/50 pb-2">
          <div>
            <p className="text-[9px] text-muted-foreground">Quote #Q-1042</p>
            <p className="text-sm font-bold font-display">Johnson Residence</p>
          </div>
          <span className="bg-primary/15 text-primary text-[8px] px-2 py-0.5 rounded-full font-semibold">Sent</span>
        </div>
        {["Lawn mowing (weekly)", "Hedge trimming", "Mulch installation"].map((s, i) => (
          <div key={s} className="flex justify-between text-[9px]">
            <span className="text-foreground">{s}</span>
            <span className="font-semibold text-foreground">${(i + 1) * 120}.00</span>
          </div>
        ))}
        <div className="border-t border-border/50 pt-2 flex justify-between">
          <span className="text-[9px] font-semibold">Total</span>
          <span className="text-sm font-bold text-primary">$720.00</span>
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="flex-1 bg-primary text-primary-foreground text-[9px] font-medium rounded-md py-1.5 text-center">Approve</div>
          <div className="flex-1 bg-muted text-foreground text-[9px] font-medium rounded-md py-1.5 text-center">Download PDF</div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function InvoicesClip() {
  return (
    <BrowserChrome url="app.quicklinq.com/invoices">
      <div className="space-y-1.5">
        {[
          { id: "INV-2031", client: "Williams Co.", amount: "$1,450", status: "Paid", color: "bg-status-success/20 text-status-success" },
          { id: "INV-2030", client: "Oak Street", amount: "$890", status: "Viewed", color: "bg-primary/15 text-primary" },
          { id: "INV-2029", client: "Johnson", amount: "$620", status: "Overdue", color: "bg-destructive/15 text-destructive" },
          { id: "INV-2028", client: "Lee Plumbing", amount: "$2,100", status: "Sent", color: "bg-muted text-foreground" },
        ].map((inv) => (
          <div key={inv.id} className="flex items-center gap-2 bg-card border border-border/50 rounded-md p-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold truncate">{inv.id}</p>
              <p className="text-[8px] text-muted-foreground truncate">{inv.client}</p>
            </div>
            <span className="text-[9px] font-bold">{inv.amount}</span>
            <span className={`${inv.color} text-[7px] px-1.5 py-0.5 rounded-full font-semibold`}>{inv.status}</span>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function ScheduleClip() {
  return (
    <BrowserChrome url="app.quicklinq.com/schedule">
      <div className="grid grid-cols-5 gap-1 text-[8px]">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, di) => (
          <div key={d} className="space-y-1">
            <p className="text-center font-semibold text-muted-foreground">{d}</p>
            {Array.from({ length: 3 - (di % 2) }).map((_, i) => {
              const tones = ["bg-primary/20 text-primary", "bg-warm-gold/20 text-warm-gold", "bg-status-success/20 text-status-success"];
              const tone = tones[(di + i) % 3];
              return (
                <div key={i} className={`${tone} rounded p-1 leading-tight`}>
                  <p className="font-semibold truncate">9:00a</p>
                  <p className="truncate opacity-80">Job</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function AIClip() {
  return (
    <BrowserChrome url="app.quicklinq.com/assistant">
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
          <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <p className="text-[10px] font-semibold">Linq Assistant</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-[9px]">"Draft a quote for weekly lawn care, 2 acres, starting next Monday."</div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-[9px] space-y-1">
          <p className="font-semibold text-primary">Draft ready</p>
          <p className="text-muted-foreground leading-snug">3 line items · $1,240/mo · scheduled Mondays 9 AM</p>
          <div className="flex gap-1 pt-0.5">
            <span className="bg-primary text-primary-foreground text-[8px] px-2 py-0.5 rounded">Use this</span>
            <span className="bg-card border border-border text-[8px] px-2 py-0.5 rounded">Edit</span>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function PricingFormsClip() {
  return (
    <BrowserChrome url="quicklinq.app/book/acme-lawn">
      <div className="space-y-2">
        <p className="text-sm font-bold font-display">Get an instant quote</p>
        <div className="space-y-1.5">
          <div className="bg-muted/40 rounded-md p-2">
            <p className="text-[9px] text-muted-foreground">Lot size</p>
            <div className="flex gap-1 mt-1">
              {["Small", "Medium", "Large"].map((s, i) => (
                <span key={s} className={`text-[8px] px-2 py-0.5 rounded-full ${i === 1 ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>{s}</span>
              ))}
            </div>
          </div>
          <div className="bg-muted/40 rounded-md p-2">
            <p className="text-[9px] text-muted-foreground">Frequency</p>
            <p className="text-[10px] font-semibold mt-0.5">Bi-weekly</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex justify-between items-center">
            <span className="text-[9px] font-semibold text-foreground">Estimated total</span>
            <span className="text-sm font-bold text-primary">$185 / visit</span>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function ClientHubClip() {
  return (
    <BrowserChrome url="quicklinq.app/hub/johnson">
      <div className="space-y-2">
        <div className="border-b border-border/50 pb-1.5">
          <p className="text-[9px] text-muted-foreground">Welcome back,</p>
          <p className="text-sm font-bold font-display">Johnson Residence</p>
        </div>
        {[
          { label: "Active quote", value: "$720 · awaiting approval", color: "bg-primary/10 text-primary" },
          { label: "Next visit", value: "Mon, May 25 · 9:00 AM", color: "bg-warm-gold/15 text-warm-gold" },
          { label: "Open invoice", value: "$320 · due in 5 days", color: "bg-status-success/15 text-status-success" },
        ].map((row) => (
          <div key={row.label} className={`${row.color} rounded-md p-2`}>
            <p className="text-[8px] uppercase tracking-wide opacity-80">{row.label}</p>
            <p className="text-[10px] font-semibold mt-0.5">{row.value}</p>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function PaymentsClip() {
  return (
    <BrowserChrome url="quicklinq.app/pay/INV-2031">
      <div className="space-y-2">
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground">Amount due</p>
          <p className="text-2xl font-bold font-display text-foreground">$1,450.00</p>
        </div>
        <div className="bg-muted/40 rounded-md p-2 space-y-1">
          <p className="text-[8px] text-muted-foreground">Card number</p>
          <p className="text-[10px] font-mono tracking-wider">4242 4242 4242 4242</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-muted/40 rounded-md p-2"><p className="text-[8px] text-muted-foreground">Expires</p><p className="text-[10px] font-mono">05/28</p></div>
          <div className="bg-muted/40 rounded-md p-2"><p className="text-[8px] text-muted-foreground">CVC</p><p className="text-[10px] font-mono">•••</p></div>
        </div>
        <div className="bg-primary text-primary-foreground text-[10px] font-semibold rounded-md py-2 text-center">Pay $1,450.00</div>
      </div>
    </BrowserChrome>
  );
}

function ClientsClip() {
  return (
    <BrowserChrome url="app.quicklinq.com/clients">
      <div className="space-y-1.5">
        {[
          { name: "Johnson Residence", jobs: 12, balance: "$320" },
          { name: "Williams Co.", jobs: 8, balance: "Paid" },
          { name: "Oak Street Office", jobs: 24, balance: "$890" },
          { name: "Lee Plumbing", jobs: 4, balance: "Paid" },
        ].map((c) => (
          <div key={c.name} className="flex items-center gap-2 bg-card border border-border/50 rounded-md p-2">
            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold truncate">{c.name}</p>
              <p className="text-[8px] text-muted-foreground">{c.jobs} jobs</p>
            </div>
            <span className="text-[9px] font-semibold">{c.balance}</span>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

const features = [
  {
    id: "pipeline",
    icon: LayoutGrid,
    eyebrow: "Pipeline",
    title: "See every job at a glance",
    description: "A kanban board for your whole business. Drag jobs from lead to complete, spot bottlenecks instantly, and never let a quote slip through the cracks.",
    highlights: ["Drag-and-drop stages", "Color-coded statuses", "Mobile-friendly board", "Per-team filters"],
    Clip: PipelineClip,
  },
  {
    id: "quotes",
    icon: FileText,
    eyebrow: "Quotes",
    title: "Quotes that win the job",
    description: "Branded, professional quotes in under two minutes. Add line items from your catalog, include deposits, and let clients approve online with a single tap.",
    highlights: ["Custom branding", "Online e-approval", "Deposit collection", "Auto-convert to invoice"],
    Clip: QuotesClip,
  },
  {
    id: "jobs",
    icon: Briefcase,
    eyebrow: "Jobs",
    title: "Manage work from quote to complete",
    description: "Every approved quote becomes a job with addresses, notes, line items, and crew assignments. Track status in real time so nothing gets dropped.",
    highlights: ["Job notes & photos", "Crew assignments", "Status tracking", "One-click invoice"],
    Clip: ScheduleClip,
  },
  {
    id: "invoices",
    icon: Receipt,
    eyebrow: "Invoices",
    title: "Get paid faster",
    description: "Send polished invoices with payment links built in. Track sent, viewed, and overdue states in real time, and automate recurring billing for repeat clients.",
    highlights: ["Auto-recurring billing", "Real-time read receipts", "Overdue reminders", "Save cards on file"],
    Clip: InvoicesClip,
  },
  {
    id: "payments",
    icon: CreditCard,
    eyebrow: "Payments",
    title: "Accept cards, ACH, and tap-to-pay",
    description: "Powered by Stripe Connect. Your clients pay from a branded portal, you get paid in days — and you can charge saved cards yourself for repeat work.",
    highlights: ["Stripe Connect", "Saved cards on file", "Manual card entry", "Automatic receipts"],
    Clip: PaymentsClip,
  },
  {
    id: "reviews",
    icon: Star,
    eyebrow: "Reviews",
    title: "Reputation Shield review requests",
    description: "Send review requests automatically after a job. Happy clients are routed to Google. Unhappy ones go to you privately first — protecting your rating.",
    highlights: ["Auto-trigger after job", "Public/private routing", "Google review boost", "AI suggestions"],
    Clip: ReviewsClip,
  },
  {
    id: "ai",
    icon: Sparkles,
    eyebrow: "Linq AI",
    title: "AI built into every workflow",
    description: "Draft quotes, write review responses, summarize jobs, and surface insights — all from a single assistant trained on your business data.",
    highlights: ["Quote drafting", "Review responses", "Voice commands", "Smart suggestions"],
    Clip: AIClip,
  },
  {
    id: "pricing-forms",
    icon: ClipboardList,
    eyebrow: "Pricing Forms",
    title: "Let clients price themselves",
    description: "Embed a custom pricing form on your website. Clients answer a few questions and get an instant estimate — qualified leads land directly in your pipeline.",
    highlights: ["Drag-and-drop builder", "Instant estimates", "Lead capture", "Embed anywhere"],
    Clip: PricingFormsClip,
  },
  {
    id: "schedule",
    icon: Calendar,
    eyebrow: "Schedule",
    title: "A calendar your whole team trusts",
    description: "See today's, this week's, and this month's jobs by crew. Drag to reschedule, avoid conflicts, and share a clean schedule with everyone on the team.",
    highlights: ["Day/week/month views", "Per-crew filters", "Conflict detection", "Mobile sync"],
    Clip: ScheduleClip,
  },
  {
    id: "client-hub",
    icon: MessageSquare,
    eyebrow: "Client Hub",
    title: "A branded portal for every client",
    description: "Clients see their quotes, jobs, invoices, and payment history in one place — no login required. Less back-and-forth, fewer phone calls.",
    highlights: ["No-login access", "Quote approvals", "Invoice payments", "Visit history"],
    Clip: ClientHubClip,
  },
  {
    id: "clients",
    icon: Users,
    eyebrow: "Clients",
    title: "A CRM built for service work",
    description: "Every client gets a profile with properties, contacts, job history, balances, and notes. Search instantly and never lose context again.",
    highlights: ["Full job history", "Multiple properties", "Balance tracking", "Powerful search"],
    Clip: ClientsClip,
  },
];

export default function Features() {
  const navigate = useNavigate();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "QuickLinq Features",
      itemListElement: features.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: f.title,
        description: f.description,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://quicklinq.app/landing" },
        { "@type": "ListItem", position: 2, name: "Features", item: "https://quicklinq.app/features" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="QuickLinq Features — Pipeline, Quotes, Invoices, Reviews & AI"
        description="Explore every QuickLinq feature: pipeline kanban, branded quotes, online invoices, Stripe payments, review automation, AI assistant, scheduling, and more."
        path="/features"
        jsonLd={jsonLd}
      />
      <LandingNav />
      <main>
        {/* Hero */}
        <section className="relative py-20 sm:py-28 text-center px-4" style={{ background: "hsl(var(--sidebar-background))" }}>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(hsl(var(--sidebar-primary)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#00C9A7" }}>All Features</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Everything you need to run a <span style={{ color: "#00C9A7" }}>service business</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              One platform for quotes, jobs, invoices, payments, reviews, and AI — built for the way real service teams work.
            </p>
            <Button size="lg" onClick={() => navigate("/login")} className="mt-8 text-base px-8 gap-2 h-12 rounded-xl">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Feature sections */}
        <div>
          {features.map((f, i) => {
            const Clip = f.Clip;
            const reversed = i % 2 === 1;
            const bandBg = i % 2 === 0 ? "bg-background" : "bg-secondary/30";
            return (
              <section
                key={f.id}
                id={f.id}
                className={`${bandBg} border-t border-border/40 py-16 sm:py-24 px-4 sm:px-6`}
              >
                <div className={`max-w-6xl mx-auto flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 lg:gap-16 items-center`}>
                  <div className="flex-1 w-full">
                    <Clip />
                  </div>
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                      <f.icon className="h-3.5 w-3.5" />
                      {f.eyebrow}
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight">{f.title}</h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">{f.description}</p>
                    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto lg:mx-0">
                      {f.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <section className="py-16 sm:py-20 text-center px-4" style={{ background: "hsl(var(--sidebar-background))" }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display tracking-tight">
              Try every feature free for 14 days
            </h2>
            <p className="mt-4 text-white/70 text-lg">No credit card required. Set up in minutes.</p>
            <Button size="lg" onClick={() => navigate("/login")} className="mt-8 text-base px-8 gap-2 h-12 rounded-xl">
              Start Your Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
