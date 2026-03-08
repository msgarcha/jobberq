import { useState } from "react";
import { Check, ChevronsUpDown, User, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
  disabled?: boolean;
}

export function ClientSelector({ value, onChange, disabled }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const { data: clients } = useClients({ search: debouncedSearch });
  const createClient = useCreateClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const selected = clients?.find((c) => c.id === value);
  const displayName = selected
    ? `${selected.first_name} ${selected.last_name}${selected.company_name ? ` · ${selected.company_name}` : ""}`
    : null;

  const handleCreateClient = async () => {
    if (!newFirst.trim() || !newLast.trim()) return;
    const result = await createClient.mutateAsync({
      first_name: newFirst.trim(),
      last_name: newLast.trim(),
      email: newEmail.trim() || null,
      company_name: newCompany.trim() || null,
      status: "active",
    });
    onChange(result.id);
    setDialogOpen(false);
    setNewFirst("");
    setNewLast("");
    setNewEmail("");
    setNewCompany("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {displayName || <span className="text-muted-foreground">Select a client…</span>}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="p-2">
            <Input
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {(!clients || clients.length === 0) && (
              <p className="p-3 text-sm text-muted-foreground text-center">No clients found</p>
            )}
            {clients?.map((c) => (
              <button
                key={c.id}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                  value === c.id && "bg-accent"
                )}
                onClick={() => {
                  onChange(c.id === value ? null : c.id);
                  setOpen(false);
                }}
              >
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">
                  {c.first_name} {c.last_name}
                  {c.company_name && <span className="text-muted-foreground"> · {c.company_name}</span>}
                </span>
                {value === c.id && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t p-1">
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left text-primary font-medium rounded-sm"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Client
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Quick Add Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name *</Label>
                <Input value={newFirst} onChange={(e) => setNewFirst(e.target.value)} placeholder="John" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name *</Label>
                <Input value={newLast} onChange={(e) => setNewLast(e.target.value)} placeholder="Smith" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company</Label>
              <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company name" />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClient} disabled={createClient.isPending || !newFirst.trim() || !newLast.trim()}>
              {createClient.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create & Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
