import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, ChevronRight } from "lucide-react";

const mockServices = [
  { id: "1", name: "Lawn Mowing", category: "Landscaping", price: 75, taxRate: 13, active: true },
  { id: "2", name: "Window Cleaning", category: "Cleaning", price: 120, taxRate: 13, active: true },
  { id: "3", name: "HVAC Inspection", category: "HVAC", price: 250, taxRate: 13, active: true },
  { id: "4", name: "Snow Removal", category: "Landscaping", price: 150, taxRate: 13, active: false },
  { id: "5", name: "Carpet Cleaning", category: "Cleaning", price: 200, taxRate: 13, active: true },
];

const Services = () => {
  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Service Catalog</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your reusable products and services.</p>
          </div>
          <Button className="gap-1.5 rounded-lg shadow-warm">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        <div className="space-y-2">
          {mockServices.map((s) => (
            <Card key={s.id} className="shadow-warm hover:shadow-warm-md transition-all cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{s.name}</p>
                    <Badge
                      className={s.active ? "bg-status-success text-status-success-foreground" : "bg-status-neutral text-status-neutral-foreground"}
                      variant="secondary"
                    >
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.category} · Tax {s.taxRate}%</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <span className="text-sm font-medium">${s.price}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Services;
