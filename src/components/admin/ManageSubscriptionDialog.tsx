import { useState } from "react";
import { format, addDays } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import type { Subscriber } from "./SubscriberTable";

interface Props {
  open: boolean;
  onClose: () => void;
  action: string;
  subscriber: Subscriber | null;
  onConfirm: (action: string, subscriber: Subscriber, params: any) => void;
  loading: boolean;
}

export function ManageSubscriptionDialog({ open, onClose, action, subscriber, onConfirm, loading }: Props) {
  const [trialEndDate, setTrialEndDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [newPriceId, setNewPriceId] = useState("");
  const [cancelImmediate, setCancelImmediate] = useState(false);

  if (!subscriber) return null;

  const handleConfirm = () => {
    switch (action) {
      case "extend_trial":
        onConfirm(
          subscriber.subscription_id ? "extend_trial" : "extend_app_trial",
          subscriber,
          { trial_end_date: trialEndDate }
        );
        break;
      case "change_tier":
        onConfirm("change_tier", subscriber, { new_price_id: newPriceId });
        break;
      case "cancel":
        onConfirm("cancel", subscriber, { immediate: cancelImmediate });
        break;
      case "grant_free":
        onConfirm("grant_free", subscriber, {});
        break;
      case "resume":
        onConfirm("resume", subscriber, {});
        break;
    }
  };

  const titles: Record<string, string> = {
    extend_trial: "Extend Trial",
    change_tier: "Change Subscription Tier",
    cancel: "Cancel Subscription",
    grant_free: "Grant Free Access",
    resume: "Resume Subscription",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[action] || action}</DialogTitle>
          <DialogDescription>
            Managing: <span className="font-medium">{subscriber.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {action === "extend_trial" && (
            <div className="space-y-2">
              <Label>New Trial End Date</Label>
              <Input
                type="date"
                value={trialEndDate}
                onChange={(e) => setTrialEndDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          )}

          {action === "change_tier" && (
            <div className="space-y-2">
              <Label>New Tier</Label>
              <Select value={newPriceId} onValueChange={setNewPriceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
                    <SelectItem key={key} value={tier.priceId}>
                      {tier.name} — {tier.price}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "cancel" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose how to cancel this subscription:
              </p>
              <div className="flex gap-3">
                <Button
                  variant={!cancelImmediate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCancelImmediate(false)}
                >
                  At period end
                </Button>
                <Button
                  variant={cancelImmediate ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setCancelImmediate(true)}
                >
                  Immediately
                </Button>
              </div>
            </div>
          )}

          {action === "grant_free" && (
            <p className="text-sm text-muted-foreground">
              This will set a 10-year trial on the subscription, effectively granting free access.
            </p>
          )}

          {action === "resume" && (
            <p className="text-sm text-muted-foreground">
              This will un-cancel the subscription so it continues past the current billing period.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (action === "change_tier" && !newPriceId)}
            variant={action === "cancel" && cancelImmediate ? "destructive" : "default"}
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
