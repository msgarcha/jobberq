export default function CinematicBanner() {
  return (
    <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
      <div className="absolute inset-0 animate-ken-burns">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop"
          alt="Professional at work"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-2xl space-y-6">
            <p className="text-primary font-semibold text-sm tracking-widest uppercase">Real results. Real trades.</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Trusted by <span className="text-primary">10,000+</span> service businesses across 50+ trades
            </h2>
            <p className="text-white/70 text-lg max-w-lg">
              From solo operators to 50-person crews — QuickLinq grows with you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
