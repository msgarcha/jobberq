import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockInvoices = [
  { id: "INV-1042", client: "Acme Corp", total: 4200, status: "paid", date: "2024-01-15", due: "2024-02-14" },
  { id: "INV-1041", client: "Metro Properties", total: 8600, status: "overdue", date: "2024-01-01", due: "2024-01-31" },
  { id: "INV-1040", client: "Johnson Landscaping", total: 1800, status: "sent", date: "2024-01-12", due: "2024-02-11" },
  { id: "INV-1039", client: "Green Valley HOA", total: 3400, status: "draft", date: "2024-01-14", due: "2024-02-13" },
  { id: "INV-1038", client: "Smith Residence", total: 1850, status: "viewed", date: "2024-01-10", due: "2024-02-09" },
];

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  viewed: "bg-status-warning text-status-warning-foreground",
  paid: "bg-status-success text-status-success-foreground",
  overdue: "bg-status-danger text-status-danger-foreground",
};

const Invoices = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockInvoices.length} invoices</p>
          </div>
          <Button className="gap-1.5" onClick={() => navigate("/invoices/new")}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search invoices…" className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer">
                    <TableCell className="font-medium">{inv.id}</TableCell>
                    <TableCell>{inv.client}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.due}</TableCell>
                    <TableCell>
                      <Badge className={statusStyles[inv.status]} variant="secondary">{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${inv.total.toLocaleString()}</TableCell>
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

export default Invoices;
