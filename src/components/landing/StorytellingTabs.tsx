import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Briefcase, CreditCard, BarChart3 } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const stories = [
  {
    value: "win",
    label: "Win More Jobs",
    icon: FileText,
    headline: "From first impression to signed quote — in minutes",
    description: "Create stunning, branded quotes on-site. Send them instantly. Clients approve with one tap. No more lost leads waiting for follow-ups.",
    stat: "3× faster",
    statLabel: "quote turnaround",
    quote: "We went from losing half our leads to closing 80%. The speed alone changed everything.",
    author: "Mike R., Landscaping",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    value: "work",
    label: "Work Smarter",
    icon: Briefcase,
    headline: "Schedule, assign, and track every job effortlessly",
    description: "Drag-and-drop scheduling. Real-time job status. Your entire crew stays on the same page — no more missed appointments or double bookings.",
    stat: "12+ hours",
    statLabel: "saved per week",
    quote: "I used to spend Sunday nights scheduling. Now it takes 10 minutes.",
    author: "Jennifer L., Cleaning Services",
    gradient: "from-status-success/20 to-status-success/5",
  },
  {
    value: "paid",
    label: "Get Paid Faster",
    icon: CreditCard,
    headline: "Invoice instantly. Get paid the same day.",
    description: "One-click invoicing from completed jobs. Online payments via Stripe. Automated reminders. Watch your cash flow transform overnight.",
    stat: "2× faster",
    statLabel: "payment collection",
    quote: "Our average days-to-pay dropped from 30 to 3. That's life-changing for a small business.",
    author: "Carlos M., Electrical",
    gradient: "from-warm-gold/20 to-warm-gold/5",
  },
  {
    value: "grow",
    label: "Grow Your Business",
    icon: BarChart3,
    headline: "See where every dollar goes — and where more will come from",
    description: "Revenue reports, outstanding balances, top clients, and team performance. The clarity you need to make confident decisions and scale.",
    stat: "44%",
    statLabel: "avg. revenue growth",
    quote: "For the first time, I actually understand my numbers. We doubled revenue in 8 months.",
    author: "David & Amy T., Painting",
    gradient: "from-chart-4/20 to-chart-4/5",
  },
];

export default function StorytellingTabs() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">How ServicePro Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
            Four steps to a better business
          </h2>
        </div>

        <Tabs defaultValue="win" className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-2 bg-transparent p-0 mb-10">
            {stories.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border border-border/50 bg-card data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-warm-md transition-all"
              >
                <s.icon className="h-5 w-5" />
                <span className="text-xs sm:text-sm font-semibold">{s.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {stories.map((s) => (
            <TabsContent key={s.value} value={s.value}>
              <div className="grid md:grid-cols-2 gap-10 items-center">
                {/* Visual */}
                <div className={`rounded-2xl bg-gradient-to-br ${s.gradient} p-10 sm:p-14 flex items-center justify-center min-h-[280px]`}>
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center shadow-warm-md animate-float">
                      <s.icon className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-4xl sm:text-5xl font-bold font-display text-foreground">{s.stat}</p>
                      <p className="text-sm text-muted-foreground mt-1">{s.statLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Copy */}
                <div className="space-y-6">
                  <h3 className="text-2xl sm:text-3xl font-bold font-display leading-tight">{s.headline}</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">{s.description}</p>
                  <blockquote className="border-l-2 border-primary/40 pl-4 py-2">
                    <p className="text-sm italic text-foreground/80">"{s.quote}"</p>
                    <cite className="text-xs text-muted-foreground mt-2 block not-italic">— {s.author}</cite>
                  </blockquote>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
