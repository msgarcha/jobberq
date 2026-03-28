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

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
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
      <LandingFooter />
    </div>
  );
}
