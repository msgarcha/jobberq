import { useState } from "react";
import { format } from "date-fns";
import { Search, Eye, Ban, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export interface UsageRow {
  user_id: string;
  email: string;
  name: string;
  team_id: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  trial_ends_at: string | null;
  trial_active: boolean;
  access_revoked: boolean;
  access_revoked_at: string | null;
  quotes_lifetime: number;
  quotes_30d: number;
  invoices_lifetime: number;
  invoices_30d: number;
  clients_lifetime: number;
  jobs_lifetime: number;
  ai_calls_30d: number;
  payments_lifetime: number;
  payments_30d: number;
}

interface Props {
  rows: UsageRow[];
  loading: boolean;
  onView: (row: UsageRow) => void;
  onRevoke: (row: UsageRow) => void;
  onRestore: (row: UsageRow) => void;
  initialFilter?: "all" | "trial_active" | "trial_expired" | "revoked";
}

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function AdminUsageTable({ rows, loading, onView, onRevoke, onRestore, initialFilter = "all" }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<typeof initialFilter>(initialFilter);

  const filtered = rows.filter((r) => {
    const matchesSearch =
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.name || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "revoked") return r.access_revoked;
    if (filter === "trial_active") return !r.access_revoked && r.trial_active;
    if (filter === "trial_expired") return !r.access_revoked && !r.trial_active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "trial_active", "trial_expired", "revoked"] as const).map((k) => (
            <Button
              key={k}
              variant={filter === k ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(k)}
            >
              {k === "all" ? "All" : k === "trial_active" ? "Trial active" : k === "trial_expired" ? "Trial expired" : "Revoked"}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Quotes</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="text-right">Clients</TableHead>
              <TableHead className="text-right">AI (30d)</TableHead>
              <TableHead className="text-right">Collected</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Last sign in</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No accounts found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                      {r.access_revoked && <Badge variant="destructive">Revoked</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {r.quotes_lifetime}
                    <span className="text-xs text-muted-foreground ml-1">({r.quotes_30d})</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {r.invoices_lifetime}
                    <span className="text-xs text-muted-foreground ml-1">({r.invoices_30d})</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{r.clients_lifetime}</TableCell>
                  <TableCell className="text-right text-sm">{r.ai_calls_30d}</TableCell>
                  <TableCell className="text-right text-sm">{fmtMoney(Number(r.payments_lifetime || 0))}</TableCell>
                  <TableCell className="text-sm">
                    {r.trial_ends_at ? (
                      <span className={r.trial_active ? "text-foreground" : "text-muted-foreground"}>
                        {format(new Date(r.trial_ends_at), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.last_sign_in_at ? format(new Date(r.last_sign_in_at), "MMM d") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(r)} title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {r.access_revoked ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => onRestore(r)} title="Restore">
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRevoke(r)} title="Revoke">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} accounts · numbers in parens are last 30 days
      </p>
    </div>
  );
}
