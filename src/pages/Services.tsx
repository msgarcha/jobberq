import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Service Catalog</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your reusable products and services.</p>
          </div>
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Default Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockServices.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.category}</TableCell>
                    <TableCell className="text-muted-foreground">{s.taxRate}%</TableCell>
                    <TableCell>
                      <Badge
                        className={s.active ? "bg-status-success text-status-success-foreground" : "bg-status-neutral text-status-neutral-foreground"}
                        variant="secondary"
                      >
                        {s.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${s.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Services;
