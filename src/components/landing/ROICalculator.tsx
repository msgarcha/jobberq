import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Calculator, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function ROICalculator() {
  const [jobsPerWeek, setJobsPerWeek] = useState(15);
  const { ref, inView } = useInView();

  // Estimations based on industry averages
  const hoursPerWeek = Math.round(jobsPerWeek * 0.8); // ~48 min saved per job
  const revenueRecoveredMonthly = Math.round(jobsPerWeek * 4 * 32); // $32 avg recovered per job from faster invoicing
  const quotesClosedExtra = Math.round(jobsPerWeek * 0.3); // 30% more quotes closed

  const results = [
    {
      icon: Clock,
      value: `${hoursPerWeek} hrs`,
      label: "saved per week",
      sublabel: "on admin & paperwork",
    },
    {
      icon: DollarSign,
      value: `$${revenueRecoveredMonthly.toLocaleString()}`,
      label: "recovered monthly",
      sublabel: "from faster payments",
    },
    {
      icon: TrendingUp,
      value: `+${quotesClosedExtra}`,
      label: "extra jobs/week",
      sublabel: "from faster quotes",
    },
  ];

  return (
    <section ref={ref} className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">
            ROI Calculator
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-display">
            See what QuickLinq saves you
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base">
            Drag the slider to match your workload. Watch the numbers change.
          </p>
        </div>

        <div
          className={`rounded-2xl border border-border/60 overflow-hidden shadow-warm-lg bg-card transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Slider area */}
          <div className="p-8 sm:p-10 border-b border-border/40">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Jobs per week</p>
                <p className="text-xs text-muted-foreground">
                  How many jobs does your team complete weekly?
                </p>
              </div>
              <span className="ml-auto text-3xl font-bold font-display text-primary">
                {jobsPerWeek}
              </span>
            </div>
            <Slider
              value={[jobsPerWeek]}
              onValueChange={(v) => setJobsPerWeek(v[0])}
              min={5}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>5 jobs</span>
              <span>100 jobs</span>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
            {results.map((r) => (
              <div key={r.label} className="p-6 sm:p-8 text-center space-y-2">
                <r.icon className="h-6 w-6 text-primary mx-auto" />
                <p className="text-3xl sm:text-4xl font-bold font-display">
                  {r.value}
                </p>
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
