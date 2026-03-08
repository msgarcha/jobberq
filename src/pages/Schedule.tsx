import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const Schedule = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your team's schedule and job assignments.</p>
        </div>

        <Card className="min-h-[500px] flex items-center justify-center">
          <CardContent className="text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <CardTitle className="text-lg font-display mb-2">Calendar Coming Soon</CardTitle>
            <p className="text-sm text-muted-foreground max-w-md">
              Drag-and-drop scheduling with day, week, and month views will be available in Phase 3.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
