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
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=500&fit=crop",
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
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop",
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
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=500&fit=crop",
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
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop",
  },
];

export default function StorytellingTabs() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">How QuickLinq Works</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display">
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
                {/* Visual – Real photo with stat overlay */}
                <div className="relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[340px]">
                  <img
                    src={s.image}
                    alt={s.headline}
                    className="w-full h-full object-cover absolute inset-0"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-flex items-center gap-3 bg-background/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-warm-md">
                      <s.icon className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">{s.stat}</p>
                        <p className="text-xs text-muted-foreground">{s.statLabel}</p>
                      </div>
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
