import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const reports = [
  { title: "Revenue Summary", desc: "Monthly and yearly revenue breakdown", icon: TrendingUp },
  { title: "Invoice Aging", desc: "Outstanding and overdue invoice analysis", icon: BarChart3 },
  { title: "Client Activity", desc: "Active clients, new leads, and churn", icon: Users },
  { title: "Quote Conversion", desc: "Quote-to-job conversion rates", icon: PieChart },
];

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Business analytics and financial reporting.</p>
        </div>

        <Card className="shadow-warm">
          <CardContent className="p-0">
            {reports.map((r, i) => (
              <div key={r.title}>
                <button className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </button>
                {i < reports.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">Detailed reports with charts coming soon.</p>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
