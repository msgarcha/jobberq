/**
 * Connect Checkout Success Page
 * ==============================
 * Displayed after a successful Stripe Checkout payment from the storefront.
 */

import { useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ConnectSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your payment has been processed successfully. Thank you for your purchase!
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground font-mono">
                Session: {sessionId}
              </p>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/connect">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Storefront
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
