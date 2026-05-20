import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import IndustryTicker from "@/components/landing/IndustryTicker";
import CinematicBanner from "@/components/landing/CinematicBanner";
import StorytellingTabs from "@/components/landing/StorytellingTabs";
import StatsBanner from "@/components/landing/StatsBanner";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import BuiltDifferent from "@/components/landing/BuiltDifferent";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ROICalculator from "@/components/landing/ROICalculator";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import Seo from "@/components/Seo";

export default function Landing() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="QuickLinq — Send Quotes. Win Jobs. Get Paid."
        description="The all-in-one platform for service businesses — manage clients, send quotes, schedule jobs, invoice, and collect payments."
        path="/landing"
      />
      <LandingNav />
      <main>
        <HeroSection />
        <CinematicBanner />
        <IndustryTicker />
        <StorytellingTabs />
        <StatsBanner />
        <ComparisonSection />
        <FeaturesGrid />
        <BuiltDifferent />
        <TestimonialsSection />
        <ROICalculator />
        <PricingSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
