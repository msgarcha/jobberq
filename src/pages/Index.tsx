import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Receipt,
  ArrowUpRight,
  Briefcase,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, useRecentActivity } from "@/hooks/useInvoices";
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
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  const { data: stats } = useDashboardStats();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: todayJobs } = useJobsByDate(todayStr);
  const { data: activity } = useRecentActivity();

  const kpis = [
    { label: "Revenue (MTD)", value: `$${(stats?.revenueMTD || 0).toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "Outstanding", value: `$${(stats?.outstanding || 0).toLocaleString()}`, sub: `${stats?.unpaidCount || 0} unpaid`, icon: Clock, color: "text-status-warning" },
    { label: "Overdue", value: `$${(stats?.overdueTotal || 0).toLocaleString()}`, sub: `${stats?.overdueCount || 0} invoices`, icon: AlertTriangle, color: "text-status-danger" },
    { label: "Active Quotes", value: `${stats?.quotesCount || 0}`, sub: `$${(stats?.quotesValue || 0).toLocaleString()} value`, icon: FileText, color: "text-primary" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening today.</p>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-warm hover:shadow-warm-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-display font-bold">{kpi.value}</p>
                    {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
                  </div>
                  <div className={`h-10 w-10 rounded-xl bg-secondary flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Today's Schedule */}
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
            <CardContent className="space-y-3">
              {!todayJobs?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No jobs scheduled today</p>
              ) : (
                todayJobs.slice(0, 4).map((job: any) => {
                  const client = job.clients;
                  const clientName = client ? `${client.first_name} ${client.last_name}` : "";
                  const startTime = job.scheduled_start ? format(new Date(job.scheduled_start), "h:mm a") : "";
                  return (
                    <div key={job.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{clientName}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {startTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{startTime}</span>}
                          {job.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.address}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
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
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
              ) : (
                <div className="divide-y">
                  {activity.slice(0, 8).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded" onClick={() => navigate(`/invoices/${item.id}`)}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={statusColors[item.status] || "bg-status-neutral text-status-neutral-foreground"} variant="secondary">
                          {item.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(item.time), "MMM d")}</p>
                      </div>
                    </div>
                  ))}
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
