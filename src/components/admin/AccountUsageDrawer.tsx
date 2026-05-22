import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { UsageRow } from "./AdminUsageTable";

interface Props {
  row: UsageRow | null;
  open: boolean;
  onClose: () => void;
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function KPI({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function AccountUsageDrawer({ row, open, onClose }: Props) {
  const { session } = useAuth();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["account-usage-detail", row?.user_id],
    enabled: !!row && open,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-account-usage", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        body: { user_id: row!.user_id },
      });
      if (error) throw error;
      return data.detail as (UsageRow & { ai_by_function: Record<string, number> }) | null;
    },
  });

  if (!row) return null;

  const aiByFn = detail?.ai_by_function || {};
  const aiData = Object.entries(aiByFn)
    .map(([function_name, count]) => ({ function_name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {row.name}
            {row.access_revoked && <Badge variant="destructive">Revoked</Badge>}
          </SheetTitle>
          <SheetDescription>
            {row.email} · joined {format(new Date(row.created_at), "MMM d, yyyy")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPI label="Quotes" value={row.quotes_lifetime} hint={`${row.quotes_30d} in last 30d`} />
            <KPI label="Invoices" value={row.invoices_lifetime} hint={`${row.invoices_30d} in last 30d`} />
            <KPI label="Clients" value={row.clients_lifetime} />
            <KPI label="Jobs" value={row.jobs_lifetime} />
            <KPI label="Collected" value={fmtMoney(Number(row.payments_lifetime || 0))} hint={`${fmtMoney(Number(row.payments_30d || 0))} in last 30d`} />
            <KPI label="AI (30d)" value={row.ai_calls_30d} />
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Trial status</p>
              <div className="text-sm">
                {row.trial_ends_at ? (
                  <>
                    {row.trial_active ? "Trial active until " : "Trial ended on "}
                    <span className="font-medium">{format(new Date(row.trial_ends_at), "MMM d, yyyy")}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No trial on file</span>
                )}
              </div>
              {row.access_revoked && row.access_revoked_at && (
                <p className="text-xs text-destructive">
                  Access revoked {format(new Date(row.access_revoked_at), "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">AI usage by function (last 30 days)</p>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : aiData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No AI usage in the last 30 days.</p>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aiData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="function_name" className="text-xs" width={140} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
