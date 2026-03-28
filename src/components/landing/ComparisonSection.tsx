import { CheckCircle2, X } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const rows = [
  { feature: "Unlimited quotes & invoices", others: false, ql: true },
  { feature: "Online payments built-in", others: "Add-on", ql: true },
  { feature: "No per-user fees", others: false, ql: true },
  { feature: "Review collection & gating", others: false, ql: true },
  { feature: "Recurring invoices", others: "Pro plan+", ql: true },
  { feature: "Job scheduling & dispatch", others: true, ql: true },
  { feature: "Branded client portal", others: "Enterprise", ql: true },
  { feature: "Starting price", others: "$49/mo", ql: "$29/mo" },
];

export default function ComparisonSection() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">
            The honest comparison
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display">
            Why service pros are switching
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base">
            We built QuickLinq because existing tools charge too much for basics and lock features behind expensive tiers.
          </p>
        </div>

        <div
          className={`rounded-2xl border border-border/60 overflow-hidden shadow-warm-lg transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_160px_160px] items-center px-5 sm:px-8 py-4 bg-muted/60 border-b border-border/40">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Feature
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              Other platforms
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary text-center">
              QuickLinq
            </span>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_160px_160px] items-center px-5 sm:px-8 py-4 ${
                i < rows.length - 1 ? "border-b border-border/30" : ""
              } ${i % 2 === 0 ? "bg-card" : "bg-card/60"}`}
            >
              <span className="text-sm font-medium">{row.feature}</span>

              <div className="flex justify-center">
                {row.others === true ? (
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
                ) : row.others === false ? (
                  <X className="h-5 w-5 text-muted-foreground/30" />
                ) : (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {row.others}
                  </span>
                )}
              </div>

              <div className="flex justify-center">
                {row.ql === true ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <span className="text-sm font-bold text-primary">{row.ql}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
