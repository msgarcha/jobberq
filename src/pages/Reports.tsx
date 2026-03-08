import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useMemo, useState } from "react";
import {
  format, subMonths, subQuarters, subYears, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval,
  parseISO, differenceInDays, eachMonthOfInterval, eachWeekOfInterval,
  startOfWeek, endOfWeek,
} from "date-fns";
import {
  DollarSign, TrendingUp, AlertTriangle, CreditCard, CalendarIcon,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DatePreset = "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "all_time" | "custom";

const PRESET_LABELS: Record<DatePreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  last_year: "Last Year",
  all_time: "All Time",
  custom: "Custom",
};

function getPresetRange(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case "this_month": return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month": { const d = subMonths(now, 1); return { start: startOfMonth(d), end: endOfMonth(d) }; }
    case "this_quarter": return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "this_year": return { start: startOfYear(now), end: endOfYear(now) };
    case "last_year": { const d = subYears(now, 1); return { start: startOfYear(d), end: endOfYear(d) }; }
    case "all_time": return { start: new Date(2000, 0, 1), end: now };
    default: return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(var(--status-neutral))",
  sent: "hsl(var(--status-info))",
  viewed: "hsl(var(--status-warning))",
  paid: "hsl(var(--status-success))",
  overdue: "hsl(var(--status-danger))",
};

