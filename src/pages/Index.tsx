import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Receipt,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Calendar,
  ChevronRight,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const todaySchedule = [
  { id: 1, title: "Lawn Maintenance", client: "Green Valley HOA", time: "9:00 AM", address: "123 Oak Dr" },
  { id: 2, title: "HVAC Inspection", client: "Acme Corp", time: "1:00 PM", address: "500 Business Blvd" },
];

const todoItems = [
  { id: 1, label: "Convert approved quote Q-286 for Smith Residence", type: "quote", action: "Convert to Job" },
  { id: 2, label: "Follow up on overdue invoice INV-1041", type: "invoice", action: "Send Reminder" },
  { id: 3, label: "Schedule site visit for Green Valley HOA", type: "job", action: "Schedule" },
];

const recentActivity = [
  { id: 1, icon: Receipt, text: "Invoice #1042 paid", detail: "Acme Corp · $4,200", time: "2h ago", status: "paid" },
  { id: 2, icon: FileText, text: "Quote #287 sent", detail: "Johnson Landscaping · $3,200", time: "4h ago", status: "sent" },
  { id: 3, icon: FileText, text: "Quote #286 approved", detail: "Smith Residence · $1,850", time: "Yesterday", status: "approved" },
  { id: 4, icon: Receipt, text: "Invoice #1041 overdue", detail: "Metro Properties · $8,600", time: "Yesterday", status: "overdue" },
  { id: 5, icon: Users, text: "New client added", detail: "Green Valley HOA", time: "2 days ago", status: "new" },
];

const statusColors: Record<string, string> = {
  paid: "bg-status-success text-status-success-foreground",
  sent: "bg-status-info text-status-info-foreground",
  approved: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
  new: "bg-status-neutral text-status-neutral-foreground",
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening today.</p>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Revenue (MTD)", value: "$19,800", change: "+12%", up: true, icon: DollarSign, color: "text-primary" },
            { label: "Outstanding", value: "$66,600", sub: "18 unpaid", icon: Clock, color: "text-status-warning" },
            { label: "Overdue", value: "$8,600", change: "4 invoices", up: false, icon: AlertTriangle, color: "text-status-danger" },
            { label: "Active Quotes", value: "12", sub: "$34,500 value", icon: FileText, color: "text-primary" },
          ].map((kpi) => (
            <Card key={kpi.label} className="shadow-warm hover:shadow-warm-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-2xl font-display font-bold">{kpi.value}</p>
                    {kpi.change && (
                      <div className={`flex items-center gap-1 text-xs ${kpi.up ? "text-status-success" : "text-status-danger"}`}>
                        {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        <span>{kpi.change}</span>
                      </div>
                    )}
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
              {todaySchedule.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.client}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* To-Do */}
          <Card className="lg:col-span-3 shadow-warm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-status-warning" />
                  To-Do
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{todoItems.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {todoItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-status-warning shrink-0" />
                    <p className="text-sm truncate">{item.label}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 rounded-md">
                    {item.action}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-warm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-display font-semibold">Recently Active</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={statusColors[item.status]} variant="secondary">
                      {item.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
