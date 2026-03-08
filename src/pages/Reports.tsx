import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Business analytics and financial reporting.</p>
        </div>

        <Card className="min-h-[500px] flex items-center justify-center">
          <CardContent className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <CardTitle className="text-lg font-display mb-2">Reports Coming Soon</CardTitle>
            <p className="text-sm text-muted-foreground max-w-md">
              Revenue reports, invoice aging, client analytics, and team performance metrics.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
