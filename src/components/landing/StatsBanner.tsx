import { useInView } from "@/hooks/useInView";

const stats = [
  { value: "10,000+", label: "Service Pros" },
  { value: "2M+", label: "Jobs Completed" },
  { value: "12+ hrs", label: "Saved Weekly" },
  { value: "44%", label: "Revenue Growth" },
];

export default function StatsBanner() {
  const { ref, inView } = useInView();

  return (
    <section ref={ref} className="py-16 px-4 sm:px-6" style={{ background: "hsl(192 60% 22%)" }}>
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <p className="text-3xl sm:text-4xl lg:text-[3.25rem] font-bold font-display" style={{ color: "hsl(170 50% 55%)" }}>
              {s.value}
            </p>
            <p className="text-sm mt-1" style={{ color: "hsl(195 15% 70%)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
