import { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
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

  const selected = clients?.find((c) => c.id === value);
  const displayName = selected
    ? `${selected.first_name} ${selected.last_name}${selected.company_name ? ` · ${selected.company_name}` : ""}`
    : null;

  return (
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
      </PopoverContent>
    </Popover>
  );
}
