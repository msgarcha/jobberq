import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, LogOut } from "lucide-react";
import { isNative } from "@/lib/native/platform";
import { IapPurchasePanel } from "@/components/IapPurchasePanel";

export default function TrialExpired() {
  const { signOut, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const native = isNative();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className={native ? "max-w-lg w-full" : "max-w-md w-full"}>
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Your free trial has ended</h1>
            <p className="text-sm text-muted-foreground">
              Choose a plan to keep sending quotes, invoices, and collecting payments. Your data is safe and waiting.
            </p>
          </div>

          {native ? (
            <div className="pt-1">
              <IapPurchasePanel compact onPurchased={() => checkSubscription()} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => navigate("/settings?tab=billing")}>
                Choose a plan
              </Button>
            </div>
          )}

          <Button variant="ghost" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
