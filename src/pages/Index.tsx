import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Receipt,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 12400 },
  { month: "Feb", revenue: 15800 },
  { month: "Mar", revenue: 14200 },
  { month: "Apr", revenue: 18600 },
  { month: "May", revenue: 21300 },
  { month: "Jun", revenue: 19800 },
];

const invoiceAging = [
  { name: "Current", value: 45200, color: "hsl(152, 69%, 41%)" },
  { name: "1-30 days", value: 12800, color: "hsl(38, 92%, 50%)" },
  { name: "31-60 days", value: 5400, color: "hsl(25, 95%, 53%)" },
  { name: "60+ days", value: 3200, color: "hsl(0, 72%, 51%)" },
];

const recentActivity = [
  { id: 1, type: "invoice", text: "Invoice #1042 paid by Acme Corp", time: "2 hours ago", status: "paid" },
  { id: 2, type: "quote", text: "Quote #287 sent to Johnson Landscaping", time: "4 hours ago", status: "sent" },
  { id: 3, type: "quote", text: "Quote #286 approved by Smith Residence", time: "Yesterday", status: "approved" },
  { id: 4, type: "invoice", text: "Invoice #1041 overdue - Metro Properties", time: "Yesterday", status: "overdue" },
  { id: 5, type: "client", text: "New client added: Green Valley HOA", time: "2 days ago", status: "new" },
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here's your business overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue (MTD)</p>
                  <p className="text-2xl font-display font-bold mt-1">$19,800</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-status-success">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>12% vs last month</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-display font-bold mt-1">$66,600</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>18 unpaid invoices</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-status-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-status-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-display font-bold mt-1">$8,600</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-status-danger">
                    <ArrowDownRight className="h-3 w-3" />
                    <span>4 invoices overdue</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-status-danger/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-status-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Quotes</p>
                  <p className="text-2xl font-display font-bold mt-1">12</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>$34,500 total value</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">Invoice Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={invoiceAging}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {invoiceAging.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {invoiceAging.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Recent Activity */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                    <Badge className={statusColors[item.status]} variant="secondary">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => navigate("/quotes/new")}
              >
                <FileText className="h-4 w-4" />
                Create New Quote
              </Button>
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => navigate("/invoices/new")}
              >
                <Receipt className="h-4 w-4" />
                Create New Invoice
              </Button>
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => navigate("/clients/new")}
              >
                <Users className="h-4 w-4" />
                Add New Client
              </Button>
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={() => navigate("/reports")}
              >
                <TrendingUp className="h-4 w-4" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
