import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReminderSettings, computeNextReminderAt } from "@/components/ReminderSettings";

interface DocumentReminderCardProps {
  type: "invoice" | "quote";
  document: any;
  onSaved?: () => void;
}

export function DocumentReminderCard({ type, document, onSaved }: DocumentReminderCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [limit, setLimit] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setEnabled(document.reminders_enabled || false);
      setFrequency(document.reminder_frequency || "weekly");
      setLimit(document.reminder_limit ?? 3);
    }
  }, [document]);

  const isSent = !!document?.sent_at;
  const remindersSent = document?.reminders_sent ?? 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextReminderAt = computeNextReminderAt({
        enabled,
        baseDate: document?.last_reminder_at || document?.sent_at,
        frequency,
        remindersSent,
        limit,
      });
      const table = type === "invoice" ? "invoices" : "quotes";
      const { error } = await supabase
        .from(table)
        .update({
          reminders_enabled: enabled,
          reminder_frequency: frequency,
          reminder_limit: limit,
          next_reminder_at: nextReminderAt,
        } as any)
        .eq("id", document.id);
      if (error) throw error;
      toast.success("Reminder settings saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save reminders");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-warm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" /> Automatic reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReminderSettings
          type={type}
          enabled={enabled}
          frequency={frequency}
          limit={limit}
          onEnabledChange={setEnabled}
          onFrequencyChange={setFrequency}
          onLimitChange={setLimit}
          status={{ remindersSent, nextReminderAt: document?.next_reminder_at ?? null, isSent }}
        />
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save reminders"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
