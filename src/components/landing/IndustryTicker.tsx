const industries = [
  "Landscaping", "Plumbing", "HVAC", "Electrical", "Roofing",
  "Cleaning", "Painting", "Handyman", "Tree Care", "Pest Control",
  "Pool Service", "Pressure Washing", "Fencing", "Flooring", "Carpentry",
  "Gutters", "Junk Removal", "Snow Removal",
];

export default function IndustryTicker() {
  return (
    <section id="industries" className="py-6 border-y border-border/50 bg-secondary/30 overflow-hidden">
      <div className="relative">
        <div className="flex animate-ticker-scroll ticker-pause whitespace-nowrap gap-3">
          {[...industries, ...industries].map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-background border border-border/60 text-muted-foreground shrink-0 hover:border-primary/40 hover:text-primary transition-colors"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
