import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Star, ExternalLink, CheckCircle2, ShieldCheck, Copy, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const ReviewForm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    redirect_to_google: boolean;
    google_review_url: string | null;
  } | null>(null);
  const [googleClicked, setGoogleClicked] = useState(false);
  const [confirmedPosted, setConfirmedPosted] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/get-review-request`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );
        const data = await res.json();

        // Even on error responses we may receive branding to keep the page on-brand
        if (data.companyName) setCompanyName(data.companyName);
        if (data.logoUrl) setLogoUrl(data.logoUrl);

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setClientFirstName(data.clientFirstName || "");
      } catch {
        setError("Something went wrong. Please try again later.");
      }
      setLoading(false);
    })();
  }, [token]);

  const callSubmit = async (extra: Record<string, any> = {}) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return fetch(`https://${projectId}.supabase.co/functions/v1/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...extra }),
    });
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const res = await callSubmit({ rating, feedback });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    }
    setSubmitting(false);
  };

  const handleGoogleClick = () => {
    if (!result?.google_review_url) return;
    window.open(result.google_review_url, "_blank");
    setGoogleClicked(true);
  };

  const handleConfirmPosted = async () => {
    try {
      await callSubmit({ action: "confirm_google_post" });
    } catch {}
    setConfirmedPosted(true);
  };

  // ---- Shells ----
  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-[hsl(var(--accent))] via-background to-background">
      <div className="w-full max-w-md">
        <Card className="shadow-warm border-border/60 rounded-3xl overflow-hidden">
          <CardContent className="p-7 sm:p-9">{children}</CardContent>
        </Card>
        <p className="text-[11px] text-center text-muted-foreground mt-5">
          Powered by <span className="font-semibold text-foreground/80">QuickLinq</span> · Your review is private until you choose to share it
        </p>
      </div>
    </div>
  );

  const Brand = () => (
    <div className="flex flex-col items-center gap-3">
      {logoUrl ? (
        <img src={logoUrl} alt={companyName} className="h-16 w-16 rounded-2xl object-contain bg-secondary p-2" />
      ) : companyName ? (
        <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-2xl shadow-warm">
          {companyName[0]}
        </div>
      ) : null}
    </div>
  );

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-5 py-4 animate-pulse">
          <div className="h-16 w-16 rounded-2xl bg-secondary" />
          <div className="h-5 w-3/4 rounded bg-secondary" />
          <div className="h-3 w-1/2 rounded bg-secondary" />
          <div className="flex gap-2 mt-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-10 rounded-full bg-secondary" />)}
          </div>
        </div>
      </PageShell>
    );
  }

  // ---- Error / invalid ----
  if (error && !result) {
    return (
      <PageShell>
        <div className="text-center space-y-4 py-2">
          <Brand />
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Star className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-display font-semibold tracking-tight">{error}</h2>
          <p className="text-sm text-muted-foreground">
            {companyName
              ? `Please ask ${companyName} to send you a fresh review link.`
              : "Please ask the business to send you a fresh review link."}
          </p>
        </div>
      </PageShell>
    );
  }

  // ---- After submission ----
  if (result) {
    if (confirmedPosted) {
      return (
        <PageShell>
          <div className="text-center space-y-5 py-2">
            <div className="h-16 w-16 rounded-full bg-status-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-9 w-9 text-status-success" />
            </div>
            <h2 className="text-xl font-display font-bold tracking-tight">You're a legend! 🙌</h2>
            <p className="text-muted-foreground text-sm">
              Thank you for taking the time to share your experience on Google. It really helps {companyName || "us"}.
            </p>
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell>
        <div className="text-center space-y-5">
          <Brand />
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-7 w-7 ${s <= rating ? "fill-[hsl(36,80%,50%)] text-[hsl(36,80%,50%)]" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          {result.redirect_to_google && result.google_review_url ? (
            !googleClicked ? (
              <>
                <h2 className="text-xl font-display font-bold tracking-tight">
                  Thank you{clientFirstName ? `, ${clientFirstName}` : ""}!
                </h2>
                <p className="text-muted-foreground text-sm">
                  We're so glad you had a great experience. Would you mind sharing it on Google? It only takes a moment and means a lot.
                </p>
                <Button size="lg" className="w-full gap-2 rounded-xl" onClick={handleGoogleClick}>
                  <ExternalLink className="h-4 w-4" /> Leave a Google Review
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-bold tracking-tight">Did you post your review?</h2>
                <p className="text-muted-foreground text-sm">Let us know once you're done — or come back to it any time.</p>
                <div className="flex flex-col gap-2">
                  <Button size="lg" className="gap-2 rounded-xl" onClick={handleConfirmPosted}>
                    <CheckCircle2 className="h-4 w-4" /> Yes, I posted it
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-xl" onClick={handleGoogleClick}>
                    Open Google again
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmedPosted(true)}>
                    Not right now
                  </Button>
                </div>
              </>
            )
          ) : (
            <>
              <h2 className="text-xl font-display font-bold tracking-tight">Thank you for your feedback!</h2>
              <p className="text-muted-foreground text-sm">
                We really appreciate you taking the time. {companyName || "The team"} will review your comments and use them to improve.
              </p>
            </>
          )}
        </div>
      </PageShell>
    );
  }

  // ---- Main rating form ----
  return (
    <PageShell>
      <div className="space-y-7">
        <div className="text-center space-y-3">
          <Brand />
          <h1 className="text-2xl font-display font-bold tracking-tight leading-tight">
            {clientFirstName ? `Hi ${clientFirstName}, how was your experience` : "How was your experience"}
            {companyName ? <> with <span className="text-primary">{companyName}</span>?</> : "?"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Your honest feedback helps us improve. Tap a star to rate.
          </p>
        </div>

        <div className="flex justify-center gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              className="p-1 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(s)}
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-11 w-11 sm:h-12 sm:w-12 transition-colors ${
                  s <= (hoveredStar || rating)
                    ? "fill-[hsl(36,80%,50%)] text-[hsl(36,80%,50%)]"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                rating >= 4
                  ? "What did we do well? (optional)"
                  : "Sorry to hear that. What could we have done better? (optional)"
              }
              rows={4}
              className="rounded-xl resize-none"
              maxLength={1000}
            />
            <Button
              className="w-full rounded-xl"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Your feedback is reviewed privately first
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ReviewForm;
