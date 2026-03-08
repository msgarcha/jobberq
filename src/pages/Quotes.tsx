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

const mockQuotes = [
  { id: "Q-287", client: "Johnson Landscaping", total: 3200, status: "sent", date: "2024-01-15" },
  { id: "Q-286", client: "Smith Residence", total: 1850, status: "approved", date: "2024-01-14" },
  { id: "Q-285", client: "Acme Corp", total: 12400, status: "draft", date: "2024-01-13" },
  { id: "Q-284", client: "Green Valley HOA", total: 8900, status: "converted", date: "2024-01-10" },
  { id: "Q-283", client: "Metro Properties", total: 5600, status: "expired", date: "2024-01-05" },
];

const statusStyles: Record<string, string> = {
  draft: "bg-status-neutral text-status-neutral-foreground",
  sent: "bg-status-info text-status-info-foreground",
  approved: "bg-status-success text-status-success-foreground",
  converted: "bg-primary text-primary-foreground",
  expired: "bg-status-danger text-status-danger-foreground",
};

const Quotes = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockQuotes.length} quotes</p>
          </div>
          <Button className="gap-1.5" onClick={() => navigate("/quotes/new")}>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search quotes…" className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockQuotes.map((q) => (
                  <TableRow key={q.id} className="cursor-pointer">
                    <TableCell className="font-medium">{q.id}</TableCell>
                    <TableCell>{q.client}</TableCell>
                    <TableCell className="text-muted-foreground">{q.date}</TableCell>
                    <TableCell>
                      <Badge className={statusStyles[q.status]} variant="secondary">{q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${q.total.toLocaleString()}</TableCell>
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

export default Quotes;
