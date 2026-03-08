import {
  DollarSign, Users, TrendingUp, AlertTriangle, UserPlus, UserMinus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface RevenueStats {
  mrr: number;
  total_revenue: number;
  active_subscribers: number;
  trialing_count: number;
  past_due_count: number;
  new_this_month: number;
  canceled_this_month: number;
  revenue_over_time: { month: string; amount: number }[];
}

interface Props {
  stats: RevenueStats | null;
  loading: boolean;
}

function KPI({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color || "bg-primary/10"}`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });

export function AdminRevenueCharts({ stats, loading }: Props) {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const chartData = stats.revenue_over_time.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short" }),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI icon={DollarSign} label="MRR" value={fmt(stats.mrr)} />
        <KPI icon={TrendingUp} label="Revenue (12mo)" value={fmt(stats.total_revenue)} />
        <KPI icon={Users} label="Active Subs" value={String(stats.active_subscribers)} />
        <KPI icon={Users} label="Trialing" value={String(stats.trialing_count)} />
        <KPI icon={UserPlus} label="New This Month" value={String(stats.new_this_month)} />
        <KPI icon={UserMinus} label="Churned This Mo." value={String(stats.canceled_this_month)} />
      </div>

      {stats.past_due_count > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium">
              {stats.past_due_count} subscription{stats.past_due_count > 1 ? "s" : ""} with past-due payments
            </p>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Over Time (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [fmt(value), "Revenue"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
