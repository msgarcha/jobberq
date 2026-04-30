import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Receipt,
  Briefcase,
  Calendar,
  ChevronRight,
  MapPin,
  Plus,
  Users,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, useRecentActivity, formatRelativeTime } from "@/hooks/useInvoices";
import { useJobsByDate } from "@/hooks/useJobs";
import { format } from "date-fns";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const statusColors: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  paid: "bg-status-success text-status-success-foreground",
  sent: "bg-status-info text-status-info-foreground",
  approved: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
  viewed: "bg-status-warning text-status-warning-foreground",
  converted: "bg-primary text-primary-foreground",
  expired: "bg-status-danger text-status-danger-foreground",
};

const quickActions = [
  { label: "New Quote", icon: FileText, path: "/quotes/new", color: "text-primary" },
  { label: "New Invoice", icon: Receipt, path: "/invoices/new", color: "text-status-success" },
  { label: "New Job", icon: Briefcase, path: "/jobs/new", color: "text-warm-gold" },
  { label: "New Client", icon: Users, path: "/clients/new", color: "text-status-info" },
];

const tips = [
  "Set up online payments to get paid 2× faster.",
  "Add your company logo in Settings for branded invoices.",
  "Try recurring invoices for repeat clients.",
  "Connect Stripe to accept credit card payments instantly.",
  "Use review requests to build your Google reviews.",
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  const { data: stats } = useDashboardStats();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: todayJobs } = useJobsByDate(todayStr);
  const { data: activity } = useRecentActivity();

  const tipOfDay = tips[new Date().getDate() % tips.length];

  const kpis = [
    { label: "Revenue (MTD)", value: `$${(stats?.revenueMTD || 0).toLocaleString()}`, icon: DollarSign, color: "text-primary", path: "/invoices?status=paid" },
    { label: "Outstanding", value: `$${(stats?.outstanding || 0).toLocaleString()}`, sub: `${stats?.unpaidCount || 0} unpaid`, icon: Clock, color: "text-status-warning", path: "/invoices?status=sent" },
    { label: "Overdue", value: `$${(stats?.overdueTotal || 0).toLocaleString()}`, sub: `${stats?.overdueCount || 0} invoices`, icon: AlertTriangle, color: "text-status-danger", path: "/invoices?status=overdue" },
    { label: "Active Quotes", value: `${stats?.quotesCount || 0}`, sub: `$${(stats?.quotesValue || 0).toLocaleString()} value`, icon: FileText, color: "text-primary", path: "/quotes" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting + Tip */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold tracking-tight break-words">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5 max-w-full sm:max-w-md min-w-0">
            <Lightbulb className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-foreground/80 min-w-0 break-words">{tipOfDay}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 shadow-warm hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
            >
              <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${action.color} group-hover:scale-105 transition-transform`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{action.label}</p>
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className="shadow-warm hover:shadow-warm-md transition-shadow cursor-pointer active:scale-[0.98]"
              onClick={() => navigate(kpi.path)}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">{kpi.label}</p>
                    <p
                      className="text-xl md:text-2xl font-display font-bold truncate leading-tight tabular-nums"
                      title={kpi.value}
                    >
                      {kpi.value}
                    </p>
                    {kpi.sub && <p className="text-[10px] md:text-xs text-muted-foreground truncate">{kpi.sub}</p>}
                  </div>
                  <div className={`h-8 w-8 md:h-10 md:w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Today's Schedule - Timeline style */}
          <Card className="lg:col-span-2 shadow-warm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Today's Schedule
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => navigate("/schedule")}>
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {!todayJobs?.length ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No jobs scheduled today</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => navigate("/jobs/new")}>
                    Schedule a Job
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[18px] top-3 bottom-3 w-px bg-border" />
                  {todayJobs.slice(0, 5).map((job: any) => {
                    const client = job.clients;
                    const clientName = client ? `${client.first_name} ${client.last_name}` : "";
                    const startTime = job.scheduled_start ? format(new Date(job.scheduled_start), "h:mm a") : "";
                    return (
                      <div
                        key={job.id}
                        className="relative flex items-start gap-4 py-3 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded-lg transition-colors"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div className="relative z-10 mt-1">
                          <div className="h-[10px] w-[10px] rounded-full bg-primary border-2 border-background" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{clientName}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {startTime}
                              </span>
                            )}
                            {job.address && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{job.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-3 shadow-warm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display font-semibold">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => navigate("/invoices")}>
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!activity?.length ? (
                <div className="text-center py-8">
                  <Receipt className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => navigate("/invoices/new")}>
                    Create an Invoice
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {activity.slice(0, 8).map((item) => {
                    const Icon = item.type === "quote" ? FileText : Receipt;
                    const detailPath = item.type === "quote" ? `/quotes/${item.id}` : `/invoices/${item.id}`;
                    return (
                      <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded transition-colors" onClick={() => navigate(detailPath)}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.text}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={statusColors[item.status] || "bg-status-neutral text-status-neutral-foreground"} variant="secondary">
                            {item.status}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(item.time)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
