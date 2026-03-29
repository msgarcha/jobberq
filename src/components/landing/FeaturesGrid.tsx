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

function DashboardMockup() {
  return (
    <div className="bg-background p-3 sm:p-4 space-y-3 min-h-[260px]">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Revenue (MTD)", value: "$12,450", change: "+18%", positive: true },
          { label: "Outstanding", value: "$3,200", change: "4 invoices", positive: false },
          { label: "Overdue", value: "$890", change: "2 invoices", positive: false },
          { label: "Active Quotes", value: "7", change: "+3 this week", positive: true },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border/50 rounded-lg p-2 sm:p-2.5">
            <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate">{kpi.label}</p>
            <p className="text-sm sm:text-base font-bold font-display text-foreground">{kpi.value}</p>
            <p className={`text-[7px] sm:text-[8px] ${kpi.positive ? "text-status-success" : "text-muted-foreground"}`}>
              {kpi.change}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1.5">
        {["New Quote", "New Invoice", "New Job", "New Client"].map((action) => (
          <div
            key={action}
            className="flex-1 bg-primary/10 text-primary text-[8px] sm:text-[9px] font-medium rounded-md py-1.5 text-center"
          >
            {action}
          </div>
        ))}
      </div>

      {/* Schedule Items */}
      <div className="space-y-1.5">
        <p className="text-[9px] sm:text-[10px] font-semibold text-foreground">Today's Schedule</p>
        {[
          { time: "9:00 AM", title: "Lawn Care — Johnson Residence", status: "In Progress", color: "bg-status-warning" },
          { time: "11:30 AM", title: "Deck Repair — Williams Property", status: "Scheduled", color: "bg-primary" },
          { time: "2:00 PM", title: "Plumbing — Oak Street Office", status: "Pending", color: "bg-muted" },
        ].map((item) => (
          <div
            key={item.time}
            className="flex items-center gap-2 bg-muted/30 rounded-md px-2 py-1.5"
          >
            <span className="text-[8px] text-muted-foreground w-12 shrink-0">{item.time}</span>
            <span className="text-[8px] sm:text-[9px] text-foreground truncate flex-1">{item.title}</span>
            <span className={`${item.color} text-[7px] text-white px-1.5 py-0.5 rounded-full`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeaturesGrid() {
  const { ref, inView } = useInView();

  return (
    <section id="features" ref={ref} className="py-20 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Features</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display">
            Everything you need to grow
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            From first client contact to final payment — QuickLinq handles the entire workflow.
          </p>
        </div>

        {/* Dashboard mockup */}
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
            {/* Mini dashboard */}
            <DashboardMockup />
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
