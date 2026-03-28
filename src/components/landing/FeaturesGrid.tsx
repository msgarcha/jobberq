import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, Receipt, Briefcase, Calendar, BarChart3 } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const features = [
  { icon: Users, title: "Client Management", desc: "Contacts, properties, and communication history — organized and searchable." },
  { icon: FileText, title: "Quotes & Estimates", desc: "Beautiful branded quotes. Send, track, and convert to jobs with one click." },
  { icon: Receipt, title: "Invoicing & Payments", desc: "Professional invoices with online payment. Recurring billing on autopilot." },
  { icon: Briefcase, title: "Job Tracking", desc: "From scheduled to complete — real-time status for every job and crew." },
  { icon: Calendar, title: "Smart Scheduling", desc: "Drag-and-drop calendar. Assign crews. Avoid conflicts. Stay on time." },
  { icon: BarChart3, title: "Reports & Insights", desc: "Revenue trends, outstanding balances, and team performance at a glance." },
];

export default function FeaturesGrid() {
  const { ref, inView } = useInView();

  return (
    <section id="features" ref={ref} className="py-20 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
            Everything you need to grow
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            From first client contact to final payment — QuickLinq handles the entire workflow.
          </p>
        </div>

        {/* App mockup */}
        <div className={`mb-14 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden shadow-warm-lg border border-border/50">
            {/* Browser chrome */}
            <div className="bg-muted/80 px-4 py-2.5 flex items-center gap-2 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warm-gold/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-status-success/60" />
              </div>
              <div className="flex-1 mx-8">
                <div className="bg-background/60 rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center">app.quicklinq.com/dashboard</div>
              </div>
            </div>
            {/* Screenshot */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=500&fit=crop"
              alt="QuickLinq dashboard overview"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card
              key={f.title}
              className={`shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300 border-border/50 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-6 space-y-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-base font-display">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
