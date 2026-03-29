import { FileText, Calendar, Receipt, CreditCard } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: FileText,
    title: "Quote",
    desc: "Create and send branded quotes in minutes",
  },
  {
    num: "02",
    icon: Calendar,
    title: "Schedule",
    desc: "Assign crews and manage your calendar",
  },
  {
    num: "03",
    icon: Receipt,
    title: "Invoice",
    desc: "One-click invoicing from completed jobs",
  },
  {
    num: "04",
    icon: CreditCard,
    title: "Get Paid",
    desc: "Online payments and automated reminders",
  },
];

export default function CinematicBanner() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&h=900&fit=crop"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Dark teal overlay — same as FinalCTA */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(195 55% 10% / 0.88), hsl(195 55% 10% / 0.95))",
        }}
      />
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(170 50% 55%) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <p
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: "hsl(170 50% 55%)" }}
          >
            How QuickLinq Works
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight"
            style={{ color: "hsl(40 23% 96%)" }}
          >
            From quote to payment —{" "}
            <span style={{ color: "hsl(170 50% 55%)" }}>four simple steps</span>
          </h2>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: "hsl(195 15% 65%)" }}
          >
            QuickLinq streamlines your entire workflow so you can focus on the
            work that matters.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center space-y-3">
              {/* Number circle */}
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full border-2" style={{ borderColor: "hsl(170 50% 55% / 0.4)" }}>
                <span
                  className="text-xl font-bold font-display"
                  style={{ color: "hsl(170 50% 55%)" }}
                >
                  {s.num}
                </span>
              </div>
              {/* Icon */}
              <s.icon className="h-6 w-6 mx-auto" style={{ color: "hsl(170 50% 55% / 0.7)" }} />
              {/* Title */}
              <h3
                className="text-lg font-semibold font-display"
                style={{ color: "hsl(40 23% 96%)" }}
              >
                {s.title}
              </h3>
              {/* Description */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "hsl(195 15% 65%)" }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
