import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoices } from "@/hooks/useInvoices";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--status-warning))", "hsl(var(--status-danger))", "hsl(var(--status-info))"];

const Reports = () => {
  const { data: allInvoices } = useInvoices();

  // Revenue by month (last 6 months)
  const revenueData = useMemo(() => {
    if (!allInvoices) return [];
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMM") };
    });
    return months.map((m) => {
      const total = allInvoices
        .filter((inv: any) => inv.status === "paid" && inv.paid_at && isWithinInterval(parseISO(inv.paid_at), { start: m.start, end: m.end }))
        .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      return { name: m.label, revenue: total };
    });
  }, [allInvoices]);

  // Invoice aging
  const agingData = useMemo(() => {
    if (!allInvoices) return [];
    const unpaid = allInvoices.filter((inv: any) => inv.status !== "paid" && inv.status !== "draft");
    const buckets = { "Current": 0, "1-30 days": 0, "31-60 days": 0, "60+ days": 0 };
    const today = new Date();
    unpaid.forEach((inv: any) => {
      if (!inv.due_date) { buckets["Current"] += Number(inv.balance_due); return; }
      const days = differenceInDays(today, parseISO(inv.due_date));
      if (days <= 0) buckets["Current"] += Number(inv.balance_due);
      else if (days <= 30) buckets["1-30 days"] += Number(inv.balance_due);
      else if (days <= 60) buckets["31-60 days"] += Number(inv.balance_due);
      else buckets["60+ days"] += Number(inv.balance_due);
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [allInvoices]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Business analytics and financial reporting.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Invoice Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={agingData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: $${value.toLocaleString()}` : ""}>
                      {agingData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {agingData.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {agingData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
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

export default Reports;
