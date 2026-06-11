import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell } from "lucide-react";

export const reminderFrequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

export function reminderIntervalDays(frequency: string): number {
  switch (frequency) {
    case "biweekly": return 14;
    case "monthly": return 30;
    case "weekly":
    default: return 7;
  }
}

/**
 * Compute the next reminder timestamp (ISO) from a base date + frequency.
 * Returns null when reminders are disabled, no base date, or limit reached.
 */
export function computeNextReminderAt(opts: {
  enabled: boolean;
  baseDate: string | null | undefined; // sent_at (or last_reminder_at)
  frequency: string;
  remindersSent: number;
  limit: number;
}): string | null {
  const { enabled, baseDate, frequency, remindersSent, limit } = opts;
  if (!enabled || !baseDate) return null;
  if (remindersSent >= limit) return null;
  const base = new Date(baseDate);
  base.setDate(base.getDate() + reminderIntervalDays(frequency));
  return base.toISOString();
}

interface ReminderSettingsProps {
  type?: "invoice" | "quote";
  enabled: boolean;
  frequency: string;
  limit: number;
  onEnabledChange: (v: boolean) => void;
  onFrequencyChange: (v: string) => void;
  onLimitChange: (v: number) => void;
  /** Live status shown on detail pages */
  status?: {
    remindersSent: number;
    nextReminderAt: string | null;
    isSent: boolean;
  };
}

export function ReminderSettings({
  type = "invoice",
  enabled,
  frequency,
  limit,
  onEnabledChange,
  onFrequencyChange,
  onLimitChange,
  status,
}: ReminderSettingsProps) {
  const noun = type === "invoice" ? "payment" : "follow-up";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Automatic reminders
          </p>
          <p className="text-xs text-muted-foreground">
            Email the client recurring {noun} reminders until paid or the limit is reached.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <Label className="text-xs">Frequency</Label>
            <Select value={frequency} onValueChange={onFrequencyChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {reminderFrequencyOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Max reminders</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={limit}
              onChange={(e) => onLimitChange(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            />
          </div>
        </div>
      )}

      {enabled && status && (
        <p className="text-xs text-muted-foreground pt-1">
          {status.remindersSent} of {limit} reminders sent
          {!status.isSent
            ? " · starts after this is sent to the client"
            : status.nextReminderAt
            ? ` · next on ${new Date(status.nextReminderAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : status.remindersSent >= limit
            ? " · limit reached"
            : ""}
        </p>
      )}
    </div>
  );
}
