import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "QuickLinq replaced 4 different tools for us. Quoting, invoicing, scheduling — it's all in one place. Our team saves 15 hours a week.",
    name: "Marcus Thompson",
    trade: "Thompson Landscaping",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
  },
  {
    quote: "My cash flow completely changed. I invoice on the spot and clients pay the same day. No more chasing payments for weeks.",
    name: "Sarah Kim",
    trade: "Kim's Plumbing Solutions",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
  },
  {
    quote: "I was skeptical, but the scheduling alone is worth it. No more double-bookings, no more missed appointments. Game changer.",
    name: "James Rodriguez",
    trade: "Bright Spark Electrical",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces",
  },
  {
    quote: "We went from losing leads to closing 80% of quotes. The professional look builds instant trust with homeowners.",
    name: "Amy Chen",
    trade: "Fresh Start Cleaning Co.",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
  },
];

export default function TestimonialsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
  }, [emblaApi, update]);

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
              Loved by service pros everywhere
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => emblaApi?.scrollPrev()} disabled={!canPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => emblaApi?.scrollNext()} disabled={!canNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="flex-[0_0_100%] sm:flex-[0_0_48%] lg:flex-[0_0_31.5%] min-w-0">
                <Card className="h-full shadow-warm hover:shadow-warm-md transition-shadow border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-warm-gold text-warm-gold" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={t.avatar} alt={t.name} />
                        <AvatarFallback className="text-xs">{t.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold font-display">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.trade}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