const Reports = () => {
  const { user } = useAuth();
  const { data: allInvoices, isLoading: invoicesLoading } = useInvoices();
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  // Fetch all payments
  const { data: allPayments } = useQuery({
    queryKey: ["all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, invoices(invoice_number, client_id, clients(first_name, last_name, company_name))")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const dateRange = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    if (!allInvoices) return [];
    return allInvoices.filter((inv: any) => {
      const d = parseISO(inv.created_at);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
  }, [allInvoices, dateRange]);

  // Filter payments by date range
  const filteredPayments = useMemo(() => {
    if (!allPayments) return [];
    return allPayments.filter((p: any) => {
      const d = parseISO(p.payment_date);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
  }, [allPayments, dateRange]);

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredInvoices
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

    const outstanding = filteredInvoices
      .filter((inv: any) => inv.status !== "paid" && inv.status !== "draft")
      .reduce((sum: number, inv: any) => sum + Number(inv.balance_due), 0);

    const today = new Date();
    const overdue = filteredInvoices
      .filter((inv: any) => {
        if (inv.status === "paid" || inv.status === "draft") return false;
        if (inv.status === "overdue") return true;
        if (inv.due_date && parseISO(inv.due_date) < today) return true;
        return false;
      })
      .reduce((sum: number, inv: any) => sum + Number(inv.balance_due), 0);

    const collected = filteredPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return { totalRevenue, outstanding, overdue, collected };
  }, [filteredInvoices, filteredPayments]);

  // Revenue over time chart
  const revenueChartData = useMemo(() => {
    const daysDiff = differenceInDays(dateRange.end, dateRange.start);
    const useWeeks = daysDiff <= 60;

    if (useWeeks && daysDiff <= 60) {
      const weeks = eachWeekOfInterval({ start: dateRange.start, end: dateRange.end });
      return weeks.map((weekStart) => {
        const wEnd = endOfWeek(weekStart);
        const total = filteredInvoices
          .filter((inv: any) => inv.status === "paid" && inv.paid_at && isWithinInterval(parseISO(inv.paid_at), { start: weekStart, end: wEnd }))
          .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
        return { name: format(weekStart, "MMM d"), revenue: total };
      });
    }

    const months = eachMonthOfInterval({ start: dateRange.start, end: dateRange.end });
    return months.map((monthStart) => {
      const mEnd = endOfMonth(monthStart);
      const total = filteredInvoices
        .filter((inv: any) => inv.status === "paid" && inv.paid_at && isWithinInterval(parseISO(inv.paid_at), { start: monthStart, end: mEnd }))
        .reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      return { name: format(monthStart, "MMM yyyy"), revenue: total };
    });
  }, [filteredInvoices, dateRange]);

  // Invoice status breakdown
  const statusBreakdown = useMemo(() => {
    const statuses = ["draft", "sent", "viewed", "paid", "overdue"];
    return statuses.map((s) => {
      const matching = filteredInvoices.filter((inv: any) => inv.status === s);
      return {
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: matching.reduce((sum: number, inv: any) => sum + Number(inv.total), 0),
        count: matching.length,
        status: s,
      };
    }).filter((d) => d.count > 0);
  }, [filteredInvoices]);

  // Aging buckets
  const agingData = useMemo(() => {
    const unpaid = filteredInvoices.filter((inv: any) => inv.status !== "paid" && inv.status !== "draft");
    const buckets = { Current: 0, "1–30 days": 0, "31–60 days": 0, "60+ days": 0 };
    const today = new Date();
    unpaid.forEach((inv: any) => {
      const amt = Number(inv.balance_due);
      if (!inv.due_date) { buckets["Current"] += amt; return; }
      const days = differenceInDays(today, parseISO(inv.due_date));
      if (days <= 0) buckets["Current"] += amt;
      else if (days <= 30) buckets["1–30 days"] += amt;
      else if (days <= 60) buckets["31–60 days"] += amt;
      else buckets["60+ days"] += amt;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices]);

  const AGING_COLORS = [
    "hsl(var(--status-success))",
    "hsl(var(--status-info))",
    "hsl(var(--status-warning))",
    "hsl(var(--status-danger))",
  ];

  // Invoices table filtered by status
  const tableInvoices = useMemo(() => {
    if (invoiceStatusFilter === "all") return filteredInvoices;
    return filteredInvoices.filter((inv: any) => inv.status === invoiceStatusFilter);
  }, [filteredInvoices, invoiceStatusFilter]);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "overdue": return "destructive";
      case "sent": case "viewed": return "secondary";
      default: return "outline";
    }
  };

  const methodLabel = (m: string) => {
    const map: Record<string, string> = {
      cash: "Cash", check: "Check", credit_card: "Credit Card",
      ach: "Bank Transfer", stripe: "Stripe", other: "Other",
    };
    return map[m] || m;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial overview and business analytics.</p>
        </div>

        {/* Date Range Filter */}
        <Card className="shadow-warm">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(PRESET_LABELS) as DatePreset[]).filter((p) => p !== "custom").map((p) => (
                <Button
                  key={p}
                  variant={preset === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreset(p)}
                  className="text-xs"
                >
                  {PRESET_LABELS[p]}
                </Button>
              ))}

              {/* Custom range */}
              <div className="flex items-center gap-1 ml-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={preset === "custom" ? "default" : "outline"} size="sm" className="text-xs gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {preset === "custom" && customStart && customEnd
                        ? `${format(customStart, "MMM d")} – ${format(customEnd, "MMM d, yyyy")}`
                        : "Custom Range"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground">Start Date</p>
                      <Calendar
                        mode="single"
                        selected={customStart}
                        onSelect={(d) => { setCustomStart(d); setPreset("custom"); }}
                        className="p-0 pointer-events-auto"
                      />
                      <p className="text-xs font-medium text-muted-foreground">End Date</p>
                      <Calendar
                        mode="single"
                        selected={customEnd}
                        onSelect={(d) => { setCustomEnd(d); setPreset("custom"); }}
                        className="p-0 pointer-events-auto"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {format(dateRange.start, "MMM d, yyyy")} — {format(dateRange.end, "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-warm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold font-display mt-2">${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Paid invoices in period</p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--status-warning))]/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--status-warning))]" />
                </div>
              </div>
              <p className="text-2xl font-bold font-display mt-2">${kpis.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Unpaid balance</p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold font-display mt-2">${kpis.overdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Past due date</p>
            </CardContent>
          </Card>

          <Card className="shadow-warm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Collected</p>
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--status-success))]/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-[hsl(var(--status-success))]" />
                </div>
              </div>
              <p className="text-2xl font-bold font-display mt-2">${kpis.collected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground mt-1">Payments received</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Revenue Over Time */}
          <Card className="shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No revenue data for this period</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Status Breakdown */}
          <Card className="shadow-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Invoice Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {statusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        dataKey="value"
                        label={({ name, count }) => `${name} (${count})`}
                      >
                        {statusBreakdown.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "hsl(var(--muted))"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No invoices for this period</div>
                )}
              </div>
              {statusBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {statusBreakdown.map((item) => (
                    <div key={item.status} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
                      <span className="text-muted-foreground">{item.name} ({item.count})</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Aging Chart */}
        <Card className="shadow-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invoice Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Balance"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {agingData.map((_, i) => (
                      <Cell key={i} fill={AGING_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tables */}
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="invoices">Invoice History</TabsTrigger>
          </TabsList>

          {/* Payments Table */}
          <TabsContent value="payments">
            <Card className="shadow-warm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Payments ({filteredPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No payments in this period
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((p: any) => {
                          const client = p.invoices?.clients;
                          const clientName = client
                            ? (client.company_name || `${client.first_name} ${client.last_name}`)
                            : "—";
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="whitespace-nowrap">{format(parseISO(p.payment_date), "MMM d, yyyy")}</TableCell>
                              <TableCell className="font-medium">{p.invoices?.invoice_number || "—"}</TableCell>
                              <TableCell>{clientName}</TableCell>
                              <TableCell className="text-right font-medium">${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{methodLabel(p.payment_method)}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{p.reference_number || p.stripe_payment_id?.slice(0, 12) || "—"}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice History Table */}
          <TabsContent value="invoices">
            <Card className="shadow-warm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Invoices ({tableInvoices.length})
                </CardTitle>
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No invoices for this period
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableInvoices.map((inv: any) => {
                          const client = inv.clients;
                          const clientName = client
                            ? (client.company_name || `${client.first_name} ${client.last_name}`)
                            : "—";
                          return (
                            <TableRow key={inv.id}>
                              <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                              <TableCell>{clientName}</TableCell>
                              <TableCell className="whitespace-nowrap">{format(parseISO(inv.created_at), "MMM d, yyyy")}</TableCell>
                              <TableCell className="whitespace-nowrap">{inv.due_date ? format(parseISO(inv.due_date), "MMM d, yyyy") : "—"}</TableCell>
                              <TableCell className="text-right">${Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right">${Number(inv.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right">${Number(inv.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell>
                                <Badge variant={statusBadgeVariant(inv.status)} className="text-xs capitalize">
                                  {inv.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
