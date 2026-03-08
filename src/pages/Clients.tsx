import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockClients = [
  { id: "1", name: "Acme Corp", company: "Acme Corporation", email: "billing@acme.com", phone: "(555) 123-4567", status: "active", outstanding: 4200 },
  { id: "2", name: "Sarah Johnson", company: "Johnson Landscaping", email: "sarah@johnsonls.com", phone: "(555) 234-5678", status: "active", outstanding: 1800 },
  { id: "3", name: "Metro Properties", company: "Metro Properties LLC", email: "accounts@metroprops.com", phone: "(555) 345-6789", status: "active", outstanding: 8600 },
  { id: "4", name: "Smith Residence", company: "", email: "john.smith@gmail.com", phone: "(555) 456-7890", status: "lead", outstanding: 0 },
  { id: "5", name: "Green Valley HOA", company: "Green Valley Community", email: "board@greenvalley.org", phone: "(555) 567-8901", status: "active", outstanding: 3400 },
];

const statusStyles: Record<string, string> = {
  active: "bg-status-success text-status-success-foreground",
  lead: "bg-status-info text-status-info-foreground",
  archived: "bg-status-neutral text-status-neutral-foreground",
};

const Clients = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground text-sm mt-1">{mockClients.length} total clients</p>
          </div>
          <Button className="gap-1.5" onClick={() => navigate("/clients/new")}>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clients…" className="pl-9" />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-muted-foreground">{client.company}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {client.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[client.status]} variant="secondary">
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {client.outstanding > 0 ? `$${client.outstanding.toLocaleString()}` : "—"}
                    </TableCell>
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

export default Clients;
