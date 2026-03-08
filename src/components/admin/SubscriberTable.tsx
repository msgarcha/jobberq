import { useState } from "react";
import { format } from "date-fns";
import { Search, MoreHorizontal, Clock, XCircle, Gift, ArrowUpDown, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SUBSCRIPTION_TIERS, type TierKey } from "@/lib/subscriptionTiers";

export interface Subscriber {
  subscription_id: string | null;
  customer_id: string | null;
  email: string;
  name: string;
  status: string;
  product_id: string | null;
  price_id: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  created: string;
}

interface Props {
  subscribers: Subscriber[];
  loading: boolean;
  onAction: (action: string, subscriber: Subscriber, params?: any) => void;
}

function getTierName(productId: string | null): string {
  if (!productId) return "—";
  for (const [, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.productId === productId) return tier.name;
  }
  return "Unknown";
}

function getStatusBadge(status: string, cancelAtEnd: boolean) {
  if (cancelAtEnd) return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Canceling</Badge>;
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    trialing: { variant: "secondary", label: "Trialing" },
    trial_only: { variant: "outline", label: "Trial Only" },
    past_due: { variant: "destructive", label: "Past Due" },
    canceled: { variant: "outline", label: "Canceled" },
    unpaid: { variant: "destructive", label: "Unpaid" },
  };
  const cfg = map[status] || { variant: "outline" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function SubscriberTable({ subscribers, loading, onAction }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = subscribers.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="trial_only">Trial Only</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trial Ends</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sub, i) => (
                <TableRow key={sub.subscription_id || `trial-${i}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{getTierName(sub.product_id)}</TableCell>
                  <TableCell>{getStatusBadge(sub.status, sub.cancel_at_period_end)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.trial_end ? format(new Date(sub.trial_end), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.current_period_end ? format(new Date(sub.current_period_end), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.created ? format(new Date(sub.created), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAction("extend_trial", sub)}>
                          <Clock className="mr-2 h-4 w-4" /> Extend Trial
                        </DropdownMenuItem>
                        {sub.subscription_id && (
                          <>
                            <DropdownMenuItem onClick={() => onAction("change_tier", sub)}>
                              <ArrowUpDown className="mr-2 h-4 w-4" /> Change Tier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction("grant_free", sub)}>
                              <Gift className="mr-2 h-4 w-4" /> Grant Free Access
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {sub.cancel_at_period_end ? (
                              <DropdownMenuItem onClick={() => onAction("resume", sub)}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Resume Subscription
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => onAction("cancel", sub)}
                                className="text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Subscription
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {subscribers.length} subscribers
      </p>
    </div>
  );
}
