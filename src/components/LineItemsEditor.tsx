import { useState } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useServices, useCreateService } from "@/hooks/useServices";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export interface LineItem {
  id?: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_percent: number;
  line_total: number;
}

function calcLineTotal(item: LineItem): number {
  const base = item.quantity * item.unit_price;
  const discounted = base * (1 - item.discount_percent / 100);
  const taxed = discounted * (1 + item.tax_rate / 100);
  return Math.round(taxed * 100) / 100;
}

export function computeTotals(items: LineItem[]) {
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;

  items.forEach((item) => {
    const base = item.quantity * item.unit_price;
    const disc = base * (item.discount_percent / 100);
    const afterDisc = base - disc;
    const tax = afterDisc * (item.tax_rate / 100);
    subtotal += afterDisc;
    taxAmount += tax;
    discountAmount += disc;
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
  defaultTaxRate?: number;
}

export function LineItemsEditor({ items, onChange, disabled, defaultTaxRate = 0 }: Props) {
  const { data: services } = useServices({ status: "active" });
  const createService = useCreateService();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [newServiceRow, setNewServiceRow] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newTax, setNewTax] = useState("");

  const openNewServiceDialog = (rowIndex: number) => {
    setNewServiceRow(rowIndex);
    setNewName("");
    setNewPrice("");
    setNewTax("");
    setNewServiceOpen(true);
  };

  const handleCreateService = async () => {
    if (!newName.trim()) return;
    const result = await createService.mutateAsync({
      name: newName.trim(),
      default_price: parseFloat(newPrice) || 0,
      tax_rate: parseFloat(newTax) || 0,
      is_active: true,
    });
    if (result && newServiceRow != null) {
      const svc = result as any;
      update(newServiceRow, {
        service_id: svc.id,
        description: svc.name + (svc.description ? ` – ${svc.description}` : ""),
        unit_price: Number(svc.default_price),
        tax_rate: svc.tax_rate != null ? Number(svc.tax_rate) : 0,
      });
    }
    setNewServiceOpen(false);
  };

  const emptyItem: LineItem = {
    service_id: null,
    description: "",
    quantity: 1,
    unit_price: 0,
    tax_rate: defaultTaxRate,
    discount_percent: 0,
    line_total: 0,
  };

  const update = (index: number, partial: Partial<LineItem>) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const merged = { ...item, ...partial };
      merged.line_total = calcLineTotal(merged);
      return merged;
    });
    onChange(updated);
  };

  const addRow = () => {
    onChange([...items, { ...emptyItem }]);
  };

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, value: string) => {
    if (value === "__new__") {
      openNewServiceDialog(index);
      return;
    }
    const service = services?.find((s) => s.id === value);
    if (service) {
      update(index, {
        service_id: value,
        description: service.name + (service.description ? ` – ${service.description}` : ""),
        unit_price: Number(service.default_price),
        tax_rate: service.tax_rate != null ? Number(service.tax_rate) : 0,
      });
    }
  };

  const totals = computeTotals(items);

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No line items yet. Tap "Add Line" to get started.
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Select
                  value={item.service_id || ""}
                  onValueChange={(v) => handleServiceChange(i, v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-11 text-sm">
                    <SelectValue placeholder="Select service…" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-primary font-medium">
                      <span className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add New Service</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 ml-2 text-destructive"
                onClick={() => removeRow(i)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={item.description}
              onChange={(e) => update(i, { description: e.target.value })}
              disabled={disabled}
              placeholder="Description"
              className="h-11"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Qty</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-11 text-center"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => update(i, { unit_price: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-11 text-center"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Total</Label>
                <div className="h-11 flex items-center justify-center rounded-md bg-muted text-sm font-medium">
                  {fmt(item.line_total)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Tax %</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.tax_rate}
                  onChange={(e) => update(i, { tax_rate: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-11 text-center"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Disc %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={item.discount_percent}
                  onChange={(e) => update(i, { discount_percent: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="h-11 text-center"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={addRow} disabled={disabled} className="flex-1 h-12 gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Add Line Item
          </Button>
          <Button variant="ghost" onClick={() => navigate("/services")} className="h-12 gap-2 rounded-xl text-muted-foreground">
            <Settings2 className="h-4 w-4" /> Manage Services
          </Button>
        </div>

        <div className="text-sm space-y-1.5 pt-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
          {totals.discount_amount > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-{fmt(totals.discount_amount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(totals.tax_amount)}</span></div>
          <div className="flex justify-between font-semibold border-t pt-2 text-base"><span>Total</span><span>{fmt(totals.total)}</span></div>
        </div>
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Service</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px] text-right">Qty</TableHead>
              <TableHead className="w-[100px] text-right">Price</TableHead>
              <TableHead className="w-[80px] text-right">Tax %</TableHead>
              <TableHead className="w-[80px] text-right">Disc %</TableHead>
              <TableHead className="w-[100px] text-right">Total</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No line items yet. Click "Add Line" to get started.
                </TableCell>
              </TableRow>
            )}
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="p-1.5">
                  <Select value={item.service_id || ""} onValueChange={(v) => handleServiceChange(i, v)} disabled={disabled}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {services?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                      <SelectItem value="__new__" className="text-primary font-medium">
                        <span className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add New Service</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1.5">
                  <Input value={item.description} onChange={(e) => update(i, { description: e.target.value })} disabled={disabled} className="h-8 text-xs" />
                </TableCell>
                <TableCell className="p-1.5">
                  <Input type="number" min={0} step="0.01" value={item.quantity} onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })} disabled={disabled} className="h-8 text-xs text-right" />
                </TableCell>
                <TableCell className="p-1.5">
                  <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={(e) => update(i, { unit_price: parseFloat(e.target.value) || 0 })} disabled={disabled} className="h-8 text-xs text-right" />
                </TableCell>
                <TableCell className="p-1.5">
                  <Input type="number" min={0} step="0.01" value={item.tax_rate} onChange={(e) => update(i, { tax_rate: parseFloat(e.target.value) || 0 })} disabled={disabled} className="h-8 text-xs text-right" />
                </TableCell>
                <TableCell className="p-1.5">
                  <Input type="number" min={0} max={100} step="0.01" value={item.discount_percent} onChange={(e) => update(i, { discount_percent: parseFloat(e.target.value) || 0 })} disabled={disabled} className="h-8 text-xs text-right" />
                </TableCell>
                <TableCell className="p-1.5 text-right text-xs font-medium tabular-nums">{fmt(item.line_total)}</TableCell>
                <TableCell className="p-1.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(i)} disabled={disabled}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow} disabled={disabled} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Line
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/services")} className="gap-1.5 text-muted-foreground">
            <Settings2 className="h-3.5 w-3.5" /> Manage Services
          </Button>
        </div>
        <div className="text-sm space-y-1 text-right min-w-[200px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
          {totals.discount_amount > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-destructive">-{fmt(totals.discount_amount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{fmt(totals.tax_amount)}</span></div>
          <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{fmt(totals.total)}</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}
      <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Lawn Mowing" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Default Price</Label>
                <Input type="number" min={0} step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate %</Label>
                <Input type="number" min={0} step="0.01" value={newTax} onChange={(e) => setNewTax(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewServiceOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateService} disabled={!newName.trim() || createService.isPending}>
              {createService.isPending ? "Creating…" : "Create & Select"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
