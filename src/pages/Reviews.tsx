import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Send, ExternalLink, Clock, CheckCircle, AlertTriangle, TrendingUp, Copy } from "lucide-react";
import { useReviewRequests, useReviewStats } from "@/hooks/useReviews";
import { SendReviewDialog } from "@/components/review/SendReviewDialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const statusStyles: Record<string, string> = {
  pending: "bg-status-warning text-status-warning-foreground",
  completed: "bg-status-success text-status-success-foreground",
  expired: "bg-status-neutral text-status-neutral-foreground",
};

const Reviews = () => {
  const { data: reviews, isLoading } = useReviewRequests();
  const { data: stats } = useReviewStats();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const getReviewUrl = (token: string) => {
    return `${window.location.origin}/review/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getReviewUrl(token));
    toast({ title: "Review link copied!" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Reputation Shield</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage review requests and protect your online reputation.</p>
          </div>
          <Button className="gap-1.5 shadow-warm" onClick={() => setDialogOpen(true)}>
            <Send className="h-4 w-4" /> Request Review
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-warm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold">{stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card className="shadow-warm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold">{stats?.completed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Responses</p>
            </CardContent>
          </Card>
          <Card className="shadow-warm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold">{stats?.redirected ?? 0}</p>
              <p className="text-xs text-muted-foreground">Sent to Google</p>
            </CardContent>
          </Card>
          <Card className="shadow-warm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-bold">
                {stats?.avgRating ? stats.avgRating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Review List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {["all", "pending", "completed"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
              {isLoading ? (
                <p className="text-muted-foreground text-sm text-center py-8">Loading…</p>
              ) : !reviews?.length ? (
                <Card className="shadow-warm">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No review requests yet.</p>
                  </CardContent>
                </Card>
              ) : (
                reviews
                  .filter((r) => tab === "all" || r.status === tab)
                  .map((r: any) => {
                    const client = r.clients;
                    const clientName = client
                      ? `${client.first_name} ${client.last_name}`
                      : "Unknown";
                    return (
                      <Card key={r.id} className="shadow-warm">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                            {r.status === "completed" ? (
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${
                                      s <= (r.rating || 0)
                                        ? "fill-[hsl(36,80%,50%)] text-[hsl(36,80%,50%)]"
                                        : "text-muted-foreground/30"
                                    }`}
                                  />
                                ))}
                              </div>
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{clientName}</p>
                              <Badge className={`${statusStyles[r.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                                {r.status}
                              </Badge>
                              {r.redirected_to_google && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 border-status-success text-status-success">
                                  <ExternalLink className="h-2.5 w-2.5" /> Google
                                </Badge>
                              )}
                            </div>
                            {r.feedback && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">"{r.feedback}"</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.jobs?.title && `${r.jobs.job_number} · `}
                              {format(new Date(r.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          {r.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => copyLink(r.token)}
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy Link
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <SendReviewDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </DashboardLayout>
  );
};

export default Reviews;
