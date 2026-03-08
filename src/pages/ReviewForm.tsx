import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const ReviewForm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    redirect_to_google: boolean;
    google_review_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // Fetch review request (public via anon RLS)
        const { data: rev, error: revErr } = await supabase
          .from("review_requests")
          .select("*, clients(first_name, last_name)")
          .eq("token", token)
          .maybeSingle();

        if (revErr || !rev) {
          setError("This review link is invalid or has already been used.");
          setLoading(false);
          return;
        }

        if (rev.status !== "pending") {
          setError("This review has already been submitted. Thank you!");
          setLoading(false);
          return;
        }

        if (new Date(rev.expires_at) < new Date()) {
          setError("This review link has expired.");
          setLoading(false);
          return;
        }

        setReview(rev);

        // Fetch company settings for branding
        const { data: settings } = await supabase
          .from("company_settings")
          .select("company_name, logo_url")
          .eq("team_id", rev.team_id)
          .maybeSingle();

        if (settings) {
          setCompanyName(settings.company_name || "");
          setLogoUrl(settings.logo_url || "");
        }
      } catch {
        setError("Something went wrong.");
      }
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/submit-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, rating, feedback }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md space-y-6">
          {logoUrl && (
            <img src={logoUrl} alt={companyName} className="h-14 mx-auto rounded-xl object-contain" />
          )}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-8 w-8 ${s <= rating ? "fill-[hsl(36,80%,50%)] text-[hsl(36,80%,50%)]" : "text-muted"}`}
              />
            ))}
          </div>
          {result.redirect_to_google && result.google_review_url ? (
            <>
              <h2 className="text-xl font-bold tracking-tight">Thank you! We're glad you had a great experience.</h2>
              <p className="text-muted-foreground text-sm">Would you mind sharing your experience on Google? It helps us a lot!</p>
              <Button
                size="lg"
                className="gap-2"
                onClick={() => window.open(result.google_review_url!, "_blank")}
              >
                <Star className="h-4 w-4" /> Leave a Google Review
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight">Thank you for your feedback!</h2>
              <p className="text-muted-foreground text-sm">We appreciate you taking the time to share your thoughts. We'll use your feedback to improve our service.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Review form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-14 mx-auto rounded-xl object-contain" />
          ) : companyName ? (
            <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto font-bold text-xl">
              {companyName[0]}
            </div>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight">
            How was your experience{companyName ? ` with ${companyName}` : ""}?
          </h1>
          <p className="text-muted-foreground text-sm">
            Your feedback helps us improve. Tap a star to rate.
          </p>
        </div>

        {/* Star picker */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              className="transition-transform hover:scale-110 focus:outline-none"
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(s)}
            >
              <Star
                className={`h-12 w-12 transition-colors ${
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
              placeholder="Tell us more about your experience (optional)"
              rows={4}
              className="rounded-xl"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
